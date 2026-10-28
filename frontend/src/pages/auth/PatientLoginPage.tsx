import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  UserCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';

export const PatientLoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { loginWithResponse } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/patient/portal';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError('Please provide your registered email or phone number and password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.loginPatient({
        identifier: identifier.trim(),
        password: password
      });
      loginWithResponse(response, rememberMe);
      navigate(from, { replace: true });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Authentication failed. Please check your patient credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setIdentifier('patient@medicassist.ai');
    setPassword('Patient123!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-cyan-700 transition mb-6 ml-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Main Portal</span>
        </Link>

        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-lg shadow-cyan-600/30">
            <UserCheck className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Patient Portal Login
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Sign in to view your medical timeline, upload reports, and read verified doctor summaries.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-200/80">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Fill Notice */}
          <div className="mb-6 p-3 bg-cyan-50/80 border border-cyan-200 rounded-xl flex items-center justify-between text-xs text-cyan-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>Demo Patient Account</span>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="font-semibold underline hover:text-cyan-950 transition"
            >
              Fill Demo Login
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="identifier" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email or Phone Number
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="patient@medicassist.ai or +1-555-0192"
                  className="block w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me-patient"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-slate-300 rounded"
                />
                <label htmlFor="remember-me-patient" className="ml-2 block text-xs text-slate-600">
                  Remember me
                </label>
              </div>

              <div className="text-xs">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="font-medium text-cyan-600 hover:text-cyan-700 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md shadow-cyan-600/20 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Patient Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-slate-500">First time using MedicAssist?</span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <Link
                to="/patient/register"
                className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 hover:underline inline-flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Create New Patient Account</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Reset Patient Password</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              In a hospital portal, an SMS or email link with an OTP is sent to your registered phone or email. For this local demo, use the seeded credentials:
            </p>
            <div className="p-3 bg-slate-50 rounded-xl text-xs font-mono text-slate-700 mb-4 border border-slate-200">
              Identifier: patient@medicassist.ai<br />
              Password: Patient123!
            </div>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
