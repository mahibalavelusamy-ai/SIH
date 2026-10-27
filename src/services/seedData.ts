import {
  Institution,
  Programme,
  IntakeLimit,
  StudentEnrolment,
  Submission,
  AuditEvent,
  VerificationRequest,
} from '../types';
import { processSubmissionBatch, DEFAULT_RULES, INITIAL_RULE_VERSION } from './rulesEngine';
import { runTperReconciliation } from './tperEngine';
import { computeAuditEventHash } from './securityService';

const pad = (n: number, w: number): string => n.toString().padStart(w, '0');

export const SEED_INSTITUTIONS: Institution[] = [
  {
    id: 'INST-001',
    code: '1-NST-DEL',
    name: 'Northstar Institute',
    state: 'Delhi',
    region: 'North',
    type: 'Institute of National Importance',
    contactEmail: 'registrar@northstar.example',
    approvedProgrammes: ['BTECH-CSE', 'BTECH-ECE', 'BTECH-AIML', 'BTECH-MECH'],
  },
  {
    id: 'INST-002',
    code: '1-CTC-DEL',
    name: 'Cedar Technical College',
    state: 'Delhi',
    region: 'North',
    type: 'State Technical University',
    contactEmail: 'admissions@cedar.example',
    approvedProgrammes: ['BTECH-CSE', 'BTECH-ECE', 'BTECH-IT', 'BTECH-MECH'],
  },
  {
    id: 'INST-003',
    code: '1-RBU-MH',
    name: 'Riverbend University',
    state: 'Maharashtra',
    region: 'West',
    type: 'State Unitary University',
    contactEmail: 'dean.acad@riverbend.example',
    approvedProgrammes: ['BTECH-CSE', 'BTECH-ECE', 'BTECH-MECH'],
  },
  {
    id: 'INST-004',
    code: '1-SAC-KA',
    name: 'Summit Arts College',
    state: 'Karnataka',
    region: 'South',
    type: 'Private Aided Autonomous',
    contactEmail: 'admissions@summit.example',
    approvedProgrammes: ['BTECH-CSE', 'BTECH-AIML', 'BTECH-IT'],
  },
  {
    id: 'INST-005',
    code: '1-LVI-WB',
    name: 'Lakeview Institute',
    state: 'West Bengal',
    region: 'East',
    type: 'Private Unaided Autonomous',
    contactEmail: 'office@lakeview.example',
    approvedProgrammes: ['BTECH-CSE', 'BTECH-ECE', 'BTECH-MECH'],
  },
];

export const SEED_PROGRAMMES: Programme[] = [
  {
    code: 'BTECH-CSE',
    name: 'B.Sc. Computer Science',
    degreeLevel: 'Undergraduate (B.Sc. / B.Tech)',
    durationYears: 4,
    department: 'Department of Computer Science',
  },
  {
    code: 'BTECH-ECE',
    name: 'Electronics & Communication Engineering',
    degreeLevel: 'Undergraduate (B.Tech)',
    durationYears: 4,
    department: 'Department of Electronics & Communication',
  },
  {
    code: 'BTECH-AIML',
    name: 'Artificial Intelligence & Machine Learning',
    degreeLevel: 'Undergraduate (B.Tech)',
    durationYears: 4,
    department: 'School of Advanced Computing',
  },
  {
    code: 'BTECH-IT',
    name: 'Information Technology',
    degreeLevel: 'Undergraduate (B.Tech)',
    durationYears: 4,
    department: 'Department of Information Science',
  },
  {
    code: 'BTECH-MECH',
    name: 'Mechanical Engineering',
    degreeLevel: 'Undergraduate (B.Tech)',
    durationYears: 4,
    department: 'Department of Mechanical Engineering',
  },
];

