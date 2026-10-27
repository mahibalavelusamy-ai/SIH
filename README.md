# IDVERA (SIH26263)
## APAAR ID-Based Student Data Management and Verification Platform for AICTE-Approved Institutions

<div align="center">
  <img width="1200" height="475" alt="IDVERA Platform Banner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />

  <p><strong>Smart Automation · Institutional Enrolment Reconciliation & Verification Prototype</strong></p>
  <p>Built for the Smart India Hackathon (SIH 2026) · Problem Statement SIH26263</p>
</div>

---

> **Sandbox & Prototype Notice**: This application operates in a frontend simulation environment using synthetic datasets, masked student identifiers (`APAAR-***-XXXX`), and a mock verification service. It does not connect directly to live government or DigiLocker/ABC production infrastructure.

---

## Executive Summary

**IDVERA** is a specialized regulatory verification and reconciliation platform designed for AICTE-approved institutions. It provides statutory student data management, automated row-level data validation against statutory rules, temporal pattern-based enrolment reconciliation (TPER), cross-institutional duplicate candidate detection, and role-based verification lookups.

### Key Capabilities

1. **Deterministic Rules Engine (Rules V-01 to V-12)**:
   - Versioned statutory rules (`v1.2.0`) evaluating every record with an immediate single outcome: `ACCEPTED`, `FLAGGED`, or `REJECTED`.
   - Clear explainable findings with observed values and remediation guidance.
   - Comprehensive statutory quota and supernumerary limit checks (TFW, NRI, EWS, Lateral Entry, PMSSS, J&K).
2. **TPER (Temporal Pattern-based Enrolment Reconciliation)**:
   - **Stage A (Keyed Matching)**: High-speed lookups using keyed APAAR hashes.
   - **Stage B (Temporal Interval Overlap)**: Identifies concurrent active enrolments with open-ended or overlapping sessions.
   - **Stage C (Transition Awareness)**: Distinguishes legitimate transfers with verified release dates from uncertain transitions and contradictory chronologies.
   - **Stage D (Heuristic Scoring)**: Bigram name similarity (40 pts), DOB exact matching (35 pts), temporal overlap (15 pts), and programme similarity (10 pts) for students without verified APAAR IDs.
3. **Regulatory Intake Accounting**:
   - Compares reported active enrolments against approved regular intake limits (e.g., NIT Delhi CSE: 128 regular against 120 intake = +8 excess).
   - Non-fungible accounting: Supernumerary seats (TFW, NRI, etc.) are evaluated separately and cannot mask regular quota variances.
4. **Role-Based Access Control (RBAC)**:
   - 6 isolated roles: `Institution Submitter`, `Institution Reviewer`, `AICTE Regulatory Reviewer`, `Verification Officer`, `System Administrator`, and `Auditor`.
   - Strict action-handler level permission enforcement for submissions, adjudications, rule configurations, and verification queries.
5. **Privacy-Preserving Mock Verifier**:
   - Tri-state verification outcome matrix: `VERIFIED`, `NOT_VERIFIED`, and `UNABLE_TO_VERIFY` (for records with pending exceptions).
   - Identifiers and PII are masked (`APAAR-***-XXXX`).
6. **Immutable Audit Trail**:
   - Append-only event ledger tracking all batch submissions, rule changes, human exception adjudications, and verification queries.
7. **In-App Test Bench & Live Benchmark**:
   - 24 automated unit test suites covering 100% of statutory rules, temporal algorithms, and security boundaries.
   - Live benchmark measuring sub-20ms batch processing latency on 225+ student rosters.

---

## Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion, Lucide React
- **Build Tool**: Vite 8
- **State Management**: Centralized typed React Context with synchronized localStorage persistence
- **Validation**: Deterministic multi-stage rules evaluator (`rulesEngine.ts`, `tperEngine.ts`)

---

## Quick Start & Local Development

### Prerequisites
- Node.js (v18+ recommended, tested on Node v25)
- npm (v9+)

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/mahibalavelusamy-ai/SIH26263.git
cd SIH26263

# 2. Install dependencies
npm install

# 3. Type check & verify build
npm run lint
npm run build

# 4. Start local development server
npm run dev
```

Open your browser at **`http://localhost:3000/`**.

---

## Validation Ruleset Reference (V-01 to V-12)

| Rule ID | Rule Name | Severity | Outcome | Description |
| :--- | :--- | :---: | :---: | :--- |
| **V-01** | Missing Required Fields | BLOCKING | REJECTED | Rejects rows lacking essential fields: name, DOB, programme, category, admission date. |
| **V-02** | Missing APAAR ID | WARNING | FLAGGED | Flags rows without APAAR ID without dropping them from enrolment accounting. |
| **V-03** | APAAR Format Mismatch | WARNING | FLAGGED | Flags IDs that deviate from the standard 12-digit numeric pattern. |
| **V-04** | Duplicate APAAR in Single Submission | WARNING | FLAGGED | Flags all affected rows claiming identical APAAR IDs within the same upload. |
| **V-05** | Multiple Active Enrolments | WARNING | FLAGGED | Flags concurrent active enrolments in the same institution or across institutions. |
| **V-06** | Invalid Demographic / Date Values | BLOCKING | REJECTED | Rejects impossible dates, unparseable values, or age at admission outside 14–70 years. |
| **V-07** | Admission Outside Window | WARNING | FLAGGED | Flags admission dates falling outside the regulatory academic intake calendar. |
| **V-08** | Seat Category / Quota Conflict | WARNING | FLAGGED | Flags contradictory quota tagging (e.g. supernumerary marked without subcategory). |
| **V-09** | Approved Regular Intake Excess | WARNING | FLAGGED | Flags programme-level regular enrolment exceeding approved regular intake. |
| **V-10** | Supernumerary Quota Ceiling Excess | WARNING | FLAGGED | Flags enrolments exceeding specific supernumerary limits (TFW, NRI, EWS, etc.). |
| **V-11** | Supernumerary Ineligible Category | WARNING | FLAGGED | Flags supernumerary claims made under ineligible categories (e.g. Management quota). |
| **V-12** | Approved Programme Zero Enrolment | INFO | FLAGGED | Flags approved institutional programmes that report zero student enrolments. |

---

## Automated Test Suites

The prototype includes an in-app **Test Bench** accessible from the navigation sidebar:
- **24 Unit Test Suites (TC-01 through TC-24)** verifying rules V-01 to V-12, TPER temporal logic, transfer transitions, bigram string similarity, RBAC capability isolation, and mock verification outcomes.
- **Repeatable Live Benchmark**: Measures real-time execution duration, anomaly detection recall (100%), and false positive rate (0.0%).

---

## License

This project is licensed under the Apache 2.0 License. Built for the Smart India Hackathon (SIH 2026).
