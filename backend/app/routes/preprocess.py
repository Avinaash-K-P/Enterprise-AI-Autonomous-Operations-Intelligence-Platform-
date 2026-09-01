from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import verify_role
from app.services.preprocess_service import get_preprocessed_observations
from typing import Optional
from datetime import datetime

router = APIRouter(tags=["Preprocess Data"])

@router.get("/preprocessed")
def get_preprocessed_dataset(
    metric_id: int,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    frequency: str = "h",
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("analyst")),
):
    return get_preprocessed_observations(
        db=db,
        metric_id=metric_id,
        current_user=current_user,
        entity_type=entity_type,
        entity_id=entity_id,
        start_date=start_date,
        end_date=end_date,
        frequency=frequency,
    )