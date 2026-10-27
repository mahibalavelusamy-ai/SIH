import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Role,
  RolePermission,
  Institution,
  Programme,
  IntakeLimit,
  StudentEnrolment,
  Submission,
  DuplicateCandidate,
  AuditEvent,
  VerificationRequest,
  VerificationOutcome,
  RuleDefinition,
  RowOutcome,
  LedgerVerificationResult,
} from '../types';
import { initializeSeedState } from '../services/seedData';
import { processSubmissionBatch, DEFAULT_RULES, INITIAL_RULE_VERSION } from '../services/rulesEngine';
import { runTperReconciliation, maskApaarId } from '../services/tperEngine';
import {
  computeAuditEventHash,
  verifyLedgerIntegrity,
  validateTenantAccess,
  computeBatchFingerprint,
  checkRateLimit,
  sanitizeAuditMessage,
} from '../services/securityService';

const STORAGE_KEY = 'idvera_demo_state_v1';

export const ROLE_PERMISSIONS: Record<Role, RolePermission> = {
  INSTITUTION_SUBMITTER: {
    canSubmitData: true,
    canApproveInstitutionReview: false,
    canResolveCrossInstitutionExceptions: false,
    canVerifyStudents: false,
    canConfigureRules: false,
    canResetDemo: false,
    canViewAudit: true,
  },
  INSTITUTION_REVIEWER: {
    canSubmitData: false,
    canApproveInstitutionReview: true,
    canResolveCrossInstitutionExceptions: false,
    canVerifyStudents: false,
    canConfigureRules: false,
    canResetDemo: false,
    canViewAudit: true,
  },
  AICTE_REVIEWER: {
    canSubmitData: false,
    canApproveInstitutionReview: false,
    canResolveCrossInstitutionExceptions: true,
    canVerifyStudents: false,
    canConfigureRules: false,
    canResetDemo: false,
    canViewAudit: true,
  },
  VERIFICATION_OFFICER: {
    canSubmitData: false,
    canApproveInstitutionReview: false,
    canResolveCrossInstitutionExceptions: false,
    canVerifyStudents: true,
    canConfigureRules: false,
    canResetDemo: false,
    canViewAudit: true,
  },
  SYSTEM_ADMIN: {
    canSubmitData: false,
    canApproveInstitutionReview: false,
    canResolveCrossInstitutionExceptions: false,
    canVerifyStudents: false,
    canConfigureRules: true,
    canResetDemo: true,
    canViewAudit: true,
  },
  AUDITOR: {
    canSubmitData: false,
    canApproveInstitutionReview: false,
    canResolveCrossInstitutionExceptions: false,
    canVerifyStudents: false,
    canConfigureRules: false,
    canResetDemo: false,
    canViewAudit: true,
  },
};

export const ROLE_DESCRIPTIONS: Record<Role, { title: string; subtitle: string; scope: string }> = {
  INSTITUTION_SUBMITTER: {
    title: 'Institution Submitter',
    subtitle: 'College Registrar / Admissions Officer',
    scope: 'Upload batches, map ERP columns, inspect row-level errors, resubmit corrections.',
  },
  INSTITUTION_REVIEWER: {
    title: 'Institution Reviewer',
    subtitle: 'College Academic Dean / Principal',
    scope: 'Review institution-level corrections and endorse compliance filings.',
  },
  AICTE_REVIEWER: {
    title: 'AICTE Regulatory Reviewer',
    subtitle: 'AICTE Bureau Officer / Approval Cell',
    scope: 'Investigate cross-institution duplicate candidates and programme intake quota violations.',
  },
  VERIFICATION_OFFICER: {
    title: 'Verification Officer',
    subtitle: 'Employer / Public Agency / Verifier',
    scope: 'Submit privacy-safe mock verification queries for enrolled student status.',
  },
  SYSTEM_ADMIN: {
    title: 'System Administrator',
    subtitle: 'Platform Operations Administrator',
    scope: 'Manage rule engine configuration, adjust candidate thresholds, perform demo resets.',
  },
  AUDITOR: {
    title: 'Auditor',
    subtitle: 'Independent Oversight / CAG Inspector',
    scope: 'Read-only immutable access to event journals, rule versions, and decision logs.',
  },
};

