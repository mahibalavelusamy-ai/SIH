/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { InstitutionalEntryView } from './views/InstitutionalEntryView';
import { OverviewView } from './views/OverviewView';
import { InstitutionPortalView } from './views/InstitutionPortalView';
import { SubmissionCentreView } from './views/SubmissionCentreView';
import { IdentityIntelligenceView } from './views/IdentityIntelligenceView';
import { TperReconciliationView } from './views/TperReconciliationView';
import { ExceptionReviewView } from './views/ExceptionReviewView';
import { MobilityGraphView } from './views/MobilityGraphView';
import { AicteMonitoringView } from './views/AicteMonitoringView';
import { TrustEngineView } from './views/TrustEngineView';
import { VerificationCentreView } from './views/VerificationCentreView';
import { RecordDnaView } from './views/RecordDnaView';
import { CyberShieldView } from './views/CyberShieldView';
import { ReportsView } from './views/ReportsView';
import { AdministrationView } from './views/AdministrationView';
import { RulesConfigurationView } from './views/RulesConfigurationView';
import { ArchitectureView } from './views/ArchitectureView';
import { AuditTrailView } from './views/AuditTrailView';
import { TestBenchView } from './views/TestBenchView';
import { SettingsView } from './views/SettingsView';

const MainContent: React.FC = () => {
  const { activeNav } = useApp();

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F7FA] min-h-[calc(100vh-48px)] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {activeNav === 'overview' && <OverviewView />}
        {(activeNav === 'institutions' || activeNav === 'institution') && <InstitutionPortalView />}
        {activeNav === 'submission' && <SubmissionCentreView />}
        {activeNav === 'identity-intelligence' && <IdentityIntelligenceView />}
        {activeNav === 'tper' && <TperReconciliationView />}
        {activeNav === 'exception-review' && <ExceptionReviewView />}
        {activeNav === 'mobility-graph' && <MobilityGraphView />}
        {(activeNav === 'seat-ledger' || activeNav === 'aicte-monitoring') && <AicteMonitoringView />}
        {activeNav === 'trust-engine' && <TrustEngineView />}
        {activeNav === 'verification' && <VerificationCentreView />}
        {activeNav === 'record-dna' && <RecordDnaView />}
        {activeNav === 'cybershield' && <CyberShieldView />}
        {activeNav === 'reports' && <ReportsView />}
        {activeNav === 'administration' && <AdministrationView />}
        {activeNav === 'rules' && <RulesConfigurationView />}
        {activeNav === 'architecture' && <ArchitectureView />}
        {activeNav === 'audit-trail' && <AuditTrailView />}
        {activeNav === 'test-bench' && <TestBenchView />}
        {activeNav === 'settings' && <SettingsView />}
      </div>
    </main>
  );
};

const AppShell: React.FC = () => {
  const { showEntryPortal, setShowEntryPortal, setActiveNav } = useApp();

  if (showEntryPortal) {
    return (
      <InstitutionalEntryView
        onEnter={() => setShowEntryPortal(false)}
        onExploreOverview={() => {
          setShowEntryPortal(false);
          setActiveNav('overview');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#101C32] text-[#101C32] antialiased font-sans">
      {/* Sticky Header with Top Bar Contract & Persistent Disclaimer */}
      <Navbar />

      {/* Workspace Layout: Collapsible Sidebar + Main Content Viewport */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
