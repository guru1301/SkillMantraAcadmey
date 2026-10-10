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
} from 'lucide-react';
import { EnrolledStudentItem } from '@/lib/db/students';
import { removeStudentFromBatchAction } from '@/app/actions/students';
import StudentCsvUploadModal from './StudentCsvUploadModal';
import SingleStudentModal from './SingleStudentModal';
import SecureDeleteModal from './SecureDeleteModal';

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
  const [students, setStudents] = useState<EnrolledStudentItem[]>(initialStudents);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ studentId: string; studentName: string } | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

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

  const handleOpenRemoveModal = (studentId: string, studentName: string) => {
    setDeleteTarget({ studentId, studentName });
  };

  const handleExecuteRemoval = async () => {
    if (!deleteTarget) return;
    const { studentId, studentName } = deleteTarget;

    setDeletingId(studentId);
    setActionMsg(null);

    const res = await removeStudentFromBatchAction(batchId, studentId, collegeId);
    setDeletingId(null);

    if (res.success) {
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      setActionMsg({
        type: 'success',
        text: `Removed ${studentName} from batch roster.`,
      });
      router.refresh();
      setTimeout(() => setActionMsg(null), 3000);
    } else {
      setActionMsg({
        type: 'error',
        text: res.error || 'Failed to remove student.',
      });
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

  return (
    <div className="space-y-6">
      {/* 1. Header & Capacity Indicator Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Enrolled Cohort Roster</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Active student participants for batch{' '}
              <strong className="text-slate-700">{batchCode}</strong> at{' '}
              <strong className="text-slate-700">{collegeName}</strong>.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {students.length > 0 && (
              <button
                onClick={handleExportCsv}
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 shadow-2xs transition"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
            )}

            <button
              onClick={() => setIsSingleModalOpen(true)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-800 font-semibold text-xs hover:bg-blue-100 transition shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Student</span>
            </button>

            <button
              onClick={() => setIsCsvModalOpen(true)}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#082e61] text-white font-bold text-xs shadow-sm hover:shadow transition"
            >
              <Upload className="w-3.5 h-3.5 text-[#FCAF0A]" />
              <span>Upload CSV Roster</span>
            </button>
          </div>
        </div>

        {/* Capacity Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-600 flex items-center gap-1.5">
              <span>Enrollment Capacity:</span>
              <strong className="text-slate-900 font-bold">
                {enrolledCount} of {targetStrength} Students
              </strong>
            </span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                enrolledCount >= targetStrength
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              {capacityPercent}% Target Capacity
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                enrolledCount >= targetStrength
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600'
              }`}
              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 transition animate-in fade-in ${
            actionMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {actionMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* 2. Search & Department Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Roll No, Name, or Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 shrink-0">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 font-medium focus:outline-hidden focus:border-blue-600"
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
          </div>
        </div>
      </div>

      {/* 3. Students Table or Empty State */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {students.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-xs">
              <GraduationCap className="w-8 h-8 text-[#0A3A7A]" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No students enrolled in this cohort yet
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6 leading-relaxed">
              Upload the student roster CSV from your college coordinator or add students manually
              to initialize attendance and assessment records.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsCsvModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#082e61] text-white font-bold text-xs shadow-sm transition"
              >
                <Upload className="w-4 h-4 text-[#FCAF0A]" />
                <span>Upload Student CSV</span>
              </button>
              <button
                onClick={() => setIsSingleModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Single Student</span>
              </button>
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          /* Search Empty State */
          <div className="py-12 px-4 text-center text-slate-500 text-xs">
            No students found matching your search filter &quot;{search}&quot;.
          </div>
        ) : (
          /* Data Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Year / Sem</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Enrolled At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 text-center text-slate-400 text-[11px]">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-blue-900 bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-lg">
                        {student.roll_number}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block text-xs">
                        {student.full_name}
                      </span>
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

                    <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                      {student.year_or_semester || '—'}
                    </td>

                    <td className="py-3.5 px-4 space-y-0.5">
                      {student.email && (
                        <a
                          href={`mailto:${student.email}`}
                          className="flex items-center gap-1 text-[11px] text-blue-700 hover:underline"
                        >
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{student.email}</span>
                        </a>
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

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {student.enrolled_at ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{new Date(student.enrolled_at).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenRemoveModal(student.id, student.full_name)}
                        disabled={deletingId === student.id}
                        title="Remove from this batch"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        {deletingId === student.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
