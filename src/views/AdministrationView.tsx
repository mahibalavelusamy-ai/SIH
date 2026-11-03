import React, { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { RulesConfigurationView } from './RulesConfigurationView';
import { ArchitectureView } from './ArchitectureView';
import { AuditTrailView } from './AuditTrailView';
import { TestBenchView } from './TestBenchView';
import { SettingsView } from './SettingsView';
import {
  Sliders,
  Layers,
  History,
  Terminal,
  Settings,
  Shield,
} from 'lucide-react';

export const AdministrationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'RULES' | 'ARCHITECTURE' | 'AUDIT' | 'TEST_BENCH' | 'SETTINGS'>('RULES');

  return (
    <div className="space-y-6">
      {/* Top Administration Navigation Ribbon */}
      <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500 uppercase px-2">
          <Shield className="w-3.5 h-3.5 text-[#315EAA]" />
          <span className="font-semibold text-slate-700">Governance Modules:</span>
        </div>

        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-md border border-slate-200/80 text-xs font-medium">
          <button
            onClick={() => setActiveTab('RULES')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'RULES'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-[#315EAA]" />
            Rules & Engine
          </button>

          <button
            onClick={() => setActiveTab('ARCHITECTURE')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'ARCHITECTURE'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#168C83]" />
            Architecture
          </button>

          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'AUDIT'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-[#D99032]" />
            Audit Journal
          </button>

          <button
            onClick={() => setActiveTab('TEST_BENCH')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'TEST_BENCH'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-[#315EAA]" />
            Test Bench
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'SETTINGS'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            Platform State & RBAC
          </button>
        </div>
      </div>

      {/* Render Active Administration Sub-module */}
      <div>
        {activeTab === 'RULES' && <RulesConfigurationView />}
        {activeTab === 'ARCHITECTURE' && <ArchitectureView />}
        {activeTab === 'AUDIT' && <AuditTrailView />}
        {activeTab === 'TEST_BENCH' && <TestBenchView />}
        {activeTab === 'SETTINGS' && <SettingsView />}
      </div>
    </div>
  );
};

