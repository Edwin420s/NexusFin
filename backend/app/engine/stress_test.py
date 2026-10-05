"""Multi-scenario financial resilience and stress testing engine."""
from __future__ import annotations

from backend.app.models.schemas import Profile, ScenarioResult


def run_stress_scenarios(
    profile: Profile,
    monthly_repayment: float
) -> list[ScenarioResult]:
    """
    Executes 6 stress-testing scenarios to test how the credit commitment holds up
    under real-world financial disruptions.
    """
    scenarios_config = [
        {
            "name": "Base Case",
            "description": "Current declared income and living expenses.",
            "income_factor": 1.00,
            "expense_factor": 1.00,
        },
        {
            "name": "Income −10%",
            "description": "Mild seasonal slowdown or temporary reduction in gig/freelance hours.",
            "income_factor": 0.90,
            "expense_factor": 1.00,
        },
        {
            "name": "Income −25%",
            "description": "Moderate shock: client loss, vehicle downtime, or seasonal low period.",
            "income_factor": 0.75,
            "expense_factor": 1.00,
        },
        {
            "name": "Income −40%",
            "description": "Severe disruption: extended medical leave or loss of primary revenue stream.",
            "income_factor": 0.60,
            "expense_factor": 1.00,
        },
        {
            "name": "Expenses +20%",
            "description": "Cost surge: essential living cost inflation, food/fuel price spikes.",
            "income_factor": 1.00,
            "expense_factor": 1.20,
        },
        {
            "name": "Combined Shock",
            "description": "Simultaneous 25% income contraction and 20% essential expense surge.",
            "income_factor": 0.75,
            "expense_factor": 1.20,
        },
    ]


    results: list[ScenarioResult] = []
    base_income = profile.income.monthly
    base_expenses = profile.essential_expenses
    existing_debt = profile.existing_debt_payments

    for cfg in scenarios_config:
        inc = base_income * cfg["income_factor"]
        exp = base_expenses * cfg["expense_factor"]
        # Buffer = Stressed Income - Stressed Expenses - Existing Debt - Proposed Loan Repayment
        buffer = inc - exp - existing_debt - monthly_repayment
        burden_pct = ((existing_debt + monthly_repayment) / inc * 100.0) if inc > 0 else 100.0

        is_positive = buffer >= 0.0
        if buffer < 0:
            status = "deficit"
            status_label = "Deficit"
        elif cfg["name"] == "Base Case":
            status = "healthy"
            status_label = "Manageable"
        else:
            # Stressed scenarios with positive but reduced buffers are flagged for Review
            status = "tight"
            status_label = "Review"


        results.append(
            ScenarioResult(
                name=cfg["name"],
                description=cfg["description"],
                income_factor=cfg["income_factor"],
                expense_factor=cfg["expense_factor"],
                income=round(inc, 2),
                expenses=round(exp, 2),
                debt_payments=round(existing_debt, 2),
                monthly_repayment=round(monthly_repayment, 2),
                buffer=round(buffer, 2),
                debt_service_burden_pct=round(burden_pct, 2),
                is_positive=is_positive,
                status=status,
                status_label=status_label,
            )
        )

    return results
