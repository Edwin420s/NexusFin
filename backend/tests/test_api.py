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


def test_sample_transactions_endpoints():
    """Verify all 3 sample transaction datasets load and classify properly."""
    for persona in ["manila", "kenya", "jakarta"]:
        res = client.get(f"/api/transactions/sample/{persona}")
        assert res.status_code == 200
        data = res.json()
        assert len(data["transactions"]) > 0
        assert data["summary"]["transaction_count"] > 0
        assert data["summary"]["total_inflows"] > 0
        assert "detected_income" in data
        assert "insights" in data


def test_partner_assessments_endpoint():
    """Verify underwriter review endpoint returns stored records and logs audit access."""
    res = client.get("/api/partner/assessments")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "authorized"
    assert "assessments" in data


def test_partner_decision_endpoint():
    """Verify institutional underwriter can record a decision on an assessment with rationale."""
    res = client.get("/api/partner/assessments")
    assert res.status_code == 200
    asmt_id = res.json()["assessments"][0]["id"]

    decision_res = client.post("/api/partner/decision", json={
        "assessment_id": asmt_id,
        "decision": "approved",
        "rationale": "Applicant demonstrates strong baseline cash flow and manageable debt burden.",
        "officer_name": "Senior Credit Officer Gomez"
    })
    assert decision_res.status_code == 200
    res_data = decision_res.json()
    assert res_data["status"] == "success"
    assert res_data["assessment"]["decision"]["decision"] == "approved"


def test_frontend_index_and_spa_routing():
    """Verify frontend HTML is served at root and fallback paths."""
    res = client.get("/")
    assert res.status_code == 200
    assert "text/html" in res.headers["content-type"]
    assert "NexusFin" in res.text
    assert "Methodology &amp; Financial Standards" in res.text or "Methodology & Financial Standards" in res.text


def test_independent_page_routes():
    """Verify each independent page is served under its dedicated clean URL."""
    routes_to_test = [
        ("/assessment", "Loan Affordability"),
        ("/compare", "Compare Credit Offers"),
        ("/transactions", "Alternative Data &amp; Cash Flow"),
        ("/governance", "Data Governance &amp; Compliance Audit Trail"),
        ("/underwriter", "Institutional Underwriter Portal"),
        ("/methodology", "Platform Methodology, Actuarial Formulations"),
    ]
    for path, expected_text in routes_to_test:
        res = client.get(path)
        assert res.status_code == 200, f"Route {path} failed with status {res.status_code}"
        assert "text/html" in res.headers["content-type"]
        assert expected_text in res.text, f"Route {path} missing expected content '{expected_text}'"