export const SEED_INTAKE_LIMITS: IntakeLimit[] = [
  // INST-001 Northstar Institute: B.Sc. Computer Science approved regular intake 120 (Seeding 128 active regular -> 8 excess for V-09)
  // Supernumerary limits: TFW 6, EWS 6, NRI 6 (Seeding 18 supernumerary -> exactly 0 supernumerary breach)
  {
    id: 'INT-001',
    institutionId: 'INST-001',
    programmeCode: 'BTECH-CSE',
    academicYear: '2026-27',
    approvedRegularIntake: 120,
    supernumeraryLimits: { tfw: 6, ews: 6, lateralEntry: 12, pmsss: 3, jnk: 2, nri: 6 },
  },
  {
    id: 'INT-002',
    institutionId: 'INST-001',
    programmeCode: 'BTECH-ECE',
    academicYear: '2026-27',
    approvedRegularIntake: 60,
    supernumeraryLimits: { tfw: 3, ews: 6, lateralEntry: 6, pmsss: 2, jnk: 1, nri: 3 },
  },
  {
    id: 'INT-003',
    institutionId: 'INST-002',
    programmeCode: 'BTECH-CSE',
    academicYear: '2026-27',
    approvedRegularIntake: 60,
    supernumeraryLimits: { tfw: 3, ews: 6, lateralEntry: 6, pmsss: 2, jnk: 1, nri: 3 },
  },
  {
    id: 'INT-004',
    institutionId: 'INST-003',
    programmeCode: 'BTECH-ECE',
    academicYear: '2026-27',
    approvedRegularIntake: 60,
    supernumeraryLimits: { tfw: 3, ews: 6, lateralEntry: 6, pmsss: 2, jnk: 1, nri: 3 }, // Seed 5 TFW -> V-10 excess!
  },
  {
    id: 'INT-005',
    institutionId: 'INST-004',
    programmeCode: 'BTECH-AIML',
    academicYear: '2026-27',
    approvedRegularIntake: 60,
    supernumeraryLimits: { tfw: 3, ews: 6, lateralEntry: 6, pmsss: 2, jnk: 1, nri: 3 },
  },
  {
    id: 'INT-006',
    institutionId: 'INST-005',
    programmeCode: 'BTECH-MECH',
    academicYear: '2026-27',
    approvedRegularIntake: 60,
    supernumeraryLimits: { tfw: 3, ews: 6, lateralEntry: 6, pmsss: 2, jnk: 1, nri: 3 }, // 0 enrolments -> V-12
  },
];

