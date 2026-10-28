import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.session import get_db
from app.models import User, Patient
from app.schemas import (
    DoctorRegisterRequest,
    DoctorLoginRequest,
    PatientRegisterRequest,
    PatientLoginRequest,
    AuthResponse,
    UserResponse
)
from app.core.security import hash_password, verify_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/doctor/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_doctor(payload: DoctorRegisterRequest, db: Session = Depends(get_db)):
    # 1. Validate password match
    if payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match."
        )

    # 2. Check if email exists
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # 3. Create Doctor User
    user = User(
        email=payload.email.lower().strip(),
        full_name=payload.full_name.strip(),
        hashed_password=hash_password(payload.password),
        role="doctor",
        license_number=payload.license_number.strip(),
        specialization=payload.specialization.strip(),
        hospital_name=payload.hospital_name.strip(),
        is_verified=True # Auto-approved in demo/prototype environment with simulated verification badge
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 4. Generate Token
    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/doctor/login", response_model=AuthResponse)
def login_doctor(payload: DoctorLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid doctor email or password."
        )

    if user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is registered as a patient. Please use the Patient Portal Login."
        )

    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/patient/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_patient(payload: PatientRegisterRequest, db: Session = Depends(get_db)):
    # 1. Validate password match
    if payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match."
        )

    clean_email = payload.email.lower().strip()
    clean_phone = payload.phone.strip() if payload.phone else None

    # 2. Check if email or phone already registered
    existing_query = db.query(User).filter(User.email == clean_email)
    if clean_phone:
        existing_query = db.query(User).filter(
            or_(User.email == clean_email, User.phone == clean_phone)
        )
    if existing_query.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email or phone number already exists."
        )

    # 3. Provision a linked medical Patient chart in the system
    mrn = f"MED-P{uuid.uuid4().hex[:6].upper()}"
    patient_record = Patient(
        mrn=mrn,
        name=payload.full_name.strip(),
        date_of_birth=payload.date_of_birth,
        gender="Not specified",
        phone=clean_phone,
        reported_conditions=[],
        reported_allergies=[],
        reported_medications=[],
        clinical_notes=f"Self-registered online patient portal account on {datetime.utcnow().strftime('%Y-%m-%d')}.",
        is_demo=False
    )
    db.add(patient_record)
    db.commit()
    db.refresh(patient_record)

    # 4. Create Patient User account linked to patient_record.id
    user = User(
        email=clean_email,
        phone=clean_phone,
        full_name=payload.full_name.strip(),
        hashed_password=hash_password(payload.password),
        role="patient",
        date_of_birth=payload.date_of_birth,
        patient_id=patient_record.id,
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email, "patient_id": user.patient_id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/patient/login", response_model=AuthResponse)
def login_patient(payload: PatientLoginRequest, db: Session = Depends(get_db)):
    ident = payload.identifier.strip().lower()
    user = db.query(User).filter(
        or_(User.email == ident, User.phone == payload.identifier.strip())
    ).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/phone or password."
        )

    if user.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is registered as a clinician. Please use the Doctor Portal Login."
        )

    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email, "patient_id": user.patient_id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Return authenticated user profile."""
    return current_user

@router.post("/seed-demo-accounts")
def seed_demo_accounts(db: Session = Depends(get_db)):
    """Seed demo doctor and demo patient accounts for presentation/college demo."""
    # 1. Demo Doctor: doctor@medicassist.ai / Doctor123!
    doc_email = "doctor@medicassist.ai"
    doc = db.query(User).filter(User.email == doc_email).first()
    if not doc:
        doc = User(
            email=doc_email,
            full_name="Dr. Emily Carter, MD",
            hashed_password=hash_password("Doctor123!"),
            role="doctor",
            license_number="MD-492019-NY",
            specialization="Endocrinology & Internal Medicine",
            hospital_name="Metropolitan Clinical Center",
            is_verified=True
        )
        db.add(doc)

    # 2. Find or create demo patient Johnathan Doe
    demo_p = db.query(Patient).filter(Patient.mrn == "MED-98402").first()
    patient_id = demo_p.id if demo_p else None

    # Demo Patient: patient@medicassist.ai / Patient123!
    pat_email = "patient@medicassist.ai"
    pat = db.query(User).filter(User.email == pat_email).first()
    if not pat:
        pat = User(
            email=pat_email,
            phone="+1 (555) 019-2831",
            full_name="Johnathan Doe",
            hashed_password=hash_password("Patient123!"),
            role="patient",
            date_of_birth="1966-08-20",
            patient_id=patient_id,
            is_verified=True
        )
        db.add(pat)
    elif demo_p and not pat.patient_id:
        pat.patient_id = demo_p.id

    db.commit()
    return {
        "status": "success",
        "message": "Demo doctor and patient accounts initialized.",
        "demo_accounts": {
            "doctor": {"email": "doctor@medicassist.ai", "password": "Doctor123!", "role": "doctor"},
            "patient": {"email": "patient@medicassist.ai", "password": "Patient123!", "role": "patient"}
        }
    }
