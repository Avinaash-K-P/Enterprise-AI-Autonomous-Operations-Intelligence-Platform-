from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import get_current_user
from app.schemas.tenant import (
    TenantCreate,
    TenantUpdate,
    AssignTenantRequest
)
from app.services.tenant_service import (
    create_tenant,
    get_tenants,
    get_tenant_by_id,
    update_tenant,
    delete_tenant,
    tenant_assign
)

router = APIRouter(tags=["Tenant Management"])

@router.post("/tenants")
def add_tenant(
    payload:TenantCreate,
    db:Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return create_tenant(db=db,payload=payload)

@router.get("/tenants")
def list_tenants(
    db:Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_tenants(db=db)

@router.get("/tenants/{id}")
def view_tenant(
    id:int,
    db:Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_tenant_by_id(db=db, tenant_id=id)

@router.put("/tenants/{id}")
def edit_tenant(
    id:int,
    payload:TenantUpdate,
    db:Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return update_tenant(
        db=db,
        payload=payload,
        tenant_id=id
    )

@router.delete("/tenants/{id}")
def remove_tenant(
    id:int,
    db:Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return delete_tenant(db=db,tenant_id=id)

@router.patch("/tenants/assign/{user_id}")
def assign_tenant(
    user_id:int,
    payload: AssignTenantRequest,
    db:Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return tenant_assign(
        db=db, 
        payload=payload,
        user_id=user_id
    )