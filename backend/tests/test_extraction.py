import pytest
from app.services.extraction.extractor import extraction_service

def test_extraction_labs_and_medications():
    sample_text = """METROPOLITAN CLINICAL LABORATORIES
Collection Date: 2024-02-15
Patient: John Doe
Hemoglobin A1c: 8.4 % (Ref: < 5.7%)
Fasting Blood Glucose: 165 mg/dL (Ref: 70-99 mg/dL)
Blood Pressure: 138/88 mmHg
Prescriptions:
Metformin 1000mg BID
Lisinopril 10mg daily
Assessment: Type 2 Diabetes Mellitus, Essential Hypertension."""

    pages = [{"page": 1, "text": sample_text}]
    extracted = extraction_service._extract_deterministic(sample_text, pages)

    names = [f["field_name"] for f in extracted]
    assert "Hemoglobin A1c" in names
    assert "Fasting Blood Glucose" in names
    assert "Blood Pressure" in names
    assert "Metformin" in names
    assert "Lisinopril" in names
    assert "Documented Condition" in names

    # Verify unit and source snippet preservation
    hba1c_field = next(f for f in extracted if f["field_name"] == "Hemoglobin A1c")
    assert hba1c_field["extracted_value"] == "8.4"
    assert hba1c_field["unit"] == "%"
    assert "8.4" in hba1c_field["source_snippet"]
    assert hba1c_field["source_page"] == 1
