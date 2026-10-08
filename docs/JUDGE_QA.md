# NexusFin — Judge & Regulatory Q&A Guide
**ASEAN Financial Health Challenge — Problem Statement 3**

This document provides strategic, rigorous answers to questions that judges, regulators (e.g., Bangko Sentral ng Pilipinas), and Financial Health Champions are likely to ask during clinics, interviews, and final presentations.

---

### Q1: "How does NexusFin differ from existing credit scoring apps and credit bureaus?"
**Answer:**
> "Existing credit bureaus and credit scoring models are fundamentally **lender-centric risk predictors** designed to answer one question: *'Will the lender get repaid?'* They often produce an opaque number (e.g., 680) based on historical formal credit usage.
>
> NexusFin is a **dual-sided financial resilience decision-support platform**. It does not try to replace underwriting or predict credit default probabilities with a black-box model. Instead, it asks: *'Can this borrower realistically afford this loan under normal conditions and realistic life shocks without sliding into financial distress?'*
>
> Furthermore, NexusFin translates actuarial and cash-flow reality into plain, transparent language and Key Facts Comparisons for the borrower, directly addressing the 'informed choice' mandate of Problem Statement 3."

---

### Q2: "What is your stance on Alternative Data? How do you prevent predatory practices?"
**Answer:**
> "Digital lending across emerging markets has seen severe consumer-protection abuses, such as scraping phone contacts, location data, or social media to harass borrowers or price credit unfairly.
>
> NexusFin adopts a strict **Privacy by Design and Data Minimization standard**:
> 1. **Zero Invasive Scraping:** We strictly refuse to access contacts, photos, or social media.
> 2. **Financial Relevance Only:** We only process consented transaction cash flows (bank, mobile wallet, or merchant turnover) and utility payment consistency.
> 3. **Explicit, Granular Consent:** Every data source has a declared legal purpose, retention period, and an instant revocation toggle.
> 4. **Governance Audit Logging:** Every data ingestion and consent state change is recorded in a transparent governance audit trail designed around core data governance principles: explicit consent, purpose limitation, and borrower-initiated revocation."

---

### Q3: "Why did you separate planned savings from essential expenses in your affordability calculations?"
**Answer:**
> "In early financial calculators, savings was often subtracted as an essential outflow: `Income - Expenses - Debt - Savings - Loan = Buffer`.
>
> We recognized this as a fundamental mathematical flaw that harms financial health. **Voluntary savings is an asset and a financial cushion, not a contractual debt obligation.**
> If an applicant saves ₱5,000 a month voluntarily, treating that as a non-negotiable expense penalizes prudent savers by making them appear artificially unaffordable.
>
> In NexusFin, we calculate baseline available cash flow strictly as `Income - Essential Living Expenses - Existing Debt Repayments`. Planned savings is tracked separately in our **Multidimensional Resilience Assessment**, where liquid reserves are evaluated as an emergency runway cushion rather than an arbitrary point score. This provides an accurate picture of cash capacity while incentivizing buffer retention."

---

### Q4: "How does NexusFin account for informal workers whose income is volatile?"
**Answer:**
> "Informal workers, gig drivers, and micro-merchants do not receive fixed bi-weekly pay slips. Evaluating them with static monthly rules either causes exclusion or over-indebtedness.
>
> NexusFin addresses income volatility in three ways:
> 1. **Income Volatility Input & Detection:** Ingested transactions or declared profiles calculate an estimated volatility coefficient (e.g., 20% to 40%).
> 2. **Dynamic Review Bands:** If a borrower has high income variability (>30%), a loan that appears manageable in a peak month is automatically flagged for *'Review Carefully'* if the buffer is less than 20% of income.
> 3. **The 25% Flagship Shock Test:** We specifically simulate a 25% income drop scenario to show the borrower exactly what happens during their off-peak or rainy season before they commit."

---

### Q5: "How does the business model work? Who pays for NexusFin?"
**Answer:**
> "NexusFin follows a sustainable **B2B SaaS and Open Finance API model**:
> 1. **B2B Lending Partners (Banks, Rural Banks, Cooperatives, FinTechs):** Financial institutions pay an API subscription or per-assessment fee to integrate NexusFin’s affordability and stress-testing engine into their digital loan origination journeys. This improves their underwriting quality, reduces 90-day non-performing loans (NPLs), and fulfills regulatory consumer-protection compliance.
> 2. **Financial Health & Employer Wellness Channels:** Gig platforms (Grab, Foodpanda) and large employers integrate NexusFin as a worker financial resilience benefit.
> 3. **Free Consumer Tier:** The core consumer credit-fit workspace remains free, unburdened by advertising or referral commissions from predatory high-cost lenders, protecting our neutrality and borrower trust."

---

### Q6: "What is your pilot roadmap with Bangko Sentral ng Pilipinas (BSP) or Financial Health Champions?"
**Answer:**
> "Our pilot roadmap is structured into 4 phases:
> * **Phase 1 (Months 1–2):** Deploy NexusFin within the BSP Regulatory Sandbox in collaboration with a partner Philippine rural bank or digital microfinance institution (e.g., ASA Philippines or CARD Bank).
> * **Phase 2 (Months 3–4):** Controlled testing with a pilot cohort of 1,000 gig and MSME borrowers. Measure comprehension of Key Facts, rate of loan renegotiation/right-sizing, and user satisfaction.
> * **Phase 3 (Months 5–6):** Longitudinal tracking of 90-day loan performance in the pilot cohort compared to traditional underwriting controls.
> * **Phase 4 (Months 7+):** Regional rollout leveraging ASEAN Open Finance rails across Indonesia, Vietnam, and Thailand."