export interface AppContextType {
  role: Role;
  permissions: RolePermission;
  activeNav: string;
  selectedInstitutionId: string;
  selectedAcademicYear: string;
  institutions: Institution[];
  programmes: Programme[];
  intakeLimits: IntakeLimit[];
  records: StudentEnrolment[];
  submissions: Submission[];
  duplicateCandidates: DuplicateCandidate[];
  auditEvents: AuditEvent[];
  verificationRequests: VerificationRequest[];
  rules: RuleDefinition[];
  ruleVersion: string;
  setRole: (role: Role) => void;
  setActiveNav: (nav: string) => void;
  setSelectedInstitutionId: (id: string) => void;
  setSelectedAcademicYear: (ay: string) => void;
  addSubmission: (
    institutionId: string,
    academicYear: string,
    submittedBy: string,
    rawRecords: StudentEnrolment[],
    isResubmission?: boolean,
    originalSubId?: string
  ) => { submissionId: string; accepted: number; flagged: number; rejected: number };
  resolveDuplicateCandidate: (
    candidateId: string,
    newStatus: 'LEGITIMATE_TRANSFER' | 'NOT_A_MATCH' | 'NEEDS_INFO' | 'CONFIRMED_DUPLICATE',
    reason: string
  ) => boolean;
  updateRuleDefinition: (updatedRule: RuleDefinition) => void;
  rerunValidation: (submissionId?: string) => void;
  executeVerificationQuery: (
    searchType: 'STUDENT_REF' | 'APAAR_ID',
    searchValue: string,
    institutionId: string,
    academicYear: string,
    programmeCode?: string
  ) => VerificationRequest;
  resetDemoData: () => void;
  exportDemoSnapshot: () => string;
  importDemoSnapshot: (json: string) => boolean;
  verifyAuditLedger: () => LedgerVerificationResult;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Try loading state from localStorage or seed
  const [role, setRoleState] = useState<Role>('AICTE_REVIEWER');
  const [activeNav, setActiveNav] = useState<string>('overview');
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('INST-001');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2026-27');

