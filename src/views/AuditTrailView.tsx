import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AuditEvent } from '../types';
import {
  History,
  Download,
  Filter,
  Eye,
  Lock,
  Clock,
  UserCheck,
  ShieldCheck,
  X,
} from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const { auditEvents } = useApp();

  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterEntityType, setFilterEntityType] = useState<string>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

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
    ];

    const rows = filteredEvents.map((ev) => [
      `"${ev.id}"`,
      `"${ev.timestamp}"`,
      `"${ev.actorName}"`,
      `"${ev.actorRole}"`,
      `"${ev.action}"`,
      `"${ev.entityType}"`,
      `"${ev.entityId}"`,
      `"${ev.previousState || '—'}"`,
      `"${ev.newState || '—'}"`,
      `"${(ev.reasonOrRuleId || '—').replace(/"/g, '""')}"`,
      `"${(ev.reference || '—').replace(/"/g, '""')}"`,
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
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              Append-Only State
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological ledger recording batch uploads, rule engine version changes, human exception adjudications, and verification queries.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          Export Audit Log (CSV)
        </button>
      </div>

      {/* Regulatory Governance & Browser Limitation Disclaimer */}
      <div className="p-3.5 bg-slate-100 rounded-lg border border-slate-200 text-xs text-slate-700 flex items-start gap-3">
        <Lock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          <strong className="text-slate-900">Compliance & Prototype Limitation Notice:</strong> Audit entries in this frontend prototype are stored in browser memory/localStorage and are protected against deletion via normal UI controls. However, client-side browser storage is not tamper-proof against code inspection. Production deployments require WORM (Write Once Read Many) append-only database storage with cryptographic digital signatures.
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
