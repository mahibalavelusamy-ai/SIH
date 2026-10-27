import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StudentEnrolment, RowOutcome, Submission, ValidationFinding } from '../types';
import { processSubmissionBatch, DEFAULT_RULES } from '../services/rulesEngine';
import { maskApaarId } from '../services/tperEngine';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  FileText,
  AlertOctagon,
  Search,
  Filter,
  Eye,
  Edit3,
  History,
  ChevronDown,
  ChevronUp,
  X,
  FileCheck,
} from 'lucide-react';

const CANONICAL_FIELDS = [
  { key: 'studentReference', label: 'Student Reference ID', required: true, example: '2026-NITD-CS-001' },
  { key: 'studentName', label: 'Full Student Name', required: true, example: 'Aarav Sharma' },
  { key: 'dateOfBirth', label: 'Date of Birth (YYYY-MM-DD)', required: true, example: '2005-04-12' },
  { key: 'apaarId', label: 'APAAR ID (12 Numeric Digits)', required: false, example: '910283741001' },
  { key: 'programmeCode', label: 'Programme Code', required: true, example: 'BTECH-CSE' },
  { key: 'admissionDate', label: 'Admission Date (YYYY-MM-DD)', required: true, example: '2026-07-15' },
  { key: 'enrolmentStatus', label: 'Enrolment Status', required: true, example: 'ACTIVE' },
  { key: 'seatCategory', label: 'Seat Category', required: true, example: 'OPEN' },
  { key: 'supernumeraryFlag', label: 'Supernumerary Quota (TRUE/FALSE)', required: false, example: 'FALSE' },
  { key: 'supernumeraryCategory', label: 'Supernumerary Category (TFW/EWS/etc.)', required: false, example: 'TFW' },
  { key: 'enrolmentEndDate', label: 'Enrolment End Date (YYYY-MM-DD)', required: false, example: '2026-06-30' },
  { key: 'transferStatus', label: 'Transfer Status', required: false, example: 'NONE' },
  { key: 'transferEffectiveDate', label: 'Transfer Effective Date (YYYY-MM-DD)', required: false, example: '2026-07-25' },
];

// RFC 4180 compliant CSV parser
function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const parsedGrid: string[][] = [];
  let currentRow = [''];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        currentRow[currentRow.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      currentRow.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      parsedGrid.push(currentRow);
      currentRow = [''];
    } else {
      currentRow[currentRow.length - 1] += c;
    }
  }

  if (currentRow.length > 1 || currentRow[0] !== '') {
    parsedGrid.push(currentRow);
  }

  const cleanRows = parsedGrid.filter((r) => r.some((cell) => cell.trim() !== ''));
  if (cleanRows.length < 1) return { headers: [], rows: [] };

  const headers = cleanRows[0].map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const rows = cleanRows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] !== undefined ? r[idx].trim().replace(/^["']|["']$/g, '') : '';
    });
    return obj;
  });

  return { headers, rows };
}

