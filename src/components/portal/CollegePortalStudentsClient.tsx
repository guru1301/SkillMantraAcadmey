'use client';

import React, { useState } from 'react';
import {
  Search,
  FolderDown,
  UserPlus,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';
import { addSingleStudentAction, uploadStudentsBulkAction } from '@/app/actions/students';
import { useRouter } from 'next/navigation';
import RosterUploadWizardModal from '@/components/admin/RosterUploadWizardModal';

export interface StudentItem {
  id: string;
  roll_number: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  year_or_semester: string | null;
  batch_code: string;
  enrolled_at: string;
}

export interface BatchOption {
  id: string;
  code: string;
  program_name: string;
}

interface Props {
  students: StudentItem[];
  collegeName: string;
  collegeId?: string;
  batches?: BatchOption[];
}

export default function CollegePortalStudentsClient({
  students,
  collegeName,
  collegeId = '',
  batches = [],
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  // Modal states
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Single Student Form State
  const [singleForm, setSingleForm] = useState({
    batchId: batches[0]?.id || '',
    rollNumber: '',
    fullName: '',
    email: '',
    phone: '',
    department: '',
    yearOrSemester: '',
  });

  // Bulk Upload Form State
  const [bulkBatchId, setBulkBatchId] = useState(batches[0]?.id || '');
  const [csvRawText, setCsvRawText] = useState('');
  const [bulkFileName, setBulkFileName] = useState('');

  const filtered = students.filter((s) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.roll_number.toLowerCase().includes(q) ||
      s.full_name.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q));

    const matchesDept = deptFilter === 'all' || s.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(students.map((s) => s.department).filter(Boolean)));

  const exportCsv = () => {
    if (students.length === 0) return;
    const headers = ['Roll Number', 'Full Name', 'Email', 'Phone', 'Department', 'Year/Semester', 'Cohort Code', 'Enrolled Date'];
    const rows = students.map((s) => [
      s.roll_number,
      `"${s.full_name}"`,
      s.email || '',
      s.phone || '',
      s.department || '',
      s.year_or_semester || '',
      s.batch_code,
      s.enrolled_at || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${collegeName.replace(/\s+/g, '_')}_Students.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadTemplateCsv = () => {
    const headers = ['Roll Number', 'Full Name', 'Email', 'Phone', 'Department', 'Year/Semester'];
    const sampleRows = [
      ['CS202601', 'Aarav Sharma', 'aarav.sharma@example.edu', '9876543210', 'Computer Science', 'Final Year'],
      ['CS202602', 'Diya Patel', 'diya.patel@example.edu', '9876543211', 'Information Technology', '3rd Year'],
    ];
    const csvContent = [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Student_Onboarding_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleForm.batchId || !singleForm.rollNumber || !singleForm.fullName) {
      setFeedbackMsg({ type: 'error', text: 'Roll number, Full name, and Batch are required.' });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg(null);

    const res = await addSingleStudentAction(singleForm.batchId, collegeId, {
      rollNumber: singleForm.rollNumber.trim(),
      fullName: singleForm.fullName.trim(),
      email: singleForm.email.trim() || undefined,
      phone: singleForm.phone.trim() || undefined,
      department: singleForm.department.trim() || undefined,
      yearOrSemester: singleForm.yearOrSemester.trim() || undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      setFeedbackMsg({ type: 'success', text: `Student ${singleForm.fullName} onboarded successfully.` });
      setShowSingleModal(false);
      setSingleForm({
        batchId: batches[0]?.id || '',
        rollNumber: '',
        fullName: '',
        email: '',
        phone: '',
        department: '',
        yearOrSemester: '',
      });
      router.refresh();
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || 'Failed to onboard student.' });
    }
  };

  const parseCsvToStudents = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const rows: Array<{
      rollNumber: string;
      fullName: string;
      email?: string;
      phone?: string;
      department?: string;
      yearOrSemester?: string;
    }> = [];

    // Parse data rows (skipping header)
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      if (parts.length >= 2 && parts[0] && parts[1]) {
        rows.push({
          rollNumber: parts[0],
          fullName: parts[1],
          email: parts[2] || undefined,
          phone: parts[3] || undefined,
          department: parts[4] || undefined,
          yearOrSemester: parts[5] || undefined,
        });
      }
    }
    return rows;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvRawText(content);
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkBatchId) {
      setFeedbackMsg({ type: 'error', text: 'Please select an assigned batch.' });
      return;
    }

    const parsedStudents = parseCsvToStudents(csvRawText);
    if (parsedStudents.length === 0) {
      setFeedbackMsg({ type: 'error', text: 'No valid student records found in CSV. Please verify format.' });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg(null);

    const res = await uploadStudentsBulkAction(bulkBatchId, collegeId, parsedStudents);
    setIsSubmitting(false);

    if (res.success && res.data) {
      setFeedbackMsg({
        type: 'success',
        text: `Processed ${res.data.totalProcessed} records. Successfully enrolled ${res.data.newlyEnrolled} students.`,
      });
      setShowBulkModal(false);
      setCsvRawText('');
      setBulkFileName('');
      router.refresh();
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || 'Bulk enrollment failed.' });
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden p-6 space-y-5">
      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action and Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search roll number, name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-600 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          {departments.length > 0 && (
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d as string} value={d as string}>
                  {d as string}
                </option>
              ))}
            </select>
          )}

          {batches.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowSingleModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                <span>Onboard Student</span>
              </button>

              <button
                type="button"
                onClick={() => setShowWizardModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A3A7A] hover:bg-blue-900 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Roster Provisioning Wizard</span>
              </button>
            </>
          )}

          <button
            onClick={exportCsv}
            disabled={students.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <FolderDown className="w-3.5 h-3.5 text-[#FCAF0A]" />
            <span>Export Roster</span>
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Roll Number</th>
              <th className="py-3 px-4">Student Name</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Year / Sem</th>
              <th className="py-3 px-4">Cohort Code</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Enrolled On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400">
                  No student records found matching filter.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id + s.batch_code} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-900">{s.roll_number}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{s.full_name}</td>
                  <td className="py-3.5 px-4">
                    {s.department ? (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {s.department}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{s.year_or_semester || '—'}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">{s.batch_code}</td>
                  <td className="py-3.5 px-4 space-y-0.5">
                    {s.email && <div className="text-blue-700 hover:underline">{s.email}</div>}
                    {s.phone && <div className="text-slate-400 text-[11px]">{s.phone}</div>}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    {s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal 1: Single Student Onboarding */}
      {showSingleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Onboard Individual Student</h3>
              <button onClick={() => setShowSingleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSingleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Training Batch *</label>
                <select
                  value={singleForm.batchId}
                  onChange={(e) => setSingleForm({ ...singleForm, batchId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-hidden focus:border-blue-600"
                  required
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} - {b.program_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Roll / Registration Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 21CS042"
                  value={singleForm.rollNumber}
                  onChange={(e) => setSingleForm({ ...singleForm, rollNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Samantha Rao"
                  value={singleForm.fullName}
                  onChange={(e) => setSingleForm({ ...singleForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="student@college.edu"
                    value={singleForm.email}
                    onChange={(e) => setSingleForm({ ...singleForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone (Optional)</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={singleForm.phone}
                    onChange={(e) => setSingleForm({ ...singleForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={singleForm.department}
                    onChange={(e) => setSingleForm({ ...singleForm, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Year / Semester</label>
                  <input
                    type="text"
                    placeholder="e.g. Final Year / Sem 7"
                    value={singleForm.yearOrSemester}
                    onChange={(e) => setSingleForm({ ...singleForm, yearOrSemester: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSingleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>{isSubmitting ? 'Enrolling...' : 'Enroll Student'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Bulk CSV Import */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Bulk Import Student Roster (CSV)</h3>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Training Batch *</label>
                <select
                  value={bulkBatchId}
                  onChange={(e) => setBulkBatchId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-hidden focus:border-blue-600"
                  required
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} - {b.program_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">CSV File Roster *</label>
                  <button
                    type="button"
                    onClick={downloadTemplateCsv}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-bold"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Template</span>
                  </button>
                </div>

                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-400 transition bg-slate-50">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-file-input"
                  />
                  <label htmlFor="csv-file-input" className="cursor-pointer block space-y-1">
                    <UploadCloud className="w-6 h-6 text-blue-600 mx-auto" />
                    <span className="text-xs font-semibold text-slate-700 block">
                      {bulkFileName ? bulkFileName : 'Click to select CSV file from computer'}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Columns: Roll Number, Full Name, Email, Phone, Department, Year/Semester
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Or Paste CSV Data Directly</label>
                <textarea
                  rows={4}
                  placeholder={`Roll Number, Full Name, Email, Phone, Department, Year/Semester\nCS101, Aarav Sharma, aarav@college.edu, 9876543210, CSE, 4th Year`}
                  value={csvRawText}
                  onChange={(e) => setCsvRawText(e.target.value)}
                  className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !csvRawText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                  <span>{isSubmitting ? 'Importing Roster...' : 'Import Students'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roster Upload & Account Provisioning Wizard */}
      <RosterUploadWizardModal
        isOpen={showWizardModal}
        onClose={() => setShowWizardModal(false)}
        colleges={[{ id: collegeId, name: collegeName }]}
        batches={batches.map((b) => ({
          id: b.id,
          code: b.code,
          college_id: collegeId,
          college_name: collegeName,
          program_name: b.program_name,
        }))}
        preselectedCollegeId={collegeId}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
