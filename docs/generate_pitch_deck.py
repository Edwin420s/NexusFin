#!/usr/bin/env python3
"""
NexusFin Pitch Deck Generator
Generates the official 10-slide landscape A4 pitch deck PDF for the ASEAN Financial Health Challenge.
"""

import os
from reportlab.lib.pagesizes import landscape, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.units import mm

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_PDF = os.path.join(BASE_DIR, "NexusFin_Pitch_Deck_10_Slides.pdf")

PAGE_W, PAGE_H = landscape(A4)

doc = SimpleDocTemplate(
    OUT_PDF,
    pagesize=landscape(A4),
    rightMargin=18 * mm,
    leftMargin=18 * mm,
    topMargin=14 * mm,
    bottomMargin=14 * mm
)

styles = getSampleStyleSheet()

font_regular = "Helvetica"
font_bold = "Helvetica-Bold"

title = ParagraphStyle(
    "SlideTitle", parent=styles["Title"], fontName=font_bold,
    fontSize=24, leading=28, spaceAfter=8, textColor=colors.HexColor("#0D2818")
)
subtitle = ParagraphStyle(
    "Subtitle", parent=styles["Normal"], fontName=font_regular,
    fontSize=13, leading=18, textColor=colors.HexColor("#4B5B6B")
)
body = ParagraphStyle(
    "Body", parent=styles["BodyText"], fontName=font_regular,
    fontSize=11.5, leading=16.5, textColor=colors.HexColor("#1E293B"),
    spaceAfter=6
)
bullet = ParagraphStyle(
    "Bullet", parent=body, leftIndent=15, firstLineIndent=-8,
    spaceAfter=6
)
small = ParagraphStyle(
    "Small", parent=body, fontSize=9.5, leading=13, textColor=colors.HexColor("#64748B")
)
metric = ParagraphStyle(
    "Metric", parent=body, fontName=font_bold, fontSize=14, leading=18,
    textColor=colors.HexColor("#0F7B6C")
)

story = []

def slide_header(kicker, heading, sub=None):
    story.append(Paragraph(kicker.upper(), ParagraphStyle(
        "Kicker", parent=small, fontName=font_bold, fontSize=8.5,
        textColor=colors.HexColor("#0F7B6C"), spaceAfter=4
    )))
    story.append(Paragraph(heading, title))
    if sub:
        story.append(Paragraph(sub, subtitle))
    story.append(Spacer(1, 6))

