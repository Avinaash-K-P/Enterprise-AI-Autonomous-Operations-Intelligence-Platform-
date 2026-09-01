from __future__ import annotations

from typing import Any

import pandas as pd
from prophet import Prophet


def train_prophet_model(
    train_df: pd.DataFrame,
    config: dict[str, Any] | None = None,
) -> Prophet:
    config = config or {}

    prophet_df = train_df.rename(
        columns={
            "timestamp": "ds",
            "value": "y",
        }
    )[["ds", "y"]]

    model = Prophet(
        daily_seasonality=config.get("daily_seasonality", True),
        weekly_seasonality=config.get("weekly_seasonality", True),
        yearly_seasonality=config.get("yearly_seasonality", False),
        seasonality_mode=config.get("seasonality_mode", "additive"),
        interval_width=config.get("interval_width", 0.95),
    )

    model.fit(prophet_df)

    return model


def predict_prophet(
    model: Prophet,
    periods: int,
    frequency: str = "h",
) -> pd.DataFrame:
    future_df = model.make_future_dataframe(
        periods=periods,
        freq=frequency,
        include_history=False,
    )

    forecast_df = model.predict(future_df)

    return forecast_df[["ds", "yhat", "yhat_lower", "yhat_upper"]]


def evaluate_prophet(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    config: dict[str, Any] | None = None,
) -> list[float]:
    model = train_prophet_model(train_df=train_df, config=config)

    future_df = pd.DataFrame(
        {
            "ds": test_df["timestamp"].values,
        }
    )

    forecast_df = model.predict(future_df)

    return forecast_df["yhat"].tolist()


def forecast_with_prophet(
    train_df: pd.DataFrame,
    periods: int,
    frequency: str = "h",
    config: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    model = train_prophet_model(train_df=train_df, config=config)
    forecast_df = predict_prophet(
        model=model,
        periods=periods,
        frequency=frequency,
    )

    return [
        {
            "forecast_timestamp": row["ds"].to_pydatetime(),
            "predicted_value": round(float(row["yhat"]), 4),
            "lower_bound": round(float(row["yhat_lower"]), 4),
            "upper_bound": round(float(row["yhat_upper"]), 4),
            "confidence_score": 0.95,
        }
        for _, row in forecast_df.iterrows()
    ]