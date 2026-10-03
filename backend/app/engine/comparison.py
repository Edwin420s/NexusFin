"""Multi-offer credit comparison and Key Facts Statement engine."""
from __future__ import annotations

from backend.app.models.schemas import Profile, CreditOffer
from backend.app.engine.affordability import (
    calculate_offer_totals,
    compute_affordability_metrics,
    classify_affordability,
)
from backend.app.engine.stress_test import run_stress_scenarios
from backend.app.engine.resilience import compute_resilience_index


def compare_credit_offers(profile: Profile, offers: list[CreditOffer]) -> dict:
    """
    Evaluates and compares multiple competing credit offers using identical
    household cash-flow baselines.
    """
    comparison_rows = []
    income = profile.income.monthly

    for offer in offers:
        metrics = compute_affordability_metrics(profile, offer)
        status, label, reason = classify_affordability(metrics, income, profile.income.variability_pct)
        scenarios = run_stress_scenarios(profile, metrics.monthly_repayment)
        resilience = compute_resilience_index(profile, metrics, scenarios)

        # Count scenarios where cash flow remains positive
        survived_scenarios = sum(1 for s in scenarios if s.is_positive)

        comparison_rows.append({
            "offer_name": offer.name,
            "provider": offer.provider,
            "principal": offer.principal,
            "term_months": offer.term_months,
            "annual_interest_rate": offer.annual_interest_rate,
            "repayment_type": offer.repayment_type,
            "upfront_fee": offer.upfront_fee,
            "monthly_fee": offer.monthly_fee,
            "monthly_repayment": metrics.monthly_repayment,
            "total_repayment": metrics.total_repayment,
            "total_cost_of_credit": metrics.total_cost_of_credit,
            "post_credit_buffer": metrics.post_credit_buffer,
            "debt_service_burden_pct": metrics.debt_service_burden_pct,
            "status": status,
            "status_label": label,
            "resilience_score": resilience.total_score,
            "resilience_tier": resilience.tier,
            "shock_survivability": f"{survived_scenarios} of 6",
            "is_best_monthly": False,
            "is_lowest_total_cost": False,
            "is_highest_resilience": False,
        })

    if comparison_rows:
        # Mark best attributes
        lowest_monthly = min(r["monthly_repayment"] for r in comparison_rows)
        lowest_total = min(r["total_cost_of_credit"] for r in comparison_rows)
        highest_resil = max(r["resilience_score"] for r in comparison_rows)

        for r in comparison_rows:
            if r["monthly_repayment"] == lowest_monthly:
                r["is_best_monthly"] = True
            if r["total_cost_of_credit"] == lowest_total:
                r["is_lowest_total_cost"] = True
            if r["resilience_score"] == highest_resil:
                r["is_highest_resilience"] = True

    # Generate comparative Key Facts guidance
    summary_notes = []
    if len(comparison_rows) >= 2:
        diff_total = abs(comparison_rows[0]["total_cost_of_credit"] - comparison_rows[1]["total_cost_of_credit"])
        summary_notes.append(
            f"Comparing '{comparison_rows[0]['offer_name']}' vs '{comparison_rows[1]['offer_name']}': "
            f"Choosing the more affordable financing option could save you {profile.currency} {diff_total:,.2f} in total borrowing fees."
        )

    return {
        "currency": profile.currency,
        "offers_compared": len(comparison_rows),
        "results": comparison_rows,
        "comparative_notes": summary_notes,
    }
