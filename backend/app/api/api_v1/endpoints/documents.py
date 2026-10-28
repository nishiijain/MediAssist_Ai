import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.models import Patient, MedicalDocument, ExtractedField, PatientTimelineEvent
from app.schemas import DocumentResponse, DocumentDetailResponse
from app.services.document_processing.extractor import document_extractor
from app.services.extraction.extractor import extraction_service
from app.services.verification.engine import verification_engine
from app.services.timeline.builder import timeline_builder

from app.api.deps import get_optional_current_user
from app.models import User

router = APIRouter()

@router.post("/upload", response_model=DocumentDetailResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    patient_id: str = Form(...),
    document_type: str = Form("General Medical Record"),
    encounter_date: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    # Patient isolation check
    if current_user and current_user.role == "patient" and current_user.patient_id != patient_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Patients are strictly authorized to upload to their own medical record only."
        )

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    # 1. Validate file extension
    original_name = file.filename or "unknown_file"
    suffix = Path(original_name).suffix.lower()
    if suffix not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{suffix}'. Supported formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # 2. Read contents & check size
    contents = await file.read()
    file_size = len(contents)
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum size limit of {settings.MAX_FILE_SIZE_MB}MB.")

    # 3. Store securely outside frontend directory
    safe_id = str(uuid.uuid4())
    stored_filename = f"{safe_id}{suffix}"
    dest_path = settings.UPLOAD_DIR / stored_filename
    with open(dest_path, "wb") as f:
        f.write(contents)

    # 4. Extract text via PyMuPDF / Tesseract
    extracted_text, page_count, ocr_used, warnings, pages_data = document_extractor.extract_document(
        str(dest_path), suffix
    )

    proc_status = "completed" if extracted_text.strip() else ("failed" if not warnings else "completed")

    doc = MedicalDocument(
        id=safe_id,
        patient_id=patient_id,
        original_filename=original_name,
        stored_filename=stored_filename,
        file_path=str(dest_path),
        file_size_bytes=file_size,
        file_type=file.content_type or "application/octet-stream",
        document_type=document_type,
        encounter_date=encounter_date,
        processing_status=proc_status,
        extracted_text=extracted_text,
        page_count=page_count,
        ocr_used=ocr_used,
        quality_warnings=warnings
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # 5. Extract structured clinical fields from this document
    if extracted_text.strip():
        extracted_data = extraction_service.extract_from_document(
            document_text=extracted_text,
            pages_data=pages_data,
            document_id=doc.id,
            patient_id=patient_id
        )
        for fd in extracted_data:
            field_obj = ExtractedField(
                patient_id=patient_id,
                document_id=doc.id,
                field_category=fd.get("field_category", "observation"),
                field_name=fd.get("field_name", ""),
                extracted_value=str(fd.get("extracted_value", "")),
                numeric_value=fd.get("numeric_value"),
                unit=fd.get("unit"),
                reference_range=fd.get("reference_range"),
                event_date=fd.get("event_date") or encounter_date,
                source_page=fd.get("source_page", 1),
                source_snippet=fd.get("source_snippet"),
                extraction_method=fd.get("extraction_method", "deterministic_rule"),
                verification_status="awaiting_verification",
                uncertainty_notes=fd.get("uncertainty_notes")
            )
            db.add(field_obj)
        db.commit()

        # Run verification check across all patient records
        all_patient_fields = db.query(ExtractedField).filter(ExtractedField.patient_id == patient_id).all()
        all_docs = db.query(MedicalDocument).filter(MedicalDocument.patient_id == patient_id).all()
        doc_texts = {d.id: d.extracted_text or "" for d in all_docs}
        
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
            for f in all_patient_fields
        ]

        updated_fields, issues = verification_engine.verify_patient_records(
            extracted_fields=fields_dict_list,
            document_texts=doc_texts,
            patient_reported_data={
                "reported_allergies": patient.reported_allergies,
                "reported_conditions": patient.reported_conditions
            }
        )

        for uf in updated_fields:
            db_f = db.query(ExtractedField).filter(ExtractedField.id == uf["id"]).first()
            if db_f:
                db_f.verification_status = uf["verification_status"]
        db.commit()

    return doc

@router.get("/patient/{patient_id}", response_model=List[DocumentResponse])
def get_patient_documents(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    if current_user and current_user.role == "patient" and current_user.patient_id != patient_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Patients can only view their own medical records."
        )
    return db.query(MedicalDocument).filter(MedicalDocument.patient_id == patient_id).order_by(MedicalDocument.upload_date.desc()).all()

@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(MedicalDocument).filter(MedicalDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc

@router.post("/{document_id}/retry", response_model=DocumentDetailResponse)
def retry_document_processing(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(MedicalDocument).filter(MedicalDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    suffix = Path(doc.file_path).suffix.lower()
    extracted_text, page_count, ocr_used, warnings, pages_data = document_extractor.extract_document(
        doc.file_path, suffix
    )
    doc.extracted_text = extracted_text
    doc.page_count = page_count
    doc.ocr_used = ocr_used
    doc.quality_warnings = warnings
    doc.processing_status = "completed" if extracted_text.strip() else "failed"
    db.commit()
    db.refresh(doc)
    return doc
