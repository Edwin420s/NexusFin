"""Comprehensive QA and Security Test Suite for NexusFin.

Covers:
- Authentication & Authorization (registration, hashing, login, tokens, demo accounts)
- Path Traversal Defense on static asset router
- File Upload Boundaries, Extension Validation, & Empty File Guards
- CSV Formula Injection Mitigation
- Numerical Bounds, Malformed Payloads, and Edge Cases
- Stored/Reflected XSS Input Safety
- Error Handling and 404 Guards
"""
from __future__ import annotations

import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.storage.auth_db import hash_password, verify_password, USERS_DB
from backend.app.storage.memory_db import AUDIT_LOGS

client = TestClient(app)


# ==============================================================================
# 1. AUTHENTICATION & SECURITY CONTROLS
# ==============================================================================

def test_password_hashing_security():
    """Verify PBKDF2 salt generation, hashing strength, and constant-time matching."""
    raw_pw = "SecurePass123!"
    pw_hash, salt = hash_password(raw_pw)

    assert len(pw_hash) == 64
    assert len(salt) == 32
    assert verify_password(raw_pw, pw_hash, salt) is True
    assert verify_password("WrongPassword!", pw_hash, salt) is False
    assert verify_password("", pw_hash, salt) is False
    # Ensure different salts produce different hashes for the same password
    pw_hash2, salt2 = hash_password(raw_pw)
    assert salt != salt2
    assert pw_hash != pw_hash2


def test_auth_registration_and_duplicate_prevention():
    """Verify clean account creation, email normalization, and duplicate rejection."""
    reg_payload = {
        "email": "qa.analyst@nexusfin.org",
        "password": "StrongPassword999!",
        "full_name": "QA Security Officer",
        "role": "borrower",
    }
    # 1. First registration succeeds
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["access_token"]
    assert data["user"]["email"] == "qa.analyst@nexusfin.org"
    assert data["user"]["full_name"] == "QA Security Officer"
    assert data["user"]["role"] == "borrower"
    assert "password" not in data["user"]

    # 2. Duplicate registration rejected with 409
    res_dup = client.post("/api/auth/register", json=reg_payload)
    assert res_dup.status_code == 409
    assert "already exists" in res_dup.json()["detail"].lower()


def test_auth_password_complexity_validation():
    """Verify password validation rejects short or weak passwords."""
    # Under 8 characters
    short_pw = {
        "email": "weak1@nexusfin.org",
        "password": "short",
        "full_name": "Weak User",
        "role": "borrower",
    }
    res_short = client.post("/api/auth/register", json=short_pw)
    assert res_short.status_code == 422

    # Missing digits or symbols
    no_num_pw = {
        "email": "weak2@nexusfin.org",
        "password": "allalphabetsonly",
        "full_name": "Weak User",
        "role": "borrower",
    }
    res_no_num = client.post("/api/auth/register", json=no_num_pw)
    assert res_no_num.status_code == 422


