from app.db.database import Base
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from enum import Enum

class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    OPERATIONAL_MANAGER = "operational_manager"
    ANALYST = "analyst"
    VIEWER = "viewer"

class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True)

    username = Column(String(50), unique=True, nullable=False)

    email = Column(String(100), unique=True, nullable=False)

    password = Column(String(100), nullable=False)

    role = Column(SQLEnum(UserRole), default=UserRole.VIEWER, nullable=False)

    active = Column(Boolean, default=True, nullable=False)

    reset_token = Column(String(255), nullable=True)

    reset_token_expiry = Column(DateTime, nullable=True)

    