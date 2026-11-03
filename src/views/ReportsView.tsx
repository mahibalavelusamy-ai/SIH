import React from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { sanitizeCsvCell } from '../services/securityService';
import {
  FileSpreadsheet,
  Download,
  FileWarning,
  FileCheck2,
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  History,
  Award,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { institutions, programmes, intakeLimits, records, duplicateCandidates, auditEvents, selectedAcademicYear } = useApp();

  // Export 1: Intake Reconciliation Report
  const handleExportIntake = () => {
    const headers = ['InstitutionCode', 'InstitutionName', 'AcademicYear', 'ProgrammeCode', 'ApprovedRegular', 'CountedRegular', 'RegularVariance', 'TFWEnrolled', 'EWSEnrolled', 'TotalActive'];
    const rows = intakeLimits.map((l) => {
      const inst = institutions.find((i) => i.id === l.institutionId);
      const regCount = records.filter((r) => r.institutionId === l.institutionId && r.programmeCode === l.programmeCode && !r.supernumeraryFlag && r.enrolmentStatus === 'ACTIVE' && r.rowOutcome !== 'REJECTED').length;
      const tfwCount = records.filter((r) => r.institutionId === l.institutionId && r.programmeCode === l.programmeCode && r.supernumeraryCategory === 'TFW' && r.enrolmentStatus === 'ACTIVE').length;
      const ewsCount = records.filter((r) => r.institutionId === l.institutionId && r.programmeCode === l.programmeCode && r.supernumeraryCategory === 'EWS' && r.enrolmentStatus === 'ACTIVE').length;
      const total = records.filter((r) => r.institutionId === l.institutionId && r.programmeCode === l.programmeCode && r.enrolmentStatus === 'ACTIVE' && r.rowOutcome !== 'REJECTED').length;

      return [
        `"${sanitizeCsvCell(inst?.code || l.institutionId)}"`,
        `"${sanitizeCsvCell(inst?.name || l.institutionId)}"`,
        `"${sanitizeCsvCell(l.academicYear)}"`,
        `"${sanitizeCsvCell(l.programmeCode)}"`,
        l.approvedRegularIntake,
        regCount,
        regCount - l.approvedRegularIntake,
        tfwCount,
        ewsCount,
        total,
      ];
    });

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `IDVERA_AICTE_Intake_Reconciliation_${selectedAcademicYear}.csv`;
    link.click();
  };

  // Export 2: Breach Notices
  const handleExportBreaches = () => {
    const headers = ['NoticeID', 'IssueDate', 'InstitutionCode', 'ProgrammeCode', 'ViolationType', 'SanctionedLimit', 'ReportedEnrolment', 'ExcessCount', 'StatutoryActionMandate'];
    const rows: string[][] = [];

    intakeLimits.forEach((l, idx) => {
      const inst = institutions.find((i) => i.id === l.institutionId);
      const regCount = records.filter((r) => r.institutionId === l.institutionId && r.programmeCode === l.programmeCode && !r.supernumeraryFlag && r.enrolmentStatus === 'ACTIVE' && r.rowOutcome !== 'REJECTED').length;
      if (regCount > l.approvedRegularIntake) {
        rows.push([
          `"NOTC-AICTE-${l.academicYear}-${idx + 1}"`,
          `"${new Date().toISOString().slice(0, 10)}"`,
          `"${sanitizeCsvCell(inst?.code || l.institutionId)}"`,
          `"${sanitizeCsvCell(l.programmeCode)}"`,
          '"REGULAR_APPROVED_INTAKE_EXCEEDED"',
          String(l.approvedRegularIntake),
          String(regCount),
          String(regCount - l.approvedRegularIntake),
          '"Institutional reconciliation hearing required; submission of genuine withdrawal records or revised intake approval"',
        ]);
      }
    });

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `IDVERA_AICTE_Statutory_Breach_Notices_${selectedAcademicYear}.csv`;
    link.click();
  };

  // Export 3: Duplicate Candidates Report
  const handleExportDuplicates = () => {
    const headers = ['CandidateID', 'Stage', 'ConfidenceScore', 'RecordA_Ref', 'RecordA_Campus', 'RecordB_Ref', 'RecordB_Campus', 'AdjudicationStatus'];
    const rows = duplicateCandidates.map((c) => [
      `"${sanitizeCsvCell(c.id)}"`,
      `"${sanitizeCsvCell(c.matchingStage)}"`,
      c.confidenceScore.toFixed(2),
      `"${sanitizeCsvCell(c.recordA.studentReference)}"`,
      `"${sanitizeCsvCell(c.recordA.institutionId)}"`,
      `"${sanitizeCsvCell(c.recordB.studentReference)}"`,
      `"${sanitizeCsvCell(c.recordB.institutionId)}"`,
      `"${sanitizeCsvCell(c.status)}"`,
    ]);

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `IDVERA_TPER_Duplicate_Resolution_Report.csv`;
    link.click();
  };

  // Export 4: Audit Trail Journal
  const handleExportAuditJournal = () => {
    const headers = ['EventID', 'Timestamp', 'ActorName', 'ActorRole', 'Action', 'EntityType', 'EntityID', 'PrevHash', 'Hash'];
    const rows = auditEvents.map((ev) => [
      `"${sanitizeCsvCell(ev.id)}"`,
      `"${sanitizeCsvCell(ev.timestamp)}"`,
      `"${sanitizeCsvCell(ev.actorName)}"`,
      `"${sanitizeCsvCell(ev.actorRole)}"`,
      `"${sanitizeCsvCell(ev.action)}"`,
      `"${sanitizeCsvCell(ev.entityType)}"`,
      `"${sanitizeCsvCell(ev.entityId)}"`,
      `"${sanitizeCsvCell(ev.prevHash || '')}"`,
      `"${sanitizeCsvCell(ev.hash || '')}"`,
    ]);

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `IDVERA_Cryptographic_Audit_Trail_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'IDVERA' },
          { label: 'Governance' },
          { label: 'Regulatory Reports' },
        ]}
        title="Regulatory Reports & Statutory Export Centre"
        subtitle="Download validated statutory compliance scorecards, AICTE breach notices, and tamper-evident audit filings with formula sanitization."
        badge={
          <span className="font-mono text-[11px] text-[#168C83] bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded font-semibold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#168C83]" />
            RFC 4180 FORMULA SANITIZED
          </span>
        }
      />

      {/* COMPOSITE EXPORT STATUS BRIEFING */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-[#101C32]">Statutory Reporting Authority & Data Protection</h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              All data exports automatically strip dangerous formula triggers to prevent registrar workstation command execution.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
            AY {selectedAcademicYear} Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase text-slate-500 font-bold block">Available Formats</span>
            <div className="mt-1 text-xl font-bold text-[#101C32]">4 Reports</div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">CSV / Excel compatible</div>
          </div>

          <div className="p-3 rounded-lg bg-teal-50/50 border border-teal-200">
            <span className="text-[10px] uppercase text-[#168C83] font-bold block">Sanitization Level</span>
            <div className="mt-1 text-xl font-bold text-teal-900">RFC 4180</div>
            <div className="text-[10px] text-teal-700 font-sans mt-0.5">Zero formula risk</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase text-slate-500 font-bold block">Audited Campuses</span>
            <div className="mt-1 text-xl font-bold text-[#101C32]">{institutions.length} Campuses</div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">Under regulatory ledger</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase text-slate-500 font-bold block">Active Records</span>
            <div className="mt-1 text-xl font-bold text-indigo-900">{records.length} Enrolments</div>
            <div className="text-[10px] text-indigo-700 font-sans mt-0.5">Certified datasets</div>
          </div>
        </div>
      </div>

      {/* Reports Catalog Grid (4 Reports) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Report 1: Intake Reconciliation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 text-[#315EAA]" />
              </div>
              <h3 className="text-xs font-bold text-[#101C32] font-mono uppercase tracking-wider">
                Intake Ledger
              </h3>
            </div>
            <p className="mt-3 text-xs text-slate-600 leading-relaxed font-sans">
              Comprehensive programme-wise seat audit comparing approved regular limits vs active rosters, plus supernumerary (TFW, EWS) allocations.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={handleExportIntake}
              className="w-full py-2 px-3 bg-[#101C32] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#315EAA]" /> Download CSV
            </button>
          </div>
        </div>

        {/* Report 2: Breach Notices */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center">
                <FileWarning className="w-4 h-4 text-[#C94C4C]" />
              </div>
              <h3 className="text-xs font-bold text-[#101C32] font-mono uppercase tracking-wider">
                Breach Notices
              </h3>
            </div>
            <p className="mt-3 text-xs text-slate-600 leading-relaxed font-sans">
              Formal non-compliance notice exports for institutions exceeding regular approved capacity (e.g. Northstar CS +8 regular breach).
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={handleExportBreaches}
              className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-[#C94C4C] border border-red-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export Notices (CSV)
            </button>
          </div>
        </div>

        {/* Report 3: TPER Duplicate Resolution Log */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center">
                <FileCheck2 className="w-4 h-4 text-[#168C83]" />
              </div>
              <h3 className="text-xs font-bold text-[#101C32] font-mono uppercase tracking-wider">
                TPER Duplicate Log
              </h3>
            </div>
            <p className="mt-3 text-xs text-slate-600 leading-relaxed font-sans">
              Complete collision resolution log covering Keyed HMAC matches, heuristic findings, and legitimate transfer adjudications.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={handleExportDuplicates}
              className="w-full py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> Export TPER Log (CSV)
            </button>
          </div>
        </div>

        {/* Report 4: Cryptographic Audit Trail */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                <History className="w-4 h-4 text-indigo-700" />
              </div>
              <h3 className="text-xs font-bold text-[#101C32] font-mono uppercase tracking-wider">
                Audit Journal Chain
              </h3>
            </div>
            <p className="mt-3 text-xs text-slate-600 leading-relaxed font-sans">
              Full chronological export of SHA-256 block-hashed audit events, timestamps, actor roles, and tamper-evident digests.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={handleExportAuditJournal}
              className="w-full py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> Export Audit Chain (CSV)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
