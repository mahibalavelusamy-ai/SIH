import React, { useState } from 'react';
import {
  Layers,
  Shield,
  Database,
  Lock,
  Cpu,
  FileCheck,
  Server,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Key,
  Info,
  ExternalLink,
  Code2,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface ComponentDetail {
  id: string;
  name: string;
  tier: string;
  boundaryType: 'IMPLEMENTED' | 'SIMULATED' | 'FUTURE';
  summary: string;
  inputs: string[];
  outputs: string[];
  privacySafeguards: string[];
  prototypeImplementation: string;
  futureProductionGap: string;
}

const ARCHITECTURE_COMPONENTS: ComponentDetail[] = [
  {
    id: 'PORTALS',
    name: 'Institutional & Regulatory Portals',
    tier: 'Tier 1: Interaction Surface',
    boundaryType: 'IMPLEMENTED',
    summary:
      'Responsive, role-tailored web interfaces serving AICTE Institutions (filing, column mapping, intake reconciliation), Regulatory Officers (exception adjudication, intake quotas), and Public Verifiers.',
    inputs: ['User credentials / demo role selection', 'Institutional CSV files', 'Reviewer decisions with mandatory justifications'],
    outputs: ['Pre-validation preview grids', 'Intake discrepancy reports', 'Verification certificates', 'Audit events'],
    privacySafeguards: [
      'Client-side masking of APAAR IDs (APAAR-***-9421) across all tables and drawers',
      'No persistent student identity caching on untrusted browser devices',
    ],
    prototypeImplementation: 'Fully built with React 19, TypeScript, and Tailwind CSS. Responsive layouts with zero dead buttons.',
    futureProductionGap: 'Replace demo role switcher with National Single Sign-On (Jan Parichay / MeriPehchaan OAuth 2.0).',
  },
  {
    id: 'ACCESS_CONTROL',
    name: 'Access-Control Boundary & RBAC Matrix',
    tier: 'Tier 1: Security Gateway',
    boundaryType: 'SIMULATED',
    summary:
      'Enforces granular role permissions across Submitter, Institution Reviewer, AICTE Regulatory Reviewer, Verification Officer, System Administrator, and Auditor.',
    inputs: ['Active role selector in navigation bar', 'Action invocation context (e.g. resolveCandidate, updateRule)'],
    outputs: ['Permission grant / denial', 'UI component read-only state', 'Unauthorized action block alerts'],
    privacySafeguards: [
      'Dual enforcement: UI controls are visually disabled, and action handlers internally verify permissions before mutating state',
    ],
    prototypeImplementation: 'Simulated demo role switcher with real internal RBAC capability matrix evaluated in AppContext.',
    futureProductionGap: 'Production JWT bearer tokens with digitally signed institutional delegation certificates and MeitY trust tokens.',
  },
  {
    id: 'SUBMISSION_SERVICE',
    name: 'Institutional Submission Service',
    tier: 'Tier 2: Ingestion Orchestration',
    boundaryType: 'IMPLEMENTED',
    summary:
      'Robust RFC 4180 CSV parser supporting quoted strings, canonical template downloads, interactive ERP column mapping with Row 1 preview, pre-validation row classification, and non-destructive resubmissions.',
    inputs: ['Canonical or ERP CSV files', 'Column mapping selections', 'Institution ID & Academic Year'],
    outputs: ['Validated submission snapshots with immutable ID', 'Row-level ACCEPTED / FLAGGED / REJECTED outcomes', 'Error report CSVs'],
    privacySafeguards: [
      'Files parsed strictly in-memory within browser web sandbox',
      'Original upload snapshots retained intact for regulatory auditability',
    ],
    prototypeImplementation: 'Pure client-side TypeScript CSV parser and mapper; preserves historical submissions upon resubmission.',
    futureProductionGap: 'Signed S3/GCS multipart ingestion buckets with antivirus scanning, rate limiting, and XML/API connectors for institutional ERPs.',
  },
  {
    id: 'VERSIONED_RULE_ENGINE',
    name: 'Versioned Statutory Rules Engine (V-01 – V-12)',
    tier: 'Tier 3: Ingestion Quality & Quotas',
    boundaryType: 'IMPLEMENTED',
    summary:
      'Executes 12 regulatory checks: required fields (V-01), APAAR existence & 12-digit format (V-02, V-03), batch duplicates (V-04), active overlaps (V-05), age plausibility 14–70 (V-06), admission dates (V-07), quota eligibility (V-08), regular intake limits (V-09), supernumerary caps (V-10, V-11), and end dates (V-12).',
    inputs: ['Student enrolment records', 'Approved intake quotas per programme', 'Active rule definitions (v1.2.0)'],
    outputs: ['Validation findings with rule ID, severity, and statutory explanation', 'Row outcomes (ACCEPTED/FLAGGED/REJECTED)'],
    privacySafeguards: [
      'Deterministic rule evaluation with zero external network telemetry',
      'Immutable rule version tagging on all evaluated submission batches',
    ],
    prototypeImplementation: 'Modular service in rulesEngine.ts. Rule configuration editor enables severity adjustments and triggers batch re-validation.',
    futureProductionGap: 'Distributed rule execution microservice with versioned JSON-schema definitions published to a public regulatory ledger.',
  },
  {
    id: 'TPER_ENGINE',
    name: 'TPER Temporal Matching Engine (Stages A–E)',
    tier: 'Tier 3: Cross-Institutional Reconciliation',
    boundaryType: 'IMPLEMENTED',
    summary:
      'Reconciles student enrolments across multiple institutions using 5 privacy-preserving stages: (A) Keyed HMAC derivation, (B) Open interval evaluation, (C) Transition-aware release logic, (D) Multi-signal heuristic scoring (Name 40, DOB 35, Interval 15, Prog 10), and (E) Human adjudication queue.',
    inputs: ['Certified active enrolment rosters from all institutions', 'Configurable high/medium similarity thresholds'],
    outputs: ['DuplicateCandidate records with explainable matching scores', 'Timeline overlap intervals', 'Uncertain transition flags'],
    privacySafeguards: [
      'Never compares raw student records directly in global scope; utilizes pseudonymized HMAC tokens',
      'Treats confirmed duplicates as administrative review findings rather than accusations of fraud',
    ],
    prototypeImplementation: 'Client-side deterministic HMAC simulation with Web Crypto API fallback, Dice bigram string similarity, and interval arithmetic.',
    futureProductionGap: 'Server-side Hardware Security Modules (HSMs) for key rotation, differential privacy, and homomorphic private set intersection (PSI).',
  },
  {
    id: 'DEMO_REPOSITORY',
    name: 'Browser Demo Repository & State Store',
    tier: 'Tier 4: Storage & Persistence',
    boundaryType: 'IMPLEMENTED',
    summary:
      'Central reactive state store managing 224 synthetic records across 5 fictional institutions (Northstar Institute, Cedar Technical College, Riverbend University, Summit Arts College, Lakeview Institute), configured regular intake limits, historical submissions, candidate queues, and deterministic reset capabilities.',
    inputs: ['Seed generation parameters', 'User submissions and adjudications', 'JSON snapshot imports'],
    outputs: ['Reactive React state', 'Synchronized browser localStorage', 'Complete JSON backup archives'],
    privacySafeguards: [
      '100% synthetic fictitious student data; zero PII from actual students or real government portals',
      'One-click wipe and reset restores clean state instantly',
    ],
    prototypeImplementation: 'React Context + localStorage synchronization with snapshot export/import utilities.',
    futureProductionGap: 'PostgreSQL database with Row-Level Security (RLS), multi-tenant institutional partitioning, and encrypted tables at rest.',
  },
  {
    id: 'AUDIT_SERVICE',
    name: 'Immutable Audit Journal Service',
    tier: 'Tier 4: Regulatory Accountability',
    boundaryType: 'IMPLEMENTED',
    summary:
      'Chronological append-only ledger recording all state-changing events: batch uploads, rule version updates, human adjudication decisions with mandatory reasons, and verification requests.',
    inputs: ['Action triggers from application modules with actor, role, previous state, new state, and reason'],
    outputs: ['Immutable AuditEvent records', 'Filterable audit log table', 'Exportable CSV audit journal'],
    privacySafeguards: [
      'Masks student identifiers in audit reference notes',
      'Append-only architecture prevents deletion or silent modification through UI controls',
    ],
    prototypeImplementation: 'In-memory + localStorage append-only list with CSV export.',
    futureProductionGap: 'Cryptographically signed Write-Once-Read-Many (WORM) storage, timestamp authority certification, and RFC 3161 audit verification.',
  },
  {
    id: 'MOCK_VERIFIER',
    name: 'Authorised Mock Verifier Adapter',
    tier: 'Tier 4: External Verification Facade',
    boundaryType: 'IMPLEMENTED',
    summary:
      'Privacy-preserving query adapter evaluating institutional student reference numbers or 12-digit APAAR IDs to verify bona fide enrolment status without leaking database tables.',
    inputs: ['Student reference ID or APAAR ID', 'Institution ID', 'Academic year', 'Optional programme code'],
    outputs: ['Verification certificate with outcome: VERIFIED / NOT_VERIFIED / UNABLE_TO_VERIFY', 'Reason code'],
    privacySafeguards: [
      'Minimal response payload: returns only tri-state confirmation and reason code without revealing student rosters',
      'Masks identifiers in certificates and query logs',
    ],
    prototypeImplementation: 'Synchronous adapter service validating against certified records and active candidate queues in browser state.',
    futureProductionGap: 'Rate-limited, mTLS-authenticated REST/GraphQL API for government employers, scholarship boards, and academic lenders.',
  },
];

export const ArchitectureView: React.FC = () => {
  const [selectedComponentId, setSelectedComponentId] = useState<string>('TPER_ENGINE');
  const activeDetail = ARCHITECTURE_COMPONENTS.find((c) => c.id === selectedComponentId) || ARCHITECTURE_COMPONENTS[0];

  return (
    <div className="space-y-6">
      {/* Header and Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Architecture & Service Boundaries</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Technical schematic detailing IDVERA's reconciliation pipeline, browser-implemented components, simulated boundaries, and future production interfaces.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 px-2 py-1 rounded">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <span className="text-teal-900 font-semibold">Implemented in Browser</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-amber-900 font-semibold">Simulated Boundary</span>
          </div>
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-2 py-1 rounded">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-blue-900 font-semibold">Future Production Service</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Flowchart (7 cols) | Detailed Component Inspection Drawer (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: INTERACTIVE ARCHITECTURAL FLOWCHART (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wide">
                Interactive Architecture Diagram (Click Node to Inspect)
              </span>
              <span className="text-[11px] text-slate-400">8 Core Modules</span>
            </div>

            {/* Tier 1: Access Portals & Role Surface */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Tier 1: Access Portals & Role Interaction Surface</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Node 1: Portals */}
                <button
                  type="button"
                  onClick={() => setSelectedComponentId('PORTALS')}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedComponentId === 'PORTALS'
                      ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-1 ring-blue-500'
                      : 'border-teal-500/60 bg-teal-50/20 hover:border-teal-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">1. Portals (Inst / AICTE / Verifier)</span>
                    <span className="text-[9px] font-mono text-teal-800 font-bold bg-teal-100 px-1.5 py-0.5 rounded">
                      Implemented
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                    Filing workflows, column mapping, exception workspace, and public query adapter.
                  </p>
                </button>

                {/* Node 2: Access Control Boundary */}
                <button
                  type="button"
                  onClick={() => setSelectedComponentId('ACCESS_CONTROL')}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedComponentId === 'ACCESS_CONTROL'
                      ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-1 ring-blue-500'
                      : 'border-amber-500/70 bg-amber-50/20 hover:border-amber-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">2. Access-Control Boundary</span>
                    <span className="text-[9px] font-mono text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                      Simulated
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                    Role switcher simulation + client RBAC matrix enforced at UI and action handler levels.
                  </p>
                </button>
              </div>
            </div>

            {/* Connecting Flow Indicator */}
            <div className="flex justify-center text-slate-400">
              <ArrowDown className="w-4 h-4" />
            </div>

            {/* Tier 2: Submission Service */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Tier 2: Ingestion & Parsing Orchestration</span>
              </div>

              {/* Node 3: Submission Service */}
              <button
                type="button"
                onClick={() => setSelectedComponentId('SUBMISSION_SERVICE')}
                className={`w-full p-3.5 rounded-lg border-2 text-left transition-all ${
                  selectedComponentId === 'SUBMISSION_SERVICE'
                    ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-1 ring-blue-500'
                    : 'border-teal-500/60 bg-teal-50/20 hover:border-teal-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-teal-700" />
                    <span className="text-xs font-bold text-slate-900">3. Institutional Submission Service</span>
                  </div>
                  <span className="text-[9px] font-mono text-teal-800 font-bold bg-teal-100 px-1.5 py-0.5 rounded">
                    Implemented
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  RFC 4180 CSV parser, canonical template builder, ERP column auto-mapping, and non-destructive resubmissions.
                </p>
              </button>
            </div>

            {/* Connecting Flow Indicator */}
            <div className="flex justify-center text-slate-400">
              <ArrowDown className="w-4 h-4" />
            </div>

            {/* Tier 3: Core Dual Processing Engines */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <span>Tier 3: Dual Rule & Temporal Reconciliation Engines</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Node 4: Versioned Rules Engine */}
                <button
                  type="button"
                  onClick={() => setSelectedComponentId('VERSIONED_RULE_ENGINE')}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedComponentId === 'VERSIONED_RULE_ENGINE'
                      ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-1 ring-blue-500'
                      : 'border-teal-500/60 bg-teal-50/20 hover:border-teal-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">4. Versioned Rule Engine</span>
                    <span className="text-[9px] font-mono text-teal-800 font-bold bg-teal-100 px-1.5 py-0.5 rounded">
                      Implemented
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                    Rules V-01 to V-12, version tagging (v1.2.0 $\rightarrow$ v1.3.0), and batch re-validation.
                  </p>
                </button>

                {/* Node 5: TPER Engine */}
                <button
                  type="button"
                  onClick={() => setSelectedComponentId('TPER_ENGINE')}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedComponentId === 'TPER_ENGINE'
                      ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-1 ring-blue-500'
                      : 'border-teal-500/60 bg-teal-50/20 hover:border-teal-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">5. TPER Matching Core</span>
                    <span className="text-[9px] font-mono text-teal-800 font-bold bg-teal-100 px-1.5 py-0.5 rounded">
                      Implemented
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                    Stages A–E: Keyed HMAC tokens, open intervals, transition awareness, and scoring.
                  </p>
                </button>
              </div>
            </div>

            {/* Connecting Flow Indicator */}
            <div className="flex justify-center text-slate-400">
              <ArrowDown className="w-4 h-4" />
            </div>

            {/* Tier 4: Repository, Audit & Verification Adapter */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>Tier 4: State Repository, Audit Trail & Verifier Adapter</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Node 6: Demo Repository */}
                <button
                  type="button"
                  onClick={() => setSelectedComponentId('DEMO_REPOSITORY')}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedComponentId === 'DEMO_REPOSITORY'
                      ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-1 ring-blue-500'
                      : 'border-teal-500/60 bg-teal-50/20 hover:border-teal-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">6. Demo Repo</span>
                    <span className="text-[9px] font-mono text-teal-800 font-bold bg-teal-100 px-1.5 py-0.5 rounded">
                      Implemented
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">
                    220+ records, 5 institutes, localStorage cache, reset.
                  </p>
                </button>

                {/* Node 7: Audit Service */}
                <button
                  type="button"
                  onClick={() => setSelectedComponentId('AUDIT_SERVICE')}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedComponentId === 'AUDIT_SERVICE'
                      ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-1 ring-blue-500'
                      : 'border-teal-500/60 bg-teal-50/20 hover:border-teal-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">7. Audit Log</span>
                    <span className="text-[9px] font-mono text-teal-800 font-bold bg-teal-100 px-1.5 py-0.5 rounded">
                      Implemented
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">
                    Append-only ledger, transitions, CSV export.
                  </p>
                </button>

                {/* Node 8: Mock Verifier Adapter */}
                <button
                  type="button"
                  onClick={() => setSelectedComponentId('MOCK_VERIFIER')}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedComponentId === 'MOCK_VERIFIER'
                      ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-1 ring-blue-500'
                      : 'border-teal-500/60 bg-teal-50/20 hover:border-teal-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">8. Mock Verifier</span>
                    <span className="text-[9px] font-mono text-teal-800 font-bold bg-teal-100 px-1.5 py-0.5 rounded">
                      Implemented
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">
                    Privacy-safe 3-state output (VERIFIED/NOT/UNABLE).
                  </p>
                </button>
              </div>
            </div>

            {/* Boundary Divider */}
            <div className="pt-4 border-t-2 border-dashed border-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-slate-900">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>FUTURE PRODUCTION HORIZON (Gov Infrastructure Required)</span>
                </div>
                <span className="text-[10px] font-mono bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
                  Requires Official MoE/MeitY Authorization
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-50 border border-blue-200 rounded text-slate-700">
                  <strong className="block text-slate-900 text-xs">HSM Key Mgmt</strong>
                  Hardware-isolated keys for APAAR pseudonyms.
                </div>
                <div className="p-2.5 bg-slate-50 border border-blue-200 rounded text-slate-700">
                  <strong className="block text-slate-900 text-xs">PostgreSQL RLS</strong>
                  Multi-tenant DB with regional institutional isolation.
                </div>
                <div className="p-2.5 bg-slate-50 border border-blue-200 rounded text-slate-700">
                  <strong className="block text-slate-900 text-xs">Live APAAR API</strong>
                  Official MoE/ABC DigiLocker integration.
                </div>
                <div className="p-2.5 bg-slate-50 border border-blue-200 rounded text-slate-700">
                  <strong className="block text-slate-900 text-xs">WORM Vault</strong>
                  Tamper-proof compliance audit storage.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL INSPECTION CARD (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="pb-3 border-b border-slate-100 flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
                  {activeDetail.tier}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">{activeDetail.name}</h2>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${
                  activeDetail.boundaryType === 'IMPLEMENTED'
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : activeDetail.boundaryType === 'SIMULATED'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
              >
                {activeDetail.boundaryType === 'IMPLEMENTED'
                  ? 'Implemented in Browser'
                  : activeDetail.boundaryType === 'SIMULATED'
                  ? 'Simulated Boundary'
                  : 'Future Production'}
              </span>
            </div>

            {/* Summary */}
            <p className="text-xs text-slate-600 leading-relaxed">{activeDetail.summary}</p>

            {/* Inputs & Outputs */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block text-[11px] font-mono">Inputs:</span>
                <ul className="list-disc list-inside text-slate-600 text-[10px] space-y-0.5">
                  {activeDetail.inputs.map((inp, idx) => (
                    <li key={idx} className="leading-tight">{inp}</li>
                  ))}
                </ul>
              </div>

              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block text-[11px] font-mono">Outputs:</span>
                <ul className="list-disc list-inside text-slate-600 text-[10px] space-y-0.5">
                  {activeDetail.outputs.map((out, idx) => (
                    <li key={idx} className="leading-tight">{out}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Privacy Safeguards */}
            <div className="p-3 bg-teal-50/50 rounded border border-teal-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-teal-900 font-bold text-[11px]">
                <Shield className="w-3.5 h-3.5 text-teal-700" />
                <span>Privacy & Data Protection Controls:</span>
              </div>
              <ul className="list-disc list-inside text-teal-800 text-[10px] space-y-0.5">
                {activeDetail.privacySafeguards.map((ps, idx) => (
                  <li key={idx} className="leading-tight">{ps}</li>
                ))}
              </ul>
            </div>

            {/* Prototype vs Production Distinction */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="font-semibold text-slate-900 block text-[11px]">Current Browser Implementation:</span>
                <p className="text-slate-600 text-[10px] mt-0.5 leading-relaxed">{activeDetail.prototypeImplementation}</p>
              </div>

              <div className="p-2.5 bg-blue-50/40 rounded border border-blue-200">
                <span className="font-semibold text-blue-950 block text-[11px]">Production Transition Requirement:</span>
                <p className="text-blue-800 text-[10px] mt-0.5 leading-relaxed">{activeDetail.futureProductionGap}</p>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Component ID: {activeDetail.id}</span>
            <span>SIH 2026 Prototype</span>
          </div>
        </div>
      </div>
    </div>
  );
};
