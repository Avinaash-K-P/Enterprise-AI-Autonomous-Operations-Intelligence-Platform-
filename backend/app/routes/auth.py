from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import verify_role
from app.schemas.auth import (
    UserLogin,
    UserRegister,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from app.services.auth_service import (
    create_user,
    verify_user,
    token_refresh,
    password_forgot,
    password_reset,
    get_profile
)

router = APIRouter(tags=["Authentication"])

@router.post("/auth/register")
def register_user(
    payload: UserRegister,
    db:Session = Depends(get_db)
):
    return create_user(db=db, payload=payload)

@router.post("/auth/login")
def login_user(
    payload: UserLogin,
    db:Session = Depends(get_db)
):
    return verify_user(db=db, payload=payload)

@router.get("/auth/get-me")
def view_profile(
    db:Session = Depends(get_db),
    current_user = Depends(verify_role("all"))
):
    return get_profile(db=db, user_id=current_user.id)

@router.post("/auth/refresh-token")
def refresh_token(
    payload: RefreshTokenRequest,
    db:Session = Depends(get_db)
):
    return token_refresh(db=db, payload=payload)

@router.post("/auth/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    db:Session = Depends(get_db)
):
    return password_forgot(db=db, payload=payload)

@router.post("/auth/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    db:Session = Depends(get_db)
):
    return password_reset(db=db, payload=payload)


