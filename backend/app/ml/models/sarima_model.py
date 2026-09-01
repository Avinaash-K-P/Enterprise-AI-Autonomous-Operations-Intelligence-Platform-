from __future__ import annotations

from typing import Any

import pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX


def _prepare_series(
    df: pd.DataFrame,
    frequency: str = "h",
) -> pd.Series:
    series_df = df[["timestamp", "value"]].copy()
    series_df["timestamp"] = pd.to_datetime(series_df["timestamp"])
    series_df["value"] = pd.to_numeric(series_df["value"], errors="coerce")

    series_df = series_df.dropna(subset=["timestamp", "value"])
    series_df = series_df.sort_values("timestamp")
    series_df = series_df.set_index("timestamp")

    series = series_df["value"].asfreq(frequency)

    series = series.interpolate(method="time")
    series = series.ffill()
    series = series.bfill()

    return series


def train_sarima_model(
    train_df: pd.DataFrame,
    frequency: str = "h",
    config: dict[str, Any] | None = None,
):
    config = config or {}

    order = tuple(config.get("order", (1, 1, 1)))
    seasonal_order = tuple(config.get("seasonal_order", (1, 1, 1, 24)))

    series = _prepare_series(train_df, frequency=frequency)

    model = SARIMAX(
        series,
        order=order,
        seasonal_order=seasonal_order,
        enforce_stationarity=False,
        enforce_invertibility=False,
    )

    fitted_model = model.fit(disp=False)

    return fitted_model


def evaluate_sarima(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    frequency: str = "h",
    config: dict[str, Any] | None = None,
) -> list[float]:
    fitted_model = train_sarima_model(
        train_df=train_df,
        frequency=frequency,
        config=config,
    )

    forecast_result = fitted_model.get_forecast(steps=len(test_df))
    predicted_values = forecast_result.predicted_mean

    return predicted_values.tolist()


def forecast_with_sarima(
    train_df: pd.DataFrame,
    periods: int,
    frequency: str = "h",
    config: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    fitted_model = train_sarima_model(
        train_df=train_df,
        frequency=frequency,
        config=config,
    )

    forecast_result = fitted_model.get_forecast(steps=periods)
    predicted_values = forecast_result.predicted_mean
    confidence_intervals = forecast_result.conf_int()

    last_timestamp = pd.to_datetime(train_df["timestamp"]).max()

    future_timestamps = pd.date_range(
        start=last_timestamp,
        periods=periods + 1,
        freq=frequency,
    )[1:]

    forecast = []

    for index, timestamp in enumerate(future_timestamps):
        predicted_value = float(predicted_values.iloc[index])
        lower_bound = float(confidence_intervals.iloc[index, 0])
        upper_bound = float(confidence_intervals.iloc[index, 1])

        forecast.append(
            {
                "forecast_timestamp": timestamp.to_pydatetime(),
                "predicted_value": round(predicted_value, 4),
                "lower_bound": round(lower_bound, 4),
                "upper_bound": round(upper_bound, 4),
                "confidence_score": 0.9,
            }
        )

    return forecast