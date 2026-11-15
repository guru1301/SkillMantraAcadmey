'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  ShieldCheck,
  Building2,
  Users,
  KeyRound,
  FileText,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { previewRosterAction, importRosterAndProvisionAction } from '@/app/actions/students';
import { BatchOption, CollegeOption } from '@/components/admin/StudentsDirectoryClient';

interface RosterUploadWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  colleges: CollegeOption[];
  batches: BatchOption[];
  preselectedCollegeId?: string;
  preselectedBatchId?: string;
  onSuccess: () => void;
}

// Helper to prevent CSV / Formula Injection (DDE injection)
function sanitizeCsvCell(val: string | null | undefined): string {
  if (!val) return '""';
  const s = String(val).replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(s)) {
    return `"'${s}"`;
  }
  return `"${s}"`;
}

export default function RosterUploadWizardModal({
  isOpen,
  onClose,
  colleges,
  batches,
  preselectedCollegeId,
  preselectedBatchId,
  onSuccess,
}: RosterUploadWizardModalProps) {
  // Wizard Steps: 1: Selection & File, 2: Preview, 3: Success Summary
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(
    preselectedCollegeId || (colleges.length > 0 ? colleges[0].id : '')
  );
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    preselectedBatchId || ''
  );

  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Preview state
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);

  // Execution state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Filter batches by selected college
  const availableBatches = batches.filter((b) => b.college_id === selectedCollegeId);

  // 1. Download sample CSV template with DOB column
  const handleDownloadSample = () => {
    const csvContent =
      'roll_number,full_name,dob,gender,email,phone,department,year_or_semester\n' +
      '22CS101,Aarav Patel,2003-05-14,Male,aarav.p@example.com,+91 9876543210,CSE,3rd Year / 6th Sem\n' +
      '22CS102,Diya Sundaram,2003-09-22,Female,diya.s@example.com,+91 9876543211,CSE,3rd Year / 6th Sem\n' +
      '22IT201,Karthik Raja,2003-11-08,Male,karthik.r@example.com,+91 9876543212,IT,3rd Year / 6th Sem\n' +
      '22EC301,Meera Nambiar,2003-02-19,Female,meera.n@example.com,+91 9876543213,ECE,3rd Year / 6th Sem\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_student_roster_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Parse 2D raw rows from Excel or CSV
  const processMatrixRows = (matrix: any[][]) => {
    setParseError(null);
    setErrorMessage(null);

    if (!matrix || matrix.length < 2) {
      setParseError('The uploaded file appears to be empty or has no data rows.');
      setParsedRows([]);
      return;
    }

    const rawHeaders = matrix[0].map((h) =>
      String(h || '').replace(/^["']|["']$/g, '').trim().toLowerCase()
    );

    const findIndex = (keys: string[]) =>
      rawHeaders.findIndex((h) => keys.includes(h));

    const rollIdx = findIndex(['roll_number', 'roll_no', 'rollno', 'reg_no', 'regno', 'register_number', 'registration_number', 'roll', 'student_id', 'id']);
    const nameIdx = findIndex(['full_name', 'name', 'student_name', 'student', 'candidate_name']);
    const dobIdx = findIndex(['dob', 'date_of_birth', 'birth_date', 'birthdate', 'd_o_b']);
    const genderIdx = findIndex(['gender', 'sex']);
    const emailIdx = findIndex(['email', 'student_email', 'mail', 'email_id']);
    const phoneIdx = findIndex(['phone', 'mobile', 'contact', 'phone_number', 'contact_number']);
    const deptIdx = findIndex(['department', 'dept', 'branch', 'stream']);
    const yearIdx = findIndex(['year_or_semester', 'year', 'semester', 'sem', 'year_sem', 'batch_year']);

    if (rollIdx === -1 || nameIdx === -1) {
      setParseError('Required columns "roll_number" and "full_name" could not be detected. Please check headers.');
      setParsedRows([]);
      return;
    }

    const rows: any[] = [];
    for (let i = 1; i < matrix.length; i++) {
      const row = matrix[i];
      if (!row || row.length === 0) continue;

      const rollNumber = String(row[rollIdx] || '').trim();
      const fullName = String(row[nameIdx] || '').trim();

      if (!rollNumber && !fullName) continue;

      rows.push({
        rollNumber,
        fullName,
        dob: dobIdx !== -1 && row[dobIdx] ? String(row[dobIdx]).trim() : null,
        gender: genderIdx !== -1 && row[genderIdx] ? String(row[genderIdx]).trim() : null,
        email: emailIdx !== -1 && row[emailIdx] ? String(row[emailIdx]).trim() : null,
        phone: phoneIdx !== -1 && row[phoneIdx] ? String(row[phoneIdx]).trim() : null,
        department: deptIdx !== -1 && row[deptIdx] ? String(row[deptIdx]).trim() : null,
        yearOrSemester: yearIdx !== -1 && row[yearIdx] ? String(row[yearIdx]).trim() : null,
      });
    }

    if (rows.length === 0) {
      setParseError('No valid student rows found in the uploaded file.');
      setParsedRows([]);
      return;
    }

    setParsedRows(rows);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();

    if (fileExt === 'csv') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) {
          setParseError('Uploaded CSV file is empty.');
          return;
        }
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        const matrix = lines.map((line) => {
          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim());
          return values;
        });
        processMatrixRows(matrix);
      };
      reader.readAsText(selectedFile);
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const buffer = event.target?.result;
          const workbook = XLSX.read(buffer, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          processMatrixRows(matrix);
        } catch (err: any) {
          setParseError(`Failed to parse Excel spreadsheet: ${err.message || 'Corrupt file'}`);
        }
      };
      reader.readAsBinaryString(selectedFile);
    } else {
      setParseError('Unsupported file format. Please upload a .csv, .xlsx, or .xls file.');
    }
  };

  // 3. Request Preview
  const handleRequestPreview = async () => {
    if (!selectedBatchId) {
      setErrorMessage('Please select a cohort batch to assign students.');
      return;
    }
    if (parsedRows.length === 0) {
      setErrorMessage('Please upload a valid student roster file first.');
      return;
    }

    setIsPreviewing(true);
    setErrorMessage(null);

    const res = await previewRosterAction(selectedBatchId, selectedCollegeId, parsedRows);
    setIsPreviewing(false);

    if (res.success && res.data) {
      setPreviewData(res.data);
      setStep(2);
    } else {
      setErrorMessage(res.error || 'Failed to preview roster.');
    }
  };

  // 4. Execute Provisioning
  const handleExecuteImport = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await importRosterAndProvisionAction(selectedBatchId, selectedCollegeId, parsedRows);
    setIsSubmitting(false);

    if (res.success && res.data) {
      setSubmitResult(res.data);
      setStep(3);
      onSuccess();
    } else {
      setErrorMessage(res.error || 'Failed to provision student accounts.');
    }
  };

  // 5. One-Time Download of Activation Credentials CSV
  const handleDownloadActivationReport = () => {
    if (!submitResult?.activationCredentials || submitResult.activationCredentials.length === 0) {
      return;
    }

    let csvContent = 'roll_number,full_name,department,activation_code\n';
    submitResult.activationCredentials.forEach((c: any) => {
      csvContent += `${sanitizeCsvCell(c.rollNumber)},${sanitizeCsvCell(c.fullName)},${sanitizeCsvCell(c.department)},${sanitizeCsvCell(c.activationCode)}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `activation_credentials_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-[#0A3A7A]">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Student Roster Onboarding &amp; Account Provisioning
              </h3>
              <p className="text-xs text-slate-500">
                Automatic login account generation with single-use activation credentials
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Bar */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-6">
            <span className={`flex items-center gap-1.5 ${step === 1 ? 'text-[#0A3A7A] font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 1 ? 'bg-[#0A3A7A] text-white' : 'bg-slate-200 text-slate-700'}`}>1</span>
              Upload &amp; Cohort
            </span>
            <span className="text-slate-300">→</span>
            <span className={`flex items-center gap-1.5 ${step === 2 ? 'text-[#0A3A7A] font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 2 ? 'bg-[#0A3A7A] text-white' : 'bg-slate-200 text-slate-700'}`}>2</span>
              Preview &amp; Validation
            </span>
            <span className="text-slate-300">→</span>
            <span className={`flex items-center gap-1.5 ${step === 3 ? 'text-emerald-700 font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>3</span>
              Activation Credentials
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Upload and Target Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Partner College Institution
                  </label>
                  <select
                    value={selectedCollegeId}
                    onChange={(e) => {
                      setSelectedCollegeId(e.target.value);
                      setSelectedBatchId('');
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-hidden focus:border-[#0A3A7A]"
                  >
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Cohort Batch *
                  </label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-hidden focus:border-[#0A3A7A]"
                  >
                    <option value="">-- Select Cohort Batch --</option>
                    {availableBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} ({b.program_name || 'Program'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-[#0A3A7A]/50 bg-slate-50/60 hover:bg-blue-50/20 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0A3A7A]">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    {file ? file.name : 'Click to select CSV or Excel file'}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Supports .csv, .xlsx, .xls formatted student rosters
                  </p>
                </div>
                {parsedRows.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {parsedRows.length} rows parsed ready for validation
                  </span>
                )}
              </div>

              {parseError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Template Download Help */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Template includes <strong>dob</strong> (Date of Birth) required for student account activation.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="inline-flex items-center gap-1 text-[#0A3A7A] font-bold hover:underline cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Preview & Pre-Flight Validation */}
          {step === 2 && previewData && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Valid New Accounts</span>
                  <div className="text-lg font-bold text-emerald-900 mt-0.5">{previewData.validNewCount}</div>
                  <span className="text-[10px] text-emerald-600">Will provision credentials</span>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-[10px] font-bold text-blue-700 uppercase">Existing Students</span>
                  <div className="text-lg font-bold text-blue-900 mt-0.5">{previewData.existingCount}</div>
                  <span className="text-[10px] text-blue-600">Will enroll in cohort</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-700 uppercase">File Duplicates</span>
                  <div className="text-lg font-bold text-amber-900 mt-0.5">{previewData.duplicateCount}</div>
                  <span className="text-[10px] text-amber-600">Will be safely skipped</span>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="text-[10px] font-bold text-rose-700 uppercase">Conflicts / Invalid</span>
                  <div className="text-lg font-bold text-rose-900 mt-0.5">{previewData.conflictCount + previewData.invalidCount}</div>
                  <span className="text-[10px] text-rose-600">Cannot be imported</span>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr className="text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-2 px-3">Roll No</th>
                      <th className="py-2 px-3">Full Name</th>
                      <th className="py-2 px-3">DOB</th>
                      <th className="py-2 px-3">Dept</th>
                      <th className="py-2 px-3">Validation Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.previewRows.slice(0, 50).map((r: any) => (
                      <tr key={r.rowIndex} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{r.rollNumber}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{r.fullName}</td>
                        <td className="py-2 px-3 text-slate-600">{r.dob || '—'}</td>
                        <td className="py-2 px-3 text-slate-600">{r.department || '—'}</td>
                        <td className="py-2 px-3">
                          {r.status === 'new' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              New Account
                            </span>
                          )}
                          {r.status === 'existing' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              Existing Student
                            </span>
                          )}
                          {r.status === 'duplicate_in_file' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Duplicate
                            </span>
                          )}
                          {r.status === 'conflict_college' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              Cross-College Conflict
                            </span>
                          )}
                          {r.status === 'invalid' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              Invalid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: Execution Success & One-Time Download */}
          {step === 3 && submitResult && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-950">
                    Successfully Onboarded &amp; Provisioned Accounts!
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    <strong>{submitResult.accountsProvisioned}</strong> new student login accounts were automatically created and enrolled into the cohort batch.
                    Each account is set to <code>pending_activation</code> with a cryptographically secure single-use activation credential.
                  </p>
                </div>
              </div>

              {/* One-Time Disclosure Card */}
              {submitResult.activationCredentials && submitResult.activationCredentials.length > 0 && (
                <div className="bg-amber-50/70 border-2 border-amber-300/80 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
                    <KeyRound className="w-4 h-4 text-amber-700" />
                    <span>Single-Use Activation Credentials Report</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Download this activation credential report now. For security, only the cryptographic hashes are saved in the database. 
                    <strong> This report cannot be generated or downloaded again after closing this window.</strong>
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadActivationReport}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Activation Credentials Report (CSV)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestPreview}
                disabled={!file || parsedRows.length === 0 || !selectedBatchId || isPreviewing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-blue-900 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isPreviewing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validating Roster...</span>
                  </>
                ) : (
                  <>
                    <span>Preview &amp; Validate Roster</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
              >
                Back to Upload
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Provisioning Accounts...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm &amp; Provision {previewData?.validNewCount} Student Accounts</span>
                  </>
                )}
              </button>
            </>
          )}

          {step === 3 && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-[#0A3A7A] text-white text-xs font-bold hover:bg-blue-900 transition cursor-pointer"
              >
                Close &amp; Refresh Roster
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