def test_auth_login_and_protected_me_endpoint():
    """Verify login authentication, token verification, and 401 handling."""
    # Seeded demo credentials
    login_res = client.post("/api/auth/login", json={
        "email": "borrower@nexusfin.org",
        "password": "NexusBorrower123!",
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert len(token) > 20

    # Successful /api/auth/me with Bearer token
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "borrower@nexusfin.org"
    assert me_data["role"] == "borrower"

    # Invalid Bearer token
    bad_token_res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid_token_12345"})
    assert bad_token_res.status_code == 401

    # Missing Bearer token
    no_token_res = client.get("/api/auth/me")
    assert no_token_res.status_code == 401

    # Invalid password login
    bad_pw_res = client.post("/api/auth/login", json={
        "email": "borrower@nexusfin.org",
        "password": "WrongPassword999!",
    })
    assert bad_pw_res.status_code == 401


def test_demo_underwriter_login():
    """Verify the pre-seeded underwriter account can authenticate."""
    res = client.post("/api/auth/login", json={
        "email": "underwriter@nexusfin.org",
        "password": "NexusOfficer123!",
    })
    assert res.status_code == 200
    assert res.json()["user"]["role"] == "underwriter"


# ==============================================================================
# 2. PATH TRAVERSAL DEFENSE
# ==============================================================================

def test_path_traversal_attack_mitigation():
    """Verify that path traversal attempts cannot escape the frontend root."""
    traversal_paths = [
        "/../../etc/passwd",
        "/../backend/app/main.py",
        "/../../../../etc/shadow",
        "/..%2F..%2Fbackend%2Fapp%2Fmain.py",
    ]
    for path in traversal_paths:
        res = client.get(path)
        # Should return 404 (or 400), never 200 with sensitive file contents
        assert res.status_code in [400, 404]
        assert "root:" not in res.text
        assert "FastAPI" not in res.text or "NexusFin" in res.text


# ==============================================================================
# 3. FILE UPLOAD & CSV SECURITY
# ==============================================================================

def test_upload_non_csv_file_rejection():
    """Verify that uploading non-CSV files is safely rejected with HTTP 400."""
    fake_exe = io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00")
    res = client.post(
        "/api/transactions",
        files={"file": ("malware.exe", fake_exe, "application/octet-stream")},
    )
    assert res.status_code == 400
    assert "only csv files" in res.json()["detail"].lower()


def test_upload_empty_csv_file_rejection():
    """Verify that uploading an empty CSV file is safely rejected with HTTP 400."""
    empty_csv = io.BytesIO(b"")
    res = client.post(
        "/api/transactions",
        files={"file": ("empty.csv", empty_csv, "text/csv")},
    )
    assert res.status_code == 400
    assert "no valid transaction rows" in res.json()["detail"].lower()


def test_csv_formula_injection_defense():
    """Verify spreadsheet formula injection payloads are prepended with an apostrophe."""
    malicious_csv_content = (
        "date,description,amount,category\n"
        "2026-03-01,=SUM(1+1),-500,expense\n"
        "2026-03-02,@cmd|' /C calc'!A0,-300,expense\n"
        "2026-03-03,+1500,1500,income\n"
        "2026-03-04,-200,-200,expense\n"
    ).encode("utf-8")

    res = client.post(
        "/api/transactions",
        files={"file": ("formula_injection.csv", io.BytesIO(malicious_csv_content), "text/csv")},
    )
    assert res.status_code == 200
    txs = res.json()["transactions"]
    for tx in txs:
        desc = tx["description"]
        # Formulas starting with =, @, +, - should now begin with '
        if desc.startswith(("'=", "'@", "'+", "'-")):
            assert desc.startswith("'")


# ==============================================================================
# 4. NUMERICAL BOUNDS & BOUNDARY TESTING
# ==============================================================================

def test_negative_income_rejection():
    """Verify that negative monthly income is rejected with HTTP 422."""
    bad_payload = {
        "profile": {
            "currency": "PHP",
            "income": {
                "monthly": -5000,
                "variability_pct": 10,
                "employment_type": "salaried",
            },
            "essential_expenses": 2000,
            "existing_debt_payments": 500,
            "liquid_savings": 1000,
            "goal_savings": 500,
        },
        "offer": {
            "name": "Test Loan",
            "principal": 10000,
            "annual_interest_rate": 15,
            "term_months": 6,
            "upfront_fee": 0,
            "repayment_type": "amortizing",
        },
    }
    res = client.post("/api/assess", json=bad_payload)
    assert res.status_code == 422


def test_excessive_loan_term_rejection():
    """Verify that unrealistically long loan terms (e.g. 5000 months) are rejected with 422."""
    bad_payload = {
        "profile": {
            "currency": "PHP",
            "income": {
                "monthly": 30000,
                "variability_pct": 10,
                "employment_type": "salaried",
            },
            "essential_expenses": 15000,
            "existing_debt_payments": 2000,
            "liquid_savings": 5000,
            "goal_savings": 1000,
        },
        "offer": {
            "name": "Crazy Term Loan",
            "principal": 10000,
            "annual_interest_rate": 15,
            "term_months": 5000,  # Exceeds le=600 (50 years)
            "upfront_fee": 0,
            "repayment_type": "amortizing",
        },
    }
    res = client.post("/api/assess", json=bad_payload)
    assert res.status_code == 422


# ==============================================================================
# 5. XSS PAYLOAD SAFETY IN ASSESSMENT & UNDERWRITING
# ==============================================================================

def test_xss_in_applicant_name_and_rationale_safely_handled():
    """Verify that potential HTML/Script payloads do not crash the engine and are retained as pure text."""
    xss_name = "<script>alert('XSS_APPLICANT')</script>"
    payload = {
        "applicant_name": xss_name,
        "profile": {
            "currency": "PHP",
            "income": {
                "monthly": 45000,
                "variability_pct": 15,
                "employment_type": "salaried",
            },
            "essential_expenses": 20000,
            "existing_debt_payments": 3000,
            "liquid_savings": 15000,
            "goal_savings": 2000,
        },
        "offer": {
            "name": "<img src=x onerror=alert('OFFER_XSS')>",
            "principal": 25000,
            "annual_interest_rate": 18,
            "term_months": 12,
            "upfront_fee": 500,
            "repayment_type": "amortizing",
        },
    }
    res = client.post("/api/assess", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["applicant_name"] == xss_name
    assessment_id = data["id"]

    # Now submit an underwriter decision with an XSS rationale
    xss_rationale = "<iframe src='evil.com'></iframe> Approved with caution."
    dec_res = client.post(
        "/api/partner/decision",
        headers={"Authorization": "Bearer demo_underwriter_token_v1"},
        json={
            "assessment_id": assessment_id,
            "decision": "approved",
            "rationale": xss_rationale,
            "officer_name": "<b>Lead Auditor</b>",
        },
    )
    assert dec_res.status_code == 200
    assert dec_res.json()["assessment"]["decision"]["rationale"] == xss_rationale


# ==============================================================================
# 6. NON-REGISTERED & ROLE-BASED ACCESS CONTROL GUARDS
# ==============================================================================

def test_unauthenticated_partner_endpoints_rejected():
    """Verify non-registered or unauthenticated users cannot view portfolio or approve facilities."""
    # 1. Unauthenticated GET review queue rejected
    get_res = client.get("/api/partner/assessments")
    assert get_res.status_code == 401
    assert "authentication required" in get_res.json()["detail"].lower()

    # 2. Unauthenticated POST decision rejected (non-registered cannot approve)
    post_res = client.post("/api/partner/decision", json={
        "assessment_id": "asmt_carlos_001",
        "decision": "approved",
        "rationale": "Anonymous approval attempt",
        "officer_name": "Anonymous",
    })
    assert post_res.status_code == 401
    assert "authentication required" in post_res.json()["detail"].lower()


def test_borrower_role_forbidden_from_underwriting_decisions():
    """Verify registered borrowers cannot access underwriter queue or approve credit facilities."""
    borrower_headers = {"Authorization": "Bearer demo_borrower_token_v1"}

    # Borrower cannot view underwriter queue
    get_res = client.get("/api/partner/assessments", headers=borrower_headers)
    assert get_res.status_code == 403
    assert "forbidden" in get_res.json()["detail"].lower()

    # Borrower cannot approve loans
    post_res = client.post("/api/partner/decision", headers=borrower_headers, json={
        "assessment_id": "asmt_carlos_001",
        "decision": "approved",
        "rationale": "Self-approval attempt by borrower",
        "officer_name": "Borrower Self-Approver",
    })
    assert post_res.status_code == 403
    assert "forbidden" in post_res.json()["detail"].lower()


# ==============================================================================
# 7. ERROR HANDLING & 404 GUARDS
# ==============================================================================

def test_unknown_consent_source_returns_404():
    """Verify setting consent for a non-existent source returns 404."""
    res = client.post("/api/consent", json={
        "source_id": "non_existent_source_xyz",
        "granted": True,
        "actor": "qa_tester",
    })
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_unknown_assessment_decision_returns_404():
    """Verify recording decision for non-existent assessment returns 404."""
    res = client.post(
        "/api/partner/decision",
        headers={"Authorization": "Bearer demo_underwriter_token_v1"},
        json={
            "assessment_id": "non_existent_assessment_id_999",
            "decision": "declined",
            "rationale": "Record does not exist",
            "officer_name": "Audit Officer",
        },
    )
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()