def box_table(items, widths=None):
    data = []
    for x in items:
        data.append([Paragraph(x[0], metric), Paragraph(x[1], body)])
    t = Table(data, colWidths=widths or [52 * mm, 190 * mm], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E2E8F0")),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return t

# -------------------------------------------------------------
# Slide 1: Cover
# -------------------------------------------------------------
slide_header("ASEAN Financial Health Challenge 2026 • GFTN & Bangko Sentral ng Pilipinas", "NexusFin", "Problem Statement 3: Responsible Credit and Informed Choice")
story.append(Spacer(1, 10))
story.append(Paragraph(
    "<b>Helping borrowers and lenders understand what credit is realistically affordable before committing.</b>",
    ParagraphStyle("Hero", parent=body, fontSize=17, leading=23, textColor=colors.HexColor("#0D2818"))
))
story.append(Spacer(1, 8))
story.append(Paragraph("Technical Product + Modular API Architecture • Solo Applicant: Edwin Mwiti • October 2026", subtitle))
story.append(Spacer(1, 16))
story.append(Paragraph(
    "NexusFin is a responsible credit decision-support platform that transforms raw financial data and proposed loan terms into understandable affordability insights, multi-scenario stress tests, and standardized Key Facts comparisons — without relying on opaque black-box credit scores.",
    body
))
story.append(PageBreak())

# -------------------------------------------------------------
# Slide 2: The Problem
# -------------------------------------------------------------
slide_header("The Problem", "Credit access is not the same as credit affordability",
             "Expanding digital credit without affordability assessment creates severe debt-trap risks across ASEAN.")
for b in [
    "Volatile Informal Incomes: 48% of Filipino adults say raising emergency funds is very difficult; gig and MSME workers face fluctuating monthly cash flows (BSP CFIS 2026).",
    "Hidden Debt Concentration: Existing debts and recurring family obligations reduce available disposable cash flow, leading to compounding debt rollover.",
    "Misleading Flat-Rate Marketing: Borrowers often evaluate headline instalments without understanding the total cost of credit or effective APR.",
    "Shock Vulnerability: A repayment that appears manageable in a peak month becomes unsustainable when an unexpected income drop or medical emergency occurs."
]:
    story.append(Paragraph("• " + b, bullet))
story.append(Spacer(1, 8))
story.append(Paragraph(
    "<b>Core Opportunity:</b> Make affordability, total costs, and financial resilience trade-offs transparent before committing to credit.",
    body
))
story.append(PageBreak())

# -------------------------------------------------------------
# Slide 3: The Solution
# -------------------------------------------------------------
slide_header("The Solution", "NexusFin: Explainable credit decision support for borrowers and lenders",
             "A platform designed as transparent decision support — not an opaque automated approval/rejection machine.")
story.append(box_table([
    ("1. Understand", "Capture declared or consented income, essential living costs, existing debt, and liquid reserves."),
    ("2. Assess Affordability", "Calculate exact post-loan cash buffer, debt-service burden (DTI), and total financing costs."),
    ("3. Stress Test", "Simulate 6 realistic shock scenarios (10%, 25%, 40% income drops, inflation surges, and dual shocks)."),
    ("4. Compare & Explain", "Generate side-by-side Key Facts Statements and plain-language trade-offs rather than black-box scores."),
], [44 * mm, 200 * mm]))
story.append(PageBreak())

# -------------------------------------------------------------
# Slide 4: User Journey
# -------------------------------------------------------------
slide_header("User Journey", "From loan question to informed, resilient choice")
steps = [
    ("01", "Financial Health Profile", "Income + volatility + living expenses + existing debt + liquid reserves"),
    ("02", "Credit Offer Input", "Principal + term + APR + upfront fees + repayment structure (amortizing vs flat)"),
    ("03", "Affordability Engine", "Deterministic post-loan monthly buffer & debt-service burden calculation"),
    ("04", "Shock Stress Testing", "Simulate 6 life shocks to verify if cash flow remains positive"),
    ("05", "Standardized Key Facts", "Side-by-side comparison of options & plain-language trade-off guidance"),
]
data = []
for n, h, d in steps:
    data.append([
        Paragraph(n, ParagraphStyle("N", parent=metric, fontSize=16, textColor=colors.HexColor("#0D2818"))),
        Paragraph(f"<b>{h}</b><br/>{d}", body)
    ])
t = Table(data, colWidths=[18 * mm, 224 * mm])
t.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LINEBELOW", (0, 0), (-1, -2), 0.5, colors.HexColor("#E2E8F0")),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story.append(t)
story.append(PageBreak())

# -------------------------------------------------------------
# Slide 5: Responsible AI & Alternative Data
# -------------------------------------------------------------
slide_header("Responsible AI & Data", "Useful financial signals without invasive surveillance",
             "NexusFin leverages consented alternative transaction data while enforcing strict privacy by design.")
for b in [
    "Privacy by Design: ZERO contact-list scraping, zero social-media surveillance, zero invasive phone permission grabs.",
    "Financial Relevance Only: Ingests consented transaction cash flows (bank, mobile wallet, or merchant turnover) and utility consistency.",
    "Pattern Recognition: Classifies irregular gig/client earnings, estimates income volatility (CV), and cross-checks declared liabilities.",
    "Deterministic Core Math: Safety-critical calculations are 100% deterministic code (zero AI black-box in arithmetic). NLP is strictly used to translate complex actuarial results into plain, localized language.",
    "Data Governance: Granular opt-in/opt-out toggles with declared legal basis and governance audit trail."
]:
    story.append(Paragraph("• " + b, bullet))
story.append(PageBreak())

# -------------------------------------------------------------
# Slide 6: Illustrative Scenario
# -------------------------------------------------------------
slide_header("Demonstrating Impact", "Making financial stress visible before it becomes a crisis")
story.append(box_table([
    ("Borrower Profile", "Carlos — Manila Food & Delivery Gig Rider (PHP)"),
    ("Monthly Income", "PHP 38,000 (average with 25% estimated variability)"),
    ("Essential Living Costs", "PHP 21,000 (rent, groceries, utilities, fuel)"),
    ("Existing Debt Payments", "PHP 4,500 (motorcycle installment)"),
    ("Proposed Credit Offer", "PHP 35,000 over 10 months at 24% APR (PHP 4,046.43/mo payment with fees)"),
    ("Base Case Buffer", "PHP 8,454/month positive buffer (Debt Burden: 22.5% — Manageable baseline)"),
    ("25% Income Shock Test", "Income drops to PHP 28,500 -> Buffer becomes -PHP 1,046/mo (DEFICIT)"),
], [56 * mm, 186 * mm]))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "<b>The NexusFin Difference:</b> Rather than discovering insolvency mid-loan, NexusFin concludes: <i>Manageable today, vulnerable under income shock</i>. Carlos sees the 25% shock deficit in advance and receives guidance to negotiate a longer term or lower principal to preserve resilience.",
    body
))
story.append(PageBreak())

