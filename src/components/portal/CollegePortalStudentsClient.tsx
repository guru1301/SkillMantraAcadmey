'use client';

import React, { useState } from 'react';
import { Search, FolderDown, Mail, Phone, Calendar, Users, GraduationCap } from 'lucide-react';

interface StudentItem {
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

interface Props {
  students: StudentItem[];
  collegeName: string;
}

export default function CollegePortalStudentsClient({ students, collegeName }: Props) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

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

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden p-6 space-y-5">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search roll number, name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-600 transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {departments.length > 0 && (
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d as string} value={d as string}>{d as string}</option>
              ))}
            </select>
          )}

          <button
            onClick={exportCsv}
            disabled={students.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <FolderDown className="w-4 h-4 text-[#FCAF0A]" />
            <span>Export Roster (CSV)</span>
          </button>
        </div>
      </div>

      {/* Table */}
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
    </div>
  );
}
