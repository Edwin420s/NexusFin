"""Assessment endpoints for NexusFin."""
from __future__ import annotations

from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from backend.app.models.schemas import AssessmentRequest, AssessmentResponse, Profile, CreditOffer
from backend.app.config import CURRENCY_CONFIG
from backend.app.engine.affordability import (
    calculate_offer_totals,
    compute_affordability_metrics,
    classify_affordability,
)
from backend.app.engine.stress_test import run_stress_scenarios
from backend.app.engine.resilience import compute_resilience_index
from backend.app.engine.explainability import generate_explanation
from backend.app.storage.memory_db import record_audit, store_assessment

router = APIRouter(prefix="/api", tags=["Assessment"])

# Realistic personas for ASEAN Financial Health Challenge
PERSONA_PRESETS = [
    {
        "id": "carlos_manila",
        "label": "Carlos — Manila Food & Delivery Gig Rider (PHP)",
        "country": "Philippines",
        "description": "Earns variable gig income across Grab and Foodpanda. Seeking loan for motorcycle repair and smartphone upgrade.",
        "profile": {
            "currency": "PHP",
            "income": {"monthly": 38000, "variability_pct": 25.0, "employment_type": "gig_worker"},
            "essential_expenses": 21000,
            "existing_debt_payments": 4500,
            "liquid_savings": 18000,
            "goal_savings": 3000,
            "household_dependents": 2,
        },
        "offer": {
            "name": "Digital Fast Microloan",
            "provider": "Digital Nano-Fintech",
            "principal": 35000,
            "annual_interest_rate": 24.0,
            "term_months": 10,
            "upfront_fee": 800,
            "monthly_fee": 150,
            "repayment_type": "amortizing",
            "purpose": "Asset Acquisition",
        },
    },
    {
        "id": "aisha_nairobi",
        "label": "Aisha — Nairobi Digital MSME & Freelancer (KES)",
        "country": "Kenya",
        "description": "Graphic designer and micro-merchant using M-Pesa. Seeking working capital to purchase equipment.",
        "profile": {
            "currency": "KES",
            "income": {"monthly": 65000, "variability_pct": 20.0, "employment_type": "freelance_msme"},
            "essential_expenses": 32000,
            "existing_debt_payments": 8000,
            "liquid_savings": 45000,
            "goal_savings": 5000,
            "household_dependents": 1,
        },
        "offer": {
            "name": "MSME Equipment Facility",
            "provider": "Community Micro-Lender",
            "principal": 60000,
            "annual_interest_rate": 18.0,
            "term_months": 12,
            "upfront_fee": 1000,
            "monthly_fee": 0,
            "repayment_type": "amortizing",
            "purpose": "Working Capital / MSME",
        },
    },
    {
        "id": "dewi_jakarta",
        "label": "Dewi — Jakarta Warung Small Trader (IDR)",
        "country": "Indonesia",
        "description": "Small kiosk retailer with high inventory turnover and modest savings buffer.",
        "profile": {
            "currency": "IDR",
            "income": {"monthly": 9500000, "variability_pct": 18.0, "employment_type": "informal_trader"},
            "essential_expenses": 5500000,
            "existing_debt_payments": 1200000,
            "liquid_savings": 6000000,
            "goal_savings": 800000,
            "household_dependents": 3,
        },
        "offer": {
            "name": "Koperasi Inventory Loan",
            "provider": "Local Traders Cooperative",
            "principal": 10000000,
            "annual_interest_rate": 15.0,
            "term_months": 12,
            "upfront_fee": 150000,
            "monthly_fee": 0,
            "repayment_type": "flat",
            "purpose": "Working Capital / MSME",
        },
    },
]


@router.get("/presets")
def get_presets():
    """Returns curated demo personas reflecting ASEAN financial contexts."""
    return {"presets": PERSONA_PRESETS}


@router.post("/assess", response_model=AssessmentResponse)
def assess_credit(req: AssessmentRequest):
    """
    Evaluates credit affordability, stress resilience, and plain-language decision support.
    """
    profile = req.profile
    offer = req.offer

    # 1. Calculate deterministic offer details and affordability metrics
    offer_totals = calculate_offer_totals(offer)
    metrics = compute_affordability_metrics(profile, offer)

    # 2. Run multi-scenario stress test
    scenarios = run_stress_scenarios(profile, metrics.monthly_repayment)

    currency_meta = CURRENCY_CONFIG.get(profile.currency, {"symbol": profile.currency})
    currency_symbol = currency_meta.get("symbol", profile.currency)

    # 3. Classify status (incorporating stress test resilience)
    status, status_label, status_reason = classify_affordability(
        metrics, profile.income.monthly, profile.income.variability_pct, scenarios=scenarios, currency_symbol=currency_symbol
    )

    # 4. Compute Financial Resilience Index
    resilience = compute_resilience_index(profile, metrics, scenarios)

    # 5. Generate transparent explainability and recommendations
    expl_data = generate_explanation(profile, offer, metrics, resilience, scenarios, status)

    # Merge offer fields with computed totals
    enriched_offer = {
        **offer.model_dump(),
        **offer_totals,
    }

    response_data = AssessmentResponse(
        status=status,
        status_label=status_label,
        status_reason=status_reason,
        currency=profile.currency,
        currency_symbol=currency_symbol,
        offer=enriched_offer,
        metrics=metrics,
        resilience=resilience,
        scenarios=scenarios,
        explanation=expl_data["explanation"],
        trade_offs=expl_data["trade_offs"],
        recommendations=expl_data["recommendations"],
        methodology=expl_data["methodology"],
        limitations=expl_data["limitations"],
        generated_at=datetime.now(timezone.utc).isoformat(),
    )

    # Cache for partner underwriter review & record audit trail
    store_assessment(response_data.model_dump())
    record_audit(
        event_type="ASSESSMENT_PERFORMED",
        actor="consumer",
        details={
            "currency": profile.currency,
            "income": profile.income.monthly,
            "principal": offer.principal,
            "status": status,
            "resilience_score": resilience.total_score,
        }
    )

    return response_data
