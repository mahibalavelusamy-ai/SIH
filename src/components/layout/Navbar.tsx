import React, { useState } from 'react';
import { useApp, ROLE_DESCRIPTIONS } from '../../context/AppContext';
import { Role } from '../../types';
import {
  RotateCcw,
  AlertTriangle,
  UserCheck,
  Shield,
  ChevronRight,
  Search,
  Bell,
  Command,
} from 'lucide-react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { CommandPalette } from './CommandPalette';
import { NotificationCenter } from './NotificationCenter';

export const Navbar: React.FC = () => {
  const {
    role,
    setRole,
    activeNav,
    setActiveNav,
    resetDemoData,
    duplicateCandidates,
    intakeLimits,
    records,
    setShowEntryPortal,
  } = useApp();

  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState<boolean>(false);

  const openDuplicates = duplicateCandidates.filter((c) => c.status === 'PENDING_REVIEW').length;

  // Calculate quota breaches
  let breachCount = 0;
  intakeLimits.forEach((l) => {
    const regularEnrolments = records.filter(
      (r) =>
        r.institutionId === l.institutionId &&
        r.programmeCode === l.programmeCode &&
        r.academicYear === l.academicYear &&
        !r.supernumeraryFlag &&
        r.enrolmentStatus === 'ACTIVE' &&
        r.rowOutcome !== 'REJECTED'
    );
    if (regularEnrolments.length > l.approvedRegularIntake) breachCount++;
  });

  const totalActionCount = openDuplicates + breachCount;

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
      case 'institutions':
      case 'institution': return 'Institution Management';
      case 'submission': return 'Submission Centre';
      case 'identity-intelligence': return 'Identity Intelligence';
      case 'tper': return 'TPER Reconciliation Engine';
      case 'exception-review': return 'Exception Review & Adjudication';
      case 'mobility-graph': return 'Academic Mobility Graph';
      case 'seat-ledger':
      case 'aicte-monitoring': return 'Programme-wise Seat Ledger';
      case 'trust-engine': return 'Academic Trust Engine';
      case 'verification': return 'Verification Centre';
      case 'record-dna': return 'Record DNA';
      case 'cybershield': return 'CyberShield';
      case 'reports': return 'Regulatory Reports';
      case 'administration':
      case 'rules':
      case 'architecture':
      case 'audit-trail':
      case 'test-bench':
      case 'settings': return 'Administration & Governance';
      default: return nav;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#101C32] border-b border-slate-700/60 text-white shadow-xs">
        {/* Persistent GovTech Synthetic Disclaimer Banner */}
        <div className="bg-[#D99032]/15 border-b border-[#D99032]/30 px-4 py-1 text-center text-[11px] font-mono tracking-wider text-amber-200/90 flex items-center justify-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-[#D99032] shrink-0" />
          <span>PROTOTYPE ENVIRONMENT · SYNTHETIC DEMONSTRATION DATA · MOCK VERIFIER</span>
          <span className="hidden md:inline text-amber-400/40">|</span>
          <span className="hidden md:inline text-slate-300">SIH26263: No live government identity API connection</span>
        </div>

        {/* Top Bar Contract */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark & Navigable Breadcrumb */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className="flex items-center gap-2.5 cursor-pointer group"
              onClick={() => setActiveNav('overview')}
              title="IDVERA Dashboard Home"
            >
              <img
                src="/logo.png"
                alt="IDVERA"
                className="h-7 w-auto object-contain rounded transition-transform group-hover:scale-[1.02]"
              />
              <div className="hidden sm:flex flex-col border-l border-slate-700/80 pl-2.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold leading-none">
                  IDVERA
                </span>
                <span className="text-[9px] text-slate-400 font-mono leading-tight mt-0.5">
                  AICTE APH Gateway
                </span>
              </div>
            </div>

            {/* Contextual Navigation Breadcrumb */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap overflow-hidden pl-2">
              <span
                onClick={() => setActiveNav('overview')}
                className="text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                Portal
              </span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="font-semibold text-slate-200 tracking-tight">{formatNavTitle(activeNav)}</span>
            </div>
          </div>

          {/* Zone 2: Universal Search / Command Palette Trigger (Cmd+K) */}
          <div className="flex-1 max-w-sm hidden sm:block">
            <button
              onClick={() => setShowCommandPalette(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 bg-[#0B1324] hover:bg-slate-900 border border-slate-700/70 hover:border-slate-600 rounded-lg text-xs text-slate-400 transition-colors cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                <span className="font-sans">Search students, campuses, commands...</span>
              </div>
              <div className="flex items-center gap-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                <Command className="w-2.5 h-2.5" />
                <span>K</span>
              </div>
            </button>
          </div>

          {/* Zone 3: Action Controls, Notifications, Role Switcher */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Action Triage Bell */}
            <button
              onClick={() => setShowNotificationCenter(true)}
              className="relative p-1.5 rounded-lg bg-[#0B1324] hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Action-Required Regulatory Triage Desk"
            >
              <Bell className="w-4 h-4" />
              {totalActionCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {totalActionCount}
                </span>
              )}
            </button>

            {/* Simulated Role selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-mono text-slate-400 hidden lg:inline">
                Role:
              </span>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="bg-[#0B1324] hover:bg-slate-800 text-slate-200 text-xs font-mono font-medium rounded-lg border border-slate-700/80 px-2.5 py-1 pr-6 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer appearance-none shadow-2xs"
                  aria-label="Simulated Role Switcher"
                >
                  {roles.map((r) => (
                    <option key={r} value={r} className="bg-[#101C32] text-white">
                      {ROLE_DESCRIPTIONS[r].title}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
                  <UserCheck className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Reset State Action */}
            <button
              onClick={() => setShowResetConfirm(true)}
              title="Reset Demonstration Seed State"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-[#0B1324] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Public Portal Switcher */}
            <button
              onClick={() => setShowEntryPortal(true)}
              title="Return to Institutional Entry Portal"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-blue-950/70 hover:bg-blue-900 text-blue-300 hover:text-white border border-blue-700/60 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
            >
              <Shield className="w-3 h-3 text-blue-400" />
              <span className="hidden sm:inline">Sign-in Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />

      {/* Action-Required Notification Center Drawer */}
      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
      />

      {/* Confirmation Dialog for Demo Reset */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={resetDemoData}
        title="Reset Synthetic Demonstration State?"
        description="This will restore all 220+ synthetic student records, 6 submission batches, 12 statutory rules, and audit logs to their clean seed state. Any custom mock queries or batch filings will be reinitialized."
        confirmLabel="Reset State"
        cancelLabel="Cancel"
        tone="warning"
      />
    </>
  );
};
