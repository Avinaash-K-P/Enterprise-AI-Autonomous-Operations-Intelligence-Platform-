from app.db.database import Base
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime

class ExternalFactor(Base):

    __tablename__ = "external_factor"

    id = Column(Integer, primary_key=True, index=True)

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)

    entity_type = Column(String(30), nullable=False)

    entity_id = Column(Integer, nullable=False)

    factor_type = Column(String)

'''
id
tenant_id
entity_type
entity_id
factor_type
timestamp
value
impact_score
metadata
created_at
'''    