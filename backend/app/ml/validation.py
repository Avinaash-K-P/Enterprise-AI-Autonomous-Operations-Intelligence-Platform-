import csv
import json
from datetime import datetime
from decimal import Decimal, InvalidOperation
from io import StringIO
from typing import Any

from fastapi import UploadFile


REQUIRED_COLUMNS = {
    "entity_type",
    "entity_id",
    "timestamp",
    "value",
    "source",
    "quality_flag",
    "metadata",
}

ALLOWED_ENTITY_TYPES = {
    "tenant",
    "region",
    "business_unit",
    "facility",
    "device",
}

ALLOWED_QUALITY_FLAGS = {
    "valid",
    "missing",
    "estimated",
    "outlier",
    "corrected",
    "delayed",
}

ALLOWED_SOURCES = {
    "csv_upload",
    "sensor_gateway",
    "iot_sensor",
    "erp_system",
}


async def validate_dataset_file(file: UploadFile) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    row_count = 0

    if not file.filename or not file.filename.endswith(".csv"):
        return {
            "is_valid": False,
            "row_count": 0,
            "errors": ["Only CSV files are supported"],
            "warnings": [],
        }

    content = await file.read()
    decoded_content = content.decode("utf-8-sig")
    csv_reader = csv.DictReader(StringIO(decoded_content))

    if not csv_reader.fieldnames:
        return {
            "is_valid": False,
            "row_count": 0,
            "errors": ["CSV file is empty or missing headers"],
            "warnings": [],
        }

    missing_columns = REQUIRED_COLUMNS - set(csv_reader.fieldnames)

    if missing_columns:
        errors.append(
            f"Missing required columns: {', '.join(sorted(missing_columns))}"
        )

    extra_columns = set(csv_reader.fieldnames) - REQUIRED_COLUMNS

    if extra_columns:
        warnings.append(
            f"Extra columns found and ignored: {', '.join(sorted(extra_columns))}"
        )

    for row_number, row in enumerate(csv_reader, start=2):
        row_count += 1

        entity_type = (row.get("entity_type") or "").strip()
        entity_id = (row.get("entity_id") or "").strip()
        timestamp = (row.get("timestamp") or "").strip()
        value = (row.get("value") or "").strip()
        source = (row.get("source") or "").strip()
        quality_flag = (row.get("quality_flag") or "").strip()
        metadata = (row.get("metadata") or "").strip()

        if entity_type not in ALLOWED_ENTITY_TYPES:
            errors.append(f"Row {row_number}: invalid entity_type '{entity_type}'")

        try:
            int(entity_id)
        except ValueError:
            errors.append(f"Row {row_number}: entity_id must be an integer")

        try:
            datetime.fromisoformat(timestamp)
        except ValueError:
            errors.append(f"Row {row_number}: timestamp must be ISO datetime format")

        # try:
        #     Decimal(value)
        # except InvalidOperation:
        #     errors.append(f"Row {row_number}: value must be numeric")

        if not value:
            warnings.append(
                f"Row {row_number}: value is missing and will be skipped during upload"
            )
        else:
            try:
                Decimal(value)
            except InvalidOperation:
                errors.append(f"Row {row_number}: value must be numeric")        

        if source and source not in ALLOWED_SOURCES:
            errors.append(f"Row {row_number}: invalid source '{source}'")

        if quality_flag not in ALLOWED_QUALITY_FLAGS:
            errors.append(
                f"Row {row_number}: invalid quality_flag '{quality_flag}'"
            )

        if metadata:
            try:
                json.loads(metadata)
            except json.JSONDecodeError:
                errors.append(f"Row {row_number}: metadata must be valid JSON")

        if quality_flag in {"missing", "estimated", "outlier"}:
            warnings.append(
                f"Row {row_number}: quality_flag is '{quality_flag}'"
            )

    if row_count == 0:
        errors.append("CSV file contains no data rows")

    await file.seek(0)

    return {
        "is_valid": len(errors) == 0,
        "row_count": row_count,
        "errors": errors,
        "warnings": warnings,
    }