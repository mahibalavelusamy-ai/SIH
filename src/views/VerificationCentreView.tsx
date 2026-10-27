import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VerificationRequest, VerificationOutcome } from '../types';
import { maskApaarId } from '../services/tperEngine';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  History,
  Lock,
  ArrowRight,
} from 'lucide-react';

export const VerificationCentreView: React.FC = () => {
  const {
    institutions,
    programmes,
    selectedInstitutionId,
    selectedAcademicYear,
    verificationRequests,
    executeVerificationQuery,
    role,
    permissions,
  } = useApp();

  // Query form state
  const [searchType, setSearchType] = useState<'STUDENT_REF' | 'APAAR_ID'>('STUDENT_REF');
  const [searchValue, setSearchValue] = useState<string>('2026-NITD-CS-001');
  const [targetInstId, setTargetInstId] = useState<string>(selectedInstitutionId);
  const [targetAcademicYear, setTargetAcademicYear] = useState<string>(selectedAcademicYear);
  const [targetProgramme, setTargetProgramme] = useState<string>('');

  const [activeResult, setActiveResult] = useState<VerificationRequest | null>(
    verificationRequests.length > 0 ? verificationRequests[0] : null
  );

  const handleQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue || searchValue.trim() === '') {
      alert('Please enter a student reference or APAAR ID to query.');
      return;
    }

    const res = executeVerificationQuery(
      searchType,
      searchValue.trim(),
      targetInstId,
      targetAcademicYear,
      targetProgramme || undefined
    );

    setActiveResult(res);
  };

  // Quick preset test samples
  const handleLoadPreset = (type: 'STUDENT_REF' | 'APAAR_ID', val: string, instId: string) => {
    setSearchType(type);
    setSearchValue(val);
    setTargetInstId(instId);
  };

  return (
    <div className="space-y-6">
      {/* Header and Mock Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Authorised Verification Centre</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Privacy-safe mock query adapter for verifying bona fide student enrolments and academic standing.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
            Policy: Zero Direct Database Leakage
          </span>
        </div>
      </div>

      {/* Persistent Mock Disclaimer */}
      <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-900 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          <strong className="text-amber-950">Mock Verifier Simulation:</strong> No live connection to APAAR or national identity databases exists. Verification requests are evaluated strictly against certified institutional submissions in this demonstration environment. Identifiers are masked in results and audit logs.
        </div>
      </div>

      {/* Role Permission Alert when unauthorized */}
      {!permissions.canVerifyStudents && role !== 'SYSTEM_ADMIN' && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Read-Only Access:</strong> Current demo role <code>{role}</code> does not possess student verification privileges. To execute live mock queries, select <strong>Verification Officer</strong>, <strong>AICTE Regulatory Reviewer</strong>, or <strong>System Administrator</strong> in the top-bar role switcher.
          </span>
        </div>
      )}

      {/* Main Grid: Query Form & Verification Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Verification Form (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Enrolment Query Parameters</h2>
            <span className="text-[10px] font-mono text-slate-400">REST API Facade</span>
          </div>

          <form onSubmit={handleQuery} className="space-y-4">
            {/* Search Type Radio */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Identifier Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSearchType('STUDENT_REF')}
                  className={`py-1.5 px-3 rounded text-xs font-medium border text-center transition-colors ${
                    searchType === 'STUDENT_REF'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Student Reference ID
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('APAAR_ID')}
                  className={`py-1.5 px-3 rounded text-xs font-medium border text-center transition-colors ${
                    searchType === 'APAAR_ID'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  APAAR ID (12-Digit)
                </button>
              </div>
            </div>

            {/* Search Value */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {searchType === 'STUDENT_REF' ? 'Student Registration / Roll Number' : '12-Digit Numeric APAAR ID'} *
              </label>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={searchType === 'STUDENT_REF' ? 'e.g. 2026-NITD-CS-001' : 'e.g. 910283741001'}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Institution Select */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Target Institution *</label>
              <select
                value={targetInstId}
                onChange={(e) => setTargetInstId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {institutions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.code} — {i.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Session */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Academic Year</label>
                <select
                  value={targetAcademicYear}
                  onChange={(e) => setTargetAcademicYear(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 font-mono text-slate-800"
                >
                  <option value="2026-27">AY 2026-27</option>
                  <option value="2025-26">AY 2025-26</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Programme (Optional)</label>
                <select
                  value={targetProgramme}
                  onChange={(e) => setTargetProgramme(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-mono"
                >
                  <option value="">Any Programme</option>
                  {programmes.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={!permissions.canVerifyStudents && role !== 'SYSTEM_ADMIN'}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded text-xs font-medium transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              {permissions.canVerifyStudents || role === 'SYSTEM_ADMIN' ? (
                <>
                  <Search className="w-3.5 h-3.5" />
                  Execute Verification Request
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Verification Clearance Required ({role})
                </>
              )}
            </button>
          </form>

          {/* Preset Buttons for Quick Testing */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
              Quick Test Cases (Demonstrating All 3 Outcomes):
            </span>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleLoadPreset('STUDENT_REF', '2026-NITD-CS-001', 'INST-001')}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px]"
              >
                1. Clean Active (VERIFIED)
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset('STUDENT_REF', 'NON-EXISTENT-REF-99', 'INST-001')}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px]"
              >
                2. Missing Ref (NOT VERIFIED)
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset('APAAR_ID', '748392019421', 'INST-001')}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px]"
              >
                3. Open TPER Duplicate (UNABLE TO VERIFY)
              </button>
            </div>
          </div>
        </div>

        {/* Minimalist Privacy-Safe Result Card (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-lg border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Verification Response Certificate</h2>
              {activeResult && (
                <span className="text-[10px] font-mono text-slate-500">Ref: {activeResult.id}</span>
              )}
            </div>

            {activeResult ? (
              <div className="mt-5 space-y-4">
                {/* Result Status Banner: strictly VERIFIED, NOT_VERIFIED, UNABLE_TO_VERIFY */}
                <div
                  className={`p-4 rounded-lg border text-center space-y-1 ${
                    activeResult.result === 'VERIFIED'
                      ? 'bg-teal-50 border-teal-200 text-teal-900'
                      : activeResult.result === 'NOT_VERIFIED'
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {activeResult.result === 'VERIFIED' && <CheckCircle2 className="w-5 h-5 text-teal-600" />}
                    {activeResult.result === 'NOT_VERIFIED' && <XCircle className="w-5 h-5 text-red-600" />}
                    {activeResult.result === 'UNABLE_TO_VERIFY' && <HelpCircle className="w-5 h-5 text-amber-600" />}
                    <span className="text-base font-bold font-mono tracking-wide">
                      {activeResult.result.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-medium opacity-80">
                    Reason Code: {activeResult.reasonCode}
                  </div>
                </div>

                {/* Explanation text */}
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700 space-y-1">
                  <span className="font-semibold text-slate-900 block">Response Statement:</span>
                  <p className="leading-relaxed">{activeResult.reasonDescription}</p>
                </div>

                {/* Privacy-safe matched details snippet */}
                {activeResult.matchedRecordSnippet && (
                  <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1.5 font-mono">
                    <span className="font-semibold text-slate-900 block font-sans">
                      Permitted Disclosure Record:
                    </span>
                    <div className="flex justify-between text-slate-600">
                      <span>Student Ref:</span>
                      <strong className="text-slate-900">{activeResult.matchedRecordSnippet.studentReference}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Masked Identity:</span>
                      <strong className="text-slate-900">{activeResult.matchedRecordSnippet.maskedApaarId}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Institution:</span>
                      <span className="text-slate-800 truncate max-w-[200px]">
                        {activeResult.matchedRecordSnippet.institutionName}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Programme:</span>
                      <strong className="text-slate-900">{activeResult.matchedRecordSnippet.programmeCode}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Status:</span>
                      <strong className="text-teal-700">{activeResult.matchedRecordSnippet.enrolmentStatus}</strong>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400">
                Submit an enrolment verification request on the left to view the signed response certificate.
              </div>
            )}
          </div>

          {activeResult && (
            <div className="pt-4 border-t border-slate-100 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Timestamp: {activeResult.timestamp.replace('T', ' ').slice(0, 19)}</span>
              <span>Officer: {activeResult.officerName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Query Audit Journal Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Recent Verification Query Journal</h3>
            <p className="text-xs text-slate-500">Every external verification attempt is cryptographically logged in the audit trail</p>
          </div>
          <span className="text-xs font-mono text-slate-500">{verificationRequests.length} Queries Logged</span>
        </div>

        <div className="overflow-x-auto max-h-[300px]">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Request ID</th>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Queried Identifier</th>
                <th className="py-2 px-3">Institution</th>
                <th className="py-2 px-3">Outcome</th>
                <th className="py-2 px-3">Reason Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {verificationRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-semibold text-slate-900">{req.id}</td>
                  <td className="py-2 px-3 text-slate-500">{req.timestamp.replace('T', ' ').slice(0, 19)}</td>
                  <td className="py-2 px-3 text-slate-800">{req.maskedSearchValue}</td>
                  <td className="py-2 px-3 text-slate-600">{req.institutionId}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                        req.result === 'VERIFIED'
                          ? 'bg-teal-50 text-teal-800 border-teal-200'
                          : req.result === 'NOT_VERIFIED'
                          ? 'bg-red-50 text-red-800 border-red-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {req.result.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-600 text-[11px]">{req.reasonCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
