"""Partner and Lender Underwriting Portal endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, status
from backend.app.models.schemas import PartnerDecisionRequest
from backend.app.models.auth import UserProfileResponse
from backend.app.storage.memory_db import RECENT_ASSESSMENTS, record_audit, record_underwriter_decision
from backend.app.storage.auth_db import get_user_by_token

router = APIRouter(prefix="/api/partner", tags=["Partner & Lender Portal"])


def require_underwriter(authorization: str | None = Header(default=None)) -> UserProfileResponse:
    """
    Enforces authentication and underwriter role verification.
    Non-registered and unauthorized users are forbidden from viewing portfolios or approving credit facilities.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: Non-registered users cannot access the underwriter review queue or approve facilities. Please sign in as an Institutional Underwriter.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization[len("Bearer "):].strip()
    user = get_user_by_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or credentials are invalid. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.role != "underwriter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Only verified institutional underwriters may review borrower portfolios or approve credit facilities.",
        )

    return user


@router.get("/assessments")
def get_partner_assessments(user: UserProfileResponse = Depends(require_underwriter)):
    """
    Returns submitted assessments available for institutional review with borrower consent.
    Requires an authenticated institutional underwriter account.
    """
    record_audit(
        event_type="PARTNER_REVIEW_ACCESSED",
        actor=f"{user.email} (underwriter)",
        details={"records_reviewed": len(RECENT_ASSESSMENTS), "officer": user.full_name}
    )

    return {
        "status": "authorized",
        "partner_organization": user.organization or "Inclusive Credit Partner Alliance",
        "officer": user.full_name,
        "disclaimer": "NexusFin provides decision support. Final credit decisions remain with the financial institution.",
        "records_count": len(RECENT_ASSESSMENTS),
        "assessments": RECENT_ASSESSMENTS,
    }


@router.post("/decision")
def record_decision(req: PartnerDecisionRequest, user: UserProfileResponse = Depends(require_underwriter)):
    """
    Records an underwriter decision (approved, conditional, declined) with rationale note into the governance audit trail.
    Strictly restricted to registered institutional underwriters. Non-registered visitors cannot approve loans.
    """
    try:
        officer_name = req.officer_name or user.full_name
        updated_assessment = record_underwriter_decision(
            assessment_id=req.assessment_id,
            decision=req.decision,
            rationale=req.rationale,
            officer_name=f"{officer_name} ({user.email})",
        )
        return {
            "status": "success",
            "message": f"Decision '{req.decision}' recorded successfully by underwriter {user.full_name}.",
            "assessment": updated_assessment,
        }
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
