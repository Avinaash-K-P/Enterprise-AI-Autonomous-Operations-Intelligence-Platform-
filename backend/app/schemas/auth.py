from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class UserRegister(BaseModel):
    username:str
    email:EmailStr
    password:str 
    role:UserRole

class UserLogin(BaseModel):
    email:EmailStr
    password:str 

class RefreshTokenRequest(BaseModel):
    refresh_token:str

class ForgotPasswordRequest(BaseModel):
    email:EmailStr

class ResetPasswordRequest(BaseModel):
    token:str
    new_password:str

