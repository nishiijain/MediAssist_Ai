import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.core.config import settings

logger = logging.getLogger(__name__)

class SummaryGeneratorService:
    """
    Generates a structured, 10-section clinical history summary.
    Prioritizes verified, source-grounded evidence and clinical safety.
    """

    def generate_summary(
        self,
        patient: Dict[str, Any],
        documents: List[Dict[str, Any]],
        extracted_fields: List[Dict[str, Any]],
        verification_issues: List[Dict[str, Any]],
        timeline_events: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Builds the 10-section clinical history summary.
        """
        sections: List[Dict[str, Any]] = []

        # 1. Patient Overview
        doc_count = len(documents)
        p_name = patient.get("name", "Unknown Patient")
        p_age = patient.get("date_of_birth", "Not documented")
        p_gender = patient.get("gender", "Not documented")
        
        overview_text = (
            f"Patient {p_name} (DOB/Age: {p_age}, Gender: {p_gender}, MRN: {patient.get('mrn', 'N/A')}). "
            f"A total of {doc_count} medical document(s) have been processed. "
            f"This summary aggregates verified records and flags clinical uncertainties for physician review."
        )
        sections.append({
            "section_number": 1,
            "title": "Patient Overview",
            "content": overview_text,
            "bullet_points": [
                f"Demographics: {p_gender}, Born {p_age}",
                f"Documents Processed: {doc_count} file(s)",
                f"Active Clinical Verification Alerts: {len(verification_issues)}"
            ],
            "source_references": [{"doc": d.get("original_filename"), "id": d.get("id")} for d in documents],
            "has_warning": False
        })

        # 2. Documented Medical History
        conditions = [f for f in extracted_fields if f.get("field_category") == "condition"]
        reported_conds = patient.get("reported_conditions") or []
        cond_bullets = []
        if conditions:
            for c in conditions:
                cond_bullets.append(f"{c.get('extracted_value')} (Document Source: Page {c.get('source_page', 1)}, Verification: {c.get('verification_status')})")
        if reported_conds:
            for rc in reported_conds:
                cond_bullets.append(f"{rc} (Patient-Reported Intake)")
        if not cond_bullets:
            cond_bullets.append("No chronic medical conditions documented in uploaded records or patient intake.")

        sections.append({
            "section_number": 2,
            "title": "Documented Medical History",
            "content": "Chronically diagnosed or actively documented clinical conditions across records and intake.",
            "bullet_points": cond_bullets,
            "source_references": [{"field": c.get("field_name"), "snippet": c.get("source_snippet")} for c in conditions],
            "has_warning": False
        })

        # 3. Chronological Timeline
        timeline_bullets = []
        for ev in timeline_events[:15]: # Show key recent events
            flag_str = " [FLAGGED: " + ev.get("clinical_flag_reason") + "]" if ev.get("is_flagged") else ""
            timeline_bullets.append(f"{ev.get('event_date')}: {ev.get('title')}{flag_str}")
        if not timeline_bullets:
            timeline_bullets.append("No dated timeline events extracted yet.")

        sections.append({
            "section_number": 3,
            "title": "Chronological Timeline",
            "content": "Ordered sequence of encounters, test dates, and medication initiations based on documented encounter dates.",
            "bullet_points": timeline_bullets,
            "source_references": [],
            "has_warning": any(ev.get("is_flagged") for ev in timeline_events)
        })

        # 4. Relevant Laboratory Results and Changes
        labs = [f for f in extracted_fields if f.get("field_category") == "lab_result"]
        lab_bullets = []
        if labs:
            for l in labs:
                ref = f" (Ref: {l.get('reference_range')})" if l.get("reference_range") else ""
                dt = f" on {l.get('event_date')}" if l.get("event_date") else ""
                lab_bullets.append(f"{l.get('field_name')}: {l.get('extracted_value')} {l.get('unit') or ''}{ref}{dt} — Status: {l.get('verification_status')}")
        else:
            lab_bullets.append("No laboratory diagnostic tests present in processed documents.")

        sections.append({
            "section_number": 4,
            "title": "Relevant Laboratory Results and Changes",
            "content": "Quantitative laboratory diagnostic parameters extracted with units and references.",
            "bullet_points": lab_bullets,
            "source_references": [{"test": l.get("field_name"), "value": l.get("extracted_value"), "snippet": l.get("source_snippet")} for l in labs],
            "has_warning": any(l.get("verification_status") in ["needs_clarification", "conflicting_information"] for l in labs)
        })

        # 5. Medication History
        meds = [f for f in extracted_fields if f.get("field_category") == "medication"]
        rep_meds = patient.get("reported_medications") or []
        med_bullets = []
        if meds:
            for m in meds:
                med_bullets.append(f"{m.get('extracted_value')} (Extracted from record, status: {m.get('verification_status')})")
        if rep_meds:
            for rm in rep_meds:
                med_bullets.append(f"{rm} (Patient-Reported Current Medication)")
        if not med_bullets:
            med_bullets.append("No medications currently documented in uploaded files or patient intake.")

        sections.append({
            "section_number": 5,
            "title": "Medication History",
            "content": "Pharmacotherapy documented in medical charts, prescriptions, and patient disclosure.",
            "bullet_points": med_bullets,
            "source_references": [{"med": m.get("field_name"), "snippet": m.get("source_snippet")} for m in meds],
            "has_warning": False
        })

        # 6. Reported Allergies
        allergies = [f for f in extracted_fields if f.get("field_category") == "allergy"]
        rep_allergies = patient.get("reported_allergies") or []
        allergy_bullets = []
        if allergies:
            for a in allergies:
                allergy_bullets.append(f"{a.get('extracted_value')} (Document Page {a.get('source_page', 1)})")
        if rep_allergies:
            for ra in rep_allergies:
                allergy_bullets.append(f"{ra} (Patient Intake Note)")
        if not allergy_bullets:
            allergy_bullets.append("No allergy history documented in provided records. NOTE: Do not assume absence of allergies.")

        sections.append({
            "section_number": 6,
            "title": "Reported Allergies",
            "content": "Documented and patient-reported drug, food, or environmental sensitivities.",
            "bullet_points": allergy_bullets,
            "source_references": [{"allergy": a.get("extracted_value"), "snippet": a.get("source_snippet")} for a in allergies],
            "has_warning": bool(allergies or rep_allergies)
        })

        # 7. Missing or Ambiguous Information
        missing_issues = [i for i in verification_issues if i.get("issue_type") in ["missing_field", "missing_unit", "invalid_date"]]
        missing_bullets = []
        if missing_issues:
            for mi in missing_issues:
                missing_bullets.append(f"{mi.get('issue_type').replace('_', ' ').title()}: {mi.get('description')}")
        else:
            missing_bullets.append("No critical missing fields or unparseable units detected in the reviewed fields.")

        sections.append({
            "section_number": 7,
            "title": "Missing or Ambiguous Information",
            "content": "Gaps in clinical documentation, absent medication dosages, or missing measurement units requiring physician follow-up.",
            "bullet_points": missing_bullets,
            "source_references": [],
            "has_warning": bool(missing_issues)
        })

        # 8. Contradictory Records
        contradictions = [i for i in verification_issues if i.get("issue_type") == "contradiction"]
        contra_bullets = []
        if contradictions:
            for c in contradictions:
                ref = f" Details: {c.get('conflicting_reference')}" if c.get('conflicting_reference') else ""
                contra_bullets.append(f"{c.get('description')}{ref}")
        else:
            contra_bullets.append("No cross-document or historical contradictions flagged by the deterministic verification engine.")

        sections.append({
            "section_number": 8,
            "title": "Contradictory Records",
            "content": "Conflicting measurements, inconsistent dates, or contradictory allergy records across documents.",
            "bullet_points": contra_bullets,
            "source_references": [],
            "has_warning": bool(contradictions)
        })

        # 9. Potentially Concerning Findings Requiring Review
        flagged_events = [ev for ev in timeline_events if ev.get("is_flagged")]
        concern_bullets = []
        if flagged_events:
            for fe in flagged_events:
                concern_bullets.append(f"{fe.get('event_date')}: {fe.get('title')} — Rationale: {fe.get('clinical_flag_reason')}")
        if not concern_bullets:
            concern_bullets.append("No values triggered automated high-risk clinical review thresholds.")

        sections.append({
            "section_number": 9,
            "title": "Potentially Concerning Findings Requiring Review",
            "content": "Preliminary rule-based clinical flags (e.g. marked hyperglycemia, Stage 2 hypertension, reduced eGFR). Not an autonomous diagnosis.",
            "bullet_points": concern_bullets,
            "source_references": [],
            "has_warning": bool(flagged_events)
        })

        # 10. Source Documents and Page References
        source_bullets = []
        for d in documents:
            source_bullets.append(
                f"File: '{d.get('original_filename')}' | Type: {d.get('document_type')} | Pages: {d.get('page_count')} | Encounter Date: {d.get('encounter_date', 'N/A')}"
            )
        if not source_bullets:
            source_bullets.append("No source documents attached.")

        sections.append({
            "section_number": 10,
            "title": "Source Documents and Page References",
            "content": "Traceable repository of primary source documents backing the extracted findings.",
            "bullet_points": source_bullets,
            "source_references": [{"filename": d.get("original_filename"), "id": d.get("id")} for d in documents],
            "has_warning": False
        })

        return {
            "title": f"MedicAssist Clinical History Summary for {p_name}",
            "generated_at": datetime.utcnow().isoformat(),
            "patient_mrn": patient.get("mrn"),
            "sections": sections,
            "disclaimer": "MedicAssist AI is a clinical workflow and decision-support prototype. It does not provide autonomous diagnoses or treatment prescriptions. Professional clinical judgment is required."
        }

summary_generator = SummaryGeneratorService()
