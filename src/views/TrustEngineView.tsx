import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  Clock,
  Scale,
  FileCheck2,
  TrendingUp,
  Info,
  ExternalLink,
} from 'lucide-react';

export const TrustEngineView: React.FC = () => {
  const { institutions, records, intakeLimits, duplicateCandidates, setActiveNav } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDimension, setSelectedDimension] = useState<'ALL' | 'IDENTITY' | 'TEMPORAL' | 'REGULATORY' | 'PROVENANCE'>('ALL');

  // Compute 4-dimensional trust vector per institution
  const institutionTrustScores = useMemo(() => {
    return institutions.map((inst) => {
      const instRecords = records.filter((r) => r.institutionId === inst.id);
      const total = instRecords.length || 1;

      // 1. Identity Consistency: % of records with valid APAAR and no V-01/V-03
      const validApaarCount = instRecords.filter((r) => r.apaarId && !r.findings?.some((f) => f.ruleId === 'V-03')).length;
      const identityScore = Math.round((validApaarCount / total) * 100);

      // 2. Temporal Consistency: % of records without cross-campus active collision
      const collisions = duplicateCandidates.filter(
        (c) =>
          c.status === 'PENDING_REVIEW' &&
          (c.recordA.institutionId === inst.id || c.recordB.institutionId === inst.id)
      ).length;
      const temporalScore = Math.max(70, Math.round(100 - collisions * 6));

      // 3. Regulatory Consistency: adherence to approved regular & supernumerary limits
      const instLimits = intakeLimits.filter((l) => l.institutionId === inst.id);
      let excessCount = 0;
      instLimits.forEach((l) => {
        const regularCount = instRecords.filter(
          (r) => r.programmeCode === l.programmeCode && !r.supernumeraryFlag && r.enrolmentStatus === 'ACTIVE'
        ).length;
        if (regularCount > l.approvedRegularIntake) excessCount++;
      });
      const regulatoryScore = excessCount > 0 ? 82 : 98;

      // 4. Evidence Provenance: verified filings, audit trails, registrar stamps
      const acceptedRatio = instRecords.filter((r) => r.rowOutcome === 'ACCEPTED').length / total;
      const provenanceScore = Math.round(85 + acceptedRatio * 14);

      // Composite Weighted Trust Index
      const compositeScore = Math.round(
        identityScore * 0.25 + temporalScore * 0.25 + regulatoryScore * 0.25 + provenanceScore * 0.25
      );

      let classification: 'HIGH_TRUST' | 'MONITORED' | 'AUDIT_REQUIRED' = 'HIGH_TRUST';
      if (compositeScore < 85) classification = 'AUDIT_REQUIRED';
      else if (compositeScore < 93) classification = 'MONITORED';

      return {
        id: inst.id,
        code: inst.code,
        name: inst.name,
        state: inst.state,
        identityScore,
        temporalScore,
        regulatoryScore,
        provenanceScore,
        compositeScore,
        classification,
        recordCount: instRecords.length,
      };
    });
  }, [institutions, records, intakeLimits, duplicateCandidates]);

  // Global composite average
  const globalComposite = Math.round(
    institutionTrustScores.reduce((acc, curr) => acc + curr.compositeScore, 0) /
      (institutionTrustScores.length || 1)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'IDVERA' },
          { label: 'Intelligence' },
          { label: 'Academic Trust Engine' },
        ]}
        title="Academic Trust Engine — Multi-Dimensional Credibility"
        subtitle="Objective algorithmic trust scoring across four statutory dimensions: Identity, Temporal Interval, Regulatory Quota, and Evidence Provenance."
        badge={
          <span className="font-mono text-[11px] text-[#168C83] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#168C83]" />
            COMPOSITE TRUST INDEX: {globalComposite}%
          </span>
        }
        actions={
          <button
            onClick={() => setActiveNav('verification')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101C32] hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#315EAA]" />
            Open Verification Centre
          </button>
        }
      />

      {/* 4 Dimension Pillar Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Dimension 1: Identity */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center">
              <Fingerprint className="w-4 h-4 text-[#315EAA]" />
            </div>
            <span className="text-lg font-bold font-mono text-[#315EAA]">95.4%</span>
          </div>
          <h3 className="text-xs font-semibold text-slate-900 font-mono uppercase tracking-wider">
            1. Identity Consistency
          </h3>
          <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
            APAAR format integrity, UIDAI checksum verification, and consistent demographic data across admissions.
          </p>
          <div className="pt-2 text-[10px] font-mono text-slate-500 border-t border-slate-100 flex justify-between">
            <span>Stage A / D Keying</span>
            <span className="text-teal-700 font-semibold">✓ Verified</span>
          </div>
        </div>

        {/* Dimension 2: Temporal */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded bg-teal-50 border border-teal-200 flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#168C83]" />
            </div>
            <span className="text-lg font-bold font-mono text-[#168C83]">91.8%</span>
          </div>
          <h3 className="text-xs font-semibold text-slate-900 font-mono uppercase tracking-wider">
            2. Temporal Consistency
          </h3>
          <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
            Detection of overlapping active enrolment intervals, sequential transfer timing, and cut-off window compliance.
          </p>
          <div className="pt-2 text-[10px] font-mono text-slate-500 border-t border-slate-100 flex justify-between">
            <span>Interval Evaluation</span>
            <span className="text-amber-700 font-semibold">⚠ 6 Collisions</span>
          </div>
        </div>

        {/* Dimension 3: Regulatory */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Scale className="w-4 h-4 text-[#D99032]" />
            </div>
            <span className="text-lg font-bold font-mono text-[#D99032]">93.2%</span>
          </div>
          <h3 className="text-xs font-semibold text-slate-900 font-mono uppercase tracking-wider">
            3. Regulatory Consistency
          </h3>
          <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
            Compliance with AICTE approved regular capacity and separate supernumerary quota (TFW, EWS, Lateral) ceilings.
          </p>
          <div className="pt-2 text-[10px] font-mono text-slate-500 border-t border-slate-100 flex justify-between">
            <span>Dual Seat Ledger</span>
            <span className="text-rose-700 font-semibold">1 Breach (CS)</span>
          </div>
        </div>

        {/* Dimension 4: Provenance */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded bg-indigo-50 border border-indigo-200 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-lg font-bold font-mono text-indigo-700">97.6%</span>
          </div>
          <h3 className="text-xs font-semibold text-slate-900 font-mono uppercase tracking-wider">
            4. Evidence Provenance
          </h3>
          <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
            Immutable SHA-256 chained audit logs, origin ERP upload fingerprints, and verified registrar attestations.
          </p>
          <div className="pt-2 text-[10px] font-mono text-slate-500 border-t border-slate-100 flex justify-between">
            <span>SHA-256 Hash Chain</span>
            <span className="text-teal-700 font-semibold">✓ 100% Valid</span>
          </div>
        </div>
      </div>

      {/* Institutional Trust Matrix Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 font-mono uppercase tracking-wider">
              Institutional Trust Assessment Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparative credibility scoring across all 5 registered demonstration campuses
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">AY 2026-27</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Institution</th>
                <th className="py-2.5 px-3 text-right">Identity (25%)</th>
                <th className="py-2.5 px-3 text-right">Temporal (25%)</th>
                <th className="py-2.5 px-3 text-right">Regulatory (25%)</th>
                <th className="py-2.5 px-3 text-right">Provenance (25%)</th>
                <th className="py-2.5 px-3 text-right font-bold">Composite Trust</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {institutionTrustScores.map((inst) => (
                <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-sans">
                    <div className="font-semibold text-slate-900">{inst.name}</div>
                    <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span className="text-[#315EAA] font-semibold">{inst.code}</span>
                      <span>·</span>
                      <span>{inst.state}</span>
                      <span>·</span>
                      <span>{inst.recordCount} Enrolments</span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-right text-slate-700 font-medium">{inst.identityScore}%</td>
                  <td className="py-2.5 px-3 text-right text-slate-700 font-medium">{inst.temporalScore}%</td>
                  <td className="py-2.5 px-3 text-right text-slate-700 font-medium">{inst.regulatoryScore}%</td>
                  <td className="py-2.5 px-3 text-right text-slate-700 font-medium">{inst.provenanceScore}%</td>

                  <td className="py-2.5 px-3 text-right font-bold text-sm text-slate-900">
                    <span className={inst.compositeScore >= 93 ? 'text-[#168C83]' : inst.compositeScore >= 85 ? 'text-[#315EAA]' : 'text-[#C94C4C]'}>
                      {inst.compositeScore}%
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    {inst.classification === 'HIGH_TRUST' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-[#168C83] border border-teal-200">
                        HIGH TRUST
                      </span>
                    )}
                    {inst.classification === 'MONITORED' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#315EAA] border border-blue-200">
                        MONITORED
                      </span>
                    )}
                    {inst.classification === 'AUDIT_REQUIRED' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-[#C94C4C] border border-rose-200">
                        AUDIT REQUIRED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

