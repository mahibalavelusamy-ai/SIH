import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VerificationRequest, VerificationOutcome } from '../types';
import { maskApaarId } from '../services/tperEngine';
import { PageHeader } from '../components/ui/PageHeader';
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
  Award,
  Fingerprint,
  QrCode,
  Building2,
  FileCheck2,
  Calendar,
} from 'lucide-react';

export const VerificationCentreView: React.FC = () => {
  const {
    institutions,
    programmes,
    selectedInstitutionId,
    selectedAcademicYear,
    verificationRequests,
    executeVerificationQuery,
  } = useApp();

  // Query form state
  const [searchType, setSearchType] = useState<'STUDENT_REF' | 'APAAR_ID'>('STUDENT_REF');
  const [searchValue, setSearchValue] = useState<string>('2026-NST-CS-001');
  const [targetInstId, setTargetInstId] = useState<string>(selectedInstitutionId);
  const [targetAcademicYear, setTargetAcademicYear] = useState<string>(selectedAcademicYear);
  const [targetProgramme, setTargetProgramme] = useState<string>('');
  const [queryPurpose, setQueryPurpose] = useState<string>('EMPLOYMENT_VERIFICATION');

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
      {/* Editorial Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'IDVERA' },
          { label: 'Verification' },
          { label: 'Authorised Centre' },
        ]}
        title="Authorised Academic Verification Terminal"
        subtitle="Zero-knowledge, minimum-disclosure query portal for verifying bona fide student enrolments and statutory academic standing."
        badge={
          <span className="font-mono text-[11px] text-[#315EAA] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded font-semibold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#315EAA]" />
            MINIMUM-DISCLOSURE CONTRACT
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded shadow-2xs">
              Tri-State Statutory Protocol
            </span>
          </div>
        }
      />

      {/* Persistent Mock Disclaimer & Statutory Safeguard */}
      <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
        <AlertTriangle className="w-4 h-4 text-[#D99032] mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          <strong className="text-amber-950 block font-mono">Mock Verifier Demonstration Environment:</strong>
          No live network connection to APAAR or national identity databases exists. Verification queries are evaluated strictly against certified institutional submissions in this demonstration environment. Plaintext PII is masked in results and audit journals.
        </div>
      </div>

      {/* THREE POSSIBLE OUTCOMES STATUTORY REFERENCE GUIDE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#315EAA]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#101C32] font-mono">
              The Three Statutory Verification Outcomes & Their Regulatory Meaning
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Zero-Knowledge Output Contract</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* VERIFIED */}
          <div className="p-3.5 rounded-lg border border-teal-200 bg-teal-50/30 space-y-1.5">
            <div className="flex items-center gap-1.5 text-teal-800 font-bold font-mono text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#168C83]" />
              <span>1. VERIFIED</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Student reference exactly matches an active, certified enrolment in the verified institutional ledger with no unreleased cross-campus collisions.
            </p>
            <div className="text-[10px] font-mono text-teal-700 font-semibold pt-1">
              Eligible for employment & credit transfers
            </div>
          </div>

          {/* NOT_VERIFIED */}
          <div className="p-3.5 rounded-lg border border-red-200 bg-red-50/30 space-y-1.5">
            <div className="flex items-center gap-1.5 text-red-800 font-bold font-mono text-xs">
              <XCircle className="w-4 h-4 text-[#C94C4C]" />
              <span>2. NOT_VERIFIED</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              No active enrolment record exists matching this student reference and institution code for the specified academic year.
            </p>
            <div className="text-[10px] font-mono text-red-700 font-semibold pt-1">
              Credential rejected; re-check reference ID
            </div>
          </div>

          {/* UNABLE_TO_VERIFY */}
          <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/30 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-800 font-bold font-mono text-xs">
              <HelpCircle className="w-4 h-4 text-[#D99032]" />
              <span>3. UNABLE_TO_VERIFY</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Record is locked under an open TPER duplicate collision, regulatory review, or incomplete transfer audit. Verification is temporarily withheld.
            </p>
            <div className="text-[10px] font-mono text-amber-700 font-semibold pt-1">
              Administrative hold; registrar review required
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Query Form (Terminal) vs Digital Response Certificate */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Verification Query Terminal Form (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-5">
          <form onSubmit={handleQuery} className="space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#101C32]">Verification Query Station</h2>
                <p className="text-[11px] text-slate-500">Query verified enrolment status without accessing private student files</p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                SSL / TLS 1.3
              </span>
            </div>

            {/* Purpose Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Statutory Purpose of Query:</label>
              <select
                value={queryPurpose}
                onChange={(e) => setQueryPurpose(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#315EAA]"
              >
                <option value="EMPLOYMENT_VERIFICATION">Employment Background Screening</option>
                <option value="UNIVERSITY_TRANSFER">Higher Education Institution Transfer</option>
                <option value="SCHOLARSHIP_GRANT">Government Scholarship & Welfare Disbursal</option>
                <option value="REGULATORY_AUDIT">AICTE / Council Statutory Compliance Audit</option>
              </select>
            </div>

            {/* Search Identifier Type & Value */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Verification Identifier:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSearchType('STUDENT_REF')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                    searchType === 'STUDENT_REF'
                      ? 'bg-[#101C32] text-white border-[#101C32]'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Student Reference ID
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('APAAR_ID')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                    searchType === 'APAAR_ID'
                      ? 'bg-[#101C32] text-white border-[#101C32]'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  12-Digit APAAR ID
                </button>
              </div>

              <div className="relative mt-1">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={searchType === 'STUDENT_REF' ? 'e.g. 2026-NST-CS-001' : 'e.g. 910283741001'}
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#315EAA] focus:border-transparent"
                />
              </div>
            </div>

            {/* Target Campus and Academic Session */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Host Campus:</label>
                <select
                  value={targetInstId}
                  onChange={(e) => setTargetInstId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#315EAA]"
                >
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.code} — {i.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Academic Session:</label>
                <select
                  value={targetAcademicYear}
                  onChange={(e) => setTargetAcademicYear(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#315EAA]"
                >
                  <option value="2026-27">AY 2026-27</option>
                  <option value="2025-26">AY 2025-26</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2.5 bg-[#315EAA] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Execute Statutory Verification Query</span>
            </button>
          </form>

          {/* 1-Click Interactive Test Cases */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 block">
              1-Click Interactive Demonstration Scenarios:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleLoadPreset('STUDENT_REF', '2026-NST-CS-001', 'INST-001')}
                className="p-2 rounded-lg border border-teal-200 bg-teal-50/50 hover:bg-teal-100/50 text-left transition-colors cursor-pointer"
              >
                <div className="text-[10px] font-mono font-bold text-[#168C83]">✓ VERIFIED</div>
                <div className="text-[11px] font-mono text-slate-700 font-semibold truncate">2026-NST-CS-001</div>
                <div className="text-[9px] text-slate-500">Active bona fide</div>
              </button>

              <button
                type="button"
                onClick={() => handleLoadPreset('STUDENT_REF', '2026-NST-CS-003', 'INST-001')}
                className="p-2 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-100/50 text-left transition-colors cursor-pointer"
              >
                <div className="text-[10px] font-mono font-bold text-[#C94C4C]">✗ NOT_VERIFIED</div>
                <div className="text-[11px] font-mono text-slate-700 font-semibold truncate">2026-NST-CS-003</div>
                <div className="text-[9px] text-slate-500">Rejected / No record</div>
              </button>

              <button
                type="button"
                onClick={() => handleLoadPreset('STUDENT_REF', '2026-NST-CS-002', 'INST-001')}
                className="p-2 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-100/50 text-left transition-colors cursor-pointer"
              >
                <div className="text-[10px] font-mono font-bold text-[#D99032]">⚠ UNABLE_TO_VERIFY</div>
                <div className="text-[11px] font-mono text-slate-700 font-semibold truncate">2026-NST-CS-002</div>
                <div className="text-[9px] text-slate-500">Collision / Audit hold</div>
              </button>
            </div>
          </div>
        </div>

        {/* Digital Verification Credential Certificate Card (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-purple-50 text-purple-800 border border-purple-200">
                  DIGITAL CREDENTIAL
                </span>
                <h2 className="text-sm font-bold text-[#101C32]">Verification Response Certificate</h2>
              </div>
              {activeResult && (
                <span className="text-[10px] font-mono text-slate-500">Token: {activeResult.id}</span>
              )}
            </div>

            <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-500 leading-tight font-sans">
              <strong>MOCK CERTIFICATE NOTICE:</strong> This is a synthetic mock credential generated by IDVERA prototype for demonstration purposes. Minimum-disclosure responses policy strictly enforced.
            </div>

            {activeResult ? (
              <div className="mt-4 space-y-4">
                {/* Status Outcome Banner */}
                <div
                  className={`p-4 rounded-xl border text-center space-y-1 shadow-2xs ${
                    activeResult.result === 'VERIFIED'
                      ? 'bg-teal-50 border-teal-200 text-teal-900'
                      : activeResult.result === 'NOT_VERIFIED'
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {activeResult.result === 'VERIFIED' && <CheckCircle2 className="w-6 h-6 text-[#168C83]" />}
                    {activeResult.result === 'NOT_VERIFIED' && <XCircle className="w-6 h-6 text-[#C94C4C]" />}
                    {activeResult.result === 'UNABLE_TO_VERIFY' && <HelpCircle className="w-6 h-6 text-[#D99032]" />}
                    <span className="text-lg font-extrabold font-mono tracking-wide">
                      {activeResult.result.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-medium opacity-80">
                    Reason Code: {activeResult.reasonCode}
                  </div>
                </div>

                {/* Response Statement & Statutory Interpretation */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-2 font-sans">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Official Finding Statement:</span>
                    <span className="text-[10px] font-mono text-slate-500">Legal Standard</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">{activeResult.reasonDescription}</p>

                  <div className="pt-2 border-t border-slate-200 text-[11px] leading-relaxed">
                    <strong className="text-slate-900">Actionable Guidance: </strong>
                    {activeResult.result === 'VERIFIED' && (
                      <span className="text-teal-800">
                        Record is certified in good standing on the official regulatory ledger. Eligible for corporate background checks, government scholarships, academic credit transfer, and official degree issue.
                      </span>
                    )}
                    {activeResult.result === 'NOT_VERIFIED' && (
                      <span className="text-red-800">
                        Identifier does not correspond to an enrolled student at this institution for AY 2026-27. No verification certificate issued. Request the applicant to furnish valid institutional credentials.
                      </span>
                    )}
                    {activeResult.result === 'UNABLE_TO_VERIFY' && (
                      <span className="text-amber-800">
                        Verification temporarily withheld. Student record is locked under an unresolved regulatory conflict (Rule V-05 Cross-Institution Collision / Transfer Audit Hold). Request applicant to submit Exception Clearance from registrar.
                      </span>
                    )}
                  </div>
                </div>

                {/* Privacy-safe matched details snippet */}
                {activeResult.matchedRecordSnippet && (
                  <div className="p-3.5 bg-white rounded-lg border border-slate-200 text-xs space-y-1.5 font-mono shadow-2xs">
                    <span className="font-bold text-[#101C32] block font-sans">
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
                      <span>Enrolment Status:</span>
                      <strong className="text-[#168C83]">{activeResult.matchedRecordSnippet.enrolmentStatus}</strong>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 font-mono">
                Submit an enrolment verification request on the left to view the signed response certificate.
              </div>
            )}
          </div>

          {activeResult && (
            <div className="pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Timestamp: {activeResult.timestamp.replace('T', ' ').slice(0, 19)}</span>
              <span>Officer: {activeResult.officerName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Query Audit Journal Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-[#101C32]">Recent Verification Query Journal</h3>
            <p className="text-xs text-slate-500">Every external verification attempt is cryptographically logged in the audit trail</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
            {verificationRequests.length} Queries Logged
          </span>
        </div>

        <div className="overflow-x-auto max-h-[300px]">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Request ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Queried Identifier</th>
                <th className="py-2.5 px-3">Host Campus</th>
                <th className="py-2.5 px-3 text-center">Outcome</th>
                <th className="py-2.5 px-3">Reason Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono bg-white">
              {verificationRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{req.id}</td>
                  <td className="py-2.5 px-3 text-slate-500">{req.timestamp.replace('T', ' ').slice(0, 19)}</td>
                  <td className="py-2.5 px-3 text-slate-800 font-medium">{req.maskedSearchValue}</td>
                  <td className="py-2.5 px-3 text-slate-600">{req.institutionId}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
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
                  <td className="py-2.5 px-3 text-slate-600 text-[11px]">{req.reasonCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
