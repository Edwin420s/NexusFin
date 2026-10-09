"""Tests for data governance, consent revocation, and regulatory audit logging."""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_consent_retrieval_and_source_fields():
    """Verify all default data sources specify clear legal basis, purpose, and retention."""
    res = client.get("/api/consent")
    assert res.status_code == 200
    data = res.json()
    assert "consents" in data
    assert len(data["consents"]) >= 4

    for source in data["consents"]:
        assert "source_id" in source
        assert "title" in source
        assert "purpose" in source
        assert "legal_basis" in source
        assert "retention_period" in source
        assert isinstance(source["granted"], bool)


def test_consent_grant_and_revocation_cycle():
    """Verify borrower can grant and revoke consent, and each event is recorded in the audit trail."""
    source_id = "utility_telecom_payments"

    # 1. Grant consent
    grant_res = client.post("/api/consent", json={
        "source_id": source_id,
        "granted": True,
        "actor": "borrower_session"
    })
    assert grant_res.status_code == 200
    assert grant_res.json()["consent"]["granted"] is True

    # 2. Revoke consent
    revoke_res = client.post("/api/consent", json={
        "source_id": source_id,
        "granted": False,
        "actor": "borrower_session"
    })
    assert revoke_res.status_code == 200
    assert revoke_res.json()["consent"]["granted"] is False

    # 3. Verify audit trail reflects the operations
    audit_res = client.get("/api/audit-log")
    assert audit_res.status_code == 200
    audit_data = audit_res.json()
    assert audit_data["count"] > 0
    recent_events = [e["event_type"] for e in audit_data["logs"]]
    assert "CONSENT_GRANTED" in recent_events
    assert "CONSENT_REVOKED" in recent_events


def test_underwriter_portal_audit_logging():
    """Verify access to partner underwriter queue records an audit log entry."""
    headers = {"Authorization": "Bearer demo_underwriter_token_v1"}
    partner_res = client.get("/api/partner/assessments", headers=headers)
    assert partner_res.status_code == 200

    audit_res = client.get("/api/audit-log")
    assert audit_res.status_code == 200
    recent_events = [e["event_type"] for e in audit_res.json()["logs"]]
    assert "PARTNER_REVIEW_ACCESSED" in recent_events
