# NexusFin — Technical Architecture & Scaling Strategy
**ASEAN Financial Health Challenge — Problem Statement 3: Responsible Credit**

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
                              │ • Financial Resilience Index (0-100)   │
                              │ • Transaction Ingestion & Classifier   │
                              │ • Plain-Language Explainability Layer  │
                              └───────────────────┬────────────────────┘
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 ▼                                                                 ▼
   ┌───────────────────────────┐                                     ┌───────────────────────────┐
   │   GOVERNANCE & CONSENT    │                                     │     AUDIT TRAIL STORE     │
   │       (/api/consent)      │                                     │     (/api/audit-log)      │
   │ • Granular source toggles │                                     │ • Immutable event logs    │
   │ • Stated purpose registry │                                     │ • Ephemeral caching       │
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
  *(Planned savings goal is strictly excluded from expenses to prevent penalizing savers).*

* **Post-Loan Monthly Buffer:**
  $$\text{Buffer}_{\text{post}} = \text{CF}_{\text{base}} - M$$

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

## 3. Financial Resilience Index (0–100 Points)

The overall resilience score synthesizes 4 distinct pillars:
* **Pillar 1: Buffer Adequacy (30 pts):** Ratio of post-loan buffer to income ($\ge 25\% \to 30\text{ pts}$).
* **Pillar 2: Debt Burden Safety (25 pts):** Combined debt burden ($\le 20\% \to 25\text{ pts}$, $>55\% \to 0\text{ pts}$).
* **Pillar 3: Emergency Reserve Runway (25 pts):** Months of liquid savings coverage ($\ge 3\text{ mos} \to 25\text{ pts}$).
* **Pillar 4: Shock Survivability (20 pts):** Count of stress scenarios remaining cash-flow positive ($6/6 \to 20\text{ pts}$).

---

## 4. Privacy by Design & Security Guardrails

* **Data Minimization:** Only transaction inflows, outflows, and recurring debits are processed.
* **Prohibited Data Sources:** Strict architectural prohibition against accessing contact books, camera rolls, geolocation history, or social media graphs.
* **Consent Registry:** Every alternative data source requires an explicit opt-in with a declared purpose and retention horizon.
* **Audit Trail:** Immutable logging of consent updates, assessments, and underwriter reviews with actor identification and timestamps.

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
• BSP Circular No. 1133     • OJK FinTech POJK 10       • SBV Consumer Lending
• GCash / Maya connectors   • GoPay / OVO connectors    • MoMo / ZaloPay
• Rural Bank / Co-op        • BPR / Koperasi            • Microfinance Co-ops
```

The core engine is isolated from country-specific regulations. Deploying to a new ASEAN market only requires:
1. Configuring local currency and formatting rules.
2. Mapping local open banking / mobile money statement CSV formats.
3. Calibrating regulatory debt-service burden thresholds to local central bank guidelines.
