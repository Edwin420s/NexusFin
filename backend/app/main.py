"""Main FastAPI application entry point for NexusFin."""
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.app.config import (
    APP_NAME,
    APP_DESCRIPTION,
    APP_VERSION,
    FRONTEND_DIR,
)
from backend.app.routers import assess, compare, transactions, consent, partner, pitch_deck

app = FastAPI(
    title=f"{APP_NAME} API",
    description=APP_DESCRIPTION,
    version=APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for local testing and external client integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(assess.router)
app.include_router(compare.router)
app.include_router(transactions.router)
app.include_router(consent.router)
app.include_router(partner.router)
app.include_router(pitch_deck.router)


@app.get("/api/health")
def health():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "product": APP_NAME,
        "version": APP_VERSION,
    }


# Static file serving & Single Page App routing
if FRONTEND_DIR.exists():
    @app.get("/", include_in_schema=False)
    def index():
        return FileResponse(FRONTEND_DIR / "index.html")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend_assets(full_path: str):
        target = FRONTEND_DIR / full_path
        if target.is_file():
            return FileResponse(target)
        # SPA fallback to index.html
        return FileResponse(FRONTEND_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
