from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import verify_role
from app.db.database import get_db
from app.schemas.root_cause import (
    RootCauseAnalysisRequest,
    RootCauseAnalysisResponse,
)
from app.services.root_cause_service import analyze_root_cause

router = APIRouter(
    prefix="/root-cause",
    tags=["Root Cause Analysis"],
)


@router.post(
    "/analyze/{anomaly_id}",
    response_model=RootCauseAnalysisResponse,
)
def analyze_root_cause_by_anomaly(
    anomaly_id: int,
    payload: RootCauseAnalysisRequest,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("analyst")),
):
    return analyze_root_cause(
        db=db,
        anomaly_id=anomaly_id,
        payload=payload,
        current_user=current_user,
    )

@router.get(
    "/analyze/{anomaly_id}",
    response_model=RootCauseAnalysisResponse,
)
def get_root_cause_by_anomaly(
    anomaly_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("analyst")),
):
    payload = RootCauseAnalysisRequest()

    return analyze_root_cause(
        db=db,
        anomaly_id=anomaly_id,
        payload=payload,
        current_user=current_user,
    )