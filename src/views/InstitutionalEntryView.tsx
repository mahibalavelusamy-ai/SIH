import React, { useState } from 'react';
import { useApp, ROLE_DESCRIPTIONS } from '../context/AppContext';
import { Role } from '../types';
import {
  ShieldCheck,
  Building2,
  ArrowRight,
  Info,
  CheckCircle2,
  Lock,
  Layers,
  FileCheck,
  UserCheck,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface InstitutionalEntryViewProps {
  onEnter: () => void;
  onExploreOverview: () => void;
}

export const InstitutionalEntryView: React.FC<InstitutionalEntryViewProps> = ({
  onEnter,
  onExploreOverview,
}) => {
  const { role, setRole } = useApp();
  const [selectedPersona, setSelectedPersona] = useState<Role>(role);

  const personaList: { role: Role; label: string; badge: string; desc: string }[] = [
    {
      role: 'AICTE_REVIEWER',
      label: 'AICTE Regulatory Reviewer',
      badge: 'Recommended for Judges',
      desc: 'Adjudicate cross-institution duplicate candidates, inspect seat quotas, and resolve exceptions.',
    },
    {
      role: 'INSTITUTION_SUBMITTER',
      label: 'Institution Submitter',
      badge: 'College Admissions Cell',
      desc: 'Upload enrolment batches, configure ERP column mapping, and review row-level validation.',
    },
    {
      role: 'VERIFICATION_OFFICER',
      label: 'Verification Officer',
      badge: 'Public & Employer Query',
      desc: 'Issue zero-knowledge verification requests with minimum-disclosure response certificates.',
    },
    {
      role: 'AUDITOR',
      label: 'CAG / Oversight Auditor',
      badge: 'Read-Only Assurance',
      desc: 'Inspect SHA-256 tamper-evident audit ledger and cryptographic event chains.',
    },
  ];

  const handleEnterDemo = () => {
    setRole(selectedPersona);
    onEnter();
  };

  const handleOverviewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setRole(selectedPersona);
    onExploreOverview();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top GovTech Institutional Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="IDVERA Institutional Portal"
            className="h-9 w-auto object-contain rounded"
          />
          <div className="hidden sm:block border-l border-slate-700 pl-3">
            <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400 block leading-tight">
              Statutory Enrolment Assurance
            </span>
            <span className="text-xs font-semibold text-slate-200">
              National Institutional Gateway
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            Prototype Sandbox · AY 2026-27
          </span>
          <button
            onClick={handleOverviewClick}
            className="text-xs text-slate-300 hover:text-white flex items-center gap-1 hover:underline transition-colors"
          >
            <span>Platform Overview</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col lg:flex-row items-center justify-center gap-10">
        {/* Left Column: Institutional Identity & System Context */}
        <div className="w-full lg:w-1/2 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>AICTE Approval Process Handbook · Statutory Alignment</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight font-heading">
              Academic Enrolment Intelligence & Verification
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
              Autonomous reconciliation infrastructure for state directorates, technical universities,
              and regulatory councils. Detects dual admissions, audits intake quotas, and provides
              privacy-preserving enrolment verification.
            </p>
          </div>

          {/* Quick Guided Pipeline Preview */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Integrated End-to-End Workflow</span>
              <span className="text-blue-400 font-semibold">5 Linear Stages</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[10px]">
              <div className="p-2 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
                <span className="block text-slate-500 text-[9px]">01</span>
                Upload
              </div>
              <div className="p-2 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
                <span className="block text-slate-500 text-[9px]">02</span>
                Validate
              </div>
              <div className="p-2 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
                <span className="block text-slate-500 text-[9px]">03</span>
                Reconcile
              </div>
              <div className="p-2 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
                <span className="block text-slate-500 text-[9px]">04</span>
                Review
              </div>
              <div className="p-2 rounded bg-blue-950/60 border border-blue-700/60 text-blue-200">
                <span className="block text-blue-400 text-[9px]">05</span>
                Verify
              </div>
            </div>
          </div>

          {/* Security & Regulatory Standards Footnote */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>RFC 4180 Ingestion</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>TPER Temporal Engine</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>SHA-256 Event Ledger</span>
            </div>
          </div>
        </div>

        {/* Right Column: Institutional Sign-in Portal Card */}
        <div className="w-full lg:w-1/2 max-w-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 relative overflow-hidden">
            {/* Subtle Top Accent Glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-teal-400 to-indigo-500"></div>

            {/* Portal Card Header */}
            <div className="space-y-1 pb-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Institutional Access Portal
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-900/60 text-blue-300 border border-blue-700/60">
                  GovTech Identity
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Academic Enrolment Intelligence & Verification
              </h2>
              <p className="text-xs text-slate-400">
                AICTE / State Technical Directorate Regulatory Gateway
              </p>
            </div>

            {/* Mandatory Prototype Notice: No Fake Login / Transparent Notice */}
            <div className="my-4 p-3.5 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-blue-300 font-medium">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-semibold">Prototype Access Notice</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                <strong>Prototype Access:</strong> Authentication is not enabled in this demonstration. Anyone can explore the platform without signing in. Secure institutional authentication and role-based access will be enabled in the production deployment.
              </p>
              <div className="pt-1 border-t border-blue-500/20 text-[10px] text-slate-400">
                Production architecture integrates <strong>Jan Parichay (National SSO / MeriPehchaan OAuth 2.0)</strong> and institutional SAML/OIDC federations.
              </div>
            </div>

            {/* Persona Selection for Demonstration Session (Explicitly Labelled as Simulated) */}
            <div className="space-y-2 mb-5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-300">
                  Select Simulated Persona:
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  Simulated Demonstration Workflows
                </span>
              </div>
              <div className="space-y-2">
                {personaList.map((p) => {
                  const isSelected = selectedPersona === p.role;
                  return (
                    <div
                      key={p.role}
                      onClick={() => setSelectedPersona(p.role)}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-950/50 border-blue-500 shadow-xs'
                          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {p.label}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                              p.badge.includes('Recommended')
                                ? 'bg-amber-950/60 text-amber-300 border-amber-600/50'
                                : 'bg-slate-700/60 text-slate-300 border-slate-600/40'
                            }`}
                          >
                            {p.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 leading-snug">
                          {p.desc}
                        </p>
                      </div>
                      <div className="pt-0.5 shrink-0">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-blue-400 bg-blue-600'
                              : 'border-slate-600 bg-transparent'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Prominent Primary Button */}
            <div className="space-y-3">
              <button
                onClick={handleEnterDemo}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold tracking-wide transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Enter Demonstration</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Secondary Link to Platform Overview */}
              <div className="text-center">
                <button
                  onClick={handleOverviewClick}
                  className="text-xs text-slate-400 hover:text-blue-400 transition-colors inline-flex items-center gap-1.5 py-1"
                >
                  <span>Explore Platform Overview</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Bottom Production Compliance Notice */}
            <div className="mt-5 pt-3 border-t border-slate-800/80 text-center">
              <span className="text-[10px] font-mono text-slate-400">
                SIH GovTech Evaluation Version · No Live Government Data Linked
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 sm:px-8 py-3 text-center sm:flex sm:items-center sm:justify-between text-[11px] text-slate-400 font-mono">
        <div>
          IDVERA: Institutional Enrolment Reconciliation & Verification Prototype
        </div>
        <div className="mt-1 sm:mt-0 text-slate-400">
          Designed for AICTE, State Higher Education Councils & NAD/APAAR Stakeholders
        </div>
      </footer>
    </div>
  );
};

