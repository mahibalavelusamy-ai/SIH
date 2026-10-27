import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart3,
  Download,
  Filter,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
  FileSpreadsheet,
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
      .filter((row) => (filterDiscrepancyOnly ? row.status !== 'COMPLIANT' : true));
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

  return (
    <div className="space-y-6">
      {/* Header and Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">AICTE Statutory Intake Monitoring</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Programme-level seat allocation reconciliation comparing approved Extension of Approval (EoA) quotas against reported active student rosters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportBreachNotices}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-medium transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Breach Notices (CSV)
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Intake Report (CSV)
          </button>
        </div>
      </div>

      {/* Executive KPI Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block">Approved Regular</span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">{totalApprovedRegular}</div>
          <span className="text-[10px] text-slate-500">Statutory EoA cap</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block">Counted Regular</span>
          <div className="text-lg font-bold font-mono text-blue-700 mt-0.5">{totalCountedRegular}</div>
          <span className="text-[10px] text-slate-500">Active non-supernumerary</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block">Net Regular Excess</span>
          <div className={`text-lg font-bold font-mono mt-0.5 ${totalExcessSeats > 0 ? 'text-red-700' : 'text-teal-700'}`}>
            {totalExcessSeats > 0 ? `+${totalExcessSeats} Seats` : '0 (Compliant)'}
          </div>
          <span className="text-[10px] text-slate-500">NITD CSE (+8)</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block">Supernumerary Seats</span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">{totalSupernumerary}</div>
          <span className="text-[10px] text-slate-500">TFW, EWS, Lateral</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block">Compliance Rate</span>
          <div className="text-lg font-bold font-mono text-teal-700 mt-0.5">{complianceRate}%</div>
          <span className="text-[10px] text-slate-500">{compliantCount} of {matrixData.length} programmes</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block">Programme Exceptions</span>
          <div className="text-lg font-bold font-mono text-amber-700 mt-0.5">{totalOpenExceptions} Open</div>
          <span className="text-[10px] text-slate-500">Under TPER review</span>
        </div>
      </div>

      {/* Regulatory Dual Accounting Notice */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1">
        <span className="font-bold text-blue-900 block">AICTE Dual Quota Accounting Principle:</span>
        <p className="text-slate-700 leading-relaxed text-[11px]">
          In strict conformance with AICTE Approval Process Handbooks, regular intake limits and supernumerary quotas (TFW, EWS, Lateral Entry) are non-fungible and counted independently. If a programme exceeds its regular quota, the aggregate discrepancy is flagged for regulatory review; individual students are not arbitrarily declared invalid.
        </p>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-700">Filters:</span>

          <select
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono text-slate-800"
          >
            <option value="2026-27">AY 2026-27</option>
            <option value="2025-26">AY 2025-26</option>
          </select>

          <select
            value={filterInstitution}
            onChange={(e) => setFilterInstitution(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 max-w-[180px] truncate"
          >
            <option value="ALL">All Institutions</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.code} - {i.name}
              </option>
            ))}
          </select>

          <select
            value={filterProgramme}
            onChange={(e) => setFilterProgramme(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800"
          >
            <option value="ALL">All Programmes</option>
            {programmes.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 ml-2 cursor-pointer text-slate-700">
            <input
              type="checkbox"
              checked={filterDiscrepancyOnly}
              onChange={(e) => setFilterDiscrepancyOnly(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Show Discrepancies Only</span>
          </label>
        </div>

        <span className="text-xs font-mono text-slate-500">{matrixData.length} Programmes Evaluated</span>
      </div>

      {/* Programme Reconciliation Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Institution & Programme</th>
                <th className="py-2.5 px-3 text-right">Approved Regular</th>
                <th className="py-2.5 px-3 text-right">Counted Regular</th>
                <th className="py-2.5 px-3 text-right">Regular Variance</th>
                <th className="py-2.5 px-3 text-right">TFW Limit / Rep</th>
                <th className="py-2.5 px-3 text-right">Total Active</th>
                <th className="py-2.5 px-3 text-center">Open Exceptions</th>
                <th className="py-2.5 px-3">Latest Filing</th>
                <th className="py-2.5 px-3">Reconciliation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrixData.map((row) => {
                const isRegularExcess = row.regularExcess;
                const isTfwExcess = row.tfwExcess;
                const isZero = row.status === 'ZERO_ENROLMENT';

                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isRegularExcess ? 'bg-red-50/20' : isTfwExcess ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{row.institutionName}</div>
                      <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="text-blue-700 font-bold">{row.programmeCode}</span>
                        <span>·</span>
                        <span>AY {row.academicYear}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 font-semibold">
                      {row.approvedRegularIntake}
                    </td>

                    <td
                      className={`py-2.5 px-3 text-right font-mono font-bold ${
                        isRegularExcess ? 'text-red-700' : 'text-slate-900'
                      }`}
                    >
                      {row.countedRegular}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono">
                      {row.regularVariance > 0 ? (
                        <span className="font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded border border-red-200">
                          +{row.regularVariance} Excess
                        </span>
                      ) : row.regularVariance === 0 ? (
                        <span className="text-teal-700">0 (Full)</span>
                      ) : (
                        <span className="text-slate-500">{row.regularVariance} Seats</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      <span>{row.tfwLimit}</span> /{' '}
                      <span className={isTfwExcess ? 'text-amber-800 font-bold' : 'text-slate-900'}>
                        {row.tfwCount}
                      </span>
                      {isTfwExcess && <span className="ml-1 text-[10px] text-amber-600 font-bold">(+Excess)</span>}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                      {row.totalActive}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {row.openExceptions > 0 ? (
                        <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                          {row.openExceptions} Open
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">—</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                      <div>{row.latestSubId}</div>
                      <div className="text-[10px] text-slate-400">Engine {row.ruleVersion}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      {row.status === 'COMPLIANT' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                          <CheckCircle2 className="w-3 h-3 text-teal-600" /> COMPLIANT
                        </span>
                      )}
                      {row.status === 'REGULAR_EXCESS' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                          <AlertTriangle className="w-3 h-3 text-red-600" /> REGULAR EXCESS
                        </span>
                      )}
                      {row.status === 'QUOTA_EXCESS' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> SUPERNUMERARY EXCESS
                        </span>
                      )}
                      {row.status === 'ZERO_ENROLMENT' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          ZERO ENROLMENT
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
