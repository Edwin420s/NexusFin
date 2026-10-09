"""Partner and Lender Underwriting Portal endpoints."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from backend.app.models.schemas import PartnerDecisionRequest
from backend.app.storage.memory_db import RECENT_ASSESSMENTS, record_audit, record_underwriter_decision

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
        "partner_organization": "Inclusive Credit Partner Alliance",
        "disclaimer": "NexusFin provides decision support. Final credit decisions remain with the financial institution.",
        "records_count": len(RECENT_ASSESSMENTS),
        "assessments": RECENT_ASSESSMENTS,
    }


@router.post("/decision")
def record_decision(req: PartnerDecisionRequest):
    """
    Records an underwriter decision (approved, conditional, declined) with rationale note into the governance audit trail.
    """
    try:
        updated_assessment = record_underwriter_decision(
            assessment_id=req.assessment_id,
            decision=req.decision,
            rationale=req.rationale,
            officer_name=req.officer_name,
        )
        return {
            "status": "success",
            "message": f"Decision '{req.decision}' recorded successfully.",
            "assessment": updated_assessment,
        }
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
