from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import verify_role
from app.db.database import get_db
from app.schemas.optimization import (
    OptimizationGenerateRequest,
    OptimizationRecommendationResponse,
    OptimizationRecommendationUpdate,
)
from app.services.optimization_service import (
    apply_optimization_recommendation,
    delete_optimization_recommendation,
    generate_optimization_recommendations,
    get_optimization_recommendation_by_id,
    list_optimization_recommendations,
    update_optimization_recommendation,
)


router = APIRouter(
    prefix="/optimizations",
    tags=["Optimization Recommendations"],
)


@router.post("/generate")
def generate_recommendations(
    payload: OptimizationGenerateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("analyst")),
):
    return generate_optimization_recommendations(
        db=db,
        payload=payload,
        current_user=current_user,
    )


@router.get("", response_model=list[OptimizationRecommendationResponse])
def list_recommendations(
    source_type: Optional[str] = None,
    recommendation_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("analyst")),
):
    return list_optimization_recommendations(
        db=db,
        current_user=current_user,
        source_type=source_type,
        recommendation_type=recommendation_type,
        status_filter=status_filter,
        entity_type=entity_type,
        entity_id=entity_id,
    )


@router.get("/{recommendation_id}", response_model=OptimizationRecommendationResponse)
def get_recommendation_by_id(
    recommendation_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("analyst")),
):
    return get_optimization_recommendation_by_id(
        db=db,
        recommendation_id=recommendation_id,
        current_user=current_user,
    )


@router.patch("/{recommendation_id}", response_model=OptimizationRecommendationResponse)
def update_recommendation(
    recommendation_id: int,
    payload: OptimizationRecommendationUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("analyst")),
):
    return update_optimization_recommendation(
        db=db,
        recommendation_id=recommendation_id,
        payload=payload,
        current_user=current_user,
    )


@router.post("/{recommendation_id}/apply")
def apply_recommendation(
    recommendation_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("analyst")),
):
    return apply_optimization_recommendation(
        db=db,
        recommendation_id=recommendation_id,
        current_user=current_user,
    )


@router.delete("/{recommendation_id}")
def delete_recommendation(
    recommendation_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("analyst")),
):
    return delete_optimization_recommendation(
        db=db,
        recommendation_id=recommendation_id,
        current_user=current_user,
    )