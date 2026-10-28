from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import VerificationIssue, Patient, ExtractedField, MedicalDocument
from app.schemas import VerificationIssueResponse, VerificationIssueResolve
from app.services.verification.engine import verification_engine

router = APIRouter()

@router.get("/patient/{patient_id}", response_model=List[VerificationIssueResponse])
def get_patient_verification_issues(patient_id: str, db: Session = Depends(get_db)):
    return db.query(VerificationIssue).filter(
        VerificationIssue.patient_id == patient_id
    ).order_by(VerificationIssue.resolved.asc(), VerificationIssue.created_at.desc()).all()

@router.post("/patient/{patient_id}/run", response_model=List[VerificationIssueResponse])
def trigger_patient_verification(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    fields = db.query(ExtractedField).filter(
        ExtractedField.patient_id == patient_id,
        ExtractedField.is_active == True
    ).all()
    docs = db.query(MedicalDocument).filter(MedicalDocument.patient_id == patient_id).all()
    doc_texts = {d.id: d.extracted_text or "" for d in docs}

    fields_dict_list = [
        {
            "id": f.id,
            "patient_id": f.patient_id,
            "document_id": f.document_id,
            "field_category": f.field_category,
            "field_name": f.field_name,
            "extracted_value": f.extracted_value,
            "numeric_value": f.numeric_value,
            "unit": f.unit,
            "reference_range": f.reference_range,
            "event_date": f.event_date,
            "source_page": f.source_page,
            "source_snippet": f.source_snippet,
            "extraction_method": f.extraction_method,
            "verification_status": f.verification_status,
            "is_active": f.is_active
        }
        for f in fields
    ]

    updated_fields, issues = verification_engine.verify_patient_records(
        extracted_fields=fields_dict_list,
        document_texts=doc_texts,
        patient_reported_data={
            "reported_allergies": patient.reported_allergies or [],
            "reported_conditions": patient.reported_conditions or []
        }
    )

    # Update field verification statuses
    for uf in updated_fields:
        f_rec = db.query(ExtractedField).filter(ExtractedField.id == uf["id"]).first()
        if f_rec and f_rec.verification_status != "doctor_corrected":
            f_rec.verification_status = uf["verification_status"]

    # Clear old unresolved issues and write freshly detected ones
    db.query(VerificationIssue).filter(
        VerificationIssue.patient_id == patient_id,
        VerificationIssue.resolved == False
    ).delete()

    for iss in issues:
        v_iss = VerificationIssue(
            patient_id=patient_id,
            document_id=iss.get("document_id"),
            extracted_field_id=iss.get("extracted_field_id"),
            issue_type=iss.get("issue_type", "unknown"),
            severity=iss.get("severity", "medium"),
            description=iss.get("description", ""),
            expected_format=iss.get("expected_format"),
            conflicting_reference=iss.get("conflicting_reference"),
            resolved=False
        )
        db.add(v_iss)

    db.commit()

    return db.query(VerificationIssue).filter(VerificationIssue.patient_id == patient_id).all()

@router.put("/issue/{issue_id}/resolve", response_model=VerificationIssueResponse)
def resolve_issue(issue_id: str, payload: VerificationIssueResolve, db: Session = Depends(get_db)):
    issue = db.query(VerificationIssue).filter(VerificationIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Verification issue not found.")

    issue.resolved = True
    issue.resolution_notes = payload.resolution_notes
    db.commit()
    db.refresh(issue)
    return issue
