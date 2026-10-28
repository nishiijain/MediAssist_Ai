import React, { useState } from 'react';
import { Settings, Shield, Key, Database, FileText, CheckCircle2, AlertTriangle, Trash2, RotateCw } from 'lucide-react';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [resetSuccess, setResetSuccess] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  const handleResetDemo = async () => {
    if (confirm('Are you sure you want to re-seed the synthetic demo patient records?')) {
      setLoadingReset(true);
      try {
        await api.loadDemoPatient();
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 4000);
      } catch (err: any) {
        alert(`Error reloading demo: ${err.message}`);
      } finally {
        setLoadingReset(false);
      }
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings & Privacy</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure runtime parameters, security safeguards, and clinical verification adapters.
        </p>
      </div>

      {resetSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Synthetic demo data re-seeded successfully!</span>
        </div>
      )}

      {/* AI LLM Provider Configuration */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <Key className="w-5 h-5 text-brand-600" />
          <h2 className="text-sm font-bold text-slate-800">AI Provider & Inference Mode</h2>
        </div>

        <div className="space-y-3 text-xs text-slate-600">
          <p>
            MedicAssist AI runs backend-only API adapters supporting Google Gemini and OpenAI.
            When API credentials are not supplied, the system operates in high-precision{' '}
            <strong className="text-slate-900">Deterministic Clinical Engine Mode</strong> using strict clinical extraction patterns and rule-based verification.
          </p>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Configured Environment Variables (.env)</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded text-[10px]">
                Active
              </span>
            </div>
            <p className="font-mono text-[11px] text-slate-500">
              GEMINI_API_KEY=• • • • • • • • • • • • (Backend Only)<br />
              OPENAI_API_KEY=• • • • • • • • • • • • (Backend Only)<br />
              LLM_PROVIDER=auto (Fallback to Deterministic Engine)
            </p>
            <p className="text-[11px] text-slate-400">
              ⚠️ API keys are never bundled or exposed to clientside JavaScript code.
            </p>
          </div>
        </div>
      </div>

      {/* Storage & Database Architecture */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <Database className="w-5 h-5 text-brand-600" />
          <h2 className="text-sm font-bold text-slate-800">Storage & Database Architecture</h2>
        </div>

        <div className="space-y-3 text-xs text-slate-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-semibold text-slate-800 block mb-1">Local Database</span>
              <span className="font-mono text-slate-500 text-[11px]">sqlite:///backend/medicassist.db</span>
              <p className="text-[10px] text-slate-400 mt-1">
                Normalized SQLAlchemy models ready for PostgreSQL migration.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-semibold text-slate-800 block mb-1">Upload File Directory</span>
              <span className="font-mono text-slate-500 text-[11px]">backend/storage/uploads/</span>
              <p className="text-[10px] text-slate-400 mt-1">
                Protected server-side storage isolated from public webroot.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleResetDemo}
              disabled={loadingReset}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center"
            >
              <RotateCw className="w-3.5 h-3.5 mr-1.5" />
              <span>Reset & Reload Demo Patient Baseline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clinical Safety & Privacy Safeguards */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <Shield className="w-5 h-5 text-brand-600" />
          <h2 className="text-sm font-bold text-slate-800">Security & Clinical Decision-Support Safeguards</h2>
        </div>

        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Deterministic Source Matching:</strong> Extracted fields are cross-checked against verbatim document text snippets.
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>No Autonomous Diagnosis:</strong> The system extracts and flags information for clinician review, without autonomously diagnosing diseases or prescribing medication.
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Audit Trail:</strong> Doctor reviews and edits are stored alongside the original AI extractions to maintain clinical traceability.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
