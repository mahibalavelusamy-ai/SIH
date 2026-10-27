import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DuplicateCandidate } from '../types';
import { maskApaarId } from '../services/tperEngine';
import {
  GitCompare,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Eye,
  Filter,
  Lock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const TperReconciliationView: React.FC = () => {
  const { duplicateCandidates, institutions, setActiveNav } = useApp();

  const [selectedCandidate, setSelectedCandidate] = useState<DuplicateCandidate | null>(
    duplicateCandidates.length > 0 ? duplicateCandidates[0] : null
  );
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredCandidates = duplicateCandidates.filter((c) => {
    const matchStage = filterStage === 'ALL' || c.matchingStage === filterStage;
    const matchStatus = filterStatus === 'ALL' || c.status === filterStatus;
    return matchStage && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header and Technical Context Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              TPER Reconciliation Core Engine
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold border border-blue-200">
              Stages A–E
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Transfer-Aware, Privacy-Preserving Enrolment Reconciliation: Multi-stage identity hashing, temporal overlap detection, and transition logic.
          </p>
        </div>

        <button
          onClick={() => setActiveNav('exception-review')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-xs"
        >
          Open Adjudication Workspace <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 5-Stage Architectural Concept Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] font-mono uppercase text-blue-600 font-bold">Stage A</div>
          <div className="text-xs font-semibold text-slate-900 mt-1">Keyed Hash Normalization</div>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            Synthetic APAAR identifiers are normalized and masked using simulated HMAC keys. Raw IDs are never exposed in tables.
          </p>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] font-mono uppercase text-blue-600 font-bold">Stage B</div>
          <div className="text-xs font-semibold text-slate-900 mt-1">Temporal Overlap</div>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            Evaluates admission and session intervals. Missing end dates on active enrolments are checked as open-ended periods.
          </p>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] font-mono uppercase text-blue-600 font-bold">Stage C</div>
          <div className="text-xs font-semibold text-slate-900 mt-1">Transition Assessment</div>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            Checks transfer status, withdrawal dates, and waivers. If prior enrolment closed before new admission, flags are averted.
          </p>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] font-mono uppercase text-blue-600 font-bold">Stage D</div>
          <div className="text-xs font-semibold text-slate-900 mt-1">Heuristic Scoring</div>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            For missing APAAR records, combines Name (40), DOB (35), Temporal (15), and Programme (10) for explainable scores.
          </p>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] font-mono uppercase text-blue-600 font-bold">Stage E</div>
          <div className="text-xs font-semibold text-slate-900 mt-1">Human Resolution</div>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            Regulatory reviewers adjudicate flagged candidates with reason logging into an append-only audit journal.
          </p>
        </div>
      </div>

      {/* Privacy-Preserving Frontend Architecture Notice & Administrative Adjudication Principle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs flex items-start gap-3 border border-slate-800">
          <Lock className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
          <div className="leading-relaxed">
            <strong className="text-white block font-mono">Browser-Side Key Derivation Notice:</strong>
            Identity hashing in this client prototype is a mock abstraction. In production, HMAC secret keys and matching engines reside strictly within an isolated Hardware Security Module (HSM) or secure backend enclave.
          </div>
        </div>

        <div className="p-3 bg-blue-950/70 text-blue-100 rounded-lg text-xs flex items-start gap-3 border border-blue-800">
          <ShieldCheck className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
          <div className="leading-relaxed">
            <strong className="text-white block font-mono">Administrative Resolution Principle:</strong>
            A confirmed duplicate is an administrative finding to reconcile institutional seat quotas and student mobility records; it does NOT constitute an automated accusation of fraud. Records are never silently purged.
          </div>
        </div>
      </div>

      {/* Split View: Candidates List & Selected Candidate Diagnostic Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Candidates Table with Filters (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Detected Reconciliation Candidates</h2>
              <p className="text-xs text-slate-500">Cross-institutional pairings identified for review</p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 font-medium"
              >
                <option value="ALL">All Matching Stages</option>
                <option value="STAGE_A_KEYED">Stage A (Keyed APAAR Match)</option>
                <option value="STAGE_D_HEURISTIC">Stage D (Heuristic Multi-Signal)</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="LEGITIMATE_TRANSFER">Legitimate Transfer</option>
                <option value="CONFIRMED_DUPLICATE">Confirmed Duplicate</option>
                <option value="NEEDS_INFO">Needs Info</option>
                <option value="NOT_A_MATCH">Not a Match</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto divide-y divide-slate-100 flex-1">
            {filteredCandidates.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No duplicate candidates match the selected filters.
              </div>
            ) : (
              filteredCandidates.map((candidate, idx) => {
                const isSelected = selectedCandidate?.id === candidate.id;
                const isPending = candidate.status === 'PENDING_REVIEW';
                const instA = institutions.find((i) => i.id === candidate.recordA.institutionId);
                const instB = institutions.find((i) => i.id === candidate.recordB.institutionId);

                return (
                  <div
                    key={`${candidate.id}-${idx}`}
                    onClick={() => setSelectedCandidate(candidate)}
                    className={`p-3.5 cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                      isSelected ? 'bg-blue-50/60 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-900">{candidate.id}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                            candidate.matchingStage === 'STAGE_A_KEYED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}
                        >
                          {candidate.matchingStage === 'STAGE_A_KEYED' ? 'Stage A Keyed' : 'Stage D Heuristic'}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                            isPending
                              ? 'bg-amber-50 text-amber-700 border-amber-200 font-semibold'
                              : candidate.status === 'LEGITIMATE_TRANSFER'
                              ? 'bg-teal-50 text-teal-700 border-teal-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {candidate.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex items-center gap-2">
                        <span className="font-medium text-slate-800 truncate">{candidate.recordA.studentName}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {instA?.code || candidate.recordA.institutionId} ↔ {instB?.code || candidate.recordB.institutionId}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 line-clamp-1">{candidate.explanation}</div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono text-xs font-bold text-slate-900">
                        {candidate.confidenceScore}% Score
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {candidate.confidenceLevel} Priority
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Diagnostic Candidate Inspector (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          {selectedCandidate ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500">Candidate Inspector</span>
                  <h3 className="text-sm font-bold text-slate-900 font-mono">{selectedCandidate.id}</h3>
                </div>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {selectedCandidate.confidenceScore}% Confidence
                </span>
              </div>

              {/* Side-by-Side Record Comparison Mini-Cards */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-800">Conflicting Enrolment Records:</span>

                {/* Record A */}
                <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{selectedCandidate.recordA.studentName}</span>
                    <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                      {selectedCandidate.recordA.studentReference}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Institution: <strong className="text-slate-800">{selectedCandidate.recordA.institutionId}</strong> · Prog: <strong>{selectedCandidate.recordA.programmeCode}</strong>
                  </div>
                  <div className="text-slate-600 text-[11px] font-mono">
                    Admitted: {selectedCandidate.recordA.admissionDate} | Status: <span className="font-semibold">{selectedCandidate.recordA.enrolmentStatus}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Masked APAAR: {maskApaarId(selectedCandidate.recordA.apaarId)}
                  </div>
                </div>

                {/* Record B */}
                <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{selectedCandidate.recordB.studentName}</span>
                    <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                      {selectedCandidate.recordB.studentReference}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Institution: <strong className="text-slate-800">{selectedCandidate.recordB.institutionId}</strong> · Prog: <strong>{selectedCandidate.recordB.programmeCode}</strong>
                  </div>
                  <div className="text-slate-600 text-[11px] font-mono">
                    Admitted: {selectedCandidate.recordB.admissionDate} | Status: <span className="font-semibold">{selectedCandidate.recordB.enrolmentStatus}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Masked APAAR: {maskApaarId(selectedCandidate.recordB.apaarId)}
                  </div>
                </div>
              </div>

              {/* Signal Contribution Breakdown */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-800">Signal Contribution Breakdown:</span>
                <div className="space-y-1.5 text-xs font-mono">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                      <span>Name Similarity (Max 40)</span>
                      <span>{selectedCandidate.signalBreakdown.nameSimilarityScore} pts</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded overflow-hidden">
                      <div
                        style={{ width: `${(selectedCandidate.signalBreakdown.nameSimilarityScore / 40) * 100}%` }}
                        className="bg-blue-600 h-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                      <span>Exact Date of Birth Match (Max 35)</span>
                      <span>{selectedCandidate.signalBreakdown.dobExactMatchScore} pts</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded overflow-hidden">
                      <div
                        style={{ width: `${(selectedCandidate.signalBreakdown.dobExactMatchScore / 35) * 100}%` }}
                        className="bg-blue-600 h-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                      <span>Temporal Overlap Window (Max 15)</span>
                      <span>{selectedCandidate.signalBreakdown.temporalOverlapScore} pts</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded overflow-hidden">
                      <div
                        style={{ width: `${(selectedCandidate.signalBreakdown.temporalOverlapScore / 15) * 100}%` }}
                        className="bg-blue-600 h-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                      <span>Programme Field Similarity (Max 10)</span>
                      <span>{selectedCandidate.signalBreakdown.programmeSimilarityScore} pts</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded overflow-hidden">
                      <div
                        style={{ width: `${(selectedCandidate.signalBreakdown.programmeSimilarityScore / 10) * 100}%` }}
                        className="bg-blue-600 h-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnostic Explanation & Evidence */}
              <div className="p-3 bg-blue-50/50 rounded border border-blue-100 text-xs space-y-1">
                <span className="font-semibold text-blue-900 block">TPER Diagnostic Evaluation:</span>
                <p className="text-slate-700 leading-relaxed text-[11px]">{selectedCandidate.explanation}</p>
                {selectedCandidate.transferEvidence && (
                  <p className="text-blue-800 font-mono text-[10px] mt-1">
                    Transfer Evidence: {selectedCandidate.transferEvidence}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Select a candidate from the table to inspect multi-signal scoring.
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => setActiveNav('exception-review')}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors text-center"
            >
              Adjudicate This Case in Exception Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
