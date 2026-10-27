import React from 'react';
import { useApp, ROLE_DESCRIPTIONS } from '../../context/AppContext';
import { Role } from '../../types';
import { ShieldCheck, RotateCcw, AlertTriangle, UserCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { role, setRole, activeNav, resetDemoData, duplicateCandidates, submissions } = useApp();

  const openDuplicates = duplicateCandidates.filter((c) => c.status === 'PENDING_REVIEW').length;
  const reviewRequiredSubs = submissions.filter((s) => s.status === 'REVIEW_REQUIRED').length;

  const roles: Role[] = [
    'INSTITUTION_SUBMITTER',
    'INSTITUTION_REVIEWER',
    'AICTE_REVIEWER',
    'VERIFICATION_OFFICER',
    'SYSTEM_ADMIN',
    'AUDITOR',
  ];

  const formatNavTitle = (nav: string) => {
    switch (nav) {
      case 'overview': return 'Executive Overview';
      case 'institution': return 'Institution Portal';
      case 'submission': return 'Submission Centre';
      case 'tper': return 'TPER Reconciliation Engine';
      case 'exception-review': return 'Exception Review Workspace';
      case 'aicte-monitoring': return 'AICTE Monitoring & Intake';
      case 'verification': return 'Verification Centre';
      case 'rules': return 'Rules & Engine Configuration';
      case 'architecture': return 'System Architecture & Boundaries';
      case 'audit-trail': return 'Immutable Audit Trail';
      case 'test-bench': return 'Prototype Test Bench';
      case 'settings': return 'Settings & Demo Controls';
      default: return nav;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      {/* Persistent GovTech Synthetic Disclaimer Banner */}
      <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1 text-center text-xs font-mono tracking-wide text-amber-200 flex items-center justify-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>DEMO ENVIRONMENT · SYNTHETIC DATA · MOCK APAAR VERIFIER</span>
        <span className="hidden md:inline text-amber-400/60">|</span>
        <span className="hidden md:inline text-slate-300">SIH Prototype: No live government API connection</span>
      </div>

      {/* Top Bar Contract: Zone 1 (Brand) — Zone 2 (Breadcrumbs) — Zone 3 (Role & Actions) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">IDVERA</span>
              <span className="text-xs font-medium text-blue-400 uppercase tracking-wider hidden sm:inline">TPER</span>
            </div>
            <span className="text-[10px] text-slate-400 hidden lg:inline">Enrolment Reconciliation</span>
          </div>
        </div>

        {/* Zone 2: Contextual Navigation Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap overflow-hidden">
          <span>Portal</span>
          <span className="text-slate-600">/</span>
          <span className="font-medium text-slate-200">{formatNavTitle(activeNav)}</span>
          {openDuplicates > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {openDuplicates} Open Candidates
            </span>
          )}
        </div>

        {/* Zone 3: Demo Role Switcher & Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Role selector dropdown */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-mono text-slate-400 hidden xl:inline">Role:</span>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 px-2.5 py-1.5 pr-7 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer appearance-none"
                  aria-label="Demo Role Switcher"
                >
                  {roles.map((r) => (
                    <option key={r} value={r} className="bg-slate-800 text-white py-1">
                      {ROLE_DESCRIPTIONS[r].title}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
            <span className="text-[9px] text-slate-400 tracking-tight hidden sm:inline">
              Demo role simulation — not production security
            </span>
          </div>

          {/* Demo Reset Shortcut */}
          <button
            onClick={() => {
              if (confirm('Reset synthetic dataset to clean seed state? This restores all 220+ records.')) {
                resetDemoData();
              }
            }}
            title="Reset Synthetic Demo State"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
