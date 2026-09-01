from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile, status
from app.models.observation import Observation
from app.models.forecast_metric import ForecastMetric
import csv
import json
from datetime import datetime
from decimal import Decimal, InvalidOperation
from io import StringIO
from app.ml.validation import validate_dataset_file
from pathlib import Path
from uuid import uuid4 

BASE_UPLOAD_DIR = Path("uploads")
DATASET_UPLOAD_DIR = BASE_UPLOAD_DIR / "datasets"

REQUIRED_COLUMNS = {"entity_type", "entity_id", "timestamp", "value"}

ALLOWED_ENTITY_TYPES = {
    "tenant",
    "region",
    "business_unit",
    "facility",
    "device",
}

async def save_uploaded_dataset_file(
    file: UploadFile,
    metric_id: int,
    tenant_id: int
) -> str:
    
    tenant_metric_dir = DATASET_UPLOAD_DIR / str(tenant_id) / str(metric_id)
    tenant_metric_dir.mkdir(parents=True, exist_ok=True)

    original_filename = Path(file.filename).name # type: ignore
    unique_filename = f"{uuid4().hex}_{original_filename}"

    file_path = tenant_metric_dir / unique_filename

    content = await file.read()

    with open(file_path, "wb") as buffer:
        buffer.write(content)

    await file.seek(0)

    return str(file_path)


async def upload_dataset(
    db: Session,
    file: UploadFile,
    metric_id: int,
    tenant_id:int,
):
    if not file.filename.endswith(".csv"): # type: ignore
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported",
        )

    metric = db.query(ForecastMetric).filter(
        ForecastMetric.id == metric_id,
        ForecastMetric.tenant_id == tenant_id,
    ).first()

    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Forecast metric not found for this tenant",
        )

    validation_result = await validate_dataset_file(file)

    if not validation_result["is_valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=validation_result,
        )

    content = await file.read()
    decoded_content = content.decode("utf-8")
    csv_reader = csv.DictReader(StringIO(decoded_content))

    if not csv_reader.fieldnames:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file is empty",
        )

    missing_columns = REQUIRED_COLUMNS - set(csv_reader.fieldnames)

    if missing_columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required columns: {', '.join(missing_columns)}",
        )

    inserted_count = 0
    skipped_count = 0

    for row in csv_reader:
        try:
            entity_type = row["entity_type"].strip()

            if entity_type not in ALLOWED_ENTITY_TYPES:
                skipped_count += 1
                continue

            raw_value = (row.get("value") or "").strip()

            if not raw_value:
                skipped_count += 1
                continue
            
            value = Decimal(raw_value)

            entity_id = int(row["entity_id"])
            timestamp = datetime.fromisoformat(row["timestamp"].strip())
            value = Decimal(row["value"])

            source = row.get("source") or "csv_upload"
            quality_flag = row.get("quality_flag") or "valid"

            metadata_value = row.get("metadata")
            extra_data = json.loads(metadata_value) if metadata_value else None

            observation = Observation(
                tenant_id=tenant_id,
                metric_id=metric_id,
                entity_type=entity_type,
                entity_id=entity_id,
                timestamp=timestamp,
                value=value,
                source=source,
                quality_flag=quality_flag,
                extra_data=extra_data,
            )

            db.add(observation)
            inserted_count += 1

        except (ValueError, InvalidOperation, json.JSONDecodeError):
            skipped_count += 1

    db.commit()

    save_uploaded_dataset_file(file=file, metric_id= metric_id, tenant_id=tenant_id) #type:ignore

    await file.seek(0)

    return {
        "message": "Dataset uploaded successfully",
        "inserted_count": inserted_count,
        "skipped_count": skipped_count,
    }





