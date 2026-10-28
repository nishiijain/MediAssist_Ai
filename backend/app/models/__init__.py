import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base

def generate_uuid():
    return str(uuid.uuid4())

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    mrn = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    date_of_birth = Column(String(20), nullable=True)
    gender = Column(String(20), nullable=True)
    phone = Column(String(50), nullable=True)
    contact_notes = Column(Text, nullable=True)
    
    # Patient-reported data (distinguished from extracted document data)
    reported_conditions = Column(JSON, default=list)
    reported_allergies = Column(JSON, default=list)
    reported_medications = Column(JSON, default=list)
    clinical_notes = Column(Text, nullable=True)
    
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    documents = relationship("MedicalDocument", back_populates="patient", cascade="all, delete-orphan")
    consultations = relationship("Consultation", back_populates="patient", cascade="all, delete-orphan")
    extracted_fields = relationship("ExtractedField", back_populates="patient", cascade="all, delete-orphan")
    verification_issues = relationship("VerificationIssue", back_populates="patient", cascade="all, delete-orphan")
    timeline_events = relationship("PatientTimelineEvent", back_populates="patient", cascade="all, delete-orphan")
    summaries = relationship("GeneratedSummary", back_populates="patient", cascade="all, delete-orphan")


class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    consultation_date = Column(String(30), nullable=False)
    doctor_name = Column(String(100), nullable=False)
    reason_for_visit = Column(String(255), nullable=True)
    clinical_notes = Column(Text, nullable=False)
    follow_up_instructions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="consultations")


class MedicalDocument(Base):
    __tablename__ = "medical_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    file_type = Column(String(50), nullable=False)
    document_type = Column(String(100), default="General Medical Record") # Lab Report, Prescription, Consultation Note, Discharge Summary
    upload_date = Column(DateTime, default=datetime.utcnow)
    encounter_date = Column(String(30), nullable=True) # Actual medical date stated in doc
    processing_status = Column(String(50), default="pending") # pending, processing, completed, failed
    extracted_text = Column(Text, nullable=True)
    page_count = Column(Integer, default=1)
    ocr_used = Column(Boolean, default=False)
    quality_warnings = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="documents")
    extracted_fields = relationship("ExtractedField", back_populates="document", cascade="all, delete-orphan")
    verification_issues = relationship("VerificationIssue", back_populates="document", cascade="all, delete-orphan")
    timeline_events = relationship("PatientTimelineEvent", back_populates="document")


class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("medical_documents.id", ondelete="CASCADE"), nullable=True, index=True)
    field_category = Column(String(50), nullable=False) # condition, medication, allergy, lab_result, observation, date
    field_name = Column(String(150), nullable=False)
    extracted_value = Column(String(255), nullable=False)
    numeric_value = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)
    reference_range = Column(String(100), nullable=True)
    event_date = Column(String(30), nullable=True)
    source_page = Column(Integer, default=1)
    source_snippet = Column(Text, nullable=True)
    extraction_method = Column(String(50), default="llm") # llm, rule, doctor_entry
    verification_status = Column(String(50), default="awaiting_verification") 
    # awaiting_verification, source_supported, needs_clarification, conflicting_information, extraction_failed, doctor_reviewed, doctor_corrected
    uncertainty_notes = Column(Text, nullable=True)
    doctor_correction = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient", back_populates="extracted_fields")
    document = relationship("MedicalDocument", back_populates="extracted_fields")
    verification_issues = relationship("VerificationIssue", back_populates="extracted_field", cascade="all, delete-orphan")


class VerificationIssue(Base):
    __tablename__ = "verification_issues"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("medical_documents.id", ondelete="CASCADE"), nullable=True, index=True)
    extracted_field_id = Column(String(36), ForeignKey("extracted_fields.id", ondelete="CASCADE"), nullable=True, index=True)
    issue_type = Column(String(50), nullable=False) 
    # source_mismatch, invalid_date, missing_unit, incompatible_unit, missing_field, contradiction, unsupported_claim, document_quality
    severity = Column(String(20), default="medium") # low, medium, high, critical
    description = Column(Text, nullable=False)
    expected_format = Column(String(255), nullable=True)
    conflicting_reference = Column(Text, nullable=True)
    resolved = Column(Boolean, default=False)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="verification_issues")
    document = relationship("MedicalDocument", back_populates="verification_issues")
    extracted_field = relationship("ExtractedField", back_populates="verification_issues")


class PatientTimelineEvent(Base):
    __tablename__ = "patient_timeline_events"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("medical_documents.id", ondelete="SET NULL"), nullable=True)
    extracted_field_id = Column(String(36), ForeignKey("extracted_fields.id", ondelete="SET NULL"), nullable=True)
    event_date = Column(String(30), nullable=False, index=True)
    event_type = Column(String(50), nullable=False) # document, lab_result, diagnosis, medication_start, consultation, allergy_noted
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    numeric_value = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)
    reference_range = Column(String(100), nullable=True)
    source_snippet = Column(Text, nullable=True)
    is_flagged = Column(Boolean, default=False)
    clinical_flag_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="timeline_events")
    document = relationship("MedicalDocument", back_populates="timeline_events")


class GeneratedSummary(Base):
    __tablename__ = "generated_summaries"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    draft_version = Column(Integer, default=1)
    status = Column(String(30), default="draft") # draft, reviewed, approved, rejected
    provider_model = Column(String(100), default="MedicAssist Rule & LLM Verifier")
    is_demo_mode = Column(Boolean, default=True)
    summary_content = Column(JSON, nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="summaries")
    reviews = relationship("SummaryReview", back_populates="summary", cascade="all, delete-orphan")


class SummaryReview(Base):
    __tablename__ = "summary_reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    summary_id = Column(String(36), ForeignKey("generated_summaries.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_name = Column(String(150), nullable=False)
    status = Column(String(30), nullable=False) # approved, rejected, modified
    clinical_notes = Column(Text, nullable=True)
    reviewed_content = Column(JSON, nullable=True)
    corrections_made = Column(JSON, default=list)
    reviewed_at = Column(DateTime, default=datetime.utcnow)

    summary = relationship("GeneratedSummary", back_populates="reviews")


class EvaluationRun(Base):
    __tablename__ = "evaluation_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    run_date = Column(DateTime, default=datetime.utcnow)
    model_evaluated = Column(String(100), nullable=False)
    test_suite_name = Column(String(100), default="MedicAssist Synthetic Benchmark v1")
    total_cases = Column(Integer, default=0)
    baseline_precision = Column(Float, default=0.0)
    baseline_recall = Column(Float, default=0.0)
    baseline_f1 = Column(Float, default=0.0)
    baseline_omission_rate = Column(Float, default=0.0)
    baseline_unsupported_rate = Column(Float, default=0.0)
    
    proposed_precision = Column(Float, default=0.0)
    proposed_recall = Column(Float, default=0.0)
    proposed_f1 = Column(Float, default=0.0)
    proposed_omission_rate = Column(Float, default=0.0)
    proposed_unsupported_rate = Column(Float, default=0.0)
    missing_field_detection_rate = Column(Float, default=0.0)
    
    execution_time_seconds = Column(Float, default=0.0)
    unresolved_issues_count = Column(Integer, default=0)
    detailed_results = Column(JSON, default=list)
