import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Clock, ShieldCheck, Edit3, XCircle } from 'lucide-react';

interface StatusPillProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, size = 'sm' }) => {
  const norm = status.toLowerCase();

  let label = status.replace(/_/g, ' ');
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let icon = <Clock className="w-3.5 h-3.5 mr-1" />;

  switch (norm) {
    case 'source_supported':
      label = 'Source-Supported';
      colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />;
      break;
    case 'needs_clarification':
      label = 'Needs Clarification';
      colorClass = 'bg-amber-50 text-amber-800 border-amber-200';
      icon = <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />;
      break;
    case 'conflicting_information':
      label = 'Conflicting Info';
      colorClass = 'bg-rose-50 text-rose-800 border-rose-200';
      icon = <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />;
      break;
    case 'awaiting_verification':
      label = 'Awaiting Verification';
      colorClass = 'bg-sky-50 text-sky-800 border-sky-200';
      icon = <Clock className="w-3.5 h-3.5 mr-1 text-sky-600" />;
      break;
    case 'doctor_reviewed':
      label = 'Doctor Reviewed';
      colorClass = 'bg-indigo-50 text-indigo-800 border-indigo-200';
      icon = <ShieldCheck className="w-3.5 h-3.5 mr-1 text-indigo-600" />;
      break;
    case 'doctor_corrected':
      label = 'Doctor Corrected';
      colorClass = 'bg-purple-50 text-purple-800 border-purple-200';
      icon = <Edit3 className="w-3.5 h-3.5 mr-1 text-purple-600" />;
      break;
    case 'extraction_failed':
      label = 'Extraction Failed';
      colorClass = 'bg-red-50 text-red-800 border-red-200';
      icon = <XCircle className="w-3.5 h-3.5 mr-1 text-red-600" />;
      break;
  }

  const pxClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${colorClass} ${pxClass}`}
    >
      {icon}
      <span className="capitalize">{label}</span>
    </span>
  );
};
