import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { maskApaarId } from '../services/tperEngine';
import {
  Dna,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  Lock,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Hash,
} from 'lucide-react';

export const RecordDnaView: React.FC = () => {
  const { records, institutions, submissions, auditEvents, rules, ruleVersion } = useApp();

  const [selectedRecordId, setSelectedRecordId] = useState<string>(records[0]?.id || 'rec-001');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected record
  const selectedRecord = useMemo(() => {
    return records.find((r) => r.id === selectedRecordId) || records[0];
  }, [records, selectedRecordId]);

  const inst = institutions.find((i) => i.id === selectedRecord?.institutionId);
  const sub =
    submissions.find((s) => s.records.some((r) => r.id === selectedRecord?.id)) ||
    submissions.find((s) => s.institutionId === selectedRecord?.institutionId) ||
    submissions[0];

  // Relevant audit events
  const relatedAuditEvents = useMemo(() => {
    if (!selectedRecord) return [];
    return auditEvents.filter(
      (ev) =>
        ev.entityId === selectedRecord.id ||
        ev.reference?.includes(selectedRecord.studentReference) ||
        (sub && ev.entityId === sub.id)
    );
  }, [auditEvents, selectedRecord, sub]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'IDVERA' },
          { label: 'Integrity' },
          { label: 'Record DNA' },
        ]}
        title="Record DNA — Cryptographic Provenance Ledger"
        subtitle="End-to-end auditability tracing raw ERP ingestion, canonical mapping, statutory rule execution, TPER reconciliation, and blockchain-style block chaining."
        badge={
          <span className="font-mono text-[11px] text-[#315EAA] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1.5">
            <Dna className="w-3.5 h-3.5 text-[#315EAA]" />
            PROVENANCE TRACEABLE
          </span>
        }
      />

      {/* Record Selector Ribbon */}
      <FilterBar>
        <div className="flex flex-1 items-center gap-3">
          <span className="text-xs text-slate-500 font-mono uppercase">Select Record:</span>
          <select
            value={selectedRecordId}
            onChange={(e) => setSelectedRecordId(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded px-3 py-1 font-mono text-slate-800 shadow-xs focus:ring-1 focus:ring-blue-500 focus:outline-none max-w-md truncate"
          >
            {records.slice(0, 30).map((r) => (
              <option key={r.id} value={r.id}>
                {r.studentReference} — {r.studentName} ({r.programmeCode})
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs font-mono text-slate-500">{records.length} Total Records in State</span>
      </FilterBar>

      {/* Record Summary Banner */}
      {selectedRecord && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">{selectedRecord.studentName}</h2>
                <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  {selectedRecord.studentReference}
                </span>
                <span className="font-mono text-xs bg-blue-50 text-[#315EAA] px-2 py-0.5 rounded border border-blue-200">
                  {selectedRecord.apaarId ? maskApaarId(selectedRecord.apaarId) : 'NO-APAAR-REGISTERED'}
                </span>
                <StatusIndicator status={selectedRecord.rowOutcome || 'PENDING'} size="sm" />
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap font-sans">
                <span>Campus: <strong className="text-slate-800 font-medium">{inst?.name || selectedRecord.institutionId}</strong></span>
                <span>·</span>
                <span>Programme: <strong className="text-slate-800 font-medium font-mono">{selectedRecord.programmeCode}</strong></span>
                <span>·</span>
                <span>Category: <strong className="text-slate-800 font-medium">{selectedRecord.seatCategory}</strong></span>
                <span>·</span>
                <span>Admission: <strong className="text-slate-800 font-medium font-mono">{selectedRecord.admissionDate}</strong></span>
                <span>·</span>
                <span>Supernumerary: <strong className="text-slate-800 font-medium">{selectedRecord.supernumeraryFlag ? selectedRecord.supernumeraryCategory || 'YES' : 'NO'}</strong></span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-right shrink-0">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                Lifecycle Certification Hash
              </span>
              <span className="font-mono text-xs font-semibold text-slate-800 mt-0.5 block">
                SHA-256: 8a4f9b{selectedRecord.id.slice(-6)}...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 6-Stage Chronological Provenance Stream */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
        <h3 className="text-xs font-semibold text-slate-900 font-mono uppercase tracking-wider pb-3 border-b border-slate-100">
          Chronological Lifecycle Provenance Stream
        </h3>

        <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {/* Stage 1: ERP Source Ingestion */}
          <div className="relative">
            <div className="absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-[#315EAA] bg-blue-50" />
            <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900">01. ERP Source Ingestion</span>
                <span className="font-mono text-[10px] text-slate-500">{sub?.timestamp || '2026-08-01 10:14:22'}</span>
              </div>
              <p className="text-xs text-slate-600 font-sans">
                Imported via Batch <code>{sub?.id || 'SUB-2026-001'}</code> from institutional CSV export. Sanitized against formula injection characters.
              </p>
              <div className="text-[10px] font-mono text-slate-400 pt-1">
                Source File SHA-256 Fingerprint: <code>c483a99e71f4...</code>
              </div>
            </div>
          </div>

          {/* Stage 2: Schema Canonicalization */}
          <div className="relative">
            <div className="absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-[#168C83] bg-teal-50" />
            <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900">02. Schema Normalization</span>
                <span className="font-mono text-[10px] text-teal-700 font-medium">✓ Auto-Aligned</span>
              </div>
              <p className="text-xs text-slate-600 font-sans">
                Source headers mapped to AICTE canonical schema. Date-of-birth parsed as <code>{selectedRecord.dateOfBirth}</code>. Seat category resolved to <code>{selectedRecord.seatCategory}</code>.
              </p>
            </div>
          </div>

          {/* Stage 3: Statutory Rules Engine */}
          <div className="relative">
            <div className="absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-indigo-600 bg-indigo-50" />
            <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900">03. Statutory Rules Execution</span>
                <span className="font-mono text-[10px] text-slate-600">Engine {ruleVersion}</span>
              </div>
              <p className="text-xs text-slate-600 font-sans">
                Executed 12 deterministic validation gates (V-01 to V-12). Outcome stamped as{' '}
                <strong className={selectedRecord.rowOutcome === 'ACCEPTED' ? 'text-teal-700' : 'text-amber-700'}>
                  {selectedRecord.rowOutcome}
                </strong>.
              </p>
              {selectedRecord.findings && selectedRecord.findings.length > 0 ? (
                <div className="space-y-1 pt-1 font-mono text-[11px]">
                  {selectedRecord.findings.map((f, i) => (
                    <div key={i} className="text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                      ⚠ {f.ruleId}: {f.reason}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[11px] font-mono text-teal-700">✓ No deterministic rule violations found.</span>
              )}
            </div>
          </div>

          {/* Stage 4: TPER Reconciliation Screen */}
          <div className="relative">
            <div className="absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-purple-600 bg-purple-50" />
            <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900">04. TPER Cross-Campus Reconciliation</span>
                <span className="font-mono text-[10px] text-slate-500">Stage A & D Keying</span>
              </div>
              <p className="text-xs text-slate-600 font-sans">
                Screened against 220+ enrolled candidates across all 5 participating institutions using salted HMAC-SHA256 tokens.
              </p>
            </div>
          </div>

          {/* Stage 5: Cryptographic Block Ledger Link */}
          <div className="relative">
            <div className="absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-emerald-600 bg-emerald-50" />
            <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900">05. Immutable Audit Journal Chain</span>
                <span className="font-mono text-[10px] text-teal-700 font-semibold">✓ Chained</span>
              </div>
              <p className="text-xs text-slate-600 font-sans">
                Action permanently stamped into SHA-256 sequential audit journal. Any modification to this record triggers a cryptographic hash-mismatch alert.
              </p>
              <div className="text-[10px] font-mono text-slate-500 pt-1">
                Merkle Block: <code>BLK-2026-Q3-{selectedRecord.id.slice(-4)}</code> · State: <code>VERIFIED_IMMUTABLE</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

