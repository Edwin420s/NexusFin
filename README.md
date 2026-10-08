# NexusFin — Responsible Credit Decision Support & Affordability Intelligence

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.12%20%7C%203.14-blue.svg)](https://python.org)
[![Tests](https://img.shields.io/badge/Tests-32%2F32%20Passing-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.1-indigo.svg)](http://127.0.0.1:8000/docs)

> **"Understand credit before it becomes a burden."**  
> NexusFin is an explainable financial health and credit decision-support platform designed to prevent over-indebtedness, demystify borrowing terms, and empower borrowers and lenders with transparent affordability intelligence.

---

## 🌟 Product Overview

Digital lending has expanded rapidly across emerging and frontier markets. However, **credit access is not the same as credit affordability**. Tens of millions of gig workers, freelancers, and micro-entrepreneurs can qualify for digital loans on their smartphones in minutes, but have no independent way to test whether repayments will remain sustainable when income drops or essential expenses surge.

Furthermore, traditional credit scoring models rely heavily on static bureau histories that thin-file borrowers lack. Lenders frequently disguise high financing costs using flat-rate interest quotes and hidden disbursement fees, trapping vulnerable households in compounding cycles of re-borrowing.

**NexusFin** solves this problem through a dual-sided decision-support infrastructure:

1. **For Borrowers:** An interactive, plain-language financial health workspace that calculates true disposable cash flow, stress-tests commitments against 6 real-world shock scenarios, and standardizes competing offers into a clear Key Facts comparison.
2. **For Lenders & Underwriters:** An institutional portal that evaluates consented alternative transaction signals, models income volatility, checks regulatory affordability thresholds, and maintains a transparent governance audit trail.

---

## 💡 Core Product Pillars

| Pillar | How NexusFin Operates |
| :--- | :--- |
| **Deterministic Affordability** | 100% auditable actuarial formulas calculate reducing-balance schedules, upfront fees, ongoing service charges, and true Annual Percentage Rates (APR). |
| **Multi-Scenario Stress Testing** | Evaluates loan commitments across 6 macroeconomic and household shock scenarios to verify buffer resilience before signing. |
| **Standardized Key Facts Statement** | Compares competing loan offers side-by-side, exposing flat-rate markups, total financing costs, and monthly cash impact. |
| **Consented Alternative Data** | Ingests bank and mobile-money statement CSVs to reconstruct verified cash flows, model income volatility (CV), and detect undeclared debt without invasive surveillance. |
| **Privacy by Design** | Granular, revocable consent controls for every data source with declared legal basis, purpose limitation, and an immutable audit trail. |
| **Multi-Currency Localization** | Pre-calibrated for international and emerging-market currencies (`PHP`, `KES`, `SGD`, `IDR`, `MYR`, `THB`, `VND`, `USD`) with dynamic symbol and locale formatting. |

---

## 📐 Mathematical Framework & Methodology

NexusFin strictly isolates deterministic financial arithmetic from plain-language explainability. We never produce arbitrary 3-digit credit scores or automated algorithmic rejections.

### 1. Loan Instalment Calculation
* **Amortizing (Reducing Balance):**
  $$M = P \cdot \frac{r(1+r)^n}{(1+r)^n - 1} + \text{Fee}_{\text{monthly}}$$
  where $P$ is principal, $r = \frac{r_{\text{annual}}}{12 \times 100}$, and $n$ is repayment term in months.

* **Flat Rate:**
  $$M = \frac{P + (P \cdot r_{\text{annual}} \cdot \frac{n}{12})}{n} + \text{Fee}_{\text{monthly}}$$

### 2. Cash-Flow Buffer & Debt Burden
$$\text{Base Available Cash Flow} = \text{Income} - \text{Essential Expenses} - \text{Existing Debt}$$
$$\text{Post-Credit Buffer} = \text{Base Available Cash Flow} - \text{Monthly Repayment}$$
$$\text{Debt-Service Burden (DTI)} = \frac{\text{Existing Debt} + \text{Monthly Repayment}}{\text{Income}} \times 100\%$$

> 💡 **The Prudent Savings Principle:** Unlike conventional calculators that erroneously deduct planned savings as a mandatory debt payment, NexusFin treats planned savings as an emergency buffer. Borrowers who save are rewarded with greater runway, never penalized in affordability checks.

### 3. Shock Stress Testing Engine
Every proposed commitment is dynamically stress-tested against 6 scenarios:
1. **Base Case:** Current declared income and essential expenses.
2. **Income −10%:** Mild seasonal contraction or brief platform downtime.
3. **Income −25% (Flagship Benchmark):** Platform gig slowdown, temporary client loss, or vehicle downtime.
4. **Income −40%:** Prolonged illness, economic recession, or major contract loss.
5. **Expenses +20%:** Inflation in food, transport, or essential medical costs.
6. **Combined Dual Shock:** Income −25% accompanied simultaneously by Expenses +20%.

---

## 🚀 Quick Start & Installation

### Prerequisites
* Python 3.12+ (or 3.14)
* Git

### Option 1: Native Startup

```bash
# Clone the repository
git clone https://github.com/Edwin420s/NexusFin.git
cd NexusFin

# Run the automated startup script
./run.sh
```

The script will launch the FastAPI backend with Uvicorn. Access the platform at:
* **Web Application:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
* **Interactive OpenAPI (Swagger):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **ReDoc Documentation:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### Option 2: Docker Container

```bash
# Build and run container
docker compose up --build
```

---

## 🧪 Automated Test Suite

NexusFin maintains comprehensive test coverage across mathematical calculation engines, edge cases, alternative data classification, and API routes:

```bash
PYTHONPATH=. pytest -v
```

**Test Suite Coverage (32/32 Passing):**
* `test_affordability.py`: Zero interest calculations, flat vs amortizing, buffer logic, affordability bands.
* `test_stress.py`: 6 scenario generations, deficit detection under severe contraction.
* `test_comparison.py`: Multi-offer ranking, lowest cost, lowest monthly, resilience ordering.
* `test_alternative_data.py`: Rule-based statement classification, CSV ingestion and volatility estimation.
* `test_api.py`: Health check, presets, assess endpoint, compare endpoint, consent registry, audit trail, sample statements, partner portal, SPA fallback.
* `test_e2e_flow.py`: Full borrower-to-underwriter lifecycle journey across all 8 currencies.
* `test_currency_and_localization.py`: Multi-currency metadata, calculation validation, and localized symbol output across PHP, KES, SGD, IDR, MYR, THB, VND, USD.
* `test_regulatory_governance.py`: Data source privacy specifications, consent grant and revocation lifecycle, and underwriter audit trail logging.
* `test_pitch_deck.py`: Architecture slides and whitepaper PDF endpoints.

---

## 📁 Repository Structure

```
NexusFin/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entry point & SPA router
│   │   ├── config.py                # App configuration, currency metadata, paths
│   │   ├── models/
│   │   │   ├── schemas.py           # Pydantic v2 request & response schemas
│   │   │   └── audit.py             # Audit trail and governance data models
│   │   ├── engine/
│   │   │   ├── affordability.py     # Deterministic affordability & cash flow engine
│   │   │   ├── stress_test.py       # 6-scenario shock stress testing engine
│   │   │   ├── comparison.py        # Multi-offer comparison & Key Facts engine
│   │   │   ├── resilience.py        # Multidimensional resilience assessment
│   │   │   ├── alternative_data.py  # Transaction ingestion & categorization
│   │   │   └── explainability.py    # Plain-language explanation & trade-offs
│   │   ├── routers/
│   │   │   ├── assess.py            # /api/assess & /api/presets
│   │   │   ├── compare.py           # /api/compare
│   │   │   ├── transactions.py      # /api/transactions & sample datasets
│   │   │   ├── consent.py           # /api/consent & /api/audit-log
│   │   │   ├── partner.py           # /api/partner underwriter portal
│   │   │   └── pitch_deck.py        # /api/pitch-deck platform architecture & docs
│   │   └── storage/
│   │       └── memory_db.py         # In-memory store, consent registry & audit logs
│   ├── requirements.txt             # Backend dependencies
│   └── tests/                       # Automated pytest suite (27 tests)
├── frontend/
│   ├── index.html                   # High-fidelity Single Page Application
│   ├── css/
│   │   └── styles.css               # Design system & responsive UI styles
│   └── js/
│       ├── api.js                   # Client REST API connector
│       ├── state.js                 # Global state management & currency formatting
│       ├── ui.js                    # UI rendering & dynamic DOM components
│       └── app.js                   # Main application controller
├── data/
│   ├── sample_transactions_manila_gig_rider.csv    # Gig delivery statement (PHP)
│   ├── sample_transactions_kenya_freelancer.csv    # Digital freelancer statement (KES)
│   └── sample_transactions_jakarta_merchant.csv    # Small retailer statement (IDR)
├── docs/
│   ├── ARCHITECTURE.md              # Technical Architecture & System Specifications
│   ├── PLATFORM_OVERVIEW.md         # 10 Key Dimensions & Product Blueprint
│   ├── PRODUCT_WALKTHROUGH.md       # Interactive Product Walkthrough Guide
│   └── REGULATORY_QA.md             # Regulatory Compliance & Underwriting Q&A
├── Dockerfile                       # Production Docker container definition
├── docker-compose.yml               # Container orchestration
├── run.sh                           # Native launch script
└── README.md                        # Documentation
```

---

## 🛡️ Responsible Data Governance

NexusFin adheres to strict ethical and privacy standards:
* **Zero Invasive Scraping:** No access to phone contacts, photos, social media profiles, or continuous geolocation tracking.
* **Data Minimization:** Only consented financial transactions, recurring debits, and verified cash flows are processed.
* **Granular Consent:** Borrowers can grant or revoke access to individual data sources at any time.
* **Regulatory Auditability:** Every data access, assessment calculation, and underwriter review is logged to an immutable audit trail.
* **Transparent Explainability:** Every assessment outcome is accompanied by explicit plain-language reason codes, buffer metrics, and negotiation levers.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
