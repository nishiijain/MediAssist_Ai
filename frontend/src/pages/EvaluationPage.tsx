import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Clock,
  Layers,
  ShieldCheck,
  TrendingUp,
  FileCheck2
} from 'lucide-react';
import { api } from '../services/api';
import { EvaluationRun } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

export const EvaluationPage: React.FC = () => {
  const [evalRun, setEvalRun] = useState<EvaluationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  const fetchLatestEvaluation = async () => {
    try {
      setLoading(true);
      const data = await api.getLatestEvaluation();
      setEvalRun(data);
    } catch (err) {
      console.error('Failed to load evaluation run:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestEvaluation();
  }, []);

  const handleRunEvaluation = async () => {
    setIsRunning(true);
    try {
      const result = await api.runEvaluation();
      setEvalRun(result);
    } catch (err: any) {
      alert(`Evaluation error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const chartData = evalRun
    ? [
        {
          metric: 'Precision',
          Baseline: Number((evalRun.baseline_precision * 100).toFixed(1)),
          Proposed: Number((evalRun.proposed_precision * 100).toFixed(1)),
        },
        {
          metric: 'Recall',
          Baseline: Number((evalRun.baseline_recall * 100).toFixed(1)),
          Proposed: Number((evalRun.proposed_recall * 100).toFixed(1)),
        },
        {
          metric: 'F1 Score',
          Baseline: Number((evalRun.baseline_f1 * 100).toFixed(1)),
          Proposed: Number((evalRun.proposed_f1 * 100).toFixed(1)),
        },
        {
          metric: 'Missing Detection',
          Baseline: Number((evalRun.baseline_omission_rate * 100).toFixed(1)), // 0 in baseline
          Proposed: Number((evalRun.missing_field_detection_rate * 100).toFixed(1)),
        },
      ]
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Extraction & Verification Benchmark Module
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Standardized evaluation comparing baseline extraction against the deterministic clinical verification layer.
          </p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={isRunning}
          className="inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              <span>Running Synthetic Benchmark Suite...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-1.5" />
              <span>Run Benchmark Evaluation</span>
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500">Checking benchmark repository...</div>
      ) : !evalRun ? (
        /* Evaluation not run yet state */
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-xs my-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Evaluation Not Run Yet</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Execute the standardized test suite across 8 diverse synthetic clinical cases (including clean reports, scans, missing units, conflicting values, and hallucinated statements) to compare Baseline vs Proposed metrics.
          </p>
          <div className="pt-2">
            <button
              onClick={handleRunEvaluation}
              disabled={isRunning}
              className="inline-flex items-center px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              <Play className="w-4 h-4 mr-2" />
              <span>Execute 8 Benchmark Scenarios</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Run Metadata Banner */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 text-sm">Latest Test Run</span>
              <span className="text-slate-300">•</span>
              <span>{new Date(evalRun.run_date).toLocaleString()}</span>
              <span className="text-slate-300">•</span>
              <span className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-md font-semibold border border-brand-200">
                {evalRun.test_suite_name}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Total Cases: <strong className="text-slate-900">{evalRun.total_cases}</strong></span>
              <span>Execution Time: <strong className="text-slate-900">{evalRun.execution_time_seconds}s</strong></span>
              <span>Issues Flagged: <strong className="text-rose-700">{evalRun.unresolved_issues_count}</strong></span>
            </div>
          </div>

          {/* Comparative Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Precision Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Field-Level Precision
              </span>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-emerald-600">
                    {(evalRun.proposed_precision * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">Proposed Engine</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-500">
                    {(evalRun.baseline_precision * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">Baseline</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                Measures accuracy of extracted findings vs ground truth.
              </div>
            </div>

            {/* F1 Score Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                F1-Score
              </span>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-brand-600">
                    {(evalRun.proposed_f1 * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">Proposed Engine</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-500">
                    {(evalRun.baseline_f1 * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">Baseline</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                Harmonic mean of precision and recall.
              </div>
            </div>

            {/* Unsupported Claim Rate (Hallucinations) */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Unsupported Info Rate
              </span>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-emerald-600">
                    {(evalRun.proposed_unsupported_rate * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">Proposed (Filtered)</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-rose-500">
                    {(evalRun.baseline_unsupported_rate * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">Baseline (Unverified)</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                Lower is better. Catches unsupported extractions.
              </div>
            </div>

            {/* Missing Field Detection Rate */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Missing Field Detection
              </span>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-brand-600">
                    {(evalRun.missing_field_detection_rate * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">Proposed Engine</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-400">0.0%</span>
                  <span className="text-[10px] text-slate-400 block">Baseline (No Checks)</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                Detects omitted units, missing dosages & dates.
              </div>
            </div>
          </div>

          {/* Comparative Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Baseline vs. Proposed Comparative Performance (%)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      color: '#fff',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Baseline" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Proposed" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Scenario Breakdown Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Scenario-Level Benchmark Evaluation Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Scenario</th>
                    <th className="py-2.5 px-3">Fields</th>
                    <th className="py-2.5 px-3">Baseline (TP/FP/FN)</th>
                    <th className="py-2.5 px-3">Proposed (TP/FP/FN)</th>
                    <th className="py-2.5 px-3">Issues Caught by Engine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {evalRun.detailed_results?.map((c: any) => (
                    <tr key={c.case_id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {c.scenario}
                      </td>
                      <td className="py-2.5 px-3">{c.fields_extracted}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {c.baseline_tp} / {c.baseline_fp} / {c.baseline_fn}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-brand-700 font-bold">
                        {c.proposed_tp} / {c.proposed_fp} / {c.proposed_fn}
                      </td>
                      <td className="py-2.5 px-3">
                        {c.issues && c.issues.length > 0 ? (
                          <div className="space-y-1">
                            {c.issues.map((iss: string, idx: number) => (
                              <span
                                key={idx}
                                className="block text-[11px] text-rose-700 font-medium"
                              >
                                • {iss}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-emerald-600 font-medium text-[11px]">
                            Clean verification
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
