# IDVERA — Transfer-Aware, Privacy-Preserving Enrolment Reconciliation (TPER)

IDVERA is an institutional student enrolment reconciliation and verification platform for AICTE-approved institutions. It validates institutional submissions against intake capacities, detects cross-institutional duplicate enrolments with temporal awareness, facilitates human exception adjudication, and provides a mock APAAR verification adapter with complete auditability.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Prototype & Demonstration Scope Confirmation**
> - **Regulatory Context**: IDVERA is designed as an SIH prototype demonstration. The application makes no claims of official AICTE adoption, active government API connection, or live APAAR identity verification. A persistent disclaimer banner is rendered across all views.
> - **Privacy-Preserving Abstraction**: In production, keyed HMAC hashing and cross-institution matching reside behind trusted hardware or isolated server-side enclaves. In this client-side prototype, the keyed derivation is implemented as a modular abstraction service with masked identifiers (`APAAR-***-9421`) to protect privacy while demonstrating the multi-stage reconciliation algorithm.
> - **Dual Intake Accounting**: In compliance with technical guidelines, regular intake and supernumerary quotas (EWS, TFW, PMSSS, J&K, NRI) are tracked as separate non-fungible limits. Total enrolment is reported separately.
> - **Role Simulation**: A 6-role switcher simulates the permissions matrix across Institution Submitters, Reviewers, AICTE Regulatory Reviewers, Verification Officers, System Administrators, and Auditors without pseudo-security bypasses.

---

### 1. Overview & Core Concept

- **What It Does**: IDVERA allows technical education institutions to upload, validate, and reconcile student enrolment data against approved AICTE intake quotas. It applies temporal logic to distinguish legitimate academic transfers (e.g., student transferred from College A to College B before new term admission) from suspicious concurrent double enrolments.
- **Target Audience / Personas**:
  - *Institution Submitter / Registrar*: Previews and submits enrolment batches, inspects row-level validation errors, and submits corrected datasets.
  - *Institution Reviewer*: Validates institutional data integrity and reviews flagged records prior to final institutional endorsement.
  - *AICTE Regulatory Reviewer*: Investigates cross-institution duplicate candidates and programme intake quota breaches across regional institutions.
  - *Verification Officer / Employer*: Submits single-student verification requests to confirm enrolled student standing via a mock verifier returning only `VERIFIED`, `NOT VERIFIED`, or `UNABLE TO VERIFY`.
  - *System Administrator*: Configures validation rule parameters, tunes candidate confidence thresholds, and initiates demo resets.
  - *Auditor*: Inspects immutable audit logs capturing every state transition and verification query.
- **Key Value**: Eliminates ghost enrolments, prevents unapproved intake expansion, respects student mobility rights by recognizing valid transfers, and safeguards student privacy through masked identifier matching.

---

### 2. User Experience & Visual Design

#### Key User Flows

1. **Overview & Monitoring**: Global KPI strip (Institutions, Submissions, Processed Rows, Accepted, Flagged, Rejected, Duplicate Candidates, Intake Breaches) coupled with interactive chart breakdowns and filtering by Academic Year, Institution, Programme, and Outcome.
2. **Submission & Ingestion (Institution Portal / Submission Centre)**:
   - Select institution and academic session.
   - Download pre-populated CSV templates or upload user CSV files.
   - Interactive column mapping interface aligning ERP headers to canonical fields.
   - Pre-validation preview: Row-level processing report classifying each record as `ACCEPTED`, `FLAGGED`, or `REJECTED` with specific rule findings.
   - Confirmation step creating an immutable submission snapshot stamped with the active engine version.
3. **TPER Matching & Duplicate Investigation**:
   - Automated 5-stage matching pipeline: Stage A (Keyed Normalization), Stage B (Temporal Overlap Check), Stage C (Transition & Transfer Evaluation), Stage D (Heuristic Confidence Scoring), and Stage E (Human Resolution).
   - Interactive candidate drawer showing side-by-side enrolment cards, timeline overlap visualization, signal contribution breakdown (Name, DOB, Temporal, Programme), and transfer evidence notes.
