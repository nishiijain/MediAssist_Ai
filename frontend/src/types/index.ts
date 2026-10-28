export interface User {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  role: 'doctor' | 'patient';
  license_number?: string;
  specialization?: string;
  hospital_name?: string;
  is_verified: boolean;
  date_of_birth?: string;
  patient_id?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Patient {
  id: string;
  mrn: string;
  name: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  contact_notes?: string;
  reported_conditions: string[];
  reported_allergies: string[];
  reported_medications: string[];
  clinical_notes?: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  document_count?: number;
  verification_issues_count?: number;
}

export interface MedicalDocument {
  id: string;
  patient_id: string;
  original_filename: string;
  stored_filename: string;
  file_size_bytes: number;
  file_type: string;
  document_type: string;
  upload_date: string;
  encounter_date?: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  extracted_text?: string;
  page_count: number;
  ocr_used: boolean;
  quality_warnings: string[];
  created_at: string;
}

export interface ExtractedField {
  id: string;
  patient_id: string;
  document_id?: string;
  field_category: 'condition' | 'medication' | 'allergy' | 'lab_result' | 'observation' | 'date';
  field_name: string;
  extracted_value: string;
  numeric_value?: number;
  unit?: string;
  reference_range?: string;
  event_date?: string;
  source_page: number;
  source_snippet?: string;
  extraction_method: string;
  verification_status: 
    | 'awaiting_verification' 
    | 'source_supported' 
    | 'needs_clarification' 
    | 'conflicting_information' 
    | 'extraction_failed' 
    | 'doctor_reviewed' 
    | 'doctor_corrected';
  uncertainty_notes?: string;
  doctor_correction?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VerificationIssue {
  id: string;
  patient_id: string;
  document_id?: string;
  extracted_field_id?: string;
  issue_type: 
    | 'source_mismatch' 
    | 'invalid_date' 
    | 'missing_unit' 
    | 'incompatible_unit' 
    | 'missing_field' 
    | 'contradiction' 
    | 'unsupported_claim' 
    | 'document_quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expected_format?: string;
  conflicting_reference?: string;
  resolved: boolean;
  resolution_notes?: string;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  patient_id: string;
  document_id?: string;
  extracted_field_id?: string;
  event_date: string;
  event_type: 'document' | 'lab_result' | 'diagnosis' | 'medication_start' | 'consultation' | 'allergy_noted';
  title: string;
  description?: string;
  numeric_value?: number;
  unit?: string;
  reference_range?: string;
  source_snippet?: string;
  is_flagged: boolean;
  clinical_flag_reason?: string;
  created_at: string;
}

export interface TrendPoint {
  date: string;
  value: number;
  unit: string;
  reference_range?: string;
  source_document?: string;
  is_flagged: boolean;
}

export interface TrendSeries {
  test_name: string;
  unit: string;
  reference_range?: string;
  data_points: TrendPoint[];
}

export interface SummarySection {
  section_number: number;
  title: string;
  content: string;
  bullet_points: string[];
  source_references: any[];
  has_warning: boolean;
}

export interface GeneratedSummary {
  id: string;
  patient_id: string;
  draft_version: number;
  status: 'draft' | 'reviewed' | 'approved' | 'rejected';
  provider_model: string;
  is_demo_mode: boolean;
  summary_content: {
    title: string;
    generated_at: string;
    patient_mrn: string;
    sections: SummarySection[];
    disclaimer: string;
  };
  generated_at: string;
  reviews: any[];
}

export interface EvaluationMetrics {
  precision: number;
  recall: number;
  f1: number;
  omission_rate: number;
  unsupported_rate: number;
  missing_field_detection_rate: number;
}

export interface EvaluationRun {
  id: string;
  run_date: string;
  model_evaluated: string;
  test_suite_name: string;
  total_cases: number;
  baseline_precision: number;
  baseline_recall: number;
  baseline_f1: number;
  baseline_omission_rate: number;
  baseline_unsupported_rate: number;
  proposed_precision: number;
  proposed_recall: number;
  proposed_f1: number;
  proposed_omission_rate: number;
  proposed_unsupported_rate: number;
  missing_field_detection_rate: number;
  execution_time_seconds: number;
  unresolved_issues_count: number;
  detailed_results: any[];
}

export interface DashboardStats {
  total_patients: number;
  total_documents: number;
  total_consultations: number;
  summaries_awaiting_review: number;
  unresolved_issues_count: number;
  recent_activity: any[];
  status_distribution: Record<string, number>;
  trend_stats: { type: string; count: number }[];
}
