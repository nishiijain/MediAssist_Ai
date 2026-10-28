import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  AlertTriangle,
  ClipboardCheck,
  Activity,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLoadDemo = async () => {
    setLoadingDemo(true);
    try {
      await api.loadDemoPatient();
      await fetchStats();
    } catch (err: any) {
      alert(`Error loading demo: ${err.message}`);
    } finally {
      setLoadingDemo(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Aggregating Clinical System Records...</p>
        </div>
      </div>
    );
  }

  const isEmpty = !stats || stats.total_patients === 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Clinical Overview Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time verified patient histories, document processing pipeline, and verification review queue.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleLoadDemo}
            disabled={loadingDemo}
            className="inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg shadow-xs transition-all disabled:opacity-50"
          >
            {loadingDemo ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            <span>Load Demo Patient & Documents</span>
          </button>
        </div>
      </div>

      {isEmpty ? (
        /* Empty State */
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-xs my-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center mx-auto">
            <Activity className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">No Patient Records in Local Database</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Get started immediately by clicking below to populate a full synthetic patient history complete with longitudinal lab reports, prescription records, and deliberately placed clinical inconsistencies.
          </p>
          <div className="pt-2">
            <button
              onClick={handleLoadDemo}
              disabled={loadingDemo}
              className="inline-flex items-center px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span>Initialize Fictional Patient Demo</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Real Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Patients */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Registered Patients</span>
                <div className="p-2 bg-blue-50 text-brand-600 rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-slate-900">{stats?.total_patients}</span>
                <span className="text-xs text-slate-500">records</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Active clinical database profiles</p>
            </div>

            {/* Documents Processed */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Documents Processed</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-slate-900">{stats?.total_documents}</span>
                <span className="text-xs text-slate-500">PDFs / Images / Notes</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Extracted with source references</p>
            </div>

            {/* Summaries Awaiting Review */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Awaiting Doctor Review</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-slate-900">{stats?.summaries_awaiting_review}</span>
                <span className="text-xs text-slate-500">drafts</span>
              </div>
              <p className="text-xs text-amber-600 font-medium mt-2">Pending physician review & sign-off</p>
            </div>

            {/* Verification Issues */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Verification Alerts</span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-slate-900">{stats?.unresolved_issues_count}</span>
                <span className="text-xs text-rose-600 font-medium">unresolved issues</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Source mismatches & contradictions</p>
            </div>
          </div>

          {/* Middle Row: Document Distribution Chart & Review Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart: Documents by Clinical Type */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs lg:col-span-1">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Document Distribution</h3>
                  <p className="text-xs text-slate-400">Processed file classification</p>
                </div>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.trend_stats || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                    <XAxis
                      dataKey="type"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Patient Review Queue */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs lg:col-span-2">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Patient Review Queue</h3>
                  <p className="text-xs text-slate-400">Active records requiring physician verification</p>
                </div>
                <button
                  onClick={() => navigate('/patients')}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center"
                >
                  View All Patients <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {stats?.recent_activity?.map((p: any) => (
                  <div
                    key={p.patient_id}
                    className="py-3 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-lg transition-colors cursor-pointer"
                    onClick={() => navigate(`/doctor-review?patientId=${p.patient_id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                        {p.patient_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-semibold text-slate-900">{p.patient_name}</p>
                          {p.is_demo && (
                            <span className="text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-1.5 rounded">
                              Demo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          MRN: <span className="font-mono text-slate-600">{p.mrn}</span> • {p.document_count} doc(s)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {p.unresolved_issues > 0 ? (
                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          <ShieldAlert className="w-3 h-3 mr-1 text-rose-600" />
                          {p.unresolved_issues} alert{p.unresolved_issues > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          Verified
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
