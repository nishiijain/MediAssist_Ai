import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  History,
  FileText,
  Sparkles,
  ClipboardCheck,
  BarChart3,
  Settings,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface SidebarProps {
  unresolvedIssuesCount?: number;
  summariesAwaitingCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  unresolvedIssuesCount = 0,
  summariesAwaitingCount = 0,
}) => {
  const navItems = [
    { to: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
    { to: '/patients', label: 'Patients', icon: Users },
    { to: '/history', label: 'Patient History', icon: History },
    { to: '/documents', label: 'Document Processing', icon: FileText },
    {
      to: '/analysis',
      label: 'AI Analysis & Verification',
      icon: Sparkles,
      badge: unresolvedIssuesCount > 0 ? unresolvedIssuesCount : undefined,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    {
      to: '/doctor-review',
      label: 'Doctor Review',
      icon: ClipboardCheck,
      badge: summariesAwaitingCount > 0 ? summariesAwaitingCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    { to: '/evaluation', label: 'Evaluation Module', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-65px)]">
      <div className="py-4">
        <div className="px-6 mb-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Clinical Navigation
          </p>
        </div>

        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Safety & Compliance Disclaimer Box in Sidebar */}
      <div className="p-4 m-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
        <div className="flex items-center space-x-1.5 font-semibold text-slate-800 mb-1">
          <ShieldCheck className="w-4 h-4 text-brand-600" />
          <span>Decision Support</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          MedicAssist AI assists verification and timeline synthesis. It does not replace independent clinician assessment.
        </p>
      </div>
    </aside>
  );
};
