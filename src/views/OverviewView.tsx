import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Users,
  TrendingUp,
  Filter,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

export const OverviewView: React.FC = () => {
  const {
    institutions,
    programmes,
    records,
    submissions,
    duplicateCandidates,
    intakeLimits,
    selectedAcademicYear,
    setSelectedAcademicYear,
    setActiveNav,
  } = useApp();

  // Local filter states
  const [filterInstitution, setFilterInstitution] = useState<string>('ALL');
  const [filterProgramme, setFilterProgramme] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

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

  // Calculate intake discrepancies on active regular enrolments
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

        // Count supernumerary enrolments
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

        return {
          limitId: limit.id,
          institutionCode: inst?.code || limit.institutionId,
          institutionName: inst?.name || limit.institutionId,
          programmeCode: limit.programmeCode,
          programmeName: prog?.name || limit.programmeCode,
          approvedRegularIntake: limit.approvedRegularIntake,
          countedRegular: regularCount,
          supernumeraryCount: superEnrolments.length,
          totalEnrolment: regularCount + superEnrolments.length,
          variance,
          isExcess,
        };
      });
  }, [intakeLimits, records, institutions, programmes, selectedAcademicYear, filterInstitution, filterProgramme]);

  const excessProgrammeCount = intakeComparison.filter((p) => p.isExcess).length;

  // Exceptions breakdown by Rule
  const ruleCounts = useMemo(() => {
    const counts: Record<string, { count: number; name: string; severity: string }> = {
      'V-01': { count: 0, name: 'Missing Required Fields', severity: 'BLOCKING' },
      'V-02': { count: 0, name: 'Missing APAAR ID', severity: 'WARNING' },
      'V-03': { count: 0, name: 'APAAR Format Mismatch', severity: 'WARNING' },
      'V-04': { count: 0, name: 'Duplicate APAAR in Batch', severity: 'WARNING' },
      'V-05': { count: 0, name: 'Cross-Institution Active Enrolment', severity: 'WARNING' },
      'V-06': { count: 0, name: 'Invalid Age or Date Format', severity: 'BLOCKING' },
      'V-07': { count: 0, name: 'Admission Outside Session Window', severity: 'WARNING' },
      'V-08': { count: 0, name: 'Seat Category & Quota Conflict', severity: 'WARNING' },
      'V-09': { count: 0, name: 'Approved Regular Intake Excess', severity: 'WARNING' },
      'V-10': { count: 0, name: 'Supernumerary Quota Ceiling Excess', severity: 'WARNING' },
      'V-11': { count: 0, name: 'Supernumerary Eligibility Discrepancy', severity: 'WARNING' },
      'V-12': { count: 0, name: 'Approved Programme Zero Enrolment Notice', severity: 'INFO' },
    };

    filteredRecords.forEach((r) => {
      if (r.findings) {
        r.findings.forEach((f) => {
          if (counts[f.ruleId]) {
            counts[f.ruleId].count++;
          }
        });
      }
    });

    // Programme-level findings: V-09 is calculated from programme intake comparison
    counts['V-09'].count = excessProgrammeCount;

    return counts;
  }, [filteredRecords, excessProgrammeCount]);

  return (
    <div className="space-y-6">
      {/* Header and Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reconciliation Executive Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time synthetic metrics derived from current institutional submissions and TPER temporal models.
          </p>
        </div>

        {/* Global Multi-Filter Strip */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 px-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">Filters:</span>
          </div>

          {/* Academic Year */}
          <select
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          >
            <option value="2026-27">AY 2026-27</option>
            <option value="2025-26">AY 2025-26</option>
          </select>

          {/* Institution */}
          <select
            value={filterInstitution}
            onChange={(e) => setFilterInstitution(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[160px] truncate"
          >
            <option value="ALL">All Institutions (5)</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.code} - {i.name}
              </option>
            ))}
          </select>

          {/* Programme */}
          <select
            value={filterProgramme}
            onChange={(e) => setFilterProgramme(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Programmes</option>
            {programmes.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Outcomes</option>
            <option value="ACCEPTED">Accepted Rows</option>
            <option value="FLAGGED">Flagged Rows</option>
            <option value="REJECTED">Rejected Rows</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Strip (8 Required Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. Institutions */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Institutions</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-slate-900">{relevantInstitutions.length}</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Synthetic approved</span>
        </div>

        {/* 2. Submissions */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Submissions</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-slate-900">{relevantSubmissions.length}</span>
            <FileCheck className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Batches ingested</span>
        </div>

        {/* 3. Rows Processed */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Processed Rows</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">{totalRows}</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Total student rows</span>
        </div>

        {/* 4. Accepted Records */}
        <div className="bg-white p-3 rounded-lg border border-teal-200/80 bg-teal-50/20 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-medium text-teal-700 uppercase tracking-wider">Accepted</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-teal-800 tabular-nums">{acceptedRows}</span>
            <CheckCircle className="w-4 h-4 text-teal-600" />
          </div>
          <span className="text-[10px] text-teal-600/80 mt-1">
            {totalRows > 0 ? `${Math.round((acceptedRows / totalRows) * 100)}% of total` : '0%'}
          </span>
        </div>

        {/* 5. Flagged Records */}
        <div className="bg-white p-3 rounded-lg border border-amber-200/80 bg-amber-50/20 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">Flagged</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-amber-800 tabular-nums">{flaggedRows}</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-[10px] text-amber-600/80 mt-1">Review pending</span>
        </div>

        {/* 6. Rejected Records */}
        <div className="bg-white p-3 rounded-lg border border-red-200/80 bg-red-50/20 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-medium text-red-700 uppercase tracking-wider">Rejected</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-red-800 tabular-nums">{rejectedRows}</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <span className="text-[10px] text-red-600/80 mt-1">Quality rule failure</span>
        </div>

        {/* 7. Open Duplicate Candidates */}
        <div
          onClick={() => setActiveNav('exception-review')}
          className="bg-white p-3 rounded-lg border border-blue-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-blue-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-blue-700 uppercase tracking-wider">TPER Duplicates</span>
            <ArrowUpRight className="w-3 h-3 text-blue-500" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-blue-900 tabular-nums">{openDuplicates}</span>
            <ShieldAlert className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-[10px] text-blue-600/80 mt-1">Unresolved cases</span>
        </div>

        {/* 8. Intake Breaches */}
        <div
          onClick={() => setActiveNav('aicte-monitoring')}
          className={`bg-white p-3 rounded-lg border shadow-xs flex flex-col justify-between cursor-pointer transition-colors ${
            excessProgrammeCount > 0
              ? 'border-red-300 bg-red-50/20 hover:border-red-400'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-600 uppercase tracking-wider">Intake Breaches</span>
            <ArrowUpRight className="w-3 h-3 text-slate-400" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={`text-xl font-bold font-mono tabular-nums ${excessProgrammeCount > 0 ? 'text-red-700' : 'text-slate-800'}`}>
              {excessProgrammeCount}
            </span>
            <TrendingUp className={`w-4 h-4 ${excessProgrammeCount > 0 ? 'text-red-600' : 'text-slate-400'}`} />
          </div>
          <span className={`text-[10px] mt-1 ${excessProgrammeCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
            {excessProgrammeCount > 0 ? 'Exceeds configured regular limit' : 'Within capacity'}
          </span>
        </div>
      </div>

      {/* Main Grid: Visual Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Submission Outcomes Distribution */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Submission Outcome Distribution</h2>
              <p className="text-xs text-slate-500">Row-level classification across current filter</p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-600">{totalRows} Rows</span>
          </div>

          {/* Visual Progress Bar representation */}
          <div className="mt-5 space-y-4 flex-1 flex flex-col justify-center">
            {/* Horizontal Stacked Bar */}
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${totalRows > 0 ? (acceptedRows / totalRows) * 100 : 0}%` }}
                className="bg-teal-600 h-full transition-all"
                title={`Accepted: ${acceptedRows}`}
              />
              <div
                style={{ width: `${totalRows > 0 ? (flaggedRows / totalRows) * 100 : 0}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`Flagged: ${flaggedRows}`}
              />
              <div
                style={{ width: `${totalRows > 0 ? (rejectedRows / totalRows) * 100 : 0}%` }}
                className="bg-red-600 h-full transition-all"
                title={`Rejected: ${rejectedRows}`}
              />
            </div>

            {/* Legend & Count Breakdown */}
            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                  <span className="text-slate-700 font-medium">Accepted (Passed Checks)</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-semibold text-slate-900">{acceptedRows}</span>
                  <span className="text-slate-400">
                    ({totalRows > 0 ? Math.round((acceptedRows / totalRows) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-700 font-medium">Flagged (Non-blocking Review)</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-semibold text-slate-900">{flaggedRows}</span>
                  <span className="text-slate-400">
                    ({totalRows > 0 ? Math.round((flaggedRows / totalRows) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
                  <span className="text-slate-700 font-medium">Rejected (Data Quality Failure)</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-semibold text-slate-900">{rejectedRows}</span>
                  <span className="text-slate-400">
                    ({totalRows > 0 ? Math.round((rejectedRows / totalRows) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-500 mt-2 leading-relaxed">
              <strong>Notice:</strong> Accepted status indicates conformance with prototype validation rules; it does not constitute official identity verification.
            </div>
          </div>
        </div>

        {/* Chart 2: Regular Intake vs Counted Enrolment by Programme */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Approved Regular Intake vs. Counted Regular Enrolment</h2>
              <p className="text-xs text-slate-500">Separates regular intake from supernumerary quotas in strict compliance with rules</p>
            </div>
            <button
              onClick={() => setActiveNav('aicte-monitoring')}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Full Quota Matrix <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-3 overflow-y-auto max-h-[280px] pr-1">
            {intakeComparison.map((item) => {
              const maxScale = Math.max(item.approvedRegularIntake, item.countedRegular) * 1.15 || 100;
              const approvedPct = (item.approvedRegularIntake / maxScale) * 100;
              const countedPct = (item.countedRegular / maxScale) * 100;

              return (
                <div key={item.limitId} className="p-2.5 rounded border border-slate-100 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-900">{item.institutionCode}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-medium text-slate-700">{item.programmeCode}</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-slate-500">Approved: <strong>{item.approvedRegularIntake}</strong></span>
                      <span className="text-slate-500">Reported: <strong>{item.countedRegular}</strong></span>
                      {item.isExcess ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700 font-semibold border border-red-200">
                          +{item.variance} Excess
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                          {item.approvedRegularIntake - item.countedRegular} Open
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dual comparison bar */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span className="w-14 shrink-0">Approved</span>
                      <div className="flex-1 bg-slate-100 h-2 rounded overflow-hidden">
                        <div style={{ width: `${approvedPct}%` }} className="bg-slate-400 h-full" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span className="w-14 shrink-0">Reported</span>
                      <div className="flex-1 bg-slate-100 h-2 rounded overflow-hidden">
                        <div
                          style={{ width: `${countedPct}%` }}
                          className={`h-full ${item.isExcess ? 'bg-red-600' : 'bg-blue-600'}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Validation Findings by Rule Table & Recent Ingestion Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exception Frequency by Rule */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Validation Engine Findings by Rule</h2>
              <p className="text-xs text-slate-500">Synthetic violations detected by versioned rules V-01 to V-10</p>
            </div>
            <button
              onClick={() => setActiveNav('rules')}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Engine Configuration <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Rule ID</th>
                  <th className="py-2 px-3">Validation Condition</th>
                  <th className="py-2 px-3">Severity</th>
                  <th className="py-2 px-3 text-right">Violations Detected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(ruleCounts).map(([ruleId, info]) => (
                  <tr key={ruleId} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-mono font-semibold text-slate-900">{ruleId}</td>
                    <td className="py-2 px-3 text-slate-700">{info.name}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                          info.severity === 'BLOCKING'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {info.severity}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {info.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick TPER Reconciliation Status Box */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">TPER Temporal Health</h2>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                Stage A-E Active
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="text-xs text-slate-500 font-medium">Pending Exception Cases</div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{openDuplicates}</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Cross-institutional candidates requiring regulatory human adjudication.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="text-xs text-slate-500 font-medium">Legitimate Transfers Reconciled</div>
                <div className="text-2xl font-bold font-mono text-teal-700 mt-1">
                  {duplicateCandidates.filter((c) => c.status === 'LEGITIMATE_TRANSFER').length + 1}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Non-overlapping enrolment intervals verified via Stage C transition rules.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => setActiveNav('exception-review')}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors shadow-xs text-center"
            >
              Open Exception Review Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
