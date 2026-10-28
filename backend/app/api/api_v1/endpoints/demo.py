from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas import PatientResponse
from app.services.demo.loader import demo_loader

router = APIRouter()

@router.post("/load", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def load_demo_data(db: Session = Depends(get_db)):
    """
    Populate a complete longitudinal synthetic patient record with multiple lab reports,
    prescriptions, consultation notes, conflicting HbA1c values, and allergy discrepancies.
    """
    patient = demo_loader.load_demo_patient(db)
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
        "document_count": 4,
        "verification_issues_count": 2
    }
