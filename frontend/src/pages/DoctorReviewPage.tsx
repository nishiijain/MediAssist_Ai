import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Edit3,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FileText,
  RotateCw,
  Clock,
  UserCheck,
  Save
} from 'lucide-react';
import { api } from '../services/api';
import { Patient, GeneratedSummary, SummarySection } from '../types';

export const DoctorReviewPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const patientIdFromQuery = searchParams.get('patientId');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [summary, setSummary] = useState<GeneratedSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Doctor Edit Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedSections, setEditedSections] = useState<SummarySection[]>([]);
  const [doctorName, setDoctorName] = useState('Dr. Emily Carter, MD');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const pList = await api.getPatients();
        setPatients(pList);
        if (pList.length > 0) {
          const initialId = patientIdFromQuery || pList[0].id;
          setSelectedPatientId(initialId);
          loadSummary(initialId);
        }
      } catch (err) {
        console.error('Failed to load patients:', err);
      }
    };
    fetchPatients();
  }, [patientIdFromQuery]);

  const loadSummary = async (patientId: string) => {
    if (!patientId) return;
    setLoading(true);
    try {
      const data = await api.getSummary(patientId);
      setSummary(data);
      if (data?.summary_content?.sections) {
        setEditedSections(JSON.parse(JSON.stringify(data.summary_content.sections)));
      } else {
        setEditedSections([]);
      }
    } catch (err) {
      console.error('Failed to load summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (pid: string) => {
    setSelectedPatientId(pid);
    setSearchParams({ patientId: pid });
    loadSummary(pid);
  };

  const handleGenerateSummary = async () => {
    if (!selectedPatientId) return;
    setIsGenerating(true);
    try {
      const generated = await api.generateSummary(selectedPatientId);
      setSummary(generated);
      if (generated?.summary_content?.sections) {
        setEditedSections(JSON.parse(JSON.stringify(generated.summary_content.sections)));
      }
      setIsEditMode(false);
    } catch (err: any) {
      alert(`Error generating summary: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSectionTextChange = (secIndex: number, newContent: string) => {
    const updated = [...editedSections];
    updated[secIndex].content = newContent;
    setEditedSections(updated);
  };

  const handleSubmitReview = async (reviewStatus: 'approved' | 'rejected' | 'modified') => {
    if (!summary) return;
    setIsSubmitting(true);
    try {
      const updatedReviewedContent = {
        ...summary.summary_content,
        sections: editedSections,
      };

      await api.submitSummaryReview(summary.id, {
        doctor_name: doctorName,
        status: reviewStatus,
        clinical_notes: clinicalNotes,
        reviewed_content: updatedReviewedContent,
        corrections_made: [
          {
            timestamp: new Date().toISOString(),
            status: reviewStatus,
            doctor: doctorName,
          },
        ],
      });

      setReviewSuccessMsg(true);
      setTimeout(() => setReviewSuccessMsg(false), 4000);
      setIsEditMode(false);
      await loadSummary(selectedPatientId);
    } catch (err: any) {
      alert(`Error submitting review: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Doctor Review & Clinical Summary Approval
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review the 10-section structured history, inspect source citations, and approve or amend draft summaries.
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
            onClick={handleGenerateSummary}
            disabled={isGenerating || !selectedPatientId}
            className="inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            )}
            <span>Regenerate Summary Draft</span>
          </button>
        </div>
      </div>

      {reviewSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Doctor review signed and persisted in patient clinical audit log!</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500">Loading clinical summary...</div>
      ) : !summary ? (
        <div className="p-12 bg-white border border-slate-200 rounded-xl text-center space-y-3">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-base font-semibold text-slate-800">No Generated Summary Draft Yet</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click "Regenerate Summary Draft" above to generate a 10-section verified synthesis from the patient's records.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Status and Actions Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-slate-900">
                  Draft Version {summary.draft_version}
                </span>
                <span
                  className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${
                    summary.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : summary.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Status: {summary.status}
                </span>
                <span className="text-xs text-slate-400">
                  • Generated {new Date(summary.generated_at).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Engine: <span className="font-medium text-slate-700">{summary.provider_model}</span>
              </p>
            </div>

            {/* Doctor Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center ${
                  isEditMode
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                <span>{isEditMode ? 'Exit Edit Mode' : 'Edit Sections'}</span>
              </button>

              <button
                onClick={() => handleSubmitReview('approved')}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                <span>Approve & Sign</span>
              </button>

              <button
                onClick={() => handleSubmitReview('rejected')}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                <span>Reject</span>
              </button>
            </div>
          </div>

          {/* Doctor Clinical Notes Drawer if editing */}
          {isEditMode && (
            <div className="p-4 bg-brand-50/50 border border-brand-200 rounded-xl space-y-3 text-xs">
              <div className="flex items-center space-x-2 text-brand-900 font-bold">
                <UserCheck className="w-4 h-4 text-brand-600" />
                <span>Physician Reviewer Attestation</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Reviewing Doctor Name
                  </label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Physician Clinical Addendum / Notes
                  </label>
                  <input
                    type="text"
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="Add clinical context or verification rationale..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 10 Structured Sections Display */}
          <div className="space-y-4">
            {editedSections.map((sec, idx) => (
              <div
                key={sec.section_number}
                className={`bg-white border rounded-xl p-5 shadow-xs transition-all ${
                  sec.has_warning ? 'border-amber-300 bg-amber-50/10' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                      {sec.section_number}
                    </span>
                    <h2 className="text-sm font-bold text-slate-900">{sec.title}</h2>
                  </div>

                  {sec.has_warning && (
                    <span className="inline-flex items-center text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                      Contains Clinical Alert / Uncertainty
                    </span>
                  )}
                </div>

                {isEditMode ? (
                  <textarea
                    rows={3}
                    value={sec.content}
                    onChange={(e) => handleSectionTextChange(idx, e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-sans leading-relaxed"
                  />
                ) : (
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">{sec.content}</p>
                )}

                {/* Section Bullet Points */}
                {sec.bullet_points && sec.bullet_points.length > 0 && (
                  <ul className="mt-3 space-y-1.5 pl-4 list-disc text-xs text-slate-600">
                    {sec.bullet_points.map((bp, bIdx) => (
                      <li key={bIdx} className="leading-relaxed">
                        {bp}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Medical Legal Disclaimer */}
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
            {summary.summary_content.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
