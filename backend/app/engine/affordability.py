"""Deterministic loan calculation and cash-flow affordability engine."""
from __future__ import annotations

import math
from backend.app.models.schemas import CreditOffer, Profile, AffordabilityMetrics


def calculate_monthly_payment(offer: CreditOffer) -> float:
    """Calculates monthly payment based on amortizing or flat-rate repayment models."""
    p = offer.principal
    n = offer.term_months
    r_annual = offer.annual_interest_rate

    if n <= 0:
        raise ValueError("Term in months must be greater than 0")

    if offer.repayment_type == "flat":
        # Flat interest: Total interest = P * (r / 100) * (n / 12)
        total_interest = p * (r_annual / 100.0) * (n / 12.0)
        base_monthly = (p + total_interest) / n
    else:
        # Standard reducing-balance amortization
        r_monthly = (r_annual / 100.0) / 12.0
        if r_monthly == 0:
            base_monthly = p / n
        else:
            base_monthly = p * (r_monthly * (1 + r_monthly) ** n) / (((1 + r_monthly) ** n) - 1)

    return round(base_monthly + offer.monthly_fee, 2)


def calculate_offer_totals(offer: CreditOffer) -> dict:
    """Calculates comprehensive cost metrics for a given credit offer."""
    monthly_pay = calculate_monthly_payment(offer)
    total_repayment = round((monthly_pay * offer.term_months) + offer.upfront_fee, 2)
    total_cost_of_credit = round(total_repayment - offer.principal, 2)
    effective_apr = 0.0
    if offer.principal > 0 and offer.term_months > 0:
        # Annualized total financing fee ratio
        effective_apr = round((total_cost_of_credit / offer.principal) * (12.0 / offer.term_months) * 100.0, 2)

    return {
        "monthly_payment": monthly_pay,
        "total_repayment": total_repayment,
        "total_cost_of_credit": max(0.0, total_cost_of_credit),
        "effective_cost_ratio_pct": max(0.0, effective_apr),
    }


def compute_affordability_metrics(profile: Profile, offer: CreditOffer) -> AffordabilityMetrics:
    """Computes transparent cash flow impact metrics."""
    income = profile.income.monthly
    essential_exp = profile.essential_expenses
    existing_debt = profile.existing_debt_payments
    offer_costs = calculate_offer_totals(offer)
    new_monthly_pay = offer_costs["monthly_payment"]

    # Available cash flow BEFORE the proposed loan:
    # Important: Planned goal savings is deliberately NOT subtracted as an expense/debt!
    base_available = income - essential_exp - existing_debt

    # Monthly cash flow remaining AFTER servicing the proposed loan:
    post_credit_buffer = base_available - new_monthly_pay

    # Combined debt service burden (Existing debt + New loan repayment as % of income)
    if income > 0:
        debt_service_burden = ((existing_debt + new_monthly_pay) / income) * 100.0
    else:
        debt_service_burden = 100.0

    # Emergency savings buffer (in months of essential expenditure)
    if essential_exp > 0:
        savings_months = profile.liquid_savings / essential_exp
    else:
        savings_months = None

    return AffordabilityMetrics(
        base_available_cash_flow=round(base_available, 2),
        monthly_repayment=round(new_monthly_pay, 2),
        total_repayment=round(offer_costs["total_repayment"], 2),
        total_cost_of_credit=round(offer_costs["total_cost_of_credit"], 2),
        post_credit_buffer=round(post_credit_buffer, 2),
        debt_service_burden_pct=round(debt_service_burden, 2),
        liquid_savings_months=round(savings_months, 2) if savings_months is not None else None,
        effective_monthly_commitment=round(existing_debt + new_monthly_pay, 2),
    )


def classify_affordability(
    metrics: AffordabilityMetrics,
    income: float,
    variability_pct: float
) -> tuple[str, str, str]:
    """
    Classifies credit fit based on multi-factor affordability criteria.
    Returns: (status, status_label, reason)
    """
    if income <= 0:
        return (
            "high-pressure",
            "High Affordability Pressure",
            "Zero or negative monthly income provided. Credit cannot be serviced without reliable income."
        )

    buffer = metrics.post_credit_buffer
    burden = metrics.debt_service_burden_pct

    # Critical pressure: Negative buffer or debt service burden exceeding 50%
    if buffer < 0:
        return (
            "high-pressure",
            "High Affordability Pressure",
            f"The proposed repayment exceeds your available monthly cash flow by {abs(buffer):,.2f}, resulting in an immediate cash deficit."
        )

    if burden > 50.0:
        return (
            "high-pressure",
            "High Debt-Service Concentration",
            f"Combined debt repayments would consume {burden:.1f}% of your monthly income (above standard 50% safety limits)."
        )

    # Review zone: Buffer is thin (< 12% of income), burden is 40-50%, or high income variability (> 30%)
    buffer_ratio = buffer / income
    if buffer_ratio < 0.12:
        return (
            "review",
            "Review Carefully — Thin Cash Buffer",
            f"The remaining monthly buffer ({buffer:,.2f}) is narrow ({buffer_ratio*100:.1f}% of income), leaving little room for unexpected living costs."
        )

    if burden > 38.0:
        return (
            "review",
            "Review Carefully — Elevated Debt Burden",
            f"Combined debt obligations represent {burden:.1f}% of your income. Extra caution is advised."
        )

    if variability_pct >= 30.0 and buffer_ratio < 0.20:
        return (
            "review",
            "Review Carefully — Volatile Income",
            f"Income variability is high ({variability_pct:.0f}%), making the {buffer:,.2f} buffer vulnerable during lower-earning months."
        )

    # Manageable fit: Healthy buffer and balanced debt service burden
    return (
        "fits",
        "Looks Manageable Under Current Conditions",
        f"Available monthly cash flow retains a positive buffer of {buffer:,.2f} with a manageable debt burden of {burden:.1f}%."
    )
