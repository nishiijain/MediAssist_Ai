import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Building2, 
  Award, 
  ArrowRight, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';

export const DoctorRegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [medicalLicense, setMedicalLicense] = useState('');
  const [specialization, setSpecialization] = useState('Internal Medicine');
  const [hospitalName, setHospitalName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const { loginWithResponse } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !medicalLicense.trim() || !hospitalName.trim() || !email.trim()) {
      setError('Please fill out all clinician registration fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!termsAgreed) {
      setError('Please confirm adherence to patient privacy and data governance policies.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.registerDoctor({
        full_name: fullName.trim(),
        medical_license: medicalLicense.trim().toUpperCase(),
        specialization: specialization.trim(),
        hospital_name: hospitalName.trim(),
        email: email.trim(),
        password: password
      });

      setSuccessNotice('Account registered & verified successfully! Logging you in...');
      loginWithResponse(response, true);
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Registration failed. A doctor with this email or license may already exist.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <Link to="/doctor/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-teal-700 transition mb-4 ml-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Doctor Login</span>
        </Link>

        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30">
            <Stethoscope className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-3 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Register Doctor Profile
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600">
          Create verified physician credentials for longitudinal patient care.
        </p>

        {/* Simulated Verification Notice */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2.5 text-xs text-blue-800">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Simulated Verification Mode Active:</strong> Medical board directory verification is auto-approved for this university evaluation.
          </span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-200/80">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleRegister}>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name (with Title)
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Katherine Vance, MD"
                  className="block w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* License & Specialization Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Medical License / Reg No.
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Award className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={medicalLicense}
                    onChange={(e) => setMedicalLicense(e.target.value)}
                    placeholder="MED-REG-89421"
                    className="block w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Specialization
                </label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="block w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                >
                  <option value="Internal Medicine">Internal Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Endocrinology">Endocrinology</option>
                  <option value="Pulmonology">Pulmonology</option>
                  <option value="General Practice">General Practice / Family Medicine</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Emergency Medicine">Emergency Medicine</option>
                </select>
              </div>
            </div>

            {/* Hospital / Clinic & Professional Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Hospital / Clinic Name
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    placeholder="St. Jude Memorial Hospital"
                    className="block w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Professional Email
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dr.vance@hospital.org"
                    className="block w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Password (min 8 chars)
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>

            {/* Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                />
                <span className="text-xs text-slate-600">
                  I certify that I am a licensed healthcare professional and agree to maintain patient confidentiality and HIPAA-aligned data governance.
                </span>
              </label>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md shadow-teal-600/20 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying & Creating Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Doctor Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/doctor/login" className="font-semibold text-teal-600 hover:text-teal-700 hover:underline">
              Sign in to Doctor Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