4. **Exception Review Workspace**:
   - Split-panel adjudication interface: Filterable queue on the left (severity, status, age) and two-record comparison on the right.
   - Adjudication actions: *Mark Legitimate Transfer*, *Mark Not a Match*, *Request Information*, or *Confirm Duplicate (Refer for Correction)*. Mandatory reason capture creating an immutable audit event.
5. **AICTE Intake Reconciliation**:
   - Programme-level quota matrix: Approved Regular Intake vs. Counted Regular Enrolments, Variance Delta, Supernumerary Quota Utilization (TFW, EWS, Lateral Entry), and Open Discrepancy flags.
6. **Mock Verification Centre**:
   - Clean verification form accepting synthetic Student Ref or APAAR ID, Institution, and Academic Year.
   - Minimalist privacy-safe response card with status badge, authoritative verification timestamp, request reference, and reason code.
7. **Rules Engine Configuration**:
   - Interactive inspection of rules V-01 through V-12: severity, blocking behavior, description, remediation guidance, and version history.
   - Rule parameter editing with automatic engine version incrementing and explicit re-validation capabilities.
8. **Test Bench & Synthetic Benchmarking**:
   - Repeatable unit test runner executing test suites for all 12 rules, boundary conditions, transfer edge cases, role permissions, and arithmetic integrity with real live pass/fail outputs.
   - Deterministic synthetic benchmark measuring execution duration (ms), true-positive duplicate detection rate, seeded error recall, and audit integrity.

#### Visual Identity & Theme

- **Palette**: Deep Navy (`#0F172A`, `#1E293B`), Clean White (`#FFFFFF`), Cool Slate Neutral (`#F8FAFC`, `#F1F5F9`, `#E2E8F0`), Muted Blue Accent (`#2563EB`).
- **Semantic Accents**: Teal (`#0D9488` / `#0F766E`) for verified/accepted states; Amber (`#D97706`) for review-required states; Crimson (`#DC2626`) for rejected/blocking intake violations.
- **Typography**: Clean sans-serif hierarchy using `Plus Jakarta Sans` for titles and navigation, `Public Sans`/`DM Sans` for body text, and strictly tabular numerals (`font-mono tabular-nums`) for all counts, identifiers, dates, and metrics.
- **Layout Rhythm**: Fixed collapsible 260px sidebar navigation + single-row top bar with persistent demo disclaimer, breadcrumbs, role selector, and quick action bar + spacious main content canvas.
- **Zero-Slop Discipline**: No decorative pulsing status dots, no pill badge sandwiches on cards, unboxed metadata with `·` separators, and natural editorial labels.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Modular In-Memory Architecture with Browser Storage Persistence**
  - *Chosen Approach*: Maintain a centralized, reactive application state store (holding institutions, programmes, submissions, records, duplicate candidates, audit events, and benchmark results) with automatic synchronization to localStorage and a one-click deterministic seed reset.
  - *Why*: Delivers instantaneous zero-latency filtering, sorting, resubmissions, and rule re-evaluations while preserving state across browser refreshes without requiring a remote database server.
  - *Alternatives Considered*: Pure stateless in-memory (loses data on refresh) or mock API server (adds asynchronous latency and complexity without improving fidelity).
- **Decision 2: Strict Rule Versioning & Historical Invariance**
  - *Chosen Approach*: Submissions lock the exact `ruleVersion` (e.g. `v1.2.0`) present at the moment of validation. Changing a rule creates a new engine version (`v1.3.0`); past submissions retain their historical findings unless the reviewer explicitly invokes "Re-run Validation".
  - *Why*: Mirrors regulatory compliance requirements where audit validity must reflect the rules in effect at submission time.
