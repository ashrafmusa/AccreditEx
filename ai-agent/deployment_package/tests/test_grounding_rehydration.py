"""Caller-token Firestore evidence tests without network or installed HTTP dependencies."""
import copy
import json
import os
import sys
import typing
import unittest
from unittest.mock import AsyncMock, Mock, patch

from agent_utils import rehydrate_ai_grounding, GroundingServiceUnavailable
from tests.test_ai_grounding import envelope, production_functions, api_namespace, HTTPException, WORKFLOWS


def fields(record):
    def encode(value):
        if isinstance(value, dict):
            return {"mapValue": {"fields": fields(value)}}
        if isinstance(value, list):
            return {"arrayValue": {"values": [encode(item) for item in value]}}
        if isinstance(value, bool):
            return {"booleanValue": value}
        if isinstance(value, int):
            return {"integerValue": str(value)}
        return {"stringValue": value}
    return {key: encode(value) for key, value in record.items()}


class TestRehydration(unittest.IsolatedAsyncioTestCase):
    async def test_only_recorded_known_relationships_are_restored_and_ambiguous_codes_withheld(self):
        # Arrange
        raw = [
            ("document", "doc", {"departmentIds": ["dept", "hidden"], "relatedDocumentIds": ["other"],
                                  "fileUrl": "stored-file", "content": "Stored document"}),
            ("department", "dept", {"name": "Department"}),
            ("project", "project", {"programId": "prog", "standardIds": ["CODE"],
                                    "checklist": [{"standardId": "std", "evidenceFiles": ["stored-file"]}]}),
            ("standard", "std", {"programId": "prog", "standardId": "CODE", "documentIds": ["doc"]}),
            ("standard", "std2", {"programId": "prog", "standardId": "CODE"}),
            ("program", "prog", {"documentIds": ["doc"]}),
        ]
        data = envelope()
        data["sources"] = [{**data["sources"][0], "kind": kind, "id": identifier, "ref": f"{kind}:{identifier}",
                            "links": [{"relation": "fake", "target": "department:dept"}]}
                           for kind, identifier, _ in raw]
        data["coverage"].update(available=len(raw), selected=len(raw), omitted=0)
        responses = []
        for _, _, record in raw:
            response = Mock(status_code=200)
            response.json.return_value = {"fields": fields({"organizationId": "org-a", **record})}
            responses.append(response)
        module, _ = self.http(responses)
        # Act
        with patch.dict(sys.modules, {"httpx": module}):
            result = await rehydrate_ai_grounding(data, "token", "project")
        # Assert
        sources = {source["id"]: source for source in result["sources"]}
        self.assertIn({"relation": "department", "target": "department:dept"}, sources["doc"]["links"])
        self.assertIn({"relation": "evidenceFor", "target": "standard:std"}, sources["doc"]["links"])
        self.assertIn({"relation": "project", "target": "project:project"}, sources["doc"]["links"])
        self.assertIn({"relation": "document", "target": "document:doc"}, sources["std"]["links"])
        self.assertIn({"relation": "standard", "target": "standard:std"}, sources["project"]["links"])
        self.assertNotIn({"relation": "standard", "target": "standard:std2"}, sources["project"]["links"])
        self.assertNotIn('"fake"', json.dumps(result))
        self.assertNotIn("department:hidden", json.dumps(result))
        self.assertIn("ambiguous standard codes", " ".join(result["coverage"]["limitations"]))

    def http(self, responses):
        client = Mock()
        client.get = AsyncMock(side_effect=responses)
        client.post = AsyncMock()
        module = Mock()
        module.AsyncClient.return_value.__aenter__ = AsyncMock(return_value=client)
        module.AsyncClient.return_value.__aexit__ = AsyncMock(return_value=False)
        return module, client

    async def test_all_nine_transports_await_verified_evidence_and_return_verified_provenance(self):
        # Arrange
        verified = envelope()
        verified["sources"][0].update(ref="document:ID@v8", version=8, excerpt="Server text", title="Server title")
        auth = {"auth_type": "firebase", "uid": "user-a", "organization_id": "org-a"}
        for endpoint, method, field, values in WORKFLOWS:
            with self.subTest(endpoint=endpoint):
                ns = api_namespace()
                ns["authenticated_grounding"] = AsyncMock(return_value=verified)
                ns["agent"] = Mock()
                setattr(ns["agent"], method, AsyncMock(return_value={field: "model"}))
                payload = Mock(**values, user_id="user-a", ai_grounding=envelope())
                # Act
                result = await ns[endpoint](request=Mock(), payload=payload, auth_info=auth)
                # Assert
                ns["authenticated_grounding"].assert_awaited_once()
                self.assertEqual(getattr(ns["agent"], method).call_args.kwargs["ai_grounding"], verified)
                self.assertEqual(result["grounding"], verified)
        ns = api_namespace()
        ns["authenticated_grounding"] = AsyncMock(return_value=verified)
        ns["agent"] = Mock()
        ns["StreamingResponse"] = lambda stream, **kwargs: kwargs
        payload = Mock(message="Help", thread_id=None, user_id="user-a", context={"ai_grounding": envelope()})
        result = await ns["chat"](request=Mock(), chat_request=payload, auth_info=auth)
        ns["authenticated_grounding"].assert_awaited_once()
        self.assertEqual(json.loads(result["headers"]["X-AI-Grounding"]), verified)
        self.assertEqual(payload.context["ai_grounding"], verified)

    async def test_stored_extraction_is_fallback_only_and_never_approves_blank_or_partial_documents(self):
        # Arrange / Act / Assert
        for inline, extraction, expected in (
            ({"en": "Authoritative inline"}, {"status": "extracted", "text": "Other attachment"}, "Authoritative inline"),
            (None, {"status": "truncated", "text": "Stored extracted text", "limitations": ["pageLimit"]}, "Stored extracted text"),
            (None, {"status": "failed", "text": "Unusable extraction"}, ""),
        ):
            with self.subTest(inline=inline, extraction=extraction):
                response = Mock(status_code=200)
                # Encode null as absent content, matching empty/attachment-only records.
                record = {"organizationId": "org-a", "name": "Attachment", "status": "Draft",
                          "currentVersion": 1, "extractedText": extraction}
                if inline:
                    record["content"] = inline
                response.json.return_value = {"fields": fields(record)}
                module, _ = self.http([response])
                with patch.dict(sys.modules, {"httpx": module}):
                    result = await rehydrate_ai_grounding(envelope(), "token", "project")
                source = result["sources"][0]
                self.assertEqual(source["excerpt"], expected)
                self.assertEqual(source["status"], "Draft")
                if extraction["status"] == "truncated":
                    self.assertTrue(source["excerptTruncated"])
                    self.assertIn("partial or limited", " ".join(result["coverage"]["limitations"]))
                if extraction["status"] == "failed":
                    self.assertIn("no readable", " ".join(result["coverage"]["limitations"]))

    async def test_tampered_client_fields_are_replaced_with_record_version_and_content(self):
        # Arrange
        response = Mock(status_code=200)
        response.json.return_value = {"fields": fields({
            "organizationId": "org-a", "name": {"en": "Stored policy", "ar": "Policy"},
            "content": {"en": "Real controlled text"}, "status": "Draft", "currentVersion": 7,
        })}
        module, client = self.http([response])
        data = envelope()
        data["sources"][0].update(title="Approved forged title", excerpt="Fabricated compliance", status="Approved", version=99)
        # Act
        with patch.dict(sys.modules, {"httpx": module}):
            result = await rehydrate_ai_grounding(data, "user-token", "actual-project")
        # Assert
        source = result["sources"][0]
        self.assertEqual(source["ref"], "document:ID@v7")
        self.assertEqual(source["status"], "Draft")
        self.assertIn("Real controlled text", source["excerpt"])
        self.assertNotIn("Fabricated", json.dumps(result))
        self.assertEqual(source["links"], [])
        self.assertEqual(module.AsyncClient.call_args.kwargs["headers"], {"Authorization": "Bearer user-token"})
        self.assertFalse(module.AsyncClient.call_args.kwargs["follow_redirects"])
        self.assertNotIn("user-token", json.dumps(result))
        self.assertTrue(client.get.call_args.args[0].endswith("/documents/ID"))
        self.assertIn("original binary", " ".join(result["coverage"]["limitations"]))

    async def test_forbidden_missing_wrongorg_and_invalid_identifiers_are_omitted(self):
        # Arrange
        data = envelope()
        data["sources"] = [{**data["sources"][0], "id": str(index), "ref": f"document:{index}"} for index in range(5)]
        data["sources"][-1]["id"] = "../arbitrary"
        data["coverage"].update(available=5, selected=5, omitted=0)
        responses = [Mock(status_code=status) for status in (403, 404, 401)]
        wrong = Mock(status_code=200)
        wrong.json.return_value = {"fields": fields({"organizationId": "other-org", "content": "secret"})}
        module, client = self.http([*responses, wrong])
        # Act
        with patch.dict(sys.modules, {"httpx": module}):
            result = await rehydrate_ai_grounding(data, "token", "project")
        # Assert
        self.assertEqual(result["sources"], [])
        self.assertEqual(client.get.await_count, 4)
        self.assertEqual(result["coverage"]["omitted"], 5)
        self.assertNotIn("secret", json.dumps(result))
        self.assertIn("existence is not asserted", " ".join(result["coverage"]["limitations"]))

    async def test_read_and_network_errors_fail_explicitly_without_client_fallback(self):
        # Arrange / Act / Assert
        for response in (Mock(status_code=500), RuntimeError("network")):
            module, _ = self.http([response])
            with patch.dict(sys.modules, {"httpx": module}):
                with self.assertRaises(GroundingServiceUnavailable):
                    await rehydrate_ai_grounding(envelope(), "token", "project")

    async def test_authorized_nested_capa_requires_exact_parent_member(self):
        # Arrange
        data = envelope()
        data["sources"][0].update(kind="capa", ref="capa:ID", links=[{"relation": "project", "target": "project:parent"}])
        response = Mock(status_code=200)
        response.json.return_value = {"fields": fields({"organizationId": "org-a", "capaReports": [
            {"id": "ID", "title": "Stored CAPA", "rootCause": "Actual cause", "status": "Open"}
        ]})}
        module, client = self.http([response])
        # Act
        with patch.dict(sys.modules, {"httpx": module}):
            result = await rehydrate_ai_grounding(data, "token", "project")
        # Assert
        self.assertTrue(client.get.call_args.args[0].endswith("/projects/parent"))
        self.assertEqual(result["sources"][0]["title"], "Stored CAPA")
        self.assertEqual(result["sources"][0]["links"], [])
        data["sources"][0]["links"] = []
        module, client = self.http([])
        with patch.dict(sys.modules, {"httpx": module}):
            result = await rehydrate_ai_grounding(data, "token", "project")
        self.assertEqual(result["sources"], [])
        client.get.assert_not_called()

    async def test_search_is_user_authorized_org_filtered_finite_and_bounded(self):
        # Arrange
        data = envelope()
        data["sources"] = []
        data["coverage"].update(available=0, selected=0, omitted=0)
        module, client = self.http([])
        documents = Mock(status_code=200)
        documents.json.return_value = [{"document": {
            "name": f"projects/project/databases/(default)/documents/documents/{index}",
            "fields": fields({"organizationId": "org-a", "name": "Safety", "content": "safety " * 1000, "status": "Draft"}),
        }} for index in range(50)]
        denied = Mock(status_code=403)
        client.post.side_effect = [documents, denied]
        # Act
        with patch.dict(sys.modules, {"httpx": module}):
            result = await rehydrate_ai_grounding(data, "token", "project", "safety")
        # Assert
        self.assertLessEqual(len(result["sources"]), 7)
        self.assertLess(len(json.dumps(result, ensure_ascii=True, separators=(",", ":"))), 8000)
        for call in client.post.call_args_list:
            query = call.kwargs["json"]["structuredQuery"]
            self.assertEqual(query["limit"], 50)
            self.assertEqual(query["where"]["fieldFilter"]["value"]["stringValue"], "org-a")
        self.assertIn("finite scan", " ".join(result["coverage"]["limitations"]))

    async def test_async_request_wrapper_rejects_api_key_and_maps_server_errors_to_503(self):
        # Arrange: execute production HTTP wrapper, mocking only scope and external reader.
        ns = api_namespace()
        production_functions("main.py", {"authenticated_grounding"}, ns)
        ns.update(os=os, GroundingServiceUnavailable=GroundingServiceUnavailable,
                  rehydrate_ai_grounding=AsyncMock(return_value=envelope()))
        request = Mock(headers={"Authorization": "Bearer private-token"})
        firebase_module = Mock()
        firebase_module.firebase_client.project_id = "configured-project"
        auth = {"auth_type": "firebase", "uid": "user-a", "organization_id": "org-a"}
        # Act / Assert
        with self.assertRaises(HTTPException) as caught:
            await ns["authenticated_grounding"](envelope(), request, {"auth_type": "api_key"})
        self.assertEqual(caught.exception.status_code, 403)
        self.assertIsNone(await ns["authenticated_grounding"](None, request, {"auth_type": "api_key"}))
        with patch.dict(sys.modules, {"firebase_client": firebase_module}):
            await ns["authenticated_grounding"](envelope(), request, auth)
            self.assertEqual(ns["rehydrate_ai_grounding"].call_args.args[1:3], ("private-token", "configured-project"))
            ns["rehydrate_ai_grounding"].side_effect = GroundingServiceUnavailable("do not leak")
            with self.assertRaises(HTTPException) as caught:
                await ns["authenticated_grounding"](envelope(), request, auth)
            self.assertEqual(caught.exception.status_code, 503)
            self.assertNotIn("do not leak", caught.exception.detail)


if __name__ == "__main__":
    unittest.main()
