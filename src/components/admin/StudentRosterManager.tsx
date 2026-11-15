'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Upload,
  UserPlus,
  Search,
  Filter,
  Download,
  Trash2,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Users,
  CheckCircle2,
  Loader2,
  Key,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  FileSpreadsheet,
  X,
  Lock,
} from 'lucide-react';
import { EnrolledStudentItem } from '@/lib/db/students';
import {
  removeStudentFromBatchAction,
  assignBatchStudentCredentialsAction,
  deleteBatchStudentCredentialsAction,
  assignSingleStudentCredentialAction,
  deleteSingleStudentCredentialAction,
} from '@/app/actions/students';
import StudentCsvUploadModal from './StudentCsvUploadModal';
import SingleStudentModal from './SingleStudentModal';
import SecureDeleteModal from './SecureDeleteModal';
import { useAdminToast } from './AdminToast';

interface StudentRosterManagerProps {
  batchId: string;
  collegeId: string;
  collegeName: string;
  batchCode: string;
  targetStrength: number;
  initialStudents: EnrolledStudentItem[];
}

export default function StudentRosterManager({
  batchId,
  collegeId,
  collegeName,
  batchCode,
  targetStrength,
  initialStudents,
}: StudentRosterManagerProps) {
  const router = useRouter();
  const toast = useAdminToast();

  const [students, setStudents] = useState<EnrolledStudentItem[]>(initialStudents);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);

  // Credential modals state
  const [isAssignCredsModalOpen, setIsAssignCredsModalOpen] = useState(false);
  const [isDeleteCredsModalOpen, setIsDeleteCredsModalOpen] = useState(false);
  const [isProcessingCreds, setIsProcessingCreds] = useState(false);

  // Single student credential modal state
  const [singleCredTarget, setSingleCredTarget] = useState<EnrolledStudentItem | null>(null);

  // Removal state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ studentId: string; studentName: string } | null>(null);

  // Sync state if initialStudents prop changes on revalidation
  React.useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  // Extract distinct departments for filter dropdown
  const departments = Array.from(
    new Set(
      students
        .map((s) => s.department?.trim())
        .filter((d): d is string => Boolean(d && d.length > 0))
    )
  ).sort();

  // Filtered roster
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      search.trim() === '' ||
      s.roll_number.toLowerCase().includes(search.toLowerCase()) ||
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
      (s.department && s.department.toLowerCase().includes(search.toLowerCase()));

    const matchesDept =
      selectedDept === 'all' ||
      (s.department && s.department.toUpperCase() === selectedDept.toUpperCase());

    return matchesSearch && matchesDept;
  });

  // Calculate metrics
  const enrolledCount = students.length;
  const capacityPercent =
    targetStrength > 0 ? Math.min(Math.round((enrolledCount / targetStrength) * 100), 100) : 0;

  const credentialsAssignedCount = students.filter((s) => s.has_credentials).length;

  // 1. Assign Credentials to Entire Batch
  const handleAssignBatchCredentials = async () => {
    if (students.length === 0) return;

    setIsProcessingCreds(true);
    try {
      const res = await assignBatchStudentCredentialsAction(batchId);
      if (res.success && res.data) {
        toast.success(`Temporary credentials generated and assigned to ${res.data.count} students.`);
        setStudents((prev) =>
          prev.map((s) => ({
            ...s,
            has_credentials: true,
            student_status: 'active',
          }))
        );
        setIsAssignCredsModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to assign credentials.');
      }
    } catch {
      toast.error('An unexpected error occurred while assigning credentials.');
    } finally {
      setIsProcessingCreds(false);
    }
  };

  // 2. Delete / Revoke Credentials from Entire Batch
  const handleDeleteBatchCredentials = async () => {
    if (students.length === 0) return;
    setIsProcessingCreds(true);
    try {
      const res = await deleteBatchStudentCredentialsAction(batchId);
      if (res.success && res.data) {
        toast.success(
          `Login credentials revoked for ${res.data.count} students. They can no longer log in.`
        );
        setStudents((prev) =>
          prev.map((s) => ({
            ...s,
            has_credentials: false,
            student_status: 'inactive',
          }))
        );
        setIsDeleteCredsModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to revoke credentials.');
      }
    } catch {
      toast.error('An unexpected error occurred while revoking credentials.');
    } finally {
      setIsProcessingCreds(false);
    }
  };

  // 3. Single Student Credential Toggle
  const handleToggleSingleCredential = async (student: EnrolledStudentItem) => {
    if (student.has_credentials) {
      // Revoke
      const res = await deleteSingleStudentCredentialAction(student.id, batchId);
      if (res.success) {
        toast.success(`Revoked credentials for ${student.full_name}`);
        setStudents((prev) =>
          prev.map((s) => (s.id === student.id ? { ...s, has_credentials: false, student_status: 'inactive' } : s))
        );
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to revoke credentials.');
      }
    } else {
      // Assign
      const res = await assignSingleStudentCredentialAction(student.id, batchId);
      if (res.success) {
        toast.success(`Assigned temporary credentials for ${student.full_name}.`);
        setStudents((prev) =>
          prev.map((s) => (s.id === student.id ? { ...s, has_credentials: true, student_status: 'active' } : s))
        );
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to assign credentials.');
      }
    }
  };

  // Removal
  const handleOpenRemoveModal = (studentId: string, studentName: string) => {
    setDeleteTarget({ studentId, studentName });
  };

  const handleExecuteRemoval = async () => {
    if (!deleteTarget) return;
    const { studentId, studentName } = deleteTarget;

    setDeletingId(studentId);
    const res = await removeStudentFromBatchAction(batchId, studentId, collegeId);
    setDeletingId(null);

    if (res.success) {
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      toast.success(`Removed ${studentName} from batch roster.`);
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to remove student.');
      throw new Error(res.error || 'Failed to remove student.');
    }
  };

  // Export current roster to CSV
  const handleExportCsv = () => {
    if (students.length === 0) return;

    const headers = ['Roll Number', 'Full Name', 'Department', 'Year/Semester', 'Email', 'Phone', 'Enrolled Date'];
    const rows = students.map((s) => [
      `"${s.roll_number}"`,
      `"${s.full_name}"`,
      `"${s.department || ''}"`,
      `"${s.year_or_semester || ''}"`,
      `"${s.email || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString() : ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${batchCode}_Enrolled_Students.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Credentials Slips / Passwords CSV
  const handleExportCredentialsCsv = () => {
    if (students.length === 0) return;

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://skillthinker.com';
    const loginUrl = `${origin}/login`;

    const headers = ['Roll Number', 'Student Name', 'Login Username', 'Credential Status', 'Portal Login URL', 'Batch Code', 'College'];
    const rows = students.map((s) => [
      `"${s.roll_number}"`,
      `"${s.full_name}"`,
      `"${s.roll_number}"`,
      `"Activation code / temporary password required"`,
      `"${loginUrl}"`,
      `"${batchCode}"`,
      `"${collegeName}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${batchCode}_Student_Login_Credentials.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Quick Action Strip */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0A3A7A]" />
              <span>Enrolled Students Roster ({students.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Cohort <strong className="text-slate-800">{batchCode}</strong> at{' '}
              <strong className="text-slate-800">{collegeName}</strong>.
            </p>
          </div>

          {/* Action Buttons: Assign Credentials & Delete Credentials prominently featured */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* BUTTON 1: Assign Credentials */}
            <button
              onClick={() => setIsAssignCredsModalOpen(true)}
              type="button"
              disabled={students.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs hover:shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <Key className="w-4 h-4 text-emerald-100" />
              <span>Assign Credentials</span>
            </button>

            {/* BUTTON 2: Delete Credentials */}
            <button
              onClick={() => setIsDeleteCredsModalOpen(true)}
              type="button"
              disabled={students.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs hover:shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4 text-rose-100" />
              <span>Delete Credentials</span>
            </button>

            {/* Export Credentials CSV */}
            {credentialsAssignedCount > 0 && (
              <button
                onClick={handleExportCredentialsCsv}
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold text-xs hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Passwords CSV</span>
              </button>
            )}

            {/* Add Student Single */}
            <button
              onClick={() => setIsSingleModalOpen(true)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Student</span>
            </button>

            {/* Upload CSV Roster */}
            <button
              onClick={() => setIsCsvModalOpen(true)}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white font-bold text-xs shadow-2xs hover:shadow-xs transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#FCAF0A]" />
              <span>Upload CSV Roster</span>
            </button>
          </div>
        </div>

        {/* Capacity & Credentials Status Strip */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Capacity Progress */}
          <div>
            <div className="flex items-center justify-between mb-1 text-slate-600">
              <span>
                Capacity: <strong>{enrolledCount}</strong> / {targetStrength} Students
              </span>
              <span className="font-bold text-slate-700">{capacityPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0A3A7A] rounded-full transition-all duration-300"
                style={{ width: `${Math.min(capacityPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Credentials Status */}
          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
            <span className="text-slate-500">Student Portal Logins:</span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs ${
                credentialsAssignedCount > 0
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {credentialsAssignedCount} of {students.length} Activated
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Search & Department Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Roll No, Name, or Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A3A7A]/20 focus:border-[#0A3A7A] transition"
            />
          </div>

          {/* Department Filter & Export */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 font-medium focus:outline-none"
            >
              <option value="all">All Departments ({students.length})</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept} (
                  {students.filter((s) => s.department?.toUpperCase() === dept.toUpperCase()).length}
                  )
                </option>
              ))}
            </select>

            {students.length > 0 && (
              <button
                onClick={handleExportCsv}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {students.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0A3A7A] flex items-center justify-center mx-auto mb-3 border border-blue-200 shadow-2xs">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No students enrolled in this batch yet
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
              Upload your student roster CSV (e.g. 60 students) or add students one-by-one, then click
              &ldquo;Assign Credentials&rdquo; to generate their login access.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsCsvModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white font-bold text-xs shadow-2xs transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#FCAF0A]" />
                <span>Upload Student CSV</span>
              </button>
              <button
                onClick={() => setIsSingleModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Single Student</span>
              </button>
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-500 text-xs">
            No students found matching your search filter &quot;{search}&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-10 text-center">#</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4 text-center">Portal Credentials</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredStudents.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition group">
                    <td className="py-3.5 px-4 text-center text-slate-400 text-[11px]">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-[#0A3A7A] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                        {student.roll_number}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block text-xs">
                        {student.full_name}
                      </span>
                      {student.year_or_semester && (
                        <span className="text-[10px] text-slate-400">
                          {student.year_or_semester}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      {student.department ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-[11px] text-slate-800">
                          {student.department}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 space-y-0.5">
                      {student.email && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-600">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{student.email}</span>
                        </div>
                      )}
                      {student.phone && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                      {!student.email && !student.phone && (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Portal Credentials Column */}
                    <td className="py-3.5 px-4 text-center">
                      {student.has_credentials ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          <span>Not Assigned</span>
                        </span>
                      )}
                    </td>

                    {/* Row Actions: Toggle single credentials, remove student */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleSingleCredential(student)}
                          title={
                            student.has_credentials
                              ? 'Revoke student credentials'
                              : 'Assign temporary credentials'
                          }
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            student.has_credentials
                              ? 'text-emerald-700 hover:bg-emerald-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
                          }`}
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenRemoveModal(student.id, student.full_name)}
                          disabled={deletingId === student.id}
                          title="Remove from batch"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          {deletingId === student.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ASSIGN CREDENTIALS MODAL */}
      {isAssignCredsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    Assign Student Credentials
                  </h3>
                  <p className="text-xs text-slate-500">
                    Batch: <span className="font-mono font-bold text-slate-800">{batchCode}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignCredsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will generate and activate student portal credentials for all{' '}
              <strong>{students.length} students</strong> enrolled in this batch.
            </p>

            <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200/80 space-y-1.5 text-xs text-blue-900">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Login Username:</span>
                <span className="font-mono font-bold">Student Roll Number</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Temporary Password:</span>
                <span className="font-mono text-xs text-blue-700">Unique secure auto-generated per student</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Student Portal Link:</span>
                <span className="font-mono text-[11px] text-blue-700">/login</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsAssignCredsModalOpen(false)}
                disabled={isProcessingCreds}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignBatchCredentials}
                disabled={isProcessingCreds}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isProcessingCreds ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Assign Credentials ({students.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DELETE CREDENTIALS MODAL */}
      {isDeleteCredsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Revoke / Delete Credentials?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Batch: <span className="font-mono font-bold text-slate-800">{batchCode}</span>
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
              <p>
                Are you sure you want to delete login credentials for all{' '}
                <strong>{students.length} students</strong> in this batch?
              </p>
              <p className="text-[11px] text-rose-700">
                • Students will immediately be blocked from logging into the Student Portal.
                <br />• You can re-assign credentials at any time by clicking &ldquo;Assign Credentials&rdquo;.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeleteCredsModalOpen(false)}
                disabled={isProcessingCreds}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBatchCredentials}
                disabled={isProcessingCreds}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isProcessingCreds ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Delete All Credentials</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload CSV Modal */}
      <StudentCsvUploadModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        batchId={batchId}
        collegeId={collegeId}
        batchCode={batchCode}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Add Single Student Modal */}
      <SingleStudentModal
        isOpen={isSingleModalOpen}
        onClose={() => setIsSingleModalOpen(false)}
        batchId={batchId}
        collegeId={collegeId}
        batchCode={batchCode}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Secure Delete Confirmation Modal */}
      <SecureDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove Student from Batch"
        description={`Are you sure you want to remove "${deleteTarget?.studentName}" from batch ${batchCode}?`}
        impactDetails={[
          `The student will be unlinked from batch ${batchCode}.`,
          `Their master student profile and college records remain completely safe.`,
        ]}
        requiredText="REMOVE"
        confirmButtonText="Remove Student"
        onConfirm={handleExecuteRemoval}
      />
    </div>
  );
}
