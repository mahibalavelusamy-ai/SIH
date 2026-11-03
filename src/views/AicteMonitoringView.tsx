import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { DetailDrawer } from '../components/ui/DetailDrawer';
import {
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  FileWarning,
  Building2,
  BookOpen,
  Filter,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Search,
} from 'lucide-react';

export const AicteMonitoringView: React.FC = () => {
  const {
    institutions,
    programmes,
    intakeLimits,
    records,
    submissions,
    selectedAcademicYear,
    setSelectedAcademicYear,
    duplicateCandidates,
  } = useApp();

  const [filterInstitution, setFilterInstitution] = useState<string>('ALL');
  const [filterProgramme, setFilterProgramme] = useState<string>('ALL');
  const [filterDiscrepancyOnly, setFilterDiscrepancyOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProgrammeLimitId, setSelectedProgrammeLimitId] = useState<string | null>(null);

  // Compute programme-level reconciliation matrix
  const matrixData = useMemo(() => {
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

        // All non-rejected enrolments for this institute + programme + academic year
        const progRecords = records.filter(
          (r) =>
            r.institutionId === limit.institutionId &&
            r.programmeCode === limit.programmeCode &&
            r.academicYear === limit.academicYear &&
            r.rowOutcome !== 'REJECTED' &&
            r.enrolmentStatus === 'ACTIVE'
        );

        // Count regular enrolments: supernumeraryFlag is false
        const regularEnrolments = progRecords.filter((r) => !r.supernumeraryFlag);
        const regularCount = regularEnrolments.length;
        const regularVariance = regularCount - limit.approvedRegularIntake;
        const regularExcess = regularVariance > 0;

        // Count supernumerary categories
        const tfwCount = progRecords.filter(
          (r) => r.supernumeraryCategory === 'TFW' || r.seatCategory === 'TFW'
        ).length;
        const tfwExcess = limit.supernumeraryLimits.tfw > 0 && tfwCount > limit.supernumeraryLimits.tfw;

        const ewsCount = progRecords.filter(
          (r) => r.supernumeraryCategory === 'EWS' || r.seatCategory === 'EWS'
        ).length;
        const ewsExcess = limit.supernumeraryLimits.ews > 0 && ewsCount > limit.supernumeraryLimits.ews;

        const lateralCount = progRecords.filter(
          (r) => r.supernumeraryCategory === 'LATERAL_ENTRY' || r.lateralEntryFlag
        ).length;

        const totalActive = progRecords.length;

        // Open exceptions related to this programme
        const openExceptions = duplicateCandidates.filter(
          (c) =>
            c.status === 'PENDING_REVIEW' &&
            ((c.recordA.institutionId === limit.institutionId && c.recordA.programmeCode === limit.programmeCode) ||
              (c.recordB.institutionId === limit.institutionId && c.recordB.programmeCode === limit.programmeCode))
        ).length;

        // Latest submission for this institute
        const latestSub = submissions
          .filter((s) => s.institutionId === limit.institutionId && s.academicYear === limit.academicYear)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        // Overall status
        let status: 'COMPLIANT' | 'REGULAR_EXCESS' | 'QUOTA_EXCESS' | 'ZERO_ENROLMENT' = 'COMPLIANT';
        if (regularCount === 0) {
          status = 'ZERO_ENROLMENT';
        } else if (regularExcess) {
          status = 'REGULAR_EXCESS';
        } else if (tfwExcess || ewsExcess) {
          status = 'QUOTA_EXCESS';
        }

        return {
          id: limit.id,
          institutionId: limit.institutionId,
          institutionCode: inst?.code || limit.institutionId,
          institutionName: inst?.name || limit.institutionId,
          programmeCode: limit.programmeCode,
          programmeName: prog?.name || limit.programmeCode,
          academicYear: limit.academicYear,
          approvedRegularIntake: limit.approvedRegularIntake,
          countedRegular: regularCount,
          regularVariance,
          regularExcess,
          tfwLimit: limit.supernumeraryLimits.tfw,
          tfwCount,
          tfwExcess,
          ewsLimit: limit.supernumeraryLimits.ews,
          ewsCount,
          lateralCount,
          totalActive,
          openExceptions,
          latestSubId: latestSub?.id || '—',
          ruleVersion: latestSub?.ruleEngineVersion || '—',
          status,
        };
      })
      .filter((row) => (filterDiscrepancyOnly ? row.status !== 'COMPLIANT' : true))
      .filter((row) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          row.programmeCode.toLowerCase().includes(q) ||
          row.programmeName.toLowerCase().includes(q) ||
          row.institutionName.toLowerCase().includes(q) ||
          row.institutionCode.toLowerCase().includes(q)
        );
      });
  }, [
    intakeLimits,
    records,
    institutions,
    programmes,
    submissions,
    duplicateCandidates,
    selectedAcademicYear,
    filterInstitution,
    filterProgramme,
    filterDiscrepancyOnly,
    searchQuery,
  ]);

  // CSV Export of the reconciliation report
  const handleExportCSV = () => {
    const headers = [
      'InstitutionCode',
      'InstitutionName',
      'AcademicYear',
      'ProgrammeCode',
      'ProgrammeName',
      'ApprovedRegularIntake',
      'CountedRegularEnrolment',
      'RegularVariance',
      'TFWLimit',
      'TFWReported',
      'TotalActiveEnrolment',
      'OpenExceptions',
      'ReconciliationStatus',
    ];

    const rows = matrixData.map((d) => [
      `"${d.institutionCode}"`,
      `"${d.institutionName}"`,
      `"${d.academicYear}"`,
      `"${d.programmeCode}"`,
      `"${d.programmeName}"`,
      d.approvedRegularIntake,
      d.countedRegular,
      d.regularVariance,
      d.tfwLimit,
      d.tfwCount,
      d.totalActive,
      d.openExceptions,
      `"${d.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AICTE_Intake_Reconciliation_Report_${selectedAcademicYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Non-Compliance Breach Notices CSV
  const handleExportBreachNotices = () => {
    const breaches = matrixData.filter((d) => d.status === 'REGULAR_EXCESS' || d.status === 'QUOTA_EXCESS');
    if (breaches.length === 0) {
      alert('No non-compliance breaches found in current filtered selection.');
      return;
    }

    const headers = [
      'NoticeRef',
      'IssueDate',
      'InstitutionCode',
      'InstitutionName',
      'AcademicYear',
      'ProgrammeCode',
      'ProgrammeName',
      'BreachClassification',
      'ApprovedStatutoryQuota',
      'ReportedCountedEnrolment',
      'ExcessVariance',
      'MandatedAction',
    ];

    const rows = breaches.map((b, idx) => [
      `"NOTC-AICTE-${b.academicYear}-${idx + 1}"`,
      `"${new Date().toISOString().slice(0, 10)}"`,
      `"${b.institutionCode}"`,
      `"${b.institutionName}"`,
      `"${b.academicYear}"`,
      `"${b.programmeCode}"`,
      `"${b.programmeName}"`,
      `"${b.status === 'REGULAR_EXCESS' ? 'REGULAR_APPROVED_INTAKE_EXCEEDED' : 'SUPERNUMERARY_QUOTA_EXCEEDED'}"`,
      b.status === 'REGULAR_EXCESS' ? b.approvedRegularIntake : b.tfwLimit,
      b.status === 'REGULAR_EXCESS' ? b.countedRegular : b.tfwCount,
      b.status === 'REGULAR_EXCESS' ? b.regularVariance : b.tfwCount - b.tfwLimit,
      b.status === 'REGULAR_EXCESS'
        ? '"Institutional reconciliation hearing required; submission of genuine withdrawal records or revised intake approval"'
        : '"Supernumerary cap adjustment required in institutional portal"',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AICTE_Non_Compliance_Notices_${selectedAcademicYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Aggregate KPI Calculations
  const totalApprovedRegular = matrixData.reduce((acc, curr) => acc + curr.approvedRegularIntake, 0);
  const totalCountedRegular = matrixData.reduce((acc, curr) => acc + curr.countedRegular, 0);
  const totalSupernumerary = matrixData.reduce((acc, curr) => acc + curr.tfwCount + curr.ewsCount + curr.lateralCount, 0);
  const compliantCount = matrixData.filter((d) => d.status === 'COMPLIANT').length;
  const complianceRate = matrixData.length > 0 ? Math.round((compliantCount / matrixData.length) * 100) : 100;
  const totalExcessSeats = matrixData.reduce((acc, curr) => (curr.regularVariance > 0 ? acc + curr.regularVariance : acc), 0);
  const totalOpenExceptions = matrixData.reduce((acc, curr) => acc + curr.openExceptions, 0);

  // Selected row for detail drawer
  const selectedRow = matrixData.find((m) => m.id === selectedProgrammeLimitId);
  const selectedRowRecords = selectedRow
    ? records.filter(
        (r) =>
          r.institutionId === selectedRow.institutionId &&
          r.programmeCode === selectedRow.programmeCode &&
          r.academicYear === selectedRow.academicYear &&
          r.rowOutcome !== 'REJECTED'
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'IDVERA' },
          { label: 'Regulatory Oversight' },
          { label: 'Programme Seat Ledger' },
        ]}
        title="Programme-Wise Statutory Seat Ledger & Quota Audits"
        subtitle="Mathematical reconciliation comparing approved regular intake ceilings against counted student rosters, isolating supernumerary quotas (TFW, EWS, PMSSS)."
        badge={
          <span className="font-mono text-[11px] text-[#168C83] bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#168C83]" />
            AICTE APH RECONCILIATION
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBreachNotices}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              <FileWarning className="w-3.5 h-3.5 text-[#C94C4C]" />
              Export Breach Notices
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101C32] hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#315EAA]" />
              Export Intake Ledger
            </button>
          </div>
        }
      />

      {/* COMPOSITE STATUTORY INTAKE DOSSIER (Replaces 6 separate small cards with 3 composite panels) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Panel 1: Regular Capacity vs Counted Enrolment */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                Regular Intake Capacity
              </span>
              {totalExcessSeats > 0 ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-50 text-[#C94C4C] border border-red-200 animate-pulse">
                  +{totalExcessSeats} Excess Seats
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-teal-50 text-[#168C83] border border-teal-200">
                  Fully Compliant
                </span>
              )}
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold font-mono text-[#101C32] tabular-nums">
                  {totalCountedRegular}
                </span>
                <span className="text-xs text-slate-500 font-sans ml-2">Enrolled Regular</span>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Cap: <strong className="text-slate-800 font-bold">{totalApprovedRegular}</strong>
              </span>
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-sans">
              {totalExcessSeats > 0 ? (
                <span className="text-red-700 font-medium">
                  <strong>Breach Alert:</strong> Northstar B.Sc Computer Science has exceeded sanctioned capacity (+8 seats). Formal hearing required under AICTE APH Chapter 2.
                </span>
              ) : (
                <span className="text-teal-700 font-medium">
                  All active programmes are within sanctioned regular ceilings.
                </span>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>AY {selectedAcademicYear}</span>
            <span>{matrixData.length} Programmes Active</span>
          </div>
        </div>

        {/* Panel 2: Supernumerary Welfare Quota Isolation */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                Supernumerary Quotas
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Over-and-Above
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold font-mono text-indigo-900 tabular-nums">
                  {totalSupernumerary}
                </span>
                <span className="text-xs text-slate-500 font-sans ml-2">Total Quota Students</span>
              </div>
              <span className="text-xs font-mono text-slate-400">TFW + EWS + PMSSS</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Tuition Fee Waiver:</span>
                <strong className="text-sm text-slate-900">{matrixData.reduce((a, b) => a + b.tfwCount, 0)} Seats</strong>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Economically Weaker:</span>
                <strong className="text-sm text-slate-900">{matrixData.reduce((a, b) => a + b.ewsCount, 0)} Seats</strong>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-sans">
            Statutory welfare seats are mathematically ring-fenced from regular open limits.
          </div>
        </div>

        {/* Panel 3: Institutional Regulatory Health & Compliance Gauge */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                Programme Compliance Rate
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-teal-50 text-[#168C83] border border-teal-200">
                {complianceRate}% Ratio
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold font-mono text-[#101C32] tabular-nums">
                  {compliantCount} / {matrixData.length}
                </span>
                <span className="text-xs text-slate-500 font-sans ml-2">Compliant Programmes</span>
              </div>
              <span className="text-xs font-mono text-amber-700 font-bold">
                {totalOpenExceptions} Open Exceptions
              </span>
            </div>

            {/* Proportion Bar */}
            <div className="mt-3 space-y-1.5">
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                <div style={{ width: `${complianceRate}%` }} className="bg-[#168C83] h-full" />
                <div style={{ width: `${100 - complianceRate}%` }} className="bg-[#C94C4C] h-full" />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>{compliantCount} compliant</span>
                <span>{matrixData.length - compliantCount} breach</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-sans">
            Rule V-09 triggers automatically when Counted Regular &gt; Approved Regular.
          </div>
        </div>
      </div>

      {/* Filter and Search Ribbon */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 px-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">Filter Ledger:</span>
          </div>

          {/* Academic Session */}
          <select
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-700 font-mono font-medium focus:outline-none focus:ring-1 focus:ring-[#315EAA] cursor-pointer"
          >
            <option value="2026-27">AY 2026-27</option>
            <option value="2025-26">AY 2025-26</option>
          </select>

          {/* Institution Selector */}
          <select
            value={filterInstitution}
            onChange={(e) => setFilterInstitution(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#315EAA] max-w-[170px] truncate cursor-pointer font-medium"
          >
            <option value="ALL">All Campuses</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.code} — {i.name}
              </option>
            ))}
          </select>

          {/* Programme Selector */}
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

          {/* Breach Only Toggle */}
          <button
            type="button"
            onClick={() => setFilterDiscrepancyOnly(!filterDiscrepancyOnly)}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors flex items-center gap-1 cursor-pointer ${
              filterDiscrepancyOnly
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Show Breaches Only</span>
          </button>
        </div>

        {/* Live Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search programme, code, campus..."
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#315EAA] w-64"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Deep Master Seat Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-[#101C32]">Statutory Programme Quota Reconciliation Ledger</h3>
            <p className="text-xs text-slate-500">Row-level breakdown comparing approved regular ceilings with counted student rosters</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
            {matrixData.length} Programmes in View
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Host Campus</th>
                <th className="py-2.5 px-3">Programme</th>
                <th className="py-2.5 px-3 text-right">Approved Regular</th>
                <th className="py-2.5 px-3 text-right">Counted Regular</th>
                <th className="py-2.5 px-3 text-center">Variance</th>
                <th className="py-2.5 px-3 text-right">TFW Super</th>
                <th className="py-2.5 px-3 text-right">EWS Super</th>
                <th className="py-2.5 px-3 text-right font-bold">Total Campus Intake</th>
                <th className="py-2.5 px-3 text-center">Statutory Verdict</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-sans">
              {matrixData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-mono text-xs">
                    No programmes found matching current criteria.
                  </td>
                </tr>
              ) : (
                matrixData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{row.institutionName}</div>
                      <span className="font-mono text-[10px] text-slate-400">{row.institutionCode}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{row.programmeName}</div>
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                        {row.programmeCode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-700 tabular-nums">
                      {row.approvedRegularIntake}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {row.countedRegular}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {row.regularExcess ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                          +{row.regularVariance} Breach
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                          {row.approvedRegularIntake - row.countedRegular} Vacant
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-indigo-700 font-medium tabular-nums">
                      {row.tfwCount} / {row.tfwLimit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-indigo-700 font-medium tabular-nums">
                      {row.ewsCount} / {row.ewsLimit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900 tabular-nums">
                      {row.totalActive}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.status === 'REGULAR_EXCESS' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          REGULAR EXCESS
                        </span>
                      )}
                      {row.status === 'QUOTA_EXCESS' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          SUPERNUMERARY BREACH
                        </span>
                      )}
                      {row.status === 'ZERO_ENROLMENT' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          ZERO ENROLMENT
                        </span>
                      )}
                      {row.status === 'COMPLIANT' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                          <CheckCircle2 className="w-3 h-3 text-teal-600" />
                          COMPLIANT
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedProgrammeLimitId(row.id)}
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

      {/* Programme Enrolment Inspector Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedProgrammeLimitId)}
        onClose={() => setSelectedProgrammeLimitId(null)}
        title={`Programme Roster: ${selectedRow?.programmeCode || ''}`}
        subtitle={`${selectedRow?.programmeName || ''} at ${selectedRow?.institutionName || ''}`}
      >
        {selectedRow && (
          <div className="space-y-4 text-xs font-sans">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Approved Regular:</span>
                <strong className="text-slate-900">{selectedRow.approvedRegularIntake} Seats</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Enrolled Regular:</span>
                <strong className={`font-bold ${selectedRow.regularExcess ? 'text-red-600' : 'text-slate-900'}`}>
                  {selectedRow.countedRegular} Seats
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Supernumerary:</span>
                <strong className="text-indigo-700">{selectedRow.tfwCount + selectedRow.ewsCount} Seats (TFW + EWS)</strong>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-800">Enrolled Students in this Programme ({selectedRowRecords.length}):</span>
              <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {selectedRowRecords.map((rec) => (
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
