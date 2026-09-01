from app.db.database import Base
from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum
from enum import Enum
from datetime import datetime

class TenantStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class Tenant(Base):

    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)

    organization_name = Column(String(30), nullable=False)

    industry = Column(String(50), nullable=False)

    email = Column(String(50), nullable=False)

    phone = Column(String(15), nullable=False)

    status = Column(SQLEnum(TenantStatus), default=TenantStatus.ACTIVE, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    updated_at = Column(DateTime, nullable=True)
