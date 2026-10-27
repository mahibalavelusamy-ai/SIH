import {
  StudentEnrolment,
  DuplicateCandidate,
  ReviewDecision,
} from '../types';

// Masking utility for APAAR ID (never display full ID in duplicate candidate views)
export function maskApaarId(apaarId: string | null | undefined): string {
  if (!apaarId || apaarId.trim() === '') return 'UNASSIGNED';
  const clean = apaarId.trim();
  if (clean.length <= 4) return `***-${clean}`;
  const last4 = clean.slice(-4);
  return `APAAR-***-${last4}`;
}

// Demo keyed identifier derivation (Client-side mock representing secure backend HMAC)
export function deriveKeyedIdentifier(apaarId: string): string {
  const clean = apaarId.trim();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `KEY-HMAC-${hex.toUpperCase()}`;
}

// Deterministic string similarity (Dice's coefficient on bigrams)
export function calculateNameSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0;

  const bigrams1 = new Map<string, number>();
  for (let i = 0; i < s1.length - 1; i++) {
    const bg = s1.substr(i, 2);
    bigrams1.set(bg, (bigrams1.get(bg) || 0) + 1);
  }

  let intersection = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bg = s2.substr(i, 2);
    const count = bigrams1.get(bg) || 0;
    if (count > 0) {
      bigrams1.set(bg, count - 1);
      intersection++;
    }
  }

  return (2.0 * intersection) / (s1.length + s2.length - 2);
}

// Configurable Candidate Confidence Thresholds
export interface TperThresholdConfig {
  highThreshold: number; // default 85
  mediumThreshold: number; // default 60
}

export const DEFAULT_TPER_THRESHOLDS: TperThresholdConfig = {
  highThreshold: 85,
  mediumThreshold: 60,
};

// Temporal interval overlap evaluator
export interface IntervalCheck {
  isOverlapping: boolean;
  overlapDescription: string;
  isLegitimateTransfer: boolean;
  isUncertainTransition: boolean;
  transferReason: string;
}

export function evaluateEnrolmentIntervals(
  recordA: StudentEnrolment,
  recordB: StudentEnrolment
): IntervalCheck {
  // Check if either is an approved concurrent programme waiver
  if (recordA.concurrentProgrammeApproved || recordB.concurrentProgrammeApproved) {
    return {
      isOverlapping: false,
      overlapDescription: 'Concurrent programme authorization approved by regulatory council.',
      isLegitimateTransfer: true,
      isUncertainTransition: false,
      transferReason: 'Approved concurrent programme waiver on file.',
    };
  }

  // Determine chronological order by admission date
  const admA = new Date(recordA.admissionDate || '2000-01-01');
  const admB = new Date(recordB.admissionDate || '2000-01-01');

  const [earlier, later] = admA <= admB ? [recordA, recordB] : [recordB, recordA];
  const earlierAdm = new Date(earlier.admissionDate);
  const laterAdm = new Date(later.admissionDate);

  // End date of earlier enrolment: explicit end date, or transfer effective date
  let earlierEnd: Date | null = null;
  if (earlier.enrolmentEndDate) {
    earlierEnd = new Date(earlier.enrolmentEndDate);
  } else if (earlier.transferEffectiveDate) {
    earlierEnd = new Date(earlier.transferEffectiveDate);
  }

  const claimsTransfer =
    earlier.enrolmentStatus === 'TRANSFERRED' ||
    earlier.transferStatus === 'APPROVED' ||
    earlier.transferStatus === 'INITIATED' ||
    later.transferStatus === 'APPROVED' ||
    later.transferStatus === 'INITIATED';

  // CRITICAL REQUIREMENT: Do NOT treat a transfer text field as proof.
  // If dates are missing or conflicting, do not clear the candidate!
  if (claimsTransfer && !earlierEnd) {
    return {
      isOverlapping: true,
      overlapDescription: `Uncertain Transition: Prior enrolment at Institute ${earlier.institutionId} records transfer status but lacks a verified transferEffectiveDate or formal release date.`,
      isLegitimateTransfer: false,
      isUncertainTransition: true,
      transferReason: 'Transfer claimed in metadata without supporting effective release date. Requires human adjudication.',
    };
  }

  // Check for contradictory transition dates (e.g. transfer effective date is AFTER subsequent admission date)
  if (claimsTransfer && earlierEnd && earlierEnd > laterAdm) {
    return {
      isOverlapping: true,
      overlapDescription: `Contradictory Transition: Prior enrolment release date (${earlierEnd.toISOString().split('T')[0]}) occurs AFTER subsequent admission to Institute ${later.institutionId} (${laterAdm.toISOString().split('T')[0]}).`,
      isLegitimateTransfer: false,
      isUncertainTransition: true,
      transferReason: 'Conflicting transition chronology. Overlapping concurrent active window detected despite transfer flag.',
    };
  }

  // Check valid transition awareness (Stage C)
  // If earlier record has TRANSFERRED/WITHDRAWN/COMPLETED status and has a verified release date <= later admission
  if (
    (earlier.enrolmentStatus === 'TRANSFERRED' ||
      earlier.enrolmentStatus === 'WITHDRAWN' ||
      earlier.enrolmentStatus === 'COMPLETED' ||
      earlier.transferStatus === 'APPROVED' ||
      earlier.transferStatus === 'COMPLETED') &&
    earlierEnd !== null
  ) {
    if (earlierEnd <= laterAdm) {
      // Prior enrolment closed before or on new admission date -> Legitimate Transfer
      return {
        isOverlapping: false,
        overlapDescription: `Non-overlapping: Prior enrolment closed on ${earlierEnd.toISOString().split('T')[0]}, prior to subsequent admission on ${laterAdm.toISOString().split('T')[0]}.`,
        isLegitimateTransfer: true,
        isUncertainTransition: false,
        transferReason: `Prior enrolment at Institute ${earlier.institutionId} terminated on ${earlierEnd.toISOString().split('T')[0]} before admission to Institute ${later.institutionId} on ${laterAdm.toISOString().split('T')[0]}.`,
      };
    }
  }

  // If earlier is ACTIVE or has no termination date, or earlier end is AFTER later admission date
  if (!earlierEnd || earlierEnd > laterAdm) {
    // Both active concurrently
    const endDesc = earlierEnd ? earlierEnd.toISOString().split('T')[0] : 'Open-Ended (Active)';
    return {
      isOverlapping: true,
      overlapDescription: `Active Overlap: Earlier enrolment admitted ${earlierAdm.toISOString().split('T')[0]} [End: ${endDesc}] conflicts with subsequent admission on ${laterAdm.toISOString().split('T')[0]}.`,
      isLegitimateTransfer: false,
      isUncertainTransition: false,
      transferReason: 'Conflicting active enrolment intervals across institutions without prior formal release.',
    };
  }

  return {
    isOverlapping: false,
    overlapDescription: 'Enrolment dates do not overlap.',
    isLegitimateTransfer: false,
    isUncertainTransition: false,
    transferReason: 'Distinct non-overlapping academic sessions.',
  };
}

