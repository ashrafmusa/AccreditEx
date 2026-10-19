import base64
import sys
from pathlib import Path

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def upload_form(pdf_bytes=b"%PDF-1.7\nsample"):
    return {
        "project_id": (None, "project-1"),
        "file_data": (None, base64.b64encode(pdf_bytes).decode("ascii")),
        "file_name": (None, "report.pdf"),
    }


def test_upload_report_rejects_api_key_callers(monkeypatch):
    import main

    monkeypatch.setenv("API_KEY", "test-key")
    main.app.dependency_overrides[main.verify_api_key] = lambda: {
        "auth_type": "api_key"
    }
    try:
        response = TestClient(main.app).post(
            "/upload-report",
            files=upload_form(),
            headers={"X-API-Key": "test-key"},
        )
    finally:
        main.app.dependency_overrides.pop(main.verify_api_key, None)

    assert response.status_code == 403


def test_upload_report_rejects_non_pdf_for_firebase_user():
    import main

    main.app.dependency_overrides[main.verify_api_key] = lambda: {
        "auth_type": "firebase",
        "uid": "user-1",
        "organization_id": "org-1",
    }
    try:
        response = TestClient(main.app).post(
            "/upload-report",
            files=upload_form(b"not a pdf"),
        )
    finally:
        main.app.dependency_overrides.pop(main.verify_api_key, None)

    assert response.status_code == 415


def test_upload_report_rejects_unsafe_file_names_for_firebase_user():
    import main

    main.app.dependency_overrides[main.verify_api_key] = lambda: {
        "auth_type": "firebase",
        "uid": "user-1",
        "organization_id": "org-1",
    }
    files = upload_form()
    files["file_name"] = (None, "../report.pdf")
    try:
        response = TestClient(main.app).post("/upload-report", files=files)
    finally:
        main.app.dependency_overrides.pop(main.verify_api_key, None)

    assert response.status_code == 422
