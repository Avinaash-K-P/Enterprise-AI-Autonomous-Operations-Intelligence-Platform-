import csv
from datetime import datetime
from io import BytesIO, StringIO
from typing import Any

from fastapi import HTTPException, status
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from app.models.anomaly import AnomalyEvent
from app.models.forecast_metric import ForecastMetric
from app.models.forecast_run import ForecastRun
from app.models.optimization import OptimizationRecommendation
from app.models.scenario import ScenarioSimulation
from sqlalchemy import func

ALLOWED_REPORT_TYPES = {
    "forecast",
    "anomaly",
    "optimization",
    "simulation",
    "executive",
}


def export_report_csv(
    db: Session,
    report_type: str,
    current_user,
) -> StreamingResponse:
    if report_type not in ALLOWED_REPORT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid report type",
        )

    output = StringIO()
    writer = csv.writer(output)

    rows = _build_report_rows(
        db=db,
        report_type=report_type,
        tenant_id=current_user.tenant_id,
    )

    if not rows:
        writer.writerow(["message"])
        writer.writerow(["No data available for this report"])
    else:
        writer.writerow(rows[0].keys())

        for row in rows:
            writer.writerow(row.values())

    output.seek(0)

    filename = f"{report_type}_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


def export_report_pdf(
    db: Session,
    report_type: str,
    current_user,
) -> StreamingResponse:
    if report_type not in ALLOWED_REPORT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid report type",
        )

    rows = _build_report_rows(
        db=db,
        report_type=report_type,
        tenant_id=current_user.tenant_id,
    )

    buffer = BytesIO()

    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    title = f"{report_type.title()} Report"
    generated_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    y_position = height - 50

    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(40, y_position, title)

    y_position -= 22
    pdf.setFont("Helvetica", 9)
    pdf.drawString(40, y_position, f"Generated at: {generated_at}")

    y_position -= 30

    if not rows:
        pdf.setFont("Helvetica", 11)
        pdf.drawString(40, y_position, "No data available for this report.")
    else:
        for index, row in enumerate(rows, start=1):
            if y_position < 90:
                pdf.showPage()
                y_position = height - 50

            pdf.setFont("Helvetica-Bold", 11)
            pdf.drawString(40, y_position, f"Record {index}")
            y_position -= 16

            pdf.setFont("Helvetica", 9)

            for key, value in row.items():
                if y_position < 70:
                    pdf.showPage()
                    y_position = height - 50
                    pdf.setFont("Helvetica", 9)

                text = f"{key}: {value}"
                pdf.drawString(55, y_position, text[:110])
                y_position -= 13

            y_position -= 12

    pdf.save()

    buffer.seek(0)

    filename = f"{report_type}_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


def _build_report_rows(
    db: Session,
    report_type: str,
    tenant_id: int,
) -> list[dict[str, Any]]:
    if report_type == "forecast":
        return _get_forecast_report_rows(db=db, tenant_id=tenant_id)

    if report_type == "anomaly":
        return _get_anomaly_report_rows(db=db, tenant_id=tenant_id)

    if report_type == "optimization":
        return _get_optimization_report_rows(db=db, tenant_id=tenant_id)

    if report_type == "simulation":
        return _get_simulation_report_rows(db=db, tenant_id=tenant_id)

    if report_type == "executive":
        return (
            _get_forecast_report_rows(db=db, tenant_id=tenant_id)[:5]
            + _get_anomaly_report_rows(db=db, tenant_id=tenant_id)[:5]
            + _get_optimization_report_rows(db=db, tenant_id=tenant_id)[:5]
            + _get_simulation_report_rows(db=db, tenant_id=tenant_id)[:5]
        )

    return []


def _get_forecast_report_rows(
    db: Session,
    tenant_id: int,
) -> list[dict[str, Any]]:
    runs = db.query(ForecastRun).filter(
        ForecastRun.tenant_id == tenant_id,
    ).order_by(ForecastRun.created_at.desc()).limit(50).all()

    return [
        {
            "section": "forecast",
            "run_id": run.id,
            "model_id": run.model_id,
            "run_type": run.run_type,
            "status": run.status,
            "forecast_start": run.forecast_start,
            "forecast_end": run.forecast_end,
            "performance_metrics": run.performance_metrics,
            "created_at": run.created_at,
        }
        for run in runs
    ]


def _get_anomaly_report_rows(
    db: Session,
    tenant_id: int,
) -> list[dict[str, Any]]:
    anomalies = db.query(AnomalyEvent).filter(
        AnomalyEvent.tenant_id == tenant_id,
    ).order_by(AnomalyEvent.detected_at.desc()).limit(50).all()

    return [
        {
            "section": "anomaly",
            "anomaly_id": anomaly.id,
            "metric_id": anomaly.metric_id,
            "entity_type": anomaly.entity_type,
            "entity_id": anomaly.entity_id,
            "anomaly_type": anomaly.anomaly_type,
            "severity": anomaly.severity,
            "score": anomaly.score,
            "status": anomaly.status,
            "detected_at": anomaly.detected_at,
        }
        for anomaly in anomalies
    ]