// Stage D: Heuristic score calculation when APAAR ID is missing
export function calculateHeuristicDuplicateScore(
  recordA: StudentEnrolment,
  recordB: StudentEnrolment
): {
  totalScore: number;
  breakdown: {
    nameSimilarityScore: number;
    dobExactMatchScore: number;
    temporalOverlapScore: number;
    programmeSimilarityScore: number;
  };
} {
  // Name similarity: 40 points
  const nameSim = calculateNameSimilarity(recordA.studentName, recordB.studentName);
  const nameScore = Math.round(nameSim * 40);

  // Exact date of birth: 35 points
  const dobMatch =
    recordA.dateOfBirth &&
    recordB.dateOfBirth &&
    recordA.dateOfBirth.trim() === recordB.dateOfBirth.trim();
  const dobScore = dobMatch ? 35 : 0;

  // Overlapping enrolment periods: 15 points
  const intervalCheck = evaluateEnrolmentIntervals(recordA, recordB);
  const temporalScore = intervalCheck.isOverlapping ? 15 : 0;

  // Same or similar programme: 10 points
  const progMatch = recordA.programmeCode === recordB.programmeCode;
  const progScore = progMatch ? 10 : 0;

  const totalScore = nameScore + dobScore + temporalScore + progScore;

  return {
    totalScore,
    breakdown: {
      nameSimilarityScore: nameScore,
      dobExactMatchScore: dobScore,
      temporalOverlapScore: temporalScore,
      programmeSimilarityScore: progScore,
    },
  };
}

