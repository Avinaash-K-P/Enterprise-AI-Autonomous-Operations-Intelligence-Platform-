from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error

from app.ml.models.prophet_model import evaluate_prophet, forecast_with_prophet
from app.ml.models.sarima_model import evaluate_sarima, forecast_with_sarima
from app.ml.models.xgboost_model import evaluate_xgboost, forecast_with_xgboost

SUPPORTED_MODEL_TYPES = {
    "prophet",
    "sarima",
    "xgboost",
}


@dataclass
class ForecastModelOutput:
    model_type: str
    forecast: list[dict[str, Any]]
    metrics: dict[str, float]
    metadata: dict[str, Any]


def prepare_forecasting_dataframe(rows: list[dict[str, Any]]) -> pd.DataFrame:
    df = pd.DataFrame(rows)

    if df.empty:
        raise ValueError("No data available for forecasting")

    required_columns = {"timestamp", "value"}

    missing_columns = required_columns - set(df.columns)

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {', '.join(sorted(missing_columns))}"
        )

    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df["value"] = pd.to_numeric(df["value"], errors="coerce")

    df = df.dropna(subset=["timestamp", "value"])
    df = df.sort_values("timestamp")

    if len(df) < 10:
        raise ValueError("At least 10 valid observations are required for forecasting")

    return df


def split_train_test(
    df: pd.DataFrame,
    test_size: float = 0.2,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    split_index = int(len(df) * (1 - test_size))

    train_df = df.iloc[:split_index]
    test_df = df.iloc[split_index:]

    if train_df.empty or test_df.empty:
        raise ValueError("Unable to split dataset into train and test sets")

    return train_df, test_df

def calculate_metrics(
    actual_values: list[float] | np.ndarray,
    predicted_values: list[float] | np.ndarray,
) -> dict[str, float]:
    actual = np.array(actual_values, dtype=float)
    predicted = np.array(predicted_values, dtype=float)

    min_length = min(len(actual), len(predicted))

    if min_length == 0:
        raise ValueError("No prediction values available for metric calculation")

    actual = actual[-min_length:]
    predicted = predicted[-min_length:]

    mae = mean_absolute_error(actual, predicted)
    
    mse = mean_squared_error(actual, predicted)
    rmse = np.sqrt(mse)
    
    non_zero_mask = actual != 0

    if non_zero_mask.any():
        mape = (
            np.mean(
                np.abs(
                    (actual[non_zero_mask] - predicted[non_zero_mask])
                    / actual[non_zero_mask]
                )
            )
            * 100
        )
    else:
        mape = 0.0

    return {
        "mae": round(float(mae), 4),
        "rmse": round(float(rmse), 4),
        "mape": round(float(mape), 4),
    }

def naive_forecast(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
) -> list[float]:
    last_value = float(train_df["value"].iloc[-1])

    return [last_value for _ in range(len(test_df))]


def train_and_forecast(
    rows: list[dict[str, Any]],
    model_type: str,
    forecast_periods: int,
    frequency: str = "h",
    config: dict[str, Any] | None = None,
) -> ForecastModelOutput:
    if model_type not in SUPPORTED_MODEL_TYPES:
        raise ValueError(f"Unsupported model_type: {model_type}")

    df = prepare_forecasting_dataframe(rows)
    train_df, test_df = split_train_test(df)

    # Temporary baseline until individual model files are added.
    if model_type == "prophet":
        test_predictions = evaluate_prophet(
            train_df=train_df,
            test_df=test_df,
            config=config,
        )

        forecast = forecast_with_prophet(
            train_df=df,
            periods=forecast_periods,
            frequency=frequency,
            config=config,
        )

    elif model_type == "sarima":
        test_predictions = evaluate_sarima(
            train_df=train_df,
            test_df=test_df,
            frequency=frequency,
            config=config,
        )

        forecast = forecast_with_sarima(
            train_df=df,
            periods=forecast_periods,
            frequency=frequency,
            config=config,
        )

    elif model_type == "xgboost":
        test_predictions = evaluate_xgboost(
            train_df=train_df,
            test_df=test_df,
            config=config,
        )

        forecast = forecast_with_xgboost(
            train_df=df,
            periods=forecast_periods,
            frequency=frequency,
            config=config,
        )

    else:
        raise ValueError(f"Unsupported model_type: {model_type}")

    metrics = calculate_metrics(
        actual_values=test_df["value"].to_numpy(),
        predicted_values=test_predictions,
    )

    return ForecastModelOutput(
        model_type=model_type,
        forecast=forecast,
        metrics=metrics,
        metadata={
            "model_type": model_type,
            "frequency": frequency,
            "forecast_periods": forecast_periods,
            "training_rows": len(train_df),
            "testing_rows": len(test_df),
            "config": config or {},
        },
    )


def compare_models(
    rows: list[dict[str, Any]],
    model_types: list[str],
    forecast_periods: int,
    frequency: str = "h",
    config: dict[str, Any] | None = None,
) -> dict[str, Any]:
    results: list[ForecastModelOutput] = []

    for model_type in model_types:
        output = train_and_forecast(
            rows=rows,
            model_type=model_type,
            forecast_periods=forecast_periods,
            frequency=frequency,
            config=config,
        )

        results.append(output)

    best_result = min(results, key=lambda result: result.metrics["rmse"])

    return {
        "best_model": best_result.model_type,
        "models": [
            {
                "model_type": result.model_type,
                "metrics": result.metrics,
                "metadata": result.metadata,
            }
            for result in results
        ],
        "forecast": best_result.forecast,
    }