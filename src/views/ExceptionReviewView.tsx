import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DuplicateCandidate } from '../types';
import { maskApaarId } from '../services/tperEngine';
import {
  AlertOctagon,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileCheck,
  Search,
  Filter,
  ShieldAlert,
  ArrowRight,
  Clock,
  UserCheck,
} from 'lucide-react';

export const ExceptionReviewView: React.FC = () => {
  const {
    duplicateCandidates,
    institutions,
    role,
    permissions,
    resolveDuplicateCandidate,
    submissions,
  } = useApp();

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    duplicateCandidates.length > 0 ? duplicateCandidates[0].id : ''
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  // Adjudication action form state
  const [decisionReason, setDecisionReason] = useState<string>('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string>('');

  const activeCandidate = duplicateCandidates.find((c) => c.id === selectedCandidateId) || duplicateCandidates[0];

  // Filter queue
  const filteredCandidates = duplicateCandidates.filter((c) => {
    const matchSearch =
      searchTerm === '' ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.recordA.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.recordB.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.recordA.studentReference.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = filterStatus === 'ALL' || c.status === filterStatus;
    const matchSeverity = filterSeverity === 'ALL' || c.confidenceLevel === filterSeverity;

    return matchSearch && matchStatus && matchSeverity;
  });

  const canResolve =
    permissions.canResolveCrossInstitutionExceptions || permissions.canApproveInstitutionReview || role === 'SYSTEM_ADMIN';

  // Handle human resolution decision
  const handleAdjudicate = (
    newStatus: 'LEGITIMATE_TRANSFER' | 'NOT_A_MATCH' | 'NEEDS_INFO' | 'CONFIRMED_DUPLICATE'
  ) => {
    if (!decisionReason || decisionReason.trim().length < 5) {
      alert('Mandatory Requirement: Please provide a substantive regulatory reason (minimum 5 characters) for this adjudication decision.');
      return;
    }

    if (!canResolve) {
      alert(`Role ${role} does not possess authority to resolve cross-institutional exceptions.`);
      return;
    }

    const success = resolveDuplicateCandidate(activeCandidate.id, newStatus, decisionReason.trim());
    if (success) {
      setActionSuccessMessage(`Successfully updated candidate ${activeCandidate.id} to '${newStatus.replace(/_/g, ' ')}' with recorded audit log.`);
      setDecisionReason('');
      setTimeout(() => setActionSuccessMessage(''), 5000);
    }
  };

  const instA = activeCandidate ? institutions.find((i) => i.id === activeCandidate.recordA.institutionId) : null;
  const instB = activeCandidate ? institutions.find((i) => i.id === activeCandidate.recordB.institutionId) : null;

  return (
    <div className="space-y-6">
      {/* Header and Regulatory Role Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Exception Review Workspace</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Two-panel regulatory adjudication for potential double enrolments, unreleased transfers, and demographic collisions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-mono">Queue:</span>
          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {duplicateCandidates.filter((c) => c.status === 'PENDING_REVIEW').length} Pending
          </span>
          <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
            {duplicateCandidates.filter((c) => c.status === 'LEGITIMATE_TRANSFER').length} Resolved Transfers
          </span>
        </div>
      </div>

      {/* Permission alert if role cannot resolve */}
      {!canResolve && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Read-Only Mode:</strong> Your current demo role is <code>{role}</code>. Regulatory adjudication actions require <code>AICTE Regulatory Reviewer</code> or <code>System Administrator</code>.
          </span>
        </div>
      )}

      {/* Action Toast Feedback */}
      {actionSuccessMessage && (
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-md text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Split-Panel Workspace: Left Queue (5 cols) | Right Adjudication & Evidence (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
        {/* LEFT PANEL: SEARCHABLE EXCEPTION QUEUE (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {/* Search & Filter Bar */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/50 space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search candidate ID, student name, ref..."
                className="w-full text-xs bg-white border border-slate-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-1/2 text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="LEGITIMATE_TRANSFER">Legitimate Transfer</option>
                <option value="CONFIRMED_DUPLICATE">Confirmed Duplicate</option>
                <option value="NEEDS_INFO">Needs Info</option>
                <option value="NOT_A_MATCH">Not a Match</option>
              </select>

              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-1/2 text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-700"
              >
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
              </select>
            </div>
          </div>

          {/* Queue List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[620px]">
            {filteredCandidates.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No exceptions in the queue matching criteria.
              </div>
            ) : (
              filteredCandidates.map((c, idx) => {
                const isSelected = activeCandidate?.id === c.id;
                const isPending = c.status === 'PENDING_REVIEW';
                const iA = institutions.find((i) => i.id === c.recordA.institutionId);
                const iB = institutions.find((i) => i.id === c.recordB.institutionId);

                return (
                  <div
                    key={`${c.id}-${idx}`}
                    onClick={() => setSelectedCandidateId(c.id)}
                    className={`p-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/70 border-l-4 border-l-blue-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-slate-900">{c.id}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                          isPending
                            ? 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
                            : c.status === 'LEGITIMATE_TRANSFER'
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : c.status === 'CONFIRMED_DUPLICATE'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-slate-800 mt-1 truncate">
                      {c.recordA.studentName}
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      {iA?.code || c.recordA.institutionId} ↔ {iB?.code || c.recordB.institutionId}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                      <span>{c.matchingStage === 'STAGE_A_KEYED' ? 'Stage A Keyed' : 'Stage D Heuristic'}</span>
                      <span className="font-bold text-slate-600">{c.confidenceScore}% Score</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: TWO-RECORD COMPARISON, TIMELINE & ADJUDICATION (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between p-5 space-y-5">
          {activeCandidate ? (
            <div className="space-y-5">
              {/* Top Banner with Candidate Info & Rule */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 font-mono">{activeCandidate.id}</h2>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      Rule: {activeCandidate.matchedRuleId}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                      {activeCandidate.confidenceScore}% Confidence
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Stage: <strong>{activeCandidate.matchingStage.replace(/_/g, ' ')}</strong> · Masked Key:{' '}
                    <code className="text-slate-800 font-mono">{activeCandidate.maskedKey}</code>
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                      activeCandidate.status === 'PENDING_REVIEW'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : activeCandidate.status === 'LEGITIMATE_TRANSFER'
                        ? 'bg-teal-50 text-teal-800 border-teal-300'
                        : activeCandidate.status === 'CONFIRMED_DUPLICATE'
                        ? 'bg-red-50 text-red-800 border-red-300'
                        : 'bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    STATUS: {activeCandidate.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Two-Record Side-by-Side Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Institution A Record */}
                <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                    <span className="font-semibold text-slate-900 truncate">
                      {instA?.name || activeCandidate.recordA.institutionId}
                    </span>
                    <span className="font-mono text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">
                      {instA?.code || 'INST-A'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Student Name:</span>
                      <strong className="text-slate-900">{activeCandidate.recordA.studentName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Student Ref:</span>
                      <span className="font-mono text-slate-800">{activeCandidate.recordA.studentReference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">DOB:</span>
                      <span className="font-mono text-slate-800">{activeCandidate.recordA.dateOfBirth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Masked APAAR:</span>
                      <span className="font-mono text-slate-800">{maskApaarId(activeCandidate.recordA.apaarId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Programme:</span>
                      <span className="font-mono text-slate-800">{activeCandidate.recordA.programmeCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Admission Date:</span>
                      <span className="font-mono font-semibold text-slate-900">{activeCandidate.recordA.admissionDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Enrolment Status:</span>
                      <span className="font-semibold text-blue-700">{activeCandidate.recordA.enrolmentStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transfer Status:</span>
                      <span className="font-mono text-slate-800">{activeCandidate.recordA.transferStatus}</span>
                    </div>
                    {activeCandidate.recordA.transferEffectiveDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Transfer Date:</span>
                        <span className="font-mono text-slate-800">{activeCandidate.recordA.transferEffectiveDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Institution B Record */}
                <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                    <span className="font-semibold text-slate-900 truncate">
                      {instB?.name || activeCandidate.recordB.institutionId}
                    </span>
                    <span className="font-mono text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">
                      {instB?.code || 'INST-B'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Student Name:</span>
                      <strong className="text-slate-900">{activeCandidate.recordB.studentName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Student Ref:</span>
                      <span className="font-mono text-slate-800">{activeCandidate.recordB.studentReference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">DOB:</span>
                      <span className="font-mono text-slate-800">{activeCandidate.recordB.dateOfBirth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Masked APAAR:</span>
                      <span className="font-mono text-slate-800">{maskApaarId(activeCandidate.recordB.apaarId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Programme:</span>
                      <span className="font-mono text-slate-800">{activeCandidate.recordB.programmeCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Admission Date:</span>
                      <span className="font-mono font-semibold text-slate-900">{activeCandidate.recordB.admissionDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Enrolment Status:</span>
                      <span className="font-semibold text-blue-700">{activeCandidate.recordB.enrolmentStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transfer Status:</span>
                      <span className="font-mono text-slate-800">{activeCandidate.recordB.transferStatus}</span>
                    </div>
                    {activeCandidate.recordB.transferEffectiveDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Transfer Date:</span>
                        <span className="font-mono text-slate-800">{activeCandidate.recordB.transferEffectiveDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Temporal & Overlap Diagnostic Card */}
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-semibold text-slate-900">Temporal & Transition Analysis:</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px]">{activeCandidate.overlapInterval}</p>
                <p className="text-slate-600 leading-relaxed text-[11px]">{activeCandidate.explanation}</p>
              </div>

              {/* Decision History (Audit Continuity) */}
              {activeCandidate.decisionHistory.length > 0 && (
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-2">
                  <span className="font-semibold text-slate-900 block text-[11px]">Prior Adjudication History:</span>
                  <div className="space-y-1 divide-y divide-slate-200">
                    {activeCandidate.decisionHistory.map((dec) => (
                      <div key={dec.id} className="pt-1.5 text-[11px] space-y-0.5">
                        <div className="flex justify-between font-mono text-slate-500 text-[10px]">
                          <span>{dec.timestamp.replace('T', ' ').slice(0, 19)}</span>
                          <span>{dec.reviewerName}</span>
                        </div>
                        <div className="text-slate-800 font-medium">
                          Decision: <strong className="font-mono">{dec.newStatus.replace(/_/g, ' ')}</strong>
                        </div>
                        <div className="text-slate-600 italic">"{dec.reason}"</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Adjudication Action Box with Mandatory Reason */}
              <div className="p-4 bg-blue-50/40 rounded-lg border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Adjudicate Exception Case</span>
                  <span className="text-[10px] text-slate-500 font-mono">Mandatory Audit Logging</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Regulatory Justification / Adjudication Reason *
                  </label>
                  <textarea
                    rows={2}
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="Enter formal justification (e.g., Verified transfer certificate #TC-4892 from DTU registrar, or Referred to NITD for cancellation of duplicate entry)..."
                    disabled={!canResolve}
                    className="w-full text-xs bg-white border border-slate-300 rounded p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* 4 Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <button
                    onClick={() => handleAdjudicate('LEGITIMATE_TRANSFER')}
                    disabled={!canResolve}
                    className="py-2 px-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded text-xs font-medium transition-colors shadow-xs text-center"
                  >
                    Mark Legitimate Transfer
                  </button>

                  <button
                    onClick={() => handleAdjudicate('NOT_A_MATCH')}
                    disabled={!canResolve}
                    className="py-2 px-2.5 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded text-xs font-medium transition-colors shadow-xs text-center"
                  >
                    Mark Not a Match
                  </button>

                  <button
                    onClick={() => handleAdjudicate('NEEDS_INFO')}
                    disabled={!canResolve}
                    className="py-2 px-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded text-xs font-medium transition-colors shadow-xs text-center"
                  >
                    Request Information
                  </button>

                  <button
                    onClick={() => handleAdjudicate('CONFIRMED_DUPLICATE')}
                    disabled={!canResolve}
                    className="py-2 px-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded text-xs font-medium transition-colors shadow-xs text-center"
                  >
                    Confirm Duplicate (Refer)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400">
              Select an exception case from the queue to review evidence and adjudicate.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
