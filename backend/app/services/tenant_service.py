from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.tenant import (
    TenantCreate,
    TenantUpdate,
    AssignTenantRequest
)

def create_tenant(db:Session, payload:TenantCreate):

    tenant_exist = db.query(Tenant).filter(
        Tenant.organization_name == payload.organization_name
    ).first()

    if tenant_exist:
        raise HTTPException(status_code=409, detail="Organization already exist")

    new_tenant = Tenant(
        organization_name = payload.organization_name,
        industry = payload.industry,
        email = payload.email,
        phone = payload.phone
    )

    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)

    return {
        "message": "New tenant added",
        "data": new_tenant
    }

def get_tenants(db:Session):

    tenants = db.query(Tenant).all()

    return {
        "message": "Tenant list fetched",
        "data": tenants
    }

def get_tenant_by_id(db:Session, tenant_id:int):

    tenant = db.query(Tenant).filter(
        Tenant.id == tenant_id
    ).first()

    if not tenant:
        raise HTTPException(status_code=404, detail="tenant not found")

    return {
        "message": "Tenant details fetched",
        "data": tenant
    }

def update_tenant(db:Session, payload:TenantUpdate, tenant_id:int):

    tenant = db.query(Tenant).filter(
        Tenant.id == tenant_id
    ).first()

    if not tenant:
        raise HTTPException(status_code=404, detail="tenant not found")

    tenant.organization_name = payload.organization_name #type:ignore
    tenant.industry = payload.industry #type:ignore
    tenant.email = payload.email #type:ignore
    tenant.phone = payload.phone #type:ignore  
    tenant.status = payload.status #type:ignore

    db.commit()
    db.refresh(tenant)

    return {
        "message": "Tenant details updated",
        "data": tenant
    }

def delete_tenant(db:Session, tenant_id:int):

    tenant = db.query(Tenant).filter(
        Tenant.id == tenant_id
    ).first()

    if not tenant:
        raise HTTPException(status_code=404, detail="tenant not found")

    db.delete(tenant)
    db.commit()

    return {
        "message": "Tenant details deleted"
    }

def tenant_assign(db:Session, payload:AssignTenantRequest, user_id:int):

    tenant = db.query(Tenant).filter(
        Tenant.id == payload.tenant_id 
    ).first()

    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not exist")

    user = db.query(User).filter(
        User.id == user_id 
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not exist")

    user.tenant_id = tenant.id  # type: ignore

    db.commit() 
    db.refresh(user)

    return{
        "message": f"Tenant {tenant.organization_name} assigned to user {user.username}"
    }

