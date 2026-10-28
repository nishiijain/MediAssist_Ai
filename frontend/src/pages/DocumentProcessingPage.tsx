import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Eye,
  FileCheck,
  Calendar,
  Layers,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { MedicalDocument, Patient } from '../types';
import { Modal } from '../components/common/Modal';

export const DocumentProcessingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const patientIdFromQuery = searchParams.get('patientId');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(false);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('Laboratory Report');
  const [encounterDate, setEncounterDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Document Viewer Modal State
  const [viewingDoc, setViewingDoc] = useState<MedicalDocument | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const pList = await api.getPatients();
        setPatients(pList);
        if (pList.length > 0) {
          const initialId = patientIdFromQuery || pList[0].id;
          setSelectedPatientId(initialId);
          loadDocuments(initialId);
        }
      } catch (err) {
        console.error('Failed to load patients:', err);
      }
    };
    fetchPatients();
  }, [patientIdFromQuery]);

  const loadDocuments = async (patientId: string) => {
    if (!patientId) return;
    setLoading(true);
    try {
      const docs = await api.getPatientDocuments(patientId);
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (pid: string) => {
    setSelectedPatientId(pid);
    setSearchParams({ patientId: pid });
    loadDocuments(pid);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file to upload.');
      return;
    }
    if (!selectedPatientId) {
      setUploadError('Please select a patient to attach this document to.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('patient_id', selectedPatientId);
    formData.append('document_type', documentType);
    if (encounterDate) formData.append('encounter_date', encounterDate);
    formData.append('file', uploadFile);

    try {
      await api.uploadDocument(formData);
      setUploadFile(null);
      // Reset file input element
      const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      await loadDocuments(selectedPatientId);
    } catch (err: any) {
      setUploadError(err.message || 'Upload processing failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetry = async (docId: string) => {
    try {
      await api.retryDocumentProcessing(docId);
      await loadDocuments(selectedPatientId);
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    }
  };

  const handleInspectDoc = async (docId: string) => {
    try {
      const detailed = await api.getDocument(docId);
      setViewingDoc(detailed);
      setIsModalOpen(true);
    } catch (err: any) {
      alert(`Could not fetch document details: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Medical Document Processing & OCR
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Accepts PDFs, scans, images, and clinical notes. Preserves page boundaries and extracts verifiable text.
          </p>
        </div>

        {/* Patient Selection Dropdown */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-600">Patient:</label>
          <select
            value={selectedPatientId}
            onChange={(e) => handlePatientSelect(e.target.value)}
            className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.mrn})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Caregiver / Unconscious Patient Intake Guidance Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200/80 rounded-xl p-4 flex items-start space-x-3 text-xs text-blue-900 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900">Document-First Clinical Intake Workflow:</span>
          <p className="text-slate-600 mt-0.5 leading-relaxed">
            For patients unable to verbally communicate (e.g. unconscious trauma admissions, cognitive impairment, or language barriers), caregivers or healthcare personnel can upload available paper charts or diagnostic scans directly. The system reconstructs a chronological summary without requiring conversational chatbot input.
          </p>
        </div>
      </div>

      {/* Grid: Upload Box on Left, Document Repository on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form Box */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs lg:col-span-1 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <UploadCloud className="w-5 h-5 text-brand-600" />
            <h2 className="text-sm font-bold text-slate-800">Upload New Medical Record</h2>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Document Classification
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Laboratory Report">Laboratory Report</option>
                <option value="Prescription">Prescription Record</option>
                <option value="Consultation Note">Consultation Note</option>
                <option value="Discharge Summary">Discharge Summary</option>
                <option value="Radiology Report">Radiology Report</option>
                <option value="Emergency Intake">Emergency Intake Record</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Encounter / Document Date (if stated)
              </label>
              <input
                type="date"
                value={encounterDate}
                onChange={(e) => setEncounterDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Do not confuse upload date with actual medical event date.
              </span>
            </div>

            {/* File Drag/Drop Area */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select File (PDF, PNG, JPG, TXT)
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50">
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file-upload-input" className="cursor-pointer block">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                  {uploadFile ? (
                    <div className="text-xs font-semibold text-brand-700 break-all">
                      {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-semibold text-brand-600 hover:underline">
                        Click to select document
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Maximum file size: 25MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isUploading || !uploadFile}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-xs transition-all disabled:opacity-50 text-xs flex items-center justify-center space-x-2"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Extraction & OCR...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 mr-1" />
                  <span>Upload & Run Extraction Pipeline</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Uploaded Documents List */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-800">
                Uploaded Records ({documents.length})
              </h2>
            </div>
          </div>

          {loading ? (
            <p className="text-xs text-slate-500 py-6 text-center">Loading document repository...</p>
          ) : documents.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-medium">No Documents Attached to this Patient</p>
              <p className="text-xs">Upload a lab report, prescription, or clinical note to begin extraction.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 space-y-2">
              {documents.map((doc) => {
                const isCompleted = doc.processing_status === 'completed';
                const hasWarnings = doc.quality_warnings && doc.quality_warnings.length > 0;

                return (
                  <div
                    key={doc.id}
                    className="pt-3 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 p-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-brand-700 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-bold text-slate-900 break-all">
                            {doc.original_filename}
                          </h3>
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {doc.document_type}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                          <span>Pages: {doc.page_count}</span>
                          <span>•</span>
                          <span>Encounter: {doc.encounter_date || 'Not stated'}</span>
                          <span>•</span>
                          <span>Size: {(doc.file_size_bytes / 1024).toFixed(1)} KB</span>
                          {doc.ocr_used && (
                            <>
                              <span>•</span>
                              <span className="text-purple-600 font-medium">OCR Used</span>
                            </>
                          )}
                        </div>

                        {/* Quality Warnings */}
                        {hasWarnings && (
                          <div className="mt-1.5 flex items-center text-[11px] text-amber-700 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500 shrink-0" />
                            <span>{doc.quality_warnings.join(' | ')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleInspectDoc(doc.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Inspect Text
                      </button>
                      <button
                        onClick={() => handleRetry(doc.id)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                        title="Retry Extraction"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Document Text Inspector Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Extracted Document Content: ${viewingDoc?.original_filename || ''}`}
        maxWidth="max-w-3xl"
      >
        {viewingDoc && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Type</span>
                <span className="font-semibold text-slate-800">{viewingDoc.document_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Page Count</span>
                <span className="font-semibold text-slate-800">{viewingDoc.page_count} page(s)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Encounter Date</span>
                <span className="font-semibold text-slate-800">{viewingDoc.encounter_date || 'Not stated'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Extraction Method</span>
                <span className="font-semibold text-slate-800">{viewingDoc.ocr_used ? 'OCR Engine' : 'Digital PDF/Text Parser'}</span>
              </div>
            </div>

            {viewingDoc.quality_warnings && viewingDoc.quality_warnings.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg space-y-1">
                <div className="font-semibold flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1 text-amber-600" />
                  Extraction Quality Notice:
                </div>
                {viewingDoc.quality_warnings.map((w, idx) => (
                  <p key={idx} className="pl-5 text-amber-700">• {w}</p>
                ))}
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">
                Verbatim Extracted Plain Text:
              </p>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-96 whitespace-pre-wrap leading-relaxed">
                {viewingDoc.extracted_text || 'No text extracted.'}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
