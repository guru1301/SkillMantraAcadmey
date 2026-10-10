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
  Table,
} from 'lucide-react';
import { uploadStudentsBulkAction } from '@/app/actions/students';
import { StudentRowInput } from '@/lib/validations/student';

interface StudentCsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchId: string;
  collegeId: string;
  batchCode: string;
  onSuccess: () => void;
}

export default function StudentCsvUploadModal({
  isOpen,
  onClose,
  batchId,
  collegeId,
  batchCode,
  onSuccess,
}: StudentCsvUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<StudentRowInput[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Generate & download sample CSV template
  const handleDownloadSample = () => {
    const csvContent =
      'roll_number,full_name,email,phone,department,year_or_semester\n' +
      '21CS001,Aravind Kumar,aravind.k@example.com,+91 9876543210,CSE,3rd Year / 6th Sem\n' +
      '21CS002,Bhavana Priya,bhavana.p@example.com,+91 9876543211,CSE,3rd Year / 6th Sem\n' +
      '21IT001,Dinesh Karthik,dinesh.k@example.com,+91 9876543212,IT,3rd Year / 6th Sem\n' +
      '21EC001,Harini Sundaram,harini.s@example.com,+91 9876543213,ECE,3rd Year / 6th Sem\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sample_students_roster_${batchCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Parse CSV text with header normalization
  const parseCsvText = (text: string) => {
    setParseError(null);
    setUploadSuccess(null);

    const lines = text
      .split(/\r\n|\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      setParseError('The CSV file appears to be empty or missing data rows.');
      setParsedRows([]);
      return;
    }

    // Split first row for headers
    const rawHeaders = lines[0]
      .split(',')
      .map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

    const findIndex = (keys: string[]) =>
      rawHeaders.findIndex((h) => keys.includes(h));

    const rollIdx = findIndex([
      'roll_number',
      'roll_no',
      'rollno',
      'reg_no',
      'regno',
      'register_number',
      'registration_number',
      'roll',
    ]);
    const nameIdx = findIndex([
      'full_name',
      'name',
      'student_name',
      'student',
      'candidate_name',
    ]);
    const emailIdx = findIndex(['email', 'student_email', 'mail', 'email_id']);
    const phoneIdx = findIndex(['phone', 'mobile', 'contact', 'phone_number', 'contact_number']);
    const deptIdx = findIndex(['department', 'dept', 'branch', 'stream']);
    const yearIdx = findIndex([
      'year_or_semester',
      'year',
      'semester',
      'sem',
      'year_sem',
      'batch_year',
    ]);

    if (rollIdx === -1 || nameIdx === -1) {
      setParseError(
        'Could not find required columns in CSV header. Please ensure headers contain "roll_number" and "full_name" (or download the sample template).'
      );
      setParsedRows([]);
      return;
    }

    const rows: StudentRowInput[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Regex CSV splitter handling commas inside quotes
      const values = line
        .match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');

      const cleanVals = values.map((v) =>
        v.replace(/^["']|["']$/g, '').trim()
      );

      const rollNumber = cleanVals[rollIdx] || '';
      const fullName = cleanVals[nameIdx] || '';

      if (!rollNumber && !fullName) {
        continue; // skip empty trailing rows
      }

      rows.push({
        rollNumber,
        fullName,
        email: emailIdx !== -1 ? cleanVals[emailIdx] || null : null,
        phone: phoneIdx !== -1 ? cleanVals[phoneIdx] || null : null,
        department: deptIdx !== -1 ? cleanVals[deptIdx] || null : null,
        yearOrSemester: yearIdx !== -1 ? cleanVals[yearIdx] || null : null,
      });
    }

    if (rows.length === 0) {
      setParseError('No valid student rows could be parsed from the file.');
      setParsedRows([]);
      return;
    }

    // Check for required values
    const invalidRows = rows.filter((r) => !r.rollNumber || !r.fullName);
    if (invalidRows.length > 0) {
      setParseError(
        `Warning: ${invalidRows.length} row(s) are missing either roll number or full name. Please review the preview before submitting.`
      );
    }

    setParsedRows(rows);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith('.csv')) {
      setParseError('Please upload a valid .csv spreadsheet file.');
      return;
    }

    setFile(selected);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsvText(text);
    };
    reader.readAsText(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.name.endsWith('.csv')) {
      setFile(dropped);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseCsvText(text);
      };
      reader.readAsText(dropped);
    } else {
      setParseError('Please drop a valid .csv file.');
    }
  };

  const handleUploadSubmit = async () => {
    if (parsedRows.length === 0) return;

    // Filter out rows missing required identifiers
    const validRows = parsedRows.filter((r) => r.rollNumber && r.fullName);
    if (validRows.length === 0) {
      setParseError('All parsed rows are missing required roll number or name.');
      return;
    }

    setIsUploading(true);
    setParseError(null);

    const res = await uploadStudentsBulkAction(batchId, collegeId, validRows);
    setIsUploading(false);

    if (res.success) {
      setUploadSuccess(
        `Successfully enrolled ${res.data?.newlyEnrolled ?? validRows.length} student(s) into batch ${batchCode}!`
      );
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } else {
      setParseError(res.error || 'Failed to enroll students. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-[#062F68] to-[#0A3A7A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-[#FCAF0A]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Upload Student Roster CSV
              </h3>
              <p className="text-xs text-blue-200">
                Enroll cohort students for batch{' '}
                <span className="font-mono font-bold text-[#FCAF0A]">
                  {batchCode}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Template Download Strip */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="text-xs text-blue-900">
              <span className="font-bold block">Need the standard CSV format?</span>
              <span className="text-blue-700/80">
                Columns: roll_number, full_name, email, phone, department, year_or_semester
              </span>
            </div>
            <button
              onClick={handleDownloadSample}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-blue-300 text-blue-800 text-xs font-bold hover:bg-blue-100/50 shadow-2xs shrink-0 transition"
            >
              <Download className="w-3.5 h-3.5 text-[#0A3A7A]" />
              <span>Sample CSV</span>
            </button>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 rounded-2xl p-6 text-center cursor-pointer transition group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition">
              <Upload className="w-6 h-6 text-[#0A3A7A]" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              {file ? file.name : 'Click to upload or drag & drop CSV file'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports CSV rosters exported from College ERP or Excel (up to 500 students per batch)
            </p>
          </div>

          {/* Error Message */}
          {parseError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Success Message */}
          {uploadSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{uploadSuccess}</span>
            </div>
          )}

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <Table className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    Detected {parsedRows.length} Student Record{parsedRows.length > 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Showing first {Math.min(parsedRows.length, 5)} rows
                </span>
              </div>

              <div className="overflow-x-auto max-h-48">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-3 py-2">Roll No</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Dept</th>
                      <th className="px-3 py-2">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="px-3 py-1.5 font-mono font-bold text-blue-900">
                          {row.rollNumber || (
                            <span className="text-rose-500 font-sans font-normal italic">
                              Missing
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-slate-800">{row.fullName}</td>
                        <td className="px-3 py-1.5 text-slate-600">{row.department || '—'}</td>
                        <td className="px-3 py-1.5 text-slate-500 font-mono text-[11px]">
                          {row.email || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsedRows.length > 5 && (
                <div className="bg-slate-50/60 px-3 py-1.5 text-center text-[11px] text-slate-500 border-t border-slate-100">
                  + {parsedRows.length - 5} more student rows ready to be enrolled
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleUploadSubmit}
            disabled={parsedRows.length === 0 || isUploading}
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#082e61] text-white text-xs font-bold shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Enrolling Students...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Enroll {parsedRows.length} Students</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
