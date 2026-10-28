import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  UserCheck, 
  ShieldCheck, 
  FileText, 
  Activity, 
  Sparkles, 
  ArrowRight, 
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

export const WelcomePage: React.FC = () => {
  const { user, isAuthenticated, role, loginWithResponse } = useAuth();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = React.useState<string | null>(null);
  const [demoError, setDemoError] = React.useState<string | null>(null);

  const handleQuickDemoDoctor = async () => {
    setDemoLoading('doctor');
    setDemoError(null);
    try {
      // First ensure demo accounts exist
      await authApi.seedDemoAccounts().catch(() => {});
      const res = await authApi.loginDoctor({
        email: 'doctor@medicassist.ai',
        password: 'Doctor123!'
      });
      loginWithResponse(res, true);
      navigate('/dashboard');
    } catch (err: any) {
      setDemoError(err?.response?.data?.detail || 'Failed to sign in with demo doctor account.');
    } finally {
      setDemoLoading(null);
    }
  };

  const handleQuickDemoPatient = async () => {
    setDemoLoading('patient');
    setDemoError(null);
    try {
      await authApi.seedDemoAccounts().catch(() => {});
      const res = await authApi.loginPatient({
        identifier: 'patient@medicassist.ai',
        password: 'Patient123!'
      });
      loginWithResponse(res, true);
      navigate('/patient/portal');
    } catch (err: any) {
      setDemoError(err?.response?.data?.detail || 'Failed to sign in with demo patient account.');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50/20 to-white text-slate-800 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-slate-900">MedicAssist</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">AI</span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Clinical History Analysis & Verification System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-600 hidden sm:inline">
                  Signed in as <strong className="text-slate-800">{user.full_name}</strong> ({user.role})
                </span>
                <Link
                  to={role === 'doctor' ? '/dashboard' : '/patient/portal'}
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition flex items-center gap-1.5 shadow-sm"
                >
                  Go to {role === 'doctor' ? 'Doctor Dashboard' : 'Patient Portal'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Role-Based Healthcare Security</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-4 shadow-sm">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>AI-Powered Longitudinal Health Record Synthesis</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-cyan-600">MedicAssist AI</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Intelligent medical document ingestion, factual clinical entity extraction, source-grounded verification, and longitudinal patient timeline analytics for clinicians and patients.
          </p>

          {demoError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{demoError}</span>
            </div>
          )}
        </div>

        {/* 2 Primary Choice Portals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-10">
          {/* Continue as Doctor Card */}
          <div className="group bg-white rounded-2xl border-2 border-slate-200 hover:border-teal-500 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-teal-500/10 p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -z-0 opacity-60 group-hover:scale-110 transition-transform"></div>
            
            <div className="relative z-10 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-teal-100/80 text-teal-700 flex items-center justify-center mb-5 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                <Stethoscope className="w-7 h-7" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Clinician Access</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Continue as Doctor</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Access the full clinical workspace: upload patient records, run multi-modal AI extraction, verify hallucinations with text grounding, track longitudinal disease trajectories, and sign off clinical summaries.
              </p>

              <ul className="space-y-2 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Clinical multi-document synthesis & hallucination checks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Chronological timeline with trend graphs & lab alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Doctor sign-off and EHR-ready export</span>
                </li>
              </ul>
            </div>

            <div className="relative z-10 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <Link
                to="/doctor/login"
                className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-center text-sm shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2"
              >
                <span>Doctor Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/doctor/register"
                className="py-3 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-center text-sm transition"
              >
                Register
              </Link>
            </div>

            {/* Quick Demo Button */}
            <div className="mt-3 pt-3 text-center border-t border-dashed border-slate-200">
              <button
                onClick={handleQuickDemoDoctor}
                disabled={demoLoading !== null}
                className="text-xs text-teal-700 hover:text-teal-900 font-medium hover:underline inline-flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {demoLoading === 'doctor' ? 'Signing in as Demo Doctor...' : 'Instant 1-Click Doctor Demo Login'}
              </button>
            </div>
          </div>

          {/* Continue as Patient Card */}
          <div className="group bg-white rounded-2xl border-2 border-slate-200 hover:border-cyan-500 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-cyan-500/10 p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50 rounded-bl-full -z-0 opacity-60 group-hover:scale-110 transition-transform"></div>

            <div className="relative z-10 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-cyan-100/80 text-cyan-700 flex items-center justify-center mb-5 group-hover:bg-cyan-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                <UserCheck className="w-7 h-7" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-cyan-50 text-cyan-700 text-xs font-semibold mb-2">
                <Lock className="w-3.5 h-3.5" />
                <span>Isolated Patient Portal</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Continue as Patient</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                View your personal health profile, upload prior lab reports and prescriptions, monitor test results over time, and read doctor-approved clinical summaries safely in a protected patient portal.
              </p>

              <ul className="space-y-2 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>Strict patient record isolation & cryptographic access token</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>Direct upload of PDF/image prescriptions and discharge notes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>Personal health timeline & approved medical summaries</span>
                </li>
              </ul>
            </div>

            <div className="relative z-10 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <Link
                to="/patient/login"
                className="flex-1 py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-center text-sm shadow-md shadow-cyan-600/20 transition flex items-center justify-center gap-2"
              >
                <span>Patient Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/patient/register"
                className="py-3 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-center text-sm transition"
              >
                Register
              </Link>
            </div>

            {/* Quick Demo Button */}
            <div className="mt-3 pt-3 text-center border-t border-dashed border-slate-200">
              <button
                onClick={handleQuickDemoPatient}
                disabled={demoLoading !== null}
                className="text-xs text-cyan-700 hover:text-cyan-900 font-medium hover:underline inline-flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {demoLoading === 'patient' ? 'Signing in as Demo Patient...' : 'Instant 1-Click Patient Demo Login'}
              </button>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Multi-Modal Ingestion</h4>
              <p className="text-xs text-slate-500 mt-0.5">Extracts prescriptions, lab panels & clinical narratives with zero OCR loss.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Longitudinal Timeline</h4>
              <p className="text-xs text-slate-500 mt-0.5">Chronologically clusters clinical events and flags abnormal biomarkers.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Role-Based Isolation</h4>
              <p className="text-xs text-slate-500 mt-0.5">Cryptographic JWTs & backend ownership checks prevent unauthorized record access.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} MedicAssist AI — Academic & Clinical Workflow System</p>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Demo Accounts Seeded</span>
            <span>•</span>
            <span>Local SQLite + Bcrypt + JWT</span>
            <span>•</span>
            <span>Role-Based Access Control</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