def _get_optimization_report_rows(
    db: Session,
    tenant_id: int,
) -> list[dict[str, Any]]:
    recommendations = db.query(OptimizationRecommendation).filter(
        OptimizationRecommendation.tenant_id == tenant_id,
    ).order_by(
        OptimizationRecommendation.rank.asc(),
        OptimizationRecommendation.created_at.desc(),
    ).limit(50).all()

    return [
        {
            "section": "optimization",
            "recommendation_id": rec.id,
            "recommendation_type": rec.recommendation_type,
            "title": rec.title,
            "priority": rec.priority,
            "rank": rec.rank,
            "estimated_cost_savings": rec.estimated_cost_savings,
            "estimated_operational_impact": rec.estimated_operational_impact,
            "status": rec.status,
            "created_at": rec.created_at,
        }
        for rec in recommendations
    ]


def _get_simulation_report_rows(
    db: Session,
    tenant_id: int,
) -> list[dict[str, Any]]:
    scenarios = db.query(ScenarioSimulation).filter(
        ScenarioSimulation.tenant_id == tenant_id,
    ).order_by(ScenarioSimulation.created_at.desc()).limit(50).all()

    return [
        {
            "section": "simulation",
            "scenario_id": scenario.id,
            "scenario_type": scenario.scenario_type,
            "name": scenario.name,
            "severity": scenario.severity,
            "operational_impact": scenario.operational_impact,
            "cost_change": scenario.cost_change,
            "predicted_savings": scenario.predicted_savings,
            "status": scenario.status,
            "created_at": scenario.created_at,
        }
        for scenario in scenarios
    ]


def get_forecast_summary(
    db: Session,
    current_user,
):
    total_runs = db.query(ForecastRun).filter(
        ForecastRun.tenant_id == current_user.tenant_id,
    ).count()

    completed_runs = db.query(ForecastRun).filter(
        ForecastRun.tenant_id == current_user.tenant_id,
        ForecastRun.status == "COMPLETED",
    ).count()

    failed_runs = db.query(ForecastRun).filter(
        ForecastRun.tenant_id == current_user.tenant_id,
        ForecastRun.status == "FAILED",
    ).count()

    latest_run = db.query(ForecastRun).filter(
        ForecastRun.tenant_id == current_user.tenant_id,
    ).order_by(ForecastRun.created_at.desc()).first()

    total_metrics = db.query(ForecastMetric).filter(
        ForecastMetric.tenant_id == current_user.tenant_id,
    ).count()

    return {
        "total_metrics": total_metrics,
        "total_runs": total_runs,
        "completed_runs": completed_runs,
        "failed_runs": failed_runs,
        "latest_run": {
            "id": latest_run.id,
            "model_id": latest_run.model_id,
            "status": latest_run.status,
            "run_type": latest_run.run_type,
            "forecast_start": latest_run.forecast_start,
            "forecast_end": latest_run.forecast_end,
            "performance_metrics": latest_run.performance_metrics,
            "created_at": latest_run.created_at,
        }
        if latest_run
        else None,
    }


def get_anomaly_summary(
    db: Session,
    current_user,
):
    total_anomalies = db.query(AnomalyEvent).filter(
        AnomalyEvent.tenant_id == current_user.tenant_id,
    ).count()

    open_anomalies = db.query(AnomalyEvent).filter(
        AnomalyEvent.tenant_id == current_user.tenant_id,
        AnomalyEvent.status == "open",
    ).count()

    high_anomalies = db.query(AnomalyEvent).filter(
        AnomalyEvent.tenant_id == current_user.tenant_id,
        AnomalyEvent.severity.in_(["high", "critical"]),
    ).count()

    severity_breakdown = db.query(
        AnomalyEvent.severity,
        func.count(AnomalyEvent.id),
    ).filter(
        AnomalyEvent.tenant_id == current_user.tenant_id,
    ).group_by(
        AnomalyEvent.severity,
    ).all()

    recent_anomalies = db.query(AnomalyEvent).filter(
        AnomalyEvent.tenant_id == current_user.tenant_id,
    ).order_by(AnomalyEvent.detected_at.desc()).limit(5).all()

    return {
        "total_anomalies": total_anomalies,
        "open_anomalies": open_anomalies,
        "high_or_critical_anomalies": high_anomalies,
        "severity_breakdown": {
            severity: count for severity, count in severity_breakdown
        },
        "recent_anomalies": [
            {
                "id": anomaly.id,
                "metric_id": anomaly.metric_id,
                "entity_type": anomaly.entity_type,
                "entity_id": anomaly.entity_id,
                "anomaly_type": anomaly.anomaly_type,
                "severity": anomaly.severity,
                "score": anomaly.score,
                "status": anomaly.status,
                "detected_at": anomaly.detected_at,
            }
            for anomaly in recent_anomalies
        ],
    }


