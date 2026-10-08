"""Tests for multi-currency localization and financial formatting across all supported regions."""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.config import CURRENCY_CONFIG

client = TestClient(app)


def test_supported_currencies_structure():
    """Verify all 8 currencies have required symbol, name, and locale metadata."""
    expected_currencies = ["PHP", "KES", "SGD", "IDR", "MYR", "THB", "VND", "USD", "EUR", "GBP"]
    for curr in expected_currencies:
        assert curr in CURRENCY_CONFIG
        meta = CURRENCY_CONFIG[curr]
        assert "symbol" in meta
        assert "name" in meta
        assert "locale" in meta
        assert len(meta["symbol"]) > 0
        assert len(meta["name"]) > 0


def test_assessment_in_each_currency():
    """Verify assessment calculation produces valid results and correct currency symbols for all currencies."""
    base_amounts = {
        "PHP": (38000, 21000, 35000),
        "KES": (65000, 32000, 60000),
        "SGD": (4500, 2500, 4000),
        "IDR": (9500000, 5500000, 10000000),
        "MYR": (5000, 2800, 4500),
        "THB": (35000, 20000, 30000),
        "VND": (18000000, 11000000, 15000000),
        "USD": (3200, 1800, 2500),
        "EUR": (2800, 1600, 2200),
        "GBP": (2500, 1400, 2000),
    }

    for curr, (inc, exp, principal) in base_amounts.items():
        payload = {
            "profile": {
                "currency": curr,
                "income": {"monthly": inc, "variability_pct": 15.0, "employment_type": "gig_worker"},
                "essential_expenses": exp,
                "existing_debt_payments": inc * 0.1,
                "liquid_savings": inc * 0.5,
                "goal_savings": inc * 0.05,
                "household_dependents": 2,
            },
            "offer": {
                "name": f"Standard Facility ({curr})",
                "provider": "Community Inclusive Lender",
                "principal": principal,
                "annual_interest_rate": 18.0,
                "term_months": 12,
                "upfront_fee": principal * 0.02,
                "monthly_fee": 0,
                "repayment_type": "amortizing",
                "purpose": "Working Capital / MSME",
            },
        }

        res = client.post("/api/assess", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["currency"] == curr
        assert data["currency_symbol"] == CURRENCY_CONFIG[curr]["symbol"]
        assert data["metrics"]["monthly_repayment"] > 0
        assert data["metrics"]["post_credit_buffer"] is not None
        assert len(data["scenarios"]) == 6
