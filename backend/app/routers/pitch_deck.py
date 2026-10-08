"""Pitch Deck and Competition Deliverables router for NexusFin."""
from __future__ import annotations

import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from backend.app.config import BASE_DIR, APP_NAME

router = APIRouter(prefix="/api/pitch-deck", tags=["Platform Overview & Architecture"])
DOCS_DIR = BASE_DIR / "docs"
PDF_FILE_10_SLIDES = DOCS_DIR / "NexusFin_Pitch_Deck_10_Slides.pdf"
PDF_FILE_ORIGINAL = BASE_DIR / "Credit-access-is-not-the-same-as-credit-affordability.pdf"
if not PDF_FILE_ORIGINAL.exists():
    _ref_candidate = BASE_DIR / "Ref" / "Credit-access-is-not-the-same-as-credit-affordability.pdf"
    if _ref_candidate.exists():
        PDF_FILE_ORIGINAL = _ref_candidate




SLIDES_DATA = [
    {
        "slide_number": 1,
        "title": "NexusFin — Title & Positioning",
        "subtitle": "Responsible Credit Decision Support & Informed Choice Platform",
        "tagline": "Helping borrowers and lenders understand what credit is truly affordable before signing.",
        "key_points": [
            "Platform: NexusFin Responsible Credit Decision Support Platform",
            "Core Mission: Transparent affordability analytics & over-indebtedness prevention",
            "Architecture: Deterministic calculation engine + explainable translation layer",
            "Format: Full-stack responsive web application + RESTful OpenAPI backend"
        ],
        "category": "Vision"
    },
    {
        "slide_number": 2,
        "title": "The Problem — Credit Access Is Not Credit Affordability",
        "subtitle": "Digital lending scale without transparent affordability creates debt traps",
        "tagline": "Millions can borrow with one click, but have no way to test if repayments survive an income shock.",
        "key_points": [
            "Over 45% of emerging market adults report raising emergency funds is very difficult.",
            "Platform gig riders and MSMEs face high income volatility (20–40% month-to-month swings).",
            "Opaque flat-rate interest and hidden disbursement fees conceal the true cost of borrowing.",
            "Traditional credit scoring relies on static credit bureau records that thin-file borrowers lack."
        ],
        "category": "Problem"
    },
    {
        "slide_number": 3,
        "title": "The Solution — NexusFin",
        "subtitle": "An Explainable Financial Health & Credit Decision Support Platform",
        "tagline": "A transparent companion that stress-tests loan commitments before signing.",
        "key_points": [
            "NOT a 3-digit black-box credit score; NOT an automated robotic loan rejector.",
            "Pillar 1: Deterministic Affordability Engine (reducing-balance accounting, fee transparency).",
            "Pillar 2: Multi-Scenario Stress Testing (evaluates 10%, 25%, 40% income drops and cost inflation).",
            "Pillar 3: Standardized Key Facts Statement (side-by-side multi-offer ranking).",
            "Pillar 4: Consented Alternative Data (ingests M-Pesa, Grab, bank cash flows ethically)."
        ],
        "category": "Solution"
    },
    {
        "slide_number": 4,
        "title": "How It Works — End-to-End User Journey",
        "subtitle": "5 Simple Steps from Financial Profile to Informed Choice",
        "tagline": "Borrowers and loan officers gain instantaneous clarity on repayment resilience.",
        "key_points": [
            "1. Financial Profile: Consented cash flow data or self-declared income, essentials, and reserves.",
            "2. Offer Simulation: Actuarial math for reducing-balance vs flat-rate, fees, and real APR.",
            "3. Buffer & DTI: Calculates disposable post-loan surplus and debt-service burden percentage.",
            "4. 6-Scenario Stress Test: Macroeconomic & household shocks reveal potential deficits.",
            "5. Plain-Language Explainability: Transparent trade-offs, safety warnings, and negotiation guidance."
        ],
        "category": "Product"
    },
    {
        "slide_number": 5,
        "title": "Responsible AI & Alternative Data Engine",
        "subtitle": "Ethical Cash-Flow Categorization with Zero Creepy Surveillance",
        "tagline": "Deterministic actuarial safety combined with explainable language translation.",
        "key_points": [
            "Strict Privacy: Zero contact-list scraping, zero social-media tracking, zero biometric profiling.",
            "Pattern Detection: Ingests CSV transaction exports from bank accounts, mobile money, and merchant POS.",
            "Volatility Estimation: Computes Coefficient of Variation (CV) to model irregular gig cash flow.",
            "Deterministic Safety: 100% auditable formulas for financial math; NLP reserved strictly for plain-language explanations."
        ],
        "category": "Technology"
    },
    {
        "slide_number": 6,
        "title": "Demonstrating Impact — Manila Gig Rider Case Study",
        "subtitle": "Carlos: Delivery Rider Evaluating a ₱35,000 Microloan",
        "tagline": "How NexusFin prevents a default before the borrower commits.",
        "key_points": [
            "Stated Monthly Income: ₱38,000 (25% volatility) | Living Costs: ₱21,000 | Existing Debt: ₱4,500.",
            "Offered Loan: ₱35,000 over 10 months at 24% APR (₱4,046.43 monthly repayment).",
            "Base Case: ₱8,454 post-loan buffer (Manageable baseline at 22.5% debt service burden).",
            "25% Income Shock: Income drops to ₱28,500 → Carlos incurs a −₱1,046/mo cash deficit.",
            "Outcome: Status highlights: 'Manageable today, vulnerable under income shock' — guiding the borrower to sustainable terms."
        ],
        "category": "Impact"
    },
    {
        "slide_number": 7,
        "title": "Technical Architecture",
        "subtitle": "Modular API Architecture & Explainable Decision Support",
        "tagline": "Auditable tech stack with clear separation of math, analytics, and explainability.",
        "key_points": [
            "Deterministic Engine: Actuarial math for reducing-balance schedules, fees, and stress tests (zero AI black box).",
            "Alternative Data Analytics: Consented cash-flow pattern ingestion and income volatility modeling.",
            "Explainability Layer: Plain-language reason codes, trade-offs, and neutral decision considerations.",
            "Backend: High-performance Python / FastAPI modular REST API architecture with Pydantic v2 schemas."
        ],
        "category": "Architecture"
    },
    {
        "slide_number": 8,
        "title": "Measurable Financial Health Outcomes",
        "subtitle": "Aligning Borrower Well-Being with Institutional Risk Management",
        "tagline": "Driving concrete improvements across consumer resilience and lender portfolio quality.",
        "key_points": [
            "Over-Indebtedness Prevention: Quantifiably reduces loans disbursed with >40% DTI or negative shock buffers.",
            "Informed Consumer Choice: Borrowers accurately understand full financing costs and flat-rate markups.",
            "Inclusive Underwriting: Empowers creditworthy thin-file workers to prove affordability via cash flows.",
            "Pilot KPIs: Assessment completion rate, offer comparison adoption, and 90-day delinquency reduction."
        ],
        "category": "Metrics"
    },
    {
        "slide_number": 9,
        "title": "Business Model & Sustainability",
        "subtitle": "Dual B2B / B2B2C Commercial Strategy",
        "tagline": "Free consumer utility supported by enterprise underwriting & employer wellness tiers.",
        "key_points": [
            "B2B SaaS / API: Digital lenders, microfinance NGOs, and rural banks pay per assessment API call.",
            "Employer & Platform Perks: Gig platforms (Grab, Foodpanda) sponsor financial wellness tools for contractors.",
            "Free Consumer Tool: Direct consumer workspace remains 100% free and unbiased to protect public trust.",
            "Unit Economics: Minimal marginal server cost per assessment allows rapid regional scale."
        ],
        "category": "Business Model"
    },
    {
        "slide_number": 10,
        "title": "Deployment Roadmap & Scalability",
        "subtitle": "From Pilot Deployment to Industry Financial Health Standard",
        "tagline": "A phased rollout across inclusive lenders, microfinance institutions, and digital banks.",
        "key_points": [
            "Phase 1 (Pilot Scoping): Controlled institutional deployment with partner digital and community lenders.",
            "Phase 2 (Underwriting Pilot): Onboard 1,000 thin-file gig and informal workers; validate delinquency reduction vs control.",
            "Phase 3 (Multi-Currency Localization): Regional expansion across emerging and frontier credit markets.",
            "Long-Term Vision: Ubiquitous responsible credit decision support for all consumer and MSME borrowers."
        ],
        "category": "Roadmap"
    }
]

