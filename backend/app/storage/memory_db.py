"""In-memory data store for stateful demo sessions, consent registry, and audit logging."""
import uuid
from datetime import datetime, timezone
from backend.app.models.audit import AuditLogEntry

# Standard Consented Data Sources aligned with ASEAN Personal Data Protection & Open Finance Principles
DEFAULT_CONSENTS = {
    "bank_wallet_transactions": {
        "source_id": "bank_wallet_transactions",
        "title": "Bank & Mobile Money Transactions",
        "description": "Historical cash flow inflows and recurring merchant debits (e.g., GCash, Maya, M-Pesa, GoPay).",
        "purpose": "Verify regular income patterns, calculate cash-flow volatility, and detect existing debt obligations.",
        "legal_basis": "Explicit Consumer Consent (Informed)",
        "retention_period": "30 days (Ephemeral Session Cache)",
        "granted": True,
    },
    "liquid_savings_data": {
        "source_id": "liquid_savings_data",
        "title": "Savings & Emergency Buffer Balances",
        "description": "Verified balances in liquid savings deposits or digital piggybanks.",
        "purpose": "Evaluate emergency shock survivability and savings runway without treating savings as debt collateral.",
        "legal_basis": "Explicit Consumer Consent (Informed)",
        "retention_period": "30 days",
        "granted": True,
    },
    "business_sales_cashflow": {
        "source_id": "business_sales_cashflow",
        "title": "MSME / Marketplace Cash Flow",
        "description": "E-commerce or point-of-sale merchant turnover (e.g. Shopee, Lazada, Tokopedia, Grab, Foodpanda).",
        "purpose": "Assess informal or micro-enterprise revenue regularity for thin-file micro-entrepreneurs.",
        "legal_basis": "Explicit Consumer Consent (Informed)",
        "retention_period": "60 days",
        "granted": True,
    },
    "utility_telecom_payments": {
        "source_id": "utility_telecom_payments",
        "title": "Utility & Telecom Bill Consistency",
        "description": "Recurring power, water, and mobile broadband payment regularity.",
        "purpose": "Alternative payment discipline signal for households lacking formal bureau histories.",
        "legal_basis": "Explicit Consumer Consent (Informed)",
        "retention_period": "30 days",
        "granted": False,
    },
}

# Audit trail registry
AUDIT_LOGS: list[AuditLogEntry] = []

