"""Comprehensive End-to-End Workflow and ASEAN Currency Verification Tests."""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_full_consumer_to_partner_journey():
    """
    Simulates a complete borrower-to-underwriter lifecycle:
    1. Retrieve ASEAN personas.
    2. Upload alternative data transactions.
    3. Run deterministic affordability assessment with multi-scenario stress test.
    4. Run standardized multi-offer comparison.
    5. Update consent policies.
    6. Verify audit trail logs all lifecycle events.
    7. Review consented applicant file in Partner / Underwriter portal.
    """
    # 1. Fetch presets
    presets_res = client.get("/api/presets")
    assert presets_res.status_code == 200
    presets = presets_res.json()["presets"]
    manila_preset = next(p for p in presets if p["id"] == "carlos_manila")
    assert manila_preset["profile"]["currency"] == "PHP"

    # 2. Ingest transaction data
    tx_res = client.get("/api/transactions/sample/manila")
    assert tx_res.status_code == 200
    tx_data = tx_res.json()
    assert tx_data["summary"]["transaction_count"] > 0
    assert tx_data["detected_income"] > 0

    # 3. Assess affordability
    assess_payload = {
        "profile": manila_preset["profile"],
        "offer": manila_preset["offer"],
    }
    assess_res = client.post("/api/assess", json=assess_payload)
    assert assess_res.status_code == 200
    assess_data = assess_res.json()
    assert assess_data["currency"] == "PHP"
    assert assess_data["currency_symbol"] == "₱"
    assert assess_data["status"] in ["fits", "review", "high-pressure"]
    assert 0 <= assess_data["resilience"]["total_score"] <= 100
    assert len(assess_data["scenarios"]) == 6
    assert len(assess_data["explanation"]) > 0
    assert len(assess_data["trade_offs"]) > 0
    assert len(assess_data["recommendations"]) > 0

    # 4. Multi-offer comparison
    compare_payload = {
        "profile": manila_preset["profile"],
        "offers": [
            manila_preset["offer"],
            {
                "name": "Co-op Lower Rate Option",
                "principal": 35000,
                "annual_interest_rate": 14.0,
                "term_months": 12,
                "upfront_fee": 300,
                "repayment_type": "amortizing",
                "purpose": "Asset Acquisition",
            },
        ],
    }
    compare_res = client.post("/api/compare", json=compare_payload)
    assert compare_res.status_code == 200
    comp_data = compare_res.json()
    assert comp_data["offers_compared"] == 2
    assert len(comp_data["results"]) == 2
    assert len(comp_data["comparative_notes"]) > 0

    # 5. Consent toggle
    consent_res = client.post("/api/consent", json={
        "source_id": "business_sales_cashflow",
        "granted": False,
        "actor": "carlos_user",
    })
    assert consent_res.status_code == 200
    assert consent_res.json()["consent"]["granted"] is False

    # 6. Audit log inspection
    audit_res = client.get("/api/audit-log")
    assert audit_res.status_code == 200
    audit_data = audit_res.json()
    event_types = [entry["event_type"] for entry in audit_data["logs"]]
    assert "ASSESSMENT_PERFORMED" in event_types
    assert "COMPARISON_PERFORMED" in event_types

    # 7. Institutional Underwriter review
    partner_res = client.get("/api/partner/assessments")
    assert partner_res.status_code == 200
    partner_data = partner_res.json()
    assert partner_data["status"] == "authorized"
    assert partner_data["records_count"] > 0
    latest_review = partner_data["assessments"][0]
    assert latest_review["currency"] == "PHP"
    assert "resilience" in latest_review
    assert "metrics" in latest_review



def test_all_asean_currencies_supported():
    """Verify system computes correctly across all 8 supported ASEAN currencies."""
    currencies = ["PHP", "KES", "SGD", "IDR", "MYR", "THB", "VND", "USD"]
    for curr in currencies:
        payload = {
            "profile": {
                "currency": curr,
                "income": {"monthly": 50000, "variability_pct": 10.0},
                "essential_expenses": 25000,
                "existing_debt_payments": 5000,
                "liquid_savings": 20000,
            },
            "offer": {
                "name": f"Test Facility in {curr}",
                "principal": 30000,
                "annual_interest_rate": 15.0,
                "term_months": 12,
            },
        }
        res = client.post("/api/assess", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["currency"] == curr
        assert data["metrics"]["monthly_repayment"] > 0
        assert data["resilience"]["total_score"] > 0