def get_optimization_summary(
    db: Session,
    current_user,
):
    total_recommendations = db.query(OptimizationRecommendation).filter(
        OptimizationRecommendation.tenant_id == current_user.tenant_id,
    ).count()

    pending_recommendations = db.query(OptimizationRecommendation).filter(
        OptimizationRecommendation.tenant_id == current_user.tenant_id,
        OptimizationRecommendation.status == "pending",
    ).count()

    applied_recommendations = db.query(OptimizationRecommendation).filter(
        OptimizationRecommendation.tenant_id == current_user.tenant_id,
        OptimizationRecommendation.status == "applied",
    ).count()

    total_estimated_savings = db.query(
        func.coalesce(func.sum(OptimizationRecommendation.estimated_cost_savings), 0)
    ).filter(
        OptimizationRecommendation.tenant_id == current_user.tenant_id,
    ).scalar()

    average_confidence = db.query(
        func.coalesce(func.avg(OptimizationRecommendation.confidence_score), 0)
    ).filter(
        OptimizationRecommendation.tenant_id == current_user.tenant_id,
    ).scalar()

    top_recommendations = db.query(OptimizationRecommendation).filter(
        OptimizationRecommendation.tenant_id == current_user.tenant_id,
    ).order_by(
        OptimizationRecommendation.rank.asc(),
        OptimizationRecommendation.estimated_cost_savings.desc(),
    ).limit(5).all()

    return {
        "total_recommendations": total_recommendations,
        "pending_recommendations": pending_recommendations,
        "applied_recommendations": applied_recommendations,
        "total_estimated_savings": total_estimated_savings,
        "average_confidence": average_confidence,
        "top_recommendations": [
            {
                "id": rec.id,
                "recommendation_type": rec.recommendation_type,
                "title": rec.title,
                "priority": rec.priority,
                "rank": rec.rank,
                "estimated_cost_savings": rec.estimated_cost_savings,
                "confidence_score": rec.confidence_score,
                "status": rec.status,
            }
            for rec in top_recommendations
        ],
    }


def get_simulation_summary(
    db: Session,
    current_user,
):
    total_scenarios = db.query(ScenarioSimulation).filter(
        ScenarioSimulation.tenant_id == current_user.tenant_id,
    ).count()

    completed_scenarios = db.query(ScenarioSimulation).filter(
        ScenarioSimulation.tenant_id == current_user.tenant_id,
        ScenarioSimulation.status == "completed",
    ).count()

    total_predicted_savings = db.query(
        func.coalesce(func.sum(ScenarioSimulation.predicted_savings), 0)
    ).filter(
        ScenarioSimulation.tenant_id == current_user.tenant_id,
    ).scalar()

    average_operational_impact = db.query(
        func.coalesce(func.avg(ScenarioSimulation.operational_impact), 0)
    ).filter(
        ScenarioSimulation.tenant_id == current_user.tenant_id,
    ).scalar()

    recent_scenarios = db.query(ScenarioSimulation).filter(
        ScenarioSimulation.tenant_id == current_user.tenant_id,
    ).order_by(ScenarioSimulation.created_at.desc()).limit(5).all()

    return {
        "total_scenarios": total_scenarios,
        "completed_scenarios": completed_scenarios,
        "total_predicted_savings": total_predicted_savings,
        "average_operational_impact": average_operational_impact,
        "recent_scenarios": [
            {
                "id": scenario.id,
                "name": scenario.name,
                "scenario_type": scenario.scenario_type,
                "severity": scenario.severity,
                "operational_impact": scenario.operational_impact,
                "cost_change": scenario.cost_change,
                "predicted_savings": scenario.predicted_savings,
                "status": scenario.status,
            }
            for scenario in recent_scenarios
        ],
    }


def get_executive_dashboard(
    db: Session,
    current_user,
):
    forecast_summary = get_forecast_summary(db=db, current_user=current_user)
    anomaly_summary = get_anomaly_summary(db=db, current_user=current_user)
    optimization_summary = get_optimization_summary(db=db, current_user=current_user)
    simulation_summary = get_simulation_summary(db=db, current_user=current_user)

    return {
        "tenant_id": current_user.tenant_id,
        "generated_at": datetime.utcnow(),
        "forecast_summary": forecast_summary,
        "anomaly_summary": anomaly_summary,
        "optimization_summary": optimization_summary,
        "simulation_summary": simulation_summary,
        "executive_insights": [
            f"{forecast_summary['completed_runs']} forecast runs completed.",
            f"{anomaly_summary['high_or_critical_anomalies']} high or critical anomalies detected.",
            f"Estimated optimization savings: {optimization_summary['total_estimated_savings']}.",
            f"Simulation predicted savings: {simulation_summary['total_predicted_savings']}.",
        ],
    }