import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertTriangle,
  GitCompare,
  XCircle,
  Clock,
  ArrowRight,
  X,
  CheckCircle2,
  Building2,
  FileSpreadsheet,
  AlertOctagon,
} from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const {
    duplicateCandidates,
    intakeLimits,
    records,
    setActiveNav,
    setSelectedInstitutionId,
  } = useApp();

  const openDuplicates = duplicateCandidates.filter((c) => c.status === 'PENDING_REVIEW');

  // Intake breaches
  const breaches = intakeLimits.filter((limit) => {
    const regularEnrolments = records.filter(
      (r) =>
        r.institutionId === limit.institutionId &&
        r.programmeCode === limit.programmeCode &&
        r.academicYear === limit.academicYear &&
        !r.supernumeraryFlag &&
        r.enrolmentStatus === 'ACTIVE' &&
        r.rowOutcome !== 'REJECTED'
    );
    return regularEnrolments.length > limit.approvedRegularIntake;
  });

  // Rejected records
  const rejectedRecords = records.filter((r) => r.rowOutcome === 'REJECTED');

  const totalUrgentCount = openDuplicates.length + breaches.length + (rejectedRecords.length > 0 ? 1 : 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-2xs transition-opacity animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col z-10">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#101C32]">Action-Required Triage Desk</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                {totalUrgentCount} Urgent
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              Regulatory discrepancies and human adjudication tasks requiring officer decision
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Triage List */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1 divide-y divide-slate-100">
          {/* Section 1: Quota Breaches */}
          {breaches.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-red-600 font-bold block flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5" />
                Statutory Quota Breaches ({breaches.length})
              </span>
              {breaches.map((b) => (
                <div key={b.id} className="p-3 rounded-lg bg-red-50/50 border border-red-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-950">{b.programmeCode} at {b.institutionId}</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-800">
                      Rule V-09
                    </span>
                  </div>
                  <p className="text-xs text-red-800 leading-snug">
                    Reported active regular enrolments exceed AICTE sanctioned capacity (+8 seats in Northstar B.Sc CS).
                  </p>
                  <button
                    onClick={() => {
                      setActiveNav('seat-ledger');
                      onClose();
                    }}
                    className="w-full py-1.5 px-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>Examine Quota Cell & Issue Notice</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Section 2: TPER Duplicate Review Queue */}
          {openDuplicates.length > 0 && (
            <div className="space-y-2 pt-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 font-bold block flex items-center gap-1.5">
                <GitCompare className="w-3.5 h-3.5 text-amber-600" />
                Pending Duplicate Candidates ({openDuplicates.length})
              </span>
              <div className="space-y-2">
                {openDuplicates.slice(0, 3).map((c) => (
                  <div key={c.id} className="p-3 rounded-lg bg-amber-50/40 border border-amber-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900">{c.id}</span>
                      <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-semibold">
                        {c.confidenceScore}% Confidence
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800">{c.recordA.studentName}</div>
                    <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                      {c.explanation}
                    </p>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">
                        {c.recordA.institutionId} ↔ {c.recordB.institutionId}
                      </span>
                      <button
                        onClick={() => {
                          setActiveNav('exception-review');
                          onClose();
                        }}
                        className="text-xs font-semibold text-[#315EAA] hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                      >
                        Adjudicate <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Statutory Validation Blocking Records */}
          {rejectedRecords.length > 0 && (
            <div className="space-y-2 pt-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-700 font-bold block flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-[#C94C4C]" />
                Ingestion Quality Rejections ({rejectedRecords.length} Rows)
              </span>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <p className="text-slate-600 leading-snug">
                  8 records failed mandatory criteria (Rule V-01: Blank student names, Rule V-06: Age outside statutory bounds).
                </p>
                <button
                  onClick={() => {
                    setActiveNav('submission');
                    onClose();
                  }}
                  className="w-full py-1.5 px-2 bg-[#101C32] hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Open Resubmission Workspace</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Quick Action */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs flex items-center justify-between font-mono text-slate-500">
          <span>AICTE Governance Protocol</span>
          <button
            onClick={() => {
              setActiveNav('overview');
              onClose();
            }}
            className="text-[#315EAA] hover:underline font-semibold"
          >
            Executive Dashboard →
          </button>
        </div>
      </div>
    </div>
  );
};

