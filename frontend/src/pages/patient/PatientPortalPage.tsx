import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { 
  Patient, 
  MedicalDocument, 
  TimelineEvent, 
  GeneratedSummary 
} from '../../types';
import { 
  User, 
  FileText, 
  Clock, 
  Upload, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  LogOut, 
  Activity, 
  Lock, 
  FileCheck, 
  Download,
  PlusCircle
} from 'lucide-react';

export const PatientPortalPage: React.FC = () => {
  const { user, logout } = useAuth();
  const patientId = user?.patient_id;

  const [activeTab, setActiveTab] = useState<'overview' | 'upload' | 'timeline' | 'summaries' | 'privacy'>('overview');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [summary, setSummary] = useState<GeneratedSummary | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('lab_report');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Simulated Access Request
  const [accessRequested, setAccessRequested] = useState(false);

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    if (!patientId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [patData, docsData, timelineData, summaryData] = await Promise.all([
        api.getPatient(patientId).catch(() => null),
        api.getPatientDocuments(patientId).catch(() => []),
        api.getTimeline(patientId).catch(() => []),
        api.getSummary(patientId).catch(() => null)
      ]);

      setPatient(patData);
      setDocuments(docsData);
      setTimeline(timelineData);
      setSummary(summaryData);
    } catch {
      setError('Could not retrieve your patient records. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !patientId) return;

    setUploading(true);
    setUploadSuccess(null);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('patient_id', patientId);
      formData.append('document_type', docType);

      await api.uploadDocument(formData);
      setUploadSuccess(`Successfully uploaded "${selectedFile.name}". The clinical AI pipeline is now extracting findings.`);
      setSelectedFile(null);
      
      const refreshedDocs = await api.getPatientDocuments(patientId);
      setDocuments(refreshedDocs);
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload document. Please check file format.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Patient Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Patient Health Portal</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                  Isolated Access
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Welcome back, <strong className="text-slate-800">{user?.full_name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-mono text-slate-600">
              <Lock className="w-3.5 h-3.5 text-cyan-600" />
              <span>MRN: {patient?.mrn || 'MED-PXXXXX'}</span>
            </div>
            <button
              onClick={logout}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-medium transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Health Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Reports & Prescriptions</span>
            {documents.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] text-slate-600">
                {documents.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>My Medical Timeline</span>
            {timeline.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] text-slate-600">
                {timeline.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('summaries')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'summaries'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Doctor Summaries</span>
            {summary && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-100 text-[10px] text-emerald-800 font-semibold">
                Available
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Data Privacy & Access</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-cyan-600 animate-spin mb-3" />
            <p className="text-sm text-slate-500">Loading your health records securely...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center text-2xl font-bold">
                        {patient?.name ? patient.name[0] : (user?.full_name ? user.full_name[0] : 'P')}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">{patient?.name || user?.full_name}</h2>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">MRN: {patient?.mrn || 'MED-PXXXXX'}</span>
                          <span>•</span>
                          <span>DOB: {patient?.date_of_birth || user?.date_of_birth || 'Recorded'}</span>
                          <span>•</span>
                          <span className="capitalize">{patient?.gender || 'Patient'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Account Verified</span>
                      </div>
                    </div>
                  </div>

                  {/* Vitals / Health Highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Known Allergies</span>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {patient?.reported_allergies && patient.reported_allergies.length > 0 ? (
                          patient.reported_allergies.map((allergy: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                              {allergy}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No drug allergies reported</span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Chronic Conditions</span>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {patient?.reported_conditions && patient.reported_conditions.length > 0 ? (
                          patient.reported_conditions.map((cond: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-medium">
                              {cond}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No chronic diagnoses on file</span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Document Records</span>
                      <p className="mt-2 text-2xl font-bold text-slate-800">{documents.length}</p>
                      <span className="text-xs text-slate-500">Prescriptions, labs & clinical notes</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions & Recent Timeline summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Upload Prompt Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
                        <Upload className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-1">Add Medical Records</h3>
                      <p className="text-xs text-slate-600 leading-relaxed mb-4">
                        Have a new prescription, discharge paper, or lab report from your clinic visit? Upload it here to update your medical chart.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Upload Medical Document</span>
                    </button>
                  </div>

                  {/* Doctor Summaries Prompt Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-4">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-1">Physician Sign-Offs</h3>
                      <p className="text-xs text-slate-600 leading-relaxed mb-4">
                        {summary ? 'You have an approved clinical summary prepared by your attending physician.' : 'No new clinical summaries awaiting review.'}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('summaries')}
                      className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                    >
                      <span>View Doctor Summaries</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* UPLOAD TAB */}
            {activeTab === 'upload' && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Upload Medical Document</h3>
                  <p className="text-xs text-slate-500 mb-6">
                    Uploaded documents are processed by the clinical AI extraction pipeline and linked strictly to your MRN.
                  </p>

                  {uploadSuccess && (
                    <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{uploadSuccess}</span>
                    </div>
                  )}

                  {uploadError && (
                    <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  <form onSubmit={handleFileUpload} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Document Classification
                      </label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="block w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                      >
                        <option value="lab_report">Laboratory Test Report (Blood, Urine, Panels)</option>
                        <option value="prescription">Prescription / Medication Order</option>
                        <option value="doctor_notes">Physician Consultation Notes</option>
                        <option value="discharge_summary">Discharge Summary / Hospital Visit</option>
                        <option value="imaging">Radiology / Imaging Report</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Select File (PDF, PNG, JPG)
                      </label>
                      <div className="border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 hover:bg-cyan-50/20">
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          accept=".pdf,.png,.jpg,.jpeg,.txt"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setSelectedFile(e.target.files[0]);
                            }
                          }}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Upload className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                          <span className="text-sm font-semibold text-slate-700 block">
                            {selectedFile ? selectedFile.name : 'Click to browse or drop file here'}
                          </span>
                          <span className="text-xs text-slate-400 mt-1 block">
                            Supports multi-page PDFs, scans, and clinical photos up to 25MB
                          </span>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!selectedFile || uploading}
                      className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading & Processing AI Extraction...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Submit to My Health Chart</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Uploaded Documents List */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                  <h4 className="text-sm font-bold text-slate-900 mb-3">My Uploaded Documents ({documents.length})</h4>
                  {documents.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No documents uploaded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div key={doc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{doc.original_filename}</p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <span className="capitalize">{doc.document_type.replace('_', ' ')}</span>
                                <span>•</span>
                                <span>{doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'Recent'}</span>
                              </div>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            doc.processing_status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {doc.processing_status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TIMELINE TAB */}
            {activeTab === 'timeline' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Chronological Medical Timeline</h3>
                    <p className="text-xs text-slate-500">
                      Unified sequence of clinical visits, lab measurements, and prescriptions.
                    </p>
                  </div>
                  <span className="text-xs font-mono bg-cyan-50 text-cyan-800 px-3 py-1 rounded-full border border-cyan-200">
                    {timeline.length} Recorded Events
                  </span>
                </div>

                {timeline.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold">No timeline events generated yet.</p>
                    <p className="text-xs text-slate-500 mt-1">Upload a medical report to populate your chronological care trajectory.</p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-0.5 before:bg-slate-200">
                    {timeline.map((event, idx) => (
                      <div key={idx} className="relative group">
                        <div className="absolute -left-[29px] top-1 w-5 h-5 rounded-full border-2 border-white bg-cyan-600 shadow-sm flex items-center justify-center text-white text-[9px] font-bold">
                          {idx + 1}
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-cyan-400 transition">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                            <span className="text-xs font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 inline-block w-fit">
                              {event.event_date || 'Date Undated'}
                            </span>
                            <span className="text-xs text-slate-500 capitalize">{event.event_type}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800">{event.title}</h4>
                          {event.description && (
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{event.description}</p>
                          )}
                          
                          {event.numeric_value !== undefined && event.numeric_value !== null && (
                            <div className="mt-2 text-xs font-semibold text-slate-700">
                              Observed Value: <span className="text-cyan-700 font-bold">{event.numeric_value} {event.unit || ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUMMARIES TAB */}
            {activeTab === 'summaries' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Approved Doctor Summaries</h3>
                  <p className="text-xs text-slate-500 mb-6">
                    Physician-verified clinical impressions, treatment plans, and discharge directions.
                  </p>

                  {!summary ? (
                    <div className="text-center py-12 text-slate-400">
                      <FileCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-semibold">No summaries signed off yet.</p>
                      <p className="text-xs text-slate-500 mt-1">Once your attending physician signs off on your clinical summary, it will appear here.</p>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-slate-900">
                              {summary.summary_content?.title || 'Longitudinal Clinical Summary'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Status: {summary.status}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            Generated on {summary.generated_at ? new Date(summary.generated_at).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                      </div>

                      {summary.summary_content?.sections?.map((section, sIdx) => (
                        <div key={sIdx} className="p-4 bg-white rounded-xl border border-slate-200">
                          <h4 className="text-sm font-bold text-slate-800 mb-1">{section.title}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed mb-2">{section.content}</p>
                          {section.bullet_points && section.bullet_points.length > 0 && (
                            <ul className="list-disc pl-4 text-xs text-slate-600 space-y-1">
                              {section.bullet_points.map((pt, pIdx) => (
                                <li key={pIdx}>{pt}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}

                      {summary.summary_content?.disclaimer && (
                        <p className="text-[11px] text-slate-400 italic pt-2">
                          {summary.summary_content.disclaimer}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DATA PRIVACY TAB */}
            {activeTab === 'privacy' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl mx-auto space-y-6">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Patient Privacy & Record Isolation</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Under MedicAssist AI's security model, your health records are cryptographically bound to your unique Patient ID ({patientId}). No patient or outside user can query or alter your medical chart.
                  </p>
                </div>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Strict Record Boundary:</strong>
                      <p className="text-slate-500 mt-0.5">API requests for documents, timelines, or summaries verify the JWT signature against this account. Cross-tenant access returns 403 Forbidden.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Zero Public Exposure:</strong>
                      <p className="text-slate-500 mt-0.5">Synthetic demo records are completely isolated and real patient data is never transmitted over external unencrypted networks.</p>
                    </div>
                  </div>
                </div>

                {/* Request Full Audit Export */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Request Complete Medical Chart Archive
                  </h4>
                  {accessRequested ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Archive request submitted. A secure encrypted download link will be prepared.</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAccessRequested(true)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Request Full Health Record Export (CCDA / PDF)</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
