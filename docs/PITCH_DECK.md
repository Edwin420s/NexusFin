# NexusFin — 10-Slide Pitch Deck
**ASEAN Financial Health Challenge 2026 — Problem Statement 3: Responsible Credit and Informed Choice**
*Applicant / Builder:* Edwin Mwiti (Solo Builder) • *Team:* NexusFin

---

## Slide 1: Title & Positioning
* **Title:** NexusFin
* **Subtitle:** Responsible Credit Decision Support & Informed Choice Platform
* **Tagline:** Helping borrowers and lenders understand what credit is truly affordable before signing.
* **Challenge:** ASEAN Financial Health Challenge 2026 (GFTN & Bangko Sentral ng Pilipinas)
* **Track:** Problem Statement 3 — Responsible Credit & Informed Choice
* **Format:** Technical Product + Modular API Architecture

---

## Slide 2: The Problem — Credit Access Is Not Credit Affordability
* **The Core Gap:** Expanding digital credit access without transparent affordability creates debt traps.
* **The Borrower Reality:**
  * 48% of Filipino adults say raising emergency funds is very difficult; only 3 in 10 say savings would last a month of lost income (BSP CFIS 2026).
  * Platform gig workers and informal MSMEs have volatile, multi-stream cash flows that traditional fixed-monthly formulas misjudge.
  * Opaque pricing, flat-rate marketing, and hidden fees disguise the true cost of credit.
  * Borrowers focus on headline instalments without testing whether repayments survive a real-life income shock.
* **The Lender Challenge:** Traditional credit bureaus have thin or non-existent files on tens of millions of creditworthy ASEAN workers.

---

## Slide 3: The Solution — NexusFin
* **What NexusFin Is:** An explainable decision-support platform that transforms raw cash flows and loan terms into an actionable financial resilience assessment.
* **What NexusFin Is NOT:**
  * ❌ NOT an opaque 3-digit AI credit score.
  * ❌ NOT an automated robotic loan approval/rejection engine.
  * ❌ NOT a predatory scraping tool.
* **Four Core Pillars:**
  1. **Deterministic Affordability:** Rigorous cash-flow accounting where planned savings is never misclassified as mandatory debt.
  2. **Multi-Scenario Stress Testing:** Simulating 10%, 25%, 40% income drops and cost inflation spikes.
  3. **Standardized Informed Choice:** Side-by-side comparison matrix with Key Facts Statements.
  4. **Consented Alternative Data:** Ingesting bank, mobile money, and merchant cash flows ethically.

---

## Slide 4: How It Works — End-to-End User Journey
* **Step 1: Financial Health Profile** — Consented transaction ingestion or self-declaration of income variability, essential living costs, existing debt, and liquid reserves.
* **Step 2: Credit Offer Simulation** — Actuarial calculation of reducing-balance vs flat-rate loans, upfront fees, and monthly charges.
* **Step 3: Cash Flow & Buffer Analysis** — Calculating post-loan disposable buffer and debt-service burden (DTI).
* **Step 4: Stress Testing** — 6 macroeconomic and household shock scenarios testing if cash flow remains positive.
* **Step 5: Plain-Language Explainability** — Unpacking reasons, trade-offs, and actionable consumer recommendations.

---

## Slide 5: Responsible AI & Alternative Data Engine
* **Ethical Guardrails:**
  * Zero contact-list scraping, zero social-media surveillance, zero discriminatory attributes.
  * Data minimization: only verified transaction inflows, outflows, and recurring debits.
* **Pattern Recognition:**
  * Identifies irregular gig/client earnings and calculates income volatility coefficients.
  * Automatically cross-checks declared liabilities against discovered recurring debits.
* **Deterministic Core + Explainability Translation:**
  * Safety-critical math is 100% deterministic code (zero AI black-box in calculations).
  * NLP is used strictly to translate complex actuarial metrics into plain, localized language.

---

## Slide 6: Demonstrating Impact — Real-World Scenario
* **Persona:** Carlos — Manila Food & Express Delivery Rider (₱38,000/mo, 25% volatility).
* **Proposed Loan:** ₱35,000 digital microloan over 10 months at 24% APR (₱4,046.43/mo payment with fees).
* **Base Case:** ₱8,454 post-loan buffer (Debt Burden = 22.5% → Manageable baseline).
* **Stress Test (25% Gig Income Drop):**
  * Stressed Income: ₱28,500.
  * Essential Living: ₱21,000.
  * Existing Debt: ₱4,500.
  * New Loan Repayment: ₱4,046.43.
  * **Remaining Buffer: −₱1,046/month (DEFICIT).**
* **The NexusFin Difference:** NexusFin identifies: *Manageable today, vulnerable under income shock*. Carlos sees the deficit before borrowing and receives objective guidance to consider a longer tenure or lower principal, avoiding delinquency before signing.

---

## Slide 7: Technical Architecture
* **Frontend:** Responsive, accessible Single Page Application (HTML5, modern CSS design system, vanilla JS).
* **Backend:** Python / FastAPI high-performance asynchronous modular REST API architecture.
* **Validation & Schemas:** Pydantic v2 strict typing.
* **Storage & Governance:** Ephemeral in-memory session cache + JSON audit logging and consent registry.
* **Open Finance Ready:** Standardized REST endpoints (`/api/assess`, `/api/compare`, `/api/transactions`, `/api/consent`, `/api/partner`).
* **Deployment:** Containerized Docker & docker-compose architecture.

---

## Slide 8: Measurable Financial Health Outcomes
* **Outcome 1 — Over-Indebtedness Prevention:** Direct reduction in borrowers taking loans with >40% debt burden or negative shock buffers.
* **Outcome 2 — Informed Comprehension:** Increase in borrower understanding of total financing charges and term trade-offs.
* **Outcome 3 — Expansion of Fair Credit:** Enabling microfinance institutions to underwrite thin-file gig workers through verified cash flows.
* **Outcome 4 — Pilot Validation Metrics:**
  * Assessment completion rate.
  * Shift in user loan choice after comparison view.
  * 90-day delinquency rate among assessed pilot cohort vs control group.

---

## Slide 9: Business Model & Sustainability
* **B2B SaaS / API Tier:**
  * Financial institutions (digital banks, rural banks, microfinance NGOs) pay per assessment API call to improve responsible underwriting and ESG compliance.
* **Financial Wellness & Employer Channel:**
  * Integrated into employee benefit programs and gig platforms (e.g., Grab, Foodpanda) as a financial health perk.
* **Free Consumer Utility:**
  * Core consumer workspace remains 100% free and independent to ensure trust and unbiased decision support.
* **Unit Economics:** Modular API architecture scales at near-zero marginal cost per assessment.

---

## Slide 10: Pilot Roadmap & ASEAN Scalability
* **Phase 1 (Months 1–2): Validation & Sandbox**
  * Pilot in the BSP Regulatory Sandbox with a Philippine digital bank or rural microfinance cooperative.
* **Phase 2 (Months 3–4): Controlled Pilot Cohort**
  * Onboard 1,000 thin-file borrowers; measure loan uptake, comprehension, and early repayment stability.
* **Phase 3 (Months 5–6): Regional Localization**
  * Modular localization layer allows rapid deployment to Indonesia (OJK framework), Vietnam (SBV), and Singapore (MAS).
* **Vision:** The trusted responsible credit infrastructure for the next 100 million ASEAN borrowers.
