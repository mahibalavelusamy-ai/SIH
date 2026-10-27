import React from 'react';
import { useApp, ROLE_DESCRIPTIONS } from '../../context/AppContext';
import {
  LayoutDashboard,
  Building2,
  UploadCloud,
  GitCompare,
  AlertOctagon,
  BarChart3,
  CheckCircle2,
  Sliders,
  Layers,
  History,
  Terminal,
  Settings,
  ChevronRight,
  Info,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
  category: 'RECONCILIATION' | 'REGULATORY' | 'SYSTEM';
}

export const Sidebar: React.FC = () => {
  const { activeNav, setActiveNav, duplicateCandidates, submissions, intakeLimits, records, role } = useApp();

  const openDuplicates = duplicateCandidates.filter((c) => c.status === 'PENDING_REVIEW').length;

  // Calculate programmes exceeding regular intake
  let intakeExcessCount = 0;
  intakeLimits.forEach((limit) => {
    const regularEnrolments = records.filter(
      (r) =>
        r.institutionId === limit.institutionId &&
        r.programmeCode === limit.programmeCode &&
        r.academicYear === limit.academicYear &&
        !r.supernumeraryFlag &&
        r.enrolmentStatus === 'ACTIVE' &&
        r.rowOutcome !== 'REJECTED'
    );
    if (regularEnrolments.length > limit.approvedRegularIntake) {
      intakeExcessCount++;
    }
  });

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      category: 'RECONCILIATION',
    },
    {
      id: 'institution',
      label: 'Institution Portal',
      icon: Building2,
      category: 'RECONCILIATION',
    },
    {
      id: 'submission',
      label: 'Submission Centre',
      icon: UploadCloud,
      category: 'RECONCILIATION',
    },
    {
      id: 'tper',
      label: 'TPER Reconciliation',
      icon: GitCompare,
      badge: openDuplicates > 0 ? openDuplicates : undefined,
      badgeColor: 'bg-blue-900 text-blue-200 border-blue-700',
      category: 'RECONCILIATION',
    },
    {
      id: 'exception-review',
      label: 'Exception Review',
      icon: AlertOctagon,
      badge: openDuplicates > 0 ? openDuplicates : undefined,
      badgeColor: 'bg-amber-900/60 text-amber-200 border-amber-700',
      category: 'REGULATORY',
    },
    {
      id: 'aicte-monitoring',
      label: 'AICTE Monitoring',
      icon: BarChart3,
      badge: intakeExcessCount > 0 ? `${intakeExcessCount} Breaches` : undefined,
      badgeColor: 'bg-red-900/60 text-red-200 border-red-700',
      category: 'REGULATORY',
    },
    {
      id: 'verification',
      label: 'Verification Centre',
      icon: CheckCircle2,
      category: 'REGULATORY',
    },
    {
      id: 'rules',
      label: 'Rules & Configuration',
      icon: Sliders,
      category: 'SYSTEM',
    },
    {
      id: 'architecture',
      label: 'Architecture',
      icon: Layers,
      category: 'SYSTEM',
    },
    {
      id: 'audit-trail',
      label: 'Audit Trail',
      icon: History,
      category: 'SYSTEM',
    },
    {
      id: 'test-bench',
      label: 'Test Bench',
      icon: Terminal,
      category: 'SYSTEM',
    },
    {
      id: 'settings',
      label: 'Settings / Demo Reset',
      icon: Settings,
      category: 'SYSTEM',
    },
  ];

  const categories = [
    { key: 'RECONCILIATION', title: 'Institutional Ingestion' },
    { key: 'REGULATORY', title: 'Regulatory Oversight' },
    { key: 'SYSTEM', title: 'Platform Governance' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 min-h-[calc(100vh-56px)]">
      {/* Current Active Role Context Pill */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/60">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Current Role Context</div>
        <div className="text-xs font-semibold text-white mt-0.5 truncate">
          {ROLE_DESCRIPTIONS[role].title}
        </div>
        <div className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
          {ROLE_DESCRIPTIONS[role].scope}
        </div>
      </div>

      {/* Navigation List grouped by GovTech category */}
      <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
        {categories.map((cat) => {
          const items = navItems.filter((item) => item.category === cat.key);
          return (
            <div key={cat.key}>
              <div className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                {cat.title}
              </div>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveNav(item.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge ? (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                              isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : isActive ? (
                          <ChevronRight className="w-3.5 h-3.5 text-blue-200" />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Subtitle & Version Footer */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/40">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>SPEC: AICTE-TPER</span>
          <span className="text-blue-400">v1.2.0</span>
        </div>
        <p className="mt-1 text-[10px] text-slate-400 leading-normal">
          Institutional Enrolment Reconciliation & Verification Prototype.
        </p>
      </div>
    </aside>
  );
};
