import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FileSearch,
  CheckCircle2,
  Clock,
  Edit2,
  ExternalLink,
  ShieldAlert,
  RotateCw,
  Filter,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { Patient, ExtractedField, VerificationIssue } from '../types';
import { StatusPill } from '../components/common/StatusPill';
import { Modal } from '../components/common/Modal';

export const AIAnalysisPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const patientIdFromQuery = searchParams.get('patientId');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [issues, setIssues] = useState<VerificationIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Correction Modal State
  const [correctingField, setCorrectingField] = useState<ExtractedField | null>(null);
  const [doctorCorrectionText, setDoctorCorrectionText] = useState('');
  const [isCorrectModalOpen, setIsCorrectModalOpen] = useState(false);

  // Filter State
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const pList = await api.getPatients();
        setPatients(pList);
        if (pList.length > 0) {
          const initialId = patientIdFromQuery || pList[0].id;
          setSelectedPatientId(initialId);
          loadAnalysisData(initialId);
        }
      } catch (err) {
        console.error('Failed to load patients:', err);
      }
    };
    fetchPatients();
  }, [patientIdFromQuery]);

  const loadAnalysisData = async (patientId: string) => {
    if (!patientId) return;
    setLoading(true);
    try {
      const [fData, iData] = await Promise.all([
        api.getExtractedFields(patientId),
        api.getVerificationIssues(patientId),
      ]);
      setFields(fData);
      setIssues(iData);
    } catch (err) {
      console.error('Failed to load analysis data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (pid: string) => {
    setSelectedPatientId(pid);
    setSearchParams({ patientId: pid });
    loadAnalysisData(pid);
  };

  const handleRunVerification = async () => {
    if (!selectedPatientId) return;
    setIsVerifying(true);
    try {
      const updatedIssues = await api.runVerification(selectedPatientId);
      setIssues(updatedIssues);
      const updatedFields = await api.getExtractedFields(selectedPatientId);
      setFields(updatedFields);
    } catch (err: any) {
      alert(`Verification engine execution error: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOpenCorrection = (f: ExtractedField) => {
    setCorrectingField(f);
    setDoctorCorrectionText(f.doctor_correction || f.extracted_value);
    setIsCorrectModalOpen(true);
  };

  const handleSaveCorrection = async () => {
    if (!correctingField) return;
    try {
      await api.correctExtractedField(
        correctingField.id,
        doctorCorrectionText,
        'doctor_corrected'
      );
      setIsCorrectModalOpen(false);
      await loadAnalysisData(selectedPatientId);
    } catch (err: any) {
      alert(`Error saving correction: ${err.message}`);
    }
  };

  const handleResolveIssue = async (issueId: string) => {
    const note = prompt('Enter resolution notes / clinical rationale:');
    if (!note) return;
    try {
      await api.resolveIssue(issueId, note);
      await loadAnalysisData(selectedPatientId);
    } catch (err: any) {
      alert(`Error resolving issue: ${err.message}`);
    }
  };

  const filteredFields = fields.filter((f) => {
    if (categoryFilter === 'all') return true;
    return f.field_category === categoryFilter;
  });

  const unresolvedIssues = issues.filter((i) => !i.resolved);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            AI Information Extraction & Verification Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ground-truth source snippet matching, clinical contradiction checks, and unit consistency validation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
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

          <button
            onClick={handleRunVerification}
            disabled={isVerifying || !selectedPatientId}
            className="inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all disabled:opacity-50"
          >
            {isVerifying ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
            ) : (
              <RotateCw className="w-3.5 h-3.5 mr-1.5" />
            )}
            <span>Execute Deterministic Verification</span>
          </button>
        </div>
      </div>

      {/* Verification Issues Banner if active */}
      {unresolvedIssues.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h2 className="text-sm font-bold text-rose-900">
                Verification Alerts Requiring Clinician Review ({unresolvedIssues.length})
              </h2>
            </div>
            <span className="text-xs bg-rose-200/80 text-rose-900 font-semibold px-2 py-0.5 rounded-full">
              Automated Check Detected
            </span>
          </div>

          <div className="divide-y divide-rose-200/60 text-xs">
            {unresolvedIssues.map((iss) => (
              <div key={iss.id} className="py-2.5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-rose-900 uppercase text-[10px] tracking-wider px-1.5 py-0.5 bg-rose-200 rounded">
                      {iss.issue_type.replace('_', ' ')}
                    </span>
                    <span className="font-semibold text-rose-800">{iss.description}</span>
                  </div>
                  {iss.conflicting_reference && (
                    <p className="text-rose-700 font-mono text-[11px] bg-rose-100/60 p-1.5 rounded">
                      {iss.conflicting_reference}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleResolveIssue(iss.id)}
                  className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-800 font-semibold rounded border border-rose-300 text-[11px] shrink-0"
                >
                  Mark Resolved
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Extracted Fields Explorer */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center space-x-2">
            <FileSearch className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-bold text-slate-800">
              Extracted Clinical Findings & Evidence Trace
            </h2>
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 font-semibold rounded-full">
              {filteredFields.length} findings
            </span>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-1 overflow-x-auto text-xs pb-1 sm:pb-0">
            {['all', 'lab_result', 'medication', 'condition', 'allergy', 'date'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-md font-medium capitalize transition-all ${
                  categoryFilter === cat
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading structured extractions...</div>
        ) : filteredFields.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No extracted findings available under this category.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Field Name</th>
                  <th className="py-2.5 px-3">Extracted Value</th>
                  <th className="py-2.5 px-3">Supporting Source Snippet</th>
                  <th className="py-2.5 px-3">Verification Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredFields.map((f) => {
                  const hasDoctorCorrection = Boolean(f.doctor_correction);
                  return (
                    <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 capitalize font-medium text-slate-500">
                        {f.field_category.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">{f.field_name}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">
                          {hasDoctorCorrection ? (
                            <div>
                              <span className="line-through text-slate-400 mr-1.5">{f.extracted_value}</span>
                              <span className="text-purple-700 font-bold">{f.doctor_correction}</span>
                            </div>
                          ) : (
                            <span>{f.extracted_value} {f.unit || ''}</span>
                          )}
                        </div>
                        {f.reference_range && (
                          <span className="text-[10px] text-slate-400 block">Ref: {f.reference_range}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 max-w-xs font-mono text-[11px] text-slate-600 bg-slate-50/50 p-2 rounded">
                        {f.source_snippet ? (
                          <>
                            <span className="text-slate-400 font-sans block text-[10px] font-semibold mb-0.5">
                              Page {f.source_page}:
                            </span>
                            "{f.source_snippet}"
                          </>
                        ) : (
                          <span className="text-rose-500 font-sans italic text-[11px]">
                            ⚠️ No supporting snippet found in document!
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <StatusPill status={f.verification_status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleOpenCorrection(f)}
                          className="px-2.5 py-1 text-slate-600 hover:text-brand-700 hover:bg-brand-50 rounded font-medium border border-slate-200 transition-colors inline-flex items-center"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Correct
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Doctor Field Correction Modal */}
      <Modal
        isOpen={isCorrectModalOpen}
        onClose={() => setIsCorrectModalOpen(false)}
        title={`Doctor Clinical Correction: ${correctingField?.field_name || ''}`}
        maxWidth="max-w-md"
      >
        {correctingField && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase block">Original Extraction</span>
              <p className="font-semibold text-slate-800 text-sm">
                {correctingField.extracted_value} {correctingField.unit || ''}
              </p>
              {correctingField.source_snippet && (
                <p className="font-mono text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  Source: "{correctingField.source_snippet}"
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Doctor Corrected Value:
              </label>
              <input
                type="text"
                value={doctorCorrectionText}
                onChange={(e) => setDoctorCorrectionText(e.target.value)}
                placeholder="Enter verified clinical value..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                The original extracted text is preserved in the database audit log.
              </span>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCorrectModalOpen(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCorrection}
                className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded shadow-xs"
              >
                Save Correction
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