  const [institutions, setInstitutions] = useState<Institution[]>(() => {
    return initializeSeedState().institutions;
  });
  const [programmes, setProgrammes] = useState<Programme[]>(() => {
    return initializeSeedState().programmes;
  });
  const [intakeLimits, setIntakeLimits] = useState<IntakeLimit[]>(() => {
    return initializeSeedState().intakeLimits;
  });
  const [records, setRecords] = useState<StudentEnrolment[]>(() => {
    return initializeSeedState().records;
  });
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    return initializeSeedState().submissions;
  });
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>(() => {
    return initializeSeedState().duplicateCandidates;
  });
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(() => {
    return initializeSeedState().auditEvents;
  });
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>(() => {
    return initializeSeedState().verificationRequests;
  });
  const [rules, setRules] = useState<RuleDefinition[]>(() => {
    return DEFAULT_RULES;
  });
  const [ruleVersion, setRuleVersion] = useState<string>('v1.2.0');

  // Load from localStorage on initial mount if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.records && parsed.submissions) {
          setRecords(parsed.records);
          setSubmissions(parsed.submissions);

          const rawCandidates: DuplicateCandidate[] = parsed.duplicateCandidates || [];
          const sanitizedCandidates: DuplicateCandidate[] = [];
          const seenIds = new Set<string>();
          rawCandidates.forEach((c) => {
            let uniqueId = c.id;
            let counter = 2;
            while (seenIds.has(uniqueId)) {
              uniqueId = `${c.id}-${counter++}`;
            }
            seenIds.add(uniqueId);
            sanitizedCandidates.push({ ...c, id: uniqueId });
          });

          setDuplicateCandidates(sanitizedCandidates);
          setAuditEvents(parsed.auditEvents || []);
          setVerificationRequests(parsed.verificationRequests || []);
          setRules(parsed.rules || DEFAULT_RULES);
          setRuleVersion(parsed.ruleVersion || 'v1.2.0');
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved state from localStorage:', e);
    }
  }, []);

  // Save to localStorage when state updates
  useEffect(() => {
    try {
      const stateToPersist = {
        records,
        submissions,
        duplicateCandidates,
        auditEvents,
        verificationRequests,
        rules,
        ruleVersion,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
    } catch (e) {
      console.warn('Failed to persist state to localStorage:', e);
    }
  }, [records, submissions, duplicateCandidates, auditEvents, verificationRequests, rules, ruleVersion]);

  // Current role permissions
  const permissions = ROLE_PERMISSIONS[role];

  // Cryptographically chained, PII-sanitized audit logging
  const addAuditEvent = (
    action: string,
    entityType: AuditEvent['entityType'],
    entityId: string,
    previousState: string | null,
    newState: string | null,
    reasonOrRuleId: string | null,
    reference: string | null,
    tenantId?: string
  ) => {
    const sanitizedReason = reasonOrRuleId ? sanitizeAuditMessage(reasonOrRuleId) : null;
    const sanitizedRef = reference ? sanitizeAuditMessage(reference) : null;

    setAuditEvents((prev) => {
      const topHash = prev.length > 0 && prev[0].hash
        ? prev[0].hash
        : 'GENESIS_BLOCK_0000000000000000000000000000000000000000000000000000000000000000';

      const draftEvent: Omit<AuditEvent, 'hash'> = {
        id: `AUD-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        actorName: ROLE_DESCRIPTIONS[role].title,
        actorRole: role,
        action,
        entityType,
        entityId,
        previousState,
        newState,
        reasonOrRuleId: sanitizedReason,
        reference: sanitizedRef,
        tenantId: tenantId || selectedInstitutionId || 'global',
        prevHash: topHash,
      };

      const hash = computeAuditEventHash(draftEvent, topHash);
      const newEvent: AuditEvent = {
        ...draftEvent,
        hash,
      };

      return [newEvent, ...prev];
    });
  };

  // Role Switcher with audit logging
  const setRole = (newRole: Role) => {
    if (newRole === role) return;
    const old = role;
    setRoleState(newRole);
    addAuditEvent(
      'ROLE_SWITCH',
      'ROLE_CHANGE',
      newRole,
      old,
      newRole,
      'User switched demo role in interface',
      'DEMO_SIMULATION'
    );
  };

  // Add or resubmit a submission batch with tenant validation & idempotency checks
  const addSubmission = (
    institutionId: string,
    academicYear: string,
    submittedBy: string,
    rawRecords: StudentEnrolment[],
    isResubmission = false,
    originalSubId?: string
  ) => {
    if (!permissions.canSubmitData) {
      addAuditEvent(
        'ACCESS_DENIED',
        'SUBMISSION',
        institutionId,
        'UNAUTHORIZED_ATTEMPT',
        'DENIED',
        `Role ${role} denied batch submission permission`,
        'LEAST_PRIVILEGE_ENFORCEMENT',
        institutionId
      );
      alert(`Access Denied: Role ${role} does not have permission to submit institutional enrolment batches.`);
      return { submissionId: '', accepted: 0, flagged: 0, rejected: 0 };
    }

    // Tenant Isolation Enforcement
    const tenantCheck = validateTenantAccess(role, selectedInstitutionId, institutionId);
    if (!tenantCheck.allowed) {
      addAuditEvent(
        'ACCESS_DENIED',
        'SUBMISSION',
        institutionId,
        'TENANT_VIOLATION',
        'DENIED',
        tenantCheck.reason || 'Cross-tenant ingestion blocked',
        'TENANT_ISOLATION_ENFORCEMENT',
        institutionId
      );
      alert(`Tenant Isolation Violation: ${tenantCheck.reason}`);
      return { submissionId: '', accepted: 0, flagged: 0, rejected: 0 };
    }

    // Idempotent Submission Checksum Protection
    const batchFingerprint = computeBatchFingerprint(institutionId, academicYear, rawRecords);
    if (!isResubmission) {
      const existingMatch = submissions.find(
        (s) => s.institutionId === institutionId && s.academicYear === academicYear && s.batchChecksum === batchFingerprint
      );
      if (existingMatch) {
        addAuditEvent(
          'IDEMPOTENT_SUBMISSION_REPLAY',
          'SUBMISSION',
          existingMatch.id,
          'IDENTICAL_BATCH_DETECTED',
          'REPLAYED',
          `Batch checksum ${batchFingerprint.slice(0, 16)} matches previous submission ${existingMatch.id}. Idempotent replay executed without duplicate intake counting.`,
          'IDEMPOTENCY_SAFETY',
          institutionId
        );
        return {
          submissionId: existingMatch.id,
          accepted: existingMatch.acceptedRows,
          flagged: existingMatch.flaggedRows,
          rejected: existingMatch.rejectedRows,
        };
      }
    }

    // Process raw records through active rules engine
    const { processedRecords, summary } = processSubmissionBatch(rawRecords, rules, intakeLimits);

    const submissionId = isResubmission && originalSubId
      ? `${originalSubId}-REV-${Date.now().toString().slice(-4)}`
      : `SUB-${academicYear.split('-')[0]}-${institutionId.slice(-3)}-${Date.now().toString().slice(-4)}`;

    const newSubmission: Submission = {
      id: submissionId,
      institutionId,
      academicYear,
      timestamp: new Date().toISOString(),
      ruleEngineVersion: ruleVersion,
      submittedBy,
      status: summary.rejected > 0 ? 'REVIEW_REQUIRED' : summary.flagged > 0 ? 'VALIDATED' : 'RECONCILIATION_COMPLETE',
      totalRows: processedRecords.length,
      acceptedRows: summary.accepted,
      flaggedRows: summary.flagged,
      rejectedRows: summary.rejected,
      records: processedRecords,
      batchChecksum: batchFingerprint,
      isResubmission,
      originalSubmissionId: originalSubId,
      revalidationCount: 0,
    };

    // Update submissions list
    setSubmissions((prev) => [newSubmission, ...prev]);

    // Update global records: replace records for this institution/academicYear or append
    setRecords((prev) => {
      // If resubmission, remove previous records for this institution in this academic year
      const filtered = isResubmission
        ? prev.filter((r) => !(r.institutionId === institutionId && r.academicYear === academicYear))
        : prev;
      const combined = [...filtered, ...processedRecords];

      // Re-run TPER candidate reconciliation on eligible non-rejected records
      const newCandidates = runTperReconciliation(combined, duplicateCandidates);
      setDuplicateCandidates(newCandidates);

      return combined;
    });

    addAuditEvent(
      isResubmission ? 'BATCH_RESUBMISSION' : 'BATCH_SUBMISSION',
      'SUBMISSION',
      submissionId,
      isResubmission ? `Supersedes ${originalSubId}` : 'DRAFT',
      newSubmission.status,
      `Rule ${ruleVersion} applied: ${summary.accepted} Accepted, ${summary.flagged} Flagged, ${summary.rejected} Rejected`,
      `Total: ${processedRecords.length} rows | Fingerprint: ${batchFingerprint.slice(0, 16)}`,
      institutionId
    );

    return {
      submissionId,
      accepted: summary.accepted,
      flagged: summary.flagged,
      rejected: summary.rejected,
    };
  };

  // Human Exception Resolution in TPER Review Workspace
  const resolveDuplicateCandidate = (
    candidateId: string,
    newStatus: 'LEGITIMATE_TRANSFER' | 'NOT_A_MATCH' | 'NEEDS_INFO' | 'CONFIRMED_DUPLICATE',
    reason: string
  ): boolean => {
    if (!permissions.canResolveCrossInstitutionExceptions && !permissions.canApproveInstitutionReview) {
      addAuditEvent(
        'ACCESS_DENIED',
        'EXCEPTION_CANDIDATE',
        candidateId,
        'UNAUTHORIZED_ATTEMPT',
        'DENIED',
        `Role ${role} denied cross-institution exception adjudication permission`,
        'LEAST_PRIVILEGE_ENFORCEMENT'
      );
      alert(`Access Denied: Role ${role} is unauthorized to resolve cross-institutional exceptions.`);
      return false;
    }

    const candidate = duplicateCandidates.find((c) => c.id === candidateId);
    if (!candidate) return false;

    const previousStatus = candidate.status;
    const decision: any = {
      id: `DEC-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      reviewerRole: role,
      reviewerName: ROLE_DESCRIPTIONS[role].title,
      previousStatus,
      newStatus,
      reason,
      candidateId,
    };

    setDuplicateCandidates((prev) =>
      prev.map((c) => {
        if (c.id === candidateId) {
          return {
            ...c,
            status: newStatus,
            decisionHistory: [decision, ...c.decisionHistory],
          };
        }
        return c;
      })
    );

    addAuditEvent(
      'EXCEPTION_ADJUDICATION',
      'EXCEPTION_CANDIDATE',
      candidateId,
      previousStatus,
      newStatus,
      reason,
      `Matched Rule ${candidate.matchedRuleId} | Token ${candidate.maskedKey}`
    );

    return true;
  };

  // Rule configuration editor: updates rule and creates a new version
  const updateRuleDefinition = (updatedRule: RuleDefinition) => {
    if (!permissions.canConfigureRules) {
      addAuditEvent(
        'ACCESS_DENIED',
        'RULE_ENGINE',
        updatedRule.ruleId,
        'UNAUTHORIZED_ATTEMPT',
        'DENIED',
        `Role ${role} denied rule configuration modification permission`,
        'LEAST_PRIVILEGE_ENFORCEMENT'
      );
      alert(`Access Denied: Role ${role} does not have permission to modify regulatory rules.`);
      return;
    }

    // Increment minor version, e.g. v1.2.0 -> v1.3.0
    const parts = ruleVersion.replace('v', '').split('.');
    const minor = parseInt(parts[1], 10) + 1;
    const nextVersion = `v${parts[0]}.${minor}.0`;

    setRules((prev) =>
      prev.map((r) => (r.ruleId === updatedRule.ruleId ? { ...updatedRule, version: nextVersion } : r))
    );
    setRuleVersion(nextVersion);

    addAuditEvent(
      'RULE_MODIFIED',
      'RULE_ENGINE',
      updatedRule.ruleId,
      `Engine ${ruleVersion}`,
      `Engine ${nextVersion}`,
      `Updated rule ${updatedRule.ruleId} (${updatedRule.name}): Enabled=${updatedRule.enabled}, Severity=${updatedRule.severity}`,
      'REGULATORY_CONFIGURATION'
    );
  };

  // Re-run validation across submissions using new active rule engine version
  const rerunValidation = (targetSubmissionId?: string) => {
    const subsToRerun = targetSubmissionId
      ? submissions.filter((s) => s.id === targetSubmissionId)
      : submissions;

    if (subsToRerun.length === 0) return;

    setSubmissions((prev) =>
      prev.map((sub) => {
        if (targetSubmissionId && sub.id !== targetSubmissionId) return sub;

        // Process batch under CURRENT active rules
        const { processedRecords, summary } = processSubmissionBatch(sub.records, rules, intakeLimits);
        return {
          ...sub,
          ruleEngineVersion: ruleVersion,
          status: summary.rejected > 0 ? 'REVIEW_REQUIRED' : summary.flagged > 0 ? 'VALIDATED' : 'RECONCILIATION_COMPLETE',
          totalRows: processedRecords.length,
          acceptedRows: summary.accepted,
          flaggedRows: summary.flagged,
          rejectedRows: summary.rejected,
          records: processedRecords,
          revalidationCount: (sub.revalidationCount || 0) + 1,
        };
      })
    );

    // Re-run TPER with updated rules
    const refreshedCandidates = runTperReconciliation(records, duplicateCandidates);
    setDuplicateCandidates(refreshedCandidates);

    addAuditEvent(
      'REVALIDATION_EXECUTED',
      'SUBMISSION',
      targetSubmissionId || 'ALL_SUBMISSIONS',
      null,
      `Re-validated under ${ruleVersion}`,
      `Explicit re-run by ${role}`,
      'RULE_ENGINE_SYNC'
    );
  };

  // Mock Verification Engine
  const executeVerificationQuery = (
    searchType: 'STUDENT_REF' | 'APAAR_ID',
    searchValue: string,
    institutionId: string,
    academicYear: string,
    programmeCode?: string
  ): VerificationRequest => {
    const cleanSearch = searchValue.trim();
    const maskedVal = searchType === 'APAAR_ID' ? maskApaarId(cleanSearch) : cleanSearch;
    const inst = institutions.find((i) => i.id === institutionId);
    const instName = inst ? inst.name : institutionId;

    if (!permissions.canVerifyStudents) {
      addAuditEvent(
        'ACCESS_DENIED',
        'VERIFICATION_REQUEST',
        maskedVal,
        'UNAUTHORIZED_ATTEMPT',
        'DENIED',
        `Role ${role} denied student verification inquiry privilege`,
        'LEAST_PRIVILEGE_ENFORCEMENT'
      );
      alert(`Access Denied: Role ${role} is not permitted to query verification services. Switch to Verification Officer.`);
      return {
        id: `VER-UNAUTH-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        searchType,
        searchValue: cleanSearch,
        maskedSearchValue: maskedVal,
        institutionId,
        academicYear,
        programmeCode,
        officerName: ROLE_DESCRIPTIONS[role].title,
        result: 'UNABLE_TO_VERIFY',
        reasonCode: 'ROLE_UNAUTHORIZED',
        reasonDescription: `Current role ${role} does not possess verified student enquiry privileges. Access denied by least-privilege RBAC policy.`,
      };
    }

    // Rate Limiter Check (Defense-in-depth against programmatic scraping)
    const rateCheck = checkRateLimit('verifier-client-session', 20, 0.33);
    if (!rateCheck.allowed) {
      addAuditEvent(
        'RATE_LIMIT_EXCEEDED',
        'VERIFICATION_REQUEST',
        maskedVal,
        'ACTIVE_WINDOW',
        'THROTTLED',
        `Query rate limit ceiling exceeded (20 req/min). Retry in ${rateCheck.retryAfterSec}s`,
        'DEFENSE_IN_DEPTH'
      );
      return {
        id: `VER-LIMIT-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        searchType,
        searchValue: cleanSearch,
        maskedSearchValue: maskedVal,
        institutionId,
        academicYear,
        programmeCode,
        officerName: ROLE_DESCRIPTIONS[role].title,
        result: 'UNABLE_TO_VERIFY',
        reasonCode: 'RATE_LIMIT_EXCEEDED',
        reasonDescription: `Rate limit ceiling exceeded (20 queries/minute). Automated query throttling enforced. Retry after ${rateCheck.retryAfterSec} seconds.`,
      };
    }

    let result: VerificationOutcome = 'NOT_VERIFIED';
    let reasonCode = 'RECORD_NOT_FOUND';
    let reasonDescription = 'No record matches the provided identifier for the designated institution and session.';
    let matchedSnippet: any = undefined;

    // Search eligible records
    const matching = records.filter((r) => {
      const matchInst = r.institutionId === institutionId;
      const matchYear = !academicYear || r.academicYear === academicYear;
      const matchProg = !programmeCode || r.programmeCode === programmeCode;
      if (!matchInst || !matchYear || !matchProg) return false;

      if (searchType === 'STUDENT_REF') {
        return r.studentReference.toLowerCase() === cleanSearch.toLowerCase();
      } else {
        return r.apaarId && r.apaarId.trim() === cleanSearch;
      }
    });

    if (matching.length > 0) {
      const rec = matching[0];
      matchedSnippet = {
        studentReference: rec.studentReference,
        maskedApaarId: maskApaarId(rec.apaarId),
        institutionName: instName,
        programmeCode: rec.programmeCode,
        enrolmentStatus: rec.enrolmentStatus,
        academicYear: rec.academicYear,
      };

      // Check if this record is involved in an open unresolved duplicate candidate
      const hasUnresolvedDuplicate = duplicateCandidates.some(
        (c) =>
          c.status === 'PENDING_REVIEW' &&
          (c.recordA.id === rec.id || c.recordB.id === rec.id)
      );

      if (hasUnresolvedDuplicate) {
        result = 'UNABLE_TO_VERIFY';
        reasonCode = 'UNRESOLVED_CONCURRENT_ENROLMENT';
        reasonDescription = 'Candidate is subject to an active cross-institutional enrolment exception currently pending regulatory adjudication.';
      } else if (rec.rowOutcome === 'REJECTED') {
        result = 'UNABLE_TO_VERIFY';
        reasonCode = 'REJECTED_INSTITUTIONAL_RECORD';
        reasonDescription = 'Institutional enrolment record failed mandatory quality checks and is rejected from certified standing.';
      } else if (rec.enrolmentStatus === 'ACTIVE') {
        result = 'VERIFIED';
        reasonCode = 'CLEAN_ACTIVE_ENROLMENT';
        reasonDescription = 'Student is confirmed active in approved programme with no unresolved exceptions.';
      } else if (rec.enrolmentStatus === 'COMPLETED') {
        result = 'VERIFIED';
        reasonCode = 'COMPLETED_PROGRAMME';
        reasonDescription = 'Student successfully completed the academic programme.';
      } else {
        result = 'NOT_VERIFIED';
        reasonCode = `STATUS_${rec.enrolmentStatus}`;
        reasonDescription = `Student record has formal non-active status: ${rec.enrolmentStatus}.`;
      }
    }

    // Minimum-disclosure responses: Never disclose student identity or records if not verified
    if (result !== 'VERIFIED') {
      matchedSnippet = undefined;
    }

    const verificationReq: VerificationRequest = {
      id: `VER-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      searchType,
      searchValue: cleanSearch,
      maskedSearchValue: maskedVal,
      institutionId,
      academicYear,
      programmeCode,
      officerName: ROLE_DESCRIPTIONS[role].title,
      result,
      reasonCode,
      reasonDescription,
      matchedRecordSnippet: matchedSnippet,
    };

    setVerificationRequests((prev) => [verificationReq, ...prev]);

    addAuditEvent(
      'VERIFICATION_REQUEST',
      'VERIFICATION_REQUEST',
      verificationReq.id,
      null,
      result,
      `Query for ${maskedVal} at ${instName} (${reasonCode})`,
      'MOCK_VERIFIER_QUERY'
    );

    return verificationReq;
  };

  // Reset demo state with confirmed deterministic seed
  const resetDemoData = () => {
    if (!permissions.canResetDemo) {
      addAuditEvent(
        'ACCESS_DENIED',
        'SYSTEM_RESET',
        'DEMO_STORE',
        'UNAUTHORIZED_ATTEMPT',
        'DENIED',
        `Role ${role} denied demo reset permission`,
        'LEAST_PRIVILEGE_ENFORCEMENT'
      );
      alert(`Access Denied: Role ${role} is not permitted to reset demonstration state.`);
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    const seed = initializeSeedState();
    setInstitutions(seed.institutions);
    setProgrammes(seed.programmes);
    setIntakeLimits(seed.intakeLimits);
    setRecords(seed.records);
    setSubmissions(seed.submissions);
    setDuplicateCandidates(seed.duplicateCandidates);
    setAuditEvents(seed.auditEvents);
    setVerificationRequests(seed.verificationRequests);
    setRules(DEFAULT_RULES);
    setRuleVersion(INITIAL_RULE_VERSION);
    setActiveNav('overview');

    addAuditEvent(
      'DEMO_RESET',
      'DEMO_STATE',
      'SEED_V1',
      null,
      'RESET_COMPLETE',
      'User triggered one-click deterministic seed reset',
      'LOCAL_STORAGE_PURGED'
    );
  };

  // Export current state snapshot
  const exportDemoSnapshot = (): string => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      ruleVersion,
      recordsCount: records.length,
      submissionsCount: submissions.length,
      institutions,
      intakeLimits,
      records,
      submissions,
      duplicateCandidates,
      auditEvents,
      verificationRequests,
      rules,
    };
    return JSON.stringify(snapshot, null, 2);
  };

  // Import snapshot
  const importDemoSnapshot = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.records) && Array.isArray(data.submissions)) {
        setRecords(data.records);
        setSubmissions(data.submissions);
        if (data.duplicateCandidates) setDuplicateCandidates(data.duplicateCandidates);
        if (data.auditEvents) setAuditEvents(data.auditEvents);
        if (data.verificationRequests) setVerificationRequests(data.verificationRequests);
        if (data.rules) setRules(data.rules);
        if (data.ruleVersion) setRuleVersion(data.ruleVersion);

        addAuditEvent(
          'SNAPSHOT_IMPORTED',
          'DEMO_STATE',
          'USER_UPLOAD',
          null,
          'RESTORED',
          `Restored ${data.records.length} records and ${data.submissions.length} submissions`,
          'MANUAL_SNAPSHOT_IMPORT'
        );
        return true;
      }
    } catch (e) {
      console.error('Invalid snapshot JSON:', e);
    }
    return false;
  };

  return (
    <AppContext.Provider
      value={{
        role,
        permissions,
        activeNav,
        selectedInstitutionId,
        selectedAcademicYear,
        institutions,
        programmes,
        intakeLimits,
        records,
        submissions,
        duplicateCandidates,
        auditEvents,
        verificationRequests,
        rules,
        ruleVersion,
        setRole,
        setActiveNav,
        setSelectedInstitutionId,
        setSelectedAcademicYear,
        addSubmission,
        resolveDuplicateCandidate,
        updateRuleDefinition,
        rerunValidation,
        executeVerificationQuery,
        resetDemoData,
        exportDemoSnapshot,
        importDemoSnapshot,
        verifyAuditLedger: () => verifyLedgerIntegrity(auditEvents),
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
