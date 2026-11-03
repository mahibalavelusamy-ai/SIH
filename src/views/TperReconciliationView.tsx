import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DuplicateCandidate } from '../types';
import { maskApaarId } from '../services/tperEngine';
import { PageHeader } from '../components/ui/PageHeader';
import {
  GitCompare,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Filter,
  Lock,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  ArrowRightLeft,
  Sliders,
  Scale,
  Award,
  FileCheck,
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

  const instA = selectedCandidate ? institutions.find((i) => i.id === selectedCandidate.recordA.institutionId) : null;
  const instB = selectedCandidate ? institutions.find((i) => i.id === selectedCandidate.recordB.institutionId) : null;

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'IDVERA' },
          { label: 'Reconciliation' },
          { label: 'TPER Engine' },
        ]}
        title="TPER Temporal & Protected Enrolment Reconciliation"
        subtitle="Transfer-Aware, Privacy-Preserving Enrolment Reconciliation: Multi-stage identity hashing, temporal overlap algebra, and explainable multi-signal scoring."
        badge={
          <span className="font-mono text-[11px] text-[#315EAA] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded font-semibold flex items-center gap-1.5">
            <GitCompare className="w-3.5 h-3.5 text-[#315EAA]" />
            STAGES A–E ACTIVE
          </span>
        }
        actions={
          <button
            onClick={() => setActiveNav('exception-review')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#101C32] hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <span>Open Adjudication Desk</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#315EAA]" />
          </button>
        }
      />

      {/* 5-Stage Architectural Concept Strip (Editorial Stepper) */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#315EAA] font-bold">Stage A</span>
            <span className="w-2 h-2 rounded-full bg-[#315EAA]" />
          </div>
          <div className="text-xs font-bold text-[#101C32]">Keyed Hash Token</div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Deterministic salted HMAC masking of student APAAR IDs. Raw numbers are never exposed in public tables.
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#315EAA] font-bold">Stage B</span>
            <span className="w-2 h-2 rounded-full bg-[#315EAA]" />
          </div>
          <div className="text-xs font-bold text-[#101C32]">Temporal Overlap</div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Calculates continuous date intervals [T_admission, T_release]. Missing end dates on active enrolments are flagged.
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#168C83] font-bold">Stage C</span>
            <span className="w-2 h-2 rounded-full bg-[#168C83]" />
          </div>
          <div className="text-xs font-bold text-[#101C32]">Transition Logic</div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Evaluates transfer NOCs and withdrawal slips. Prior enrolments closing before new admission are cleared.
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-indigo-700 font-bold">Stage D</span>
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
          </div>
          <div className="text-xs font-bold text-[#101C32]">Heuristic Scoring</div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Multi-signal scoring (Name 40, DOB 35, Temporal 15, Prog 10) resolves fuzzy demographic spellings.
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#D99032] font-bold">Stage E</span>
            <span className="w-2 h-2 rounded-full bg-[#D99032]" />
          </div>
          <div className="text-xs font-bold text-[#101C32]">Human Resolution</div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Regulatory officers adjudicate candidates with reason logging into an append-only SHA-256 audit ledger.
          </p>
        </div>
      </div>

      {/* Dual Context Banner (Security Notice + Administrative Intent) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3.5 bg-[#101C32] text-slate-200 rounded-xl text-xs flex items-start gap-3 border border-slate-800 shadow-2xs">
          <Lock className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
          <div className="leading-relaxed">
            <strong className="text-white block font-mono">Zero-Knowledge Key Derivation Standard:</strong>
            Identity hashing in this demonstration runs client-side. In production, HMAC secret keys and temporal intersection algorithms execute inside isolated Hardware Security Modules (FIPS 140-3 Level 3).
          </div>
        </div>

        <div className="p-3.5 bg-blue-950/70 text-blue-100 rounded-xl text-xs flex items-start gap-3 border border-blue-800 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
          <div className="leading-relaxed">
            <strong className="text-white block font-mono">Adjudication Principle:</strong>
            A detected candidate is an administrative finding to reconcile institutional seat quotas and student mobility records; it does NOT constitute an accusation of fraud. Student rights are protected.
          </div>
        </div>
      </div>

      {/* Split Resolution Workbench: Left Queue vs Right Side-by-Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Candidates Table with Stage & Status Filters (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h2 className="text-xs font-bold text-[#101C32] uppercase font-mono tracking-wider">
                  Collision Review Queue
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Cross-institutional pairings identified for review</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 font-medium"
                >
                  <option value="ALL">All Stages</option>
                  <option value="STAGE_A_KEYED">Stage A Keyed</option>
                  <option value="STAGE_D_HEURISTIC">Stage D Heuristic</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 font-medium"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING_REVIEW">Pending</option>
                  <option value="LEGITIMATE_TRANSFER">Legitimate Transfer</option>
                  <option value="CONFIRMED_DUPLICATE">Confirmed Duplicate</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[520px]">
              {filteredCandidates.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-mono">
                  No duplicate candidates match the selected filters.
                </div>
              ) : (
                filteredCandidates.map((candidate, idx) => {
                  const isSelected = selectedCandidate?.id === candidate.id;
                  const isPending = candidate.status === 'PENDING_REVIEW';
                  const cInstA = institutions.find((i) => i.id === candidate.recordA.institutionId);
                  const cInstB = institutions.find((i) => i.id === candidate.recordB.institutionId);

                  return (
                    <div
                      key={`${candidate.id}-${idx}`}
                      onClick={() => setSelectedCandidate(candidate)}
                      className={`p-3.5 cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                        isSelected ? 'bg-blue-50/80 border-l-4 border-l-[#315EAA]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-[#101C32]">{candidate.id}</span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                              candidate.matchingStage === 'STAGE_A_KEYED'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}
                          >
                            {candidate.matchingStage === 'STAGE_A_KEYED' ? 'Stage A Keyed' : 'Stage D Heuristic'}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold ${
                              isPending
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : candidate.status === 'LEGITIMATE_TRANSFER'
                                ? 'bg-teal-50 text-teal-800 border-teal-300'
                                : 'bg-red-50 text-red-800 border-red-300'
                            }`}
                          >
                            {candidate.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700 flex items-center gap-2">
                          <span className="font-bold text-slate-900 truncate">{candidate.recordA.studentName}</span>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {cInstA?.code || candidate.recordA.institutionId} ↔ {cInstB?.code || candidate.recordB.institutionId}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 line-clamp-1">{candidate.explanation}</div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-xs font-bold text-[#101C32]">
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

          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 font-mono">
              {filteredCandidates.length} Candidates in view
            </span>
            <button
              onClick={() => setActiveNav('exception-review')}
              className="text-xs font-semibold text-[#315EAA] hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              Adjudicate Queue <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right Column: Comprehensive Side-by-Side Dual Record Comparison (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
          {selectedCandidate ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Side-by-Side Enrolment Comparison</span>
                  <h3 className="text-sm font-bold text-[#101C32] font-mono">{selectedCandidate.id}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#315EAA] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedCandidate.confidenceScore}% Confidence
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-300">
                    {selectedCandidate.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Side-by-Side Dual Dossier Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Record A */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-mono text-[10px] font-bold text-[#315EAA] uppercase">Campus A (Prior)</span>
                    <span className="font-mono text-[10px] bg-white border border-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                      {selectedCandidate.recordA.studentReference}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{selectedCandidate.recordA.studentName}</div>
                    <div className="text-slate-500 text-[11px]">
                      {instA?.name || selectedCandidate.recordA.institutionId}
                    </div>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Programme:</span>
                      <strong className="text-slate-800">{selectedCandidate.recordA.programmeCode}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Admitted:</span>
                      <strong className="text-slate-800">{selectedCandidate.recordA.admissionDate}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <strong className="text-teal-700">{selectedCandidate.recordA.enrolmentStatus}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Masked APAAR:</span>
                      <strong className="text-slate-600">{maskApaarId(selectedCandidate.recordA.apaarId)}</strong>
                    </div>
                  </div>
                </div>

                {/* Record B */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-mono text-[10px] font-bold text-indigo-700 uppercase">Campus B (Concurrent)</span>
                    <span className="font-mono text-[10px] bg-white border border-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                      {selectedCandidate.recordB.studentReference}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{selectedCandidate.recordB.studentName}</div>
                    <div className="text-slate-500 text-[11px]">
                      {instB?.name || selectedCandidate.recordB.institutionId}
                    </div>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Programme:</span>
                      <strong className="text-slate-800">{selectedCandidate.recordB.programmeCode}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Admitted:</span>
                      <strong className="text-slate-800">{selectedCandidate.recordB.admissionDate}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <strong className="text-teal-700">{selectedCandidate.recordB.enrolmentStatus}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Masked APAAR:</span>
                      <strong className="text-slate-600">{maskApaarId(selectedCandidate.recordB.apaarId)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Signal Contribution Breakdown */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-[#101C32]">Multi-Signal Evidence Contribution:</span>
                <div className="space-y-2 text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Name Similarity (Max 40 pts)</span>
                      <strong className="text-[#315EAA]">{selectedCandidate.signalBreakdown.nameSimilarityScore} pts</strong>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded overflow-hidden">
                      <div
                        style={{ width: `${(selectedCandidate.signalBreakdown.nameSimilarityScore / 40) * 100}%` }}
                        className="bg-[#315EAA] h-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Exact Date of Birth Match (Max 35 pts)</span>
                      <strong className="text-[#315EAA]">{selectedCandidate.signalBreakdown.dobExactMatchScore} pts</strong>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded overflow-hidden">
                      <div
                        style={{ width: `${(selectedCandidate.signalBreakdown.dobExactMatchScore / 35) * 100}%` }}
                        className="bg-[#315EAA] h-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Temporal Overlap Window (Max 15 pts)</span>
                      <strong className="text-[#315EAA]">{selectedCandidate.signalBreakdown.temporalOverlapScore} pts</strong>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded overflow-hidden">
                      <div
                        style={{ width: `${(selectedCandidate.signalBreakdown.temporalOverlapScore / 15) * 100}%` }}
                        className="bg-[#315EAA] h-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Programme Field Similarity (Max 10 pts)</span>
                      <strong className="text-[#315EAA]">{selectedCandidate.signalBreakdown.programmeSimilarityScore} pts</strong>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded overflow-hidden">
                      <div
                        style={{ width: `${(selectedCandidate.signalBreakdown.programmeSimilarityScore / 10) * 100}%` }}
                        className="bg-[#315EAA] h-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Explainable Diagnostic Evaluation */}
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-xs space-y-1">
                <span className="font-bold text-[#101C32] block">Regulatory Diagnostic Finding:</span>
                <p className="text-slate-700 leading-relaxed text-[11px]">{selectedCandidate.explanation}</p>
                {selectedCandidate.transferEvidence && (
                  <p className="text-[#315EAA] font-mono text-[10px] mt-1 font-semibold">
                    Documented Evidence: {selectedCandidate.transferEvidence}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 font-mono">
              Select a candidate from the review queue to inspect side-by-side comparison.
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 mt-4">
            <button
              onClick={() => setActiveNav('exception-review')}
              className="w-full py-2.5 bg-[#315EAA] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors text-center cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
            >
              <span>Launch Adjudication Workspace for This Case</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
