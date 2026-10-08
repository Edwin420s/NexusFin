# NexusFin — Technical Architecture & Scaling Strategy
**ASEAN Financial Health Challenge 2026 — Problem Statement 3: Responsible Credit**

---

## 1. System Architecture Overview

NexusFin is built as a modular, API-first financial health and credit decision-support platform designed for high performance, explainability, and regulatory compliance.

```
                              ┌────────────────────────────────────────┐
                              │             CLIENT LAYER               │
                              │  (Consumer Workspace & Partner Portal) │
                              └───────────────────┬────────────────────┘
                                                  │ HTTPS / REST JSON
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │            API GATEWAY & CORS          │
                              │           FastAPI v0.115+              │
                              └───────────────────┬────────────────────┘
                                                  │
                 ┌────────────────────────────────┼────────────────────────────────┐
                 ▼                                ▼                                ▼
   ┌───────────────────────────┐    ┌───────────────────────────┐    ┌───────────────────────────┐
   │    ASSESSMENT ROUTER      │    │    COMPARISON ROUTER      │    │  ALTERNATIVE DATA ROUTER  │
   │      (/api/assess)        │    │      (/api/compare)       │    │    (/api/transactions)    │
   └─────────────┬─────────────┘    └─────────────┬─────────────┘    └─────────────┬─────────────┘
                 │                                │                                │
                 └────────────────────────────────┼────────────────────────────────┘
                                                  │
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │          CALCULATION ENGINES           │
                              ├────────────────────────────────────────┤
                              │ • Affordability Engine (Deterministic) │
                              │ • Multi-Scenario Stress Engine         │
                              │ • Multidimensional Resilience Overview│
                              │ • Transaction Ingestion & Classifier   │
                              │ • Plain-Language Explainability Layer  │
                              └───────────────────┬────────────────────┘
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 ▼                                                                 ▼
   ┌───────────────────────────┐                                     ┌───────────────────────────┐
   │   GOVERNANCE & CONSENT    │                                     │     AUDIT TRAIL STORE     │
   │       (/api/consent)      │                                     │     (/api/audit-log)      │
   │ • Granular source toggles │                                     │ • Governance event logs   │
   │ • Stated purpose registry │                                     │ • Ephemeral session cache │
   └───────────────────────────┘                                     └───────────────────────────┘
```

---

## 2. Core Mathematical Formulas

### 2.1 Loan Instalment Calculations
* **Amortizing (Reducing Balance):**
  $$M = P \cdot \frac{r(1+r)^n}{(1+r)^n - 1} + \text{Fee}_{\text{monthly}}$$
  where $P$ is principal, $r$ is monthly interest rate ($r_{\text{annual}} / 12 / 100$), $n$ is term in months.

* **Flat-Rate Model:**
  $$M = \frac{P + (P \cdot \frac{r_{\text{annual}}}{100} \cdot \frac{n}{12})}{n} + \text{Fee}_{\text{monthly}}$$

* **Total Cost of Credit (TCC):**
  $$\text{TCC} = (M \cdot n + \text{Fee}_{\text{upfront}}) - P$$

### 2.2 Cash Flow & Affordability
* **Base Available Cash Flow:**
  $$\text{CF}_{\text{base}} = \text{Income}_{\text{monthly}} - \text{Expenses}_{\text{essential}} - \text{Debt}_{\text{existing}}$$
  *(Planned voluntary savings goal is strictly excluded from mandatory debt/expenses to prevent penalizing savers).*

* **Post-Loan Monthly Buffer:**
  $$\text{Buffer}_{\text{post}} = \text{CF}_{\text{base}} - M$$

* **After Planned Savings Cushion:**
  $$\text{Buffer}_{\text{after\_savings}} = \text{Buffer}_{\text{post}} - \text{Savings}_{\text{goal}}$$

* **Debt-Service Burden (DTI):**
  $$\text{Burden}_{\text{debt}} = \frac{\text{Debt}_{\text{existing}} + M}{\text{Income}_{\text{monthly}}} \times 100\%$$

### 2.3 Stress Testing Engine
Evaluates 6 standardized household disruption scenarios:
1. **Base Case:** 100% income, 100% expenses.
2. **10% Income Dip:** 90% income, 100% expenses.
3. **25% Income Shock (Flagship):** 75% income, 100% expenses.
4. **40% Severe Disruption:** 60% income, 100% expenses.
5. **20% Cost Surge:** 100% income, 120% expenses.
6. **Combined Dual Shock:** 75% income, 120% expenses.

---

## 3. Financial Resilience Evaluation & Objective Indicators

Rather than generating an opaque 3-digit score, NexusFin provides evidence-based, multidimensional indicators:
* **Dimension 1: Baseline Cash Buffer:** Transparent net monthly disposable buffer remaining after mandatory expenses and debt.
* **Dimension 2: Debt-Service Burden:** Proportion of income consumed by combined debt obligations against standard 35% / 50% benchmarks.
* **Dimension 3: Emergency Reserve Runway:** Months of essential living expenditures covered by immediately accessible liquid savings.
* **Dimension 4: Stress Shock Resistance:** Survivability of cash flows across simulated income drops (detecting deficits at -25% and -40%).
* **Qualitative Indicator Output:** `Baseline: Manageable | Shock Resilience: Needs Review` with explicit reason codes.

---

## 4. Privacy by Design & Security Guardrails

* **Data Minimization:** Only transaction inflows, outflows, and recurring debits are processed.
* **Prohibited Data Sources:** Strict architectural prohibition against accessing contact books, camera rolls, geolocation history, or social media graphs.
* **Consent Registry:** Every alternative data source requires an explicit opt-in with a declared purpose and retention horizon.
* **Audit Trail:** Governance logging of consent updates, assessments, and underwriter reviews with actor identification and timestamps.

---

## 5. ASEAN Localization & Scaling Strategy

```
                             NEXUSFIN CORE ENGINE
                         (Deterministic Math + AI)
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
    PHILIPPINES                  INDONESIA                    VIETNAM
• Currency: PHP (₱)         • Currency: IDR (Rp)        • Currency: VND (₫)
• Open Finance Framework    • OJK FinTech Standards     • SBV Consumer Lending
• GCash / Maya connectors   • GoPay / OVO connectors    • MoMo / ZaloPay
• Rural Bank / Co-op        • BPR / Koperasi            • Microfinance Co-ops
```

The core engine is isolated from country-specific regulations. Deploying to a new ASEAN market only requires:
1. Configuring local currency and formatting rules.
2. Mapping local open banking / mobile money statement CSV formats.
3. Calibrating regulatory debt-service burden thresholds to local central bank guidelines.