// Deterministic seed generation
export function generateSeedEnrolments(): StudentEnrolment[] {
  const records: StudentEnrolment[] = [];

  const firstNames = [
    'Aarav', 'Aditi', 'Ananya', 'Arjun', 'Bhavya', 'Chirag', 'Devika', 'Dhruv', 'Diya',
    'Ishaan', 'Kavya', 'Manish', 'Neha', 'Pranav', 'Pooja', 'Rahul', 'Rhea', 'Rohan',
    'Sakshi', 'Sameer', 'Shreya', 'Siddharth', 'Tanvi', 'Varun', 'Vidya', 'Yash', 'Zoya',
    'Abhishek', 'Akanksha', 'Deepak', 'Geeta', 'Harsh', 'Isha', 'Kunal', 'Meera', 'Nikhil'
  ];

  const lastNames = [
    'Sharma', 'Verma', 'Patel', 'Reddy', 'Iyer', 'Nair', 'Singh', 'Gupta', 'Kumar',
    'Mishra', 'Choudhury', 'Mukherjee', 'Bose', 'Das', 'Kulkarni', 'Deshmukh', 'Joshi',
    'Rao', 'Bhat', 'Menon', 'Pillai', 'Sengupta', 'Chatterjee', 'Banerjee', 'Aggarwal'
  ];

  // Helper to generate padded number
  const pad = (n: number, w: number) => n.toString().padStart(w, '0');

  // 1. Seed INST-001 (Northstar Institute) B.Sc. Computer Science:
  // 128 active regular students (Approved regular intake is 120 -> +8 Excess for V-09)
  for (let i = 1; i <= 128; i++) {
    const fn = firstNames[(i * 3) % firstNames.length];
    const ln = lastNames[(i * 7) % lastNames.length];
    const apaar = `91028374${pad(1000 + i, 4)}`;

    records.push({
      id: `rec-nst-cse-${pad(i, 3)}`,
      institutionId: 'INST-001',
      academicYear: '2026-27',
      programmeCode: 'BTECH-CSE',
      studentReference: `2026-NST-CS-${pad(i, 3)}`,
      studentName: `${fn} ${ln}`,
      dateOfBirth: `2005-0${(i % 8) + 1}-${pad((i % 25) + 1, 2)}`,
      apaarId: apaar,
      admissionDate: `2026-07-${pad((i % 20) + 10, 2)}`,
      enrolmentStatus: 'ACTIVE',
      seatCategory: i % 4 === 0 ? 'OBC' : i % 7 === 0 ? 'SC' : 'OPEN',
      supernumeraryFlag: false,
      supernumeraryCategory: null,
      enrolmentEndDate: null,
      transferStatus: 'NONE',
      transferEffectiveDate: null,
    });
  }

  // 2. Add 18 supernumerary students to INST-001 B.Sc. Computer Science (6 TFW, 6 EWS, 6 NRI)
  // Evaluated completely independently from regular intake
  for (let i = 1; i <= 6; i++) {
    const fn = firstNames[(i * 5) % firstNames.length];
    const ln = lastNames[(i * 9) % lastNames.length];
    records.push({
      id: `rec-nst-tfw-${pad(i, 3)}`,
      institutionId: 'INST-001',
      academicYear: '2026-27',
      programmeCode: 'BTECH-CSE',
      studentReference: `2026-NST-TFW-${pad(i, 2)}`,
      studentName: `${fn} ${ln}`,
      dateOfBirth: `2005-04-${pad(i + 5, 2)}`,
      apaarId: `91028374${pad(2000 + i, 4)}`,
      admissionDate: `2026-07-${pad(i + 12, 2)}`,
      enrolmentStatus: 'ACTIVE',
      seatCategory: 'TFW',
      supernumeraryFlag: true,
      supernumeraryCategory: 'TFW',
      enrolmentEndDate: null,
      transferStatus: 'NONE',
      transferEffectiveDate: null,
    });
  }

  for (let i = 1; i <= 6; i++) {
    const fn = firstNames[(i * 6) % firstNames.length];
    const ln = lastNames[(i * 8) % lastNames.length];
    records.push({
      id: `rec-nst-ews-${pad(i, 3)}`,
      institutionId: 'INST-001',
      academicYear: '2026-27',
      programmeCode: 'BTECH-CSE',
      studentReference: `2026-NST-EWS-${pad(i, 2)}`,
      studentName: `${fn} ${ln}`,
      dateOfBirth: `2005-05-${pad(i + 5, 2)}`,
      apaarId: `91028374${pad(2100 + i, 4)}`,
      admissionDate: `2026-07-${pad(i + 14, 2)}`,
      enrolmentStatus: 'ACTIVE',
      seatCategory: 'EWS',
      supernumeraryFlag: true,
      supernumeraryCategory: 'EWS',
      enrolmentEndDate: null,
      transferStatus: 'NONE',
      transferEffectiveDate: null,
    });
  }

  for (let i = 1; i <= 6; i++) {
    const fn = firstNames[(i * 7) % firstNames.length];
    const ln = lastNames[(i * 4) % lastNames.length];
    records.push({
      id: `rec-nst-nri-${pad(i, 3)}`,
      institutionId: 'INST-001',
      academicYear: '2026-27',
      programmeCode: 'BTECH-CSE',
      studentReference: `2026-NST-NRI-${pad(i, 2)}`,
      studentName: `${fn} ${ln}`,
      dateOfBirth: `2005-06-${pad(i + 5, 2)}`,
      apaarId: `91028374${pad(2200 + i, 4)}`,
      admissionDate: `2026-07-${pad(i + 16, 2)}`,
      enrolmentStatus: 'ACTIVE',
      seatCategory: 'NRI',
      supernumeraryFlag: true,
      supernumeraryCategory: 'NRI',
      enrolmentEndDate: null,
      transferStatus: 'NONE',
      transferEffectiveDate: null,
    });
  }

  // 3. Specific Seed Scenarios for Rules and TPER:

  // SCENARIO A: Conflicting Active Double Enrolment (V-05)
  // Priya Sharma enrolled active in Northstar Institute AND Cedar Technical College simultaneously!
  const duplicateApaar = '748392019421';
  records.push({
    id: 'rec-tper-dup-1',
    institutionId: 'INST-001',
    academicYear: '2026-27',
    programmeCode: 'BTECH-ECE',
    studentReference: '2026-NST-EC-041',
    studentName: 'Priya Sharma',
    dateOfBirth: '2005-03-14',
    apaarId: duplicateApaar,
    admissionDate: '2026-07-15',
    enrolmentStatus: 'ACTIVE',
    seatCategory: 'OPEN',
    supernumeraryFlag: false,
    supernumeraryCategory: null,
    enrolmentEndDate: null,
    transferStatus: 'NONE',
    transferEffectiveDate: null,
  });

  records.push({
    id: 'rec-tper-dup-2',
    institutionId: 'INST-002',
    academicYear: '2026-27',
    programmeCode: 'BTECH-CSE',
    studentReference: '2026-CTC-CS-088',
    studentName: 'Priya Sharma',
    dateOfBirth: '2005-03-14',
    apaarId: duplicateApaar,
    admissionDate: '2026-08-01',
    enrolmentStatus: 'ACTIVE',
    seatCategory: 'OPEN',
    supernumeraryFlag: false,
    supernumeraryCategory: null,
    enrolmentEndDate: null,
    transferStatus: 'NONE',
    transferEffectiveDate: null,
  });

  // SCENARIO B: Legitimate Academic Transfer (Stage C Non-overlapping)
  // Rohan Verma was at Cedar Technical College, formally transferred on 2026-06-30, then admitted to Northstar on 2026-07-25
  const transferApaar = '639201847512';
  records.push({
    id: 'rec-tper-transfer-old',
    institutionId: 'INST-002',
    academicYear: '2025-26',
    programmeCode: 'BTECH-IT',
    studentReference: '2025-CTC-IT-019',
    studentName: 'Rohan Verma',
    dateOfBirth: '2004-11-20',
    apaarId: transferApaar,
    admissionDate: '2025-07-10',
    enrolmentStatus: 'TRANSFERRED',
    seatCategory: 'OPEN',
    supernumeraryFlag: false,
    supernumeraryCategory: null,
    enrolmentEndDate: '2026-06-30',
    transferStatus: 'APPROVED',
    transferEffectiveDate: '2026-06-30',
  });

  records.push({
    id: 'rec-tper-transfer-new',
    institutionId: 'INST-001',
    academicYear: '2026-27',
    programmeCode: 'BTECH-ECE',
    studentReference: '2026-NST-EC-092',
    studentName: 'Rohan Verma',
    dateOfBirth: '2004-11-20',
    apaarId: transferApaar,
    admissionDate: '2026-07-25',
    enrolmentStatus: 'ACTIVE',
    seatCategory: 'OPEN',
    supernumeraryFlag: false,
    supernumeraryCategory: null,
    enrolmentEndDate: null,
    transferStatus: 'COMPLETED',
    transferEffectiveDate: '2026-07-25',
  });

  // SCENARIO C: Heuristic Candidate without APAAR (Stage D)
  // Aarav Mukherjee has missing APAAR at Summit Arts College and Lakeview Institute
  records.push({
    id: 'rec-heur-1',
    institutionId: 'INST-004',
    academicYear: '2026-27',
    programmeCode: 'BTECH-AIML',
    studentReference: '2026-SAC-AI-014',
    studentName: 'Aarav Mukherjee',
    dateOfBirth: '2005-09-18',
    apaarId: null, // Missing APAAR
    admissionDate: '2026-07-18',
    enrolmentStatus: 'ACTIVE',
    seatCategory: 'OPEN',
    supernumeraryFlag: false,
    supernumeraryCategory: null,
    enrolmentEndDate: null,
    transferStatus: 'NONE',
    transferEffectiveDate: null,
  });

  records.push({
    id: 'rec-heur-2',
    institutionId: 'INST-005',
    academicYear: '2026-27',
    programmeCode: 'BTECH-CSE',
    studentReference: '2026-LVI-CS-044',
    studentName: 'Aarav Mukherji', // slight spelling variation
    dateOfBirth: '2005-09-18',
    apaarId: null, // Missing APAAR
    admissionDate: '2026-08-05',
    enrolmentStatus: 'ACTIVE',
    seatCategory: 'OPEN',
    supernumeraryFlag: false,
    supernumeraryCategory: null,
    enrolmentEndDate: null,
    transferStatus: 'NONE',
    transferEffectiveDate: null,
  });

  // SCENARIO D: Internal Batch Duplicate APAAR (V-04) at Cedar Technical College
  const batchDupApaar = '859403827164';
  records.push({
    id: 'rec-ctc-bdup-1',
    institutionId: 'INST-002',
    academicYear: '2026-27',
    programmeCode: 'BTECH-IT',
    studentReference: '2026-CTC-IT-005',
    studentName: 'Manish Iyer',
    dateOfBirth: '2005-06-11',
    apaarId: batchDupApaar,
    admissionDate: '2026-07-16',
    enrolmentStatus: 'ACTIVE',
    seatCategory: 'OPEN',
    supernumeraryFlag: false,
    supernumeraryCategory: null,
    enrolmentEndDate: null,
    transferStatus: 'NONE',
    transferEffectiveDate: null,
  });

  records.push({
    id: 'rec-ctc-bdup-2',
    institutionId: 'INST-002',
    academicYear: '2026-27',
    programmeCode: 'BTECH-IT',
    studentReference: '2026-CTC-IT-049',
    studentName: 'Manish Iyer',
    dateOfBirth: '2005-06-11',
    apaarId: batchDupApaar,
    admissionDate: '2026-07-20',
    enrolmentStatus: 'ACTIVE',
    seatCategory: 'OPEN',
    supernumeraryFlag: false,
    supernumeraryCategory: null,
    enrolmentEndDate: null,
    transferStatus: 'NONE',
    transferEffectiveDate: null,
  });

  // SCENARIO E: Supernumerary TFW Quota Excess (V-10) at INST-003 Riverbend (Limit is 3, seeding 5)
  for (let i = 1; i <= 5; i++) {
    records.push({
      id: `rec-rbu-tfw-${i}`,
      institutionId: 'INST-003',
      academicYear: '2026-27',
      programmeCode: 'BTECH-ECE',
      studentReference: `2026-RBU-TFW-${pad(i, 2)}`,
      studentName: `${firstNames[i + 10]} ${lastNames[i + 5]}`,
      dateOfBirth: `2005-02-1${i}`,
      apaarId: `55443322110${i}`,
      admissionDate: `2026-07-1${i}`,
      enrolmentStatus: 'ACTIVE',
      seatCategory: 'TFW',
      supernumeraryFlag: true,
      supernumeraryCategory: 'TFW',
      enrolmentEndDate: null,
      transferStatus: 'NONE',
      transferEffectiveDate: null,
    });
  }

  // SCENARIO F: Missing Required Fields (V-01: Blocking REJECTED)
  records.push({
    id: 'rec-err-v01',
    institutionId: 'INST-004',
    academicYear: '2026-27',
    programmeCode: 'BTECH-AIML',
    studentReference: '2026-SAC-ERR-001',
    studentName: '', // Blank name -> V-01 failure
    dateOfBirth: '2005-01-10',
    apaarId: '443322119988',
    admissionDate: '2026-08-01',
    enrolmentStatus: 'ACTIVE',
    seatCategory: 'OPEN',
    supernumeraryFlag: false,
    supernumeraryCategory: null,
    enrolmentEndDate: null,
    transferStatus: 'NONE',
    transferEffectiveDate: null,
  });

  // SCENARIO G: Malformed Date of Birth / Age Violation (V-06: Blocking REJECTED)
  records.push({
    id: 'rec-err-v06',
    institutionId: 'INST-004',
    academicYear: '2026-27',
    programmeCode: 'BTECH-AIML',
    studentReference: '2026-SAC-ERR-002',
    studentName: 'Kunal Deshmukh',
    dateOfBirth: '2022-05-15', // 4 years old at admission -> age violation V-06
    apaarId: '887766554433',
    admissionDate: '2026-08-02',
    enrolmentStatus: 'ACTIVE',
    seatCategory: 'OPEN',
    supernumeraryFlag: false,
    supernumeraryCategory: null,
    enrolmentEndDate: null,
    transferStatus: 'NONE',
    transferEffectiveDate: null,
  });

  // SCENARIO H: Malformed APAAR Format (V-03: Flagged)
  records.push({
    id: 'rec-warn-v03',
    institutionId: 'INST-005',
    academicYear: '2026-27',
    programmeCode: 'BTECH-CSE',
    studentReference: '2026-LVI-CS-071',
    studentName: 'Shreya Sengupta',
    dateOfBirth: '2005-08-22',
    apaarId: 'APAAR-9988-77', // Not 12 numeric digits -> V-03 flagged
    admissionDate: '2026-07-28',
    enrolmentStatus: 'ACTIVE',
    seatCategory: 'OPEN',
    supernumeraryFlag: false,
    supernumeraryCategory: null,
    enrolmentEndDate: null,
    transferStatus: 'NONE',
    transferEffectiveDate: null,
  });

  // SCENARIO I: Admission Date Outside Session Window (V-07: Flagged)
  records.push({
    id: 'rec-warn-v07',
    institutionId: 'INST-005',
    academicYear: '2026-27',
    programmeCode: 'BTECH-ECE',
    studentReference: '2026-LVI-EC-012',
    studentName: 'Deepak Banerjee',
    dateOfBirth: '2005-04-12',
    apaarId: '112233445566',
    admissionDate: '2026-02-15', // Way before session window
    enrolmentStatus: 'ACTIVE',
    seatCategory: 'OPEN',
    supernumeraryFlag: false,
    supernumeraryCategory: null,
    enrolmentEndDate: null,
    transferStatus: 'NONE',
    transferEffectiveDate: null,
  });

  // SCENARIO J: Seat Category & Supernumerary Conflict (V-08: Flagged)
  records.push({
    id: 'rec-warn-v08',
    institutionId: 'INST-005',
    academicYear: '2026-27',
    programmeCode: 'BTECH-ECE',
    studentReference: '2026-LVI-EC-033',
    studentName: 'Meera Das',
    dateOfBirth: '2005-10-09',
    apaarId: '223344556677',
    admissionDate: '2026-08-10',
    enrolmentStatus: 'ACTIVE',
    seatCategory: 'OPEN',
    supernumeraryFlag: true, // Supernumerary is true but category is omitted
    supernumeraryCategory: null,
    enrolmentEndDate: null,
    transferStatus: 'NONE',
    transferEffectiveDate: null,
  });

  // 4. Fill remaining records across Cedar, Riverbend, Summit, Lakeview to maintain exactly 224 demonstration rows
  const instList = ['INST-002', 'INST-003', 'INST-004', 'INST-005'];
  const progList = ['BTECH-CSE', 'BTECH-ECE', 'BTECH-IT', 'BTECH-AIML'];

  let extraIndex = 1;
  while (records.length < 224) {
    const targetInst = instList[extraIndex % instList.length];
    const targetProg = progList[extraIndex % progList.length];
    const fn = firstNames[(extraIndex * 4) % firstNames.length];
    const ln = lastNames[(extraIndex * 6) % lastNames.length];
    const apaar = `92345678${pad(3000 + extraIndex, 4)}`;

    records.push({
      id: `rec-extra-${pad(extraIndex, 3)}`,
      institutionId: targetInst,
      academicYear: '2026-27',
      programmeCode: targetProg,
      studentReference: `2026-${targetInst.replace('INST-00', 'IN')}-${targetProg.slice(-2)}-${pad(extraIndex, 3)}`,
      studentName: `${fn} ${ln}`,
      dateOfBirth: `2005-0${(extraIndex % 9) + 1}-${pad((extraIndex % 27) + 1, 2)}`,
      apaarId: extraIndex % 15 === 0 ? null : apaar,
      admissionDate: `2026-08-${pad((extraIndex % 20) + 1, 2)}`,
      enrolmentStatus: 'ACTIVE',
      seatCategory: extraIndex % 5 === 0 ? 'OBC' : extraIndex % 9 === 0 ? 'SC' : 'OPEN',
      supernumeraryFlag: false,
      supernumeraryCategory: null,
      enrolmentEndDate: null,
      transferStatus: 'NONE',
      transferEffectiveDate: null,
    });
    extraIndex++;
  }

  return records;
}

