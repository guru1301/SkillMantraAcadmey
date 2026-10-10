'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  Layers,
  Users,
} from 'lucide-react';
import { CollegeStudentItem } from '@/lib/db/students';

interface CollegeStudentsListProps {
  collegeId: string;
  collegeName: string;
  initialStudents: CollegeStudentItem[];
}

export default function CollegeStudentsList({
  collegeId,
  collegeName,
  initialStudents,
}: CollegeStudentsListProps) {
  const [students] = useState<CollegeStudentItem[]>(initialStudents);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  const departments = Array.from(
    new Set(
      students
        .map((s) => s.department?.trim())
        .filter((d): d is string => Boolean(d && d.length > 0))
    )
  ).sort();

  const filtered = students.filter((s) => {
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

  const handleExportCsv = () => {
    if (students.length === 0) return;

    const headers = ['Roll Number', 'Full Name', 'Department', 'Year/Semester', 'Email', 'Phone', 'Batches Enrolled'];
    const rows = students.map((s) => [
      `"${s.roll_number}"`,
      `"${s.full_name}"`,
      `"${s.department || ''}"`,
      `"${s.year_or_semester || ''}"`,
      `"${s.email || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.batch_codes || ''}"`,
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

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <span>Institutional Student Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Total of <strong className="text-slate-800 font-bold">{students.length}</strong> registered students across cohorts at {collegeName}.
          </p>
        </div>

        {students.length > 0 && (
          <button
            onClick={handleExportCsv}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 shadow-2xs transition self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Roster CSV</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
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
                {dept} ({students.filter((s) => s.department?.toUpperCase() === dept.toUpperCase()).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {students.length === 0 ? (
          <div className="py-14 text-center px-4">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No students registered yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Students are automatically enrolled when you upload rosters to training batches.
            </p>
            <Link
              href={`/admin/colleges/${collegeId}/batches`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A3A7A] text-white font-bold text-xs shadow-sm hover:bg-[#082e61] transition"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>View College Batches</span>
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            No students found matching &quot;{search}&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Year / Sem</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Enrolled Batches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 text-center text-slate-400 text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-blue-900 bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-lg">
                        {s.roll_number}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 font-bold">{s.full_name}</td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {s.department ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-[11px] text-slate-800">
                          {s.department}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                      {s.year_or_semester || '—'}
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5 text-[11px]">
                      {s.email && (
                        <a
                          href={`mailto:${s.email}`}
                          className="flex items-center gap-1 text-blue-700 hover:underline"
                        >
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{s.email}</span>
                        </a>
                      )}
                      {s.phone && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{s.phone}</span>
                        </div>
                      )}
                      {!s.email && !s.phone && <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      {s.batch_codes ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {s.batch_codes.split(', ').map((code) => (
                            <span
                              key={code}
                              className="font-mono text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No active batch</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
