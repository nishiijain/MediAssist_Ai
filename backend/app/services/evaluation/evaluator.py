import time
import logging
from typing import Dict, Any, List
from app.services.evaluation.test_cases import SYNTHETIC_TEST_SUITE
from app.services.extraction.extractor import extraction_service
from app.services.verification.engine import verification_engine

logger = logging.getLogger(__name__)

class EvaluatorService:
    """
    Evaluates Baseline vs Proposed MedicAssist AI pipeline against synthetic test benchmarks.
    """

    def run_evaluation(self, model_name: str = "MedicAssist AI Engine v1.0") -> Dict[str, Any]:
        start_time = time.time()
        
        baseline_tp, baseline_fp, baseline_fn = 0, 0, 0
        proposed_tp, proposed_fp, proposed_fn = 0, 0, 0
        
        total_missing_expected = 0
        baseline_missing_detected = 0
        proposed_missing_detected = 0

        detailed_cases: List[Dict[str, Any]] = []
        total_unresolved_issues = 0

        for tc in SYNTHETIC_TEST_SUITE:
            tc_id = tc["id"]
            scenario = tc["scenario"]
            text = tc["document_text"]
            ground_truth = tc["ground_truth_fields"]
            expected_issues = tc.get("expected_issues", [])

            # 1. Run Extraction
            pages = [{"page": 1, "text": text}]
            extracted = extraction_service._extract_deterministic(text, pages)
            for f in extracted:
                f["document_id"] = tc_id
                f["patient_id"] = "eval_patient"

            # Inject hallucination if test case specifies it (to test robustness against LLM fabrication)
            if "injected_hallucination" in tc:
                inj = dict(tc["injected_hallucination"])
                inj["document_id"] = tc_id
                inj["patient_id"] = "eval_patient"
                inj["field_category"] = "condition"
                inj["numeric_value"] = None
                inj["unit"] = None
                inj["reference_range"] = None
                inj["event_date"] = "2024-06-01"
                inj["source_page"] = 1
                inj["extraction_method"] = "simulated_llm_hallucination"
                inj["verification_status"] = "awaiting_verification"
                extracted.append(inj)

            # --- BASELINE PIPELINE ---
            # Baseline accepts raw extracted items as is, does not flag unsupported claims,
            # does not detect missing units, and accepts hallucinations as true positive extractions.
            baseline_fields = [dict(f) for f in extracted]
            for bf in baseline_fields:
                bf["verification_status"] = "accepted_by_baseline"

            # Calculate baseline match against ground truth
            b_tp, b_fp, b_fn = self._evaluate_match(baseline_fields, ground_truth, is_baseline=True)
            baseline_tp += b_tp
            baseline_fp += b_fp
            baseline_fn += b_fn

            # Baseline misses issues because it has no verification engine
            if expected_issues:
                total_missing_expected += len(expected_issues)
                # Baseline detects 0 missing issues

            # --- PROPOSED PIPELINE ---
            # Runs the full deterministic verification engine
            verified_fields, issues = verification_engine.verify_patient_records(
                extracted_fields=extracted,
                document_texts={tc_id: text},
                patient_reported_data=None
            )
            total_unresolved_issues += len(issues)

            # Proposed pipeline filters out / flags unsupported claims or critical contradictions
            valid_proposed_fields = [
                f for f in verified_fields 
                if f.get("verification_status") in ["source_supported", "doctor_reviewed"]
                or (f.get("verification_status") == "awaiting_verification" and not any(i.get("extracted_field_id") == f.get("id") and i.get("issue_type") == "unsupported_claim" for i in issues))
            ]

            p_tp, p_fp, p_fn = self._evaluate_match(valid_proposed_fields, ground_truth, is_baseline=False)
            proposed_tp += p_tp
            proposed_fp += p_fp
            proposed_fn += p_fn

            # Check issue detection
            detected_issue_types = {i["issue_type"] for i in issues}
            for exp in expected_issues:
                if exp in detected_issue_types or (exp == "missing_unit" and "missing_unit" in detected_issue_types):
                    proposed_missing_detected += 1

            detailed_cases.append({
                "case_id": tc_id,
                "scenario": scenario,
                "fields_extracted": len(extracted),
                "issues_detected": len(issues),
                "baseline_tp": b_tp,
                "baseline_fp": b_fp,
                "baseline_fn": b_fn,
                "proposed_tp": p_tp,
                "proposed_fp": p_fp,
                "proposed_fn": p_fn,
                "issues": [i["description"] for i in issues]
            })

        elapsed_time = round(time.time() - start_time, 3)

        # Compute Metrics
        b_prec = baseline_tp / (baseline_tp + baseline_fp) if (baseline_tp + baseline_fp) > 0 else 0.0
        b_rec = baseline_tp / (baseline_tp + baseline_fn) if (baseline_tp + baseline_fn) > 0 else 0.0
        b_f1 = (2 * b_prec * b_rec) / (b_prec + b_rec) if (b_prec + b_rec) > 0 else 0.0
        b_omission = baseline_fn / (baseline_tp + baseline_fn) if (baseline_tp + baseline_fn) > 0 else 0.0
        b_unsupported = baseline_fp / (baseline_tp + baseline_fp) if (baseline_tp + baseline_fp) > 0 else 0.0

        p_prec = proposed_tp / (proposed_tp + proposed_fp) if (proposed_tp + proposed_fp) > 0 else 0.0
        p_rec = proposed_tp / (proposed_tp + proposed_fn) if (proposed_tp + proposed_fn) > 0 else 0.0
        p_f1 = (2 * p_prec * p_rec) / (p_prec + p_rec) if (p_prec + p_rec) > 0 else 0.0
        p_omission = proposed_fn / (proposed_tp + proposed_fn) if (proposed_tp + proposed_fn) > 0 else 0.0
        p_unsupported = proposed_fp / (proposed_tp + proposed_fp) if (proposed_tp + proposed_fp) > 0 else 0.0

        missing_det_rate = (proposed_missing_detected / total_missing_expected) if total_missing_expected > 0 else 1.0

        return {
            "model_evaluated": model_name,
            "test_suite_name": "MedicAssist Synthetic Benchmark v1 (8 scenarios)",
            "total_cases": len(SYNTHETIC_TEST_SUITE),
            "execution_time_seconds": elapsed_time,
            "unresolved_issues_count": total_unresolved_issues,
            "baseline": {
                "precision": round(b_prec, 4),
                "recall": round(b_rec, 4),
                "f1": round(b_f1, 4),
                "omission_rate": round(b_omission, 4),
                "unsupported_rate": round(b_unsupported, 4),
                "missing_field_detection_rate": 0.0
            },
            "proposed": {
                "precision": round(p_prec, 4),
                "recall": round(p_rec, 4),
                "f1": round(p_f1, 4),
                "omission_rate": round(p_omission, 4),
                "unsupported_rate": round(p_unsupported, 4),
                "missing_field_detection_rate": round(missing_det_rate, 4)
            },
            "detailed_results": detailed_cases
        }

    def _evaluate_match(self, fields: List[Dict[str, Any]], ground_truth: List[Dict[str, Any]], is_baseline: bool) -> tuple[int, int, int]:
        tp, fp, fn = 0, 0, 0
        matched_gt = set()

        for f in fields:
            f_name = f.get("field_name", "").lower()
            f_val = str(f.get("extracted_value", "")).lower()

            match_found = False
            for idx, gt in enumerate(ground_truth):
                gt_name = gt.get("field_name", "").lower()
                gt_val = str(gt.get("extracted_value", "")).lower()

                if (gt_name in f_name or f_name in gt_name) and (gt_val in f_val or f_val in gt_val):
                    match_found = True
                    matched_gt.add(idx)
                    break

            if match_found:
                tp += 1
            else:
                fp += 1

        fn = len(ground_truth) - len(matched_gt)
        return tp, fp, fn

evaluator_service = EvaluatorService()
