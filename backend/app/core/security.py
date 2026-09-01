from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from app.models.user import User
from app.core.config import settings
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.utils.token import generate_random_token

# Password Hashing

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password:str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):

    return pwd_context.verify(plain_password, hashed_password)


Secret_key = settings.SECRET_KEY

Algorithm = settings.ALGORITHM

Expire_minute = settings.ACCESS_TOKEN_EXPIRE_MINUTES

Reset_minute = settings.RESET_TOKEN_EXPIRE_MINUTES

Refresh_days = settings.REFRESH_TOKEN_EXPIRE_DAYS


# Create Access Token

def create_access_token(data:dict):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=Expire_minute)

    to_encode.update(
        {
            "exp": expire,
            "type": "access"
        }
    )    

    access_token = jwt.encode(
        to_encode,
        Secret_key,
        algorithm=Algorithm      
    )

    return access_token

def verify_access_token(token:str):

    try:
        payload = jwt.decode(token, Secret_key, algorithms=[Algorithm])
        if payload.get("type") != "access":
            return None 

        return payload

    except JWTError:
        return None

# Create Refresh Token

def create_refresh_token(data:dict):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(days= Refresh_days)

    to_encode.update(
        {
            "exp": expire,
            "type": "refresh"
        }
    )

    refresh_token = jwt.encode(
        to_encode,
        Secret_key,
        algorithm=Algorithm
    )

    return refresh_token

def verify_refresh_token(token: str):

    try:
        payload = jwt.decode(token, Secret_key, algorithms=[Algorithm] )

        if payload.get("type") != "refresh": 
            return None

        return payload

    except JWTError:
        return None    

# Dependency

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db:Session = Depends(get_db)   
):
    token = credentials.credentials

    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    email = payload.get("sub")

    if email is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload"
        )

    user = db.query(User).filter(
        User.email == email
    ).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user        

def verify_role(permission:str):

    ROLE_PERMISSIONS = {
        
        "admin": ["super_admin"],
    
        "manager": ["operational_manager"],
    
        "analyst": ["analyst"],
    
        "all": ["super_admin", "operational_manager", "analyst", "viewer"]

    }

    allowed_roles = ROLE_PERMISSIONS.get(permission)

    if not allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="Invalid permission"
        )

    def role_checker(current_user:User = Depends(get_current_user)):

        if current_user.role not in allowed_roles:

            raise HTTPException(status_code=403, detail="Access denied")

        return current_user

    return role_checker