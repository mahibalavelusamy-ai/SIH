import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import {
  GitFork,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  FileCheck,
  GraduationCap,
  ArrowRightLeft,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

interface MobilityEvent {
  id: string;
  type: 'ADMISSION' | 'TRANSFER_NOC' | 'WITHDRAWAL' | 'PROGRAMME_CHANGE' | 'GRADUATION';
  institutionId: string;
  institutionName: string;
  programmeCode: string;
  date: string;
  details: string;
  status: 'COMPLIANT' | 'WARNING' | 'BREACH';
  statutoryRef?: string;
}

export const MobilityGraphView: React.FC = () => {
  const { duplicateCandidates, institutions, records, setActiveNav } = useApp();

  const [selectedStudentRef, setSelectedStudentRef] = useState<string>('2026-APEX-CS-014');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sample student profiles with transfer and mobility trajectories
  const mobilityProfiles: Record<string, { studentName: string; apaarMasked: string; category: string; events: MobilityEvent[]; verdict: string }> = {
    '2026-APEX-CS-014': {
      studentName: 'Aarav Sharma',
      apaarMasked: '9102-****-1001',
      category: 'OPEN',
      verdict: 'Legitimate Sequential Transfer: End-date stamped at NST-001 prior to APEX admission. Compliant under AICTE 2023 §7.',
      events: [
        {
          id: 'EV-01',
          type: 'ADMISSION',
          institutionId: 'INST-001',
          institutionName: 'Northstar Institute of Technology',
          programmeCode: 'BTECH-CSE',
          date: '2026-07-15',
          details: 'Initial regular admission under OPEN merit quota.',
          status: 'COMPLIANT',
          statutoryRef: 'Sanctioned Regular Intake',
        },
        {
          id: 'EV-02',
          type: 'TRANSFER_NOC',
          institutionId: 'INST-001',
          institutionName: 'Northstar Institute of Technology',
          programmeCode: 'BTECH-CSE',
          date: '2026-07-25',
          details: 'Institutional No-Objection Certificate issued: NOC-NST-2026-089.',
          status: 'COMPLIANT',
          statutoryRef: 'AICTE Reg. 2023 §7.2',
        },
        {
          id: 'EV-03',
          type: 'WITHDRAWAL',
          institutionId: 'INST-001',
          institutionName: 'Northstar Institute of Technology',
          programmeCode: 'BTECH-CSE',
          date: '2026-07-28',
          details: 'De-enrolment stamped with formal release date: 2026-07-28.',
          status: 'COMPLIANT',
          statutoryRef: 'Seat Vacated for Counter-Allotment',
        },
        {
          id: 'EV-04',
          type: 'ADMISSION',
          institutionId: 'INST-002',
          institutionName: 'Apex College of Engineering',
          programmeCode: 'BTECH-CSE',
          date: '2026-08-02',
          details: 'Admitted on valid institutional transfer window. T_admission >= T_release verified.',
          status: 'COMPLIANT',
          statutoryRef: 'Transfer Window Cleared',
        },
        {
          id: 'EV-05',
          type: 'GRADUATION',
          institutionId: 'INST-002',
          institutionName: 'Apex College of Engineering',
          programmeCode: 'BTECH-CSE',
          date: '2030-06-15 (Projected)',
          details: 'Scheduled degree conferral upon standard credit accumulation.',
          status: 'COMPLIANT',
        },
      ],
    },
    '2026-ZEN-EC-021': {
      studentName: 'Vikram Mehta',
      apaarMasked: '9102-****-3004',
      category: 'OPEN',
      verdict: 'Concurrent Dual Enrolment Breach: Active admission reported at both Zenith and Greenfield with overlapping temporal intervals.',
      events: [
        {
          id: 'EV-10',
          type: 'ADMISSION',
          institutionId: 'INST-003',
          institutionName: 'Zenith Polytechnic Institute',
          programmeCode: 'DIPLOMA-ECE',
          date: '2026-07-20',
          details: 'Reported as ACTIVE with null enrolmentEndDate.',
          status: 'COMPLIANT',
        },
        {
          id: 'EV-11',
          type: 'ADMISSION',
          institutionId: 'INST-004',
          institutionName: 'Greenfield Institute of Engineering',
          programmeCode: 'BTECH-ECE',
          date: '2026-07-29',
          details: 'Concurrently reported as ACTIVE without prior withdrawal record. Rule V-05 Flagged.',
          status: 'BREACH',
          statutoryRef: 'Dual Enrolment Violation (Rule V-05)',
        },
      ],
    },
    '2026-HOR-IT-008': {
      studentName: 'Sneha Patel',
      apaarMasked: '9102-****-2003',
      category: 'TFW',
      verdict: 'Programme Change Within Campus: Upgraded from IT to AI&DS under Tuition Fee Waiver quota. No cross-institutional collision.',
      events: [
        {
          id: 'EV-20',
          type: 'ADMISSION',
          institutionId: 'INST-005',
          institutionName: 'Horizon Institute of Technology',
          programmeCode: 'BTECH-IT',
          date: '2026-07-10',
          details: 'Initial counselling admission under Tuition Fee Waiver quota.',
          status: 'COMPLIANT',
        },
        {
          id: 'EV-21',
          type: 'PROGRAMME_CHANGE',
          institutionId: 'INST-005',
          institutionName: 'Horizon Institute of Technology',
          programmeCode: 'BTECH-AIDS',
          date: '2026-08-01',
          details: 'Statutory intra-college branch re-allocation upon spot round seat vacancy.',
          status: 'COMPLIANT',
          statutoryRef: 'Supernumerary Quota Reconciliation',
        },
      ],
    },
  };

  const activeProfile = mobilityProfiles[selectedStudentRef] || mobilityProfiles['2026-APEX-CS-014'];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'IDVERA' },
          { label: 'Intelligence' },
          { label: 'Academic Mobility Graph' },
        ]}
        title="Academic Mobility Graph & Trajectory Timeline"
        subtitle="Chronological transition visualization tracking admissions, verified institutional transfers, branch changes, and graduation milestones."
        badge={
          <span className="font-mono text-[11px] text-[#168C83] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-medium flex items-center gap-1.5">
            <GitFork className="w-3 h-3 text-[#168C83]" />
            TRANSFER-AWARE ENGINE
          </span>
        }
        actions={
          <button
            onClick={() => setActiveNav('tper')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101C32] hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors shadow-xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[#315EAA]" />
            Adjudicate in TPER
          </button>
        }
      />

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Tracked Trajectories"
          value={records.length}
          subValue="Active student histories"
          tone="indigo"
        />
        <MetricCard
          label="Sequential Transfers"
          value={duplicateCandidates.filter((c) => c.status === 'LEGITIMATE_TRANSFER').length + 1}
          subValue="Verified legitimate transitions"
          tone="teal"
        />
        <MetricCard
          label="Concurrent Collisions"
          value={duplicateCandidates.filter((c) => c.status === 'PENDING_REVIEW').length}
          subValue="Overlapping active intervals"
          tone="rose"
        />
        <MetricCard
          label="Intra-Campus Changes"
          value="4"
          subValue="Approved quota re-allocations"
          tone="amber"
        />
      </div>

      {/* Student Selector */}
      <FilterBar>
        <div className="flex flex-1 items-center gap-3">
          <span className="text-xs text-slate-500 font-mono uppercase">Select Trajectory:</span>
          <select
            value={selectedStudentRef}
            onChange={(e) => setSelectedStudentRef(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded px-3 py-1 font-medium text-slate-800 shadow-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="2026-APEX-CS-014">Aarav Sharma (2026-APEX-CS-014) — Legitimate Transfer</option>
            <option value="2026-ZEN-EC-021">Vikram Mehta (2026-ZEN-EC-021) — Unresolved Dual Admission</option>
            <option value="2026-HOR-IT-008">Sneha Patel (2026-HOR-IT-008) — Intra-Campus Programme Upgrade</option>
          </select>
        </div>
      </FilterBar>

      {/* Trajectory Profile Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{activeProfile.studentName}</h2>
              <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                {selectedStudentRef}
              </span>
              <span className="font-mono text-xs bg-blue-50 text-[#315EAA] px-2 py-0.5 rounded border border-blue-200">
                {activeProfile.apaarMasked}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Statutory Quota: <strong>{activeProfile.category}</strong> · Academic Cycle: <strong>AY 2026-27</strong>
            </p>
          </div>

          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs max-w-md">
            <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
              Statutory Reconciliation Assessment
            </span>
            <span className="text-slate-800 font-sans mt-0.5 block leading-relaxed">
              {activeProfile.verdict}
            </span>
          </div>
        </div>

        {/* Chronological Timeline */}
        <div className="pt-2">
          <h3 className="text-xs font-semibold text-slate-900 font-mono uppercase tracking-wider mb-4">
            Lifecycle Academic Event Stream
          </h3>

          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activeProfile.events.map((ev, idx) => (
              <div key={ev.id} className="relative">
                {/* Node dot */}
                <div
                  className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 bg-white ${
                    ev.status === 'BREACH'
                      ? 'border-[#C94C4C] bg-rose-50'
                      : ev.type === 'GRADUATION'
                      ? 'border-[#315EAA] bg-blue-50'
                      : 'border-[#168C83] bg-teal-50'
                  }`}
                />

                <div className="bg-slate-50/70 hover:bg-slate-50 p-3.5 rounded-lg border border-slate-200 transition-colors space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{ev.type.replace('_', ' ')}</span>
                      <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {ev.programmeCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{ev.date}</span>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ev.institutionName}</span>
                  </div>

                  <p className="text-xs text-slate-600 font-sans mt-1">{ev.details}</p>

                  {ev.statutoryRef && (
                    <div className="pt-1 text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <Info className="w-3 h-3 text-blue-500" />
                      <span>Statutory Reference: <strong>{ev.statutoryRef}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