export const SubmissionCentreView: React.FC = () => {
  const {
    institutions,
    selectedInstitutionId,
    setSelectedInstitutionId,
    selectedAcademicYear,
    setSelectedAcademicYear,
    programmes,
    intakeLimits,
    rules,
    ruleVersion,
    role,
    permissions,
    addSubmission,
    submissions,
  } = useApp();

  // Top Section Mode: 'INGEST' | 'RESUBMIT' | 'HISTORY'
  const [centreMode, setCentreMode] = useState<'INGEST' | 'RESUBMIT' | 'HISTORY'>('INGEST');

  // Ingestion workflow stages: 'SOURCE' | 'MAPPING' | 'PREVIEW' | 'COMPLETE'
  const [stage, setStage] = useState<'SOURCE' | 'MAPPING' | 'PREVIEW' | 'COMPLETE'>('SOURCE');

  // Uploaded file metadata
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSizeKB, setUploadedFileSizeKB] = useState<number>(0);
  const [rawParsedRows, setRawParsedRows] = useState<Record<string, string>[]>([]);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Processed preview records and summary
  const [previewRecords, setPreviewRecords] = useState<StudentEnrolment[]>([]);
  const [validatedSummary, setValidatedSummary] = useState<{
    total: number;
    accepted: number;
    flagged: number;
    rejected: number;
  }>({ total: 0, accepted: 0, flagged: 0, rejected: 0 });

  // Filtering in Preview
  const [previewOutcomeFilter, setPreviewOutcomeFilter] = useState<'ALL' | 'ACCEPTED' | 'FLAGGED' | 'REJECTED'>('ALL');
  const [previewSearchTerm, setPreviewSearchTerm] = useState<string>('');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  // Completed submission ID
  const [completedSubId, setCompletedSubId] = useState<string>('');

  // Resubmission workflow state
  const [selectedSubmissionForCorrection, setSelectedSubmissionForCorrection] = useState<string>('');
  const [editableCorrectionRecords, setEditableCorrectionRecords] = useState<StudentEnrolment[]>([]);
  const [resubmissionSuccessMessage, setResubmissionSuccessMessage] = useState<string>('');

  // Snapshot Inspection Modal
  const [inspectingSubmission, setInspectingSubmission] = useState<Submission | null>(null);

  const currentInstitution = institutions.find((i) => i.id === selectedInstitutionId) || institutions[0];
  const instSubmissions = submissions.filter((s) => s.institutionId === selectedInstitutionId);

  // Check if all required fields are mapped
  const missingRequiredFields = useMemo(() => {
    return CANONICAL_FIELDS.filter((f) => f.required && !columnMapping[f.key]);
  }, [columnMapping]);

  // Downloadable Canonical CSV Template
  const handleDownloadTemplate = () => {
    const headers = CANONICAL_FIELDS.map((f) => f.key);
    const sampleRow1 = [
      '2026-NITD-CS-001',
      'Aarav Sharma',
      '2005-04-12',
      '910283741001',
      'BTECH-CSE',
      '2026-07-15',
      'ACTIVE',
      'OPEN',
      'FALSE',
      '',
      '',
      'NONE',
      '',
    ];
    const sampleRow2 = [
      '2026-NITD-TFW-01',
      'Ishaan Verma',
      '2005-03-20',
      '910283742001',
      'BTECH-CSE',
      '2026-07-18',
      'ACTIVE',
      'TFW',
      'TRUE',
      'TFW',
      '',
      'NONE',
      '',
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), sampleRow1.join(','), sampleRow2.join(',')].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IDVERA_Student_Enrolment_Template_${selectedAcademicYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pre-configured Synthetic Batch Loader
  const handleLoadSyntheticBatch = (presetType: 'MIXED_QUALITY' | 'CLEAN_APPROVED' | 'TRANSFER_SCENARIOS') => {
    let rows: Record<string, string>[] = [];

    if (presetType === 'MIXED_QUALITY') {
      rows = [
        {
          studentReference: '2026-NITD-CS-501',
          studentName: 'Vikramaditya Rao',
          dateOfBirth: '2005-02-14',
          apaarId: '910283745001',
          programmeCode: 'BTECH-CSE',
          admissionDate: '2026-07-20',
          enrolmentStatus: 'ACTIVE',
          seatCategory: 'OPEN',
          supernumeraryFlag: 'FALSE',
          supernumeraryCategory: '',
          enrolmentEndDate: '',
          transferStatus: 'NONE',
          transferEffectiveDate: '',
        },
        {
          studentReference: '2026-NITD-CS-502',
          studentName: 'Divya Nambiar',
          dateOfBirth: '2005-08-19',
          apaarId: '', // V-02 Missing APAAR
          programmeCode: 'BTECH-CSE',
          admissionDate: '2026-07-22',
          enrolmentStatus: 'ACTIVE',
          seatCategory: 'OBC',
          supernumeraryFlag: 'FALSE',
          supernumeraryCategory: '',
          enrolmentEndDate: '',
          transferStatus: 'NONE',
          transferEffectiveDate: '',
        },
        {
          studentReference: '2026-NITD-CS-503',
          studentName: 'Saurabh Sen',
          dateOfBirth: '2005-06-11',
          apaarId: 'APAAR-BAD-99', // V-03 APAAR format mismatch
          programmeCode: 'BTECH-CSE',
          admissionDate: '2026-07-25',
          enrolmentStatus: 'ACTIVE',
          seatCategory: 'SC',
          supernumeraryFlag: 'FALSE',
          supernumeraryCategory: '',
          enrolmentEndDate: '',
          transferStatus: 'NONE',
          transferEffectiveDate: '',
        },
        {
          studentReference: '2026-NITD-CS-504',
          studentName: '', // V-01 Missing mandatory name -> REJECTED
          dateOfBirth: '2005-05-05',
          apaarId: '910283745004',
          programmeCode: 'BTECH-CSE',
          admissionDate: '2026-07-26',
          enrolmentStatus: 'ACTIVE',
          seatCategory: 'OPEN',
          supernumeraryFlag: 'FALSE',
          supernumeraryCategory: '',
          enrolmentEndDate: '',
          transferStatus: 'NONE',
          transferEffectiveDate: '',
        },
        {
          studentReference: '2026-NITD-CS-505',
          studentName: 'Ritika Roy',
          dateOfBirth: '2022-01-01', // V-06 Age violation -> REJECTED
          apaarId: '910283745005',
          programmeCode: 'BTECH-CSE',
          admissionDate: '2026-07-28',
          enrolmentStatus: 'ACTIVE',
          seatCategory: 'OPEN',
          supernumeraryFlag: 'FALSE',
          supernumeraryCategory: '',
          enrolmentEndDate: '',
          transferStatus: 'NONE',
          transferEffectiveDate: '',
        },
        {
          studentReference: '2026-NITD-CS-506',
          studentName: 'Kunal Deshmukh',
          dateOfBirth: '2005-03-10',
          apaarId: '910283745006',
          programmeCode: 'BTECH-CSE',
          admissionDate: '2026-02-15', // V-07 Outside admission window
          enrolmentStatus: 'ACTIVE',
          seatCategory: 'OPEN',
          supernumeraryFlag: 'FALSE',
          supernumeraryCategory: '',
          enrolmentEndDate: '',
          transferStatus: 'NONE',
          transferEffectiveDate: '',
        },
      ];
      setUploadedFileName('Synthetic_Mixed_Quality_Batch.csv');
    } else {
      rows = [
        {
          studentReference: '2026-NITD-EC-601',
          studentName: 'Ananya Deshmukh',
          dateOfBirth: '2005-01-19',
          apaarId: '910283746001',
          programmeCode: 'BTECH-ECE',
          admissionDate: '2026-07-14',
          enrolmentStatus: 'ACTIVE',
          seatCategory: 'OPEN',
          supernumeraryFlag: 'FALSE',
          supernumeraryCategory: '',
          enrolmentEndDate: '',
          transferStatus: 'NONE',
          transferEffectiveDate: '',
        },
        {
          studentReference: '2026-NITD-EC-602',
          studentName: 'Pranav Iyer',
          dateOfBirth: '2005-07-22',
          apaarId: '910283746002',
          programmeCode: 'BTECH-ECE',
          admissionDate: '2026-07-16',
          enrolmentStatus: 'ACTIVE',
          seatCategory: 'OBC',
          supernumeraryFlag: 'FALSE',
          supernumeraryCategory: '',
          enrolmentEndDate: '',
          transferStatus: 'NONE',
          transferEffectiveDate: '',
        },
      ];
      setUploadedFileName('Synthetic_Approved_Batch.csv');
    }

    setUploadedFileSizeKB(1.8);
    const headers = Object.keys(rows[0]);
    setDetectedHeaders(headers);
    setRawParsedRows(rows);

    // Default 1:1 mapping
    const mapping: Record<string, string> = {};
    headers.forEach((h) => {
      mapping[h] = h;
    });
    setColumnMapping(mapping);
    setStage('MAPPING');
  };

  // CSV File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Unsupported file format. IDVERA strictly requires standard CSV format. (Note: XLSX is not supported).');
      return;
    }

    setUploadedFileName(file.name);
    setUploadedFileSizeKB(Number((file.size / 1024).toFixed(1)));

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const { headers, rows } = parseCSV(text);
      if (headers.length === 0 || rows.length === 0) {
        alert('Invalid or empty CSV. Please ensure the file has a header row and data rows.');
        return;
      }

      setDetectedHeaders(headers);
      setRawParsedRows(rows);

      // Heuristic auto-mapping
      const mapping: Record<string, string> = {};
      headers.forEach((h) => {
        const cleanHeader = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        const match = CANONICAL_FIELDS.find((c) => {
          const cleanCanonical = c.key.toLowerCase().replace(/[^a-z0-9]/g, '');
          return cleanCanonical === cleanHeader || cleanHeader.includes(cleanCanonical);
        });
        if (match) {
          mapping[match.key] = h;
        }
      });
      setColumnMapping(mapping);
      setStage('MAPPING');
    };
    reader.readAsText(file);
  };

  // Auto-map all columns helper
  const handleAutoMap = () => {
    const mapping: Record<string, string> = { ...columnMapping };
    CANONICAL_FIELDS.forEach((f) => {
      if (!mapping[f.key]) {
        const found = detectedHeaders.find((h) =>
          h.toLowerCase().includes(f.key.toLowerCase()) || f.key.toLowerCase().includes(h.toLowerCase())
        );
        if (found) mapping[f.key] = found;
      }
    });
    setColumnMapping(mapping);
  };

  // Move from Mapping to Preview
  const handleProceedToPreview = () => {
    if (missingRequiredFields.length > 0) {
      alert(`Required fields missing in mapping: ${missingRequiredFields.map((f) => f.label).join(', ')}`);
      return;
    }

    // Convert raw rows to StudentEnrolment
    const records: StudentEnrolment[] = rawParsedRows.map((raw, idx) => {
      const getVal = (canonicalKey: string): string => {
        const header = columnMapping[canonicalKey];
        return header && raw[header] !== undefined ? raw[header].trim() : '';
      };

      const superFlagVal = getVal('supernumeraryFlag').toUpperCase();
      const isSuper = superFlagVal === 'TRUE' || superFlagVal === '1' || superFlagVal === 'YES';

      return {
        id: `row-${Date.now().toString().slice(-4)}-${idx + 1}`,
        institutionId: selectedInstitutionId,
        academicYear: selectedAcademicYear,
        programmeCode: getVal('programmeCode') || 'BTECH-CSE',
        studentReference: getVal('studentReference') || `TEMP-REF-${idx + 1}`,
        studentName: getVal('studentName'),
        dateOfBirth: getVal('dateOfBirth'),
        apaarId: getVal('apaarId') || null,
        admissionDate: getVal('admissionDate'),
        enrolmentStatus: (getVal('enrolmentStatus') as any) || 'ACTIVE',
        seatCategory: (getVal('seatCategory') as any) || 'OPEN',
        supernumeraryFlag: isSuper,
        supernumeraryCategory: (getVal('supernumeraryCategory') as any) || null,
        enrolmentEndDate: getVal('enrolmentEndDate') || null,
        transferStatus: (getVal('transferStatus') as any) || 'NONE',
        transferEffectiveDate: getVal('transferEffectiveDate') || null,
      };
    });

    // Run rules engine
    const { processedRecords, summary } = processSubmissionBatch(records, rules, intakeLimits);
    setPreviewRecords(processedRecords);
    setValidatedSummary(summary);
    setStage('PREVIEW');
  };

  // Commit Submission to State
  const handleCommitSubmission = () => {
    if (!permissions.canSubmitData && role !== 'SYSTEM_ADMIN') {
      alert(`Role ${role} is unauthorized to commit institutional submissions. Switch to Institution Submitter.`);
      return;
    }

    const res = addSubmission(
      selectedInstitutionId,
      selectedAcademicYear,
      `${currentInstitution.name} Registrar`,
      previewRecords,
      false
    );

    setCompletedSubId(res.submissionId);
    setStage('COMPLETE');
  };

  // CSV Error Report Export
  const handleExportErrorReport = () => {
    const errorRows: string[] = [
      'RowIndex,StudentReference,StudentName,RuleID,Severity,AffectedFields,ObservedValue,Reason,RemediationGuidance',
    ];

    previewRecords.forEach((rec, idx) => {
      if (rec.findings && rec.findings.length > 0) {
        rec.findings.forEach((f) => {
          errorRows.push(
            `"${idx + 1}","${rec.studentReference}","${rec.studentName}","${f.ruleId}","${f.severity}","${f.fields.join(
              ';'
            )}","${f.observedValue.replace(/"/g, '""')}","${f.reason.replace(/"/g, '""')}","${f.remediationGuidance.replace(
              /"/g,
              '""'
            )}"`
          );
        });
      }
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + errorRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IDVERA_Validation_Errors_${selectedInstitutionId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered preview records
  const filteredPreview = useMemo(() => {
    return previewRecords.filter((rec) => {
      const matchOutcome = previewOutcomeFilter === 'ALL' || rec.rowOutcome === previewOutcomeFilter;
      const matchSearch =
        previewSearchTerm === '' ||
        rec.studentReference.toLowerCase().includes(previewSearchTerm.toLowerCase()) ||
        rec.studentName.toLowerCase().includes(previewSearchTerm.toLowerCase()) ||
        (rec.apaarId && rec.apaarId.includes(previewSearchTerm)) ||
        rec.programmeCode.toLowerCase().includes(previewSearchTerm.toLowerCase());
      return matchOutcome && matchSearch;
    });
  }, [previewRecords, previewOutcomeFilter, previewSearchTerm]);

  // Load prior submission for correction
  const handleSelectSubmissionForCorrection = (subId: string) => {
    setSelectedSubmissionForCorrection(subId);
    const sub = submissions.find((s) => s.id === subId);
    if (!sub) return;

    // Load only flagged or rejected rows for inline editing
    const invalidRows = sub.records.filter((r) => r.rowOutcome !== 'ACCEPTED');
    setEditableCorrectionRecords(JSON.parse(JSON.stringify(invalidRows)));
  };

  // Inline edit handler for correction rows
  const handleCorrectionFieldChange = (recordId: string, field: keyof StudentEnrolment, value: any) => {
    setEditableCorrectionRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, [field]: value } : r))
    );
  };

  // Submit corrected records
  const handleSubmitCorrection = () => {
    if (!selectedSubmissionForCorrection) return;
    const targetSub = submissions.find((s) => s.id === selectedSubmissionForCorrection);
    if (!targetSub) return;

    // Merge clean rows from target submission with corrected rows
    const cleanRows = targetSub.records.filter((r) => r.rowOutcome === 'ACCEPTED');
    const mergedRecords = [...cleanRows, ...editableCorrectionRecords];

    const res = addSubmission(
      targetSub.institutionId,
      targetSub.academicYear,
      `${currentInstitution.name} Correction Officer`,
      mergedRecords,
      true,
      selectedSubmissionForCorrection
    );

    setResubmissionSuccessMessage(
      `Successfully filed corrected submission ${res.submissionId}! Supersedes ${selectedSubmissionForCorrection}. ${res.accepted} Accepted, ${res.flagged} Flagged, ${res.rejected} Rejected.`
    );
    setSelectedSubmissionForCorrection('');
    setEditableCorrectionRecords([]);
    setTimeout(() => setResubmissionSuccessMessage(''), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Header and Sub-Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Submission Centre</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Stage, validate, and submit institutional student rosters against rules V-01 through V-12 and engine {ruleVersion}.
          </p>
        </div>

        {/* 3 Main Modes: Ingest, Resubmit, History */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setCentreMode('INGEST')}
            className={`px-3 py-1.5 rounded transition-colors ${
              centreMode === 'INGEST' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            New Ingestion Batch
          </button>
          <button
            onClick={() => setCentreMode('RESUBMIT')}
            className={`px-3 py-1.5 rounded transition-colors ${
              centreMode === 'RESUBMIT' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Correct & Resubmit
          </button>
          <button
            onClick={() => setCentreMode('HISTORY')}
            className={`px-3 py-1.5 rounded transition-colors ${
              centreMode === 'HISTORY' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Filing History ({instSubmissions.length})
          </button>
        </div>
      </div>

      {/* Role permission banner */}
      {!permissions.canSubmitData && role !== 'SYSTEM_ADMIN' && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Demo Role Simulation Notice:</strong> Current role is <code>{role}</code>. Committing submissions or resubmissions is disabled for this role. Switch to <code>Institution Submitter</code> in the top bar to commit filings.
          </span>
        </div>
      )}

      {/* MODE 1: INGESTION WORKFLOW */}
      {centreMode === 'INGEST' && (
        <div className="space-y-6">
          {/* Workflow Stepper Bar */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded font-bold ${
                  stage === 'SOURCE'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                1. Source Selection
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span
                className={`px-2.5 py-1 rounded font-bold ${
                  stage === 'MAPPING'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                2. ERP Column Mapping
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span
                className={`px-2.5 py-1 rounded font-bold ${
                  stage === 'PREVIEW'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                3. Pre-Validation Preview
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span
                className={`px-2.5 py-1 rounded font-bold ${
                  stage === 'COMPLETE'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                4. Ingestion Stamped
              </span>
            </div>

            {stage !== 'SOURCE' && stage !== 'COMPLETE' && (
              <button
                onClick={() => setStage('SOURCE')}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-sans"
              >
                <RotateCcw className="w-3 h-3" /> Restart Wizard
              </button>
            )}
          </div>

          {/* STAGE: SOURCE SELECTION */}
          {stage === 'SOURCE' && (
            <div className="space-y-6">
              {/* Institution and Session Selection */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Submitting Institution *</label>
                  <select
                    value={selectedInstitutionId}
                    onChange={(e) => setSelectedInstitutionId(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    {institutions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.code} — {i.name} ({i.state})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Academic Session *</label>
                  <select
                    value={selectedAcademicYear}
                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="2026-27">AY 2026-27 (Current Cycle)</option>
                    <option value="2025-26">AY 2025-26 (Prior Cycle)</option>
                  </select>
                </div>
              </div>

              {/* Ingestion Cards: Synthetic Presets vs Local File Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Synthetic Preset Loader */}
                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                      <h3 className="text-sm font-semibold text-slate-900">Synthetic Demonstration Batches</h3>
                    </div>
                    <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                      Load deterministically pre-configured test batches simulating diverse regulatory compliance conditions:
                    </p>

                    <div className="mt-4 space-y-2">
                      <button
                        onClick={() => handleLoadSyntheticBatch('MIXED_QUALITY')}
                        className="w-full text-left p-3 rounded border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/40 transition-colors"
                      >
                        <div className="text-xs font-bold text-slate-900">Mixed Quality Batch (6 Rows)</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Contains deliberate test cases: 2 Accepted, 2 Flagged (V-02, V-03), 2 Rejected (V-01, V-06).
                        </div>
                      </button>

                      <button
                        onClick={() => handleLoadSyntheticBatch('CLEAN_APPROVED')}
                        className="w-full text-left p-3 rounded border border-slate-200 hover:border-teal-400 bg-slate-50 hover:bg-teal-50/40 transition-colors"
                      >
                        <div className="text-xs font-bold text-slate-900">Clean Compliant Batch (2 Rows)</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Fully compliant enrolments with valid APAARs passing all row-level rules.
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <button
                      onClick={handleDownloadTemplate}
                      className="w-full py-2 px-3 border border-slate-300 hover:bg-slate-50 rounded text-xs font-medium text-slate-700 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Canonical CSV Template
                    </button>
                  </div>
                </div>

                {/* Upload Local CSV File */}
                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <UploadCloud className="w-4 h-4 text-slate-600" />
                      <h3 className="text-sm font-semibold text-slate-900">Upload Institutional ERP CSV</h3>
                    </div>

                    <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                      Select or drag-and-drop a CSV file exported from your campus ERP or student information system.
                    </p>

                    <div className="mt-4 p-8 border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-lg text-center transition-colors bg-slate-50/50">
                      <input
                        type="file"
                        accept=".csv"
                        id="csvFileInput"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label htmlFor="csvFileInput" className="cursor-pointer block space-y-2">
                        <UploadCloud className="w-8 h-8 text-blue-600 mx-auto" />
                        <span className="text-xs font-bold text-slate-900 block">
                          Click to browse or drop CSV file
                        </span>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          Comma-Separated Values (.csv) only
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded text-[11px] text-slate-500 border border-slate-200">
                    <strong>Format Support:</strong> RFC 4180 CSV standard. Quoted text with commas is preserved. Excel XLSX is unsupported.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STAGE: ERP COLUMN MAPPING */}
          {stage === 'MAPPING' && (
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">ERP Column Alignment & Header Mapping</h2>
                  <p className="text-xs text-slate-500">
                    Align your source columns ({rawParsedRows.length} rows in <code>{uploadedFileName}</code>) to canonical regulatory fields.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAutoMap}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded"
                  >
                    Auto-Align Headers
                  </button>
                  <button
                    onClick={() => setStage('SOURCE')}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Missing Required Warning Banner */}
              {missingRequiredFields.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-md space-y-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Mandatory Field Mapping Requirement:
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    The following required canonical fields are currently unmapped:{' '}
                    <strong>{missingRequiredFields.map((f) => f.label).join(', ')}</strong>. Map these columns to continue.
                  </p>
                </div>
              )}

              {/* Column Mapping Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Canonical AICTE Field</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Source ERP Column Header</th>
                      <th className="py-2.5 px-3">Detected Sample Value (Row 1)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {CANONICAL_FIELDS.map((canon) => {
                      const mappedHeader = columnMapping[canon.key];
                      const sampleVal =
                        mappedHeader && rawParsedRows[0] && rawParsedRows[0][mappedHeader] !== undefined
                          ? rawParsedRows[0][mappedHeader]
                          : '—';

                      return (
                        <tr key={canon.key} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-900">{canon.label}</span>
                            <span className="block font-mono text-[10px] text-slate-400">{canon.key}</span>
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {canon.required ? (
                              <span className="font-mono text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                                REQUIRED *
                              </span>
                            ) : (
                              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                Optional
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3">
                            <select
                              value={mappedHeader || ''}
                              onChange={(e) =>
                                setColumnMapping((prev) => ({ ...prev, [canon.key]: e.target.value }))
                              }
                              className={`text-xs border rounded px-2.5 py-1.5 w-full max-w-[220px] focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                canon.required && !mappedHeader
                                  ? 'border-red-300 bg-red-50/30'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              <option value="">— Unmapped —</option>
                              {detectedHeaders.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="py-2.5 px-3 font-mono text-slate-700 text-[11px] truncate max-w-[200px]">
                            {sampleVal}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setStage('SOURCE')}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Back to Source
                </button>

                <button
                  onClick={handleProceedToPreview}
                  disabled={missingRequiredFields.length > 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5"
                >
                  Execute Pre-Validation Rules <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STAGE: PRE-VALIDATION PREVIEW */}
          {stage === 'PREVIEW' && (
            <div className="space-y-6">
              {/* Row Classification Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-medium text-slate-500 uppercase">Rows Evaluated</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{validatedSummary.total}</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-teal-200 bg-teal-50/20 shadow-xs">
                  <span className="text-[11px] font-medium text-teal-700 uppercase">Accepted (Certified)</span>
                  <div className="text-xl font-bold font-mono text-teal-800 mt-0.5">{validatedSummary.accepted}</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-amber-200 bg-amber-50/20 shadow-xs">
                  <span className="text-[11px] font-medium text-amber-700 uppercase">Flagged (Under Review)</span>
                  <div className="text-xl font-bold font-mono text-amber-800 mt-0.5">{validatedSummary.flagged}</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-red-200 bg-red-50/20 shadow-xs">
                  <span className="text-[11px] font-medium text-red-700 uppercase">Rejected (Quality Failure)</span>
                  <div className="text-xl font-bold font-mono text-red-800 mt-0.5">{validatedSummary.rejected}</div>
                </div>
              </div>

              {/* Main Pre-Validation Table Card */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                {/* Table Toolbar */}
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Pre-Validation Ingestion Preview</h2>
                    <p className="text-xs text-slate-500">
                      Rule Engine: <strong className="font-mono text-slate-700">{ruleVersion}</strong> · Staged File: <code>{uploadedFileName}</code>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={previewSearchTerm}
                        onChange={(e) => setPreviewSearchTerm(e.target.value)}
                        placeholder="Search student, ref..."
                        className="text-xs bg-white border border-slate-300 rounded pl-8 pr-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Filter outcome */}
                    <select
                      value={previewOutcomeFilter}
                      onChange={(e) => setPreviewOutcomeFilter(e.target.value as any)}
                      className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-medium"
                    >
                      <option value="ALL">All Outcomes ({previewRecords.length})</option>
                      <option value="ACCEPTED">Accepted ({validatedSummary.accepted})</option>
                      <option value="FLAGGED">Flagged ({validatedSummary.flagged})</option>
                      <option value="REJECTED">Rejected ({validatedSummary.rejected})</option>
                    </select>

                    {/* Export Error Report */}
                    {(validatedSummary.flagged > 0 || validatedSummary.rejected > 0) && (
                      <button
                        onClick={handleExportErrorReport}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-medium transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Export Error Report (CSV)
                      </button>
                    )}

                    {/* Commit Ingestion Button */}
                    <button
                      onClick={handleCommitSubmission}
                      disabled={!permissions.canSubmitData && role !== 'SYSTEM_ADMIN'}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded text-xs font-medium transition-colors shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Commit Ingestion Batch
                    </button>
                  </div>
                </div>

                {/* Rows Table */}
                <div className="overflow-x-auto max-h-[460px]">
                  <table className="w-full text-left text-xs divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Initial Outcome</th>
                        <th className="py-2.5 px-3">Student Ref</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">DOB</th>
                        <th className="py-2.5 px-3">APAAR ID</th>
                        <th className="py-2.5 px-3">Programme</th>
                        <th className="py-2.5 px-3">Seat Category</th>
                        <th className="py-2.5 px-3">Diagnostic Findings</th>
                        <th className="py-2.5 px-3 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPreview.map((rec, index) => {
                        const isAccepted = rec.rowOutcome === 'ACCEPTED';
                        const isFlagged = rec.rowOutcome === 'FLAGGED';
                        const isRejected = rec.rowOutcome === 'REJECTED';
                        const isExpanded = expandedRecordId === rec.id;

                        return (
                          <React.Fragment key={rec.id}>
                            <tr
                              className={`transition-colors ${
                                isRejected
                                  ? 'bg-red-50/25 hover:bg-red-50/40'
                                  : isFlagged
                                  ? 'bg-amber-50/20 hover:bg-amber-50/35'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">{index + 1}</td>

                              <td className="py-2.5 px-3 whitespace-nowrap">
                                {isAccepted && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                                    <CheckCircle2 className="w-3 h-3 text-teal-600" /> ACCEPTED
                                  </span>
                                )}
                                {isFlagged && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" /> FLAGGED
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                                    <XCircle className="w-3 h-3 text-red-600" /> REJECTED
                                  </span>
                                )}
                              </td>

                              <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                                {rec.studentReference}
                              </td>

                              <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                                {rec.studentName || <span className="text-red-500 italic">BLANK NAME</span>}
                              </td>

                              <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                                {rec.dateOfBirth || '—'}
                              </td>

                              <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                                {maskApaarId(rec.apaarId)}
                              </td>

                              <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                                {rec.programmeCode}
                              </td>

                              <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                {rec.seatCategory} {rec.supernumeraryFlag ? '(Super)' : ''}
                              </td>

                              <td className="py-2.5 px-3 text-[11px] max-w-[240px]">
                                {rec.findings && rec.findings.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {rec.findings.map((f) => (
                                      <span
                                        key={f.id}
                                        className={`font-mono text-[10px] px-1.5 py-0.2 rounded border ${
                                          f.severity === 'BLOCKING'
                                            ? 'bg-red-100 text-red-800 border-red-300'
                                            : 'bg-amber-100 text-amber-800 border-amber-300'
                                        }`}
                                      >
                                        {f.ruleId}
                                      </span>
                                    ))}
                                    <span className="text-slate-600 text-[10px] truncate max-w-[140px]">
                                      {rec.findings[0].reason}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-teal-700">✓ All checks passed</span>
                                )}
                              </td>

                              <td className="py-2.5 px-3 text-right">
                                {rec.findings && rec.findings.length > 0 && (
                                  <button
                                    onClick={() => setExpandedRecordId(isExpanded ? null : rec.id)}
                                    className="p-1 hover:bg-slate-200 rounded text-slate-500"
                                    title="Toggle finding diagnostics"
                                  >
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </td>
                            </tr>

                            {/* Expanded Finding Detail Row */}
                            {isExpanded && rec.findings && rec.findings.length > 0 && (
                              <tr className="bg-slate-100/70 border-t border-b border-slate-200">
                                <td colSpan={10} className="p-3">
                                  <div className="space-y-2">
                                    <span className="font-bold text-xs text-slate-800 block">
                                      Statutory Findings for {rec.studentReference} ({rec.studentName || 'Unnamed'}):
                                    </span>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {rec.findings.map((f) => (
                                        <div key={f.id} className="p-2.5 bg-white rounded border border-slate-200 text-xs space-y-1">
                                          <div className="flex items-center justify-between">
                                            <span className="font-mono font-bold text-slate-900">{f.ruleId}</span>
                                            <span
                                              className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                                f.severity === 'BLOCKING' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                                              }`}
                                            >
                                              {f.severity}
                                            </span>
                                          </div>
                                          <div className="text-slate-700 text-[11px]">{f.reason}</div>
                                          <div className="text-[10px] text-slate-500 font-mono">
                                            Observed Value: <code>{f.observedValue}</code>
                                          </div>
                                          <div className="p-1.5 bg-slate-50 rounded text-[10px] text-slate-600">
                                            <strong>Remediation:</strong> {f.remediationGuidance}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STAGE: COMPLETED */}
          {stage === 'COMPLETE' && (
            <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-xs max-w-lg mx-auto text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <h2 className="text-lg font-bold text-slate-900">Submission Batch Certified & Archived</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Submission reference <code className="font-bold text-slate-900">{completedSubId}</code> has been ingested under active rule engine <code>{ruleVersion}</code>. All original rows are archived in state.
              </p>

              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded border border-slate-200 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">Accepted</span>
                  <strong className="text-teal-700">{validatedSummary.accepted}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Flagged</span>
                  <strong className="text-amber-700">{validatedSummary.flagged}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Rejected</span>
                  <strong className="text-red-700">{validatedSummary.rejected}</strong>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => {
                    setStage('SOURCE');
                    setPreviewRecords([]);
                    setRawParsedRows([]);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                >
                  Upload Another Batch
                </button>
                <button
                  onClick={() => setCentreMode('HISTORY')}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-medium"
                >
                  View in History
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: CORRECT & RESUBMIT WORKFLOW */}
      {centreMode === 'RESUBMIT' && (
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Institutional Correction & Resubmission Workspace</h2>
              <p className="text-xs text-slate-500">
                Fix non-compliant or rejected student records from a previous submission without deleting the historical audit record.
              </p>
            </div>
          </div>

          {resubmissionSuccessMessage && (
            <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{resubmissionSuccessMessage}</span>
            </div>
          )}

          {/* Prior Submission Selector */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <label className="block text-xs font-semibold text-slate-800">
              Select Prior Filing Requiring Correction:
            </label>
            <select
              value={selectedSubmissionForCorrection}
              onChange={(e) => handleSelectSubmissionForCorrection(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-2 font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">— Select prior filing from {currentInstitution.name} —</option>
              {instSubmissions.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.id} (Status: {sub.status}, Rejected: {sub.rejectedRows}, Flagged: {sub.flaggedRows}, Total: {sub.totalRows})
                </option>
              ))}
            </select>
          </div>

          {/* Editable Grid for Failed Rows */}
          {editableCorrectionRecords.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Editable Exception Roster ({editableCorrectionRecords.length} records requiring remediation):
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Modify fields inline and click 'File Corrected Resubmission'
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Student Ref</th>
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-3">Date of Birth</th>
                      <th className="py-2 px-3">APAAR ID</th>
                      <th className="py-2 px-3">Programme</th>
                      <th className="py-2 px-3">Seat Category</th>
                      <th className="py-2 px-3">Prior Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {editableCorrectionRecords.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 font-mono text-slate-800 font-semibold">{row.studentReference}</td>

                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.studentName}
                            onChange={(e) => handleCorrectionFieldChange(row.id, 'studentName', e.target.value)}
                            placeholder="Enter valid name"
                            className="text-xs bg-white border border-slate-300 rounded px-2 py-1 w-full min-w-[130px]"
                          />
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.dateOfBirth}
                            onChange={(e) => handleCorrectionFieldChange(row.id, 'dateOfBirth', e.target.value)}
                            placeholder="YYYY-MM-DD"
                            className="text-xs font-mono bg-white border border-slate-300 rounded px-2 py-1 w-full min-w-[110px]"
                          />
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.apaarId || ''}
                            onChange={(e) => handleCorrectionFieldChange(row.id, 'apaarId', e.target.value)}
                            placeholder="12 digit numeric"
                            className="text-xs font-mono bg-white border border-slate-300 rounded px-2 py-1 w-full min-w-[120px]"
                          />
                        </td>

                        <td className="py-2 px-3">
                          <select
                            value={row.programmeCode}
                            onChange={(e) => handleCorrectionFieldChange(row.id, 'programmeCode', e.target.value)}
                            className="text-xs bg-white border border-slate-300 rounded px-2 py-1"
                          >
                            {programmes.map((p) => (
                              <option key={p.code} value={p.code}>
                                {p.code}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-2 px-3">
                          <select
                            value={row.seatCategory}
                            onChange={(e) => handleCorrectionFieldChange(row.id, 'seatCategory', e.target.value as any)}
                            className="text-xs bg-white border border-slate-300 rounded px-2 py-1"
                          >
                            <option value="OPEN">OPEN</option>
                            <option value="OBC">OBC</option>
                            <option value="SC">SC</option>
                            <option value="ST">ST</option>
                            <option value="EWS">EWS</option>
                            <option value="TFW">TFW</option>
                          </select>
                        </td>

                        <td className="py-2 px-3">
                          <span
                            className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              row.rowOutcome === 'REJECTED'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {row.rowOutcome}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={handleSubmitCorrection}
                  disabled={!permissions.canSubmitData && role !== 'SYSTEM_ADMIN'}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded text-xs font-medium transition-colors shadow-xs"
                >
                  File Corrected Resubmission Batch
                </button>
              </div>
            </div>
          ) : selectedSubmissionForCorrection ? (
            <div className="p-8 text-center text-xs text-slate-500">
              The selected submission has no rejected or flagged records requiring remediation.
            </div>
          ) : null}
        </div>
      )}

      {/* MODE 3: SUBMISSION HISTORY & SNAPSHOTS */}
      {centreMode === 'HISTORY' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Historical Batch Filings & Snapshots</h2>
              <p className="text-xs text-slate-500">
                Immutable records retaining historical findings and original rule engine versions.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">{instSubmissions.length} Filings Recorded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Submission ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Engine Version</th>
                  <th className="py-2.5 px-3">Submitted By</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Rows</th>
                  <th className="py-2.5 px-3">Outcome Breakdown</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {instSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {sub.id}
                      {sub.isResubmission && (
                        <span className="ml-1.5 text-[9px] font-mono bg-purple-100 text-purple-800 px-1 py-0.2 rounded">
                          RESUBMISSION
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {sub.timestamp.replace('T', ' ').slice(0, 19)}
                    </td>

                    <td className="py-2.5 px-3 font-mono font-semibold text-blue-700">
                      {sub.ruleEngineVersion}
                    </td>

                    <td className="py-2.5 px-3 text-slate-700">{sub.submittedBy}</td>

                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          sub.status === 'RECONCILIATION_COMPLETE'
                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                            : sub.status === 'REVIEW_REQUIRED'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {sub.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {sub.totalRows}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      <span className="text-teal-700">✓ {sub.acceptedRows}</span> ·{' '}
                      <span className="text-amber-700">⚠ {sub.flaggedRows}</span> ·{' '}
                      <span className="text-red-700">✗ {sub.rejectedRows}</span>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setInspectingSubmission(sub)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium text-[11px] inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Snapshot
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Snapshot Drawer Modal */}
      {inspectingSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-mono">
                  Snapshot Archive: {inspectingSubmission.id}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Engine {inspectingSubmission.ruleEngineVersion} · {inspectingSubmission.records.length} Records Preserved
                </p>
              </div>
              <button
                onClick={() => setInspectingSubmission(null)}
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 font-mono text-[11px] uppercase">
                  <tr>
                    <th className="py-2 px-2.5">Outcome</th>
                    <th className="py-2 px-2.5">Student Ref</th>
                    <th className="py-2 px-2.5">Student Name</th>
                    <th className="py-2 px-2.5">Programme</th>
                    <th className="py-2 px-2.5">Findings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {inspectingSubmission.records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2 px-2.5">
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${
                            r.rowOutcome === 'ACCEPTED'
                              ? 'bg-teal-50 text-teal-700 border-teal-200'
                              : r.rowOutcome === 'FLAGGED'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {r.rowOutcome}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 font-bold text-slate-900">{r.studentReference}</td>
                      <td className="py-2 px-2.5 font-sans text-slate-800">{r.studentName || '—'}</td>
                      <td className="py-2 px-2.5 text-slate-700">{r.programmeCode}</td>
                      <td className="py-2 px-2.5 font-sans text-slate-600 text-[11px]">
                        {r.findings && r.findings.length > 0 ? (
                          <span>
                            {r.findings.map((f) => f.ruleId).join(', ')}: {r.findings[0].reason}
                          </span>
                        ) : (
                          <span className="text-teal-700 font-mono">✓ Passed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-100 text-right bg-slate-50">
              <button
                onClick={() => setInspectingSubmission(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-medium"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
