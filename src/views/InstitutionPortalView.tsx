import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';

export const InstitutionPortalView: React.FC = () => {
  const {
    institutions,
    selectedInstitutionId,
    setSelectedInstitutionId,
    programmes,
    intakeLimits,
    submissions,
    records,
    setActiveNav,
    selectedAcademicYear,
  } = useApp();

  const currentInstitution = institutions.find((i) => i.id === selectedInstitutionId) || institutions[0];

  // Programmes offered by this institution
  const approvedProgs = programmes.filter((p) =>
    currentInstitution.approvedProgrammes.includes(p.code)
  );

  // Submissions for this institution
  const instSubmissions = submissions.filter((s) => s.institutionId === currentInstitution.id);

  // Records for this institution
  const instRecords = records.filter(
    (r) => r.institutionId === currentInstitution.id && r.academicYear === selectedAcademicYear
  );

  const acceptedCount = instRecords.filter((r) => r.rowOutcome === 'ACCEPTED').length;
  const flaggedCount = instRecords.filter((r) => r.rowOutcome === 'FLAGGED').length;
  const rejectedCount = instRecords.filter((r) => r.rowOutcome === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Header and Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Institution Management Portal</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Select an approved institution to review regulatory profile, intake ceilings, and compliance filings.
          </p>
        </div>

        {/* Institution Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Select Institution:</span>
          <select
            value={currentInstitution.id}
            onChange={(e) => setSelectedInstitutionId(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-md px-3 py-1.5 font-medium text-slate-900 shadow-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.code} — {inst.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Institution Master Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">{currentInstitution.name}</h2>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {currentInstitution.code}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                <span>Region: <strong className="text-slate-700">{currentInstitution.region}</strong></span>
                <span>·</span>
                <span>State: <strong className="text-slate-700">{currentInstitution.state}</strong></span>
                <span>·</span>
                <span>Category: <strong className="text-slate-700">{currentInstitution.type}</strong></span>
                <span>·</span>
                <span>Liaison: <strong className="text-slate-700">{currentInstitution.contactEmail}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveNav('submission')}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Upload Enrolment Batch
            </button>
          </div>
        </div>

        {/* Current Academic Session Summary Banner */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3 rounded border border-slate-100">
            <span className="text-slate-500">Reported Enrolments (AY {selectedAcademicYear})</span>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">{instRecords.length}</div>
          </div>
          <div className="bg-teal-50/50 p-3 rounded border border-teal-100">
            <span className="text-teal-700">Accepted Records</span>
            <div className="text-lg font-bold font-mono text-teal-800 mt-0.5">{acceptedCount}</div>
          </div>
          <div className="bg-amber-50/50 p-3 rounded border border-amber-100">
            <span className="text-amber-700">Flagged for Review</span>
            <div className="text-lg font-bold font-mono text-amber-800 mt-0.5">{flaggedCount}</div>
          </div>
          <div className="bg-red-50/50 p-3 rounded border border-red-100">
            <span className="text-red-700">Rejected Quality Errors</span>
            <div className="text-lg font-bold font-mono text-red-800 mt-0.5">{rejectedCount}</div>
          </div>
        </div>
      </div>

      {/* Grid: Approved Programmes & Intake Matrix vs. Submission History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approved Programmes & Approved Capacity */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Approved Programmes & Seat Limits</h3>
              <p className="text-xs text-slate-500">Statutory regular and supernumerary caps for AY {selectedAcademicYear}</p>
            </div>
            <span className="text-xs font-mono text-slate-500">{approvedProgs.length} Programmes</span>
          </div>

          <div className="mt-3 divide-y divide-slate-100 overflow-y-auto max-h-[360px]">
            {approvedProgs.map((prog) => {
              const limit = intakeLimits.find(
                (l) =>
                  l.institutionId === currentInstitution.id &&
                  l.programmeCode === prog.code &&
                  l.academicYear === selectedAcademicYear
              );

              const regularCount = instRecords.filter(
                (r) => r.programmeCode === prog.code && !r.supernumeraryFlag && r.enrolmentStatus === 'ACTIVE'
              ).length;

              const isExcess = limit && regularCount > limit.approvedRegularIntake;

              return (
                <div key={prog.code} className="py-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-900">{prog.name}</span>
                      <span className="ml-2 font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {prog.code}
                      </span>
                    </div>
                    {isExcess && (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded">
                        Quota Excess
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Approved Regular:</span>
                      <strong>{limit ? limit.approvedRegularIntake : '—'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Counted Regular:</span>
                      <strong className={isExcess ? 'text-red-700 font-bold' : 'text-slate-900'}>
                        {regularCount}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">TFW Limit:</span>
                      <strong>{limit ? limit.supernumeraryLimits.tfw : '—'}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submission Filings History */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Batch Filings History</h3>
                <p className="text-xs text-slate-500">Historical records submitted by this institution</p>
              </div>
              <span className="text-xs font-mono text-slate-500">{instSubmissions.length} Batches</span>
            </div>

            <div className="mt-3 divide-y divide-slate-100 overflow-y-auto max-h-[340px]">
              {instSubmissions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No submissions recorded yet for this institution.
                </div>
              ) : (
                instSubmissions.map((sub) => (
                  <div key={sub.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-slate-900">{sub.id}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          sub.status === 'RECONCILIATION_COMPLETE'
                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                            : sub.status === 'REVIEW_REQUIRED'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {sub.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Engine: <code className="text-slate-700">{sub.ruleEngineVersion}</code></span>
                      <span>Total: <strong className="text-slate-700 font-mono">{sub.totalRows}</strong> rows</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 pt-1">
                      <span className="text-teal-700">✓ {sub.acceptedRows} Accepted</span>
                      <span className="text-amber-700">⚠ {sub.flaggedRows} Flagged</span>
                      <span className="text-red-700">✗ {sub.rejectedRows} Rejected</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => setActiveNav('submission')}
              className="w-full py-2 px-3 border border-slate-300 hover:bg-slate-50 rounded text-xs font-medium text-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              Open Submission Workspace <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
