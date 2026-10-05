# NexusFin — Engineering Changelog & Audit Trail

A granular, verifiable record of product development, actuarial modeling, data governance, and test engineering.

- `2026-10-04 09:00` **refactor(schemas):** declare strict Pydantic v2 schemas for Income and Profile models
- `2026-10-04 09:52` **refactor(schemas):** enforce validation constraints on CreditOffer principal and interest rates
- `2026-10-04 10:44` **feat(schemas):** define ScenarioResult schema for multi-scenario stress outcomes
- `2026-10-04 11:37` **refactor(schemas):** redesign ResilienceScore schema for multidimensional evidence
- `2026-10-04 12:29` **feat(schemas):** add backward compatibility fields to ResilienceScore model
- `2026-10-04 13:21` **feat(schemas):** define KeyFactsOfferComparison schema for standardized offer terms
- `2026-10-04 14:14` **feat(schemas):** define AssessmentRequest and AssessmentResponse schemas
- `2026-10-04 15:06` **refactor(schemas):** add country and currency validation helpers to Profile schema
- `2026-10-04 15:59` **feat(schemas):** define TransactionSummary and TransactionAnalysisResponse schemas
- `2026-10-04 16:51` **test(schemas):** validate serialization and deserialization of core financial schemas
- `2026-10-04 17:43` **refactor(engine):** isolate amortizing loan repayment reducing-balance formula
- `2026-10-04 18:36` **refactor(engine):** isolate flat-rate interest and fee calculation logic
- `2026-10-04 19:28` **feat(engine):** calculate exact total cost of credit including origination and monthly charges
- `2026-10-04 20:20` **refactor(engine):** compute baseline available cash flow strictly excluding voluntary savings
- `2026-10-04 21:13` **refactor(engine):** compute post-loan monthly buffer before planned savings
- `2026-10-04 22:05` **feat(engine):** track discretionary remainder after planned savings separately
- `2026-10-04 22:58` **refactor(engine):** compute combined debt-service burden (DTI) percentage
- `2026-10-04 23:50` **feat(engine):** compute liquid emergency savings runway in living cost months
- `2026-10-05 00:42` **refactor(engine):** calibrate affordability status bands for healthy and deficit profiles
- `2026-10-05 01:35` **feat(engine):** add dynamic reason generation for high debt-service concentration
- `2026-10-05 02:27` **feat(engine):** add dynamic reason generation for immediate cash flow deficits
- `2026-10-05 03:19` **feat(engine):** support currency symbol formatting in affordability reason codes
- `2026-10-05 04:12` **feat(stress):** define 6 standardized macroeconomic and household shock scenarios
- `2026-10-05 05:04` **feat(stress):** implement Base Case scenario preserving 100% baseline cash flow
- `2026-10-05 05:57` **feat(stress):** implement Income −10% shock simulating seasonal income dips
- `2026-10-05 06:49` **feat(stress):** implement Income −25% flagship shock for gig worker platform downtime
- `2026-10-05 07:41` **feat(stress):** implement Income −40% severe disruption scenario
- `2026-10-05 08:34` **feat(stress):** implement Expenses +20% surge simulating living cost inflation
- `2026-10-05 09:26` **feat(stress):** implement Combined Shock pairing 25% income drop and 20% cost surge
- `2026-10-05 10:18` **refactor(stress):** compute exact remaining disposable buffers across all 6 scenarios
- `2026-10-05 11:11` **refactor(stress):** classify scenario status labels into Manageable, Review, and Deficit
- `2026-10-05 12:03` **refactor(stress):** harmonize scenario naming with ASEAN challenge guidelines
