from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.security import verify_role
from app.db.database import get_db
from app.schemas.anomaly import (
    AnomalyDetectionRequest,
    AnomalyEventUpdate,
)
from app.services.anomaly_service import (
    detect_anomalies,
    list_anomaly_events, 
    get_anomaly_event_by_id,
    update_anomaly_event,
    delete_anomaly_event
)


router = APIRouter(tags=["Anomalies Detection"])

@router.post("/anomalies/detect")
def add_anomalies(
    payload: AnomalyDetectionRequest,
    db:Session = Depends(get_db),
    current_user = Depends(verify_role("analyst"))
):
    return detect_anomalies(db=db, payload=payload, current_user=current_user)

@router.get("/anomalies")
def list_anomalies(
    metric_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    severity: Optional[str] = None,
    status_filter: Optional[str] = None,
    db:Session = Depends(get_db),
    current_user = Depends(verify_role("analyst"))
):
    return list_anomaly_events(db=db, current_user=current_user)

@router.get("/anomalies/{id}")
def view_anomalies(
    id:int,
    db:Session = Depends(get_db),
    current_user = Depends(verify_role("analyst"))
):
    return get_anomaly_event_by_id(db=db, anomaly_id=id ,current_user=current_user)

@router.patch("/anomalies/{id}")
def edit_anomaly_event(
    id:int,
    payload:AnomalyEventUpdate,
    db:Session = Depends(get_db),
    current_user = Depends(verify_role("analyst"))
):
    return update_anomaly_event(db=db, anomaly_id=id ,payload=payload, current_user=current_user)

@router.delete("/anomalies/{id}")
def remove_anomaly_event(    
    id:int,
    db:Session = Depends(get_db),
    current_user = Depends(verify_role("analyst"))
):
    return delete_anomaly_event(db=db, anomaly_id=id, current_user=current_user)


'''
POST /anomalies/detect
GET /anomalies
GET /anomalies/{id}
PATCH /anomalies/{id}
DELETE /anomalies/{id}
'''