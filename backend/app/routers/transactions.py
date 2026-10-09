"""Alternative data and transaction categorization endpoints."""
from __future__ import annotations

import os
from fastapi import APIRouter, File, UploadFile, HTTPException
from backend.app.config import DATA_DIR
from backend.app.engine.alternative_data import process_transaction_csv
from backend.app.storage.memory_db import record_audit

router = APIRouter(prefix="/api/transactions", tags=["Alternative Data"])


MAX_CSV_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("")
async def upload_transactions(file: UploadFile = File(...)):
    """Uploads a transaction export CSV and extracts alternative cash flow signals."""
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are supported.")

    content = await file.read(MAX_CSV_SIZE + 1)
    if len(content) > MAX_CSV_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File size exceeds maximum allowable limit of 5MB."
        )

    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    try:
        res = process_transaction_csv(text)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    safe_filename = os.path.basename(file.filename)[:100]
    record_audit(
        event_type="TRANSACTIONS_INGESTED",
        actor="consumer",
        details={
            "filename": safe_filename,
            "transaction_count": res.summary["transaction_count"],
            "total_inflows": res.summary["total_inflows"],
        }
    )

    return res


@router.get("/sample/{persona_key}")
def get_sample_transactions(persona_key: str):
    """Provides curated sample transactions for demonstration."""
    filename_map = {
        "manila": "sample_transactions_manila_gig_rider.csv",
        "kenya": "sample_transactions_kenya_freelancer.csv",
        "jakarta": "sample_transactions_jakarta_merchant.csv",
    }

    target_file = filename_map.get(persona_key.lower())
    if not target_file:
        raise HTTPException(status_code=404, detail=f"Sample persona '{persona_key}' not found.")

    path = DATA_DIR / target_file
    if not path.exists():
        raise HTTPException(status_code=404, detail="Sample dataset file missing on server.")

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    res = process_transaction_csv(content)
    return res
