from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import EvaluationRun
from app.schemas import EvaluationRunResponse
from app.services.evaluation.evaluator import evaluator_service

router = APIRouter()

@router.get("/latest", response_model=Optional[EvaluationRunResponse])
def get_latest_evaluation(db: Session = Depends(get_db)):
    run = db.query(EvaluationRun).order_by(EvaluationRun.run_date.desc()).first()
    if not run:
        return None
    return run

@router.post("/run", response_model=EvaluationRunResponse, status_code=status.HTTP_201_CREATED)
def run_evaluation_benchmark(db: Session = Depends(get_db)):
    result = evaluator_service.run_evaluation()

    run = EvaluationRun(
        model_evaluated=result["model_evaluated"],
        test_suite_name=result["test_suite_name"],
        total_cases=result["total_cases"],
        baseline_precision=result["baseline"]["precision"],
        baseline_recall=result["baseline"]["recall"],
        baseline_f1=result["baseline"]["f1"],
        baseline_omission_rate=result["baseline"]["omission_rate"],
        baseline_unsupported_rate=result["baseline"]["unsupported_rate"],
        proposed_precision=result["proposed"]["precision"],
        proposed_recall=result["proposed"]["recall"],
        proposed_f1=result["proposed"]["f1"],
        proposed_omission_rate=result["proposed"]["omission_rate"],
        proposed_unsupported_rate=result["proposed"]["unsupported_rate"],
        missing_field_detection_rate=result["proposed"]["missing_field_detection_rate"],
        execution_time_seconds=result["execution_time_seconds"],
        unresolved_issues_count=result["unresolved_issues_count"],
        detailed_results=result["detailed_results"]
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run