// Generate complete pre-processed seed dataset
export function initializeSeedState() {
  const rawRecords = generateSeedEnrolments();

  // Process all rows through rules engine
  const { processedRecords, allFindings, summary } = processSubmissionBatch(
    rawRecords,
    DEFAULT_RULES,
    SEED_INTAKE_LIMITS
  );

  // Initial historical submissions (one for each active institution)
  const submissions: Submission[] = [];
  const instGroups = new Map<string, StudentEnrolment[]>();
  processedRecords.forEach((r) => {
    if (!instGroups.has(r.institutionId)) instGroups.set(r.institutionId, []);
    instGroups.get(r.institutionId)!.push(r);
  });

  SEED_INSTITUTIONS.forEach((inst, idx) => {
    const recs = instGroups.get(inst.id) || [];
    const acc = recs.filter((r) => r.rowOutcome === 'ACCEPTED').length;
    const flg = recs.filter((r) => r.rowOutcome === 'FLAGGED').length;
    const rej = recs.filter((r) => r.rowOutcome === 'REJECTED').length;

    submissions.push({
      id: `SUB-2026-${inst.id.slice(-3)}`,
      institutionId: inst.id,
      academicYear: '2026-27',
      timestamp: `2026-10-27T10:${pad(30 + idx, 2)}:00Z`,
      ruleEngineVersion: INITIAL_RULE_VERSION,
      submittedBy: `${inst.name} Registrar Office`,
      status: rej > 0 ? 'REVIEW_REQUIRED' : flg > 0 ? 'VALIDATED' : 'RECONCILIATION_COMPLETE',
      totalRows: recs.length,
      acceptedRows: acc,
      flaggedRows: flg,
      rejectedRows: rej,
      records: recs,
      revalidationCount: 0,
    });
  });

  // Run initial TPER Reconciliation
  const duplicateCandidates = runTperReconciliation(processedRecords);

  // Initial Audit Trail with accurate actor roles and current timestamps
  const auditEvents: AuditEvent[] = [
    {
      id: 'AUD-001',
      timestamp: '2026-10-27T10:00:00Z',
      actorName: 'System Engine',
      actorRole: 'SYSTEM_ADMIN',
      action: 'SYSTEM_BOOTSTRAP',
      entityType: 'RULE_ENGINE',
      entityId: INITIAL_RULE_VERSION,
      previousState: null,
      newState: 'INITIALIZED',
      reasonOrRuleId: 'V-01_TO_V-12',
      reference: 'AICTE-TPER-CONFIG-2026',
    },
    {
      id: 'AUD-002',
      timestamp: '2026-10-27T10:30:00Z',
      actorName: 'Northstar Institute Registrar',
      actorRole: 'INSTITUTION_SUBMITTER',
      action: 'SUBMISSION_BATCH_INGEST',
      entityType: 'SUBMISSION',
      entityId: 'SUB-2026-001',
      previousState: 'DRAFT',
      newState: 'VALIDATED',
      reasonOrRuleId: '148 Records Ingested',
      reference: 'NST-2026-AY-FINAL.csv',
    },
    {
      id: 'AUD-003',
      timestamp: '2026-10-27T11:15:00Z',
      actorName: 'Cedar Technical College Admissions Head',
      actorRole: 'INSTITUTION_SUBMITTER',
      action: 'SUBMISSION_BATCH_INGEST',
      entityType: 'SUBMISSION',
      entityId: 'SUB-2026-002',
      previousState: 'DRAFT',
      newState: 'VALIDATED',
      reasonOrRuleId: 'Batch Upload',
      reference: 'CTC-UG-2026-REV2.csv',
    },
    {
      id: 'AUD-004',
      timestamp: '2026-10-27T14:20:00Z',
      actorName: 'AICTE Regulatory Reviewer',
      actorRole: 'AICTE_REVIEWER',
      action: 'TPER_RECONCILIATION_SCAN',
      entityType: 'EXCEPTION_CANDIDATE',
      entityId: 'TPER-SCAN-01',
      previousState: null,
      newState: `${duplicateCandidates.length} Candidates Identified`,
      reasonOrRuleId: 'V-05_CROSS_INSTITUTION',
      reference: 'AUTOMATED_TEMPORAL_EVALUATION',
      tenantId: 'global',
    },
  ];

  let prevGenesisHash = 'GENESIS_BLOCK_0000000000000000000000000000000000000000000000000000000000000000';
  auditEvents.forEach((ev) => {
    ev.prevHash = prevGenesisHash;
    ev.hash = computeAuditEventHash(ev, prevGenesisHash);
    prevGenesisHash = ev.hash;
  });

  // Seed Verification Requests demonstrating all three outcomes with accurate role and current synthetic timestamps
  const verificationRequests: VerificationRequest[] = [
    {
      id: 'VER-001',
      timestamp: '2026-10-27T09:12:00Z',
      searchType: 'STUDENT_REF',
      searchValue: '2026-NST-CS-001',
      maskedSearchValue: '2026-NST-CS-001',
      institutionId: 'INST-001',
      academicYear: '2026-27',
      programmeCode: 'BTECH-CSE',
      officerName: 'Verification Officer',
      result: 'VERIFIED',
      reasonCode: 'CLEAN_ACTIVE_ENROLMENT',
      reasonDescription: 'Student is confirmed active in approved programme with no unresolved exceptions.',
      matchedRecordSnippet: {
        studentReference: '2026-NST-CS-001',
        maskedApaarId: 'APAAR-***-1001',
        institutionName: 'Northstar Institute',
        programmeCode: 'BTECH-CSE',
        enrolmentStatus: 'ACTIVE',
        academicYear: '2026-27',
      },
    },
    {
      id: 'VER-002',
      timestamp: '2026-10-27T11:45:00Z',
      searchType: 'STUDENT_REF',
      searchValue: '2026-NST-ERR-999',
      maskedSearchValue: '2026-NST-ERR-999',
      institutionId: 'INST-001',
      academicYear: '2026-27',
      programmeCode: 'BTECH-CSE',
      officerName: 'Verification Officer',
      result: 'NOT_VERIFIED',
      reasonCode: 'RECORD_NOT_FOUND',
      reasonDescription: 'No matching student record found for the provided student reference and institution.',
    },
    {
      id: 'VER-003',
      timestamp: '2026-10-27T14:30:00Z',
      searchType: 'APAAR_ID',
      searchValue: '748392019421',
      maskedSearchValue: 'APAAR-***-9421',
      institutionId: 'INST-001',
      academicYear: '2026-27',
      programmeCode: 'BTECH-ECE',
      officerName: 'Verification Officer',
      result: 'UNABLE_TO_VERIFY',
      reasonCode: 'UNRESOLVED_CONCURRENT_ENROLMENT',
      reasonDescription: 'Candidate identifier has active unresolved cross-institutional duplicate exception (TPER Candidate pending review).',
    },
  ];

  return {
    institutions: SEED_INSTITUTIONS,
    programmes: SEED_PROGRAMMES,
    intakeLimits: SEED_INTAKE_LIMITS,
    records: processedRecords,
    submissions,
    duplicateCandidates,
    auditEvents,
    verificationRequests,
    rules: DEFAULT_RULES,
    ruleVersion: INITIAL_RULE_VERSION,
  };
}
