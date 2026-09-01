from __future__ import annotations

from typing import Any

import pandas as pd


def preprocess_time_series(
    rows: list[dict[str, Any]],
    frequency: str = "h",
) -> dict[str, Any]:
    """
    Preprocess uploaded time-series rows for forecasting.

    Expected row keys:
    - timestamp
    - value
    - entity_type
    - entity_id
    """

    if not rows:
        return {
            "is_success": False,
            "message": "No rows provided for preprocessing",
            "row_count": 0,
            "data": [],
            "summary": {},
        }

    df = pd.DataFrame(rows)

    required_columns = {"timestamp", "value", "entity_type", "entity_id"}
    missing_columns = required_columns - set(df.columns)

    if missing_columns:
        return {
            "is_success": False,
            "message": f"Missing required columns: {', '.join(sorted(missing_columns))}",
            "row_count": len(df),
            "data": [],
            "summary": {},
        }

    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df["value"] = pd.to_numeric(df["value"], errors="coerce")

    before_drop_count = len(df)

    df = df.dropna(subset=["timestamp"])
    dropped_invalid_timestamps = before_drop_count - len(df)

    df = df.sort_values("timestamp")

    duplicate_count = df.duplicated(
        subset=["entity_type", "entity_id", "timestamp"]
    ).sum()

    df = (
        df.groupby(["entity_type", "entity_id", "timestamp"], as_index=False)
        .agg(
            {
                "value": "mean",
            }
        )
    )

    processed_frames = []
    missing_timestamp_count = 0

    for (entity_type, entity_id), group in df.groupby(["entity_type", "entity_id"]):
        group = group.sort_values("timestamp")
        group = group.set_index("timestamp")

        full_index = pd.date_range(
            start=group.index.min(),
            end=group.index.max(),
            freq=frequency,
        )

        missing_timestamp_count += len(full_index.difference(group.index)) # type: ignore

        group = group.reindex(full_index)
        group.index.name = "timestamp"

        group["entity_type"] = entity_type # type: ignore
        group["entity_id"] = entity_id # type: ignore

        missing_value_count_before = group["value"].isna().sum()

        group["value"] = group["value"].interpolate(method="time")
        group["value"] = group["value"].ffill()
        group["value"] = group["value"].bfill()

        mean_value = group["value"].mean()
        std_value = group["value"].std()

        if pd.notna(std_value) and std_value > 0:
            z_score = (group["value"] - mean_value).abs() / std_value
            outlier_mask = z_score > 3

            outlier_count = int(outlier_mask.sum())

            group.loc[outlier_mask, "value"] = None
            group["value"] = group["value"].interpolate(method="time")
            group["value"] = group["value"].ffill()
            group["value"] = group["value"].bfill()
        else:
            outlier_count = 0

        group["preprocessing_status"] = "processed"

        processed_frames.append(group.reset_index())

    processed_df = pd.concat(processed_frames, ignore_index=True)

    processed_df["timestamp"] = processed_df["timestamp"].dt.strftime(
        "%Y-%m-%dT%H:%M:%S"
    )

    data = processed_df[
        ["entity_type", "entity_id", "timestamp", "value", "preprocessing_status"]
    ].to_dict(orient="records")

    return {
        "is_success": True,
        "message": "Time-series preprocessing completed successfully",
        "row_count": len(data),
        "data": data,
        "summary": {
            "input_rows": before_drop_count,
            "output_rows": len(data),
            "dropped_invalid_timestamps": int(dropped_invalid_timestamps),
            "duplicate_rows_merged": int(duplicate_count),
            "missing_timestamps_filled": int(missing_timestamp_count),
            "frequency": frequency,
        },
    }