- **Decision 3: Transparent Heuristic Scoring for Missing APAAR Records**
  - *Chosen Approach*: When APAAR ID is absent or malformed, TPER computes an explainable multi-signal score: Normalized Name Similarity (40 pts), Exact Date of Birth Match (35 pts), Temporal Period Overlap (15 pts), and Programme Similarity (10 pts). Candidates are categorized into High ($\ge 85$), Medium ($60-84$), or Dismissed ($< 60$).
  - *Why*: Explains exactly why an exception was raised, eliminating black-box ambiguity. Disclosed clearly as a deterministic heuristic rather than a fabricated AI probability.
- **Decision 4: Role-Based Action Enforcement at Matrix & Handler Levels**
  - *Chosen Approach*: Permissions are governed by a central capability matrix (`CAN_SUBMIT`, `CAN_APPROVE_INSTITUTION`, `CAN_RESOLVE_CROSS_INSTITUTION`, `CAN_VERIFY`, `CAN_CONFIGURE_RULES`, `CAN_RESET_DATA`). Controls are conditionally hidden or disabled, and action handlers re-check permissions before state mutation.
  - *Why*: Accurately demonstrates enterprise GovTech workflow boundaries while openly displaying a "Demo role simulation" banner.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       IDVERA APPLICATION SHELL                              │
│  ┌───────────────────────┐ ┌─────────────────────────────────────────────┐  │
│  │ Top Bar               │ │ Banner: DEMO ENVIRONMENT · SYNTHETIC DATA    │  │
│  │ Breadcrumbs & Nav     │ │ Role Switcher: [Institution Submitter ▼]     │  │
│  └───────────────────────┘ └─────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────┴──────────────────────────────────────┐
│                            CENTRAL STORE & DISPATCH                         │
│  • Institutions (5)       • Intake Quotas          • Submissions & Snapshots│
│  • Enrolment Records (220)• Duplicate Candidates   • Audit Event Log        │
│  • Active Rule Engine     • Test Bench Manifest    • Verification Records   │
└──────┬───────────────────────────────┬───────────────────────────────┬──────┘
       │                               │                               │
