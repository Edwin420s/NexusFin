"""Pydantic request and response schemas for NexusFin."""
from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field


class Income(BaseModel):
    monthly: float = Field(..., ge=0, description="Gross monthly income in selected currency")
    variability_pct: float = Field(default=15.0, ge=0, le=100, description="Estimated monthly income variability percentage")
    employment_type: Literal["salaried", "gig_worker", "freelance_msme", "informal_trader", "seasonal"] = "gig_worker"


class Profile(BaseModel):
    currency: Literal["PHP", "KES", "SGD", "IDR", "MYR", "THB", "VND", "USD"] = "PHP"
    income: Income
    essential_expenses: float = Field(..., ge=0, description="Monthly essential living expenses (rent, food, utilities, health)")
    existing_debt_payments: float = Field(default=0.0, ge=0, description="Current monthly debt repayments (bank, BNPL, informal)")
    liquid_savings: float = Field(default=0.0, ge=0, description="Immediately accessible liquid savings buffer")
    goal_savings: float = Field(default=0.0, ge=0, description="Discretionary monthly planned savings goal")
    household_dependents: int = Field(default=1, ge=0, description="Number of financial dependents in household")


class CreditOffer(BaseModel):
    name: str = Field(default="Proposed Microloan", description="Display name of credit offer")
    provider: str = Field(default="Community Digital Lender", description="Provider / Institution name")
    principal: float = Field(..., gt=0, description="Requested or approved loan principal")
    annual_interest_rate: float = Field(default=18.0, ge=0, le=200, description="Nominal annual interest rate in percent")
    term_months: int = Field(..., gt=0, le=120, description="Loan repayment duration in months")
    upfront_fee: float = Field(default=0.0, ge=0, description="Origination, appraisal or disbursement fees")
    monthly_fee: float = Field(default=0.0, ge=0, description="Monthly account maintenance or admin fee")
    repayment_type: Literal["amortizing", "flat"] = Field(
        default="amortizing",
        description="Calculation structure: reducing balance (amortizing) or flat rate"
    )
    purpose: Literal[
        "Working Capital / MSME",
        "Emergency / Medical",
        "Education / Tuition",
        "Home Improvement",
        "Debt Consolidation",
        "Asset Acquisition",
        "General Consumer Need"
    ] = "Working Capital / MSME"


class AssessmentRequest(BaseModel):
    profile: Profile
    offer: CreditOffer


class CompareRequest(BaseModel):
    profile: Profile
    offers: list[CreditOffer] = Field(..., min_length=1, max_length=6)


class ScenarioResult(BaseModel):
    name: str
    description: str
    income_factor: float
    expense_factor: float
    income: float
    expenses: float
    debt_payments: float
    monthly_repayment: float
    buffer: float
    debt_service_burden_pct: float
    is_positive: bool
    status: Literal["healthy", "tight", "deficit"]


class AffordabilityMetrics(BaseModel):
    base_available_cash_flow: float
    monthly_repayment: float
    total_repayment: float
    total_cost_of_credit: float
    post_credit_buffer: float
    debt_service_burden_pct: float
    liquid_savings_months: float | None
    effective_monthly_commitment: float


class ResilienceScore(BaseModel):
    total_score: int = Field(..., ge=0, le=100, description="Overall Resilience Index score (0-100)")
    tier: Literal["High Resilience", "Moderate Resilience", "Financially Vulnerable", "Severely Stressed"]
    buffer_adequacy_pts: int
    debt_burden_pts: int
    emergency_reserve_pts: int
    income_stability_pts: int
    summary: str


class AssessmentResponse(BaseModel):
    status: Literal["fits", "review", "high-pressure"]
    status_label: str
    status_reason: str
    currency: str
    currency_symbol: str
    offer: dict
    metrics: AffordabilityMetrics
    resilience: ResilienceScore
    scenarios: list[ScenarioResult]
    explanation: list[str]
    trade_offs: list[str]
    recommendations: list[str]
    methodology: list[str]
    limitations: list[str]
    generated_at: str


class TransactionItem(BaseModel):
    date: str
    description: str
    amount: float
    category: str
    is_recurring: bool = False


class TransactionAnalysisResponse(BaseModel):
    transactions: list[TransactionItem]
    summary: dict
    insights: list[str]
    detected_income: float
    detected_expenses: float
    detected_debt_payments: float
    income_variability_est_pct: float
    methodology_note: str


class ConsentItem(BaseModel):
    source_id: str
    title: str
    description: str
    purpose: str
    legal_basis: str
    retention_period: str
    granted: bool


class ConsentUpdateRequest(BaseModel):
    source_id: str
    granted: bool
    actor: str = "consumer"
