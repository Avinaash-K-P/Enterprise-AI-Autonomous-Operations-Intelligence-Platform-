from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.forecast_metric import ForecastMetric 
from app.schemas.forecast_metric import (
    CreateMetrics,
    UpdateMetrics
)

def create_metrics(db:Session, payload: CreateMetrics):

    code_exist = db.query(ForecastMetric).filter(
        ForecastMetric.code == payload.code
    ).first()

    if code_exist:
        raise HTTPException(status_code=409, detail="Metric already exist")

    new_metrics = ForecastMetric(
        tenant_id = payload.tenant_id,
        name = payload.name,
        code = payload.code, 
        description = payload.description,
        unit = payload.unit, 
        category = payload.category
    )

    db.add(new_metrics)
    db.commit()
    db.refresh(new_metrics)

    return {
        "message":"New forecast metrics added",
        "data": new_metrics
    } 

def get_metrics(db:Session, current_user):

    metrics_list = db.query(ForecastMetric).filter(
        ForecastMetric.tenant_id == current_user.tenant_id
    ).all()

    return {
        "message":"Forecast metrics list fetched",
        "data": metrics_list
    }

def get_metrics_by_id(db:Session, metric_id:int):

    metric = db.query(ForecastMetric).filter(
        ForecastMetric.id == metric_id
    ).first()

    if not metric:
        raise HTTPException(status_code=404, detail="Forecast metric not found")

    return {
        "message":"Forecast metrics details fetched",
        "data": metric
    }        

def update_metrics(db:Session, payload: UpdateMetrics, metric_id:int):

    metric = db.query(ForecastMetric).filter(
        ForecastMetric.id == metric_id
    ).first()

    if not metric:
        raise HTTPException(status_code=404, detail="Forecast metric not found")

    metric.tenant_id = payload.tenant_id #type:ignore
    metric.name = payload.name  #type:ignore
    metric.code = payload.code  #type:ignore
    metric.description = payload.description #type:ignore
    metric.unit = payload.unit  #type:ignore
    metric.category = payload.category  #type:ignore
    metric.is_active = payload.is_active #type:ignore

    db.commit()
    db.refresh(metric)

    return {
        "message": "Forecast metric details updated",
        "data": metric
    }

def delete_metric(db:Session, metric_id:int):

    metric = db.query(ForecastMetric).filter(
        ForecastMetric.id == metric_id
    ).first()

    if not metric:
        raise HTTPException(status_code=404, detail="Forecast metric not found")

    db.delete(metric)
    db.commit()

    return {
        "message": "Forecast metric deleted"
    }
