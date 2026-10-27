import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AuditEvent, LedgerVerificationResult } from '../types';
import { sanitizeCsvCell } from '../services/securityService';
import {
  History,
  Download,
  Filter,
  Eye,
  Lock,
  Clock,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
} from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const { auditEvents, verifyAuditLedger } = useApp();

  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterEntityType, setFilterEntityType] = useState<string>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [verificationResult, setVerificationResult] = useState<LedgerVerificationResult>(() => verifyAuditLedger());
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyLedger = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const res = verifyAuditLedger();
      setVerificationResult(res);
      setIsVerifying(false);
    }, 250);
  };

  const filteredEvents = auditEvents.filter((ev) => {
    const matchAction = filterAction === 'ALL' || ev.action.includes(filterAction);
    const matchEntity = filterEntityType === 'ALL' || ev.entityType === filterEntityType;
    return matchAction && matchEntity;
  });

  const handleExportCSV = () => {
    const headers = [
      'EventID',
      'Timestamp',
      'ActorName',
      'ActorRole',
      'Action',
      'EntityType',
      'EntityID',
      'PreviousState',
      'NewState',
      'ReasonOrRuleID',
      'Reference',
      'BlockHash',
      'PreviousBlockHash',
    ];

    const rows = filteredEvents.map((ev) => [
      `"${sanitizeCsvCell(ev.id)}"`,
      `"${sanitizeCsvCell(ev.timestamp)}"`,
      `"${sanitizeCsvCell(ev.actorName)}"`,
      `"${sanitizeCsvCell(ev.actorRole)}"`,
      `"${sanitizeCsvCell(ev.action)}"`,
      `"${sanitizeCsvCell(ev.entityType)}"`,
      `"${sanitizeCsvCell(ev.entityId)}"`,
      `"${sanitizeCsvCell(ev.previousState || '—')}"`,
      `"${sanitizeCsvCell(ev.newState || '—')}"`,
      `"${sanitizeCsvCell(ev.reasonOrRuleId || '—')}"`,
      `"${sanitizeCsvCell(ev.reference || '—')}"`,
      `"${sanitizeCsvCell(ev.hash || '—')}"`,
      `"${sanitizeCsvCell(ev.prevHash || '—')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IDVERA_Audit_Trail_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header and Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Immutable Audit Journal</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
              SHA-256 Hash Chained
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-evident chronological ledger recording batch submissions, rule engine mutations, human exception adjudications, and verification queries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleVerifyLedger}
            disabled={isVerifying}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-medium transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isVerifying ? 'animate-spin' : ''}`} />
            {isVerifying ? 'Verifying...' : 'Verify Cryptographic Integrity'}
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            Safe Export (CSV)
          </button>
        </div>
      </div>

      {/* Cryptographic Ledger Verification Status Card */}
      <div className={`p-4 rounded-xl border transition-all ${verificationResult.isValid ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            {verificationResult.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  {verificationResult.isValid ? 'Cryptographic Hash-Chain Integrity: Valid' : 'Ledger Tampering Detected'}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.2 rounded bg-white text-slate-700 font-semibold border border-slate-200">
                  {verificationResult.verifiedBlocks} / {verificationResult.totalBlocks} Blocks Verified
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Every audit record is cryptographically linked to its predecessor via SHA-256 block hashing (<code>prevHash + eventData</code>). CSV exports strictly sanitize formula injection vectors (<code>=, +, -, @</code>).
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] font-mono text-slate-500">Latest Top Block Hash:</div>
            <div className="text-[11px] font-mono font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 max-w-[200px] truncate" title={verificationResult.computedHash}>
              {verificationResult.computedHash.slice(0, 18)}...
            </div>
          </div>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-700">Filters:</span>

          <select
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800"
          >
            <option value="ALL">All Entity Types</option>
            <option value="SUBMISSION">SUBMISSION</option>
            <option value="EXCEPTION_CANDIDATE">EXCEPTION_CANDIDATE</option>
            <option value="RULE_ENGINE">RULE_ENGINE</option>
            <option value="VERIFICATION_REQUEST">VERIFICATION_REQUEST</option>
            <option value="ROLE_CHANGE">ROLE_CHANGE</option>
            <option value="DEMO_STATE">DEMO_STATE</option>
          </select>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800"
          >
            <option value="ALL">All Actions</option>
            <option value="SUBMISSION">Batch Submissions</option>
            <option value="EXCEPTION">Adjudications</option>
            <option value="RULE">Rule Version Changes</option>
            <option value="VERIFICATION">Verification Queries</option>
            <option value="ROLE">Role Switches</option>
          </select>
        </div>

        <span className="font-mono text-slate-500">{filteredEvents.length} Events Recorded</span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Event ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor & Role</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity Type & Ref</th>
                <th className="py-2.5 px-3">State Transition</th>
                <th className="py-2.5 px-3">Reason / Details</th>
                <th className="py-2.5 px-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 font-semibold text-slate-900">{ev.id}</td>

                  <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                    {ev.timestamp.replace('T', ' ').slice(0, 19)}
                  </td>

                  <td className="py-2 px-3 font-sans">
                    <div className="font-semibold text-slate-900 truncate max-w-[140px]">{ev.actorName}</div>
                    <div className="text-[10px] font-mono text-slate-500">{ev.actorRole}</div>
                  </td>

                  <td className="py-2 px-3">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-bold border border-slate-200">
                      {ev.action}
                    </span>
                  </td>

                  <td className="py-2 px-3 font-sans">
                    <div className="font-mono text-slate-800 font-semibold">{ev.entityId}</div>
                    <div className="text-[10px] text-slate-500">{ev.entityType}</div>
                  </td>

                  <td className="py-2 px-3 text-[11px] text-slate-600">
                    {ev.previousState ? (
                      <span>
                        <span className="line-through text-slate-400">{ev.previousState}</span> →{' '}
                        <strong className="text-slate-900">{ev.newState}</strong>
                      </span>
                    ) : (
                      <strong className="text-slate-900">{ev.newState || '—'}</strong>
                    )}
                  </td>

                  <td className="py-2 px-3 font-sans text-slate-600 text-[11px] max-w-[220px] truncate" title={ev.reasonOrRuleId || ''}>
                    {ev.reasonOrRuleId || '—'}
                  </td>

                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => setSelectedEvent(ev)}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-900"
                      title="Inspect event details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 font-mono">Event {selectedEvent.id}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-sans">Timestamp:</span>
                <span className="text-slate-900">{selectedEvent.timestamp}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-sans">Action:</span>
                <span className="font-bold text-blue-700">{selectedEvent.action}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-sans">Actor:</span>
                <span className="text-slate-900">{selectedEvent.actorName} ({selectedEvent.actorRole})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-sans">Entity Type:</span>
                <span className="text-slate-900">{selectedEvent.entityType} ({selectedEvent.entityId})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-sans">State Transition:</span>
                <span className="text-slate-900">{selectedEvent.previousState || 'NONE'} → {selectedEvent.newState}</span>
              </div>
              <div className="py-1">
                <span className="text-slate-500 font-sans block mb-1">Reason / Description:</span>
                <p className="font-sans text-slate-800 bg-slate-50 p-2.5 rounded border border-slate-200 text-xs leading-relaxed">
                  {selectedEvent.reasonOrRuleId || 'No explicit reason specified.'}
                </p>
              </div>
              {selectedEvent.reference && (
                <div className="py-1">
                  <span className="text-slate-500 font-sans block mb-1">Associated Reference:</span>
                  <span className="text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200 block text-[11px]">
                    {selectedEvent.reference}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-medium"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
