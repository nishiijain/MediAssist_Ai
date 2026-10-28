import {
  Patient,
  MedicalDocument,
  ExtractedField,
  VerificationIssue,
  TimelineEvent,
  TrendSeries,
  GeneratedSummary,
  EvaluationRun,
  DashboardStats
} from '../types';

const API_BASE = '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    let errMessage = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData?.detail) errMessage = errData.detail;
    } catch (_) {}
    throw new Error(errMessage);
  }
  if (res.status === 204) return {} as T;
  return res.json();
}

export const api = {
  // Stats
  getDashboardStats: () => fetchJson<DashboardStats>('/stats/dashboard'),

  // Demo
  loadDemoPatient: () => fetchJson<Patient>('/demo/load', { method: 'POST' }),

  // Patients
  getPatients: () => fetchJson<Patient[]>('/patients'),
  getPatient: (id: string) => fetchJson<Patient>(`/patients/${id}`),
  createPatient: (data: Partial<Patient>) =>
    fetchJson<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePatient: (id: string, data: Partial<Patient>) =>
    fetchJson<Patient>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePatient: (id: string) =>
    fetchJson<void>(`/patients/${id}`, { method: 'DELETE' }),

  // Documents
  getPatientDocuments: (patientId: string) =>
    fetchJson<MedicalDocument[]>(`/documents/patient/${patientId}`),
  getDocument: (docId: string) =>
    fetchJson<MedicalDocument>(`/documents/${docId}`),
  retryDocumentProcessing: (docId: string) =>
    fetchJson<MedicalDocument>(`/documents/${docId}/retry`, { method: 'POST' }),
  uploadDocument: async (formData: FormData): Promise<MedicalDocument> => {
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      let errMessage = 'Upload failed';
      try {
        const errData = await res.json();
        if (errData?.detail) errMessage = errData.detail;
      } catch (_) {}
      throw new Error(errMessage);
    }
    return res.json();
  },

  // Extraction
  getExtractedFields: (patientId: string) =>
    fetchJson<ExtractedField[]>(`/extraction/patient/${patientId}`),
  correctExtractedField: (fieldId: string, doctorCorrection: string, verificationStatus?: string) =>
    fetchJson<ExtractedField>(`/extraction/field/${fieldId}`, {
      method: 'PUT',
      body: JSON.stringify({
        doctor_correction: doctorCorrection,
        verification_status: verificationStatus || 'doctor_corrected',
      }),
    }),

  // Verification
  getVerificationIssues: (patientId: string) =>
    fetchJson<VerificationIssue[]>(`/verification/patient/${patientId}`),
  runVerification: (patientId: string) =>
    fetchJson<VerificationIssue[]>(`/verification/patient/${patientId}/run`, {
      method: 'POST',
    }),
  resolveIssue: (issueId: string, resolutionNotes: string) =>
    fetchJson<VerificationIssue>(`/verification/issue/${issueId}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ resolution_notes: resolutionNotes }),
    }),

  // Timeline & Trends
  getTimeline: (patientId: string) =>
    fetchJson<TimelineEvent[]>(`/timeline/patient/${patientId}`),
  getTrends: (patientId: string) =>
    fetchJson<TrendSeries[]>(`/timeline/patient/${patientId}/trends`),

  // Summaries
  getSummary: (patientId: string) =>
    fetchJson<GeneratedSummary | null>(`/summaries/patient/${patientId}`),
  generateSummary: (patientId: string) =>
    fetchJson<GeneratedSummary>(`/summaries/patient/${patientId}/generate`, {
      method: 'POST',
    }),
  submitSummaryReview: (
    summaryId: string,
    reviewData: {
      doctor_name: string;
      status: string;
      clinical_notes?: string;
      reviewed_content?: any;
      corrections_made?: any[];
    }
  ) =>
    fetchJson<any>(`/summaries/${summaryId}/review`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    }),

  // Evaluation
  getLatestEvaluation: () =>
    fetchJson<EvaluationRun | null>('/evaluation/latest'),
  runEvaluation: () =>
    fetchJson<EvaluationRun>('/evaluation/run', { method: 'POST' }),
};
