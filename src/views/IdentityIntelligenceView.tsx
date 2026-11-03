import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { DetailDrawer } from '../components/ui/DetailDrawer';
import { maskApaarId, deriveKeyedIdentifier } from '../services/tperEngine';
import {
  Fingerprint,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  Eye,
  Lock,
  Search,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
} from 'lucide-react';

export const IdentityIntelligenceView: React.FC = () => {
  const { duplicateCandidates, records, institutions, setActiveNav } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  // Filtered duplicate candidates
  const filteredCandidates = useMemo(() => {
    return duplicateCandidates.filter((cand) => {
      const matchStatus = filterStatus === 'ALL' || cand.status === filterStatus;
      const matchSearch =
        !searchQuery.trim() ||
        cand.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cand.recordA.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cand.recordB.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cand.recordA.studentReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cand.recordB.studentReference.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [duplicateCandidates, filterStatus, searchQuery]);

  // Derived KPIs
  const totalProtectedTokens = records.length;
  const collisionCount = duplicateCandidates.length;
  const pendingReviews = duplicateCandidates.filter((c) => c.status === 'PENDING_REVIEW').length;
  const confirmedCollisions = duplicateCandidates.filter((c) => c.status === 'CONFIRMED_DUPLICATE').length;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'IDVERA' },
          { label: 'Intelligence' },
          { label: 'Identity Intelligence' },
        ]}
        title="Identity Intelligence & Keyed Demographic Resolution"
        subtitle="Privacy-preserving demographic resolution utilizing salted HMAC matching tokens, explainable collision signals, and human adjudication."
        badge={
          <span className="font-mono text-[11px] text-[#315EAA] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-medium flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-[#315EAA]" />
            SALTED HMAC-SHA256
          </span>
        }
        actions={
          <button
            onClick={() => setActiveNav('tper')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101C32] hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors shadow-xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[#315EAA]" />
            Open TPER Reconciliation
          </button>
        }
      />

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Protected Identifiers"
          value={totalProtectedTokens}
          subValue="Salted HMAC tokenized references"
          tone="indigo"
        />
        <MetricCard
          label="Cross-Campus Collisions"
          value={collisionCount}
          subValue="Dual active candidates"
          tone="amber"
        />
        <MetricCard
          label="Pending Adjudication"
          value={pendingReviews}
          subValue="Awaiting registrar review"
          trend={{
            value: `${pendingReviews} Open`,
            isNegative: pendingReviews > 0,
          }}
          tone={pendingReviews > 0 ? 'rose' : 'teal'}
        />
        <MetricCard
          label="Privacy Integrity"
          value="100%"
          subValue="Zero plain-text APAAR broadcast"
          tone="teal"
        />
      </div>

      {/* Cryptographic Privacy Disclosure Notice */}
      <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs flex items-start gap-3">
        <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
          <Fingerprint className="w-4 h-4 text-[#315EAA]" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-slate-900 font-mono uppercase tracking-wider">
            Protected Identity Matching Architecture (Stage A & Stage D)
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            IDVERA safeguards student civil liberties by never transmitting raw 12-digit APAAR identifiers across institutional boundaries. Identity matches are evaluated through <strong>Keyed HMAC-SHA256</strong> matching tokens (Stage A) supplemented by normalized name bigram Dice coefficients and date-of-birth proximity tolerance windows (Stage D).
          </p>
        </div>
      </div>

      {/* Filters and Search Toolbar */}
      <FilterBar>
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="w-72">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search candidate ID, name, or ref..."
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono uppercase">Review Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1 text-slate-800 shadow-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_REVIEW">PENDING REVIEW</option>
              <option value="LEGITIMATE_TRANSFER">LEGITIMATE TRANSFER</option>
              <option value="CONFIRMED_DUPLICATE">CONFIRMED DUPLICATE</option>
              <option value="NOT_A_MATCH">NOT A MATCH</option>
            </select>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-500">{filteredCandidates.length} Candidates Evaluated</span>
      </FilterBar>

      {/* Identity Candidates Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Candidate ID</th>
                <th className="py-2.5 px-3">Primary Enrolment (Campus A)</th>
                <th className="py-2.5 px-3">Colliding Enrolment (Campus B)</th>
                <th className="py-2.5 px-3">Protected Reference (HMAC)</th>
                <th className="py-2.5 px-3 text-center">Confidence Score</th>
                <th className="py-2.5 px-3">Adjudication Status</th>
                <th className="py-2.5 px-3 text-right">Inspect Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400 font-mono">
                    No identity resolution candidates match current parameters.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((cand) => {
                  const instA = institutions.find((i) => i.id === cand.recordA.institutionId);
                  const instB = institutions.find((i) => i.id === cand.recordB.institutionId);
                  const scorePct = Math.round(cand.confidenceScore * 100);

                  return (
                    <tr key={cand.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{cand.id}</td>

                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-semibold text-slate-900">{cand.recordA.studentName}</div>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="text-[#315EAA] font-semibold">{instA?.code || cand.recordA.institutionId}</span>
                          <span>·</span>
                          <span>{cand.recordA.studentReference}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-semibold text-slate-900">{cand.recordB.studentName}</div>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="text-[#315EAA] font-semibold">{instB?.code || cand.recordB.institutionId}</span>
                          <span>·</span>
                          <span>{cand.recordB.studentReference}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="text-[11px] font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 inline-block">
                          {cand.recordA.apaarId ? maskApaarId(cand.recordA.apaarId) : 'DEMO-TOKEN-MATCH'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {cand.matchingStage === 'STAGE_A_KEYED' ? 'Exact Keyed HMAC' : 'Heuristic Stage D'}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            scorePct >= 90
                              ? 'bg-rose-50 text-[#C94C4C] border-rose-200'
                              : scorePct >= 75
                              ? 'bg-amber-50 text-[#D99032] border-amber-200'
                              : 'bg-blue-50 text-[#315EAA] border-blue-200'
                          }`}
                        >
                          {scorePct}% Match
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <StatusIndicator status={cand.status} size="sm" />
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedCandidate(cand)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded transition-colors inline-flex items-center gap-1"
                          title="Inspect Evidence Vector"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="font-sans text-[11px] font-medium">Evidence</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Evidence Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedCandidate)}
        onClose={() => setSelectedCandidate(null)}
        title={selectedCandidate ? `Identity Collision Evidence: ${selectedCandidate.id}` : ''}
        subtitle="Side-by-side demographic comparison & cryptographic proof"
      >
        {selectedCandidate && (
          <div className="space-y-5 text-xs font-sans">
            {/* Confidence Banner */}
            <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Resolution Algorithm</span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {selectedCandidate.matchingStage === 'STAGE_A_KEYED'
                    ? 'Deterministic Keyed HMAC Match (Stage A)'
                    : 'Fuzzy Bigram & Date Heuristic Match (Stage D)'}
                </span>
              </div>
              <span className="text-base font-bold font-mono text-[#315EAA]">
                {Math.round(selectedCandidate.confidenceScore * 100)}% Confidence
              </span>
            </div>

            {/* Side-by-Side Comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded space-y-2">
                <span className="text-[10px] font-mono uppercase text-[#315EAA] font-bold block">
                  Campus Record A
                </span>
                <div className="space-y-1 font-mono text-[11px]">
                  <div><strong>Ref:</strong> {selectedCandidate.recordA.studentReference}</div>
                  <div><strong>Name:</strong> {selectedCandidate.recordA.studentName}</div>
                  <div><strong>Campus:</strong> {selectedCandidate.recordA.institutionId}</div>
                  <div><strong>DOB:</strong> {selectedCandidate.recordA.dateOfBirth}</div>
                  <div><strong>Programme:</strong> {selectedCandidate.recordA.programmeCode}</div>
                  <div><strong>Status:</strong> {selectedCandidate.recordA.enrolmentStatus}</div>
                  <div><strong>Admission:</strong> {selectedCandidate.recordA.admissionDate}</div>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded space-y-2">
                <span className="text-[10px] font-mono uppercase text-[#315EAA] font-bold block">
                  Campus Record B
                </span>
                <div className="space-y-1 font-mono text-[11px]">
                  <div><strong>Ref:</strong> {selectedCandidate.recordB.studentReference}</div>
                  <div><strong>Name:</strong> {selectedCandidate.recordB.studentName}</div>
                  <div><strong>Campus:</strong> {selectedCandidate.recordB.institutionId}</div>
                  <div><strong>DOB:</strong> {selectedCandidate.recordB.dateOfBirth}</div>
                  <div><strong>Programme:</strong> {selectedCandidate.recordB.programmeCode}</div>
                  <div><strong>Status:</strong> {selectedCandidate.recordB.enrolmentStatus}</div>
                  <div><strong>Admission:</strong> {selectedCandidate.recordB.admissionDate}</div>
                </div>
              </div>
            </div>

            {/* Matching Signals Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-900 font-mono uppercase tracking-wider">
                Matching Evidence Signals
              </h4>
              <div className="space-y-1.5 font-mono text-xs">
                {selectedCandidate.signals && selectedCandidate.signals.map((sig: string, idx: number) => (
                  <div key={idx} className="p-2 bg-slate-50 border border-slate-200 rounded flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="text-slate-800">{sig}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Adjudication Status */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Current Adjudication</span>
              <div className="flex items-center gap-2">
                <StatusIndicator status={selectedCandidate.status} size="md" />
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};

