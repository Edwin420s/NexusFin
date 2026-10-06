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
        scenarios = run_stress_scenarios(profile, metrics.monthly_repayment)
        status, label, reason = classify_affordability(metrics, income, profile.income.variability_pct, scenarios=scenarios)
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
        # Compare row 0 vs row 1
        r0 = comparison_rows[0]
        r1 = comparison_rows[1]
        diff_total = abs(r0["total_cost_of_credit"] - r1["total_cost_of_credit"])
        diff_monthly = abs(r0["monthly_repayment"] - r1["monthly_repayment"])

        if r0["monthly_repayment"] > r1["monthly_repayment"] and r0["total_cost_of_credit"] < r1["total_cost_of_credit"]:
            summary_notes.append(
                f"'{r1['offer_name']}' reduces monthly pressure by {profile.currency} {diff_monthly:,.2f}/mo "
                f"but costs {profile.currency} {diff_total:,.2f} more overall in total financing charges. That is informed choice."
            )
        elif r1["monthly_repayment"] > r0["monthly_repayment"] and r1["total_cost_of_credit"] < r0["total_cost_of_credit"]:
            summary_notes.append(
                f"'{r0['offer_name']}' reduces monthly pressure by {profile.currency} {diff_monthly:,.2f}/mo "
                f"but costs {profile.currency} {diff_total:,.2f} more overall in total financing charges. That is informed choice."
            )
        else:
            summary_notes.append(
                f"Comparing '{r0['offer_name']}' vs '{r1['offer_name']}': "
                f"Selecting the lower-cost option saves {profile.currency} {diff_total:,.2f} in cumulative borrowing fees."
            )

        # Highlight shock resilience trade-off
        best_resil_row = max(comparison_rows, key=lambda r: (r["post_credit_buffer"], r["shock_survivability"]))
        summary_notes.append(
            f"Resilience Insight: '{best_resil_row['offer_name']}' maintains the highest post-loan buffer ({profile.currency} {best_resil_row['post_credit_buffer']:,.2f}/mo), "
            f"providing the strongest cushion against simulated income disruptions."
        )

    return {
        "currency": profile.currency,
        "offers_compared": len(comparison_rows),
        "results": comparison_rows,
        "comparative_notes": summary_notes,
    }

