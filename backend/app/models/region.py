from app.db.database import Base
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime

class Region(Base):

    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, index=True)

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)

    name = Column(String(50), nullable=False)

    code = Column(String(20), nullable=False)

    country = Column(String(30), nullable=False)

    state = Column(String(30), nullable=False)

    city = Column(String(30), nullable=False)

    timezone = Column(String(30), nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)  

    updated_at = Column(DateTime, nullable=False)  

