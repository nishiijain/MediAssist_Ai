import pytest
from app.services.evaluation.evaluator import evaluator_service

def test_evaluation_pipeline_metrics():
    res = evaluator_service.run_evaluation()

    assert res["total_cases"] == 8
    assert "baseline" in res
    assert "proposed" in res
    
    b = res["baseline"]
    p = res["proposed"]

    # The proposed pipeline with verification should have higher precision, lower unsupported rate,
    # and superior missing field detection compared to naive baseline
    assert p["precision"] >= b["precision"]
    assert p["unsupported_rate"] <= b["unsupported_rate"]
    assert p["missing_field_detection_rate"] > b["missing_field_detection_rate"]
    assert res["execution_time_seconds"] > 0
    assert len(res["detailed_results"]) == 8
