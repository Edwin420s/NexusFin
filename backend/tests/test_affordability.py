"""Unit tests for affordability engine and calculation accuracy."""
import pytest
from backend.app.models.schemas import Profile, Income, CreditOffer
from backend.app.engine.affordability import (
    calculate_monthly_payment,
    calculate_offer_totals,
    compute_affordability_metrics,
    classify_affordability,
)


def test_zero_interest_payment():
    offer = CreditOffer(
        principal=12000,
        annual_interest_rate=0,
        term_months=12,
        upfront_fee=0,
        monthly_fee=0,
        repayment_type="amortizing"
    )
    totals = calculate_offer_totals(offer)
    assert totals["monthly_payment"] == 1000.0
    assert totals["total_repayment"] == 12000.0
    assert totals["total_cost_of_credit"] == 0.0


def test_flat_rate_vs_amortizing():
    # 100k principal, 12% annual interest, 12 months
    offer_amort = CreditOffer(
        principal=100000,
        annual_interest_rate=12.0,
        term_months=12,
        repayment_type="amortizing"
    )
    offer_flat = CreditOffer(
        principal=100000,
        annual_interest_rate=12.0,
        term_months=12,
        repayment_type="flat"
    )

    totals_amort = calculate_offer_totals(offer_amort)
    totals_flat = calculate_offer_totals(offer_flat)

    # Flat interest generates exactly ~12,000 in interest -> rounded instalment 9,333.33/mo gives 11,999.96
    assert totals_flat["total_cost_of_credit"] == pytest.approx(12000.0, abs=0.5)
    # Reducing balance generates less total interest than flat rate!
    assert totals_amort["total_cost_of_credit"] < totals_flat["total_cost_of_credit"]
    assert totals_amort["total_cost_of_credit"] == pytest.approx(6618.55, rel=1e-2)


def test_planned_savings_not_subtracted_as_mandatory_debt():
    """
    CRITICAL METHODOLOGY TEST:
    Planned goal savings is a wealth-building buffer, NOT an essential expense or debt obligation.
    Income 60k - Expenses 30k - Debt 5k = Available Cash Flow 25k.
    (Goal savings of 5k must NOT reduce available cash flow to 20k).
    """
    profile = Profile(
        currency="KES",
        income=Income(monthly=60000, variability_pct=15.0),
        essential_expenses=30000,
        existing_debt_payments=5000,
        liquid_savings=25000,
        goal_savings=5000,
    )
    offer = CreditOffer(
        principal=12000,
        annual_interest_rate=0,
        term_months=12,
    )
    metrics = compute_affordability_metrics(profile, offer)

    assert metrics.base_available_cash_flow == 25000.0
    assert metrics.monthly_repayment == 1000.0
    assert metrics.post_credit_buffer == 24000.0
    assert metrics.debt_service_burden_pct == pytest.approx(10.0, rel=1e-2)


def test_classify_affordability_bands():
    # Case 1: Healthy buffer, low burden -> "fits"
    prof_good = Profile(
        income=Income(monthly=50000, variability_pct=10.0),
        essential_expenses=20000,
        existing_debt_payments=2000,
    )
    offer_good = CreditOffer(principal=10000, annual_interest_rate=10, term_months=12)
    metrics_good = compute_affordability_metrics(prof_good, offer_good)
    status_good, _, _ = classify_affordability(metrics_good, 50000, 10.0)
    assert status_good == "fits"

    # Case 2: Negative buffer -> "high-pressure"
    prof_deficit = Profile(
        income=Income(monthly=20000, variability_pct=10.0),
        essential_expenses=18000,
        existing_debt_payments=5000,  # Already in deficit
    )
    metrics_deficit = compute_affordability_metrics(prof_deficit, offer_good)
    status_def, _, _ = classify_affordability(metrics_deficit, 20000, 10.0)
    assert status_def == "high-pressure"
