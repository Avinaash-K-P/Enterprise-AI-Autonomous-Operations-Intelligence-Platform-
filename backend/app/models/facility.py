from app.db.database import Base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime

class Facility(Base):

    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)

    name = Column(String(50), nullable=False)

    region = Column(String(50), nullable=False)

    location = Column(String(50), nullable=False)

    facility_type = Column(String(50), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

