from app.db.database import Base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from datetime import datetime
from enum import Enum

class DeviceStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class Device(Base):

    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)

    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=False)

    business_unit_id = Column(Integer, ForeignKey("business_units.id"), nullable=False)

    name = Column(String(50), nullable=False)

    device_type = Column(String(50), nullable=False)

    status = Column(SQLEnum(DeviceStatus), default=DeviceStatus.ACTIVE, nullable=False)

    

'''
devices
-------
id
tenant_id
facility_id
business_unit_id
name
device_type
status
metadata
created_at
'''