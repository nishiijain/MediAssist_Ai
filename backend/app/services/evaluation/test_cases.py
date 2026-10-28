"""
Synthetic labelled benchmark test cases for evaluating MedicAssist AI.
Contains diverse real-world clinical documentation scenarios.
"""

SYNTHETIC_TEST_SUITE = [
    {
        "id": "tc_01_clean_report",
        "scenario": "Clean Text-Based Lab Report",
        "document_text": """METROPOLITAN CLINICAL LABORATORY
Patient: Robert Vance | MRN: 90210 | DOB: 1962-04-12
Date of Service: 2024-02-15
Test: Hemoglobin A1c: 7.2 % (Ref: < 5.7%)
Test: Fasting Blood Glucose: 138 mg/dL (Ref: 70-99 mg/dL)
Test: Serum Creatinine: 1.1 mg/dL (Ref: 0.7 - 1.3 mg/dL)
Impression: Established Type 2 Diabetes Mellitus with mild hyperglycemia.""",
        "ground_truth_fields": [
            {"field_name": "Hemoglobin A1c", "extracted_value": "7.2", "unit": "%", "has_contradiction": False, "is_supported": True},
            {"field_name": "Fasting Blood Glucose", "extracted_value": "138", "unit": "mg/dL", "has_contradiction": False, "is_supported": True},
            {"field_name": "Serum Creatinine", "extracted_value": "1.1", "unit": "mg/dL", "has_contradiction": False, "is_supported": True},
            {"field_name": "Documented Condition", "extracted_value": "Type 2 Diabetes Mellitus", "unit": None, "has_contradiction": False, "is_supported": True}
        ],
        "expected_issues": []
    },
    {
        "id": "tc_02_missing_units",
        "scenario": "Lab Report with Missing Units",
        "document_text": """OUTPATIENT DIAGNOSTIC CENTER
Encounter Date: 2024-03-10
Patient: Maria Gonzales
Laboratory Results:
Total Cholesterol: 245 (High)
HDL Cholesterol: 38 (Low)
LDL: 160 (Elevated)
Assessment: Hyperlipidemia.""",
        "ground_truth_fields": [
            {"field_name": "Total Cholesterol", "extracted_value": "245", "unit": "mg/dL", "has_contradiction": False, "is_supported": True},
            {"field_name": "HDL Cholesterol", "extracted_value": "38", "unit": "mg/dL", "has_contradiction": False, "is_supported": True},
            {"field_name": "LDL Cholesterol", "extracted_value": "160", "unit": "mg/dL", "has_contradiction": False, "is_supported": True}
        ],
        "expected_issues": ["missing_unit"]
    },
    {
        "id": "tc_03_missing_dosage",
        "scenario": "Prescription Missing Dosage and Frequency",
        "document_text": """CLINICAL CONSULTATION NOTE
Date: 2024-01-20
Patient: David Miller
Plan:
1. Continue Metformin for glycemic control.
2. Add Lisinopril for blood pressure elevation.
3. Follow up in 3 months.""",
        "ground_truth_fields": [
            {"field_name": "Metformin", "extracted_value": "Metformin", "unit": None, "has_contradiction": False, "is_supported": True},
            {"field_name": "Lisinopril", "extracted_value": "Lisinopril", "unit": None, "has_contradiction": False, "is_supported": True}
        ],
        "expected_issues": ["missing_field"]
    },
    {
        "id": "tc_04_contradictory_allergies",
        "scenario": "Conflicting Allergy Documentation",
        "document_text": """HOSPITAL ADMISSION NOTE
Encounter Date: 2024-04-05
Patient: Linda Chen
Triage Note: Allergies: NKDA (No Known Drug Allergies).
...
Attending Physician Addendum:
Patient developed severe urticarial rash previously to Penicillin allergy. DO NOT PRESCRIBE BETA-LACTAMS.""",
        "ground_truth_fields": [
            {"field_name": "Documented Allergy", "extracted_value": "NKDA", "unit": None, "has_contradiction": True, "is_supported": True},
            {"field_name": "Documented Allergy", "extracted_value": "Penicillin allergy", "unit": None, "has_contradiction": True, "is_supported": True}
        ],
        "expected_issues": ["contradiction"]
    },
    {
        "id": "tc_05_conflicting_labs",
        "scenario": "Conflicting Lab Measurements on Same Date",
        "document_text": """DUAL LAB TRANSMISSION RECORD
Service Date: 2024-05-18
Panel A (Morning fasting): Hemoglobin A1c: 9.4 %
Panel B (Repeat verification): Hemoglobin A1c: 6.8 %
Note: Discrepancy between lab machines under investigation.""",
        "ground_truth_fields": [
            {"field_name": "Hemoglobin A1c", "extracted_value": "9.4", "unit": "%", "has_contradiction": True, "is_supported": True},
            {"field_name": "Hemoglobin A1c", "extracted_value": "6.8", "unit": "%", "has_contradiction": True, "is_supported": True}
        ],
        "expected_issues": ["contradiction"]
    },
    {
        "id": "tc_06_unsupported_statement",
        "scenario": "Unsupported Hallucination Injection",
        "document_text": """GENERAL CHECKUP
Visit Date: 2024-06-01
Patient: Samuel Jackson
Patient complains of mild fatigue and seasonal allergies.
Physical exam unremarkable. Vital signs normal.""",
        "ground_truth_fields": [
            {"field_name": "Documented Condition", "extracted_value": "Seasonal Allergies", "unit": None, "has_contradiction": False, "is_supported": True}
        ],
        # In baseline, naive extractor might hallucinate Diabetes Mellitus from prompt bias
        "injected_hallucination": {
            "field_name": "Documented Condition",
            "extracted_value": "Type 2 Diabetes Mellitus",
            "source_snippet": "Patient has severe diabetes requiring immediate insulin therapy." # Not in text!
        },
        "expected_issues": ["unsupported_claim", "source_mismatch"]
    },
    {
        "id": "tc_07_ambiguous_future_date",
        "scenario": "Corrupted or Future Date in Document",
        "document_text": """RADIOLOGY REPORT
Date of Service: 2039-11-20
Patient: Arthur Dent
Chest X-Ray: Clear lungs, normal cardiac silhouette.""",
        "ground_truth_fields": [
            {"field_name": "Encounter Date", "extracted_value": "2039-11-20", "unit": None, "has_contradiction": False, "is_supported": True}
        ],
        "expected_issues": ["invalid_date"]
    },
    {
        "id": "tc_08_multi_document_er",
        "scenario": "Unconscious ER Intake with Medication Sheet",
        "document_text": """EMERGENCY DEPARTMENT INTAKE
Encounter Date: 2024-07-12
Patient: Jane Roe (Found unresponsive by emergency services)
No verbal communication possible.
Accompanying paper in bag lists:
Medications: Metformin 1000mg BID, Lisinopril 20mg daily, Atorvastatin 40mg daily.
Point-of-Care Glucose: 48 mg/dL (Critical Hypoglycemia).""",
        "ground_truth_fields": [
            {"field_name": "Metformin", "extracted_value": "Metformin 1000mg BID", "unit": "mg", "has_contradiction": False, "is_supported": True},
            {"field_name": "Lisinopril", "extracted_value": "Lisinopril 20mg daily", "unit": "mg", "has_contradiction": False, "is_supported": True},
            {"field_name": "Atorvastatin", "extracted_value": "Atorvastatin 40mg daily", "unit": "mg", "has_contradiction": False, "is_supported": True},
            {"field_name": "Fasting Blood Glucose", "extracted_value": "48", "unit": "mg/dL", "has_contradiction": False, "is_supported": True}
        ],
        "expected_issues": []
    }
]