OFFICIAL_SUBMISSION = {
    "project_name": APP_NAME,
    "applicant": "Edwin Mwiti",
    "team_name": "NexusFin",
    "description": (
        "NexusFin is a responsible credit decision-support platform that helps consumers understand whether "
        "credit is affordable, appropriate, and resilient to financial shocks before they commit. It analyzes "
        "income, essential expenses, existing obligations, savings, and credit terms; calculates affordability "
        "and total borrowing cost; compares options; and stress-tests scenarios such as income loss or rising "
        "expenses. It explains the key factors and trade-offs in plain language rather than relying on an opaque "
        "credit score. With consent, NexusFin can also use relevant alternative financial data to support "
        "underserved and thin-file borrowers while maintaining privacy, transparency, and human oversight."
    ),
    "platform_description": (
        "NexusFin is a responsible credit decision-support platform that helps consumers understand whether "
        "credit is affordable, appropriate, and resilient to financial shocks before they commit. It analyzes "
        "income, essential expenses, existing obligations, savings, and credit terms; calculates affordability "
        "and total borrowing cost; compares options; and stress-tests scenarios such as income loss or rising "
        "expenses. It explains the key factors and trade-offs in plain language rather than relying on an opaque "
        "credit score. With consent, NexusFin can also use relevant alternative financial data to support "
        "underserved and thin-file borrowers while maintaining privacy, transparency, and human oversight."
    ),
    "word_count": 98,
    "readiness_level": "Production-Ready Modular Architecture",
    "repo_status": "Clean Architecture, Fully Tested Local Repository"
}


