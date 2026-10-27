import {
  StudentEnrolment,
  IntakeLimit,
  Institution,
  ValidationFinding,
} from '../types';
import { SEED_INSTITUTIONS, SEED_PROGRAMMES } from './seedData';

// Mulberry32 32-bit deterministic PRNG
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BenchmarkBenchmarkDataset {
  records: StudentEnrolment[];
  intakeLimits: IntakeLimit[];
  institutions: Institution[];
  seededErrorCount: number;
  seededDuplicatePairCount: number;
  seededIntakeBreachCount: number;
  expectedAuditActionCount: number;
}

export function generateBenchmarkDataset(totalRows = 20000): BenchmarkBenchmarkDataset {
  const rng = mulberry32(0x1d7e4a); // fixed random seed for 100% deterministic reproducibility

  const firstNames = [
    'Aarav', 'Aditi', 'Ananya', 'Arjun', 'Bhavya', 'Chirag', 'Devika', 'Dhruv', 'Diya',
    'Ishaan', 'Kavya', 'Manish', 'Neha', 'Pranav', 'Pooja', 'Rahul', 'Rhea', 'Rohan',
    'Sakshi', 'Sameer', 'Shreya', 'Siddharth', 'Tanvi', 'Varun', 'Vidya', 'Yash', 'Zoya',
    'Abhishek', 'Akanksha', 'Deepak', 'Geeta', 'Harsh', 'Isha', 'Kunal', 'Meera', 'Nikhil',
    'Pooja', 'Amit', 'Sunita', 'Vikram', 'Anjali', 'Rajesh', 'Suresh', 'Kavita', 'Sanjay'
  ];

  const lastNames = [
    'Sharma', 'Verma', 'Patel', 'Reddy', 'Iyer', 'Nair', 'Singh', 'Gupta', 'Kumar',
    'Mishra', 'Choudhury', 'Mukherjee', 'Bose', 'Das', 'Kulkarni', 'Deshmukh', 'Joshi',
    'Rao', 'Bhat', 'Menon', 'Pillai', 'Sengupta', 'Chatterjee', 'Banerjee', 'Aggarwal'
  ];

  const institutions = SEED_INSTITUTIONS;
  const instIds = institutions.map((i) => i.id);
  const progCodes = ['BTECH-CSE', 'BTECH-ECE', 'BTECH-AIML', 'BTECH-IT', 'BTECH-MECH'];

  const pad = (n: number, w: number) => n.toString().padStart(w, '0');

  // Configured intake limits for performance benchmark
  const intakeLimits: IntakeLimit[] = [
    {
      id: 'BENCH-INT-001',
      institutionId: 'INST-001',
      programmeCode: 'BTECH-CSE',
      academicYear: '2026-27',
      approvedRegularIntake: 1200, // We will seed 1280 regular -> +80 breach (Breach 1)
      supernumeraryLimits: { tfw: 60, ews: 60, lateralEntry: 120, pmsss: 30, jnk: 20, nri: 60 },
    },
    {
      id: 'BENCH-INT-002',
      institutionId: 'INST-002',
      programmeCode: 'BTECH-CSE',
      academicYear: '2026-27',
      approvedRegularIntake: 600, // We will seed 640 regular -> +40 breach (Breach 2)
      supernumeraryLimits: { tfw: 30, ews: 30, lateralEntry: 60, pmsss: 15, jnk: 10, nri: 30 },
    },
    {
      id: 'BENCH-INT-003',
      institutionId: 'INST-003',
      programmeCode: 'BTECH-ECE',
      academicYear: '2026-27',
      approvedRegularIntake: 1000,
      supernumeraryLimits: { tfw: 50, ews: 50, lateralEntry: 100, pmsss: 25, jnk: 15, nri: 50 },
    },
    {
      id: 'BENCH-INT-004',
      institutionId: 'INST-004',
      programmeCode: 'BTECH-AIML',
      academicYear: '2026-27',
      approvedRegularIntake: 800,
      supernumeraryLimits: { tfw: 40, ews: 40, lateralEntry: 80, pmsss: 20, jnk: 10, nri: 40 },
    },
    {
      id: 'BENCH-INT-005',
      institutionId: 'INST-005',
      programmeCode: 'BTECH-MECH',
      academicYear: '2026-27',
      approvedRegularIntake: 800,
      supernumeraryLimits: { tfw: 40, ews: 40, lateralEntry: 80, pmsss: 20, jnk: 10, nri: 40 },
    },
  ];

  const records: StudentEnrolment[] = [];
  let recordCounter = 1;

  // 1. Seed Known Cross-Institution Duplicate Pairs (50 pairs = 100 records)
  // Respecting cross-institution (instA != instB) and date overlap requirements
  const seededDuplicatePairCount = 50;
  for (let d = 1; d <= seededDuplicatePairCount; d++) {
    const fn = firstNames[d % firstNames.length];
    const ln = lastNames[(d * 3) % lastNames.length];
    const dob = `2005-0${(d % 8) + 1}-${pad((d % 25) + 1, 2)}`;
    const apaar = `88009900${pad(d, 4)}`;

    // Institution A (e.g. Northstar INST-001)
    records.push({
      id: `bench-dup-${d}-a`,
      institutionId: 'INST-001',
      academicYear: '2026-27',
      programmeCode: 'BTECH-CSE',
      studentReference: `2026-NST-DUP-${pad(d, 3)}`,
      studentName: `${fn} ${ln}`,
      dateOfBirth: dob,
      apaarId: d <= 30 ? apaar : null, // 30 Stage A Keyed, 20 Stage D Heuristic
      admissionDate: '2026-07-15',
      enrolmentStatus: 'ACTIVE',
      seatCategory: 'OPEN',
      supernumeraryFlag: false,
      supernumeraryCategory: null,
      enrolmentEndDate: null,
      transferStatus: 'NONE',
      transferEffectiveDate: null,
    });

    // Institution B (e.g. Cedar INST-002) - Cross-institution with overlapping active dates!
    records.push({
      id: `bench-dup-${d}-b`,
      institutionId: 'INST-002',
      academicYear: '2026-27',
      programmeCode: 'BTECH-CSE',
      studentReference: `2026-CTC-DUP-${pad(d, 3)}`,
      studentName: d <= 30 ? `${fn} ${ln}` : `${fn} ${ln}`, // Exact name for high score
      dateOfBirth: dob,
      apaarId: d <= 30 ? apaar : null,
      admissionDate: '2026-08-01', // Overlapping active enrolment
      enrolmentStatus: 'ACTIVE',
      seatCategory: 'OPEN',
      supernumeraryFlag: false,
      supernumeraryCategory: null,
      enrolmentEndDate: null,
      transferStatus: 'NONE',
      transferEffectiveDate: null,
    });
    recordCounter += 2;
  }

  // 2. Seed Known Validation Errors (total 1,300 seeded quality errors)
  // - V-01 Missing critical fields: 100 rows
  for (let i = 1; i <= 100; i++) {
    records.push({
      id: `bench-err-v01-${i}`,
      institutionId: instIds[i % 5],
      academicYear: '2026-27',
      programmeCode: 'BTECH-CSE',
      studentReference: `2026-ERR-V01-${pad(i, 3)}`,
      studentName: '', // V-01 missing name
      dateOfBirth: '2005-03-15',
      apaarId: `11002200${pad(i, 4)}`,
      admissionDate: '2026-07-20',
      enrolmentStatus: 'ACTIVE',
      seatCategory: 'OPEN',
      supernumeraryFlag: false,
      supernumeraryCategory: null,
      enrolmentEndDate: null,
      transferStatus: 'NONE',
      transferEffectiveDate: null,
    });
    recordCounter++;
  }

  // - V-02 Missing APAAR: 500 rows
  for (let i = 1; i <= 500; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 2) % lastNames.length];
    records.push({
      id: `bench-warn-v02-${i}`,
      institutionId: instIds[i % 5],
      academicYear: '2026-27',
      programmeCode: progCodes[i % 5],
      studentReference: `2026-NOAPAAR-${pad(i, 4)}`,
      studentName: `${fn} ${ln}`,
      dateOfBirth: '2005-04-10',
      apaarId: null, // V-02 missing APAAR
      admissionDate: '2026-07-25',
      enrolmentStatus: 'ACTIVE',
      seatCategory: 'OPEN',
      supernumeraryFlag: false,
      supernumeraryCategory: null,
      enrolmentEndDate: null,
      transferStatus: 'NONE',
      transferEffectiveDate: null,
    });
    recordCounter++;
  }

  // - V-03 APAAR format mismatch: 200 rows
  for (let i = 1; i <= 200; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 3) % lastNames.length];
    records.push({
      id: `bench-warn-v03-${i}`,
      institutionId: instIds[i % 5],
      academicYear: '2026-27',
      programmeCode: progCodes[i % 5],
      studentReference: `2026-BADFMT-${pad(i, 3)}`,
      studentName: `${fn} ${ln}`,
      dateOfBirth: '2005-05-12',
      apaarId: `APAAR-${pad(i, 4)}`, // V-03 bad format
      admissionDate: '2026-07-22',
      enrolmentStatus: 'ACTIVE',
      seatCategory: 'OPEN',
      supernumeraryFlag: false,
      supernumeraryCategory: null,
      enrolmentEndDate: null,
      transferStatus: 'NONE',
      transferEffectiveDate: null,
    });
    recordCounter++;
  }

  // - V-06 Invalid age / DOB: 120 rows
  for (let i = 1; i <= 120; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 4) % lastNames.length];
    records.push({
      id: `bench-err-v06-${i}`,
      institutionId: instIds[i % 5],
      academicYear: '2026-27',
      programmeCode: progCodes[i % 5],
      studentReference: `2026-BADAGE-${pad(i, 3)}`,
      studentName: `${fn} ${ln}`,
      dateOfBirth: '2022-01-01', // 4 years old at admission -> V-06
      apaarId: `33004400${pad(i, 4)}`,
      admissionDate: '2026-07-28',
      enrolmentStatus: 'ACTIVE',
      seatCategory: 'OPEN',
      supernumeraryFlag: false,
      supernumeraryCategory: null,
      enrolmentEndDate: null,
      transferStatus: 'NONE',
      transferEffectiveDate: null,
    });
    recordCounter++;
  }

  // - V-07 Admission date outside window: 150 rows
  for (let i = 1; i <= 150; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 5) % lastNames.length];
    records.push({
      id: `bench-warn-v07-${i}`,
      institutionId: instIds[i % 5],
      academicYear: '2026-27',
      programmeCode: progCodes[i % 5],
      studentReference: `2026-OUTWIN-${pad(i, 3)}`,
      studentName: `${fn} ${ln}`,
      dateOfBirth: '2005-06-18',
      apaarId: `44005500${pad(i, 4)}`,
      admissionDate: '2026-01-15', // early date -> V-07
      enrolmentStatus: 'ACTIVE',
      seatCategory: 'OPEN',
      supernumeraryFlag: false,
      supernumeraryCategory: null,
      enrolmentEndDate: null,
      transferStatus: 'NONE',
      transferEffectiveDate: null,
    });
    recordCounter++;
  }

  // - V-08 Seat Category & Supernumerary Conflict: 90 rows
  for (let i = 1; i <= 90; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 6) % lastNames.length];
    records.push({
      id: `bench-warn-v08-${i}`,
      institutionId: instIds[i % 5],
      academicYear: '2026-27',
      programmeCode: progCodes[i % 5],
      studentReference: `2026-SUPCONF-${pad(i, 3)}`,
      studentName: `${fn} ${ln}`,
      dateOfBirth: '2005-07-21',
      apaarId: `55006600${pad(i, 4)}`,
      admissionDate: '2026-07-29',
      enrolmentStatus: 'ACTIVE',
      seatCategory: 'OPEN',
      supernumeraryFlag: true, // true without category -> V-08
      supernumeraryCategory: null,
      enrolmentEndDate: null,
      transferStatus: 'NONE',
      transferEffectiveDate: null,
    });
    recordCounter++;
  }

  // - V-11 Supernumerary Eligibility Discrepancy: 60 rows
  for (let i = 1; i <= 60; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 7) % lastNames.length];
    records.push({
      id: `bench-warn-v11-${i}`,
      institutionId: instIds[i % 5],
      academicYear: '2026-27',
      programmeCode: progCodes[i % 5],
      studentReference: `2026-ELIGDISC-${pad(i, 3)}`,
      studentName: `${fn} ${ln}`,
      dateOfBirth: '2005-08-14',
      apaarId: `66007700${pad(i, 4)}`,
      admissionDate: '2026-07-26',
      enrolmentStatus: 'ACTIVE',
      seatCategory: 'MANAGEMENT', // Management + supernumerary -> V-11
      supernumeraryFlag: true,
      supernumeraryCategory: 'TFW',
      enrolmentEndDate: null,
      transferStatus: 'NONE',
      transferEffectiveDate: null,
    });
    recordCounter++;
  }

  // - V-04 Internal batch duplicate APAARs: 80 rows (40 duplicate pairs)
  for (let i = 1; i <= 40; i++) {
    const fn1 = firstNames[i % firstNames.length];
    const ln1 = lastNames[(i * 3) % lastNames.length];
    const fn2 = firstNames[(i + 5) % firstNames.length];
    const ln2 = lastNames[(i * 7) % lastNames.length];
    const dupId = `77008800${pad(i, 4)}`;

    records.push({
      id: `bench-bdup-${i}-a`,
      institutionId: 'INST-003',
      academicYear: '2026-27',
      programmeCode: 'BTECH-ECE',
      studentReference: `2026-RBU-BDUP-${pad(i, 3)}A`,
      studentName: `${fn1} ${ln1}`,
      dateOfBirth: '2005-09-09',
      apaarId: dupId,
      admissionDate: '2026-07-20',
      enrolmentStatus: 'ACTIVE',
      seatCategory: 'OPEN',
      supernumeraryFlag: false,
      supernumeraryCategory: null,
      enrolmentEndDate: null,
      transferStatus: 'NONE',
      transferEffectiveDate: null,
    });
    records.push({
      id: `bench-bdup-${i}-b`,
      institutionId: 'INST-003',
      academicYear: '2026-27',
      programmeCode: 'BTECH-ECE',
      studentReference: `2026-RBU-BDUP-${pad(i, 3)}B`,
      studentName: `${fn2} ${ln2}`,
      dateOfBirth: '2005-09-15',
      apaarId: dupId,
      admissionDate: '2026-07-24',
      enrolmentStatus: 'ACTIVE',
      seatCategory: 'OPEN',
      supernumeraryFlag: false,
      supernumeraryCategory: null,
      enrolmentEndDate: null,
      transferStatus: 'NONE',
      transferEffectiveDate: null,
    });
    recordCounter += 2;
  }

  const seededErrorCount = 100 + 500 + 200 + 120 + 150 + 90 + 60 + 80; // = 1,300 known seeded issues

  // 3. Known Programme-Level Intake Breaches:
  // We want INST-001 BTECH-CSE to have 1280 regular enrolments (Approved: 1200 -> +80 breach)
  // And INST-002 BTECH-CSE to have 640 regular enrolments (Approved: 600 -> +40 breach)
  // That gives exactly 2 seeded intake breaches!
  const currentInst1Cse = records.filter(
    (r) => r.institutionId === 'INST-001' && r.programmeCode === 'BTECH-CSE' && !r.supernumeraryFlag
  ).length;

  for (let i = currentInst1Cse + 1; i <= 1280; i++) {
    const fn = firstNames[Math.floor(rng() * firstNames.length)];
    const ln = lastNames[Math.floor(rng() * lastNames.length)];
    records.push({
      id: `bench-inst1-cse-${pad(i, 5)}`,
      institutionId: 'INST-001',
      academicYear: '2026-27',
      programmeCode: 'BTECH-CSE',
      studentReference: `2026-NST-CS-${pad(i, 5)}`,
      studentName: `${fn} ${ln}`,
      dateOfBirth: `2005-0${Math.floor(rng() * 8) + 1}-${pad(Math.floor(rng() * 25) + 1, 2)}`,
      apaarId: `90010000${pad(i, 4)}`,
      admissionDate: '2026-07-18',
      enrolmentStatus: 'ACTIVE',
      seatCategory: i % 4 === 0 ? 'OBC' : 'OPEN',
      supernumeraryFlag: false,
      supernumeraryCategory: null,
      enrolmentEndDate: null,
      transferStatus: 'NONE',
      transferEffectiveDate: null,
    });
    recordCounter++;
  }

  const currentInst2Cse = records.filter(
    (r) => r.institutionId === 'INST-002' && r.programmeCode === 'BTECH-CSE' && !r.supernumeraryFlag
  ).length;

  for (let i = currentInst2Cse + 1; i <= 640; i++) {
    const fn = firstNames[Math.floor(rng() * firstNames.length)];
    const ln = lastNames[Math.floor(rng() * lastNames.length)];
    records.push({
      id: `bench-inst2-cse-${pad(i, 5)}`,
      institutionId: 'INST-002',
      academicYear: '2026-27',
      programmeCode: 'BTECH-CSE',
      studentReference: `2026-CTC-CS-${pad(i, 5)}`,
      studentName: `${fn} ${ln}`,
      dateOfBirth: `2005-0${Math.floor(rng() * 8) + 1}-${pad(Math.floor(rng() * 25) + 1, 2)}`,
      apaarId: `90020000${pad(i, 4)}`,
      admissionDate: '2026-07-20',
      enrolmentStatus: 'ACTIVE',
      seatCategory: 'OPEN',
      supernumeraryFlag: false,
      supernumeraryCategory: null,
      enrolmentEndDate: null,
      transferStatus: 'NONE',
      transferEffectiveDate: null,
    });
    recordCounter++;
  }

  // 4. Fill remaining clean rows deterministically across 5 institutions up to exactly totalRows (20,000)
  while (records.length < totalRows) {
    const idx = records.length + 1;
    const instId = instIds[Math.floor(rng() * instIds.length)];
    const prog = progCodes[Math.floor(rng() * progCodes.length)];
    const fn = firstNames[Math.floor(rng() * firstNames.length)];
    const ln = lastNames[Math.floor(rng() * lastNames.length)];
    const apaar = `9990${pad(idx, 8)}`;

    records.push({
      id: `bench-row-${pad(idx, 6)}`,
      institutionId: instId,
      academicYear: '2026-27',
      programmeCode: prog,
      studentReference: `2026-${instId.replace('INST-00', 'IN')}-${prog.slice(-2)}-${pad(idx, 6)}`,
      studentName: `${fn} ${ln}`,
      dateOfBirth: `2005-0${Math.floor(rng() * 8) + 1}-${pad(Math.floor(rng() * 25) + 1, 2)}`,
      apaarId: apaar,
      admissionDate: '2026-07-24',
      enrolmentStatus: 'ACTIVE',
      seatCategory: idx % 6 === 0 ? 'OBC' : idx % 11 === 0 ? 'SC' : 'OPEN',
      supernumeraryFlag: false,
      supernumeraryCategory: null,
      enrolmentEndDate: null,
      transferStatus: 'NONE',
      transferEffectiveDate: null,
    });
  }

  return {
    records,
    intakeLimits,
    institutions,
    seededErrorCount,
    seededDuplicatePairCount,
    seededIntakeBreachCount: 2,
    expectedAuditActionCount: 500,
  };
}
