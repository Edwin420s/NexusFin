"""Authentication and user management endpoints for NexusFin."""
from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, status
from backend.app.models.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserProfileResponse,
    AuthResponse,
)
from backend.app.storage.auth_db import (
    register_user,
    authenticate_user,
    get_user_by_token,
    invalidate_session,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & User Management"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(req: UserRegisterRequest):
    """
    Creates a new user account (Borrower or Institutional Underwriter).
    Enforces password complexity, email uniqueness, and records an audit log event.
    """
    try:
        profile, token = register_user(
            email=req.email,
            full_name=req.full_name,
            password=req.password,
            role=req.role,
            organization=req.organization,
        )
        return AuthResponse(status="success", token=token, access_token=token, user=profile)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


@router.post("/login", response_model=AuthResponse)
def login(req: UserLoginRequest):
    """
    Authenticates user credentials and issues a secure session token.
    Uses constant-time password hash verification.
    """
    try:
        profile, token = authenticate_user(email=req.email, password=req.password)
        return AuthResponse(status="success", token=token, access_token=token, user=profile)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get("/me", response_model=UserProfileResponse)
def get_current_user(authorization: str | None = Header(default=None)):
    """
    Retrieves currently authenticated user profile using Bearer token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization[len("Bearer "):].strip()
    user = get_user_by_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or is invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


@router.post("/logout")
def logout(authorization: str | None = Header(default=None)):
    """
    Terminates active user session and invalidates the session token.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization[len("Bearer "):].strip()
        invalidate_session(token)
    return {"status": "success", "message": "Successfully logged out."}
