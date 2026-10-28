from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import ExtractedField, Patient
from app.schemas import ExtractedFieldResponse, ExtractedFieldUpdate

router = APIRouter()

@router.get("/patient/{patient_id}", response_model=List[ExtractedFieldResponse])
def get_extracted_fields(patient_id: str, db: Session = Depends(get_db)):
    fields = db.query(ExtractedField).filter(
        ExtractedField.patient_id == patient_id,
        ExtractedField.is_active == True
    ).order_by(ExtractedField.created_at.desc()).all()
    return fields

@router.put("/field/{field_id}", response_model=ExtractedFieldResponse)
def update_extracted_field(field_id: str, payload: ExtractedFieldUpdate, db: Session = Depends(get_db)):
    field = db.query(ExtractedField).filter(ExtractedField.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Extracted field not found.")

    if payload.doctor_correction is not None:
        field.doctor_correction = payload.doctor_correction
        field.verification_status = "doctor_corrected"
    if payload.verification_status is not None:
        field.verification_status = payload.verification_status
    if payload.uncertainty_notes is not None:
        field.uncertainty_notes = payload.uncertainty_notes

    db.commit()
    db.refresh(field)
    return field
