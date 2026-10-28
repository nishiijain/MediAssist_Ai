import React, { useState } from 'react';
import { Activity, Sparkles, Check, Database, LogOut, ShieldCheck, User } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onDemoLoaded?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onDemoLoaded }) => {
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoLoadedMsg, setDemoLoadedMsg] = useState(false);

  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLoadDemo = async () => {
    try {
      setLoadingDemo(true);
      await api.loadDemoPatient();
      setDemoLoadedMsg(true);
      setTimeout(() => setDemoLoadedMsg(false), 4000);
      if (onDemoLoaded) onDemoLoaded();
    } catch (err: any) {
      alert(`Error loading demo patient: ${err.message}`);
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'DR';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-sm">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              MedicAssist <span className="text-teal-600">AI</span>
            </h1>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
              Clinical Support
            </span>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">
            AI-Assisted Patient History Analysis & Deterministic Verification System
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Load Demo Patient Action */}
        <button
          onClick={handleLoadDemo}
          disabled={loadingDemo}
          className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-sm font-medium bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 transition-all shadow-xs disabled:opacity-50"
          title="Populate synthetic longitudinal records with deliberately placed clinical inconsistencies for verification testing"
        >
          {loadingDemo ? (
            <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mr-2" />
          ) : demoLoadedMsg ? (
            <Check className="w-4 h-4 mr-1.5 text-emerald-600" />
          ) : (
            <Sparkles className="w-4 h-4 mr-1.5 text-teal-600" />
          )}
          <span>{demoLoadedMsg ? 'Demo Data Loaded!' : 'Load Demo Patient'}</span>
        </button>

        {/* Demo Mode Badge */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span>Local SQLite Mode</span>
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-teal-100 border border-teal-300 text-teal-800 flex items-center justify-center font-bold text-xs">
              {initials}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.full_name || 'Dr. Emily Carter, MD'}
              </p>
              <p className="text-[10px] text-slate-500">
                {user?.specialization || (role === 'patient' ? 'Patient' : 'Attending Physician')}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out of MedicAssist AI"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
