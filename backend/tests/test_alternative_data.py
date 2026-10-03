"""Unit tests for transaction processing and categorization."""
from backend.app.engine.alternative_data import process_transaction_csv, classify_description


def test_classify_description_rules():
    cat1, is_rec1 = classify_description("Salary Monthly Payroll", 50000)
    assert cat1 == "Regular Salary / Payroll"
    assert is_rec1 is True

    cat2, _ = classify_description("Puregold Supermarket Food", -3500)
    assert cat2 == "Groceries & Food"

    cat3, _ = classify_description("Grab Express Earnings", 4500)
    assert cat3 == "Variable / Gig / Business Income"

    cat4, is_rec4 = classify_description("Motorcycle Loan Installment", -2000)
    assert cat4 == "Debt / Credit Repayment"
    assert is_rec4 is True


def test_csv_processing():
    sample_csv = """date,description,amount
2026-09-01,Grab Express Earnings,5000
2026-09-02,Foodpanda Delivery Payout,4000
2026-09-03,Puregold Supermarket,-2500
2026-09-04,Motorcycle Loan Installment,-1500
2026-09-05,Shell Gas Fuel,-600
"""
    res = process_transaction_csv(sample_csv)
    assert res.summary["transaction_count"] == 5
    assert res.summary["total_inflows"] == 9000.0
    assert res.summary["total_outflows"] == 4600.0
    assert res.detected_debt_payments == 1500.0
    assert res.income_variability_est_pct > 0
