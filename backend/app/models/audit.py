"""Audit trail and governance models."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal
from pydantic import BaseModel, Field


class AuditLogEntry(BaseModel):
    id: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    event_type: Literal[
        "CONSENT_GRANTED",
        "CONSENT_REVOKED",
        "ASSESSMENT_PERFORMED",
        "COMPARISON_PERFORMED",
        "TRANSACTIONS_INGESTED",
        "PARTNER_REVIEW_ACCESSED",
        "UNDERWRITER_DECISION_RECORDED",
        "ACCOUNT_REGISTERED",
        "USER_LOGIN",
        "USER_LOGOUT"
    ]
    actor: str
    details: dict
    data_retention_days: int = 90
