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
        f"your baseline cash flow leaves {currency} {post_buf:,.2f} remaining per month before voluntary savings."
    )
    if profile.goal_savings > 0:
        explanation.append(
            f"After accounting for your planned monthly savings goal ({currency} {profile.goal_savings:,.2f}), "
            f"your remaining discretionary buffer is {currency} {metrics.after_savings_buffer:,.2f}. "
            f"(Note: Planned savings is treated as an adaptable resilience goal, not a mandatory debt obligation)."
        )
    explanation.append(
        f"Total debt servicing (existing debt + proposed loan repayment) represents {burden:.1f}% of your monthly income."
    )

    if metrics.liquid_savings_months is not None:
        explanation.append(
            f"Your current liquid savings ({currency} {profile.liquid_savings:,.2f}) provides approximately "
            f"{metrics.liquid_savings_months:.1f} months of essential living expense reserves."
        )

    # 2. Stress scenario observations
    shock_25 = next((s for s in scenarios if "25%" in s.name), None)
    if shock_25 and not shock_25.is_positive:
        explanation.append(
            f"Income Shock Vulnerability: Under a 25% income reduction (common in freelance and platform gig work), "
            f"monthly cash flow enters a deficit of {currency} {abs(shock_25.buffer):,.2f}/month. "
            f"The primary risk to evaluate is income volatility rather than the normal-month instalment."
        )
    elif shock_25:
        explanation.append(
            f"Shock Resilience: Under a 25% income shock, the household still retains a positive buffer of "
            f"{currency} {shock_25.buffer:,.2f}/month."
        )

    # 3. Trade-offs analysis
    if offer.repayment_type == "flat":
        trade_offs.append(
            "Flat-rate pricing model: Interest is calculated on the full original principal for the entire loan duration. "
            "While instalments are fixed, the effective APR is substantially higher than a reducing-balance amortizing loan with the same nominal rate."
        )

    if offer.term_months > 12:
        trade_offs.append(
            f"Tenure Trade-off: Extending repayment over {offer.term_months} months lowers the monthly instalment, "
            f"but significantly increases cumulative finance charges ({currency} {metrics.total_cost_of_credit:,.2f} total cost)."
        )
    else:
        trade_offs.append(
            f"Tenure Trade-off: A shorter {offer.term_months}-month term minimizes total financing fees ({currency} {metrics.total_cost_of_credit:,.2f}), "
            f"but requires a larger monthly cash allocation ({currency} {monthly_pay:,.2f}/mo)."
        )

    if profile.goal_savings > 0:
        trade_offs.append(
            f"Planned Savings Goal: You declared a voluntary savings goal of {currency} {profile.goal_savings:,.2f}/mo. "
            f"Post-loan available cash flow is {currency} {post_buf:,.2f}/mo. "
            f"After planned savings: {currency} {metrics.after_savings_buffer:,.2f}/month remaining. "
            f"Your planned savings is an adaptable financial goal, not a mandatory debt obligation."
        )

    # 4. Neutral decision considerations (evidence-based, non-prescriptive)
    if post_buf >= 0:
        recommendations.append(
            f"The proposed repayment ({currency} {monthly_pay:,.2f}/mo) is affordable under your declared baseline cash flow."
        )
    else:
        recommendations.append(
            f"The proposed repayment exceeds your declared baseline cash flow by {currency} {abs(post_buf):,.2f}/month."
        )

    if shock_25 and not shock_25.is_positive:
        recommendations.append(
            f"A 25% income shock would produce a monthly deficit of {currency} {abs(shock_25.buffer):,.2f}."
        )
    elif shock_25:
        recommendations.append(
            f"Under a 25% income reduction, the remaining monthly buffer would be {currency} {shock_25.buffer:,.2f}."
        )

    if (metrics.liquid_savings_months or 0) < 2.0:
        recommendations.append(
            "A larger emergency reserve would improve resilience to income disruption."
        )
    else:
        recommendations.append(
            f"Existing emergency savings covers approximately {metrics.liquid_savings_months:.1f} months of essential living expenses."
        )

    recommendations.append(
        "A lower monthly repayment could reduce short-term cash-flow pressure, but may increase total financing cost."
    )

    methodology = [
        "1. Cash Flow Baseline: Calculated as Gross Income minus Essential Living Expenses and Existing Debt Repayments.",
        "2. Cost of Credit: Calculated using standard actuarial formulas for amortizing or flat schedules plus all mandatory upfront and recurring fees.",
        "3. Post-Loan Cushion: New monthly repayment is applied directly to baseline available cash flow. Planned savings is evaluated as a secondary buffer, not a debt.",
        "4. Shock Sensitivity: Six deterministic macroeconomic and household shock scenarios simulate real-life income disruptions and cost inflation.",
        "5. Explainability Governance: Reason codes are generated without black-box opaque weights, ensuring every conclusion is fully verifiable by the borrower and lender.",
    ]

    limitations = [
        "NexusFin provides financial health decision support and does not constitute credit approval, credit underwriting, or formal financial advice.",
        "Calculations rely upon user-entered or consented data; unstated informal debts or hidden fees will affect real-world outcomes.",
        "Thresholds are illustrative and should be calibrated with local financial-institution and regulatory partners during pilot deployment.",
    ]


    return {
        "explanation": explanation,
        "trade_offs": trade_offs,
        "recommendations": recommendations,
        "methodology": methodology,
        "limitations": limitations,
    }
