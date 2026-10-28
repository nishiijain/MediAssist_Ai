import os
from pathlib import Path
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import (
    Patient, MedicalDocument, ExtractedField, VerificationIssue,
    PatientTimelineEvent, GeneratedSummary, SummaryReview, Consultation
)
from app.core.config import settings
from app.services.extraction.extractor import extraction_service
from app.services.verification.engine import verification_engine
from app.services.timeline.builder import timeline_builder
from app.services.summarization.generator import summary_generator

class DemoLoaderService:
    """
    Populates synthetic, fully reproducible longitudinal patient demo data.
    """

    def load_demo_patient(self, db: Session) -> Patient:
        # Check if demo patient already exists; if so, remove previous demo instance to keep fresh
        existing = db.query(Patient).filter(Patient.mrn == "MED-98402").first()
        if existing:
            db.delete(existing)
            db.commit()

        # 1. Create Patient Record
        patient = Patient(
            mrn="MED-98402",
            name="Johnathan Doe (Synthetic Demo)",
            date_of_birth="1966-08-20",
            gender="Male",
            phone="+1 (555) 019-2831",
            contact_notes="Emergency contact: Sarah Doe (Spouse) +1 (555) 019-2832",
            reported_conditions=["Type 2 Diabetes Mellitus", "Essential Hypertension"],
            reported_allergies=["Penicillin (Severe hives/rash in 2018)"],
            reported_medications=["Metformin 1000mg BID", "Lisinopril 10mg daily"],
            clinical_notes="Fictional patient record generated strictly for demonstration and verification testing.",
            is_demo=True
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)

        # 2. Synthetic Documents
        demo_docs_spec = [
            {
                "filename": "Lab_Report_2023_11_15_Baseline.txt",
                "doc_type": "Laboratory Report",
                "encounter_date": "2023-11-15",
                "text": """METROPOLITAN HEALTH SYSTEM - CLINICAL LABORATORIES
Patient: Johnathan Doe | MRN: MED-98402 | DOB: 1966-08-20
Collection Date: 2023-11-15 | Ordering Physician: Dr. Emily Carter

COMPREHENSIVE DIABETIC & METABOLIC PANEL:
Hemoglobin A1c: 9.4 % (Reference: < 5.7%) [HIGH - Marked Glycemia]
Fasting Blood Glucose: 195 mg/dL (Reference: 70 - 99 mg/dL) [HIGH]
Total Cholesterol: 240 mg/dL (Reference: < 200 mg/dL) [HIGH]
LDL Cholesterol: 155 mg/dL (Reference: < 100 mg/dL) [HIGH]
HDL Cholesterol: 38 mg/dL (Reference: > 40 mg/dL) [LOW]
Serum Creatinine: 1.1 mg/dL (Reference: 0.7 - 1.3 mg/dL) [NORMAL]
eGFR: 78 mL/min/1.73m2 (Reference: > 60 mL/min/1.73m2) [NORMAL]

Clinical Impression: Uncontrolled Type 2 Diabetes Mellitus with comorbid mixed dyslipidemia."""
            },
            {
                "filename": "Prescription_2023_11_20_Endo.txt",
                "doc_type": "Prescription",
                "encounter_date": "2023-11-20",
                "text": """VALLEY ENDOCRINOLOGY CLINIC
Provider: Dr. Emily Carter, MD | NPI: 1948201948
Date: 2023-11-20
Patient: Johnathan Doe

Rx Prescriptions:
1. Metformin 1000mg tablet, take 1 tablet orally twice daily with meals (BID).
2. Lisinopril 10mg tablet, take 1 tablet orally once daily in the morning.
3. Atorvastatin 20mg tablet, take 1 tablet orally daily at bedtime.
Refills: 3
Notes: Patient warned of gastrointestinal side effects. Recheck HbA1c in 3-4 months."""
            },
            {
                "filename": "Lab_Report_2024_03_10_Followup.txt",
                "doc_type": "Laboratory Report",
                "encounter_date": "2024-03-10",
                "text": """METROPOLITAN HEALTH SYSTEM - CLINICAL LABORATORIES
Patient: Johnathan Doe | MRN: MED-98402 | DOB: 1966-08-20
Collection Date: 2024-03-10 | Physician: Dr. Emily Carter

FOLLOW-UP GLYCEMIC & LIPID PANEL:
Hemoglobin A1c: 7.6 % (Reference: < 5.7%) [IMPROVED - Favorable Response]
Fasting Blood Glucose: 132 mg/dL (Reference: 70 - 99 mg/dL)
Total Cholesterol: 188 mg/dL (Reference: < 200 mg/dL) [NORMALIZED]
LDL Cholesterol: 112 mg/dL (Reference: < 100 mg/dL)
Blood Pressure: 132/84 mmHg (Reference: < 120/80 mmHg)
Serum Creatinine: 1.0 mg/dL (Reference: 0.7 - 1.3 mg/dL)

Impression: Substantial glycemic improvement on Metformin 1000mg BID and lifestyle modifications."""
            },
            {
                "filename": "Consultation_2024_06_05_UrgentCare_Conflict.txt",
                "doc_type": "Consultation Note",
                "encounter_date": "2024-06-05",
                "text": """URGENT CARE ASSOCIATES - ENCOUNTER SUMMARY
Date of Service: 2024-06-05
Patient: Johnathan Doe | Age: 58 | Sex: M
Triage Nurse Entry:
Allergies: NKDA (No Known Drug Allergies) [TRIAGE ERROR]

Chief Complaint: Sinus congestion and mild sore throat for 4 days.
Attending Physician Note:
Patient mentions past severe rash/urticaria with Penicillin allergy. Chart allergy alert updated.
Physical Exam: Afebrile, clear lungs.
Assessment: Acute viral rhinosinusitis.
Plan: Symptomatic treatment. Do NOT prescribe Beta-lactams or Amoxicillin.

Point-of-Care Lab:
Hemoglobin A1c: 8.9 % (Repeat POC Fingerstick) [CONFLICTING VALUE vs Follow-up trend]"""
            }
        ]

        # Save synthetic files to storage directory
        storage_dir = settings.UPLOAD_DIR
        doc_models = []
        doc_texts = {}

        for spec in demo_docs_spec:
            file_name = f"demo_{patient.id}_{spec['filename']}"
            file_path = storage_dir / file_name
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(spec["text"])

            doc = MedicalDocument(
                patient_id=patient.id,
                original_filename=spec["filename"],
                stored_filename=file_name,
                file_path=str(file_path),
                file_size_bytes=len(spec["text"].encode("utf-8")),
                file_type="text/plain",
                document_type=spec["doc_type"],
                encounter_date=spec["encounter_date"],
                processing_status="completed",
                extracted_text=spec["text"],
                page_count=1,
                ocr_used=False,
                quality_warnings=[]
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)
            doc_models.append(doc)
            doc_texts[doc.id] = spec["text"]

        # 3. Extract structured fields from all demo documents
        all_extracted_fields = []
        for doc in doc_models:
            pages = [{"page": 1, "text": doc.extracted_text}]
            fields_data = extraction_service.extract_from_document(
                document_text=doc.extracted_text,
                pages_data=pages,
                document_id=doc.id,
                patient_id=patient.id
            )
            for fd in fields_data:
                field_obj = ExtractedField(
                    patient_id=patient.id,
                    document_id=doc.id,
                    field_category=fd.get("field_category", "observation"),
                    field_name=fd.get("field_name", ""),
                    extracted_value=str(fd.get("extracted_value", "")),
                    numeric_value=fd.get("numeric_value"),
                    unit=fd.get("unit"),
                    reference_range=fd.get("reference_range"),
                    event_date=fd.get("event_date") or doc.encounter_date,
                    source_page=fd.get("source_page", 1),
                    source_snippet=fd.get("source_snippet"),
                    extraction_method="deterministic_rule",
                    verification_status="awaiting_verification",
                    uncertainty_notes=fd.get("uncertainty_notes")
                )
                db.add(field_obj)
                db.commit()
                db.refresh(field_obj)
                all_extracted_fields.append({
                    "id": field_obj.id,
                    "patient_id": patient.id,
                    "document_id": doc.id,
                    "field_category": field_obj.field_category,
                    "field_name": field_obj.field_name,
                    "extracted_value": field_obj.extracted_value,
                    "numeric_value": field_obj.numeric_value,
                    "unit": field_obj.unit,
                    "reference_range": field_obj.reference_range,
                    "event_date": field_obj.event_date,
                    "source_page": field_obj.source_page,
                    "source_snippet": field_obj.source_snippet,
                    "extraction_method": field_obj.extraction_method,
                    "verification_status": field_obj.verification_status,
                    "is_active": True
                })

        # 4. Run Deterministic Verification Engine
        updated_fields, issues = verification_engine.verify_patient_records(
            extracted_fields=all_extracted_fields,
            document_texts=doc_texts,
            patient_reported_data={
                "reported_allergies": patient.reported_allergies,
                "reported_conditions": patient.reported_conditions
            }
        )

        # Update field statuses in DB
        for uf in updated_fields:
            db_field = db.query(ExtractedField).filter(ExtractedField.id == uf["id"]).first()
            if db_field:
                db_field.verification_status = uf["verification_status"]
        db.commit()

        # Persist verification issues
        for iss in issues:
            v_issue = VerificationIssue(
                patient_id=patient.id,
                document_id=iss.get("document_id"),
                extracted_field_id=iss.get("extracted_field_id"),
                issue_type=iss.get("issue_type", "unknown"),
                severity=iss.get("severity", "medium"),
                description=iss.get("description", ""),
                expected_format=iss.get("expected_format"),
                conflicting_reference=iss.get("conflicting_reference"),
                resolved=False
            )
            db.add(v_issue)
        db.commit()

        # 5. Build Timeline Events
        doc_dicts = [
            {
                "id": d.id,
                "patient_id": d.patient_id,
                "original_filename": d.original_filename,
                "document_type": d.document_type,
                "encounter_date": d.encounter_date,
                "upload_date": d.upload_date,
                "extracted_text": d.extracted_text,
                "page_count": d.page_count
            }
            for d in doc_models
        ]
        consultations_spec = [
            {
                "patient_id": patient.id,
                "consultation_date": "2023-11-20",
                "doctor_name": "Emily Carter, MD",
                "reason_for_visit": "Diabetic evaluation following HbA1c 9.4%",
                "clinical_notes": "Initiated Metformin 1000mg BID and Lisinopril 10mg daily. Discussed dietary modifications."
            }
        ]
        # Also store consultation record in DB
        consult = Consultation(
            patient_id=patient.id,
            consultation_date="2023-11-20",
            doctor_name="Emily Carter, MD",
            reason_for_visit="Diabetic evaluation following HbA1c 9.4%",
            clinical_notes="Initiated Metformin 1000mg BID and Lisinopril 10mg daily. Discussed dietary modifications."
        )
        db.add(consult)
        db.commit()

        events_data = timeline_builder.build_timeline_events(
            extracted_fields=updated_fields,
            documents=doc_dicts,
            consultations=consultations_spec
        )

        for ev in events_data:
            timeline_obj = PatientTimelineEvent(
                patient_id=patient.id,
                document_id=ev.get("document_id"),
                extracted_field_id=ev.get("extracted_field_id"),
                event_date=ev.get("event_date", "1970-01-01"),
                event_type=ev.get("event_type", "observation"),
                title=ev.get("title", ""),
                description=ev.get("description"),
                numeric_value=ev.get("numeric_value"),
                unit=ev.get("unit"),
                reference_range=ev.get("reference_range"),
                source_snippet=ev.get("source_snippet"),
                is_flagged=ev.get("is_flagged", False),
                clinical_flag_reason=ev.get("clinical_flag_reason")
            )
            db.add(timeline_obj)
        db.commit()

        # 6. Generate Initial AI History Summary (10 Sections)
        patient_dict = {
            "id": patient.id,
            "name": patient.name,
            "mrn": patient.mrn,
            "date_of_birth": patient.date_of_birth,
            "gender": patient.gender,
            "reported_conditions": patient.reported_conditions,
            "reported_allergies": patient.reported_allergies,
            "reported_medications": patient.reported_medications
        }
        summary_content = summary_generator.generate_summary(
            patient=patient_dict,
            documents=doc_dicts,
            extracted_fields=updated_fields,
            verification_issues=issues,
            timeline_events=events_data
        )

        summary_obj = GeneratedSummary(
            patient_id=patient.id,
            draft_version=1,
            status="draft",
            provider_model="MedicAssist AI Deterministic & LLM Engine",
            is_demo_mode=True,
            summary_content=summary_content
        )
        db.add(summary_obj)
        db.commit()

        return patient

demo_loader = DemoLoaderService()
