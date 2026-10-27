export type Role =
  | 'INSTITUTION_SUBMITTER'
  | 'INSTITUTION_REVIEWER'
  | 'AICTE_REVIEWER'
  | 'VERIFICATION_OFFICER'
  | 'SYSTEM_ADMIN'
  | 'AUDITOR';

export interface RolePermission {
  canSubmitData: boolean;
  canApproveInstitutionReview: boolean;
  canResolveCrossInstitutionExceptions: boolean;
  canVerifyStudents: boolean;
  canConfigureRules: boolean;
  canResetDemo: boolean;
  canViewAudit: boolean;
}

export type SeatCategory =
  | 'OPEN'
  | 'OBC'
  | 'SC'
  | 'ST'
  | 'EWS'
  | 'TFW'
  | 'MANAGEMENT'
  | 'NRI';

export type SupernumeraryCategory =
  | 'TFW'
  | 'EWS'
  | 'LATERAL_ENTRY'
  | 'PMSSS'
  | 'JNK'
  | 'NRI';

export type EnrolmentStatus =
  | 'ACTIVE'
  | 'TRANSFERRED'
  | 'COMPLETED'
  | 'WITHDRAWN'
  | 'CANCELLED';

export type TransferStatus =
  | 'NONE'
  | 'INITIATED'
  | 'APPROVED'
  | 'COMPLETED'
  | 'REJECTED';

export type RowOutcome = 'ACCEPTED' | 'FLAGGED' | 'REJECTED';

export interface Institution {
  id: string;
  code: string;
  name: string;
  state: string;
  region: string;
  type: string;
  contactEmail: string;
  approvedProgrammes: string[];
}

export interface Programme {
  code: string;
  name: string;
  degreeLevel: string;
  durationYears: number;
  department: string;
}

export interface IntakeLimit {
  id: string;
  institutionId: string;
  programmeCode: string;
  academicYear: string;
  approvedRegularIntake: number;
  supernumeraryLimits: {
    tfw: number;
    ews: number;
    lateralEntry: number;
    pmsss: number;
    jnk: number;
    nri: number;
  };
}

export interface ValidationFinding {
  id: string;
  recordId: string;
  studentReference: string;
  ruleId: string;
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
  fields: string[];
  observedValue: string;
  reason: string;
  remediationGuidance: string;
}

export interface StudentEnrolment {
  id: string;
  institutionId: string;
  academicYear: string;
  programmeCode: string;
  studentReference: string;
  studentName: string;
  dateOfBirth: string; // YYYY-MM-DD
  apaarId: string | null;
  admissionDate: string; // YYYY-MM-DD
  enrolmentStatus: EnrolmentStatus;
  seatCategory: SeatCategory;
  supernumeraryFlag: boolean;
  supernumeraryCategory?: SupernumeraryCategory | null;
  enrolmentEndDate: string | null;
  transferStatus: TransferStatus;
  transferEffectiveDate: string | null;
  lateralEntryFlag?: boolean;
  concurrentProgrammeApproved?: boolean;
  rowOutcome?: RowOutcome;
  findings?: ValidationFinding[];
}

export interface Submission {
  id: string;
  institutionId: string;
  academicYear: string;
  timestamp: string;
  ruleEngineVersion: string;
  submittedBy: string;
  status:
    | 'DRAFT'
    | 'PREVIEWED'
    | 'SUBMITTED'
    | 'VALIDATED'
    | 'RECONCILIATION_COMPLETE'
    | 'REVIEW_REQUIRED';
  totalRows: number;
  acceptedRows: number;
  flaggedRows: number;
  rejectedRows: number;
  records: StudentEnrolment[];
  batchChecksum?: string; // SHA-256 content fingerprint for idempotent upload verification
  isResubmission?: boolean;
  originalSubmissionId?: string;
  revalidationCount?: number;
}

