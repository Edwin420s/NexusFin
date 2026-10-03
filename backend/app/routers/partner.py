"""Partner and Lender Underwriting Portal endpoints."""
from __future__ import annotations

from fastapi import APIRouter
from backend.app.storage.memory_db import RECENT_ASSESSMENTS, record_audit

router = APIRouter(prefix="/api/partner", tags=["Partner & Lender Portal"])


@router.get("/assessments")
def get_partner_assessments():
    """
    Returns submitted assessments available for institutional review with borrower consent.
    """
    record_audit(
        event_type="PARTNER_REVIEW_ACCESSED",
        actor="lending_officer",
        details={"records_reviewed": len(RECENT_ASSESSMENTS)}
    )

    return {
        "status": "authorized",
        "partner_organization": "ASEAN Microfinance & Inclusive Credit Alliance",
        "records_count": len(RECENT_ASSESSMENTS),
        "assessments": RECENT_ASSESSMENTS,
    }
