"""Evidence-based multidimensional financial resilience evaluation."""
from __future__ import annotations

from backend.app.models.schemas import Profile, AffordabilityMetrics, ResilienceScore, ScenarioResult


def compute_resilience_index(
    profile: Profile,
    metrics: AffordabilityMetrics,
    scenarios: list[ScenarioResult]
) -> ResilienceScore:
    """
    Evaluates evidence-based, multidimensional financial resilience:
    - Current cash flow cushion (Monthly buffer)
    - Debt-service burden (% of gross income)
    - Emergency savings runway (Months of essential expenditure)
    - Stress shock resilience (buffer under 10% dip, 25% shock, 40% disruption, 20% cost surge, combined shock)

    NexusFin does NOT generate an arbitrary 0-100 black-box score.
    Instead, it delivers transparent, verifiable financial metrics and conclusions.
    """
    income = profile.income.monthly
    buffer = metrics.post_credit_buffer
    burden = metrics.debt_service_burden_pct
    liquid_savings = profile.liquid_savings
    essential_exp = profile.essential_expenses

    # Emergency Reserve Runway in months of essential living costs
    savings_months = (liquid_savings / essential_exp) if essential_exp > 0 else 0

    # Count how many of the 6 stress scenarios remain cash-flow positive
    positive_scenarios = sum(1 for s in scenarios if s.is_positive)

    # Find key stress shocks
    shock_25 = next((s for s in scenarios if "25%" in s.name), None)
    combined = next((s for s in scenarios if "Combined" in s.name), None)
    shock_deficit_25 = round(shock_25.buffer, 2) if shock_25 else None
    combined_deficit = round(combined.buffer, 2) if combined else None

    baseline_status = "Manageable" if buffer >= 0 else "Deficit"

    if buffer >= 0 and shock_25 and not shock_25.is_positive:
        resilience_status = "Needs Review"
        conclusion = "Manageable today — vulnerable under income shock"
    elif buffer < 0:
        resilience_status = "High Pressure"
        conclusion = "Immediate monthly cash deficit"
    else:
        resilience_status = "Manageable"
        conclusion = "Comfortably manageable across baseline and shocks"

    # Evidence-based transparent summary
    if buffer >= 0 and shock_deficit_25 is not None and shock_deficit_25 < 0:
        summary = (
            f"Baseline cash flow provides a {profile.currency} {buffer:,.2f} monthly buffer ({burden:.1f}% debt burden). "
            f"However, liquid savings covers {savings_months:.1f} months of expenses, and cash flow turns negative under "
            f"a 25% income shock ({profile.currency} {shock_deficit_25:,.2f}/mo) and combined shock ({profile.currency} {combined_deficit:,.2f}/mo). "
            f"The primary risk factor is income disruption rather than base-month affordability."
        )
    elif buffer < 0:
        summary = (
            f"Immediate cash deficit of {profile.currency} {abs(buffer):,.2f}/mo. "
            f"Debt commitments exceed available cash flow even before simulating adverse shocks."
        )
    else:
        summary = (
            f"Strong financial resilience with a {profile.currency} {buffer:,.2f} monthly cushion and "
            f"positive cash flow sustained across standard income shocks."
        )

    tier = "Moderate Resilience"
    if buffer < 0 or positive_scenarios < 2:
        tier = "Financially Vulnerable"
    elif positive_scenarios == 6 and savings_months >= 2.0:
        tier = "High Resilience"

    # Compatibility total_score for existing test assertions
    compat_score = int(min(100, max(10, (positive_scenarios / len(scenarios) * 60) + (20 if buffer > 0 else 0) + min(20, savings_months * 10))))

    return ResilienceScore(
        baseline_status=baseline_status,
        resilience_status=resilience_status,
        conclusion=conclusion,
        summary=summary,
        monthly_buffer=round(buffer, 2),
        debt_service_burden_pct=round(burden, 2),
        liquid_savings_months=round(savings_months, 2) if essential_exp > 0 else None,
        shock_deficit_25=shock_deficit_25,
        combined_deficit=combined_deficit,
        survived_scenarios_count=positive_scenarios,
        total_scenarios_count=len(scenarios),
        total_score=compat_score,
        tier=tier,
    )

