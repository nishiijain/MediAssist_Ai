from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict

# Patient Schemas
class PatientBase(BaseModel):
    name: str = Field(..., description="Patient Name")
    date_of_birth: Optional[str] = Field(None, description="Date of birth YYYY-MM-DD")
    gender: Optional[str] = Field(None, description="Gender")
    phone: Optional[str] = Field(None, description="Contact phone")
    contact_notes: Optional[str] = None
    reported_conditions: List[str] = []
    reported_allergies: List[str] = []
    reported_medications: List[str] = []
    clinical_notes: Optional[str] = None

class PatientCreate(PatientBase):
    mrn: Optional[str] = None

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    contact_notes: Optional[str] = None
    reported_conditions: Optional[List[str]] = None
    reported_allergies: Optional[List[str]] = None
    reported_medications: Optional[List[str]] = None
    clinical_notes: Optional[str] = None

class PatientResponse(PatientBase):
    id: str
    mrn: str
    is_demo: bool
    created_at: datetime
    updated_at: datetime
    document_count: Optional[int] = 0
    verification_issues_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

# Document Schemas
class DocumentResponse(BaseModel):
    id: str
    patient_id: str
    original_filename: str
    stored_filename: str
    file_size_bytes: int
    file_type: str
    document_type: str
    upload_date: datetime
    encounter_date: Optional[str] = None
    processing_status: str
    page_count: int
    ocr_used: bool
    quality_warnings: List[str] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DocumentDetailResponse(DocumentResponse):
    extracted_text: Optional[str] = None

# Extracted Field Schemas
class ExtractedFieldBase(BaseModel):
    field_category: str # condition, medication, allergy, lab_result, observation, date
    field_name: str
    extracted_value: str
    numeric_value: Optional[float] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    event_date: Optional[str] = None
    source_page: int = 1
    source_snippet: Optional[str] = None
    extraction_method: str = "llm"
    verification_status: str = "awaiting_verification"
    uncertainty_notes: Optional[str] = None

class ExtractedFieldCreate(ExtractedFieldBase):
    patient_id: str
    document_id: Optional[str] = None

class ExtractedFieldUpdate(BaseModel):
    doctor_correction: Optional[str] = None
    verification_status: Optional[str] = None
    uncertainty_notes: Optional[str] = None

class ExtractedFieldResponse(ExtractedFieldBase):
    id: str
    patient_id: str
    document_id: Optional[str] = None
    doctor_correction: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Verification Issue Schemas
class VerificationIssueResponse(BaseModel):
    id: str
    patient_id: str
    document_id: Optional[str] = None
    extracted_field_id: Optional[str] = None
    issue_type: str
    severity: str
    description: str
    expected_format: Optional[str] = None
    conflicting_reference: Optional[str] = None
    resolved: bool
    resolution_notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class VerificationIssueResolve(BaseModel):
    resolution_notes: str

# Timeline Event Schemas
class TimelineEventResponse(BaseModel):
    id: str
    patient_id: str
    document_id: Optional[str] = None
    extracted_field_id: Optional[str] = None
    event_date: str
    event_type: str
    title: str
    description: Optional[str] = None
    numeric_value: Optional[float] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    source_snippet: Optional[str] = None
    is_flagged: bool
    clinical_flag_reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TrendPoint(BaseModel):
    date: str
    value: float
    unit: str
    reference_range: Optional[str] = None
    source_document: Optional[str] = None
    is_flagged: bool = False

class TrendSeries(BaseModel):
    test_name: str
    unit: str
    reference_range: Optional[str] = None
    data_points: List[TrendPoint]

# Summary Schemas
class SummarySection(BaseModel):
    title: str
    section_number: int
    content: str
    bullet_points: List[str] = []
    source_references: List[Dict[str, Any]] = []
    has_warning: bool = False
    warning_details: Optional[str] = None

class SummaryReviewCreate(BaseModel):
    doctor_name: str
    status: str # approved, rejected, modified
    clinical_notes: Optional[str] = None
    reviewed_content: Optional[Dict[str, Any]] = None
    corrections_made: List[Dict[str, Any]] = []

class SummaryReviewResponse(BaseModel):
    id: str
    summary_id: str
    doctor_name: str
    status: str
    clinical_notes: Optional[str] = None
    reviewed_content: Optional[Dict[str, Any]] = None
    corrections_made: List[Dict[str, Any]] = []
    reviewed_at: datetime

    model_config = ConfigDict(from_attributes=True)

class GeneratedSummaryResponse(BaseModel):
    id: str
    patient_id: str
    draft_version: int
    status: str
    provider_model: str
    is_demo_mode: bool
    summary_content: Dict[str, Any]
    generated_at: datetime
    reviews: List[SummaryReviewResponse] = []

    model_config = ConfigDict(from_attributes=True)

# Evaluation Schemas
class EvaluationRunResponse(BaseModel):
    id: str
    run_date: datetime
    model_evaluated: str
    test_suite_name: str
    total_cases: int
    baseline_precision: float
    baseline_recall: float
    baseline_f1: float
    baseline_omission_rate: float
    baseline_unsupported_rate: float
    proposed_precision: float
    proposed_recall: float
    proposed_f1: float
    proposed_omission_rate: float
    proposed_unsupported_rate: float
    missing_field_detection_rate: float
    execution_time_seconds: float
    unresolved_issues_count: int
    detailed_results: List[Dict[str, Any]]

    model_config = ConfigDict(from_attributes=True)

# Dashboard Stats Schema
class DashboardStatsResponse(BaseModel):
    total_patients: int
    total_documents: int
    total_consultations: int
    summaries_awaiting_review: int
    unresolved_issues_count: int
    recent_activity: List[Dict[str, Any]]
    status_distribution: Dict[str, int]
    trend_stats: List[Dict[str, Any]]
