"""Consent management and audit logging endpoints."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from backend.app.models.schemas import ConsentUpdateRequest
from backend.app.storage.memory_db import (
    get_consents,
    update_consent,
    AUDIT_LOGS,
)

router = APIRouter(prefix="/api", tags=["Governance & Consent"])


@router.get("/consent")
def list_consents():
    """Returns registered data sources and their active consent status."""
    return {"consents": list(get_consents().values())}


@router.post("/consent")
def set_consent(req: ConsentUpdateRequest):
    """Updates consent status for a specific data source."""
    try:
        updated = update_consent(req.source_id, req.granted, actor=req.actor)
        return {"status": "success", "consent": updated}
    except KeyError:
        raise HTTPException(status_code=404, detail="Consent source not found")


@router.get("/audit-log")
def get_audit_trail():
    """Returns the immutable governance audit trail for regulatory inspection."""
    return {
        "count": len(AUDIT_LOGS),
        "logs": [entry.model_dump() for entry in AUDIT_LOGS],
    }
