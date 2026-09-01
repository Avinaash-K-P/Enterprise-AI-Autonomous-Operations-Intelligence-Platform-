from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class TenantCreate(BaseModel):
    organization_name: str = Field(..., min_length=2, max_length=150)
    industry: Optional[str] = Field(default=None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=30)

class TenantUpdate(BaseModel):
    organization_name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    industry: Optional[str] = Field(default=None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=30)
    status: Optional[str] = Field(default=None, max_length=30)

class AssignTenantRequest(BaseModel):
    tenant_id: int
