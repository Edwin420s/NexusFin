"""Comprehensive Financial Resilience Index calculation."""
from __future__ import annotations

from backend.app.models.schemas import Profile, AffordabilityMetrics, ResilienceScore, ScenarioResult


def compute_resilience_index(
    profile: Profile,
    metrics: AffordabilityMetrics,
    scenarios: list[ScenarioResult]
) -> ResilienceScore:
    """
    Evaluates multi-dimensional financial resilience across 4 pillars:
    1. Buffer Adequacy (30 pts max)
    2. Debt Burden Safety (25 pts max)
    3. Emergency Reserve Runway (25 pts max)
    4. Shock Survivability (20 pts max)
    Total: 100 pts
    """
    income = profile.income.monthly
    buffer = metrics.post_credit_buffer
    burden = metrics.debt_service_burden_pct
    liquid_savings = profile.liquid_savings
    essential_exp = profile.essential_expenses

    # Pillar 1: Buffer Adequacy (0-30 pts)
    buffer_ratio = (buffer / income) if income > 0 else 0
    if buffer_ratio >= 0.25:
        buffer_pts = 30
    elif buffer_ratio >= 0.15:
        buffer_pts = 22
    elif buffer_ratio >= 0.05:
        buffer_pts = 14
    elif buffer_ratio >= 0.0:
        buffer_pts = 7
    else:
        buffer_pts = 0

    # Pillar 2: Debt Burden Safety (0-25 pts)
    if burden <= 20.0:
        debt_pts = 25
    elif burden <= 35.0:
        debt_pts = 20
    elif burden <= 45.0:
        debt_pts = 12
    elif burden <= 55.0:
        debt_pts = 5
    else:
        debt_pts = 0

    # Pillar 3: Emergency Reserve Runway (0-25 pts)
    savings_months = (liquid_savings / essential_exp) if essential_exp > 0 else 0
    if savings_months >= 3.0:
        reserve_pts = 25
    elif savings_months >= 2.0:
        reserve_pts = 19
    elif savings_months >= 1.0:
        reserve_pts = 13
    elif savings_months >= 0.5:
        reserve_pts = 7
    else:
        reserve_pts = 2

    # Pillar 4: Shock Survivability (0-20 pts)
    # Count how many of the 6 stress scenarios remain cash-flow positive
    positive_scenarios = sum(1 for s in scenarios if s.is_positive)
    if positive_scenarios == 6:
        stability_pts = 20
    elif positive_scenarios >= 4:
        stability_pts = 14
    elif positive_scenarios >= 2:
        stability_pts = 8
    elif positive_scenarios >= 1:
        stability_pts = 4
    else:
        stability_pts = 0

    total_score = buffer_pts + debt_pts + reserve_pts + stability_pts

    if total_score >= 78:
        tier = "High Resilience"
        summary = "Strong cash flow cushion and emergency reserves. Household has substantial room to absorb shocks."
    elif total_score >= 58:
        tier = "Moderate Resilience"
        summary = "Acceptable cash flow under regular conditions, but sensitive to prolonged income cuts or large expense surges."
    elif total_score >= 38:
        tier = "Financially Vulnerable"
        summary = "Elevated risk of distress. Limited savings runway and thin buffer mean an unexpected shock could cause arrears."
    else:
        tier = "Severely Stressed"
        summary = "Critical vulnerability. Combined commitments outstrip cash flow or leave zero margin for basic living needs."

    return ResilienceScore(
        total_score=total_score,
        tier=tier,
        buffer_adequacy_pts=buffer_pts,
        debt_burden_pts=debt_pts,
        emergency_reserve_pts=reserve_pts,
        income_stability_pts=stability_pts,
        summary=summary,
    )
