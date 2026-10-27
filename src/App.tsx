/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { OverviewView } from './views/OverviewView';
import { InstitutionPortalView } from './views/InstitutionPortalView';
import { SubmissionCentreView } from './views/SubmissionCentreView';
import { TperReconciliationView } from './views/TperReconciliationView';
import { ExceptionReviewView } from './views/ExceptionReviewView';
import { AicteMonitoringView } from './views/AicteMonitoringView';
import { VerificationCentreView } from './views/VerificationCentreView';
import { RulesConfigurationView } from './views/RulesConfigurationView';
import { ArchitectureView } from './views/ArchitectureView';
import { AuditTrailView } from './views/AuditTrailView';
import { TestBenchView } from './views/TestBenchView';
import { SettingsView } from './views/SettingsView';

const MainContent: React.FC = () => {
  const { activeNav } = useApp();

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 min-h-[calc(100vh-56px)] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {activeNav === 'overview' && <OverviewView />}
        {activeNav === 'institution' && <InstitutionPortalView />}
        {activeNav === 'submission' && <SubmissionCentreView />}
        {activeNav === 'tper' && <TperReconciliationView />}
        {activeNav === 'exception-review' && <ExceptionReviewView />}
        {activeNav === 'aicte-monitoring' && <AicteMonitoringView />}
        {activeNav === 'verification' && <VerificationCentreView />}
        {activeNav === 'rules' && <RulesConfigurationView />}
        {activeNav === 'architecture' && <ArchitectureView />}
        {activeNav === 'audit-trail' && <AuditTrailView />}
        {activeNav === 'test-bench' && <TestBenchView />}
        {activeNav === 'settings' && <SettingsView />}
      </div>
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col bg-slate-900 text-slate-900 antialiased font-sans">
        {/* Sticky Header with Top Bar Contract & Persistent Disclaimer */}
        <Navbar />

        {/* Workspace Layout: Collapsible Sidebar + Main Content Viewport */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <MainContent />
        </div>
      </div>
    </AppProvider>
  );
}
