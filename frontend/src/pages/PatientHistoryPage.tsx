import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  History,
  TrendingUp,
  FileText,
  Calendar,
  AlertCircle,
  Pill,
  Stethoscope,
  Activity,
  CheckCircle2,
  ExternalLink,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { Patient, TimelineEvent, TrendSeries } from '../types';
import { TrendChart } from '../components/timeline/TrendChart';

export const PatientHistoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedPatientId = searchParams.get('patientId');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [trends, setTrends] = useState<TrendSeries[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // 1. Fetch Patients List
  useEffect(() => {
    const init = async () => {
      try {
        const pList = await api.getPatients();
        setPatients(pList);
        if (pList.length > 0) {
          const targetId = selectedPatientId || pList[0].id;
          const found = pList.find((p) => p.id === targetId) || pList[0];
          setCurrentPatient(found);
          if (!selectedPatientId) {
            setSearchParams({ patientId: found.id });
          }
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
      }
    };
    init();
  }, []);

  // 2. Fetch Timeline & Trends for Current Patient
  useEffect(() => {
    if (!currentPatient) return;
    const loadPatientData = async () => {
      setLoading(true);
      try {
        const [tEvents, tTrends] = await Promise.all([
          api.getTimeline(currentPatient.id),
          api.getTrends(currentPatient.id),
        ]);
        setTimelineEvents(tEvents);
        setTrends(tTrends);
      } catch (err) {
        console.error('Error fetching timeline:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPatientData();
  }, [currentPatient]);

  const handlePatientChange = (patientId: string) => {
    setSearchParams({ patientId });
    const found = patients.find((p) => p.id === patientId);
    if (found) setCurrentPatient(found);
  };

  const filteredEvents = timelineEvents.filter((ev) => {
    if (filterType === 'all') return true;
    if (filterType === 'labs') return ev.event_type === 'lab_result';
    if (filterType === 'meds') return ev.event_type === 'medication_start';
    if (filterType === 'docs') return ev.event_type === 'document';
    if (filterType === 'flagged') return ev.is_flagged;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Patient Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Longitudinal Patient History & Trajectory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Chronological multi-encounter timeline grounded in verifiable source documents.
          </p>
        </div>

        {/* Patient Picker */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-600">Select Patient:</label>
          <select
            value={currentPatient?.id || ''}
            onChange={(e) => handlePatientChange(e.target.value)}
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

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500">Reconstructing chronological history...</div>
      ) : !currentPatient ? (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-xl">
          <p className="text-sm text-slate-500">No patient selected. Please load a demo patient first.</p>
        </div>
      ) : (
        <>
          {/* Patient Header Banner */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center font-bold text-lg">
                {currentPatient.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-slate-900">{currentPatient.name}</h2>
                  {currentPatient.is_demo && (
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                      Synthetic Record
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  MRN: <span className="font-mono text-slate-700 font-semibold">{currentPatient.mrn}</span> • DOB: {currentPatient.date_of_birth || 'Not recorded'} • Gender: {currentPatient.gender || 'Unknown'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate(`/documents?patientId=${currentPatient.id}`)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Attached Documents ({timelineEvents.filter(e => e.event_type === 'document').length})
              </button>
              <button
                onClick={() => navigate(`/doctor-review?patientId=${currentPatient.id}`)}
                className="px-3.5 py-1.5 text-xs font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-xs flex items-center"
              >
                Review Clinical Summary
              </button>
            </div>
          </div>

          {/* Section 1: Historical Recharts Trend Component */}
          <div>
            <TrendChart seriesList={trends} />
          </div>

          {/* Section 2: Chronological Timeline Events */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-semibold text-slate-800">
                  Chronological Medical Events
                </h3>
                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 font-semibold rounded-full">
                  {filteredEvents.length} events
                </span>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center space-x-1.5 text-xs">
                <span className="text-slate-400 mr-1 flex items-center">
                  <Filter className="w-3.5 h-3.5 mr-1" /> Filter:
                </span>
                {['all', 'labs', 'meds', 'docs', 'flagged'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-2.5 py-1 rounded-md font-medium capitalize transition-all ${
                      filterType === type
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Sequence */}
            {filteredEvents.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No timeline events matched the filter.</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {filteredEvents.map((ev) => {
                  let badgeIcon = <Activity className="w-3.5 h-3.5 text-brand-600" />;
                  let badgeBg = 'bg-brand-50 border-brand-200';

                  if (ev.event_type === 'document') {
                    badgeIcon = <FileText className="w-3.5 h-3.5 text-slate-600" />;
                    badgeBg = 'bg-slate-100 border-slate-300';
                  } else if (ev.event_type === 'medication_start') {
                    badgeIcon = <Pill className="w-3.5 h-3.5 text-emerald-600" />;
                    badgeBg = 'bg-emerald-50 border-emerald-200';
                  } else if (ev.event_type === 'consultation') {
                    badgeIcon = <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />;
                    badgeBg = 'bg-indigo-50 border-indigo-200';
                  }

                  if (ev.is_flagged) {
                    badgeIcon = <AlertCircle className="w-3.5 h-3.5 text-rose-600" />;
                    badgeBg = 'bg-rose-50 border-rose-200 animate-pulse';
                  }

                  return (
                    <div key={ev.id} className="relative group">
                      {/* Timeline Dot Icon */}
                      <div
                        className={`absolute -left-[30px] top-1 w-6 h-6 rounded-full border flex items-center justify-center bg-white shadow-xs ${badgeBg}`}
                      >
                        {badgeIcon}
                      </div>

                      <div className={`p-4 rounded-xl border transition-all ${
                        ev.is_flagged
                          ? 'border-rose-200 bg-rose-50/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                              {ev.event_date}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">{ev.title}</h4>
                          </div>

                          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                            {ev.event_type.replace('_', ' ')}
                          </span>
                        </div>

                        {ev.description && (
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{ev.description}</p>
                        )}

                        {/* Clinical Warning Flag */}
                        {ev.is_flagged && ev.clinical_flag_reason && (
                          <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold">Preliminary Clinical Attention Flag:</span>{' '}
                              <span>{ev.clinical_flag_reason}</span>
                            </div>
                          </div>
                        )}

                        {/* Source Evidence Snippet */}
                        {ev.source_snippet && (
                          <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono bg-slate-50/70 p-2 rounded-md">
                            <span className="font-semibold text-slate-600 font-sans block text-[10px] uppercase tracking-wider mb-0.5">
                              Supporting Document Evidence:
                            </span>
                            "{ev.source_snippet}"
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