@router.get("/info")
def get_pitch_deck_info():
    """Returns metadata about the pitch deck and submission profile."""
    has_10_slides_pdf = PDF_FILE_10_SLIDES.exists()
    has_original_pdf = PDF_FILE_ORIGINAL.exists()

    return {
        "status": "ready",
        "submission": OFFICIAL_SUBMISSION,
        "slides_count": len(SLIDES_DATA),
        "files": {
            "pitch_deck_10_slides": {
                "available": has_10_slides_pdf,
                "filename": "NexusFin_Pitch_Deck_10_Slides.pdf",
                "download_url": "/api/pitch-deck/download",
                "view_url": "/api/pitch-deck/view",
                "size_bytes": PDF_FILE_10_SLIDES.stat().st_size if has_10_slides_pdf else 0
            },
            "pitch_deck_original": {
                "available": has_original_pdf,
                "filename": "Credit-access-is-not-the-same-as-credit-affordability.pdf",
                "download_url": "/api/pitch-deck/original/download",
                "view_url": "/api/pitch-deck/original",
                "size_bytes": PDF_FILE_ORIGINAL.stat().st_size if has_original_pdf else 0
            }
        }
    }


@router.get("/slides")
def get_slides_data():
    """Returns the structured slide content for interactive in-browser viewing."""
    return {
        "slides": SLIDES_DATA,
        "total_slides": len(SLIDES_DATA),
        "submission": OFFICIAL_SUBMISSION
    }


@router.get("/download")
def download_pitch_deck():
    """Downloads the official 10-slide competition pitch deck PDF."""
    if not PDF_FILE_10_SLIDES.exists():
        raise HTTPException(status_code=404, detail="Pitch deck PDF not found on server.")

    return FileResponse(
        path=PDF_FILE_10_SLIDES,
        media_type="application/pdf",
        filename="NexusFin_Pitch_Deck_10_Slides.pdf",
        headers={"Content-Disposition": 'attachment; filename="NexusFin_Pitch_Deck_10_Slides.pdf"'}
    )


@router.get("/view")
@router.get("")
def view_pitch_deck():
    """Serves the 10-slide pitch deck PDF inline for browser viewing."""
    if not PDF_FILE_10_SLIDES.exists():
        raise HTTPException(status_code=404, detail="Pitch deck PDF not found on server.")

    return FileResponse(
        path=PDF_FILE_10_SLIDES,
        media_type="application/pdf",
        filename="NexusFin_Pitch_Deck_10_Slides.pdf",
        headers={"Content-Disposition": 'inline; filename="NexusFin_Pitch_Deck_10_Slides.pdf"'}
    )


@router.get("/original")
def view_original_pitch_deck():
    """Serves the original source pitch deck PDF inline."""
    if not PDF_FILE_ORIGINAL.exists():
        raise HTTPException(status_code=404, detail="Original pitch deck PDF not found on server.")

    return FileResponse(
        path=PDF_FILE_ORIGINAL,
        media_type="application/pdf",
        filename="Credit-access-is-not-the-same-as-credit-affordability.pdf",
        headers={"Content-Disposition": 'inline; filename="Credit-access-is-not-the-same-as-credit-affordability.pdf"'}
    )


@router.get("/original/download")
def download_original_pitch_deck():
    """Downloads the original source pitch deck PDF as attachment."""
    if not PDF_FILE_ORIGINAL.exists():
        raise HTTPException(status_code=404, detail="Original pitch deck PDF not found on server.")

    return FileResponse(
        path=PDF_FILE_ORIGINAL,
        media_type="application/pdf",
        filename="Credit-access-is-not-the-same-as-credit-affordability.pdf",
        headers={"Content-Disposition": 'attachment; filename="Credit-access-is-not-the-same-as-credit-affordability.pdf"'}
    )
