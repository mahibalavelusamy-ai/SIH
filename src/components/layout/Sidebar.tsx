import React, { useState } from 'react';
import { useApp, ROLE_DESCRIPTIONS } from '../../context/AppContext';
import {
  LayoutDashboard,
  Building2,
  UploadCloud,
  Fingerprint,
  GitCompare,
  GitFork,
  BarChart3,
  Award,
  CheckCircle2,
  Dna,
  ShieldCheck,
  FileSpreadsheet,
  Sliders,
  ChevronRight,
  Shield,
  ExternalLink,
  ChevronLeft,
  Menu,
  AlertTriangle,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
  category: 'OPERATIONS' | 'INTELLIGENCE' | 'GOVERNANCE' | 'SYSTEM';
}

export const Sidebar: React.FC = () => {
  const {
    activeNav,
    setActiveNav,
    duplicateCandidates,
    intakeLimits,
    records,
    role,
    setShowEntryPortal,
  } = useApp();

  const [collapsed, setCollapsed] = useState<boolean>(false);

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
    // OPERATIONS
    {
      id: 'overview',
      label: 'Executive Overview',
      icon: LayoutDashboard,
      category: 'OPERATIONS',
    },
    {
      id: 'institutions',
      label: 'Campuses Dossier',
      icon: Building2,
      category: 'OPERATIONS',
    },
    {
      id: 'submission',
      label: 'Submission Ingestion',
      icon: UploadCloud,
      category: 'OPERATIONS',
    },

    // INTELLIGENCE & RECONCILIATION
    {
      id: 'identity-intelligence',
      label: 'Identity Intelligence',
      icon: Fingerprint,
      category: 'INTELLIGENCE',
    },
    {
      id: 'tper',
      label: 'TPER Reconciliation',
      icon: GitCompare,
      badge: openDuplicates > 0 ? openDuplicates : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      category: 'INTELLIGENCE',
    },
    {
      id: 'mobility-graph',
      label: 'Mobility Graph',
      icon: GitFork,
      category: 'INTELLIGENCE',
    },

    // GOVERNANCE & STATUTORY OVERSIGHT
    {
      id: 'seat-ledger',
      label: 'Statutory Seat Ledger',
      icon: BarChart3,
      badge: intakeExcessCount > 0 ? `${intakeExcessCount} Breaches` : undefined,
      badgeColor: 'bg-rose-950/80 text-rose-300 border border-rose-700/60',
      category: 'GOVERNANCE',
    },
    {
      id: 'trust-engine',
      label: 'Academic Trust Engine',
      icon: Award,
      category: 'GOVERNANCE',
    },
    {
      id: 'verification',
      label: 'Verification Terminal',
      icon: CheckCircle2,
      category: 'GOVERNANCE',
    },
    {
      id: 'record-dna',
      label: 'Record DNA Lineage',
      icon: Dna,
      category: 'GOVERNANCE',
    },

    // SYSTEM & AUDIT
    {
      id: 'cybershield',
      label: 'CyberShield Posture',
      icon: ShieldCheck,
      category: 'SYSTEM',
    },
    {
      id: 'reports',
      label: 'Statutory Reports',
      icon: FileSpreadsheet,
      category: 'SYSTEM',
    },
    {
      id: 'administration',
      label: 'Administration & Rules',
      icon: Sliders,
      category: 'SYSTEM',
    },
  ];

  const categories = [
    { key: 'OPERATIONS', title: 'Core Operations' },
    { key: 'INTELLIGENCE', title: 'Reconciliation' },
    { key: 'GOVERNANCE', title: 'Statutory Oversight' },
    { key: 'SYSTEM', title: 'Security & Audit' },
  ];

  return (
    <aside
      className={`bg-[#101C32] text-slate-300 flex flex-col shrink-0 border-r border-slate-700/60 transition-all duration-200 select-none min-h-[calc(100vh-48px)] ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Sidebar Header with Context & Collapse Toggle */}
      <div className="p-2.5 border-b border-slate-700/60 bg-[#0B1324] flex items-center justify-between">
        {!collapsed && (
          <div className="min-w-0 pr-2">
            <div className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-semibold truncate">
              {ROLE_DESCRIPTIONS[role].title}
            </div>
            <div className="text-[10px] text-blue-400 font-mono truncate mt-0.5">
              Verified Session
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mx-auto cursor-pointer"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List grouped by GovTech category */}
      <nav className="flex-1 px-2 py-3 space-y-3.5 overflow-y-auto">
        {categories.map((cat) => {
          const items = navItems.filter((item) => item.category === cat.key);
          return (
            <div key={cat.key}>
              {!collapsed && (
                <div className="px-2 pb-1 text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  {cat.title}
                </div>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    activeNav === item.id ||
                    (item.id === 'institutions' && activeNav === 'institution') ||
                    (item.id === 'seat-ledger' && activeNav === 'aicte-monitoring') ||
                    (item.id === 'tper' && activeNav === 'exception-review') ||
                    (item.id === 'administration' && ['rules', 'architecture', 'audit-trail', 'test-bench', 'settings'].includes(activeNav));

                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveNav(item.id)}
                        className={`w-full flex items-center ${
                          collapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                        } rounded-lg text-xs font-medium transition-colors cursor-pointer group ${
                          isActive
                            ? 'bg-[#315EAA]/25 text-white font-semibold border-l-2 border-[#315EAA] shadow-2xs'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                        }`}
                        title={collapsed ? item.label : undefined}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#315EAA]' : 'text-slate-400 group-hover:text-slate-200'}`} />
                          {!collapsed && <span className="truncate tracking-tight">{item.label}</span>}
                        </div>

                        {!collapsed && item.badge && (
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                              isActive ? 'bg-[#315EAA]/50 text-blue-100 border-[#315EAA]' : item.badgeColor
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {collapsed && item.badge && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-1 right-1" />
                        )}
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
      {!collapsed && (
        <div className="p-2.5 border-t border-slate-700/60 text-[10px] text-slate-400 bg-[#0B1324] font-mono flex items-center justify-between">
          <span className="text-slate-400">AICTE-TPER</span>
          <span className="text-blue-400 font-semibold">v1.2.0</span>
        </div>
      )}
    </aside>
  );
};
