from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session
from app.core.security import verify_role
from app.db.database import get_db
from app.services.dataset_service import upload_dataset

router = APIRouter(tags=["Time Series Observations"])


@router.post("/dataset/upload")
async def upload_time_series_dataset(
    metric_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("analyst")),
):
    return await upload_dataset(
        db=db,
        file=file,
        metric_id=metric_id,
        tenant_id = current_user.tenant_id,
    )