// Full TPER Reconciliation Scanner across all active/submitted records
export function runTperReconciliation(
  allRecords: StudentEnrolment[],
  existingCandidates: DuplicateCandidate[] = [],
  thresholds: TperThresholdConfig = DEFAULT_TPER_THRESHOLDS
): DuplicateCandidate[] {
  // Build lookup of existing candidate decisions to preserve human adjudication
  const existingMap = new Map<string, DuplicateCandidate>();
  existingCandidates.forEach((c) => {
    const pairKey = [c.recordA.id, c.recordB.id].sort().join(':::');
    existingMap.set(pairKey, c);
  });

  const candidates: DuplicateCandidate[] = [];

  // Exclude rejected records from reconciliation pool
  const eligibleRecords = allRecords.filter((r) => r.rowOutcome !== 'REJECTED');

  // Pairwise cross-comparison across different institutions (or same institution with different studentRef)
  for (let i = 0; i < eligibleRecords.length; i++) {
    for (let j = i + 1; j < eligibleRecords.length; j++) {
      const recA = eligibleRecords[i];
      const recB = eligibleRecords[j];

      // Avoid matching exact same record
      if (recA.id === recB.id) continue;

      const pairKey = [recA.id, recB.id].sort().join(':::');
      const existing = existingMap.get(pairKey);

      // Check if both have a valid 12-digit APAAR ID (Stage A Keyed Matching)
      const aHasValidApaar = recA.apaarId && /^\d{12}$/.test(recA.apaarId.trim());
      const bHasValidApaar = recB.apaarId && /^\d{12}$/.test(recB.apaarId.trim());

      if (aHasValidApaar && bHasValidApaar) {
        if (recA.apaarId!.trim() === recB.apaarId!.trim()) {
          // Identical APAAR ID detected!
          const interval = evaluateEnrolmentIntervals(recA, recB);
          const keyedId = deriveKeyedIdentifier(recA.apaarId!);

          if (interval.isLegitimateTransfer) {
            // Evaluated as non-conflicting transfer via Stage C
            // We can record or omit, but if existing had adjudication, preserve it
            if (existing) {
              candidates.push(existing);
            }
            continue;
          }

          // Conflicting active enrolment detected!
          if (existing) {
            candidates.push({
              ...existing,
              recordA: recA,
              recordB: recB,
              overlapDetected: interval.isOverlapping,
              overlapInterval: interval.overlapDescription,
            });
          } else {
            const newCandidate: DuplicateCandidate = {
              id: `tper-${recA.id.slice(-4)}-${recB.id.slice(-4)}`,
              recordA: recA,
              recordB: recB,
              matchingStage: 'STAGE_A_KEYED',
              maskedKey: keyedId,
              overlapDetected: interval.isOverlapping,
              overlapInterval: interval.overlapDescription,
              confidenceScore: 98,
              confidenceLevel: 'HIGH',
              signalBreakdown: {
                nameSimilarityScore: 40,
                dobExactMatchScore: 35,
                temporalOverlapScore: interval.isOverlapping ? 15 : 0,
                programmeSimilarityScore: recA.programmeCode === recB.programmeCode ? 10 : 8,
              },
              matchedRuleId: 'V-05',
              explanation: `Identical keyed APAAR token (${keyedId}) active across Institute ${recA.institutionId} and ${recB.institutionId}. ${interval.overlapDescription}`,
              transferEvidence: recA.transferStatus !== 'NONE' || recB.transferStatus !== 'NONE'
                ? `Transfer status recorded: ${recA.institutionId}=${recA.transferStatus}, ${recB.institutionId}=${recB.transferStatus}`
                : null,
              status: 'PENDING_REVIEW',
              decisionHistory: [],
            };
            candidates.push(newCandidate);
          }
        }
      } else {
        // Stage D: Heuristic matching path for records with missing/unmatched APAAR
        // Both records must have temporal overlap to consider heuristic match
        const interval = evaluateEnrolmentIntervals(recA, recB);
        if (!interval.isOverlapping) continue;

        const { totalScore, breakdown } = calculateHeuristicDuplicateScore(recA, recB);

        // Configurable thresholds: >= highThreshold HIGH, >= mediumThreshold MEDIUM, else not raised
        if (totalScore >= thresholds.mediumThreshold) {
          const confidenceLevel = totalScore >= thresholds.highThreshold ? 'HIGH' : 'MEDIUM';

          if (existing) {
            candidates.push({
              ...existing,
              recordA: recA,
              recordB: recB,
              confidenceScore: totalScore,
              confidenceLevel,
              overlapDetected: true,
              overlapInterval: interval.overlapDescription,
            });
          } else {
            const newCandidate: DuplicateCandidate = {
              id: `tper-heur-${recA.id.slice(-4)}-${recB.id.slice(-4)}`,
              recordA: recA,
              recordB: recB,
              matchingStage: 'STAGE_D_HEURISTIC',
              maskedKey: 'HEURISTIC-PROBABILISTIC-KEY',
              overlapDetected: true,
              overlapInterval: interval.overlapDescription,
              confidenceScore: totalScore,
              confidenceLevel,
              signalBreakdown: breakdown,
              matchedRuleId: 'V-05',
              explanation: `High demographic similarity match without verified APAAR key. Name similarity (${breakdown.nameSimilarityScore}/40), DOB exact match (${breakdown.dobExactMatchScore}/35), Temporal overlap (${breakdown.temporalOverlapScore}/15).`,
              transferEvidence: null,
              status: 'PENDING_REVIEW',
              decisionHistory: [],
            };
            candidates.push(newCandidate);
          }
        }
      }
    }
  }

  return candidates;
}
