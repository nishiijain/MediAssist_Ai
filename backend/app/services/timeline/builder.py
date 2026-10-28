import re
from typing import List, Dict, Any, Optional
from datetime import datetime

class TimelineBuilderService:
    """
    Builds chronological longitudinal history and lab trend series for a patient.
    """

    CLINICAL_THRESHOLDS = {
        "Hemoglobin A1c": {
            "high": 8.0,
            "critical_high": 9.0,
            "reason_high": "HbA1c >= 8.0% indicates elevated glycemic burden requiring medication and lifestyle review.",
            "reason_critical": "HbA1c >= 9.0% represents significant hyperglycemia. Clinician review advised."
        },
        "Fasting Blood Glucose": {
            "high": 130.0,
            "critical_high": 200.0,
            "reason_high": "Fasting glucose > 130 mg/dL exceeds ADA target for non-pregnant adults with diabetes.",
            "reason_critical": "Marked fasting hyperglycemia (> 200 mg/dL)."
        },
        "Serum Creatinine": {
            "high": 1.3,
            "reason_high": "Serum creatinine > 1.3 mg/dL may indicate impaired renal clearance."
        },
        "eGFR": {
            "low": 60.0,
            "reason_low": "eGFR < 60 mL/min/1.73m2 suggests chronic kidney disease stage 3 or higher."
        },
        "LDL Cholesterol": {
            "high": 130.0,
            "reason_high": "LDL Cholesterol > 130 mg/dL warrants lipid management review."
        }
    }

    def build_timeline_events(
        self,
        extracted_fields: List[Dict[str, Any]],
        documents: List[Dict[str, Any]],
        consultations: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Merge and sort all documents, extracted labs, diagnoses, and consultations into a single chronological timeline.
        """
        events: List[Dict[str, Any]] = []

        # 1. Add consultations
        for c in consultations:
            events.append({
                "patient_id": c.get("patient_id"),
                "event_date": str(c.get("consultation_date")),
                "event_type": "consultation",
                "title": f"Consultation with Dr. {c.get('doctor_name', 'Physician')}",
                "description": c.get("reason_for_visit") or c.get("clinical_notes", "")[:100],
                "numeric_value": None,
                "unit": None,
                "reference_range": None,
                "document_id": None,
                "extracted_field_id": None,
                "source_snippet": c.get("clinical_notes"),
                "is_flagged": False,
                "clinical_flag_reason": None
            })

        # 2. Add documents as milestones
        doc_map = {d.get("id"): d for d in documents}
        for d in documents:
            ev_date = d.get("encounter_date") or str(d.get("upload_date", ""))[:10]
            events.append({
                "patient_id": d.get("patient_id"),
                "event_date": ev_date,
                "event_type": "document",
                "title": f"Document: {d.get('document_type', 'Medical Record')}",
                "description": f"File: {d.get('original_filename')} ({d.get('page_count', 1)} pages)",
                "numeric_value": None,
                "unit": None,
                "reference_range": None,
                "document_id": d.get("id"),
                "extracted_field_id": None,
                "source_snippet": (d.get("extracted_text") or "")[:200],
                "is_flagged": False,
                "clinical_flag_reason": None
            })

        # 3. Add extracted fields with clinical flags
        for f in extracted_fields:
            if not f.get("is_active", True):
                continue

            ev_date = f.get("event_date")
            if not ev_date and f.get("document_id") in doc_map:
                ev_date = doc_map[f.get("document_id")].get("encounter_date")
            if not ev_date:
                ev_date = "Unknown Date"

            cat = f.get("field_category")
            name = f.get("field_name")
            val = f.get("extracted_value")
            num_val = f.get("numeric_value")
            unit = f.get("unit")
            ref_range = f.get("reference_range")

            is_flagged = False
            flag_reason = None

            # Apply clinical rule check for labs
            if cat == "lab_result" and name in self.CLINICAL_THRESHOLDS and num_val is not None:
                thresh = self.CLINICAL_THRESHOLDS[name]
                if "critical_high" in thresh and num_val >= thresh["critical_high"]:
                    is_flagged = True
                    flag_reason = thresh["reason_critical"]
                elif "high" in thresh and num_val >= thresh["high"]:
                    is_flagged = True
                    flag_reason = thresh["reason_high"]
                elif "low" in thresh and num_val < thresh["low"]:
                    is_flagged = True
                    flag_reason = thresh["reason_low"]

            # Blood pressure string check
            if name == "Blood Pressure" and "/" in str(val):
                parts = re.findall(r"\d+", str(val))
                if len(parts) >= 2:
                    sys, dia = int(parts[0]), int(parts[1])
                    if sys >= 140 or dia >= 90:
                        is_flagged = True
                        flag_reason = f"Stage 2 Hypertension range ({sys}/{dia} mmHg). Standard target < 130/80 mmHg."

            event_type = "lab_result" if cat == "lab_result" else ("medication_start" if cat == "medication" else "diagnosis")

            events.append({
                "patient_id": f.get("patient_id"),
                "event_date": ev_date,
                "event_type": event_type,
                "title": f"{name}: {val}" + (f" {unit}" if unit else ""),
                "description": f"Extracted via {f.get('extraction_method')}. Status: {f.get('verification_status')}",
                "numeric_value": num_val,
                "unit": unit,
                "reference_range": ref_range,
                "document_id": f.get("document_id"),
                "extracted_field_id": f.get("id"),
                "source_snippet": f.get("source_snippet"),
                "is_flagged": is_flagged,
                "clinical_flag_reason": flag_reason
            })

        # Sort chronologically
        def parse_sort_key(ev):
            d = ev.get("event_date", "")
            if not d or d == "Unknown Date":
                return "1900-01-01"
            # Normalize to sortable string
            m = re.search(r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})", d)
            if m:
                return f"{int(m.group(1)):04d}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
            return d

        events.sort(key=parse_sort_key)
        return events

    def build_trend_series(self, extracted_fields: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Group lab measurements into Recharts-ready compatible trend series.
        """
        series_map: Dict[str, Dict[str, Any]] = {}

        for f in extracted_fields:
            if f.get("field_category") != "lab_result" or not f.get("is_active", True):
                continue
            name = f.get("field_name")
            num_val = f.get("numeric_value")
            ev_date = f.get("event_date")
            unit = f.get("unit") or ""

            if num_val is None or not ev_date:
                continue

            # Standardize date format for chart x-axis
            m = re.search(r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})", ev_date)
            chart_date = f"{int(m.group(1)):04d}-{int(m.group(2)):02d}-{int(m.group(3)):02d}" if m else ev_date

            if name not in series_map:
                series_map[name] = {
                    "test_name": name,
                    "unit": unit,
                    "reference_range": f.get("reference_range"),
                    "data_points": []
                }

            is_flagged = False
            if name in self.CLINICAL_THRESHOLDS:
                th = self.CLINICAL_THRESHOLDS[name]
                if ("high" in th and num_val >= th["high"]) or ("low" in th and num_val < th.get("low", 0)):
                    is_flagged = True

            series_map[name]["data_points"].append({
                "date": chart_date,
                "value": num_val,
                "unit": unit,
                "reference_range": f.get("reference_range"),
                "source_document": f.get("document_id"),
                "is_flagged": is_flagged
            })

        # Sort each series by date
        for s in series_map.values():
            s["data_points"].sort(key=lambda x: x["date"])

        return list(series_map.values())

timeline_builder = TimelineBuilderService()
