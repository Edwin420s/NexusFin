"""API integration tests for all NexusFin endpoints."""
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["product"] == "NexusFin"


def test_presets_endpoint():
    res = client.get("/api/presets")
    assert res.status_code == 200
    data = res.json()
    assert "presets" in data
    assert len(data["presets"]) >= 3


def test_assess_endpoint():
    payload = {
        "profile": {
            "currency": "PHP",
            "income": {"monthly": 38000, "variability_pct": 20.0, "employment_type": "gig_worker"},
            "essential_expenses": 21000,
            "existing_debt_payments": 4500,
            "liquid_savings": 15000,
            "goal_savings": 2000,
            "household_dependents": 2
        },
        "offer": {
            "name": "Micro-credit Option 1",
            "provider": "Inclusive Finance Co",
            "principal": 20000,
            "annual_interest_rate": 18.0,
            "term_months": 10,
            "upfront_fee": 500,
            "monthly_fee": 0,
            "repayment_type": "amortizing",
            "purpose": "Working Capital / MSME"
        }
    }
    res = client.post("/api/assess", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["currency"] == "PHP"
    assert "metrics" in data
    assert "scenarios" in data
    assert len(data["scenarios"]) == 6
    assert "resilience" in data
    assert "explanation" in data
    assert "trade_offs" in data
    assert "recommendations" in data


def test_compare_endpoint():
    payload = {
        "profile": {
            "currency": "KES",
            "income": {"monthly": 60000, "variability_pct": 15.0},
            "essential_expenses": 32000,
            "existing_debt_payments": 5000,
            "liquid_savings": 30000,
            "goal_savings": 5000
        },
        "offers": [
            {
                "name": "Offer 1",
                "principal": 50000,
                "annual_interest_rate": 18.0,
                "term_months": 12,
                "upfront_fee": 1000,
                "repayment_type": "amortizing"
            },
            {
                "name": "Offer 2",
                "principal": 50000,
                "annual_interest_rate": 14.0,
                "term_months": 18,
                "upfront_fee": 500,
                "repayment_type": "amortizing"
            }
        ]
    }
    res = client.post("/api/compare", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["offers_compared"] == 2
    assert len(data["results"]) == 2


def test_consent_and_audit_log_flow():
    # 1. Fetch consents
    res_list = client.get("/api/consent")
    assert res_list.status_code == 200
    consents = res_list.json()["consents"]
    assert len(consents) >= 3

    # 2. Update consent
    res_update = client.post("/api/consent", json={
        "source_id": "bank_wallet_transactions",
        "granted": False,
        "actor": "test_user"
    })
    assert res_update.status_code == 200
    assert res_update.json()["consent"]["granted"] is False

    # 3. Check audit trail
    res_audit = client.get("/api/audit-log")
    assert res_audit.status_code == 200
    audit_data = res_audit.json()
    assert audit_data["count"] > 0
    assert any(log["event_type"] == "CONSENT_REVOKED" for log in audit_data["logs"])
