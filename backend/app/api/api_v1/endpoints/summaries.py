from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import (
    Patient, MedicalDocument, ExtractedField, VerificationIssue,
    PatientTimelineEvent, GeneratedSummary, SummaryReview
)
from app.schemas import (
    GeneratedSummaryResponse, SummaryReviewCreate, SummaryReviewResponse
)
from app.services.summarization.generator import summary_generator
from app.services.timeline.builder import timeline_builder

router = APIRouter()

@router.get("/patient/{patient_id}", response_model=Optional[GeneratedSummaryResponse])
def get_patient_summary(patient_id: str, db: Session = Depends(get_db)):
    summary = db.query(GeneratedSummary).filter(
        GeneratedSummary.patient_id == patient_id
    ).order_by(GeneratedSummary.draft_version.desc()).first()
    return summary

@router.post("/patient/{patient_id}/generate", response_model=GeneratedSummaryResponse)
def generate_patient_summary(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    docs = db.query(MedicalDocument).filter(MedicalDocument.patient_id == patient_id).all()
    fields = db.query(ExtractedField).filter(
        ExtractedField.patient_id == patient_id,
        ExtractedField.is_active == True
    ).all()
    issues = db.query(VerificationIssue).filter(
        VerificationIssue.patient_id == patient_id,
        VerificationIssue.resolved == False
    ).all()
    events = db.query(PatientTimelineEvent).filter(
        PatientTimelineEvent.patient_id == patient_id
    ).all()

    patient_dict = {
        "id": patient.id,
        "name": patient.name,
        "mrn": patient.mrn,
        "date_of_birth": patient.date_of_birth,
        "gender": patient.gender,
        "reported_conditions": patient.reported_conditions or [],
        "reported_allergies": patient.reported_allergies or [],
        "reported_medications": patient.reported_medications or []
    }
    docs_dict = [d.__dict__ for d in docs]
    fields_dict = [f.__dict__ for f in fields]
    issues_dict = [i.__dict__ for i in issues]
    events_dict = [e.__dict__ for e in events]

    summary_content = summary_generator.generate_summary(
        patient=patient_dict,
        documents=docs_dict,
        extracted_fields=fields_dict,
        verification_issues=issues_dict,
        timeline_events=events_dict
    )

    # Determine next draft version
    latest_version = db.query(GeneratedSummary).filter(
        GeneratedSummary.patient_id == patient_id
    ).order_by(GeneratedSummary.draft_version.desc()).first()

    next_ver = (latest_version.draft_version + 1) if latest_version else 1

    summary_obj = GeneratedSummary(
        patient_id=patient_id,
        draft_version=next_ver,
        status="draft",
        provider_model="MedicAssist Verifier & Clinical Summarizer",
        is_demo_mode=True,
        summary_content=summary_content
    )
    db.add(summary_obj)
    db.commit()
    db.refresh(summary_obj)

    return summary_obj

@router.post("/{summary_id}/review", response_model=SummaryReviewResponse)
def submit_summary_review(summary_id: str, payload: SummaryReviewCreate, db: Session = Depends(get_db)):
    summary = db.query(GeneratedSummary).filter(GeneratedSummary.id == summary_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found.")

    summary.status = payload.status

    review = SummaryReview(
        summary_id=summary_id,
        doctor_name=payload.doctor_name,
        status=payload.status,
        clinical_notes=payload.clinical_notes,
        reviewed_content=payload.reviewed_content or summary.summary_content,
        corrections_made=payload.corrections_made
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review
