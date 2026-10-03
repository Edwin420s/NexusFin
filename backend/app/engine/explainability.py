"""Explainable AI and Plain-Language Decision-Support Generator."""
from __future__ import annotations

import math
from backend.app.models.schemas import (
    Profile,
    CreditOffer,
    AffordabilityMetrics,
    ResilienceScore,
    ScenarioResult,
)


def generate_explanation(
    profile: Profile,
    offer: CreditOffer,
    metrics: AffordabilityMetrics,
    resilience: ResilienceScore,
    scenarios: list[ScenarioResult],
    status: str
) -> dict:
    """
    Produces transparent, plain-language insights, specific trade-offs,
    actionable recommendations, and methodology traces.
    """
    currency = profile.currency
    income = profile.income.monthly
    post_buf = metrics.post_credit_buffer
    monthly_pay = metrics.monthly_repayment
    burden = metrics.debt_service_burden_pct
    term = offer.term_months

    explanation: list[str] = []
    trade_offs: list[str] = []
    recommendations: list[str] = []

    # 1. Core affordability observations
    explanation.append(
        f"The proposed credit requires a commitment of {currency} {monthly_pay:,.2f} per month for {term} months "
        f"(total cost to you: {currency} {metrics.total_repayment:,.2f}, including {currency} {metrics.total_cost_of_credit:,.2f} in financing fees)."
    )
    explanation.append(
        f"After essential expenses ({currency} {profile.essential_expenses:,.2f}) and existing debt ({currency} {profile.existing_debt_payments:,.2f}), "
        f"your base cash flow leaves {currency} {post_buf:,.2f} remaining per month."
    )
    explanation.append(
        f"Total debt servicing (existing + new loan) represents {burden:.1f}% of your monthly income."
    )

    if metrics.liquid_savings_months is not None:
        explanation.append(
            f"Your current liquid savings ({currency} {profile.liquid_savings:,.2f}) provides approximately "
            f"{metrics.liquid_savings_months:.1f} months of essential living expenses buffer."
        )

    # 2. Stress scenario observations
    shock_25 = next((s for s in scenarios if s.name == "25% Income Shock"), None)
    if shock_25 and not shock_25.is_positive:
        explanation.append(
            f"Vulnerability Alert: Under a 25% income reduction (common for gig and seasonal workers), "
            f"your cash flow becomes negative by {currency} {abs(shock_25.buffer):,.2f}/month."
        )
    elif shock_25:
        explanation.append(
            f"Resilience Check: Under a 25% income shock, you would still maintain a modest monthly buffer of "
            f"{currency} {shock_25.buffer:,.2f}."
        )

    # 3. Trade-offs analysis
    if offer.repayment_type == "flat":
        trade_offs.append(
            "Flat-rate pricing is used here: although instalments are predictable, flat rates calculate interest on the full original principal throughout the term, which typically results in a higher effective APR than amortizing rates."
        )

    if offer.term_months > 12:
        trade_offs.append(
            f"Term Trade-off: Spreading repayment over {offer.term_months} months lowers the monthly instalment, but increases the overall finance charges paid ({currency} {metrics.total_cost_of_credit:,.2f} total cost)."
        )
    else:
        trade_offs.append(
            f"Term Trade-off: A shorter {offer.term_months}-month term minimizes total financing fees ({currency} {metrics.total_cost_of_credit:,.2f}), but increases the monthly cash-flow hurdle ({currency} {monthly_pay:,.2f}/mo)."
        )

    if profile.goal_savings > 0:
        trade_offs.append(
            f"Savings Goal Impact: You have a voluntary monthly savings goal of {currency} {profile.goal_savings:,.2f}. "
            f"After servicing this loan, you have {currency} {post_buf:,.2f} left. "
            f"{'You can continue fully funding your savings goal.' if post_buf >= profile.goal_savings else 'You may need to pause or reduce your planned savings contributions during the loan term.'}"
        )

    # 4. Actionable consumer recommendations
    if status == "high-pressure":
        recommendations.append(
            "Consider reducing the requested loan principal to lower the monthly obligation into safe cash-flow limits."
        )
        recommendations.append(
            "Explore whether a longer repayment tenure or a lower-cost financing program (such as a community cooperative or subsidized MSME facility) is available."
        )
        recommendations.append(
            "Review existing debt obligations to evaluate if refinancing or paying down current loans first would restore financial breathing room."
        )
    elif status == "review":
        recommendations.append(
            "Stress-test against your seasonal low months. If income dips by more than 20%, ensure you have sufficient liquid savings to cover instalments."
        )
        recommendations.append(
            "Request a standardized Key Facts Statement from the lender to verify that all upfront processing fees and insurance charges are included."
        )
    else:
        recommendations.append(
            "The proposed loan fits your current budget. Set up an automated repayment schedule to prevent accidental late penalty fees."
        )
        recommendations.append(
            "Maintain your existing emergency savings intact rather than using liquid reserves to pay down loan principal early, unless cash flow allows."
        )

    methodology = [
        "1. Cash Flow Baseline: Calculated as Gross Income minus Essential Living Expenses and Existing Debt Repayments.",
        "2. Cost of Credit: Calculated using standard actuarial formulas for amortizing or flat schedules plus all mandatory upfront and recurring fees.",
        "3. Post-Loan Cushion: New monthly repayment is applied directly to baseline available cash flow. Planned savings is evaluated as a secondary buffer, not an expense.",
        "4. Shock Sensitivity: Six deterministic macroeconomic and household shock scenarios simulate real-life income disruptions and cost inflation.",
        "5. Explainability Governance: Reason codes are generated without black-box opaque weights, ensuring every conclusion is fully verifiable by the borrower and lender.",
    ]

    limitations = [
        "NexusFin provides financial health decision support and does not constitute credit approval, credit underwriting, or formal financial advice.",
        "Calculations rely upon user-entered or consented data; unstated informal debts or hidden fees will affect real-world outcomes.",
        "Thresholds are illustrative and should be calibrated to specific national regulatory frameworks (such as BSP circulars in the Philippines or equivalent ASEAN standards).",
    ]

    return {
        "explanation": explanation,
        "trade_offs": trade_offs,
        "recommendations": recommendations,
        "methodology": methodology,
        "limitations": limitations,
    }
