'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Layers,
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Search,
  ArrowRight,
  FileCheck,
  Mail,
  Phone,
  GraduationCap,
  Sparkles,
  BookOpen,
  MessageSquareHeart,
} from 'lucide-react';
import { TrainerBatchWithRoster } from '@/lib/db/trainerPortal';
import Card from './Card';
import EmptyState from './EmptyState';

interface TrainerBatchesClientProps {
  batches: TrainerBatchWithRoster[];
}

export default function TrainerBatchesClient({ batches }: TrainerBatchesClientProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  const activeBatch = useMemo(() => {
    return batches.find((b) => b.id === selectedBatchId) || batches[0] || null;
  }, [batches, selectedBatchId]);

  const filteredStudents = useMemo(() => {
    if (!activeBatch || !activeBatch.students) return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return activeBatch.students;
    return activeBatch.students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.roll_number.toLowerCase().includes(q) ||
        (s.department && s.department.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
    );
  }, [activeBatch, searchQuery]);

  if (batches.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState
          icon={BookOpen}
          title="No Batches Assigned Yet"
          description="Your trainer profile does not have any active cohort assignments. Please contact your SkillThinker administrator to link training cohorts."
          actionText="Back to Dashboard"
          actionHref="/trainer"
        />
      </div>
    );
  }

  const totalStudents = batches.reduce((acc, b) => acc + (b.enrolled_count || 0), 0);

  return (
    <div className="space-y-6 w-full">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Assigned Batches &amp; Rosters
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            Academic specifications, institutional timeline, and enrolled student directories for your cohorts.
          </p>
        </div>

        <div className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-medium text-slate-700">
          <Layers className="w-4 h-4 text-[#0A3A7A] shrink-0" />
          <span className="font-semibold text-slate-900">{batches.length} {batches.length === 1 ? 'Cohort' : 'Cohorts'}</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 font-medium">{totalStudents} Total Students</span>
        </div>
      </div>

      {/* 2. Cohort Selector Tabs (if multiple batches) */}
      {batches.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {batches.map((batch) => {
            const isSelected = batch.id === activeBatch?.id;
            return (
              <button
                key={batch.id}
                type="button"
                onClick={() => {
                  setSelectedBatchId(batch.id);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#0A3A7A] text-white shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/90'
                }`}
              >
                <span className="font-mono">{batch.code}</span>
                <span className="text-slate-300">•</span>
                <span className="truncate max-w-[200px]">{batch.program_name}</span>
                <span
                  className={`text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {batch.enrolled_count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Active Cohort Specification Card */}
      {activeBatch && (
        <Card className="p-6 sm:p-7 bg-white border border-slate-200">
          <div className="space-y-5">
            {/* Top row: Code, Designation, Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#0A3A7A] bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-md">
                    {activeBatch.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {activeBatch.is_lead ? 'Lead Faculty' : activeBatch.role || 'Faculty Mentor'}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{activeBatch.status === 'active' ? 'Active Cohort' : activeBatch.status}</span>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-2">
                  {activeBatch.program_name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700">{activeBatch.college_name}</span>
                  {activeBatch.college_city && (
                    <span className="text-slate-400">• {activeBatch.college_city}</span>
                  )}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                <Link
                  href={`/trainer/attendance/${activeBatch.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#FCAF0A]" />
                  <span>Mark Attendance</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href={`/trainer/tests`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs transition-colors"
                >
                  <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tests &amp; Quizzes</span>
                </Link>

                <Link
                  href={`/trainer/batches/${activeBatch.id}/feedback`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-200/80 font-semibold text-xs transition-colors"
                >
                  <MessageSquareHeart className="w-3.5 h-3.5 text-amber-600" />
                  <span>Student Feedback</span>
                </Link>
              </div>
            </div>

            {/* Key Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Enrolled Students</span>
                <span className="text-lg sm:text-xl font-bold text-slate-900 mt-1 block [font-variant-numeric:tabular-nums]">
                  {activeBatch.enrolled_count} <span className="text-xs font-normal text-slate-400">/ {activeBatch.target_strength || '—'} cap</span>
                </span>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Start Date</span>
                <span className="text-sm sm:text-base font-bold text-slate-800 mt-1 block">
                  {activeBatch.start_date}
                </span>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">End Date</span>
                <span className="text-sm sm:text-base font-bold text-slate-800 mt-1 block">
                  {activeBatch.end_date || 'In Progress'}
                </span>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Today&apos;s Status</span>
                <div className="mt-1">
                  {activeBatch.today_marked ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Recorded ({activeBatch.today_present_count || 0} present)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Pending Today</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 4. Enrolled Student Directory / Roster */}
      {activeBatch && (
        <Card className="p-6 sm:p-7 bg-white border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Enrolled Students Directory
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {activeBatch.students?.length || 0} registered
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Official institutional student enrollment roster for cohort {activeBatch.code}.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, roll no..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A3A7A] focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="py-8">
              <EmptyState
                variant="inline"
                description={
                  searchQuery
                    ? `No students matching "${searchQuery}" found in this cohort.`
                    : 'No students enrolled in this batch yet.'
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pr-4">#</th>
                    <th className="pb-3 pr-4">Roll Number</th>
                    <th className="pb-3 pr-4">Student Name</th>
                    <th className="pb-3 pr-4">Department</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 text-right">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredStudents.map((student, idx) => (
                    <tr key={student.student_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pr-4 text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 pr-4 font-mono font-bold text-[#0A3A7A]">
                        {student.roll_number}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-slate-900">
                        {student.full_name}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {student.department || '—'}
                      </td>
                      <td className="py-3 pr-4 text-slate-500 font-mono text-[11px] truncate max-w-[200px]">
                        {student.email || '—'}
                      </td>
                      <td className="py-3 text-right text-slate-500 font-mono text-[11px]">
                        {student.phone || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
