'use client';

import React, { useState } from 'react';
import {
  Building2,
  Layers,
  GraduationCap,
  Users,
  BookOpen,
  FolderDown,
  Search,
  Mail,
  Phone,
  Calendar,
  Crown,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CollegePortalOverview } from '@/lib/db/collegePortal';

interface CollegePortalDashboardProps {
  data: CollegePortalOverview;
  coordinatorName: string;
  coordinatorEmail: string;
}

export default function CollegePortalDashboard({
  data,
  coordinatorName,
  coordinatorEmail,
}: CollegePortalDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'batches' | 'students' | 'trainers' | 'resources'>('overview');
  const [studentSearch, setStudentSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  const { college, stats, batches, trainers, students, resources } = data;

  // Filter students
  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.roll_number.toLowerCase().includes(q) ||
      s.full_name.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q));

    const matchesDept = deptFilter === 'all' || s.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  // Unique departments for filter
  const departments = Array.from(
    new Set(students.map((s) => s.department).filter(Boolean))
  );

  // CSV Export for students
  const exportStudentsCsv = () => {
    if (students.length === 0) return;
    const headers = ['Roll Number', 'Full Name', 'Email', 'Phone', 'Department', 'Year/Semester', 'Batch Code', 'Enrolled At'];
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
    link.setAttribute('download', `${college.name.replace(/\s+/g, '_')}_Student_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Institutional Hero Card */}
      <div className="bg-gradient-to-r from-[#062F68] via-[#0A3A7A] to-[#0B4EA2] rounded-2xl text-white p-6 sm:p-8 shadow-md border border-blue-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-10 w-48 h-48 bg-[#FCAF0A]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-[#FCAF0A] text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FCAF0A]" />
              <span>Verified Institutional Partner</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {college.name}
            </h1>
            <p className="text-sm text-blue-200 mt-1 flex items-center gap-2">
              <span>📍 {college.city || 'Campus'}, {college.state || 'India'}</span>
              <span>•</span>
              <span>Coordinator: <strong>{coordinatorName}</strong> ({coordinatorEmail})</span>
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={exportStudentsCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition backdrop-blur-xs"
            >
              <FolderDown className="w-4 h-4 text-[#FCAF0A]" />
              <span>Download Student Roster</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Institutional KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Active Cohorts</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalBatches}</div>
          <p className="text-[11px] text-slate-500 mt-1">Training batches running</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Enrolled Students</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalStudents}</div>
          <p className="text-[11px] text-slate-500 mt-1">Students across cohorts</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Campus Trainers</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalTrainers}</div>
          <p className="text-[11px] text-slate-500 mt-1">Lead &amp; assistant faculty</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Curriculums</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalPrograms}</div>
          <p className="text-[11px] text-slate-500 mt-1">Active skill programs</p>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { key: 'overview', label: 'Dashboard Overview', icon: Building2 },
          { key: 'batches', label: `Batches (${batches.length})`, icon: Layers },
          { key: 'students', label: `Enrolled Students (${students.length})`, icon: GraduationCap },
          { key: 'trainers', label: `Campus Trainers (${trainers.length})`, icon: Users },
          { key: 'resources', label: `Curriculum Resources (${resources.length})`, icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-[#0A3A7A] text-[#0A3A7A] bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Tab Contents */}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Batches Overview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Campus Cohorts &amp; Batches
              </h3>
              <button
                onClick={() => setActiveTab('batches')}
                className="text-xs font-bold text-[#0A3A7A] hover:underline"
              >
                View all batches →
              </button>
            </div>

            <div className="space-y-3">
              {batches.map((b) => (
                <div
                  key={b.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                        {b.code}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{b.program_name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-3">
                      <span>Schedule: {b.start_date} to {b.end_date}</span>
                      <span>•</span>
                      <span>{b.enrolled_count} / {b.target_strength} Students Enrolled</span>
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
                      {b.trainers_count} Trainer(s)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Col: Trainers on Campus */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Trainers Assigned
              </h3>
              <button
                onClick={() => setActiveTab('trainers')}
                className="text-xs font-bold text-[#0A3A7A] hover:underline"
              >
                View team →
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 divide-y divide-slate-100 shadow-2xs">
              {trainers.map((t) => (
                <div key={t.id + t.batch_code} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0A3A7A] font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                    {t.full_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 truncate">{t.full_name}</span>
                      {t.is_lead && (
                        <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{t.role || 'Faculty Trainer'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BATCHES TAB */}
      {activeTab === 'batches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {batches.map((b) => (
            <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  {b.code}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {b.status}
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900">{b.program_name}</h4>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{b.start_date} to {b.end_date}</span>
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Roster Capacity</span>
                  <span>{b.enrolled_count} / {b.target_strength} Students</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.round((b.enrolled_count / (b.target_strength || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STUDENTS TAB */}
      {activeTab === 'students' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden space-y-4 p-5">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search roll no, name, email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
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
                onClick={exportStudentsCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition shrink-0"
              >
                <FolderDown className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Year / Sem</th>
                  <th className="py-3 px-4">Batch Code</th>
                  <th className="py-3 px-4">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No student records found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id + s.batch_code} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">{s.roll_number}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{s.full_name}</td>
                      <td className="py-3 px-4">{s.department || '—'}</td>
                      <td className="py-3 px-4">{s.year_or_semester || '—'}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">{s.batch_code}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {s.email && <div>{s.email}</div>}
                        {s.phone && <div className="text-[11px] text-slate-400">{s.phone}</div>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TRAINERS TAB */}
      {activeTab === 'trainers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainers.map((t) => (
            <div key={t.id + t.batch_code} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0A3A7A] font-extrabold text-sm flex items-center justify-center border border-blue-200">
                    {t.full_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{t.full_name}</h4>
                    <p className="text-xs text-slate-500">{t.role || 'Faculty Trainer'}</p>
                  </div>
                </div>

                {t.is_lead && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
                    <Crown className="w-3 h-3 text-amber-600" />
                    <span>Lead</span>
                  </span>
                )}
              </div>

              {t.skills && (
                <div className="flex items-center gap-1 flex-wrap pt-1">
                  {t.skills.split(',').map((sk, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                      {sk.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-600">
                {t.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.email}</span>
                  </div>
                )}
                {t.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.phone}</span>
                  </div>
                )}
                <div className="text-[11px] text-blue-700 font-semibold pt-1">
                  Assigned Cohort: {t.batch_code}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RESOURCES TAB */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          {resources.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs">
              No training resources uploaded yet for your batches.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map((r) => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{r.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Cohort: {r.batch_code}</p>
                    </div>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs font-bold transition shadow-xs"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  {r.description && (
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {r.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
