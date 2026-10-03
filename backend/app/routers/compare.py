"""Multi-offer credit comparison endpoints."""
from __future__ import annotations

from fastapi import APIRouter
from backend.app.models.schemas import CompareRequest
from backend.app.engine.comparison import compare_credit_offers
from backend.app.storage.memory_db import record_audit

router = APIRouter(prefix="/api", tags=["Comparison"])


@router.post("/compare")
def compare_offers(req: CompareRequest):
    """Compares multiple credit offers using consistent financial profile baselines."""
    result = compare_credit_offers(req.profile, req.offers)

    record_audit(
        event_type="COMPARISON_PERFORMED",
        actor="consumer",
        details={
            "currency": req.profile.currency,
            "offer_count": len(req.offers),
            "offers": [o.name for o in req.offers],
        }
    )

    return result