┌──────▼─────────────────────┐ ┌───────▼─────────────────────┐ ┌───────▼──────┐
│  INGESTION & VALIDATION    │ │      TPER MATCHING CORE     │ │ VERIFICATION │
│  • CSV Parser & Normalizer │ │  Stage A: Keyed Derivation  │ │   ADAPTER    │
│  • Column Mapping Engine   │ │  Stage B: Temporal Overlap  │ │ • Clean Query│
│  • Rules Engine (V01-V12)  │ │  Stage C: Transition Logic  │ │ • Masked ID  │
│  • Outcome Classifier      │ │  Stage D: Candidate Scoring │ │ • Audit Log  │
│    (ACCEPTED/FLAGGED/REJ)  │ │  Stage E: Human Adjudication│ │ • 3 Outcomes │
└────────────────────────────┘ └─────────────────────────────┘ └──────────────┘
```

#### Core Data Entities

1. `Institution`: ID, Code, Name, Region, State, Type, Approved Programmes.
2. `Programme`: Code, Name, Department, Duration, Degree Level.
3. `IntakeLimit`: Institution ID, Programme Code, Academic Year, Approved Regular Intake, Supernumerary Quotas (TFW, EWS, Lateral Entry, PMSSS).
4. `StudentEnrolment`: ID, Student Ref, Full Name, DOB, APAAR ID (or null), Institution ID, Programme Code, Academic Year, Admission Date, Enrolment Status (`ACTIVE`, `TRANSFERRED`, `COMPLETED`, `WITHDRAWN`), Seat Category (`OPEN`, `OBC`, `SC`, `ST`, `EWS`, `TFW`, `MANAGEMENT`), Supernumerary Flag, Enrolment End Date, Transfer Status, Transfer Effective Date.
5. `Submission`: ID, Institution ID, Academic Year, Timestamp, Rule Version, Submitted By, Status, Summary Counts, Snapshot of Records.
6. `ValidationFinding`: ID, Record ID, Rule ID, Severity (`BLOCKING`, `WARNING`, `INFO`), Field, Observed Value, Reason, Remediation Guidance.
7. `DuplicateCandidate`: ID, Record A ID, Record B ID, Overlap Interval, Confidence Score, Signal Breakdown, Matched Rule ID, Status (`PENDING_REVIEW`, `LEGITIMATE_TRANSFER`, `NOT_A_MATCH`, `NEEDS_INFO`, `CONFIRMED_DUPLICATE`), Resolution Details.
8. `AuditEvent`: ID, Timestamp, Actor Name, Actor Role, Action, Entity Type, Entity ID, Previous State, New State, Reason, Request Ref.
9. `RuleDefinition`: Rule ID (V-01 to V-12), Name, Description, Severity, Blocking Flag, Enabled, Version, Evaluated Fields, Guidance.
10. `BenchmarkResult`: Execution Timestamp, Dataset Version, Duration MS, Total Processed, Accepted/Flagged/Rejected breakdown, Seeded Anomaly Recall, Intake Breaches Detected, Test Suite Pass Rate.

#### Implemented vs. Simulated Boundaries

- **Implemented in Browser**:
  - Full client-side CSV parser, column mapper, template generator, and exporter.
  - Complete versioned validation engine (V-01 to V-12) with configurable parameters.
  - Multi-stage TPER temporal matching algorithm with name similarity & interval calculations.
  - Split-panel Exception Review adjudication interface with audit trail emission.
  - Intake quota reconciliation engine computing regular variance and supernumerary caps.
  - Mock Verification adapter with strict 3-state output and privacy masking.
  - Interactive test bench with 20+ repeatable test cases and live benchmark telemetry.
- **Explicitly Simulated / Future Backend Boundaries**:
  - Hardware Security Module (HSM) / server-side HMAC secret management.
  - Direct live integration with national identity databases (APAAR / DigiLocker / ABC).
  - Multi-tenant PostgreSQL database with cryptographically signed immutable audit logs.
  - OIDC / Single Sign-On (SSO) with enterprise role-based authorization servers.

---

### Implementation Progression Plan

1. **Step 1: Core Domain Models, Rule Engine, & Deterministic Seed Generator**: Implement typed interfaces, initial rules definitions V-01 to V-12, and a rich 220+ record synthetic dataset covering 5 institutions, multiple academic years, duplicate candidates, transfer edge cases, and intake breaches.
2. **Step 2: State Store & Audit Architecture**: Create the central application store with persistent local storage caching, role capability matrix, audit logging service, and snapshot management.
3. **Step 3: Layout Shell, Role Navigation, & Overview Dashboard**: Build the GovTech enterprise layout with the persistent synthetic disclaimer banner, collapsible navigation for all 12 modules, demo role switcher, and unified reactive KPI dashboard with multi-criteria filtering.
4. **Step 4: Submission Centre & Ingestion Workflow**: Build the CSV template exporter, file upload handler, interactive column mapping screen, row-level validation reporter (`ACCEPTED` / `FLAGGED` / `REJECTED`), resubmission manager, and CSV error report export.
5. **Step 5: TPER Matching & Reconciliation Engine**: Build the 5-stage temporal reconciliation engine with interval overlap logic, transition assessment, deterministic scoring, and detailed candidate diagnostic visualization.
6. **Step 6: Exception Review Workspace**: Implement the split-panel review interface with filtering, side-by-side enrolment inspection, evidence timelines, and role-authorized decision actions with audit event generation.
7. **Step 7: Intake Reconciliation & Verification Centre**: Build the programme-level quota reconciliation table with variance calculations and supernumerary caps, plus the privacy-safe mock verification adapter.
8. **Step 8: Rules Configuration, Architecture Diagram, Test Bench, & Benchmarking**: Implement the rule configuration editor with versioning, interactive architecture flow diagram, 20+ automated unit test bench, and synthetic benchmark runner with deterministic metrics.
9. **Step 9: Verification & Polish**: Verify application compilation, check responsive design, ensure zero dead clicks, and confirm all acceptance criteria are met.
