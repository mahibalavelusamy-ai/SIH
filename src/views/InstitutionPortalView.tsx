import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { DetailDrawer } from '../components/ui/DetailDrawer';
import {
  Building2,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Layers,
  MapPin,
  Mail,
  Award,
  AlertTriangle,
  FileCheck,
  Hash,
  ExternalLink,
  ChevronRight,
  Filter,
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

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

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
  const passRate = instRecords.length > 0 ? Math.round((acceptedCount / instRecords.length) * 100) : 0;

  // Selected batch for drawer inspection
  const inspectingBatch = instSubmissions.find((s) => s.id === selectedBatchId);

  return (
    <div className="space-y-6">
      {/* Header and Institution Switcher */}
      <PageHeader
        breadcrumbs={[
          { label: 'IDVERA' },
          { label: 'Campuses' },
          { label: currentInstitution.code },
        ]}
        title="Institutional Regulatory Dossier & Quota Management"
        subtitle="Review institutional statutory profile, approved AICTE programme seat limits, and cryptographic batch filing manifests."
        badge={
          <span className="font-mono text-[11px] text-[#315EAA] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded font-semibold flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#315EAA]" />
            {currentInstitution.code} · AICTE PERMANENT ID
          </span>
        }
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase text-slate-500">Campus:</span>
              <select
                value={currentInstitution.id}
                onChange={(e) => setSelectedInstitutionId(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 font-medium text-slate-800 shadow-2xs focus:ring-1 focus:ring-[#315EAA] focus:outline-none cursor-pointer"
              >
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.code} — {inst.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setActiveNav('submission')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101C32] hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#315EAA]" />
              Ingest Batch
            </button>
          </div>
        }
      />

      {/* Campus Dossier Master Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#101C32] border border-slate-800 flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-6 h-6 text-[#315EAA]" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-[#101C32] font-heading">{currentInstitution.name}</h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {currentInstitution.code}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-[#168C83] border border-teal-200 font-bold">
                  AICTE ACCREDITED
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-[#315EAA] border border-blue-200 font-bold">
                  AY {selectedAcademicYear}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap font-sans">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Region: <strong className="text-slate-800 font-medium">{currentInstitution.region}</strong>
                </span>
                <span className="text-slate-300">·</span>
                <span>State: <strong className="text-slate-800 font-medium">{currentInstitution.state}</strong></span>
                <span className="text-slate-300">·</span>
                <span>Type: <strong className="text-slate-800 font-medium">{currentInstitution.type}</strong></span>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Registrar: <strong className="text-slate-800 font-mono text-[11px]">{currentInstitution.contactEmail}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Institutional Compliance Health Radar */}
          <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200 shrink-0">
            <div className="text-center">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Statutory Pass Rate</span>
              <span className="text-2xl font-extrabold font-mono text-[#168C83]">{passRate}%</span>
              <span className="text-[10px] text-slate-400 block font-mono">Bona fide</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-center">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Active Filings</span>
              <span className="text-2xl font-extrabold font-mono text-[#101C32]">{instSubmissions.length}</span>
              <span className="text-[10px] text-slate-400 block font-mono">Batches</span>
            </div>
          </div>
        </div>

        {/* Current Academic Session Summary Ledger */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Total Reported Enrolments</span>
            <div className="mt-1 font-mono text-xl font-bold text-[#101C32]">{instRecords.length}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">AY {selectedAcademicYear} roster</div>
          </div>

          <div className="p-3 rounded-lg bg-teal-50/50 border border-teal-200">
            <span className="text-[10px] font-mono uppercase text-[#168C83] font-bold block">Certified Validated</span>
            <div className="mt-1 font-mono text-xl font-bold text-teal-900">{acceptedCount}</div>
            <div className="text-[10px] text-teal-700 font-mono mt-0.5">{passRate}% statutory compliance</div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200">
            <span className="text-[10px] font-mono uppercase text-[#D99032] font-bold block">Flagged for Review</span>
            <div className="mt-1 font-mono text-xl font-bold text-amber-900">{flaggedCount}</div>
            <div className="text-[10px] text-amber-700 font-mono mt-0.5">Adjudication warnings</div>
          </div>

          <div className="p-3 rounded-lg bg-red-50/50 border border-red-200">
            <span className="text-[10px] font-mono uppercase text-[#C94C4C] font-bold block">Rejected Violations</span>
            <div className="mt-1 font-mono text-xl font-bold text-red-900">{rejectedCount}</div>
            <div className="text-[10px] text-red-700 font-mono mt-0.5">Deterministic blocking errors</div>
          </div>
        </div>
      </div>

      {/* Grid: Approved Programmes & Seat Limits vs. Batch Filings History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Approved Programmes & Seat Limits Ledger (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-[#101C32] uppercase font-mono tracking-wider">
                  Approved Programmes & Statutory Seat Limits
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  AICTE Sanctioned regular intake and separate supernumerary quota ceilings for AY {selectedAcademicYear}
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {approvedProgs.length} Programmes
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[460px] mt-2">
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

                const superCount = instRecords.filter(
                  (r) => r.programmeCode === prog.code && r.supernumeraryFlag && r.enrolmentStatus === 'ACTIVE'
                ).length;

                const isExcess = limit && regularCount > limit.approvedRegularIntake;
                const variance = limit ? regularCount - limit.approvedRegularIntake : 0;

                return (
                  <div key={prog.code} className="py-3.5 hover:bg-slate-50/70 rounded-lg px-2 transition-colors space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#101C32]">{prog.name}</span>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                          {prog.code}
                        </span>
                      </div>
                      {isExcess ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          +{variance} Regular Breach
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          <CheckCircle2 className="w-3 h-3 text-teal-600" />
                          Compliant
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-[9px] uppercase text-slate-400 block font-sans">Sanctioned</span>
                        <strong className="text-xs font-bold text-slate-900">{limit ? limit.approvedRegularIntake : '—'}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-slate-400 block font-sans">Counted Reg.</span>
                        <strong className={`text-xs font-bold ${isExcess ? 'text-red-600 font-extrabold' : 'text-slate-900'}`}>
                          {regularCount}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-slate-400 block font-sans">TFW Limit</span>
                        <strong className="text-xs font-bold text-slate-700">{limit ? limit.supernumeraryLimits.tfw : '—'}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-slate-400 block font-sans">Super Enrolled</span>
                        <strong className="text-xs font-bold text-indigo-700">{superCount}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 font-mono">Quota calculations exclude supernumerary allocations</span>
            <button
              onClick={() => setActiveNav('seat-ledger')}
              className="text-xs font-semibold text-[#315EAA] hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              Examine Seat Ledger <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Batch Filings History Stream (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-[#101C32] uppercase font-mono tracking-wider">
                  Cryptographic Filing Manifests
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Historical submission batches & SHA-256 blocks</p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {instSubmissions.length} Batches
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[460px] mt-2">
              {instSubmissions.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 font-mono">
                  No submissions recorded yet for this institution.
                </div>
              ) : (
                instSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedBatchId(sub.id)}
                    className="py-3 px-2 hover:bg-slate-50/70 rounded-lg transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-xs font-bold text-[#101C32]">{sub.id}</span>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded border font-bold ${
                          sub.status === 'RECONCILIATION_COMPLETE'
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : sub.status === 'REVIEW_REQUIRED'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {sub.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                      <span>Engine: <code className="text-slate-800 font-semibold">{sub.ruleEngineVersion}</code></span>
                      <span>Total: <strong className="text-slate-900 font-bold">{sub.totalRows}</strong> rows</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono pt-1 border-t border-slate-100">
                      <span className="text-teal-700 font-bold">✓ {sub.acceptedRows} Passed</span>
                      <span className="text-amber-700 font-bold">⚠ {sub.flaggedRows} Flagged</span>
                      <span className="text-red-700 font-bold">✗ {sub.rejectedRows} Rejected</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveNav('submission')}
              className="w-full py-2 px-3 bg-[#101C32] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Ingest New Academic Batch</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Batch Filing Manifest Inspection Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedBatchId)}
        onClose={() => setSelectedBatchId(null)}
        title={`Batch Filing Manifest: ${selectedBatchId}`}
        subtitle={`Institutional submission signed by ${currentInstitution.name}`}
      >
        {inspectingBatch && (
          <div className="space-y-4 text-xs font-sans">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Batch Identifier:</span>
                <span className="font-bold text-slate-900">{inspectingBatch.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-800">{inspectingBatch.timestamp.replace('T', ' ').slice(0, 19)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rules Engine:</span>
                <span className="text-[#315EAA] font-bold">{inspectingBatch.ruleEngineVersion}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-2 bg-teal-50 border border-teal-200 rounded">
                <span className="text-[10px] text-teal-700 block">Accepted</span>
                <strong className="text-sm font-bold text-teal-900">{inspectingBatch.acceptedRows}</strong>
              </div>
              <div className="p-2 bg-amber-50 border border-amber-200 rounded">
                <span className="text-[10px] text-amber-700 block">Flagged</span>
                <strong className="text-sm font-bold text-amber-900">{inspectingBatch.flaggedRows}</strong>
              </div>
              <div className="p-2 bg-red-50 border border-red-200 rounded">
                <span className="text-[10px] text-red-700 block">Rejected</span>
                <strong className="text-sm font-bold text-red-900">{inspectingBatch.rejectedRows}</strong>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-800">Sample Records in this Manifest:</span>
              <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded">
                {inspectingBatch.records.slice(0, 8).map((rec) => (
                  <div key={rec.id} className="p-2.5 flex items-center justify-between text-[11px]">
                    <div>
                      <div className="font-semibold text-slate-900">{rec.studentName}</div>
                      <span className="font-mono text-slate-400 text-[10px]">{rec.studentReference} · {rec.programmeCode}</span>
                    </div>
                    <span
                      className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                        rec.rowOutcome === 'ACCEPTED'
                          ? 'bg-teal-50 text-teal-800 border-teal-200'
                          : rec.rowOutcome === 'FLAGGED'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}
                    >
                      {rec.rowOutcome}
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