# Cached assessments for partner/lender inspection (Pre-seeded with 3 illustrative demo applicants)
RECENT_ASSESSMENTS: list[dict] = [
    {
        "applicant_name": "Carlos M. — Manila Gig Delivery Rider",
        "applicant_type": "Illustrative demo applicant",
        "status": "review",
        "status_label": "Manageable today — vulnerable under income shock",
        "status_reason": "Your proposed repayment fits your declared monthly cash flow. However, a 25% income reduction would create a monthly deficit of ₱1,046, while the combined stress scenario produces a ₱5,246 deficit.",
        "currency": "PHP",
        "currency_symbol": "₱",
        "offer": {
            "name": "Digital Fast Microloan",
            "provider": "Digital Nano-Fintech",
            "principal": 35000,
            "annual_interest_rate": 24.0,
            "term_months": 10,
            "purpose": "Asset Acquisition / Smartphone & Bike Upgrade",
            "monthly_payment": 4046.43,
            "total_repayment": 41264.30,
            "total_cost_of_credit": 6264.30,
        },
        "metrics": {
            "post_credit_buffer": 8453.57,
            "after_savings_buffer": 5453.57,
            "goal_savings": 3000.0,
            "debt_service_burden_pct": 22.5,
            "base_available_cash_flow": 12500.0,
            "liquid_savings_months": 0.86,
            "monthly_repayment": 4046.43,
            "total_repayment": 41264.30,
            "total_cost_of_credit": 6264.30,
            "effective_monthly_commitment": 8546.43,
        },
        "resilience": {
            "conclusion": "Manageable today — vulnerable under income shock",
            "baseline_status": "Manageable",
            "resilience_status": "Needs Review",
            "monthly_buffer": 8453.57,
            "debt_service_burden_pct": 22.5,
            "liquid_savings_months": 0.86,
            "shock_deficit_25": -1046.43,
            "combined_deficit": -5246.43,
            "survived_scenarios_count": 3,
            "total_scenarios_count": 6,
            "tier": "Moderate Resilience",
            "summary": "Baseline cash flow provides ₱8,454 buffer. Vulnerable under 25% income disruption.",
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "applicant_name": "Aisha K. — Nairobi MSME Digital Creator",
        "applicant_type": "Illustrative demo applicant",
        "status": "fits",
        "status_label": "Comfortably Manageable Across Baseline & Shocks",
        "status_reason": "Strong net operating margin and emergency savings buffer of 1.4 months comfortably absorbs equipment instalments.",
        "currency": "KES",
        "currency_symbol": "KSh",
        "offer": {
            "name": "MSME Equipment Facility",
            "provider": "Community Micro-Lender",
            "principal": 60000,
            "annual_interest_rate": 18.0,
            "term_months": 12,
            "purpose": "Working Capital / Studio Equipment",
            "monthly_payment": 5503.20,
            "total_repayment": 67038.40,
            "total_cost_of_credit": 7038.40,
        },
        "metrics": {
            "post_credit_buffer": 19496.80,
            "after_savings_buffer": 14496.80,
            "goal_savings": 5000.0,
            "debt_service_burden_pct": 20.8,
            "base_available_cash_flow": 25000.0,
            "liquid_savings_months": 1.41,
            "monthly_repayment": 5503.20,
            "total_repayment": 67038.40,
            "total_cost_of_credit": 7038.40,
            "effective_monthly_commitment": 13503.20,
        },
        "resilience": {
            "conclusion": "Comfortably manageable across baseline and stress scenarios",
            "baseline_status": "Manageable",
            "resilience_status": "Manageable",
            "monthly_buffer": 19496.80,
            "debt_service_burden_pct": 20.8,
            "liquid_savings_months": 1.41,
            "shock_deficit_25": 3246.80,
            "combined_deficit": -3153.20,
            "survived_scenarios_count": 5,
            "total_scenarios_count": 6,
            "tier": "High Resilience",
            "summary": "Robust cash-flow buffer and liquid reserves maintain positive margins across 5 of 6 stress scenarios.",
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "applicant_name": "Dewi S. — Jakarta Warung Small Trader",
        "applicant_type": "Illustrative demo applicant",
        "status": "review",
        "status_label": "Review Carefully — High Inventory Turnover",
        "status_reason": "Flat-rate loan structure increases effective borrowing cost. Thin cash-flow cushion requires strict inventory monitoring.",
        "currency": "IDR",
        "currency_symbol": "Rp",
        "offer": {
            "name": "Koperasi Inventory Loan",
            "provider": "Local Traders Cooperative",
            "principal": 10000000,
            "annual_interest_rate": 15.0,
            "term_months": 12,
            "purpose": "Working Capital / Kiosk Goods",
            "monthly_payment": 958333.33,
            "total_repayment": 11650000.0,
            "total_cost_of_credit": 1650000.0,
        },
        "metrics": {
            "post_credit_buffer": 1841666.67,
            "after_savings_buffer": 1041666.67,
            "goal_savings": 800000.0,
            "debt_service_burden_pct": 22.7,
            "base_available_cash_flow": 2800000.0,
            "liquid_savings_months": 1.09,
            "monthly_repayment": 958333.33,
            "total_repayment": 11650000.0,
            "total_cost_of_credit": 1650000.0,
            "effective_monthly_commitment": 2158333.33,
        },
        "resilience": {
            "conclusion": "Manageable today — vulnerable under revenue contraction",
            "baseline_status": "Manageable",
            "resilience_status": "Needs Review",
            "monthly_buffer": 1841666.67,
            "debt_service_burden_pct": 22.7,
            "liquid_savings_months": 1.09,
            "shock_deficit_25": -533333.33,
            "combined_deficit": -1633333.33,
            "survived_scenarios_count": 3,
            "total_scenarios_count": 6,
            "tier": "Moderate Resilience",
            "summary": "Current turnover covers loan, but 25% sales contraction results in deficit. Recommend reducing principal or negotiating amortizing rate.",
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
]


def record_audit(event_type: str, actor: str, details: dict) -> AuditLogEntry:
    entry = AuditLogEntry(
        id=f"aud_{uuid.uuid4().hex[:10]}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        event_type=event_type,
        actor=actor,
        details=details,
        data_retention_days=90,
    )
    AUDIT_LOGS.insert(0, entry)
    if len(AUDIT_LOGS) > 100:
        AUDIT_LOGS.pop()
    return entry


def get_consents() -> dict:
    return DEFAULT_CONSENTS


def update_consent(source_id: str, granted: bool, actor: str = "consumer") -> dict:
    if source_id in DEFAULT_CONSENTS:
        DEFAULT_CONSENTS[source_id]["granted"] = granted
        event = "CONSENT_GRANTED" if granted else "CONSENT_REVOKED"
        record_audit(
            event_type=event,
            actor=actor,
            details={
                "source_id": source_id,
                "title": DEFAULT_CONSENTS[source_id]["title"],
                "status": "granted" if granted else "revoked"
            }
        )
        return DEFAULT_CONSENTS[source_id]
    raise KeyError(f"Unknown consent source: {source_id}")


def store_assessment(assessment_data: dict) -> None:
    RECENT_ASSESSMENTS.insert(0, assessment_data)
    if len(RECENT_ASSESSMENTS) > 20:
        RECENT_ASSESSMENTS.pop()
