import React from 'react';
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
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header and Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Architecture & Service Boundaries</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Architectural schematic illustrating prototype browser execution, simulated boundaries, and future production interfaces.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <span className="text-slate-700">Implemented in Browser</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-700">Simulated Boundary</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-700">Future Production Service</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Flowchart Container */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-6">
        {/* Tier 1: User & Regulatory Portals */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            Tier 1: Access Portals & Role Interaction Surface
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg border-2 border-teal-500/60 bg-teal-50/20 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Institution Portal</span>
                <span className="text-[10px] font-mono text-teal-700 font-semibold bg-teal-100 px-1.5 py-0.2 rounded">
                  Implemented
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                CSV template download, ERP column mapping, pre-validation preview, and correction resubmissions.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border-2 border-teal-500/60 bg-teal-50/20 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">AICTE Regulatory Portal</span>
                <span className="text-[10px] font-mono text-teal-700 font-semibold bg-teal-100 px-1.5 py-0.2 rounded">
                  Implemented
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Intake reconciliation tables, quota excess detection, and Exception Review adjudication workspace.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border-2 border-teal-500/60 bg-teal-50/20 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Verification Portal</span>
                <span className="text-[10px] font-mono text-teal-700 font-semibold bg-teal-100 px-1.5 py-0.2 rounded">
                  Implemented
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                External public query adapter returning minimal 3-state responses without direct data leakage.
              </p>
            </div>
          </div>
        </div>

        {/* Down Arrow */}
        <div className="flex justify-center text-slate-400">
          <ArrowDown className="w-5 h-5 animate-bounce" />
        </div>

        {/* Tier 2: Frontend Facade, Role Matrix & Ingestion Orchestration */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            Tier 2: Ingestion Orchestration & Authorization Gateway
          </div>
          <div className="p-4 rounded-lg border-2 border-teal-500/60 bg-teal-50/20 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900">Frontend API Facade & Role Permission Matrix</span>
              </div>
              <span className="text-[10px] font-mono text-teal-700 font-semibold bg-teal-100 px-1.5 py-0.2 rounded">
                Implemented in Browser
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Enforces action-level permissions across Submitter, Reviewer, Regulatory Reviewer, Verifier, and Admin roles. Validates column mappings and orchestrates immutable submission snapshots.
            </p>
          </div>
        </div>

        {/* Down Arrow */}
        <div className="flex justify-center text-slate-400">
          <ArrowDown className="w-5 h-5" />
        </div>

        {/* Tier 3: Core Processing Engines */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            Tier 3: Dual Rule & Reconciliation Engines
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Versioned Validation Engine */}
            <div className="p-4 rounded-lg border-2 border-teal-500/60 bg-teal-50/20 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-teal-700" />
                  <span className="font-bold text-slate-900">Versioned Validation Engine (V-01 – V-12)</span>
                </div>
                <span className="text-[10px] font-mono text-teal-700 font-semibold bg-teal-100 px-1.5 py-0.2 rounded">
                  Implemented
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Executes demographic rules, required field checks, format validations, date-of-birth plausibility, and quota ceiling checks. Classifies every row as ACCEPTED, FLAGGED, or REJECTED.
              </p>
            </div>

            {/* TPER Matching Core */}
            <div className="p-4 rounded-lg border-2 border-teal-500/60 bg-teal-50/20 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-700" />
                  <span className="font-bold text-slate-900">TPER Temporal Matching Engine (Stages A–E)</span>
                </div>
                <span className="text-[10px] font-mono text-teal-700 font-semibold bg-teal-100 px-1.5 py-0.2 rounded">
                  Implemented
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Keyed identifier matching, interval overlap detection, academic transition awareness (waives flags on prior completed transfers), and deterministic multi-signal candidate scoring.
              </p>
            </div>
          </div>
        </div>

        {/* Down Arrow */}
        <div className="flex justify-center text-slate-400">
          <ArrowDown className="w-5 h-5" />
        </div>

        {/* Tier 4: Storage & Audit Journal */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            Tier 4: State Repository & Supporting Adapters
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg border-2 border-teal-500/60 bg-teal-50/20 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Database className="w-3.5 h-3.5 text-slate-700" />
                  <span>Central Reactive Repository (LocalStorage Sync)</span>
                </div>
                <span className="text-[10px] font-mono text-teal-700 font-semibold bg-teal-100 px-1.5 py-0.2 rounded">
                  Implemented
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Maintains 220+ records, historical submissions, candidate queues, and deterministic demo seed reset.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border-2 border-teal-500/60 bg-teal-50/20 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Clock className="w-3.5 h-3.5 text-slate-700" />
                  <span>Append-Only Audit Journal & Mock Verifier</span>
                </div>
                <span className="text-[10px] font-mono text-teal-700 font-semibold bg-teal-100 px-1.5 py-0.2 rounded">
                  Implemented
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Logs batch submissions, rule version changes, reviewer decisions, and verification requests.
              </p>
            </div>
          </div>
        </div>

        {/* Explicit Future Production Boundary Line */}
        <div className="pt-6 border-t-2 border-dashed border-slate-300 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wide">
                Future Production Boundary (Not in Browser Prototype)
              </span>
            </div>
            <span className="text-[10px] font-mono bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
              Requires Authorised Gov Infrastructure
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-blue-200/80 space-y-1">
              <span className="font-semibold text-slate-900 block">1. Server-Side HSM Key Management</span>
              <p className="text-slate-600 text-[11px]">
                Hardware Security Modules to isolate HMAC keys from institutional client applications.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-blue-200/80 space-y-1">
              <span className="font-semibold text-slate-900 block">2. Multi-Tenant PostgreSQL</span>
              <p className="text-slate-600 text-[11px]">
                Row-level security, encrypted at rest, with partitioned regional institution schemas.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-blue-200/80 space-y-1">
              <span className="font-semibold text-slate-900 block">3. Live APAAR / ABC / DigiLocker API</span>
              <p className="text-slate-600 text-[11px]">
                Statutory live API connection (governed by official consent and MeitY/MoE agreements).
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-blue-200/80 space-y-1">
              <span className="font-semibold text-slate-900 block">4. WORM Audit Storage</span>
              <p className="text-slate-600 text-[11px]">
                Cryptographically hashed Write-Once-Read-Many storage for regulatory accountability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
