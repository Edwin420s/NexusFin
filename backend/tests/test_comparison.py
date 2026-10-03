"""Unit tests for multi-offer credit comparison."""
from backend.app.models.schemas import Profile, Income, CreditOffer
from backend.app.engine.comparison import compare_credit_offers


def test_multi_offer_comparison_ranking():
    profile = Profile(
        income=Income(monthly=50000),
        essential_expenses=25000,
        existing_debt_payments=3000,
    )
    offer_a = CreditOffer(
        name="Offer A - Short Term",
        principal=30000,
        annual_interest_rate=12.0,
        term_months=6,
    )
    offer_b = CreditOffer(
        name="Offer B - Long Term",
        principal=30000,
        annual_interest_rate=12.0,
        term_months=24,
    )

    res = compare_credit_offers(profile, [offer_a, offer_b])
    assert res["offers_compared"] == 2

    row_a = next(r for r in res["results"] if r["offer_name"] == "Offer A - Short Term")
    row_b = next(r for r in res["results"] if r["offer_name"] == "Offer B - Long Term")

    # Short term has higher monthly repayment but lower total finance cost!
    assert row_a["monthly_repayment"] > row_b["monthly_repayment"]
    assert row_a["total_cost_of_credit"] < row_b["total_cost_of_credit"]
    assert row_a["is_lowest_total_cost"] is True
    assert row_b["is_best_monthly"] is True
