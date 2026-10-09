"""Cryptographically secure user authentication store and session registry."""
from __future__ import annotations

import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timezone
from backend.app.models.auth import UserProfileResponse
from backend.app.storage.memory_db import record_audit

# In-memory user database: email -> user record
USERS_DB: dict[str, dict] = {}

# Active session tokens: token -> user_id
ACTIVE_SESSIONS: dict[str, str] = {}


def hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    """Generates a secure PBKDF2-HMAC-SHA256 password hash with unique salt."""
    if salt is None:
        salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return dk.hex(), salt


def verify_password(plain_password: str, stored_hash: str, salt: str) -> bool:
    """Constant-time verification of password against stored hash."""
    test_hash, _ = hash_password(plain_password, salt)
    return hmac.compare_digest(test_hash, stored_hash)


def init_default_users() -> None:
    """Seeds default demo accounts for testing account authentication workflows."""
    if "borrower@nexusfin.org" not in USERS_DB:
        pw_hash, salt = hash_password("NexusBorrower123!")
        USERS_DB["borrower@nexusfin.org"] = {
            "id": "usr_borrower_demo",
            "email": "borrower@nexusfin.org",
            "full_name": "Maria Santos (Borrower)",
            "role": "borrower",
            "organization": None,
            "pw_hash": pw_hash,
            "salt": salt,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    if "underwriter@nexusfin.org" not in USERS_DB:
        pw_hash, salt = hash_password("NexusOfficer123!")
        USERS_DB["underwriter@nexusfin.org"] = {
            "id": "usr_officer_demo",
            "email": "underwriter@nexusfin.org",
            "full_name": "Senior Credit Officer Gomez",
            "role": "underwriter",
            "organization": "Community Credit Alliance",
            "pw_hash": pw_hash,
            "salt": salt,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    # Pre-seed active demo session tokens
    ACTIVE_SESSIONS["demo_borrower_token_v1"] = "usr_borrower_demo"
    ACTIVE_SESSIONS["demo_underwriter_token_v1"] = "usr_officer_demo"


# Initialize default seed accounts on module import
init_default_users()


def register_user(email: str, full_name: str, password: str, role: str = "borrower", organization: str | None = None) -> tuple[UserProfileResponse, str]:
    """Registers a new user account with duplicate email rejection."""
    clean_email = email.strip().lower()
    if clean_email in USERS_DB:
        raise ValueError(f"An account with email '{clean_email}' already exists.")

    user_id = f"usr_{uuid.uuid4().hex[:10]}"
    pw_hash, salt = hash_password(password)
    created_at = datetime.now(timezone.utc).isoformat()

    user_record = {
        "id": user_id,
        "email": clean_email,
        "full_name": full_name.strip(),
        "role": role,
        "organization": organization.strip() if organization else None,
        "pw_hash": pw_hash,
        "salt": salt,
        "created_at": created_at,
    }
    USERS_DB[clean_email] = user_record

    # Create session token
    token = secrets.token_urlsafe(32)
    ACTIVE_SESSIONS[token] = user_id

    record_audit(
        event_type="ACCOUNT_REGISTERED",
        actor="consumer" if role == "borrower" else "lending_officer",
        details={
            "user_id": user_id,
            "email": clean_email,
            "role": role,
        }
    )

    profile = UserProfileResponse(
        id=user_id,
        email=clean_email,
        full_name=user_record["full_name"],
        role=role,
        organization=user_record["organization"],
        created_at=created_at,
    )
    return profile, token


def authenticate_user(email: str, password: str) -> tuple[UserProfileResponse, str]:
    """Authenticates user credentials and generates a secure session token."""
    clean_email = email.strip().lower()
    user = USERS_DB.get(clean_email)
    if not user:
        raise ValueError("Invalid email or password.")

    if not verify_password(password, user["pw_hash"], user["salt"]):
        raise ValueError("Invalid email or password.")

    token = secrets.token_urlsafe(32)
    ACTIVE_SESSIONS[token] = user["id"]

    record_audit(
        event_type="USER_LOGIN",
        actor="consumer" if user["role"] == "borrower" else "lending_officer",
        details={
            "user_id": user["id"],
            "email": clean_email,
            "role": user["role"],
        }
    )

    profile = UserProfileResponse(
        id=user["id"],
        email=clean_email,
        full_name=user["full_name"],
        role=user["role"],
        organization=user["organization"],
        created_at=user["created_at"],
    )
    return profile, token


def get_user_by_token(token: str) -> UserProfileResponse | None:
    """Resolves active session token to user profile."""
    user_id = ACTIVE_SESSIONS.get(token)
    if not user_id:
        return None

    for user in USERS_DB.values():
        if user["id"] == user_id:
            return UserProfileResponse(
                id=user["id"],
                email=user["email"],
                full_name=user["full_name"],
                role=user["role"],
                organization=user["organization"],
                created_at=user["created_at"],
            )
    return None


def invalidate_session(token: str) -> bool:
    """Invalidates active session token."""
    if token in ACTIVE_SESSIONS:
        user_id = ACTIVE_SESSIONS.pop(token)
        record_audit(
            event_type="USER_LOGOUT",
            actor="consumer",
            details={"user_id": user_id}
        )
        return True
    return False
