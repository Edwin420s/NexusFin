"""Authentication and user account schemas for NexusFin."""
from __future__ import annotations

import re
from typing import Literal
from pydantic import BaseModel, Field, field_validator


class UserRegisterRequest(BaseModel):
    email: str = Field(..., max_length=120, description="User email address")
    full_name: str = Field(..., min_length=2, max_length=100, description="Full name of applicant or officer")
    password: str = Field(..., min_length=8, max_length=100, description="Account password (min 8 characters)")
    role: Literal["borrower", "underwriter"] = Field(default="borrower", description="System access role")
    organization: str | None = Field(default=None, max_length=120, description="Lending institution / SACCO / NGO (for underwriters)")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        # Standard RFC 5322 compatible email pattern
        email_pattern = r"^[\w\.\+\-]+@[a-zA-Z0-9\-]+(\.[a-zA-Z0-9\-]+)+$"
        if not re.match(email_pattern, clean):
            raise ValueError("Invalid email format.")
        return clean

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        has_digit_or_special = any(c.isdigit() or not c.isalnum() for c in v)
        if not has_digit_or_special:
            raise ValueError("Password must contain at least one digit or special character.")
        return v


class UserLoginRequest(BaseModel):
    email: str = Field(..., max_length=120, description="User email address")
    password: str = Field(..., max_length=100, description="Account password")


class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: Literal["borrower", "underwriter"]
    organization: str | None = None
    created_at: str


class AuthResponse(BaseModel):
    status: str = "success"
    token: str
    access_token: str = ""
    user: UserProfileResponse
