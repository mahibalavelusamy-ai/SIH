import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RuleDefinition } from '../types';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Edit2,
  Save,
  X,
  AlertOctagon,
  ShieldAlert,
} from 'lucide-react';

export const RulesConfigurationView: React.FC = () => {
  const {
    rules,
    ruleVersion,
    updateRuleDefinition,
    rerunValidation,
    role,
    permissions,
    submissions,
  } = useApp();

  const [editingRule, setEditingRule] = useState<RuleDefinition | null>(null);
  const [editSeverity, setEditSeverity] = useState<'BLOCKING' | 'WARNING' | 'INFO'>('WARNING');
  const [editEnabled, setEditEnabled] = useState<boolean>(true);
  const [revalidationFeedback, setRevalidationFeedback] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'INGESTION' | 'TEMPORAL' | 'QUOTAS'>('ALL');

  const filteredRules = rules.filter((r) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'INGESTION') {
      return ['V-01', 'V-02', 'V-03', 'V-04'].includes(r.ruleId);
    }
    if (selectedCategory === 'TEMPORAL') {
      return ['V-05', 'V-06', 'V-07'].includes(r.ruleId);
    }
    if (selectedCategory === 'QUOTAS') {
      return ['V-08', 'V-09', 'V-10', 'V-11', 'V-12'].includes(r.ruleId);
    }
    return true;
  });

  const canConfigure = permissions.canConfigureRules || role === 'SYSTEM_ADMIN';

  const handleStartEdit = (rule: RuleDefinition) => {
    if (!canConfigure) {
      alert(`Role ${role} does not have authority to configure validation rules. Switch to System Administrator.`);
      return;
    }
    setEditingRule(rule);
    setEditSeverity(rule.severity);
    setEditEnabled(rule.enabled);
  };

  const handleSaveEdit = () => {
    if (!editingRule) return;

    const updated: RuleDefinition = {
      ...editingRule,
      severity: editSeverity,
      blocking: editSeverity === 'BLOCKING',
      enabled: editEnabled,
    };

    updateRuleDefinition(updated);
    setEditingRule(null);
  };

  const handleTriggerRevalidation = () => {
    rerunValidation();
    setRevalidationFeedback(`Successfully re-evaluated all institutional filings against engine ${ruleVersion}. Audit entry recorded.`);
    setTimeout(() => setRevalidationFeedback(''), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header and Version Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Validation Rules Engine Configuration</h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-blue-600 text-white font-bold">
              Active: {ruleVersion}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured statutory rules V-01 through V-12 governing demographic integrity, temporal overlap, and quota reconciliation.
          </p>
        </div>

        {/* Re-run Validation Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerRevalidation}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Re-run Validation on Submissions
          </button>
        </div>
      </div>

      {/* Permission alert if role cannot edit */}
      {!canConfigure && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Read-Only Access:</strong> Modifying rules or rule severity requires <code>System Administrator</code>. Current role: <code>{role}</code>.
          </span>
        </div>
      )}

      {/* Revalidation Toast */}
      {revalidationFeedback && (
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-md text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{revalidationFeedback}</span>
        </div>
      )}

      {/* Rule Engine Version KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block">Active Engine Version</span>
          <div className="text-xl font-bold font-mono text-blue-700 mt-0.5">{ruleVersion}</div>
          <span className="text-[10px] text-slate-500">Statutory release</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block">Active Rules</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
            {rules.filter((r) => r.enabled).length} / {rules.length}
          </div>
          <span className="text-[10px] text-slate-500">V-01 to V-12 configured</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block">Blocking Rules</span>
          <div className="text-xl font-bold font-mono text-red-700 mt-0.5">
            {rules.filter((r) => r.severity === 'BLOCKING' && r.enabled).length}
          </div>
          <span className="text-[10px] text-slate-500">Row-rejection severity</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block">Submissions Bound</span>
          <div className="text-xl font-bold font-mono text-teal-700 mt-0.5">{submissions.length} Filings</div>
          <span className="text-[10px] text-slate-500">Version-locked snapshots</span>
        </div>
      </div>

      {/* Version Invariance Explanation Card */}
      <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
        <span className="font-bold text-slate-900 block font-mono">Rule Versioning & Historical Invariance:</span>
        <p className="leading-relaxed text-[11px]">
          Modifying any rule parameter creates a new engine release (e.g. <code>v1.3.0</code>). Existing institutional filings retain the exact rule version and outcome snapshot active at their filing timestamp to preserve regulatory auditability. Historical submissions only update when an explicit "Re-run Validation" is requested.
        </p>
      </div>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs text-xs">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-700">Filter Rules:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-[11px]">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-2.5 py-0.5 rounded font-medium transition-colors ${
                selectedCategory === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All (12)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('INGESTION')}
              className={`px-2.5 py-0.5 rounded font-medium transition-colors ${
                selectedCategory === 'INGESTION' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Ingestion & Format (V01–V04)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('TEMPORAL')}
              className={`px-2.5 py-0.5 rounded font-medium transition-colors ${
                selectedCategory === 'TEMPORAL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Temporal & Demographics (V05–V07)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('QUOTAS')}
              className={`px-2.5 py-0.5 rounded font-medium transition-colors ${
                selectedCategory === 'QUOTAS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Quotas & Intakes (V08–V12)
            </button>
          </div>
        </div>

        <span className="font-mono text-slate-500 text-[11px]">
          Showing {filteredRules.length} of {rules.length} Statutory Rules
        </span>
      </div>

      {/* Rule Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRules.map((rule) => {
          const isBeingEdited = editingRule?.ruleId === rule.ruleId;

          return (
            <div
              key={rule.ruleId}
              className={`bg-white rounded-lg border p-4 shadow-xs flex flex-col justify-between transition-colors ${
                !rule.enabled
                  ? 'border-slate-200 bg-slate-50/60 opacity-60'
                  : rule.severity === 'BLOCKING'
                  ? 'border-red-200 hover:border-red-300'
                  : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="space-y-3">
                {/* Header: Rule ID, Title, Status Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900">{rule.ruleId}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.2 rounded border font-semibold ${
                          rule.severity === 'BLOCKING'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : rule.severity === 'WARNING'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {rule.severity}
                      </span>
                      {!rule.enabled && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-600">
                          DISABLED
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-semibold text-slate-900">{rule.name}</h3>
                  </div>

                  {canConfigure && !isBeingEdited && (
                    <button
                      onClick={() => handleStartEdit(rule)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                      title="Edit rule properties"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Description & Explanation */}
                <p className="text-xs text-slate-600 leading-relaxed">{rule.description}</p>

                {/* Evaluated Fields */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono text-slate-500">
                  <span className="font-sans text-[10px] uppercase text-slate-400">Evaluates:</span>
                  {rule.fieldsEvaluated.map((f) => (
                    <span key={f} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {f}
                    </span>
                  ))}
                </div>

                {/* Remediation Guidance */}
                <div className="p-2.5 bg-slate-50 rounded border border-slate-100 text-[11px] text-slate-600 space-y-0.5">
                  <span className="font-semibold text-slate-800 block text-[10px] uppercase">Remediation:</span>
                  <p>{rule.remediationGuidance}</p>
                </div>
              </div>

              {/* Inline Editor if active */}
              {isBeingEdited ? (
                <div className="mt-4 pt-3 border-t border-slate-200 space-y-2 bg-blue-50/40 p-3 rounded">
                  <span className="text-xs font-bold text-slate-900 block">Edit Rule Configuration:</span>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Severity</label>
                      <select
                        value={editSeverity}
                        onChange={(e) => setEditSeverity(e.target.value as any)}
                        className="w-full text-xs bg-white border border-slate-300 rounded p-1"
                      >
                        <option value="BLOCKING">BLOCKING (Rejects Row)</option>
                        <option value="WARNING">WARNING (Flags Row)</option>
                        <option value="INFO">INFO (Advisory Only)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Status</label>
                      <select
                        value={editEnabled ? 'true' : 'false'}
                        onChange={(e) => setEditEnabled(e.target.value === 'true')}
                        className="w-full text-xs bg-white border border-slate-300 rounded p-1"
                      >
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setEditingRule(null)}
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-medium flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      Save & Bump Version
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Version: {rule.version}</span>
                  <span>{rule.blocking ? 'Blocking Action' : 'Non-Blocking'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
