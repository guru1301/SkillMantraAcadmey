'use client';

import React, { useState, useOptimistic, useTransition, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Users,
  AlertCircle,
  Search,
  Sparkles,
  FileCheck2,
  Zap,
} from 'lucide-react';
import { recordAttendanceAction } from '@/app/actions/attendance';
import { useAdminToast } from './AdminToast';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface EnrolledStudent {
  student_id: string;
  roll_number: string;
  full_name: string;
  department: string | null;
  status: 'present' | 'absent' | 'late' | 'excused' | 'unmarked';
  notes: string | null;
}

interface ExistingSession {
  id: string;
  date: string;
  title: string;
  topic: string | null;
  status: string;
}

interface BatchAttendanceManagerProps {
  batchId: string;
  batchCode: string;
  initialStudents: EnrolledStudent[];
  existingSessions: ExistingSession[];
}

type AttendanceMap = Record<string, AttendanceStatus>;

type OptimisticAction =
  | { type: 'SET_ONE'; studentId: string; status: AttendanceStatus }
  | { type: 'SET_ALL'; status: AttendanceStatus };

export default function BatchAttendanceManager({
  batchId,
  batchCode,
  initialStudents,
  existingSessions,
}: BatchAttendanceManagerProps) {
  const [isPending, startTransition] = useTransition();
  const toast = useAdminToast();

  // Session metadata
  const [sessionDate, setSessionDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [sessionTitle, setSessionTitle] = useState(
    `Session on ${new Date().toISOString().split('T')[0]}`
  );
  const [sessionTopic, setSessionTopic] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  // Search & filter
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'present' | 'absent' | 'late'>('all');

  // Baseline Attendance State
  const [attendanceState, setAttendanceState] = useState<AttendanceMap>(() => {
    const initial: AttendanceMap = {};
    initialStudents.forEach((s) => {
      initial[s.student_id] = s.status === 'unmarked' ? 'present' : (s.status as AttendanceStatus);
    });
    return initial;
  });

  // React 19 useOptimistic for 0ms instant roster updates
  const [optimisticAttendance, setOptimisticAttendance] = useOptimistic(
    attendanceState,
    (current: AttendanceMap, action: OptimisticAction): AttendanceMap => {
      if (action.type === 'SET_ONE') {
        return {
          ...current,
          [action.studentId]: action.status,
        };
      }
      if (action.type === 'SET_ALL') {
        const next: AttendanceMap = {};
        initialStudents.forEach((s) => {
          next[s.student_id] = action.status;
        });
        return next;
      }
      return current;
    }
  );

  // Status counters derived from optimistic state
  const totalStudents = initialStudents.length;
  const presentCount = Object.values(optimisticAttendance).filter((s) => s === 'present').length;
  const absentCount = Object.values(optimisticAttendance).filter((s) => s === 'absent').length;
  const lateCount = Object.values(optimisticAttendance).filter((s) => s === 'late').length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  // Single student status toggle
  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    startTransition(async () => {
      setOptimisticAttendance({ type: 'SET_ONE', studentId, status: newStatus });
      setAttendanceState((prev) => ({
        ...prev,
        [studentId]: newStatus,
      }));
    });
  };

  // Bulk mark all
  const handleMarkAll = (status: AttendanceStatus) => {
    startTransition(async () => {
      setOptimisticAttendance({ type: 'SET_ALL', status });
      const next: AttendanceMap = {};
      initialStudents.forEach((s) => {
        next[s.student_id] = status;
      });
      setAttendanceState(next);
      toast.info(`Marked all ${initialStudents.length} students as ${status}.`);
    });
  };

  // Session selector
  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    const found = existingSessions.find((s) => s.id === sessionId);
    if (found) {
      setSessionDate(found.date ? found.date.split('T')[0] : sessionDate);
      setSessionTitle(found.title);
      setSessionTopic(found.topic || '');
      toast.info(`Switched to session: ${found.title}`);
    }
  };

  // Save attendance to PostgreSQL
  const handleSaveAttendance = () => {
    const payload = Object.entries(attendanceState).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    startTransition(async () => {
      const formData = new FormData();
      formData.append('batchId', batchId);
      if (selectedSessionId) {
        formData.append('sessionId', selectedSessionId);
      }
      formData.append('date', sessionDate);
      formData.append('title', sessionTitle);
      formData.append('topic', sessionTopic);
      formData.append('attendanceData', JSON.stringify(payload));

      const res = await recordAttendanceAction(null, formData);

      if (res.success) {
        toast.success(
          `Attendance successfully saved for ${payload.length} students (${presentCount} present, ${attendanceRate}%).`
        );
      } else {
        toast.error(res.error || 'Failed to save attendance records.');
      }
    });
  };

  // Filtered students list for display
  const filteredStudents = useMemo(() => {
    return initialStudents.filter((st) => {
      const status = optimisticAttendance[st.student_id] || 'present';

      if (filterTab !== 'all' && status !== filterTab) {
        return false;
      }

      const q = search.toLowerCase().trim();
      if (!q) return true;

      return (
        st.roll_number.toLowerCase().includes(q) ||
        st.full_name.toLowerCase().includes(q) ||
        (st.department && st.department.toLowerCase().includes(q))
      );
    });
  }, [initialStudents, optimisticAttendance, filterTab, search]);

  return (
    <div className="space-y-5">
      {/* 1. Session Configuration Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Training Session Attendance</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record daily lecture presence for cohort{' '}
              <strong className="font-mono text-blue-900">{batchCode}</strong>.
            </p>
          </div>

          {/* Past Sessions Picker */}
          {existingSessions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Recorded Sessions:</span>
              <select
                value={selectedSessionId}
                onChange={(e) => handleSelectSession(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white font-medium focus:outline-hidden"
              >
                <option value="">+ New Session</option>
                {existingSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.date?.split('T')[0]})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Date, Title, Topic Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Session Date
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => {
                setSessionDate(e.target.value);
                if (!selectedSessionId) {
                  setSessionTitle(`Session on ${e.target.value}`);
                }
              }}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0A3A7A]/20 focus:border-[#0A3A7A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Session Title
            </label>
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="e.g. Day 14: React Hooks & State"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0A3A7A]/20 focus:border-[#0A3A7A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Topic / Lecture Syllabus (Optional)
            </label>
            <input
              type="text"
              value={sessionTopic}
              onChange={(e) => setSessionTopic(e.target.value)}
              placeholder="e.g. Module 3: Advanced Frontend"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0A3A7A]/20 focus:border-[#0A3A7A]"
            />
          </div>
        </div>
      </div>

      {/* 2. Optimistic Live Stats & Fast Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Present Card */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
            <span>Present</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-950">{presentCount}</span>
            <span className="text-xs text-emerald-700 font-medium">({attendanceRate}%)</span>
          </div>
        </div>

        {/* Absent Card */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-rose-800 text-xs font-semibold">
            <span>Absent</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-rose-950">{absentCount}</span>
            <span className="text-xs text-rose-700 font-medium">
              ({totalStudents > 0 ? Math.round((absentCount / totalStudents) * 100) : 0}%)
            </span>
          </div>
        </div>

        {/* Late Card */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
            <span>Late</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-amber-950">{lateCount}</span>
            <span className="text-xs text-amber-700">students</span>
          </div>
        </div>

        {/* Total Enrolled */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold">
            <span>Enrolled Roster</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{totalStudents}</span>
            <span className="text-xs text-slate-500">total seats</span>
          </div>
        </div>
      </div>

      {/* 3. Action Toolbar & Fast Roster Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Roster Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(
            [
              { key: 'all', label: 'All', count: totalStudents },
              { key: 'present', label: 'Present', count: presentCount },
              { key: 'absent', label: 'Absent', count: absentCount },
              { key: 'late', label: 'Late', count: lateCount },
            ] as const
          ).map((tab) => {
            const isActive = filterTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterTab(tab.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0A3A7A] text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className="ml-1 text-[10px] opacity-75 font-mono">({tab.count})</span>
              </button>
            );
          })}
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or roll number..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0A3A7A]/20 focus:border-[#0A3A7A]"
          />
        </div>

        {/* Bulk Shortcuts & Save Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => handleMarkAll('present')}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
          >
            Mark All Present
          </button>
          <button
            type="button"
            onClick={() => handleMarkAll('absent')}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
          >
            Mark All Absent
          </button>
          <button
            type="button"
            disabled={isPending || totalStudents === 0}
            onClick={handleSaveAttendance}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0A3A7A] hover:bg-[#062F68] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-[#FCAF0A]" />
            <span>{isPending ? 'Saving...' : 'Save Attendance'}</span>
          </button>
        </div>
      </div>

      {/* 4. Student Roster Table with 0ms Optimistic Toggles */}
      {totalStudents === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          No students are currently enrolled in this batch. Please add students before recording attendance.
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          No students match your filter &ldquo;{search}&rdquo;.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Instant Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.map((st, idx) => {
                  const currentStatus = optimisticAttendance[st.student_id] || 'present';

                  return (
                    <tr key={st.student_id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {st.roll_number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {st.full_name}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {st.department || '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(st.student_id, 'present')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-emerald-700'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(st.student_id, 'absent')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                              currentStatus === 'absent'
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-rose-700'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(st.student_id, 'late')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                              currentStatus === 'late'
                                ? 'bg-amber-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-amber-700'
                            }`}
                          >
                            Late
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500 flex items-center justify-between">
            <span>
              Showing {filteredStudents.length} of {totalStudents} student(s)
            </span>
            <span className="text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Status changes update optimistically in 0ms</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
