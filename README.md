# NexusFin — Responsible Credit & Informed Choice Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.12%20%7C%203.14-blue.svg)](https://python.org)
[![Tests](https://img.shields.io/badge/Tests-27%2F27%20Passing-brightgreen.svg)]()
[![Challenge](https://img.shields.io/badge/Challenge-ASEAN%20Financial%20Health%202026-orange.svg)](https://gftn.com)
[![Track](https://img.shields.io/badge/Track-Problem%20Statement%203-blueviolet.svg)]()

> **"Understand the credit before it becomes a burden."**  
> An explainable, AI-assisted financial health and credit decision-support platform built for the **ASEAN Financial Health Challenge 2026** (organized by the Global Finance & Technology Network [GFTN] and the Bangko Sentral ng Pilipinas [BSP]).

---

## 🌟 Executive Summary

Digital credit across Southeast Asia is expanding exponentially. However, **credit access is not the same as credit affordability**. Tens of millions of gig workers, freelancers, and micro-entrepreneurs qualify for instant loans on their phones, but have no way of understanding whether repayments remain sustainable when income drops or expenses spike. Traditional credit bureaus have thin files on these borrowers, while predatory digital apps trap households in compounding debt.

**NexusFin** bridges this gap through a dual-sided decision-support infrastructure:
1. **For Borrowers:** An interactive, plain-language financial health workspace that calculates true cash-flow capacity, simulates 6 real-life shock scenarios, and standardizes competing offers into a Key Facts comparison.
2. **For Lenders & Regulators:** A responsible underwriting portal that evaluates consented alternative transaction data, enforces data minimization, monitors portfolio debt burden, and maintains a transparent governance audit trail.

---

## 🎯 Challenge Problem Statement Alignment

| Official Challenge Requirement | How NexusFin Solves It |
| :--- | :--- |
| **Improve Credit Assessment** | Uses consented alternative transaction cash flows to identify income regularity, volatility, and recurring obligations for thin-file borrowers. |
| **Avoid Over-Indebtedness** | Calculates combined debt-service burden (DTI) and runs deterministic stress tests across 6 macroeconomic and household shocks. |
| **Make Informed Choices** | Multi-offer comparison matrix presenting standardized Key Facts Statements, total borrowing costs, and explicit term trade-offs. |
| **Responsible AI & Governance** | 100% deterministic safety-critical math; zero contact-list or social-media scraping; granular, revocable consent controls; governance audit trail. |
| **ASEAN Localization & Scale** | Pre-calibrated for all ASEAN currencies (PHP, IDR, SGD, MYR, THB, VND) and emerging market contexts (KES, USD) with 1-click regional personas. |

---

## 🏗️ The 10 Core Modules

1. **Financial Health Profile:** Captures gross income, income volatility, essential living expenses, existing debt commitments, liquid savings, and planned savings goals.
2. **Deterministic Loan Cost Engine:** Computes exact amortization schedules, flat-rate comparisons, upfront origination fees, monthly maintenance fees, and total financing charges.
3. **Affordability & Buffer Engine:** Computes baseline disposable cash flow and post-credit monthly buffer. *(Planned savings is strictly treated as an emergency cushion, never penalized as debt).*
4. **Multi-Scenario Stress Testing Engine:** Simulates 6 realistic shock scenarios:
   * Base Case (100% income, 100% expenses)
   * 10% Income Dip (minor seasonal slowdown)
   * **25% Income Shock (Flagship Scenario: gig delivery downtime, client loss)**
   * 40% Severe Disruption (prolonged illness or loss of primary client)
   * 20% Essential Expense Surge (food/fuel inflation or family medical emergency)
   * Combined Dual Shock (25% income contraction + 20% expense surge)
5. **Multi-Offer Comparison (Key Facts Statement):** Side-by-side comparison of up to 5 competing credit options with tags for *Lowest Monthly*, *Lowest Total Cost*, and *Most Resilient*.
6. **Evidence-Based Multidimensional Resilience Overview:** Transparent evaluation across baseline buffer, debt-service burden, liquid savings runway, and shock survivability ending with clear qualitative conclusion (zero black-box scoring).
7. **Consented Alternative Data Engine:** Automated CSV transaction parsing, income regularity detection, expense categorization, and volatility coefficient estimation.
8. **Plain-Language Explainability Layer:** Replaces black-box scores with structured reason codes, explicit term trade-offs, and actionable consumer recommendations.
9. **Privacy by Design & Consent Registry:** Granular opt-in/opt-out toggles for each data source with declared legal purpose and retention periods.
10. **Institutional Underwriter Portal & Governance Audit Trail:** Dedicated portal for microfinance institutions and partner banks with a transparent audit trail.

---

## 📐 Mathematical Integrity

$$\text{Base Available Cash Flow} = \text{Income} - \text{Essential Expenses} - \text{Existing Debt}$$
$$\text{Post-Loan Buffer} = \text{Base Available Cash Flow} - \text{Monthly Repayment}$$
$$\text{Debt-Service Burden} = \frac{\text{Existing Debt} + \text{Monthly Repayment}}{\text{Income}} \times 100\%$$

> ⚠️ **Key Innovation:** Unlike legacy calculators that incorrectly subtract savings as an outflow, NexusFin treats planned savings as an emergency buffer. Prudent savers are never penalized in affordability assessments.

---

## 🚀 Quick Start & Installation

### Option 1: Native Startup (Recommended)

```bash
# Clone and enter the repository
cd /home/skywalker/Projects/prj/Hack/NexusFin

# Run the automated launch script
./run.sh
```

Open your browser to:
* **Application UI:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
* **Interactive OpenAPI Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Option 2: Docker / Containerized Launch

```bash
docker compose up --build
```

---

## 🧪 Automated Test Suite

NexusFin includes automated unit and integration tests covering calculation formulas, edge cases, alternative data classification, and API routes.

```bash
# Run the test suite
PYTHONPATH=. pytest -v
```

**Results:** `27 passed in 0.82s`

---

## 📁 Repository Structure

```
NexusFin/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entry point & SPA router
│   │   ├── config.py                # App configuration, metadata, ASEAN currencies
│   │   ├── models/
│   │   │   ├── schemas.py           # Pydantic v2 request & response schemas
│   │   │   └── audit.py             # Audit trail and data governance models
│   │   ├── engine/
│   │   │   ├── affordability.py     # Deterministic affordability & cash flow engine
│   │   │   ├── stress_test.py       # 6-scenario stress testing engine
│   │   │   ├── comparison.py        # Multi-offer comparison & Key Facts engine
│   │   │   ├── resilience.py        # Multidimensional resilience assessment
│   │   │   ├── alternative_data.py  # Transaction ingestion & categorization
│   │   │   └── explainability.py    # Plain-language explanation & trade-offs
│   │   ├── routers/
│   │   │   ├── assess.py            # /api/assess & /api/presets
│   │   │   ├── compare.py           # /api/compare
│   │   │   ├── transactions.py      # /api/transactions & sample datasets
│   │   │   ├── consent.py           # /api/consent & /api/audit-log
│   │   │   └── partner.py           # /api/partner underwriter portal
│   │   └── storage/
│   │       └── memory_db.py         # In-memory store, consent registry & audit logs
│   ├── requirements.txt             # Python dependencies
│   └── tests/                       # 27 unit and integration tests
├── frontend/
│   ├── index.html                   # High-fidelity single page application
│   ├── css/
│   │   └── styles.css               # Design system & responsive layout
│   └── js/
│       ├── api.js                   # Client REST API module
│       ├── state.js                 # Global application state & formatting
│       ├── ui.js                    # DOM rendering & dynamic tables
│       └── app.js                   # Main application controller
├── data/
│   ├── sample_transactions_manila_gig_rider.csv    # Carlos (PHP - Manila)
│   ├── sample_transactions_kenya_freelancer.csv    # Aisha (KES - Nairobi)
│   └── sample_transactions_jakarta_merchant.csv    # Dewi (IDR - Jakarta)
├── docs/
│   ├── PITCH_DECK.md                # 10-Slide Competition Pitch Deck Script
│   ├── DEMO_SCRIPT_3MIN.md          # 3-Minute Demo Video Walkthrough Script
│   ├── JUDGE_QA.md                  # Comprehensive Judge & Regulatory Q&A Guide
│   └── ARCHITECTURE.md              # Technical Architecture & ASEAN Scaling Roadmap
├── Dockerfile                       # Production Docker container
├── docker-compose.yml               # Container orchestration
├── run.sh                           # One-click startup script
└── README.md                        # Project documentation
```

---

## 👥 Competition Submission Details

* **Event:** ASEAN Financial Health Challenge 2026
* **Track:** Problem Statement 3 — Responsible Credit and Informed Choice
* **Format:** Technical Product (Working Prototype & Pilot-Ready System)
* **Team Name:** NexusFin
* **Solo Applicant / Team Leader:** Edwin Mwiti
* **Contact:** eduedwyn5@gmail.com
