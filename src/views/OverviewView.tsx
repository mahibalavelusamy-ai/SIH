import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  TrendingUp,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  ArrowRight,
  GitCompare,
  AlertOctagon,
  Sparkles,
  Info,
  History,
  Shield,
  ShieldCheck,
  Clock,
  Dna,
  Lock,
  Search,
  Layers,
  Award,
  ChevronRight,
  Scale,
  Activity,
  FileText,
  UploadCloud,
  FileWarning,
  BarChart3,
} from 'lucide-react';
import { DetailDrawer } from '../components/ui/DetailDrawer';

export const OverviewView: React.FC = () => {
  const {
    institutions,
    programmes,
    records,
    submissions,
    duplicateCandidates,
    auditEvents,
    intakeLimits,
    selectedAcademicYear,
    setSelectedAcademicYear,
    setActiveNav,
  } = useApp();

  // Local filter states
  const [filterInstitution, setFilterInstitution] = useState<string>('ALL');
  const [filterProgramme, setFilterProgramme] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [quotaBreachOnly, setQuotaBreachOnly] = useState<boolean>(false);
  const [activeInnovationTab, setActiveInnovationTab] = useState<'TPER' | 'SEAT_LEDGER' | 'TRUST' | 'RECORD_DNA' | 'CYBERSHIELD'>('TPER');

  // Selected item for slide-over drawer inspection
  const [inspectingProgrammeId, setInspectingProgrammeId] = useState<string | null>(null);

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchYear = !selectedAcademicYear || r.academicYear === selectedAcademicYear;
      const matchInst = filterInstitution === 'ALL' || r.institutionId === filterInstitution;
      const matchProg = filterProgramme === 'ALL' || r.programmeCode === filterProgramme;
      const matchStat = filterStatus === 'ALL' || r.rowOutcome === filterStatus;
      return matchYear && matchInst && matchProg && matchStat;
    });
  }, [records, selectedAcademicYear, filterInstitution, filterProgramme, filterStatus]);

  // Derived KPI metrics
  const totalRows = filteredRecords.length;
  const acceptedRows = filteredRecords.filter((r) => r.rowOutcome === 'ACCEPTED').length;
  const flaggedRows = filteredRecords.filter((r) => r.rowOutcome === 'FLAGGED').length;
  const rejectedRows = filteredRecords.filter((r) => r.rowOutcome === 'REJECTED').length;

  const relevantInstitutions = filterInstitution === 'ALL'
    ? institutions
    : institutions.filter((i) => i.id === filterInstitution);

  const relevantSubmissions = submissions.filter((s) => {
    const matchYear = !selectedAcademicYear || s.academicYear === selectedAcademicYear;
    const matchInst = filterInstitution === 'ALL' || s.institutionId === filterInstitution;
    return matchYear && matchInst;
  });

  const openDuplicates = duplicateCandidates.filter((c) => c.status === 'PENDING_REVIEW').length;
  const resolvedTransfers = duplicateCandidates.filter((c) => c.status === 'LEGITIMATE_TRANSFER').length;
  const confirmedDuplicates = duplicateCandidates.filter((c) => c.status === 'CONFIRMED_DUPLICATE').length;

  // Calculate intake discrepancies on active regular enrolments vs supernumerary quotas
  const intakeComparison = useMemo(() => {
    return intakeLimits
      .filter((limit) => {
        const matchYear = !selectedAcademicYear || limit.academicYear === selectedAcademicYear;
        const matchInst = filterInstitution === 'ALL' || limit.institutionId === filterInstitution;
        const matchProg = filterProgramme === 'ALL' || limit.programmeCode === filterProgramme;
        return matchYear && matchInst && matchProg;
      })
      .map((limit) => {
        const inst = institutions.find((i) => i.id === limit.institutionId);
        const prog = programmes.find((p) => p.code === limit.programmeCode);

        // Count non-rejected active regular enrolments
        const regularEnrolments = records.filter(
          (r) =>
            r.institutionId === limit.institutionId &&
            r.programmeCode === limit.programmeCode &&
            r.academicYear === limit.academicYear &&
            !r.supernumeraryFlag &&
            r.enrolmentStatus === 'ACTIVE' &&
            r.rowOutcome !== 'REJECTED'
        );

        // Count supernumerary enrolments (TFW, EWS, PMSSS, etc.)
        const superEnrolments = records.filter(
          (r) =>
            r.institutionId === limit.institutionId &&
            r.programmeCode === limit.programmeCode &&
            r.academicYear === limit.academicYear &&
            r.supernumeraryFlag &&
            r.enrolmentStatus === 'ACTIVE' &&
            r.rowOutcome !== 'REJECTED'
        );

        const regularCount = regularEnrolments.length;
        const variance = regularCount - limit.approvedRegularIntake;
        const isExcess = variance > 0;

        const totalSuperCap = limit.supernumeraryLimits
          ? Object.values(limit.supernumeraryLimits).reduce((a, b) => a + b, 0)
          : Math.round(limit.approvedRegularIntake * 0.15);
        const approvedSuperCap = totalSuperCap || Math.round(limit.approvedRegularIntake * 0.15);

        return {
          limitId: limit.id,
          institutionId: limit.institutionId,
          institutionCode: inst?.code || limit.institutionId,
          institutionName: inst?.name || limit.institutionId,
          programmeCode: limit.programmeCode,
          programmeName: prog?.name || limit.programmeCode,
          approvedRegularIntake: limit.approvedRegularIntake,
          countedRegular: regularCount,
          approvedSuperCap,
          supernumeraryCount: superEnrolments.length,
          totalEnrolment: regularCount + superEnrolments.length,
          variance,
          isExcess,
        };
      });
  }, [intakeLimits, records, institutions, programmes, selectedAcademicYear, filterInstitution, filterProgramme]);

  const excessProgrammeCount = intakeComparison.filter((p) => p.isExcess).length;

  const filteredIntakeList = useMemo(() => {
    if (quotaBreachOnly) {
      return intakeComparison.filter((p) => p.isExcess);
    }
    return intakeComparison;
  }, [intakeComparison, quotaBreachOnly]);

  const totalApprovedRegular = intakeComparison.reduce((acc, curr) => acc + curr.approvedRegularIntake, 0);
  const totalCountedRegular = intakeComparison.reduce((acc, curr) => acc + curr.countedRegular, 0);

  // Supernumerary Quota Aggregates
  const supernumeraryStats = useMemo(() => {
    const tfwEnrolled = records.filter((r) => r.supernumeraryFlag && (r.supernumeraryCategory === 'TFW' || r.seatCategory === 'TFW') && r.rowOutcome !== 'REJECTED').length;
    const ewsEnrolled = records.filter((r) => r.supernumeraryFlag && (r.supernumeraryCategory === 'EWS' || r.seatCategory === 'EWS') && r.rowOutcome !== 'REJECTED').length;
    const pmsssEnrolled = records.filter((r) => r.supernumeraryFlag && r.supernumeraryCategory === 'PMSSS' && r.rowOutcome !== 'REJECTED').length;
    const otherEnrolled = records.filter((r) => r.supernumeraryFlag && !['TFW', 'EWS', 'PMSSS'].includes(r.supernumeraryCategory || '') && r.rowOutcome !== 'REJECTED').length;

    let tfwCap = 0;
    let ewsCap = 0;
    intakeLimits.forEach((l) => {
      if (l.supernumeraryLimits) {
        tfwCap += l.supernumeraryLimits.tfw || 0;
        ewsCap += l.supernumeraryLimits.ews || 0;
      }
    });

    return {
      tfwEnrolled,
      tfwCap,
      ewsEnrolled,
      ewsCap,
      pmsssEnrolled,
      otherEnrolled,
      totalSuperEnrolled: tfwEnrolled + ewsEnrolled + pmsssEnrolled + otherEnrolled,
    };
  }, [records, intakeLimits]);

  // Drawer selected item details
  const inspectingProgramme = intakeComparison.find((p) => p.limitId === inspectingProgrammeId);
  const inspectingRecords = inspectingProgramme
    ? records.filter(
        (r) =>
          r.institutionId === inspectingProgramme.institutionId &&
          r.programmeCode === inspectingProgramme.programmeCode &&
          r.academicYear === selectedAcademicYear &&
          r.rowOutcome !== 'REJECTED'
      )
    : [];

  return (
    <div className="space-y-6">
      {/* 1. Page Header & Global Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-[#101C32] tracking-tight font-heading">
              Executive Enrolment & Regulatory Reconciliation
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-50 text-[#315EAA] border border-blue-200">
              AICTE Oversight & Academic Integrity
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-50 text-[#168C83] border border-teal-200 font-medium">
              LIVE SYNTHETIC RECONCILIATION
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Cross-institutional enrolment reconciliation, mathematical seat quota audits, and privacy-preserving student identity resolution.
          </p>
        </div>

        {/* Global Multi-Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 px-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">Filters:</span>
          </div>

          <select
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-700 font-mono font-medium focus:outline-none focus:ring-1 focus:ring-[#315EAA] cursor-pointer"
          >
            <option value="2026-27">AY 2026-27</option>
            <option value="2025-26">AY 2025-26</option>
          </select>

          <select
            value={filterInstitution}
            onChange={(e) => setFilterInstitution(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#315EAA] max-w-[170px] truncate cursor-pointer font-medium"
          >
            <option value="ALL">All Campuses ({institutions.length})</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.code} — {i.name}
              </option>
            ))}
          </select>

          <select
            value={filterProgramme}
            onChange={(e) => setFilterProgramme(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#315EAA] cursor-pointer font-medium"
          >
            <option value="ALL">All Programmes</option>
            {programmes.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#315EAA] cursor-pointer font-medium"
          >
            <option value="ALL">All Outcomes</option>
            <option value="ACCEPTED">Accepted (Certified)</option>
            <option value="FLAGGED">Flagged (Under Review)</option>
            <option value="REJECTED">Rejected (Blocking Failures)</option>
          </select>
        </div>
      </div>

      {/* 2. UX QUESTION 1: WHAT IS HAPPENING? (Executive Status Overview Ledger) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#168C83]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              1. What is Happening — Statutory System Briefing
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Current Session: <strong className="text-slate-800 font-bold">AY {selectedAcademicYear}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Total Filed Enrolments</span>
            <div className="text-2xl font-extrabold font-mono text-[#101C32]">{totalRows}</div>
            <p className="text-[11px] text-slate-500 font-sans">
              Across {relevantInstitutions.length} approved campuses and {relevantSubmissions.length} ingested batches
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-teal-50/50 border border-teal-200 space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#168C83] font-bold block">Certified Validated</span>
            <div className="text-2xl font-extrabold font-mono text-teal-900">
              {acceptedRows}{' '}
              <span className="text-sm font-sans font-medium text-teal-700">
                ({totalRows > 0 ? Math.round((acceptedRows / totalRows) * 100) : 0}%)
              </span>
            </div>
            <p className="text-[11px] text-teal-700 font-sans">
              Passed all 12 statutory validation rules; eligible for degree verification
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50/50 border border-amber-200 space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#D99032] font-bold block">Flagged / Collision</span>
            <div className="text-2xl font-extrabold font-mono text-amber-900">
              {flaggedRows + openDuplicates}
            </div>
            <p className="text-[11px] text-amber-700 font-sans">
              {openDuplicates} cross-campus duplicates and {flaggedRows} statutory warnings
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-red-50/50 border border-red-200 space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#C94C4C] font-bold block">Quota Breaches</span>
            <div className="text-2xl font-extrabold font-mono text-red-900">
              +{excessProgrammeCount}
            </div>
            <p className="text-[11px] text-red-700 font-sans">
              {excessProgrammeCount > 0 ? 'Northstar CS exceeds sanctioned regular cap (+8 seats)' : 'All programmes compliant'}
            </p>
          </div>
        </div>

        {/* Visual Multi-segment Proportion Meter */}
        <div className="pt-2">
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${totalRows > 0 ? (acceptedRows / totalRows) * 100 : 0}%` }}
              className="bg-[#168C83] h-full"
              title={`Accepted: ${acceptedRows}`}
            />
            <div
              style={{ width: `${totalRows > 0 ? (flaggedRows / totalRows) * 100 : 0}%` }}
              className="bg-[#D99032] h-full"
              title={`Flagged: ${flaggedRows}`}
            />
            <div
              style={{ width: `${totalRows > 0 ? (rejectedRows / totalRows) * 100 : 0}%` }}
              className="bg-[#C94C4C] h-full"
              title={`Rejected: ${rejectedRows}`}
            />
          </div>
        </div>
      </div>

      {/* 3. UX QUESTION 2: WHAT REQUIRES ATTENTION? (Action Triage Desk) */}
      <div className="bg-white rounded-xl border border-amber-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-amber-100">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-[#D99032]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#101C32]">
              2. What Requires Attention — Regulatory Action Queue
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
            {openDuplicates + excessProgrammeCount + (rejectedRows > 0 ? 1 : 0)} Urgent Items
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action Item A: Quota Breach */}
          <div className="p-4 rounded-lg bg-red-50/40 border border-red-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-red-700">Quota Breach Notice</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-800">Rule V-09</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1">Northstar B.Sc CS (+8 Seats)</h3>
              <p className="text-xs text-slate-600 font-sans mt-1 leading-snug">
                Enrolled 68 regular students against AICTE approved regular limit of 60. Supernumerary welfare seats are correctly isolated.
              </p>
            </div>
            <button
              onClick={() => setActiveNav('seat-ledger')}
              className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <span>Examine Quota Cell & Issue Notice</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Item B: TPER Collision Adjudication */}
          <div className="p-4 rounded-lg bg-amber-50/40 border border-amber-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-amber-800">Collision Triage</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">{openDuplicates} Pending</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1">Cross-Campus Dual Adjudication</h3>
              <p className="text-xs text-slate-600 font-sans mt-1 leading-snug">
                6 student pairings (e.g. #DUP-001 Aarav Sharma) identified across campuses requiring officer verification of transfer NOCs.
              </p>
            </div>
            <button
              onClick={() => setActiveNav('exception-review')}
              className="w-full py-2 px-3 bg-[#315EAA] hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <span>Open Adjudication Desk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Item C: Blocking Ingestion Quality Failures */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-600">Ingestion Errors</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">{rejectedRows} Rows</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1">Deterministic Rule Failures</h3>
              <p className="text-xs text-slate-600 font-sans mt-1 leading-snug">
                8 records rejected under Rule V-01 (Blank student name) and Rule V-06 (Age outside bounds). Correction and resubmission required.
              </p>
            </div>
            <button
              onClick={() => setActiveNav('submission')}
              className="w-full py-2 px-3 bg-[#101C32] hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <span>Inspect & Resubmit Ingestion</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. UX QUESTION 3: WHAT SHOULD I DO NEXT? (Guided Action Launcher) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              3. What Should I Do Next — Primary Operational Workflows
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">1-Click Launchers</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <button
            onClick={() => setActiveNav('submission')}
            className="p-3 rounded-lg border border-slate-200 hover:border-[#315EAA] hover:bg-blue-50/30 text-left transition-all cursor-pointer group"
          >
            <UploadCloud className="w-4 h-4 text-[#315EAA] mb-1.5" />
            <div className="text-xs font-bold text-slate-900 group-hover:text-[#315EAA]">1. Ingest Batch</div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">Upload CSV or preset batch</div>
          </button>

          <button
            onClick={() => setActiveNav('tper')}
            className="p-3 rounded-lg border border-slate-200 hover:border-[#315EAA] hover:bg-blue-50/30 text-left transition-all cursor-pointer group"
          >
            <GitCompare className="w-4 h-4 text-[#315EAA] mb-1.5" />
            <div className="text-xs font-bold text-slate-900 group-hover:text-[#315EAA]">2. Reconcile TPER</div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">Stage A-E HMAC comparison</div>
          </button>

          <button
            onClick={() => setActiveNav('seat-ledger')}
            className="p-3 rounded-lg border border-slate-200 hover:border-[#315EAA] hover:bg-blue-50/30 text-left transition-all cursor-pointer group"
          >
            <BarChart3 className="w-4 h-4 text-[#315EAA] mb-1.5" />
            <div className="text-xs font-bold text-slate-900 group-hover:text-[#315EAA]">3. Audit Quotas</div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">Sanctioned regular vs super</div>
          </button>

          <button
            onClick={() => setActiveNav('verification')}
            className="p-3 rounded-lg border border-slate-200 hover:border-[#315EAA] hover:bg-blue-50/30 text-left transition-all cursor-pointer group"
          >
            <CheckCircle2 className="w-4 h-4 text-[#168C83] mb-1.5" />
            <div className="text-xs font-bold text-slate-900 group-hover:text-[#168C83]">4. Verify Student</div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">Tri-state credential query</div>
          </button>
        </div>
      </div>

      {/* 5. INTERACTIVE OPERATIONAL WORKBENCH GRID:
          Left: Programme Quota Reconciliation with Slide-over Drawer
          Right: Campus Regulatory Performance Scorecard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Programme Quota Reconciliation Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[#101C32]">
                    Programme Regular Intake vs. Counted Enrolment
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Sanctioned Cap Audit
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-sans">
                  Supernumerary seats (TFW, EWS) are accounted separately and cannot deplete regular open capacity.
                </p>
              </div>

              {/* Breaches Filter Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuotaBreachOnly(!quotaBreachOnly)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    quotaBreachOnly
                      ? 'bg-[#C94C4C] text-white border-[#C94C4C] shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>{quotaBreachOnly ? 'Showing Breaches Only' : 'Show Breaches Only'}</span>
                </button>
              </div>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Campus & Programme</th>
                    <th className="py-2.5 px-3 text-right">Sanctioned</th>
                    <th className="py-2.5 px-3 text-right">Regular</th>
                    <th className="py-2.5 px-3 text-center">Variance</th>
                    <th className="py-2.5 px-3 text-right">Super Quota</th>
                    <th className="py-2.5 px-3 text-center">Verdict</th>
                    <th className="py-2.5 px-3 text-center">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredIntakeList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 font-mono text-xs">
                        No programmes matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredIntakeList.map((item) => (
                      <tr key={item.limitId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{item.programmeCode}</div>
                          <span className="text-[10px] font-mono text-slate-500">{item.institutionName}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-700 tabular-nums">
                          {item.approvedRegularIntake}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {item.countedRegular}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {item.isExcess ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                              +{item.variance} Breach
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                              {item.approvedRegularIntake - item.countedRegular} Vacant
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-indigo-700 font-semibold tabular-nums">
                          {item.supernumeraryCount} / {item.approvedSuperCap}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.isExcess ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              EXCESS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                              <CheckCircle2 className="w-3 h-3 text-teal-600" />
                              COMPLIANT
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => setInspectingProgrammeId(item.limitId)}
                            className="p-1 rounded hover:bg-slate-100 text-[#315EAA] transition-colors cursor-pointer"
                            title="Inspect Roster"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-sans">
            <span className="text-[11px] text-slate-500 font-mono">AICTE Approval Process Handbook (APH) Standard</span>
            <button
              onClick={() => setActiveNav('seat-ledger')}
              className="text-xs font-semibold text-[#315EAA] hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              Full Quota Cell <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Campus Compliance Scorecard (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#315EAA]" />
                <h2 className="text-sm font-bold text-[#101C32]">Campus Regulatory Performance</h2>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                {relevantInstitutions.length} Campuses
              </span>
            </div>

            <div className="mt-3 divide-y divide-slate-100 overflow-y-auto max-h-[380px]">
              {relevantInstitutions.map((inst) => {
                const instRecords = records.filter((r) => r.institutionId === inst.id);
                const total = instRecords.length || 1;
                const accepted = instRecords.filter((r) => r.rowOutcome === 'ACCEPTED').length;
                const passRate = Math.round((accepted / total) * 100);
                const hasBreach = intakeComparison.some((p) => p.institutionId === inst.id && p.isExcess);

                return (
                  <div key={inst.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#101C32] truncate">{inst.name}</span>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                          {inst.code}
                        </span>
                        {hasBreach && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-50 text-red-700 border border-red-200">
                            BREACH
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-sans">
                        Region: <strong className="text-slate-700 font-medium">{inst.region}</strong> · {inst.type}
                      </div>

                      {/* Small progress bar */}
                      <div className="flex items-center gap-2 pt-1">
                        <div className="w-24 bg-slate-100 h-1.5 rounded overflow-hidden">
                          <div
                            style={{ width: `${passRate}%` }}
                            className={`h-full ${passRate >= 90 ? 'bg-[#168C83]' : 'bg-[#D99032]'}`}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">
                          {passRate}% Validated ({instRecords.length} records)
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveNav('institutions');
                      }}
                      className="py-1 px-2.5 rounded bg-blue-50 hover:bg-blue-100 text-[#315EAA] text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                    >
                      Dossier →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveNav('institutions')}
              className="w-full py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Manage Institutional Dossiers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. RECENT TAMPER-EVIDENT AUDIT TRAIL STREAM */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-bold text-[#101C32]">Tamper-Evident SHA-256 Audit Activity Stream</h2>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Cryptographic Chain
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[260px] overflow-y-auto">
          {auditEvents.slice(0, 4).map((ev) => (
            <div key={ev.id} className="py-2.5 flex items-center justify-between gap-4 text-xs font-mono">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{ev.id}</span>
                  <span className="text-slate-700 font-sans font-semibold">{ev.action}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">{ev.entityType}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-sans">
                  By: <strong className="text-slate-800">{ev.actorName}</strong> ({ev.actorRole})
                  {ev.reasonOrRuleId && <span className="italic ml-2">"{ev.reasonOrRuleId}"</span>}
                </div>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">
                {ev.timestamp.replace('T', ' ').slice(0, 19)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500 font-mono">{auditEvents.length} Sequential Blocks</span>
          <button
            onClick={() => setActiveNav('audit-trail')}
            className="text-xs font-semibold text-[#315EAA] hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            Inspect Complete Audit Ledger <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Slide-over Inspection Drawer for Programme Roster */}
      <DetailDrawer
        isOpen={Boolean(inspectingProgrammeId)}
        onClose={() => setInspectingProgrammeId(null)}
        title={`Programme Roster: ${inspectingProgramme?.programmeCode || ''}`}
        subtitle={`${inspectingProgramme?.programmeName || ''} at ${inspectingProgramme?.institutionName || ''}`}
      >
        {inspectingProgramme && (
          <div className="space-y-4 text-xs font-sans">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Approved Regular:</span>
                <strong className="text-slate-900">{inspectingProgramme.approvedRegularIntake} Seats</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Counted Regular:</span>
                <strong className={`font-bold ${inspectingProgramme.isExcess ? 'text-red-600' : 'text-slate-900'}`}>
                  {inspectingProgramme.countedRegular} Seats
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Supernumerary (TFW+EWS):</span>
                <strong className="text-indigo-700">{inspectingProgramme.supernumeraryCount} Seats</strong>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-800">Enrolled Students in this Programme ({inspectingRecords.length}):</span>
              <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {inspectingRecords.map((rec) => (
                  <div key={rec.id} className="p-2.5 flex items-center justify-between text-[11px]">
                    <div>
                      <div className="font-semibold text-slate-900">{rec.studentName}</div>
                      <span className="font-mono text-slate-400 text-[10px]">
                        Ref: {rec.studentReference} · Category: {rec.seatCategory}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                        rec.supernumeraryFlag
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {rec.supernumeraryFlag ? `SUPER (${rec.supernumeraryCategory})` : 'REGULAR'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};
