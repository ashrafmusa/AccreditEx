import sys
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


class FakeSnapshot:
    def __init__(self, data=None):
        self.data_value = data
        self.exists = data is not None

    def to_dict(self):
        return self.data_value


class FakeTransaction:
    def __init__(self):
        self.updates = []
        self.creates = []

    def update(self, reference, data):
        self.updates.append((reference, data))

    def create(self, reference, data):
        self.creates.append((reference, data))


class FakeReference:
    def __init__(self, collection_name, document_id, database):
        self.collection_name = collection_name
        self.document_id = document_id
        self.database = database

    def get(self, transaction=None):
        return FakeSnapshot(self.database.records.get((self.collection_name, self.document_id)))


class FakeCollection:
    def __init__(self, collection_name, database):
        self.collection_name = collection_name
        self.database = database

    def document(self, document_id):
        return FakeReference(self.collection_name, document_id, self.database)


class FakeDatabase:
    def __init__(self, organization):
        self.records = {("organizations", "org-1"): organization}
        self.transaction_value = FakeTransaction()

    def collection(self, collection_name):
        return FakeCollection(collection_name, self)

    def transaction(self):
        return self.transaction_value


@pytest.mark.parametrize(
    ("event_type", "event_object", "expected_fields"),
    [
        (
            "customer.subscription.updated",
            {
                "id": "sub-1",
                "customer": "cus-1",
                "metadata": {"organizationId": "org-1"},
                "status": "active",
                "cancel_at_period_end": True,
                "current_period_end": 1_800_000_000,
                "items": {"data": [{"price": {"id": "price-clinic"}}]},
            },
            {
                "plan": "starter",
                "subscriptionStatus": "active",
                "cancelAtPeriodEnd": True,
                "stripeSubscriptionId": "sub-1",
            },
        ),
        (
            "invoice.payment_failed",
            {
                "customer": "cus-1",
                "subscription": "sub-1",
            },
            {
                "subscriptionStatus": "past_due",
                "stripeSubscriptionId": "sub-1",
            },
        ),
    ],
)
def test_subscription_events_update_owned_organization(
    monkeypatch, event_type, event_object, expected_fields
):
    import firebase_admin.firestore as firestore
    import main

    database = FakeDatabase({"stripeCustomerId": "cus-1"})
    subscription = {
        "id": "sub-1",
        "customer": "cus-1",
        "metadata": {"organizationId": "org-1"},
        "current_period_end": 1_800_000_000,
        "items": {"data": [{"price": {"id": "price-clinic"}}]},
    }
    event = {
        "id": "evt-1",
        "type": event_type,
        "data": {"object": event_object},
    }

    class FakeWebhook:
        @staticmethod
        def construct_event(payload, signature, secret):
            return event

    fake_stripe = SimpleNamespace(
        api_key=None,
        Webhook=FakeWebhook,
        Subscription=SimpleNamespace(retrieve=lambda subscription_id: subscription),
        errors=SimpleNamespace(SignatureVerificationError=type("SignatureVerificationError", (Exception,), {})),
    )
    monkeypatch.setitem(sys.modules, "stripe", fake_stripe)
    monkeypatch.setattr(firestore, "client", lambda: database)
    monkeypatch.setattr(firestore, "transactional", lambda function: function)
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "test-secret")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "test-key")
    monkeypatch.setenv("STRIPE_PRICE_CLINIC", "price-clinic")
    monkeypatch.delenv("STRIPE_PRICE_HOSPITAL", raising=False)
    monkeypatch.delenv("STRIPE_PRICE_NETWORK", raising=False)

    response = TestClient(main.app).post(
        "/stripe/webhook",
        content=b"{}",
        headers={"stripe-signature": "test-signature"},
    )

    assert response.status_code == 200
    organization_update = database.transaction_value.updates[0][1]
    assert all(organization_update[field] == value for field, value in expected_fields.items())
    assert database.transaction_value.creates[0][1]["eventType"] == event_type


def test_subscription_event_rejects_customer_mismatch(monkeypatch):
    import firebase_admin.firestore as firestore
    import main

    database = FakeDatabase({"stripeCustomerId": "cus-another"})
    subscription = {
        "id": "sub-1",
        "customer": "cus-1",
        "metadata": {"organizationId": "org-1"},
        "current_period_end": 1_800_000_000,
        "items": {"data": [{"price": {"id": "price-clinic"}}]},
    }
    event = {
        "id": "evt-mismatch",
        "type": "invoice.payment_failed",
        "data": {"object": {"customer": "cus-1", "subscription": "sub-1"}},
    }

    class FakeWebhook:
        @staticmethod
        def construct_event(payload, signature, secret):
            return event

    fake_stripe = SimpleNamespace(
        api_key=None,
        Webhook=FakeWebhook,
        Subscription=SimpleNamespace(retrieve=lambda subscription_id: subscription),
        errors=SimpleNamespace(SignatureVerificationError=type("SignatureVerificationError", (Exception,), {})),
    )
    monkeypatch.setitem(sys.modules, "stripe", fake_stripe)
    monkeypatch.setattr(firestore, "client", lambda: database)
    monkeypatch.setattr(firestore, "transactional", lambda function: function)
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "test-secret")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "test-key")

    response = TestClient(main.app).post(
        "/stripe/webhook",
        content=b"{}",
        headers={"stripe-signature": "test-signature"},
    )

    assert response.status_code == 400
    assert database.transaction_value.updates == []
    assert database.transaction_value.creates == []
