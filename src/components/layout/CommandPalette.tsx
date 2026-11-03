import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  LayoutDashboard,
  Building2,
  UploadCloud,
  Fingerprint,
  GitCompare,
  GitFork,
  BarChart3,
  Award,
  CheckCircle2,
  Dna,
  ShieldCheck,
  FileSpreadsheet,
  Sliders,
  ArrowRight,
  User,
  AlertTriangle,
  X,
  FileWarning,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const {
    setActiveNav,
    institutions,
    records,
    duplicateCandidates,
    setSelectedInstitutionId,
  } = useApp();

  const [query, setQuery] = useState('');

  // Close on Escape or open on Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Parent handles opening or we can dispatch
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset query on close
  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  // Navigation commands
  const navCommands = useMemo(() => [
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard, category: 'Navigation' },
    { id: 'institutions', label: 'Institutions Management Dossier', icon: Building2, category: 'Navigation' },
    { id: 'submission', label: 'Submission Centre (Batch Upload)', icon: UploadCloud, category: 'Navigation' },
    { id: 'identity-intelligence', label: 'Identity Intelligence & Keyed Matching', icon: Fingerprint, category: 'Navigation' },
    { id: 'tper', label: 'TPER Reconciliation Core', icon: GitCompare, category: 'Navigation' },
    { id: 'exception-review', label: 'Exception Review & Human Adjudication Desk', icon: AlertTriangle, category: 'Navigation' },
    { id: 'mobility-graph', label: 'Academic Mobility Graph & Trajectories', icon: GitFork, category: 'Navigation' },
    { id: 'seat-ledger', label: 'Programme Seat Ledger & AICTE Quota Audit', icon: BarChart3, category: 'Navigation' },
    { id: 'trust-engine', label: 'Academic Trust Assessment Engine', icon: Award, category: 'Navigation' },
    { id: 'verification', label: 'Authorised Verification Centre', icon: CheckCircle2, category: 'Navigation' },
    { id: 'record-dna', label: 'Record DNA Provenance Ledger', icon: Dna, category: 'Navigation' },
    { id: 'cybershield', label: 'CyberShield Security Safeguards', icon: ShieldCheck, category: 'Navigation' },
    { id: 'reports', label: 'Regulatory Reports & CSV Export', icon: FileSpreadsheet, category: 'Navigation' },
    { id: 'administration', label: 'Administration & Governance', icon: Sliders, category: 'Navigation' },
  ], []);

  // Filtered results
  const filteredNav = useMemo(() => {
    if (!query.trim()) return navCommands;
    const q = query.toLowerCase();
    return navCommands.filter((c) => c.label.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
  }, [query, navCommands]);

  const filteredInstitutions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return institutions.filter((i) => i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q));
  }, [query, institutions]);

  const filteredStudents = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return records
      .filter((r) => r.studentName.toLowerCase().includes(q) || r.studentReference.toLowerCase().includes(q) || (r.apaarId && r.apaarId.includes(q)))
      .slice(0, 5);
  }, [query, records]);

  const filteredCollisions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return duplicateCandidates
      .filter((c) => c.id.toLowerCase().includes(q) || c.recordA.studentName.toLowerCase().includes(q))
      .slice(0, 3);
  }, [query, duplicateCandidates]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, campuses, student references, or jump to module..."
            className="w-full text-sm bg-transparent border-none outline-none text-[#101C32] placeholder-slate-400 font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] font-mono font-semibold text-slate-400 bg-slate-200/80 px-2 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-4 divide-y divide-slate-100 flex-1">
          {/* Section: Quick Navigation */}
          {filteredNav.length > 0 && (
            <div className="space-y-1">
              <span className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Modules & Views
              </span>
              {filteredNav.slice(0, 6).map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      setActiveNav(cmd.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-slate-100 text-slate-800 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-slate-500 group-hover:text-[#315EAA]" />
                      <span className="font-semibold text-slate-900">{cmd.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Section: Campuses */}
          {filteredInstitutions.length > 0 && (
            <div className="space-y-1 pt-2">
              <span className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Campuses
              </span>
              {filteredInstitutions.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => {
                    setSelectedInstitutionId(inst.id);
                    setActiveNav('institutions');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-slate-100 text-slate-800 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-[#315EAA]" />
                    <div>
                      <span className="font-bold text-slate-900">{inst.name}</span>
                      <span className="text-slate-400 font-mono ml-2">({inst.code})</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Dossier →</span>
                </button>
              ))}
            </div>
          )}

          {/* Section: Students / Enrolment Records */}
          {filteredStudents.length > 0 && (
            <div className="space-y-1 pt-2">
              <span className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Student Enrolment Records
              </span>
              {filteredStudents.map((stud) => (
                <button
                  key={stud.id}
                  onClick={() => {
                    setActiveNav('record-dna');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-slate-100 text-slate-800 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-[#168C83]" />
                    <div>
                      <span className="font-bold text-slate-900">{stud.studentName}</span>
                      <span className="text-slate-400 font-mono ml-2">Ref: {stud.studentReference}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {stud.programmeCode}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Section: TPER Collisions */}
          {filteredCollisions.length > 0 && (
            <div className="space-y-1 pt-2">
              <span className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                TPER Collision Candidates
              </span>
              {filteredCollisions.map((cand) => (
                <button
                  key={cand.id}
                  onClick={() => {
                    setActiveNav('tper');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-slate-100 text-slate-800 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <GitCompare className="w-4 h-4 text-[#D99032]" />
                    <div>
                      <span className="font-bold text-slate-900">{cand.id}: {cand.recordA.studentName}</span>
                      <span className="text-slate-400 text-[11px] block">{cand.explanation}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-amber-700 font-bold">Review →</span>
                </button>
              ))}
            </div>
          )}

          {filteredNav.length === 0 && filteredInstitutions.length === 0 && filteredStudents.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400 font-mono">
              No matching commands or entities found for "{query}".
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 font-mono flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>IDVERA Universal Command Bar</span>
        </div>
      </div>
    </div>
  );
};

