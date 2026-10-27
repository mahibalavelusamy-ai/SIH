import {
  StudentEnrolment,
  ValidationFinding,
  RuleDefinition,
  RowOutcome,
  IntakeLimit,
} from '../types';

export const INITIAL_RULE_VERSION = 'v1.2.0';

export const DEFAULT_RULES: RuleDefinition[] = [
  {
    ruleId: 'V-01',
    name: 'Missing Required Fields',
    description: 'Rejects rows with missing critical fields: student name, date of birth, programme, seat category, or admission date.',
    severity: 'BLOCKING',
    blocking: true,
    enabled: true,
    version: INITIAL_RULE_VERSION,
    fieldsEvaluated: ['studentName', 'dateOfBirth', 'programmeCode', 'seatCategory', 'admissionDate'],
    explanation: 'A submission row lacks essential institutional identifiers required for statutory enrolment tracking.',
    remediationGuidance: 'Ensure the source student ERP record contains all mandatory demographic and admission attributes before re-uploading.',
  },
  {
    ruleId: 'V-02',
    name: 'Missing APAAR ID',
    description: 'Flags rows where APAAR ID is absent. Missing APAAR does not reject the student enrolment from regulatory accounting.',
    severity: 'WARNING',
    blocking: false,
    enabled: true,
    version: INITIAL_RULE_VERSION,
    fieldsEvaluated: ['apaarId'],
    explanation: 'The student has not yet registered an APAAR ID or the institute has not populated it. Flagged for secondary identity reconciliation.',
    remediationGuidance: 'Prompt student through Digilocker/ABC to generate and link an APAAR ID, then submit a data correction.',
  },
  {
    ruleId: 'V-03',
    name: 'APAAR Format Mismatch',
    description: 'Flags APAAR IDs that deviate from the 12-digit numeric format. Format validation does not guarantee identity authenticity.',
    severity: 'WARNING',
    blocking: false,
    enabled: true,
    version: INITIAL_RULE_VERSION,
    fieldsEvaluated: ['apaarId'],
    explanation: 'APAAR identifier provided does not match the 12-digit numeric pattern (e.g. contains hyphens, letters, or incorrect digit count).',
    remediationGuidance: 'Verify the digit sequence against the student ABC card and remove any non-digit punctuation.',
  },
  {
    ruleId: 'V-04',
    name: 'Duplicate APAAR in Single Submission',
    description: 'Flags all affected rows where the same APAAR ID appears multiple times within the same institutional submission file.',
    severity: 'WARNING',
    blocking: false,
    enabled: true,
    version: INITIAL_RULE_VERSION,
    fieldsEvaluated: ['apaarId'],
    explanation: 'Multiple student records in this batch claim the exact same APAAR ID. All matching rows are flagged to prevent arbitrary acceptance.',
    remediationGuidance: 'Investigate the ERP records for duplicate admission entries, clerical entry typos, or student transfer errors.',
  },
  {
    ruleId: 'V-05',
    name: 'Multiple Active Enrolments (Cross-Institution)',
    description: 'Raises a TPER duplicate candidate when a student appears actively enrolled in conflicting concurrent technical programmes.',
    severity: 'WARNING',
    blocking: false,
    enabled: true,
    version: INITIAL_RULE_VERSION,
    fieldsEvaluated: ['apaarId', 'enrolmentStatus', 'admissionDate', 'enrolmentEndDate'],
    explanation: 'Temporal analysis detected overlapping active enrolment windows across institutions without an approved concurrent waiver.',
    remediationGuidance: 'Route to human Exception Review workspace to verify if a formal institutional transfer or withdrawal was initiated.',
  },
  {
    ruleId: 'V-06',
    name: 'Invalid Demographic or Date Values',
    description: 'Rejects malformed dates, students outside realistic age boundaries (14-70 years), or unsupported seat categories.',
    severity: 'BLOCKING',
    blocking: true,
    enabled: true,
    version: INITIAL_RULE_VERSION,
    fieldsEvaluated: ['dateOfBirth', 'admissionDate', 'seatCategory'],
    explanation: 'Date is unparseable or calculates to an invalid student age at admission, or seat category is not recognized in statutory schemas.',
    remediationGuidance: 'Correct date formatting to ISO YYYY-MM-DD and verify student age against official matriculation certificates.',
  },
  {
    ruleId: 'V-07',
    name: 'Admission Date Outside Session Window',
    description: 'Flags enrolments with admission dates falling outside the AICTE academic calendar admission cutoff window.',
    severity: 'WARNING',
    blocking: false,
    enabled: true,
    version: INITIAL_RULE_VERSION,
    fieldsEvaluated: ['admissionDate', 'academicYear'],
    explanation: 'Admission date is before the session opening or after the regulatory cutoff date without a recorded extension.',
    remediationGuidance: 'Provide regulatory extension approval reference or adjust the admission date to the actual formal enrollment date.',
  },
  {
    ruleId: 'V-08',
    name: 'Seat Category & Supernumerary Conflict',
    description: 'Flags contradictory quota tagging (e.g. marked as supernumerary without subcategory, or regular OPEN marked as TFW).',
    severity: 'WARNING',
    blocking: false,
    enabled: true,
    version: INITIAL_RULE_VERSION,
    fieldsEvaluated: ['seatCategory', 'supernumeraryFlag', 'supernumeraryCategory'],
    explanation: 'The combination of seat category, supernumerary flag, and quota category is contradictory or uncertified.',
    remediationGuidance: 'Ensure supernumerary enrolments explicitly specify the quota type (TFW, PMSSS, J&K, EWS, NRI) with supernumeraryFlag=true.',
  },
  {
    ruleId: 'V-09',
    name: 'Approved Regular Intake Excess',
    description: 'Detects when valid counted regular enrolments exceed the statutory approved regular intake limit for the programme.',
    severity: 'WARNING',
    blocking: false,
    enabled: true,
    version: INITIAL_RULE_VERSION,
    fieldsEvaluated: ['programmeCode', 'supernumeraryFlag', 'seatCategory'],
    explanation: 'Aggregate programme enrolments exceed approved regular capacity. Flagged as a regulatory intake variance for investigation.',
    remediationGuidance: 'Review admitted roster against the AICTE Extension of Approval (EoA) regular seat matrix.',
  },
  {
    ruleId: 'V-10',
    name: 'Supernumerary Category Limit Excess',
    description: 'Flags when admitted students in a specific supernumerary category (e.g. TFW) exceed the statutory permissible quota (e.g. 5%).',
    severity: 'WARNING',
    blocking: false,
    enabled: true,
    version: INITIAL_RULE_VERSION,
    fieldsEvaluated: ['supernumeraryCategory', 'supernumeraryFlag'],
    explanation: 'The number of enrolments under this supernumerary quota exceeds the configured maximum ceiling.',
    remediationGuidance: 'Inspect supernumerary allotment letters to reconcile admitted count against approved quota provisions.',
  },
  {
    ruleId: 'V-11',
    name: 'Supernumerary Eligibility Discrepancy',
    description: 'Flags enrolments claiming supernumerary benefits with missing or conflicting qualifying eligibility indicators.',
    severity: 'WARNING',
    blocking: false,
    enabled: true,
    version: INITIAL_RULE_VERSION,
    fieldsEvaluated: ['supernumeraryCategory', 'seatCategory'],
    explanation: 'Student claims supernumerary quota but lacks mandatory supporting documentation flags.',
    remediationGuidance: 'Verify state admission authority allotment letter confirming quota entitlement before resubmitting.',
  },
  {
    ruleId: 'V-12',
    name: 'Approved Programme Zero Enrolment Notice',
    description: 'Flags approved programmes in the institutional approval matrix that report zero submitted enrolments in the session.',
    severity: 'INFO',
    blocking: false,
    enabled: true,
    version: INITIAL_RULE_VERSION,
    fieldsEvaluated: ['programmeCode'],
    explanation: 'Programme is approved with active intake quota, but zero student enrolments were received in the institutional batch.',
    remediationGuidance: 'Confirm whether the programme was placed in abeyance / zero admission session or if a batch partition was missed.',
  },
];

