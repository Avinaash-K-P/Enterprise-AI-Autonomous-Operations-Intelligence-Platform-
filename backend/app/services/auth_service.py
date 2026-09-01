from datetime import datetime, timedelta
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.auth import ( 
    UserRegister, 
    UserLogin,
    RefreshTokenRequest, 
    ForgotPasswordRequest,
    ResetPasswordRequest
)    
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
)
from app.core.config import settings
from app.utils.token import generate_random_token

def create_user(db:Session, payload: UserRegister):

    existing_username = db.query(User).filter(
        User.username == payload.username,
    ).first()
    
    if existing_username: 
        raise HTTPException(status_code=409, detail="Username already exist")

    existing_email = db.query(User).filter(
        User.email == payload.email
    ).first()


    if existing_email:
        raise HTTPException(status_code=409, detail="Email already exist")

    new_user = User(
        username = payload.username,
        email = payload.email,
        password = hash_password(payload.password), 
        role = payload.role
    )


    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "New user registered!"
    }

def verify_user(db:Session, payload: UserLogin):

    valid_user = db.query(User).filter(
        User.email == payload.email
    ).first()

    if not valid_user:
        raise HTTPException(status_code=401, detail="Invalid Email")

    valid_password = verify_password(payload.password, valid_user.password) # type: ignore

    if not valid_password:
        raise HTTPException(status_code=401, detail="Invalid Password")

    # JWT encoding

    user_details = {
        "id": valid_user.id,
        "username": valid_user.username,
        "sub": valid_user.email,
        "role": valid_user.role
    }

    access_token = create_access_token(user_details)

    refresh_token = create_refresh_token(user_details)

    return {
        "message": "User login succesful!",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

def token_refresh(db:Session, payload: RefreshTokenRequest):

    token_payload = verify_refresh_token(
        payload.refresh_token
    )

    if token_payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token"
        )

    user_details = {
        "id": token_payload.get("id"), # type: ignore
        "sub": token_payload.get("sub"), # type: ignore
        "username": token_payload.get("username"), # type: ignore
        "role": token_payload.get("role") # type: ignore
    }

    access_token = create_access_token(user_details)

    return {
        "message": "Access token generated successfully!",
        "access_token": access_token,
        "token_type": "Bearer"
    }

def password_forgot(db:Session, payload:ForgotPasswordRequest):

    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid Email")

    token = generate_random_token()

    Reset_token_minutes = settings.RESET_TOKEN_EXPIRE_MINUTES

    user.reset_token = token # type: ignore
    user.reset_token_expiry = datetime.utcnow() + timedelta(minutes=Reset_token_minutes) # type: ignore

    db.commit()

    return {
            "message":"Password reset token generated",
            "reset_token": token
        }

def password_reset(db:Session, payload: ResetPasswordRequest): 

    user = db.query(User).filter(
        User.reset_token == payload.token
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")

    if datetime.utcnow() > user.reset_token_expiry: # type: ignore
        raise HTTPException(status_code=400, detail="Token expired")

    user.password = hash_password(payload.new_password)

    user.reset_token = None # type: ignore
    user.reset_token_expiry = None # type: ignore

    db.commit()

    return {
        "messaeg":"Password reset successful!"
    }

def get_profile(db:Session, user_id:int):

    profile = db.query(User).filter(
        User.id == user_id        
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    data = {
        "id": profile.id,
        "username": profile.username,
        "email": profile.email,
        "role": profile.role 
    }

    return {
        "message":"User profile fetched",
        "data": data
    }

