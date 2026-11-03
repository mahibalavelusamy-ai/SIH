import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AuditEvent, LedgerVerificationResult } from '../types';
import { sanitizeCsvCell } from '../services/securityService';
import { PageHeader } from '../components/ui/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { DetailDrawer } from '../components/ui/DetailDrawer';
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
  Hash,
  Database,
} from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const { auditEvents, verifyAuditLedger } = useApp();

  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterEntityType, setFilterEntityType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
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
    const matchSearch =
      !searchQuery.trim() ||
      ev.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.reasonOrRuleId && ev.reasonOrRuleId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchAction && matchEntity && matchSearch;
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
      <PageHeader
        breadcrumbs={[
          { label: 'IDVERA' },
          { label: 'Governance' },
          { label: 'Cryptographic Audit Journal' },
        ]}
        title="Immutable Audit Journal"
        subtitle="Tamper-evident chronological ledger recording batch submissions, rule engine mutations, human exception adjudications, and verification queries."
        badge={
          <span className="font-mono text-[11px] text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-teal-700" />
            SHA-256 HASH CHAINED
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleVerifyLedger}
              disabled={isVerifying}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded text-xs font-medium transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isVerifying ? 'animate-spin' : ''}`} />
              {isVerifying ? 'Verifying...' : 'Verify Cryptographic Integrity'}
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              Safe Export (CSV)
            </button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Total Ledger Blocks"
          value={verificationResult.totalBlocks}
          subValue="Sequential audit entries"
          tone="indigo"
        />
        <MetricCard
          label="Verified Hash Blocks"
          value={verificationResult.verifiedBlocks}
          subValue="Predecessor SHA-256 integrity"
          trend={{
            value: verificationResult.isValid ? '100% Valid' : 'Tampered',
            isPositive: verificationResult.isValid,
            isNegative: !verificationResult.isValid,
          }}
          tone={verificationResult.isValid ? 'teal' : 'rose'}
        />
        <MetricCard
          label="Latest Merkle Root"
          value={`${verificationResult.computedHash.slice(0, 8)}...`}
          subValue="Top block cryptographic digest"
        />
        <MetricCard
          label="Filtered Events"
          value={filteredEvents.length}
          subValue="Current query matches"
        />
      </div>

      {/* Verification Status Card */}
      <div
        className={`p-4 rounded-lg border transition-all ${
          verificationResult.isValid ? 'bg-teal-50/50 border-teal-200' : 'bg-rose-50 border-rose-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            {verificationResult.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-teal-700 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-900 font-mono">
                  {verificationResult.isValid ? 'Cryptographic Hash-Chain Integrity: Valid' : 'Ledger Tampering Detected'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 font-medium border border-slate-200">
                  {verificationResult.verifiedBlocks} / {verificationResult.totalBlocks} Blocks Verified
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Every audit record is cryptographically linked to its predecessor via SHA-256 block hashing (<code className="text-slate-800">prevHash + eventData</code>). Safe CSV exports strictly sanitize formula injection vectors (<code className="text-slate-800">=, +, -, @</code>).
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] font-mono uppercase text-slate-400">Latest Top Block Hash</div>
            <div
              className="text-xs font-mono font-medium text-slate-800 bg-white px-2.5 py-1 rounded border border-slate-200 max-w-[220px] truncate mt-0.5 shadow-2xs"
              title={verificationResult.computedHash}
            >
              {verificationResult.computedHash}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar>
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="w-64">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by ID, actor, or ref..."
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono uppercase">Entity:</span>
            <select
              value={filterEntityType}
              onChange={(e) => setFilterEntityType(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1 text-slate-800 shadow-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">All Entity Types</option>
              <option value="SUBMISSION">SUBMISSION</option>
              <option value="EXCEPTION_CANDIDATE">EXCEPTION_CANDIDATE</option>
              <option value="RULE_ENGINE">RULE_ENGINE</option>
              <option value="VERIFICATION_REQUEST">VERIFICATION_REQUEST</option>
              <option value="ROLE_CHANGE">ROLE_CHANGE</option>
              <option value="DEMO_STATE">DEMO_STATE</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono uppercase">Action:</span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1 text-slate-800 shadow-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">All Actions</option>
              <option value="SUBMISSION">Batch Submissions</option>
              <option value="EXCEPTION">Adjudications</option>
              <option value="RULE">Rule Version Changes</option>
              <option value="VERIFICATION">Verification Queries</option>
              <option value="ROLE">Role Switches</option>
            </select>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-500">{filteredEvents.length} Events</span>
      </FilterBar>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[540px]">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Event ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor & Role</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity Type & Ref</th>
                <th className="py-2.5 px-3">State Transition</th>
                <th className="py-2.5 px-3">Reason / Details</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400 font-mono font-normal">
                    No audit records match the current filter parameters.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{ev.id}</td>

                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {ev.timestamp.replace('T', ' ').slice(0, 19)}
                    </td>

                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-semibold text-slate-900 truncate max-w-[140px]">{ev.actorName}</div>
                      <div className="text-[10px] font-mono text-slate-500">{ev.actorRole}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-medium border border-slate-200">
                        {ev.action}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-mono text-slate-800 font-medium">{ev.entityId}</div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase">{ev.entityType}</div>
                    </td>

                    <td className="py-2.5 px-3 text-[11px] text-slate-600 font-sans">
                      {ev.previousState ? (
                        <span>
                          <span className="line-through text-slate-400 font-mono">{ev.previousState}</span> →{' '}
                          <strong className="text-slate-900 font-mono">{ev.newState}</strong>
                        </span>
                      ) : (
                        <strong className="text-slate-900 font-mono">{ev.newState || '—'}</strong>
                      )}
                    </td>

                    <td
                      className="py-2.5 px-3 font-sans text-slate-600 text-[11px] max-w-[220px] truncate"
                      title={ev.reasonOrRuleId || ''}
                    >
                      {ev.reasonOrRuleId || '—'}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedEvent(ev)}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded transition-colors"
                        title="Inspect event details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Detail Slide-over Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent ? `Audit Record: ${selectedEvent.id}` : ''}
        subtitle="Cryptographically verified SHA-256 block details"
      >
        {selectedEvent && (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase text-slate-400 block font-sans">Action Classification</span>
              <div className="text-sm font-bold text-slate-900">{selectedEvent.action}</div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-sans">Timestamp</span>
                <span className="text-slate-900 font-medium">{selectedEvent.timestamp}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-sans">Actor Name</span>
                <span className="text-slate-900 font-medium font-sans">{selectedEvent.actorName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-sans">Actor Role</span>
                <span className="text-slate-900 font-medium">{selectedEvent.actorRole}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-sans">Target Entity</span>
                <span className="text-slate-900 font-medium">{selectedEvent.entityType} ({selectedEvent.entityId})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-sans">State Transition</span>
                <span className="text-slate-900 font-medium">
                  {selectedEvent.previousState || 'NONE'} → {selectedEvent.newState}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-slate-500 font-sans block mb-1">Reason / Description</span>
              <p className="font-sans text-slate-800 bg-slate-50 p-3 rounded border border-slate-200 text-xs leading-relaxed">
                {selectedEvent.reasonOrRuleId || 'No explicit reason specified.'}
              </p>
            </div>

            {selectedEvent.reference && (
              <div className="pt-2">
                <span className="text-slate-500 font-sans block mb-1">Associated Reference</span>
                <div className="text-slate-800 bg-slate-50 px-3 py-2 rounded border border-slate-200 text-xs">
                  {selectedEvent.reference}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-sans">Current Block SHA-256 Hash</span>
                <code className="text-[11px] bg-slate-100 p-2 rounded block break-all text-slate-800 border border-slate-200 mt-1">
                  {selectedEvent.hash || 'GENESIS_OR_UNHASHED'}
                </code>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-sans">Predecessor Block Hash</span>
                <code className="text-[11px] bg-slate-100 p-2 rounded block break-all text-slate-800 border border-slate-200 mt-1">
                  {selectedEvent.prevHash || '00000000000000000000000000000000'}
                </code>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};
