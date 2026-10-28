import pytest
from app.services.verification.engine import verification_engine

def test_source_mismatch_detection():
    fields = [{
        "id": "f1",
        "patient_id": "p1",
        "document_id": "d1",
        "field_name": "Hemoglobin A1c",
        "extracted_value": "14.5",
        "field_category": "lab_result",
        "unit": "%",
        "source_snippet": "Hemoglobin A1c: 7.2 %",
        "is_active": True
    }]
    doc_texts = {"d1": "Patient lab report. Hemoglobin A1c: 7.2 %"}

    updated, issues = verification_engine.verify_patient_records(fields, doc_texts)
    assert len(issues) > 0
    assert any(i["issue_type"] == "source_mismatch" for i in issues)
    assert updated[0]["verification_status"] == "needs_clarification"

def test_missing_unit_detection():
    fields = [{
        "id": "f2",
        "patient_id": "p1",
        "document_id": "d1",
        "field_name": "Fasting Blood Glucose",
        "extracted_value": "180",
        "numeric_value": 180.0,
        "field_category": "lab_result",
        "unit": None,
        "source_snippet": "Fasting Blood Glucose: 180",
        "is_active": True
    }]
    doc_texts = {"d1": "Fasting Blood Glucose: 180"}

    _, issues = verification_engine.verify_patient_records(fields, doc_texts)
    assert any(i["issue_type"] == "missing_unit" for i in issues)

def test_incompatible_unit_detection():
    fields = [{
        "id": "f3",
        "patient_id": "p1",
        "document_id": "d1",
        "field_name": "Hemoglobin A1c",
        "extracted_value": "7.5",
        "numeric_value": 7.5,
        "field_category": "lab_result",
        "unit": "mg/dL", # Incompatible! HbA1c is %
        "source_snippet": "Hemoglobin A1c: 7.5 mg/dL",
        "is_active": True
    }]
    doc_texts = {"d1": "Hemoglobin A1c: 7.5 mg/dL"}

    _, issues = verification_engine.verify_patient_records(fields, doc_texts)
    assert any(i["issue_type"] == "incompatible_unit" for i in issues)

def test_missing_medication_dosage():
    fields = [{
        "id": "f4",
        "patient_id": "p1",
        "document_id": "d1",
        "field_name": "Metformin",
        "extracted_value": "Metformin",
        "field_category": "medication",
        "unit": None,
        "source_snippet": "Patient prescribed Metformin.",
        "is_active": True
    }]
    doc_texts = {"d1": "Patient prescribed Metformin."}

    _, issues = verification_engine.verify_patient_records(fields, doc_texts)
    assert any(i["issue_type"] == "missing_field" for i in issues)

def test_unsupported_statement_detection():
    fields = [{
        "id": "f5",
        "patient_id": "p1",
        "document_id": "d1",
        "field_name": "Documented Condition",
        "extracted_value": "Congestive Heart Failure",
        "field_category": "condition",
        "source_snippet": "", # No supporting snippet!
        "is_active": True
    }]
    doc_texts = {"d1": "Routine physical checkup."}

    _, issues = verification_engine.verify_patient_records(fields, doc_texts)
    assert any(i["issue_type"] == "unsupported_claim" for i in issues)

def test_allergy_contradiction_detection():
    fields = [
        {
            "id": "f6",
            "patient_id": "p1",
            "document_id": "d1",
            "field_name": "Documented Allergy",
            "extracted_value": "NKDA (No Known Drug Allergies)",
            "field_category": "allergy",
            "source_snippet": "Allergies: NKDA",
            "is_active": True
        },
        {
            "id": "f7",
            "patient_id": "p1",
            "document_id": "d2",
            "field_name": "Documented Allergy",
            "extracted_value": "Penicillin allergy (Anaphylaxis)",
            "field_category": "allergy",
            "source_snippet": "Penicillin allergy: hives and wheezing",
            "is_active": True
        }
    ]
    doc_texts = {
        "d1": "Allergies: NKDA",
        "d2": "Penicillin allergy: hives and wheezing"
    }

    _, issues = verification_engine.verify_patient_records(fields, doc_texts)
    assert any(i["issue_type"] == "contradiction" and i["severity"] == "critical" for i in issues)

def test_conflicting_same_date_labs():
    fields = [
        {
            "id": "f8",
            "patient_id": "p1",
            "document_id": "d1",
            "field_name": "Hemoglobin A1c",
            "extracted_value": "9.4",
            "numeric_value": 9.4,
            "unit": "%",
            "event_date": "2024-05-18",
            "field_category": "lab_result",
            "source_snippet": "Hemoglobin A1c: 9.4 %",
            "is_active": True
        },
        {
            "id": "f9",
            "patient_id": "p1",
            "document_id": "d2",
            "field_name": "Hemoglobin A1c",
            "extracted_value": "6.8",
            "numeric_value": 6.8,
            "unit": "%",
            "event_date": "2024-05-18", # Same test, same date, discrepant values!
            "field_category": "lab_result",
            "source_snippet": "Hemoglobin A1c: 6.8 %",
            "is_active": True
        }
    ]
    doc_texts = {
        "d1": "Hemoglobin A1c: 9.4 %",
        "d2": "Hemoglobin A1c: 6.8 %"
    }

    updated, issues = verification_engine.verify_patient_records(fields, doc_texts)
    assert any(i["issue_type"] == "contradiction" for i in issues)
    assert all(u["verification_status"] == "conflicting_information" for u in updated)
