import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models import Patient, MedicalDocument, VerificationIssue
from app.schemas import PatientCreate, PatientUpdate, PatientResponse

router = APIRouter()

@router.get("", response_model=List[PatientResponse])
def list_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    patients = db.query(Patient).order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()
    
    results = []
    for p in patients:
        doc_count = db.query(func.count(MedicalDocument.id)).filter(MedicalDocument.patient_id == p.id).scalar() or 0
        issue_count = db.query(func.count(VerificationIssue.id)).filter(
            VerificationIssue.patient_id == p.id,
            VerificationIssue.resolved == False
        ).scalar() or 0
        
        p_dict = {
            "id": p.id,
            "mrn": p.mrn,
            "name": p.name,
            "date_of_birth": p.date_of_birth,
            "gender": p.gender,
            "phone": p.phone,
            "contact_notes": p.contact_notes,
            "reported_conditions": p.reported_conditions or [],
            "reported_allergies": p.reported_allergies or [],
            "reported_medications": p.reported_medications or [],
            "clinical_notes": p.clinical_notes,
            "is_demo": p.is_demo,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "document_count": doc_count,
            "verification_issues_count": issue_count
        }
        results.append(p_dict)
    return results

@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(payload: PatientCreate, db: Session = Depends(get_db)):
    # Generate unique MRN if not supplied
    mrn = payload.mrn or f"MED-{uuid.uuid4().hex[:6].upper()}"
    existing = db.query(Patient).filter(Patient.mrn == mrn).first()
    if existing:
        raise HTTPException(status_code=400, detail="A patient with this MRN already exists.")

    patient = Patient(
        mrn=mrn,
        name=payload.name,
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
        phone=payload.phone,
        contact_notes=payload.contact_notes,
        reported_conditions=payload.reported_conditions,
        reported_allergies=payload.reported_allergies,
        reported_medications=payload.reported_medications,
        clinical_notes=payload.clinical_notes,
        is_demo=False
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    return {
        "id": patient.id,
        "mrn": patient.mrn,
        "name": patient.name,
        "date_of_birth": patient.date_of_birth,
        "gender": patient.gender,
        "phone": patient.phone,
        "contact_notes": patient.contact_notes,
        "reported_conditions": patient.reported_conditions or [],
        "reported_allergies": patient.reported_allergies or [],
        "reported_medications": patient.reported_medications or [],
        "clinical_notes": patient.clinical_notes,
        "is_demo": patient.is_demo,
        "created_at": patient.created_at,
        "updated_at": patient.updated_at,
        "document_count": 0,
        "verification_issues_count": 0
    }

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found.")
    
    doc_count = db.query(func.count(MedicalDocument.id)).filter(MedicalDocument.patient_id == p.id).scalar() or 0
    issue_count = db.query(func.count(VerificationIssue.id)).filter(
        VerificationIssue.patient_id == p.id,
        VerificationIssue.resolved == False
    ).scalar() or 0

    return {
        "id": p.id,
        "mrn": p.mrn,
        "name": p.name,
        "date_of_birth": p.date_of_birth,
        "gender": p.gender,
        "phone": p.phone,
        "contact_notes": p.contact_notes,
        "reported_conditions": p.reported_conditions or [],
        "reported_allergies": p.reported_allergies or [],
        "reported_medications": p.reported_medications or [],
        "clinical_notes": p.clinical_notes,
        "is_demo": p.is_demo,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
        "document_count": doc_count,
        "verification_issues_count": issue_count
    }

@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(patient_id: str, payload: PatientUpdate, db: Session = Depends(get_db)):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found.")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(p, field, val)

    db.commit()
    db.refresh(p)

    doc_count = db.query(func.count(MedicalDocument.id)).filter(MedicalDocument.patient_id == p.id).scalar() or 0
    issue_count = db.query(func.count(VerificationIssue.id)).filter(
        VerificationIssue.patient_id == p.id,
        VerificationIssue.resolved == False
    ).scalar() or 0

    return {
        "id": p.id,
        "mrn": p.mrn,
        "name": p.name,
        "date_of_birth": p.date_of_birth,
        "gender": p.gender,
        "phone": p.phone,
        "contact_notes": p.contact_notes,
        "reported_conditions": p.reported_conditions or [],
        "reported_allergies": p.reported_allergies or [],
        "reported_medications": p.reported_medications or [],
        "clinical_notes": p.clinical_notes,
        "is_demo": p.is_demo,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
        "document_count": doc_count,
        "verification_issues_count": issue_count
    }

@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(patient_id: str, db: Session = Depends(get_db)):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found.")
    db.delete(p)
    db.commit()
    return None