// Helper to validate date format (YYYY-MM-DD)
export function isValidDate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime()) && dateStr === d.toISOString().split('T')[0];
}

// Calculate age at admission
export function calculateAgeAtDate(birthDateStr: string, atDateStr: string): number {
  const birth = new Date(birthDateStr);
  const atDate = new Date(atDateStr);
  let age = atDate.getFullYear() - birth.getFullYear();
  const m = atDate.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && atDate.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Academic year expected admission window
export function isAdmissionInWindow(admissionDateStr: string, academicYear: string): boolean {
  if (!isValidDate(admissionDateStr)) return false;
  // Format e.g. "2026-27" -> yearStart = 2026
  const parts = academicYear.split('-');
  const startYear = parseInt(parts[0], 10);
  if (isNaN(startYear)) return true;

  // Window: May 1 of start year to Dec 31 of start year (standard engineering intake)
  const windowStart = new Date(`${startYear}-05-01`);
  const windowEnd = new Date(`${startYear}-12-31`);
  const adm = new Date(admissionDateStr);
  return adm >= windowStart && adm <= windowEnd;
}

// Evaluate single row for rules V-01, V-02, V-03, V-06, V-07, V-08, V-11
export function evaluateRowRules(
  row: StudentEnrolment,
  activeRules: RuleDefinition[],
  duplicateMapInBatch: Map<string, number>
): { outcome: RowOutcome; findings: ValidationFinding[] } {
  const findings: ValidationFinding[] = [];
  const ruleMap = new Map(activeRules.map((r) => [r.ruleId, r]));

  // V-01: Missing required fields
  const r01 = ruleMap.get('V-01');
  if (r01 && r01.enabled) {
    const missing: string[] = [];
    if (!row.studentName || row.studentName.trim() === '') missing.push('studentName');
    if (!row.dateOfBirth || row.dateOfBirth.trim() === '') missing.push('dateOfBirth');
    if (!row.programmeCode || row.programmeCode.trim() === '') missing.push('programmeCode');
    if (!row.seatCategory || row.seatCategory.trim() === '') missing.push('seatCategory');
    if (!row.admissionDate || row.admissionDate.trim() === '') missing.push('admissionDate');

    if (missing.length > 0) {
      findings.push({
        id: `f-${row.id}-v01`,
        recordId: row.id,
        studentReference: row.studentReference,
        ruleId: 'V-01',
        severity: 'BLOCKING',
        fields: missing,
        observedValue: `Missing: [${missing.join(', ')}]`,
        reason: 'One or more mandatory regulatory fields are completely blank or undefined.',
        remediationGuidance: r01.remediationGuidance,
      });
    }
  }

  // V-06: Invalid demographic or date values
  const r06 = ruleMap.get('V-06');
  if (r06 && r06.enabled) {
    let invalidDemographic = false;
    let reasonText = '';

    if (row.dateOfBirth && !isValidDate(row.dateOfBirth)) {
      invalidDemographic = true;
      reasonText += 'Date of birth is not a valid ISO date (YYYY-MM-DD). ';
    }
    if (row.admissionDate && !isValidDate(row.admissionDate)) {
      invalidDemographic = true;
      reasonText += 'Admission date is not a valid ISO date (YYYY-MM-DD). ';
    }

    if (row.dateOfBirth && row.admissionDate && isValidDate(row.dateOfBirth) && isValidDate(row.admissionDate)) {
      const age = calculateAgeAtDate(row.dateOfBirth, row.admissionDate);
      if (age < 14 || age > 70) {
        invalidDemographic = true;
        reasonText += `Calculated age at admission (${age} years) is outside plausible range (14-70). `;
      }
    }

    const validCategories = ['OPEN', 'OBC', 'SC', 'ST', 'EWS', 'TFW', 'MANAGEMENT', 'NRI'];
    if (row.seatCategory && !validCategories.includes(row.seatCategory)) {
      invalidDemographic = true;
      reasonText += `Unsupported seat category value: '${row.seatCategory}'. `;
    }

    if (invalidDemographic) {
      findings.push({
        id: `f-${row.id}-v06`,
        recordId: row.id,
        studentReference: row.studentReference,
        ruleId: 'V-06',
        severity: 'BLOCKING',
        fields: ['dateOfBirth', 'admissionDate', 'seatCategory'],
        observedValue: `DOB: ${row.dateOfBirth}, Adm: ${row.admissionDate}, Cat: ${row.seatCategory}`,
        reason: reasonText.trim(),
        remediationGuidance: r06.remediationGuidance,
      });
    }
  }

  // V-02: Missing APAAR ID
  const r02 = ruleMap.get('V-02');
  if (r02 && r02.enabled) {
    if (!row.apaarId || row.apaarId.trim() === '') {
      findings.push({
        id: `f-${row.id}-v02`,
        recordId: row.id,
        studentReference: row.studentReference,
        ruleId: 'V-02',
        severity: 'WARNING',
        fields: ['apaarId'],
        observedValue: 'EMPTY / NULL',
        reason: 'Student does not have an APAAR ID assigned yet. Flagged for secondary reconciliation.',
        remediationGuidance: r02.remediationGuidance,
      });
    }
  }

  // V-03: APAAR Format Mismatch
  const r03 = ruleMap.get('V-03');
  if (r03 && r03.enabled && row.apaarId && row.apaarId.trim() !== '') {
    const cleanId = row.apaarId.trim();
    const isTwelveDigits = /^\d{12}$/.test(cleanId);
    if (!isTwelveDigits) {
      findings.push({
        id: `f-${row.id}-v03`,
        recordId: row.id,
        studentReference: row.studentReference,
        ruleId: 'V-03',
        severity: 'WARNING',
        fields: ['apaarId'],
        observedValue: cleanId,
        reason: `APAAR ID contains ${cleanId.length} characters (or non-digit characters). Standard format assumes 12 numeric digits.`,
        remediationGuidance: r03.remediationGuidance,
      });
    }
  }

  // V-04: Duplicate APAAR in single submission
  const r04 = ruleMap.get('V-04');
  if (r04 && r04.enabled && row.apaarId && row.apaarId.trim() !== '') {
    const cleanId = row.apaarId.trim();
    const count = duplicateMapInBatch.get(cleanId) || 0;
    if (count > 1) {
      findings.push({
        id: `f-${row.id}-v04`,
        recordId: row.id,
        studentReference: row.studentReference,
        ruleId: 'V-04',
        severity: 'WARNING',
        fields: ['apaarId'],
        observedValue: `APAAR ${cleanId} appears ${count} times in batch`,
        reason: 'Identical APAAR identifier claimed multiple times within this single institutional upload.',
        remediationGuidance: r04.remediationGuidance,
      });
    }
  }

  // V-07: Admission Date Outside Session Window
  const r07 = ruleMap.get('V-07');
  if (r07 && r07.enabled && row.admissionDate && isValidDate(row.admissionDate)) {
    if (!isAdmissionInWindow(row.admissionDate, row.academicYear)) {
      findings.push({
        id: `f-${row.id}-v07`,
        recordId: row.id,
        studentReference: row.studentReference,
        ruleId: 'V-07',
        severity: 'WARNING',
        fields: ['admissionDate', 'academicYear'],
        observedValue: `Admission: ${row.admissionDate} for AY ${row.academicYear}`,
        reason: 'Admission date is outside the standard AICTE session intake window for the specified academic year.',
        remediationGuidance: r07.remediationGuidance,
      });
    }
  }

  // V-08: Seat Category & Supernumerary Conflict
  const r08 = ruleMap.get('V-08');
  if (r08 && r08.enabled) {
    if (row.supernumeraryFlag && !row.supernumeraryCategory && row.seatCategory !== 'TFW' && row.seatCategory !== 'NRI') {
      findings.push({
        id: `f-${row.id}-v08`,
        recordId: row.id,
        studentReference: row.studentReference,
        ruleId: 'V-08',
        severity: 'WARNING',
        fields: ['supernumeraryFlag', 'supernumeraryCategory'],
        observedValue: 'supernumeraryFlag=true but no category specified',
        reason: 'Enrolment tagged as supernumerary without indicating the approved quota category.',
        remediationGuidance: r08.remediationGuidance,
      });
    } else if (!row.supernumeraryFlag && row.supernumeraryCategory) {
      findings.push({
        id: `f-${row.id}-v08-b`,
        recordId: row.id,
        studentReference: row.studentReference,
        ruleId: 'V-08',
        severity: 'WARNING',
        fields: ['supernumeraryFlag', 'supernumeraryCategory'],
        observedValue: `supernumeraryFlag=false but category=${row.supernumeraryCategory}`,
        reason: 'Supernumerary category specified while supernumeraryFlag is marked false.',
        remediationGuidance: r08.remediationGuidance,
      });
    }
  }

  // Determine single initial row outcome
  let outcome: RowOutcome = 'ACCEPTED';
  const hasBlocking = findings.some((f) => f.severity === 'BLOCKING');
  const hasWarning = findings.some((f) => f.severity === 'WARNING');

  if (hasBlocking) {
    outcome = 'REJECTED';
  } else if (hasWarning) {
    outcome = 'FLAGGED';
  }

  return { outcome, findings };
}

// Evaluate entire batch of rows and calculate intake reconciliation
export function processSubmissionBatch(
  records: StudentEnrolment[],
  activeRules: RuleDefinition[],
  intakeLimits: IntakeLimit[]
): {
  processedRecords: StudentEnrolment[];
  allFindings: ValidationFinding[];
  summary: {
    total: number;
    accepted: number;
    flagged: number;
    rejected: number;
  };
  intakeFindings: ValidationFinding[];
} {
  // Count frequency of APAAR IDs in this batch for V-04
  const duplicateMap = new Map<string, number>();
  records.forEach((r) => {
    if (r.apaarId && r.apaarId.trim() !== '') {
      const id = r.apaarId.trim();
      duplicateMap.set(id, (duplicateMap.get(id) || 0) + 1);
    }
  });

  const processedRecords: StudentEnrolment[] = [];
  const allFindings: ValidationFinding[] = [];
  let accepted = 0;
  let flagged = 0;
  let rejected = 0;

  records.forEach((rec) => {
    const { outcome, findings } = evaluateRowRules(rec, activeRules, duplicateMap);
    const updated = {
      ...rec,
      rowOutcome: outcome,
      findings,
    };
    processedRecords.push(updated);
    allFindings.push(...findings);

    if (outcome === 'ACCEPTED') accepted++;
    else if (outcome === 'FLAGGED') flagged++;
    else if (outcome === 'REJECTED') rejected++;
  });

  // Now evaluate Programme-Level Rules V-09 and V-10 on non-rejected records
  const intakeFindings: ValidationFinding[] = [];
  const nonRejected = processedRecords.filter((r) => r.rowOutcome !== 'REJECTED');

  // Group by (institutionId, programmeCode, academicYear)
  const grouped = new Map<string, StudentEnrolment[]>();
  nonRejected.forEach((r) => {
    const key = `${r.institutionId}_${r.programmeCode}_${r.academicYear}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  });

  const r09 = activeRules.find((r) => r.ruleId === 'V-09' && r.enabled);
  const r10 = activeRules.find((r) => r.ruleId === 'V-10' && r.enabled);

  grouped.forEach((enrolments, key) => {
    const [instId, progCode, ay] = key.split('_');
    const limit = intakeLimits.find(
      (l) => l.institutionId === instId && l.programmeCode === progCode && l.academicYear === ay
    );

    if (!limit) return;

    // Count regular enrolments: supernumeraryFlag is false
    const regularEnrolments = enrolments.filter((e) => !e.supernumeraryFlag && e.enrolmentStatus === 'ACTIVE');
    const regularCount = regularEnrolments.length;

    if (r09 && regularCount > limit.approvedRegularIntake) {
      const excess = regularCount - limit.approvedRegularIntake;
      const finding: ValidationFinding = {
        id: `intake-${key}-v09`,
        recordId: `PROG-${progCode}`,
        studentReference: `Programme ${progCode}`,
        ruleId: 'V-09',
        severity: 'WARNING',
        fields: ['approvedRegularIntake', 'regularEnrolments'],
        observedValue: `${regularCount} regular active / ${limit.approvedRegularIntake} approved (Excess: +${excess})`,
        reason: `Counted active regular student enrolments exceed the approved intake limit of ${limit.approvedRegularIntake} by ${excess} seats.`,
        remediationGuidance: 'Review admissions register against approved AICTE intake quota.',
      };
      intakeFindings.push(finding);
      allFindings.push(finding);
    }

    // Check TFW supernumerary limit if configured
    if (r10) {
      const tfwEnrolments = enrolments.filter(
        (e) => (e.supernumeraryCategory === 'TFW' || e.seatCategory === 'TFW') && e.enrolmentStatus === 'ACTIVE'
      );
      if (limit.supernumeraryLimits.tfw > 0 && tfwEnrolments.length > limit.supernumeraryLimits.tfw) {
        const excessTfw = tfwEnrolments.length - limit.supernumeraryLimits.tfw;
        const finding: ValidationFinding = {
          id: `tfw-${key}-v10`,
          recordId: `PROG-${progCode}-TFW`,
          studentReference: `Programme ${progCode} (TFW)`,
          ruleId: 'V-10',
          severity: 'WARNING',
          fields: ['supernumeraryLimits.tfw'],
          observedValue: `${tfwEnrolments.length} TFW enrolments / ${limit.supernumeraryLimits.tfw} max quota (Excess: +${excessTfw})`,
          reason: `Admitted Tuition Fee Waiver (TFW) supernumerary enrolments exceed approved ceiling of ${limit.supernumeraryLimits.tfw}.`,
          remediationGuidance: 'Reconcile TFW allotment list with state central admission authority quota.',
        };
        intakeFindings.push(finding);
        allFindings.push(finding);
      }
    }
  });

  return {
    processedRecords,
    allFindings,
    summary: {
      total: records.length,
      accepted,
      flagged,
      rejected,
    },
    intakeFindings,
  };
}