# -------------------------------------------------------------
# Slide 7: Technical Architecture
# -------------------------------------------------------------
slide_header("Technical Architecture", "Modular, containerized, and Open Finance ready",
             "Designed for rapid pilot deployment with financial institutions and regulatory sandboxes.")
story.append(box_table([
    ("Frontend SPA", "Responsive dashboard built with semantic HTML5, modern CSS design system, and vanilla JS (zero heavy framework overhead)."),
    ("FastAPI Backend", "High-performance Python asynchronous modular REST API architecture with Pydantic v2 strict typing and OpenAPI specifications."),
    ("Calculation Engines", "Deterministic loan amortization, fee accounting, 6-scenario stress testing, and evidence-based Multidimensional Resilience Overview."),
    ("Alternative Data", "Automated CSV transaction ingestion, classification keyword rules, and volatility coefficient analysis."),
    ("Governance & Audit", "Granular consent registry with governance audit log stream aligned with BSP Circular No. 1133."),
    ("Deployment", "Fully containerized via Docker and docker-compose; ready for cloud or on-premise deployment."),
], [48 * mm, 194 * mm]))
story.append(PageBreak())

# -------------------------------------------------------------
# Slide 8: Impact & Measurement
# -------------------------------------------------------------
slide_header("Impact & Measurement", "Designing for measurable financial-health outcomes",
             "Moving beyond access metrics to verifiable household resilience.")
story.append(box_table([
    ("Over-Indebtedness Prevention", "Measure reduction in borrowers taking credit with >40% debt burden or negative shock buffers."),
    ("Informed Choice Comprehension", "Measure user understanding of total financing charges and effective APR across competing products."),
    ("Resilient Credit Expansion", "Enable microfinance partners to underwrite thin-file gig workers through verified cash flows."),
    ("Pilot Cohort Metrics", "Track assessment completion, loan right-sizing frequency, and 90-day delinquency rate vs control cohorts."),
], [56 * mm, 186 * mm]))
story.append(PageBreak())

# -------------------------------------------------------------
# Slide 9: Sustainability & ASEAN Scale
# -------------------------------------------------------------
slide_header("Sustainability & Scale", "Viable B2B SaaS business model with regional replicability")
for b in [
    "B2B SaaS / API Tier: Financial institutions, rural banks, and cooperatives pay per assessment API call to improve responsible underwriting and ESG compliance.",
    "Employer & Gig Platform Channel: Delivery platforms (Grab, Foodpanda) and employers integrate NexusFin as a worker financial wellness perk.",
    "Free Neutral Consumer Tool: Core borrower workspace remains 100% free and independent from predatory referral commissions.",
    "Modular ASEAN Localization: Pre-calibrated for all ASEAN currencies (PHP, IDR, SGD, MYR, THB, VND, KES, USD) with adaptable central bank regulatory thresholds.",
    "Pilot-First Strategy: Designed for immediate entry into the BSP Regulatory Sandbox and partner microfinance clinics."
]:
    story.append(Paragraph("• " + b, bullet))
story.append(PageBreak())

# -------------------------------------------------------------
# Slide 10: Pilot Roadmap & Conclusion
# -------------------------------------------------------------
slide_header("Pilot Roadmap", "From working prototype to ASEAN-wide implementation")
story.append(box_table([
    ("Phase 1 (Months 1–2)", "Validation in BSP Regulatory Sandbox with Philippine microfinance cooperative or digital bank."),
    ("Phase 2 (Months 3–4)", "Controlled pilot with 1,000 gig and MSME borrowers; measure loan right-sizing and user comprehension."),
    ("Phase 3 (Months 5–6)", "Longitudinal evaluation of 90-day loan performance; calibrate country-specific volatility thresholds."),
    ("Phase 4 (Months 7+)", "Regional expansion into Indonesia (OJK framework), Vietnam (SBV), and Thailand (BOT)."),
], [50 * mm, 192 * mm]))
story.append(Spacer(1, 10))
story.append(Paragraph(
    "<b>NexusFin</b> — Making credit decisions easier to understand before they become financial burdens.",
    ParagraphStyle("Closing", parent=body, fontName=font_bold, fontSize=14, leading=19, textColor=colors.HexColor("#0D2818"))
))
story.append(Paragraph(
    "ASEAN Financial Health Challenge • Problem Statement 3: Responsible Credit and Informed Choice • Team NexusFin",
    small
))

def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont(font_regular, 8)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.drawRightString(PAGE_W - 18 * mm, 8 * mm, f"Slide {doc.page} of 10")
    canvas.restoreState()

doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
print(f"Generated pitch deck PDF: {OUT_PDF}")
