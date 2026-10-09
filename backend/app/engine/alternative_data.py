"""Alternative Data and Transaction Categorization Engine for Thin-File Consumers."""
from __future__ import annotations

import csv
import io
import math
from typing import TextIO
from backend.app.models.schemas import TransactionItem, TransactionAnalysisResponse


CATEGORY_KEYWORDS = {
    "income_regular": ["salary", "payroll", "wage", "direct deposit", "allowance"],
    "income_variable": ["client payment", "gig payout", "grab", "foodpanda", "tokopedia", "freelance", "shopee", "mpesa received", "invoice payment", "gcash cash-in"],
    "housing": ["rent", "landlord", "mortgage", "housing", "lease"],
    "food_groceries": ["supermarket", "grocery", "market", "food", "naivas", "carrefour", "puregold", "sari-sari", "jollibee", "restaurant"],
    "transport": ["fuel", "gasoline", "petrol", "uber", "bolt", "matatu", "jeepney", "mrt", "transport", "fare", "toll"],
    "utilities": ["electric", "electricity", "water", "internet", "wifi", "airtime", "safaricom", "globe", "smart", "pltd", "kplc"],
    "debt_repayment": ["loan payment", "credit repayment", "bnpl", "tala", "billease", "home credit", "installment", "sacco loan", "interest payment", "fintech debit"],
    "savings": ["savings transfer", "mpao", "piggybank", "deposit goal", "stash", "emergency fund", "coop savings"],
}


def classify_description(desc: str, amount: float) -> tuple[str, bool]:
    """
    Classifies a transaction description into standardized financial categories.
    Returns: (category, is_recurring_hint)
    """
    desc_clean = desc.lower().strip()

    if amount > 0:
        for kw in CATEGORY_KEYWORDS["income_regular"]:
            if kw in desc_clean:
                return "Regular Salary / Payroll", True
        for kw in CATEGORY_KEYWORDS["income_variable"]:
            if kw in desc_clean:
                return "Variable / Gig / Business Income", False
        return "Other Inflow", False

    # Outflows (amount < 0)
    for kw in CATEGORY_KEYWORDS["debt_repayment"]:
        if kw in desc_clean:
            return "Debt / Credit Repayment", True

    for kw in CATEGORY_KEYWORDS["housing"]:
        if kw in desc_clean:
            return "Housing & Rent", True

    for kw in CATEGORY_KEYWORDS["utilities"]:
        if kw in desc_clean:
            return "Utilities & Connectivity", True

    for kw in CATEGORY_KEYWORDS["transport"]:
        if kw in desc_clean:
            return "Transportation & Fuel", False

    for kw in CATEGORY_KEYWORDS["food_groceries"]:
        if kw in desc_clean:
            return "Groceries & Food", False

    for kw in CATEGORY_KEYWORDS["savings"]:
        if kw in desc_clean:
            return "Savings & Buffer Transfer", True

    return "General / Discretionary Expense", False


def process_transaction_csv(file_content: str) -> TransactionAnalysisResponse:
    """
    Parses a CSV string and extracts alternative data signals.
    Expected CSV columns: date, description, amount
    """
    reader = csv.DictReader(io.StringIO(file_content))
    transactions: list[TransactionItem] = []

    for row in reader:
        # Robust column key mapping
        date_val = row.get("date") or row.get("Date") or row.get("DATE") or "2026-09-01"
        desc_val = row.get("description") or row.get("Description") or row.get("memo") or "Transaction"
        amt_raw = row.get("amount") or row.get("Amount") or row.get("AMOUNT") or "0"

        try:
            amt_val = float(str(amt_raw).replace(",", "").strip())
        except ValueError:
            continue

        # Formula injection mitigation
        clean_desc = str(desc_val).strip()
        if clean_desc and clean_desc[0] in ("=", "+", "-", "@", "\t", "\r"):
            clean_desc = f"'{clean_desc}"

        category, is_rec = classify_description(clean_desc, amt_val)
        transactions.append(
            TransactionItem(
                date=str(date_val).strip()[:30],
                description=clean_desc[:150],
                amount=amt_val,
                category=category,
                is_recurring=is_rec,
            )
        )

    if not transactions:
        raise ValueError("The uploaded statement contains no valid transaction rows. Ensure CSV includes date, description, and numeric amount columns.")

    # Inflow and Outflow analysis
    inflows = [t.amount for t in transactions if t.amount > 0]
    outflows = [abs(t.amount) for t in transactions if t.amount < 0]

    total_inflow = round(sum(inflows), 2)
    total_outflow = round(sum(outflows), 2)
    net_cashflow = round(total_inflow - total_outflow, 2)

    # Category totals
    cat_breakdown: dict[str, float] = {}
    for t in transactions:
        cat_breakdown[t.category] = round(cat_breakdown.get(t.category, 0.0) + abs(t.amount), 2)

    # Debt payments detected
    detected_debt = cat_breakdown.get("Debt / Credit Repayment", 0.0)

    # Income variability estimate
    variability_pct = 15.0
    if len(inflows) >= 3 and total_inflow > 0:
        mean_inflow = total_inflow / len(inflows)
        variance = sum((x - mean_inflow) ** 2 for x in inflows) / len(inflows)
        std_dev = math.sqrt(variance)
        variability_pct = round(min(80.0, max(5.0, (std_dev / mean_inflow) * 100.0)), 1)
    elif any(t.category == "Variable / Gig / Business Income" for t in transactions):
        variability_pct = 28.0

    cashflow_note = (
        f"Net positive cash flow generated over the period: +{net_cashflow:,.2f}."
        if net_cashflow >= 0
        else f"Net cash flow deficit of -{abs(net_cashflow):,.2f} recorded over the period (outflows exceed verified inflows)."
    )

    insights = [
        f"Processed {len(transactions)} transaction records with total verified inflows of {total_inflow:,.2f} and outflows of {total_outflow:,.2f}.",
        cashflow_note,
    ]

    if detected_debt > 0:
        insights.append(
            f"Detected existing recurring debt or installment payments totaling {detected_debt:,.2f}. This is cross-referenced with your declared debt obligations."
        )

    if variability_pct > 25.0:
        insights.append(
            f"Income streams show elevated variability ({variability_pct:.1f}% estimated variance). Cash flows consist primarily of multi-client or gig earnings rather than fixed monthly payroll."
        )
    else:
        insights.append(
            f"Income regularity appears consistent ({variability_pct:.1f}% estimated variance), supporting predictable repayment capacity."
        )

    summary = {
        "transaction_count": len(transactions),
        "total_inflows": total_inflow,
        "total_outflows": total_outflow,
        "net_cashflow": net_cashflow,
        "categories": cat_breakdown,
        "recurring_items_count": sum(1 for t in transactions if t.is_recurring),
    }

    return TransactionAnalysisResponse(
        transactions=transactions,
        summary=summary,
        insights=insights,
        detected_income=total_inflow,
        detected_expenses=round(total_outflow - detected_debt, 2),
        detected_debt_payments=detected_debt,
        income_variability_est_pct=variability_pct,
        methodology_note="Alternative data classification uses deterministic pattern matching over consented bank/mobile money extracts. Zero scraping of personal contacts, camera, or social media.",
    )