export interface DuplicateCandidate {
  id: string;
  recordA: StudentEnrolment;
  recordB: StudentEnrolment;
  matchingStage: 'STAGE_A_KEYED' | 'STAGE_D_HEURISTIC';
  maskedKey: string;
  overlapDetected: boolean;
  overlapInterval: string;
  confidenceScore: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'DISMISSED';
  signalBreakdown: {
    nameSimilarityScore: number;
    dobExactMatchScore: number;
    temporalOverlapScore: number;
    programmeSimilarityScore: number;
  };
  matchedRuleId: string;
  explanation: string;
  transferEvidence: string | null;
  status:
    | 'PENDING_REVIEW'
    | 'LEGITIMATE_TRANSFER'
    | 'NOT_A_MATCH'
    | 'NEEDS_INFO'
    | 'CONFIRMED_DUPLICATE';
  decisionHistory: ReviewDecision[];
}

export interface ReviewDecision {
  id: string;
  timestamp: string;
  reviewerRole: Role;
  reviewerName: string;
  previousStatus: string;
  newStatus:
    | 'LEGITIMATE_TRANSFER'
    | 'NOT_A_MATCH'
    | 'NEEDS_INFO'
    | 'CONFIRMED_DUPLICATE';
  reason: string;
  candidateId: string;
}

export interface RuleDefinition {
  ruleId: string;
  name: string;
  description: string;
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
  blocking: boolean;
  enabled: boolean;
  version: string;
  fieldsEvaluated: string[];
  explanation: string;
  remediationGuidance: string;
  parameters?: Record<string, any>;
}

export type VerificationOutcome =
  | 'VERIFIED'
  | 'NOT_VERIFIED'
  | 'UNABLE_TO_VERIFY';

export interface VerificationRequest {
  id: string;
  timestamp: string;
  searchType: 'STUDENT_REF' | 'APAAR_ID';
  searchValue: string;
  maskedSearchValue: string;
  institutionId: string;
  academicYear: string;
  programmeCode?: string;
  officerName: string;
  result: VerificationOutcome;
  reasonCode: string;
  reasonDescription: string;
  matchedRecordSnippet?: {
    studentReference: string;
    maskedApaarId: string;
    institutionName: string;
    programmeCode: string;
    enrolmentStatus: string;
    academicYear: string;
  };
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: Role;
  action: string;
  entityType:
    | 'SUBMISSION'
    | 'RECORD'
    | 'RULE_ENGINE'
    | 'EXCEPTION_CANDIDATE'
    | 'VERIFICATION_REQUEST'
    | 'ROLE_CHANGE'
    | 'SECURITY_EVENT'
    | 'DEMO_STATE';
  entityId: string;
  previousState: string | null;
  newState: string | null;
  reasonOrRuleId: string | null;
  reference: string | null;
  tenantId?: string; // Institution tenant isolation reference
  prevHash?: string; // SHA-256 hash of previous audit record in tamper-evident chain
  hash?: string; // SHA-256 block hash of this record
}

export interface LedgerVerificationResult {
  isValid: boolean;
  totalBlocks: number;
  verifiedBlocks: number;
  tamperedBlockIndex: number | null;
  computedHash: string;
  verifiedAt: string;
}

export interface SecurityControlItem {
  id: string;
  category: 'AUTHENTICATION' | 'AUTHORIZATION' | 'DATA_PRIVACY' | 'CRYPTOGRAPHY' | 'INPUT_VALIDATION' | 'AUDIT_LOGGING' | 'SCALABILITY';
  name: string;
  status: 'IMPLEMENTED' | 'SIMULATED' | 'PROPOSED_PRODUCTION_DEPENDENCY';
  description: string;
  productionRequirement?: string;
}

export interface BenchmarkRun {
  runId: string;
  timestamp: string;
  datasetVersion: string;
  ruleVersion: string;
  durationMs: number;
  rowsProcessed: number;
  acceptedCount: number;
  flaggedCount: number;
  rejectedCount: number;
  seededAnomaliesDetected: number;
  seededAnomaliesTotal: number;
  duplicateCandidatesRaised: number;
  falsePositiveCandidates: number;
  missedSeededCandidates: number;
  intakeDiscrepanciesDetected: number;
  auditEventsRecorded: number;
  testPassRate: number;
}
