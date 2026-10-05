"""Unit tests for stress testing engine."""
from backend.app.models.schemas import Profile, Income
from backend.app.engine.stress_test import run_stress_scenarios


def test_six_stress_scenarios_generated():
    profile = Profile(
        income=Income(monthly=40000, variability_pct=20.0),
        essential_expenses=22000,
        existing_debt_payments=4000,
    )
    scenarios = run_stress_scenarios(profile, monthly_repayment=3000)

    assert len(scenarios) == 6
    names = [s.name for s in scenarios]
    assert "Base Case" in names
    assert any("10%" in n for n in names)
    assert any("25%" in n for n in names)
    assert any("40%" in n for n in names)
    assert any("20%" in n for n in names)
    assert any("Combined" in n for n in names)


def test_deficit_detection_under_severe_shock():
    profile = Profile(
        income=Income(monthly=30000, variability_pct=25.0),
        essential_expenses=20000,
        existing_debt_payments=5000,
    )
    # 4k monthly repayment leaves 1k buffer in base case: (30k - 20k - 5k - 4k = 1k)
    # Under 25% shock: Income becomes 22.5k -> buffer = 22.5k - 20k - 5k - 4k = -6.5k
    scenarios = run_stress_scenarios(profile, monthly_repayment=4000)

    base = next(s for s in scenarios if s.name == "Base Case")
    assert base.is_positive is True
    assert base.buffer == 1000.0

    shock_25 = next(s for s in scenarios if "25%" in s.name)
    assert shock_25.is_positive is False
    assert shock_25.buffer == -6500.0

    assert shock_25.status == "deficit"
