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

# Cached assessments for partner/lender inspection
RECENT_ASSESSMENTS: list[dict] = []


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
