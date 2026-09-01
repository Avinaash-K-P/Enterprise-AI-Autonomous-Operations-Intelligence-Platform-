from __future__ import annotations

from typing import Any

import pandas as pd
from xgboost import XGBRegressor


def _create_time_features(df: pd.DataFrame) -> pd.DataFrame:
    feature_df = df.copy()

    feature_df["timestamp"] = pd.to_datetime(feature_df["timestamp"])

    feature_df["hour"] = feature_df["timestamp"].dt.hour
    feature_df["dayofweek"] = feature_df["timestamp"].dt.dayofweek
    feature_df["day"] = feature_df["timestamp"].dt.day
    feature_df["month"] = feature_df["timestamp"].dt.month
    feature_df["is_weekend"] = feature_df["dayofweek"].isin([5, 6]).astype(int)

    return feature_df


def _create_lag_features(
    df: pd.DataFrame,
    lags: list[int],
    rolling_windows: list[int],
) -> pd.DataFrame:
    feature_df = df.copy()
    feature_df = feature_df.sort_values("timestamp")

    for lag in lags:
        feature_df[f"lag_{lag}"] = feature_df["value"].shift(lag)

    for window in rolling_windows:
        feature_df[f"rolling_mean_{window}"] = (
            feature_df["value"].shift(1).rolling(window=window).mean()
        )

    return feature_df


def _prepare_training_data(
    df: pd.DataFrame,
    config: dict[str, Any] | None = None,
) -> tuple[pd.DataFrame, pd.Series, list[str]]:
    config = config or {}

    lags = config.get("lags", [1, 2, 3, 24])
    rolling_windows = config.get("rolling_windows", [3, 6, 24])

    feature_df = df[["timestamp", "value"]].copy()
    feature_df["timestamp"] = pd.to_datetime(feature_df["timestamp"])
    feature_df["value"] = pd.to_numeric(feature_df["value"], errors="coerce")

    feature_df = feature_df.dropna(subset=["timestamp", "value"])
    feature_df = feature_df.sort_values("timestamp")

    feature_df = _create_time_features(feature_df)
    feature_df = _create_lag_features(
        df=feature_df,
        lags=lags,
        rolling_windows=rolling_windows,
    )

    feature_columns = [
        "hour",
        "dayofweek",
        "day",
        "month",
        "is_weekend",
        *[f"lag_{lag}" for lag in lags],
        *[f"rolling_mean_{window}" for window in rolling_windows],
    ]

    feature_df = feature_df.dropna(subset=feature_columns)

    x = feature_df[feature_columns]
    y = feature_df["value"]

    return x, y, feature_columns


def train_xgboost_model(
    train_df: pd.DataFrame,
    config: dict[str, Any] | None = None,
) -> tuple[XGBRegressor, list[str]]:
    config = config or {}

    x_train, y_train, feature_columns = _prepare_training_data(
        df=train_df,
        config=config,
    )

    if x_train.empty:
        raise ValueError("Not enough rows to create XGBoost lag features")

    model = XGBRegressor(
        n_estimators=config.get("n_estimators", 200),
        learning_rate=config.get("learning_rate", 0.05),
        max_depth=config.get("max_depth", 4),
        subsample=config.get("subsample", 0.9),
        colsample_bytree=config.get("colsample_bytree", 0.9),
        objective="reg:squarederror",
        random_state=config.get("random_state", 42),
    )

    model.fit(x_train, y_train)

    return model, feature_columns


def evaluate_xgboost(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    config: dict[str, Any] | None = None,
) -> list[float]:
    combined_df = pd.concat([train_df, test_df], ignore_index=True)

    model, feature_columns = train_xgboost_model(
        train_df=train_df,
        config=config,
    )

    prepared_df = combined_df[["timestamp", "value"]].copy()
    prepared_df["timestamp"] = pd.to_datetime(prepared_df["timestamp"])
    prepared_df["value"] = pd.to_numeric(prepared_df["value"], errors="coerce")
    prepared_df = prepared_df.dropna(subset=["timestamp", "value"])
    prepared_df = prepared_df.sort_values("timestamp")

    lags = (config or {}).get("lags", [1, 2, 3, 24])
    rolling_windows = (config or {}).get("rolling_windows", [3, 6, 24])

    prepared_df = _create_time_features(prepared_df)
    prepared_df = _create_lag_features(
        df=prepared_df,
        lags=lags,
        rolling_windows=rolling_windows,
    )

    test_timestamps = set(pd.to_datetime(test_df["timestamp"]))

    test_feature_df = prepared_df[
        prepared_df["timestamp"].isin(test_timestamps)
    ].dropna(subset=feature_columns)

    if test_feature_df.empty:
        raise ValueError("Not enough test rows to evaluate XGBoost model")

    predictions = model.predict(test_feature_df[feature_columns])

    return predictions.tolist()


def forecast_with_xgboost(
    train_df: pd.DataFrame,
    periods: int,
    frequency: str = "h",
    config: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    config = config or {}

    model, feature_columns = train_xgboost_model(
        train_df=train_df,
        config=config,
    )

    history_df = train_df[["timestamp", "value"]].copy()
    history_df["timestamp"] = pd.to_datetime(history_df["timestamp"])
    history_df["value"] = pd.to_numeric(history_df["value"], errors="coerce")
    history_df = history_df.dropna(subset=["timestamp", "value"])
    history_df = history_df.sort_values("timestamp").reset_index(drop=True)

    lags = config.get("lags", [1, 2, 3, 24])
    rolling_windows = config.get("rolling_windows", [3, 6, 24])

    forecast_rows = []

    for _ in range(periods):
        next_timestamp = history_df["timestamp"].max() + pd.tseries.frequencies.to_offset(
            frequency
        )

        temp_df = pd.concat(
            [
                history_df,
                pd.DataFrame(
                    [
                        {
                            "timestamp": next_timestamp,
                            "value": None,
                        }
                    ]
                ),
            ],
            ignore_index=True,
        )

        temp_df = _create_time_features(temp_df)
        temp_df = _create_lag_features(
            df=temp_df,
            lags=lags,
            rolling_windows=rolling_windows,
        )

        next_features = temp_df.iloc[[-1]][feature_columns]

        predicted_value = float(model.predict(next_features)[0])

        history_df = pd.concat(
            [
                history_df,
                pd.DataFrame(
                    [
                        {
                            "timestamp": next_timestamp,
                            "value": predicted_value,
                        }
                    ]
                ),
            ],
            ignore_index=True,
        )

        forecast_rows.append(
            {
                "forecast_timestamp": next_timestamp.to_pydatetime(),
                "predicted_value": round(predicted_value, 4),
                "lower_bound": round(predicted_value * 0.9, 4),
                "upper_bound": round(predicted_value * 1.1, 4),
                "confidence_score": 0.85,
            }
        )

    return forecast_rows