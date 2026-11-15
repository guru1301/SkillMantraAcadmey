'use client';

import React, { useState, useTransition, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  X,
  Clock,
  Save,
  Lock,
  Building2,
  AlertCircle,
  CheckCircle2,
  History,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  FileText,
  Filter,
  MessageSquare,
  ChevronDown,
  CheckCheck,
  Edit3,
} from 'lucide-react';
import {
  TrainerBatchItem,
  TrainerStudentRosterItem,
  TrainerCalendarSession,
} from '@/lib/db/trainerPortal';
import {
  saveTrainerLiveAttendanceAction,
  getTrainerBatchRosterForDateAction,
} from '@/app/actions/trainerAttendance';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'unmarked';

interface LiveAttendanceClientProps {
  batches: TrainerBatchItem[];
  initialBatchId: string;
  initialDate: string;
  todayDate: string;
  initialSession: {
    id: string;
    title: string;
    topic: string | null;
    status: string;
  } | null;
  initialRoster: TrainerStudentRosterItem[];
  calendarSessions: TrainerCalendarSession[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function LiveAttendanceClient({
  batches,
  initialBatchId,
  initialDate,
  todayDate,
  initialSession,
  initialRoster,
  calendarSessions: initialCalendarSessions,
}: LiveAttendanceClientProps) {
  const router = useRouter();

  // Selected batch & date
  const [selectedBatchId, setSelectedBatchId] = useState<string>(initialBatchId);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);

  // Roster & Session data for active date
  const [currentRoster, setCurrentRoster] = useState<TrainerStudentRosterItem[]>(initialRoster);
  const [currentSession, setCurrentSession] = useState(initialSession);
  const [sessionTopic, setSessionTopic] = useState<string>(initialSession?.topic || '');
  const [sessionTitle, setSessionTitle] = useState<string>(
    initialSession?.title || `Class Session - ${initialDate}`
  );

  // Edit lock mode: if a session is previously completed, lock editing until trainer clicks "Edit Attendance"
  const [isEditMode, setIsEditMode] = useState<boolean>(
    initialSession?.status !== 'completed'
  );

  // Calendar popover & history state
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState<boolean>(false);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkModalAction, setBulkModalAction] = useState<'all_present' | 'all_absent' | 'reset'>('all_present');
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  // Active remarks modal or active student row for inline remarks
  const [activeRemarkStudentId, setActiveRemarkStudentId] = useState<string | null>(null);

  const calendarRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const initialDateParts = useMemo(() => {
    const [y, m] = initialDate.split('-').map(Number);
    return { year: y, monthIndex: m - 1 };
  }, [initialDate]);

  const [calYear, setCalYear] = useState<number>(initialDateParts.year);
  const [calMonth, setCalMonth] = useState<number>(initialDateParts.monthIndex);

  // Calendar sessions state (optimistic)
  const [calendarSessions, setCalendarSessions] = useState<TrainerCalendarSession[]>(initialCalendarSessions);

  // =========================================================================
  // CRITICAL REQUIREMENT: NEVER DEFAULT UNVERIFIED STUDENTS TO PRESENT.
  // If a student has no saved status in the database, their status MUST BE 'unmarked'.
  // =========================================================================
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>(() => {
    const map: Record<string, AttendanceStatus> = {};
    initialRoster.forEach((student) => {
      if (
        student.status === 'present' ||
        student.status === 'absent' ||
        student.status === 'late' ||
        student.status === 'excused'
      ) {
        map[student.student_id] = student.status;
      } else {
        map[student.student_id] = 'unmarked';
      }
    });
    return map;
  });

  const [notesMap, setNotesMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    initialRoster.forEach((student) => {
      if (student.notes) map[student.student_id] = student.notes;
    });
    return map;
  });

  // Client-side cache for instantaneous 0ms date switching
  const rosterCacheRef = useRef<
    Record<
      string,
      {
        session: { id: string; title: string; topic: string | null; status: string } | null;
        roster: TrainerStudentRosterItem[];
        attendanceMap: Record<string, AttendanceStatus>;
        notesMap: Record<string, string>;
      }
    >
  >({
    [initialDate]: {
      session: initialSession,
      roster: initialRoster,
      attendanceMap,
      notesMap,
    },
  });

  // Loading state during date transition
  const [isLoadingDate, setIsLoadingDate] = useState<boolean>(false);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unmarked' | 'present' | 'absent' | 'late' | 'excused'>('all');

  // Saving state
  const [isPending, startTransition] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState<string | null>(
    initialSession?.status === 'completed' ? `Attendance record on file for ${initialDate}` : null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  const activeBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];
  const isToday = selectedDate === todayDate;

  // Calendar lookup map
  const calendarSessionsByDate = useMemo(() => {
    const map = new Map<string, TrainerCalendarSession>();
    calendarSessions.forEach((s) => map.set(s.date, s));
    return map;
  }, [calendarSessions]);

  // =========================================================================
  // RECONCILED COUNT CALCULATIONS
  // Present + Absent + Late + Excused + Unmarked === Total Enrolled Students
  // =========================================================================
  const totalStudents = currentRoster.length;

  const presentCount = useMemo(() => {
    return Object.values(attendanceMap).filter((s) => s === 'present').length;
  }, [attendanceMap]);

  const absentCount = useMemo(() => {
    return Object.values(attendanceMap).filter((s) => s === 'absent').length;
  }, [attendanceMap]);

  const lateCount = useMemo(() => {
    return Object.values(attendanceMap).filter((s) => s === 'late').length;
  }, [attendanceMap]);

  const excusedCount = useMemo(() => {
    return Object.values(attendanceMap).filter((s) => s === 'excused').length;
  }, [attendanceMap]);

  const unmarkedCount = useMemo(() => {
    return Object.values(attendanceMap).filter((s) => s === 'unmarked').length;
  }, [attendanceMap]);

  const markedCount = presentCount + absentCount + lateCount + excusedCount;

  // Standard presence percentage calculated strictly over marked students
  const attendancePercent = markedCount > 0 ? Math.round((presentCount / markedCount) * 100) : 0;

  // Session marked status in database
  const isSessionMarked = currentSession?.status === 'completed';

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistoryDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return currentRoster.filter((st) => {
      const currentStatus = attendanceMap[st.student_id] || 'unmarked';
      if (statusFilter !== 'all' && currentStatus !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = st.full_name.toLowerCase().includes(q);
        const matchesRoll = st.roll_number.toLowerCase().includes(q);
        const matchesDept = st.department?.toLowerCase().includes(q) || false;
        return matchesName || matchesRoll || matchesDept;
      }
      return true;
    });
  }, [currentRoster, attendanceMap, statusFilter, searchQuery]);

  // Date switching with client-side cache and server action fallback
  const handleSelectDate = async (dateStr: string) => {
    if (dateStr > todayDate) {
      setErrorMessage('Future dates cannot be selected. Attendance can only be recorded for today or past scheduled sessions.');
      return;
    }
    setShowCalendar(false);
    setShowHistoryDropdown(false);
    if (dateStr === selectedDate) return;

    // Cache current date before switching
    rosterCacheRef.current[selectedDate] = {
      session: currentSession,
      roster: currentRoster,
      attendanceMap,
      notesMap,
    };

    setSelectedDate(dateStr);
    setHasChanges(false);
    setErrorMessage(null);

    // Update URL shallowly without full page refresh
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/trainer/attendance/${selectedBatchId}?date=${dateStr}`);
    }

    // Cache hit
    if (rosterCacheRef.current[dateStr]) {
      const cached = rosterCacheRef.current[dateStr];
      setCurrentRoster(cached.roster);
      setCurrentSession(cached.session);
      setAttendanceMap(cached.attendanceMap);
      setNotesMap(cached.notesMap);
      setSessionTitle(cached.session?.title || `Class Session - ${dateStr}`);
      setSessionTopic(cached.session?.topic || '');
      setIsEditMode(cached.session?.status !== 'completed');
      setSaveSuccess(
        cached.session?.status === 'completed' ? `Attendance record on file for ${dateStr}` : null
      );
      return;
    }

    // Cache miss: fetch via server action
    setIsLoadingDate(true);
    try {
      const res = await getTrainerBatchRosterForDateAction(selectedBatchId, dateStr);
      if (res.success && res.roster) {
        const newMap: Record<string, AttendanceStatus> = {};
        const newNotes: Record<string, string> = {};

        res.roster.forEach((st) => {
          if (
            st.status === 'present' ||
            st.status === 'absent' ||
            st.status === 'late' ||
            st.status === 'excused'
          ) {
            newMap[st.student_id] = st.status;
          } else {
            // STRICTLY UNMARKED! NEVER DEFAULT TO PRESENT!
            newMap[st.student_id] = 'unmarked';
          }
          if (st.notes) newNotes[st.student_id] = st.notes;
        });

        setCurrentRoster(res.roster);
        setCurrentSession(res.existingSession || null);
        setAttendanceMap(newMap);
        setNotesMap(newNotes);
        setSessionTitle(res.existingSession?.title || `Class Session - ${dateStr}`);
        setSessionTopic(res.existingSession?.topic || '');
        setIsEditMode(res.existingSession?.status !== 'completed');
        setSaveSuccess(
          res.existingSession?.status === 'completed' ? `Attendance record on file for ${dateStr}` : null
        );

        rosterCacheRef.current[dateStr] = {
          session: res.existingSession || null,
          roster: res.roster,
          attendanceMap: newMap,
          notesMap: newNotes,
        };
      } else {
        setErrorMessage(res.error || 'Failed to load date roster.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error loading date.');
    } finally {
      setIsLoadingDate(false);
    }
  };

  const handlePrevDay = () => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() - 1);
    const dStr = cur.toISOString().split('T')[0];
    handleSelectDate(dStr);
  };

  const handleNextDay = () => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + 1);
    const dStr = cur.toISOString().split('T')[0];
    if (dStr > todayDate) return;
    handleSelectDate(dStr);
  };

  // Status selection per student
  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    if (!isEditMode) return;
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
    setHasChanges(true);
    setSaveSuccess(null);
  };

  // Note change per student
  const handleSetNote = (studentId: string, noteText: string) => {
    setNotesMap((prev) => ({
      ...prev,
      [studentId]: noteText,
    }));
    setHasChanges(true);
    setSaveSuccess(null);
  };

  // Intentional bulk action trigger
  const triggerBulkAction = (action: 'all_present' | 'all_absent' | 'reset') => {
    if (!isEditMode) return;
    setBulkModalAction(action);
    setShowBulkModal(true);
  };

  const confirmBulkAction = () => {
    setShowBulkModal(false);

    if (bulkModalAction === 'all_present') {
      const map: Record<string, AttendanceStatus> = {};
      currentRoster.forEach((st) => {
        map[st.student_id] = 'present';
      });
      setAttendanceMap(map);
      setHasChanges(true);
      setSaveSuccess(null);
    } else if (bulkModalAction === 'all_absent') {
      const map: Record<string, AttendanceStatus> = {};
      currentRoster.forEach((st) => {
        map[st.student_id] = 'absent';
      });
      setAttendanceMap(map);
      setHasChanges(true);
      setSaveSuccess(null);
    } else if (bulkModalAction === 'reset') {
      // Reset back to initial loaded state for this date
      const map: Record<string, AttendanceStatus> = {};
      currentRoster.forEach((st) => {
        if (
          st.status === 'present' ||
          st.status === 'absent' ||
          st.status === 'late' ||
          st.status === 'excused'
        ) {
          map[st.student_id] = st.status;
        } else {
          map[st.student_id] = 'unmarked';
        }
      });
      setAttendanceMap(map);
      setHasChanges(false);
      setSaveSuccess(null);
    }
  };

  // Smooth scroll and focus student row from absentee/exception chips
  const scrollToStudent = (studentId: string) => {
    const el = rowRefs.current[studentId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-[#0A3A7A]', 'bg-blue-50/40');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-[#0A3A7A]', 'bg-blue-50/40');
      }, 1500);
    }
  };

  // Attendance submission validation & execution
  const handleInitiateSubmit = () => {
    if (isPending) return;

    // Strict validation: Reject if any student is still unmarked
    if (unmarkedCount > 0) {
      setErrorMessage(
        `Cannot submit attendance: ${unmarkedCount} ${
          unmarkedCount === 1 ? 'student remains' : 'students remain'
        } unmarked. Please assign an explicit status (Present, Absent, Late, or Excused) to every student.`
      );
      setStatusFilter('unmarked');
      return;
    }

    if (selectedDate > todayDate) {
      setErrorMessage('Cannot record attendance for future dates.');
      return;
    }

    setErrorMessage(null);
    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = () => {
    setShowSubmitModal(false);

    const records = currentRoster.map((st) => ({
      studentId: st.student_id,
      status: (attendanceMap[st.student_id] || 'present') as 'present' | 'absent' | 'late' | 'excused',
      notes: notesMap[st.student_id] || undefined,
    }));

    startTransition(async () => {
      const res = await saveTrainerLiveAttendanceAction({
        batchId: selectedBatchId,
        date: selectedDate,
        title: sessionTitle || `Class Session - ${selectedDate}`,
        topic: sessionTopic || undefined,
        records,
      });

      if (res.success) {
        setHasChanges(false);
        setIsEditMode(false);
        setSaveSuccess(
          `Attendance successfully recorded! ${res.presentCount} Present • ${res.absentCount || 0} Absent • ${res.lateCount || 0} Late • ${res.excusedCount || 0} Excused.`
        );

        const updatedSession = {
          id: res.sessionId || 'saved',
          title: sessionTitle,
          topic: sessionTopic || null,
          status: 'completed',
        };
        setCurrentSession(updatedSession);

        rosterCacheRef.current[selectedDate] = {
          session: updatedSession,
          roster: currentRoster,
          attendanceMap,
          notesMap,
        };

        // Optimistically update calendar session dot
        setCalendarSessions((prev) => {
          const filtered = prev.filter((s) => s.date !== selectedDate);
          return [
            {
              id: res.sessionId || 'session-' + selectedDate,
              date: selectedDate,
              title: sessionTitle,
              topic: sessionTopic || null,
              status: 'completed',
              totalMarked: records.length,
              presentCount: res.presentCount || presentCount,
              absentCount: res.absentCount || absentCount,
              lateCount: res.lateCount || lateCount,
              excusedCount: res.excusedCount || excusedCount,
              attendanceRate: attendancePercent,
            },
            ...filtered,
          ];
        });
      } else {
        setErrorMessage(res.error || 'Failed to submit attendance.');
      }
    });
  };

  // Calendar calculations
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();

  const formattedSelectedDate = useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-20">
      {/* ========================================================= */}
      {/* 1. TOP HEADER & AUDITABLE DATE NAVIGATOR                  */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Batch Title & Context */}
          <div>
            <div className="flex items-center gap-2">
              {batches.length > 1 ? (
                <div className="relative inline-flex items-center">
                  <select
                    value={activeBatch?.id}
                    onChange={(e) => {
                      router.push(`/trainer/attendance/${e.target.value}`);
                    }}
                    className="font-mono text-xs font-bold text-[#0A3A7A] bg-blue-50 hover:bg-blue-100/70 px-2.5 py-1 rounded-lg border border-blue-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0A3A7A]/20 transition-all pr-6 appearance-none"
                    aria-label="Switch cohort"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} — {b.program_name} ({b.college_name})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#0A3A7A] absolute right-1.5 pointer-events-none" />
                </div>
              ) : (
                <span className="font-mono text-xs font-bold text-[#0A3A7A] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {activeBatch?.code}
                </span>
              )}
              <span className="text-xs text-slate-500 font-medium">
                {activeBatch?.college_name}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 mt-1">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                Session Attendance
              </h1>

              {/* Attendance Record Status Pill */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  isSessionMarked
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {isSessionMarked ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Attendance Submitted</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Attendance Pending</span>
                  </>
                )}
              </span>

              {hasChanges && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                  Unsaved Draft
                </span>
              )}
            </div>
          </div>

          {/* Simple Date Controller */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto relative">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
              title="Previous Day"
              aria-label="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Date Picker Button */}
            <div className="relative" ref={calendarRef}>
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  isToday
                    ? 'bg-blue-50/60 border-blue-200 text-[#0A3A7A]'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>{formattedSelectedDate}</span>
                {isToday && (
                  <span className="px-1.5 py-0.2 bg-[#0A3A7A] text-white text-[10px] font-bold rounded">
                    Today
                  </span>
                )}
              </button>

              {/* CALENDAR DROPDOWN */}
              {showCalendar && (
                <div className="absolute right-0 mt-2 z-50 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        if (calMonth === 0) {
                          setCalMonth(11);
                          setCalYear((y) => y - 1);
                        } else {
                          setCalMonth((m) => m - 1);
                        }
                      }}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <span className="text-xs font-bold text-slate-900">
                      {MONTH_NAMES[calMonth]} {calYear}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        if (calMonth === 11) {
                          setCalMonth(0);
                          setCalYear((y) => y + 1);
                        } else {
                          setCalMonth((m) => m + 1);
                        }
                      }}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[10px] font-bold text-slate-400">
                    <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-8" />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const isFuture = dateStr > todayDate;
                      const isCurDay = dateStr === todayDate;
                      const isSel = dateStr === selectedDate;
                      const session = calendarSessionsByDate.get(dateStr);

                      if (isFuture) {
                        return (
                          <div
                            key={dateStr}
                            title="Future dates locked"
                            className="h-8 rounded-lg flex items-center justify-center text-slate-300 text-xs cursor-not-allowed select-none"
                          >
                            <Lock className="w-2.5 h-2.5 opacity-40" />
                          </div>
                        );
                      }

                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => handleSelectDate(dateStr)}
                          className={`h-8 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center relative cursor-pointer ${
                            isSel
                              ? 'bg-[#0A3A7A] text-white shadow-xs'
                              : isCurDay
                              ? 'bg-blue-100/70 text-[#0A3A7A] hover:bg-blue-200'
                              : session?.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span>{dayNum}</span>
                          {session?.status === 'completed' && !isSel && (
                            <span className="w-1 h-1 rounded-full bg-emerald-500 absolute bottom-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleSelectDate(todayDate)}
                      className="font-bold text-[#0A3A7A] hover:underline cursor-pointer"
                    >
                      Jump to Today
                    </button>
                    <span className="text-slate-400 text-[10px] inline-flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Future locked</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={isToday}
              onClick={handleNextDay}
              className={`p-2 rounded-xl border transition ${
                isToday
                  ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer'
              }`}
              title={isToday ? 'Cannot move to future dates' : 'Next Day'}
              aria-label="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Session History Dropdown */}
            <div className="relative" ref={historyRef}>
              <button
                type="button"
                onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                title="View Recorded Sessions History"
                aria-label="Recorded Sessions History"
              >
                <History className="w-4 h-4 text-slate-500" />
              </button>

              {showHistoryDropdown && (
                <div className="absolute right-0 mt-2 z-50 w-68 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Recorded Sessions Log
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {calendarSessions.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-400">No sessions recorded yet</div>
                    ) : (
                      calendarSessions.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSelectDate(s.date)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                            s.date === selectedDate ? 'bg-blue-50 text-[#0A3A7A]' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <span className="font-bold">{s.date}</span>
                            <span className="block text-[10px] text-slate-400 truncate max-w-[140px]">{s.title}</span>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800">
                            {s.attendanceRate}%
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Batch Switcher Pills */}
        {batches.length > 1 && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Cohorts:</span>
            {batches.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  if (b.id !== selectedBatchId) {
                    setSelectedBatchId(b.id);
                    router.push(`/trainer/attendance/${b.id}?date=${selectedDate}`);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                  b.id === selectedBatchId
                    ? 'bg-[#0A3A7A] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {b.code}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. RECONCILED ATTENDANCE SCORECARD                        */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
        {/* Total Enrolled */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Enrolled</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{totalStudents}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Cohort Roster</div>
        </div>

        {/* Present */}
        <div className="bg-white rounded-xl border border-emerald-200/60 p-3 shadow-2xs bg-emerald-50/20">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Present (P)</div>
          <div className="text-xl font-bold text-emerald-700 mt-0.5">{presentCount}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
            {markedCount > 0 ? `${attendancePercent}%` : '0%'}
          </div>
        </div>

        {/* Late */}
        <div className="bg-white rounded-xl border border-amber-200/60 p-3 shadow-2xs bg-amber-50/20">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Late (L)</div>
          <div className="text-xl font-bold text-amber-700 mt-0.5">{lateCount}</div>
          <div className="text-[10px] text-amber-600 font-medium mt-0.5">Tardy entry</div>
        </div>

        {/* Excused */}
        <div className="bg-white rounded-xl border border-indigo-200/60 p-3 shadow-2xs bg-indigo-50/20">
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Excused (E)</div>
          <div className="text-xl font-bold text-indigo-700 mt-0.5">{excusedCount}</div>
          <div className="text-[10px] text-indigo-600 font-medium mt-0.5">Approved leave</div>
        </div>

        {/* Absent */}
        <div className="bg-white rounded-xl border border-rose-200/60 p-3 shadow-2xs bg-rose-50/20">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Absent (A)</div>
          <div className="text-xl font-bold text-rose-700 mt-0.5">{absentCount}</div>
          <div className="text-[10px] text-rose-600 font-medium mt-0.5">Unexcused</div>
        </div>

        {/* Unmarked Status */}
        <div className={`rounded-xl border p-3 shadow-2xs ${
          unmarkedCount > 0 
            ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-400/20' 
            : 'bg-white border-slate-200/90 text-slate-600'
        }`}>
          <div className="text-[10px] font-bold uppercase tracking-wider">Unmarked</div>
          <div className={`text-xl font-bold mt-0.5 ${unmarkedCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
            {unmarkedCount}
          </div>
          <div className="text-[10px] font-semibold mt-0.5">
            {unmarkedCount > 0 ? 'Action Required' : 'All Evaluated'}
          </div>
        </div>
      </div>

      {/* Unmarked Blocking Callout */}
      {unmarkedCount > 0 && isEditMode && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{unmarkedCount} {unmarkedCount === 1 ? 'student has' : 'students have'} not been marked.</strong> Every student must be explicitly evaluated before submission.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('unmarked')}
            className="px-3 py-1 bg-amber-200/70 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold transition self-start sm:self-auto cursor-pointer"
          >
            Show Unmarked Only ({unmarkedCount})
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MAIN ATTENDANCE ROSTER WORKSPACE                      */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Action Strip: Search, Filter Tabs, and Bulk Menu */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          {/* Quick Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by roll number or name..."
              className="w-full pl-8.5 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0A3A7A] focus:ring-1 focus:ring-[#0A3A7A]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs font-bold overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer shrink-0 ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({totalStudents})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('unmarked')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer shrink-0 ${
                  statusFilter === 'unmarked' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                Unmarked ({unmarkedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('present')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer shrink-0 ${
                  statusFilter === 'present' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                Present ({presentCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('absent')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer shrink-0 ${
                  statusFilter === 'absent' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                Absent ({absentCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('late')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer shrink-0 ${
                  statusFilter === 'late' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                Late ({lateCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('excused')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer shrink-0 ${
                  statusFilter === 'excused' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-700'
                }`}
              >
                Excused ({excusedCount})
              </button>
            </div>

            {/* Intentional Bulk Action Dropdown */}
            {isEditMode && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => triggerBulkAction('all_present')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Intentional bulk action to mark all students present"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mark All Present</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerBulkAction('reset')}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition cursor-pointer"
                  title="Reset draft to saved state"
                  aria-label="Reset draft"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {!isEditMode && isSessionMarked && (
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0A3A7A] border border-blue-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Attendance</span>
              </button>
            )}
          </div>
        </div>

        {/* Absentees and Exceptions Summary Panel (Click to jump to student) */}
        {(absentCount > 0 || lateCount > 0 || excusedCount > 0) && (
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">
              Exceptions ({absentCount + lateCount + excusedCount}):
            </span>

            {currentRoster
              .filter((st) => {
                const s = attendanceMap[st.student_id];
                return s === 'absent' || s === 'late' || s === 'excused';
              })
              .map((st) => {
                const s = attendanceMap[st.student_id];
                const badgeColor =
                  s === 'absent'
                    ? 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
                    : s === 'late'
                    ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                    : 'border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100';

                return (
                  <button
                    key={st.student_id}
                    type="button"
                    onClick={() => scrollToStudent(st.student_id)}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold transition cursor-pointer ${badgeColor}`}
                    title={`Click to locate in roster (${s.toUpperCase()})`}
                  >
                    <span className="font-mono text-[10px] font-bold">{st.roll_number}</span>
                    <span>{st.full_name}</span>
                    <span className="uppercase text-[9px] font-bold px-1 py-0.2 rounded bg-white/70">
                      {s[0].toUpperCase()}
                    </span>
                  </button>
                );
              })}
          </div>
        )}

        {/* Student Roster Table */}
        <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto">
          {isLoadingDate ? (
            <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-slate-300 border-t-[#0A3A7A] rounded-full animate-spin" />
              <span>Loading roster for {selectedDate}...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No students match the selected filter.
            </div>
          ) : (
            filteredStudents.map((student, idx) => {
              const status = attendanceMap[student.student_id] || 'unmarked';
              const studentNote = notesMap[student.student_id] || '';
              const isUnmarked = status === 'unmarked';
              const hasNote = studentNote.trim().length > 0;
              const isShowingRemarkInput = activeRemarkStudentId === student.student_id;

              return (
                <div
                  key={student.student_id}
                  ref={(el) => { rowRefs.current[student.student_id] = el; }}
                  className={`px-4 py-3 transition-colors ${
                    isUnmarked
                      ? 'bg-amber-50/20'
                      : status === 'absent'
                      ? 'bg-rose-50/20'
                      : status === 'late'
                      ? 'bg-amber-50/15'
                      : status === 'excused'
                      ? 'bg-indigo-50/15'
                      : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Student Identity */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md shrink-0">
                        {student.roll_number}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {student.full_name}
                          </span>
                          {isUnmarked && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border border-dashed border-amber-300 bg-amber-50 text-amber-800">
                              Unmarked
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {student.department || 'Enrolled Student'}
                          {hasNote && (
                            <span className="ml-2 text-slate-600 font-medium inline-flex items-center gap-1">
                              <MessageSquare className="w-2.5 h-2.5 text-slate-400" />
                              <span>{studentNote}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Compact Segmented Control for 30-100+ Students */}
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                      {/* Segmented Button Group */}
                      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 text-xs">
                        {/* Present (P) */}
                        <button
                          type="button"
                          disabled={!isEditMode}
                          onClick={() => handleSetStatus(student.student_id, 'present')}
                          className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                            status === 'present'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-emerald-700 disabled:opacity-50'
                          }`}
                          title="Mark Present (P)"
                        >
                          <Check className="w-3 h-3" />
                          <span>P</span>
                          <span className="hidden md:inline font-normal text-[11px]">Present</span>
                        </button>

                        {/* Late (L) */}
                        <button
                          type="button"
                          disabled={!isEditMode}
                          onClick={() => handleSetStatus(student.student_id, 'late')}
                          className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                            status === 'late'
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-amber-700 disabled:opacity-50'
                          }`}
                          title="Mark Late (L)"
                        >
                          <Clock className="w-3 h-3" />
                          <span>L</span>
                          <span className="hidden md:inline font-normal text-[11px]">Late</span>
                        </button>

                        {/* Excused (E) */}
                        <button
                          type="button"
                          disabled={!isEditMode}
                          onClick={() => handleSetStatus(student.student_id, 'excused')}
                          className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                            status === 'excused'
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-indigo-700 disabled:opacity-50'
                          }`}
                          title="Mark Excused (E)"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>E</span>
                          <span className="hidden md:inline font-normal text-[11px]">Excused</span>
                        </button>

                        {/* Absent (A) */}
                        <button
                          type="button"
                          disabled={!isEditMode}
                          onClick={() => handleSetStatus(student.student_id, 'absent')}
                          className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                            status === 'absent'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-rose-700 disabled:opacity-50'
                          }`}
                          title="Mark Absent (A)"
                        >
                          <X className="w-3 h-3" />
                          <span>A</span>
                          <span className="hidden md:inline font-normal text-[11px]">Absent</span>
                        </button>
                      </div>

                      {/* Remark Button */}
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() =>
                            setActiveRemarkStudentId(
                              isShowingRemarkInput ? null : student.student_id
                            )
                          }
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            hasNote
                              ? 'border-blue-200 bg-blue-50 text-[#0A3A7A]'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700'
                          }`}
                          title={hasNote ? 'Edit remark' : 'Add optional remark'}
                          aria-label="Add remark"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Remark Input (when opened) */}
                  {isShowingRemarkInput && isEditMode && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2">
                      <input
                        type="text"
                        value={studentNote}
                        onChange={(e) => handleSetNote(student.student_id, e.target.value)}
                        placeholder="Add student attendance remark (e.g. medical leave, lab pass)..."
                        className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#0A3A7A]"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setActiveRemarkStudentId(null)}
                        className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Bar: Topic Input & Final Submission */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Syllabus Topic Covered Input */}
          <div className="flex-1 max-w-md">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Curriculum Syllabus Topic Covered (Optional)
            </label>
            <input
              type="text"
              disabled={!isEditMode}
              value={sessionTopic}
              onChange={(e) => {
                setSessionTopic(e.target.value);
                setHasChanges(true);
              }}
              placeholder="e.g. Module 3: Advanced SQL Joins & Schema Normalization..."
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0A3A7A] disabled:bg-slate-100"
            />
          </div>

          {/* Verification Status & Submit Button */}
          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-900">
                {markedCount} / {totalStudents} Evaluated
              </div>
              <div className="text-[11px] text-slate-500">
                {unmarkedCount > 0 ? (
                  <span className="text-amber-700 font-semibold">{unmarkedCount} unresolved</span>
                ) : (
                  <span className="text-emerald-700 font-semibold">Ready to Submit</span>
                )}
              </div>
            </div>

            {isEditMode ? (
              <button
                type="button"
                disabled={isPending || isLoadingDate || unmarkedCount > 0}
                onClick={handleInitiateSubmit}
                className="px-5 py-2.5 bg-[#0A3A7A] hover:bg-[#062F68] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
                title={
                  unmarkedCount > 0
                    ? `Cannot submit: ${unmarkedCount} students remain unmarked`
                    : 'Submit verified attendance records'
                }
              >
                {isPending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Submit Attendance</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer border border-slate-200"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit / Correct Roster</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. TOAST NOTIFICATIONS & FEEDBACK                        */}
      {/* ========================================================= */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. CONFIRMATION MODALS                                    */}
      {/* ========================================================= */}
      {/* Bulk Action Confirmation Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {bulkModalAction === 'all_present'
                    ? 'Confirm Bulk Action: Mark All Present'
                    : bulkModalAction === 'all_absent'
                    ? 'Confirm Bulk Action: Mark All Absent'
                    : 'Confirm Draft Reset'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Intentional batch modification
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {bulkModalAction === 'all_present' && (
                <>
                  Are you sure you want to mark all <strong>{totalStudents} students</strong> as <strong>Present</strong>? This will update your unsubmitted draft. You can still make individual corrections before submitting.
                </>
              )}
              {bulkModalAction === 'all_absent' && (
                <>
                  Are you sure you want to mark all <strong>{totalStudents} students</strong> as <strong>Absent</strong>? This will overwrite your current draft.
                </>
              )}
              {bulkModalAction === 'reset' && (
                <>
                  Reset your current draft back to the last saved state on record? Unsubmitted changes will be discarded.
                </>
              )}
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBulkAction}
                className="px-4 py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs font-bold transition shadow-xs"
              >
                {bulkModalAction === 'reset' ? 'Confirm Reset' : 'Apply to Roster'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Submission Review Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0A3A7A] border border-blue-200 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Review &amp; Submit Attendance
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cohort {activeBatch?.code} • {formattedSelectedDate}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total Enrolled:</span>
                <span className="font-bold text-slate-900">{totalStudents}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-emerald-700 font-medium">Present:</span>
                <span className="font-bold text-emerald-800">{presentCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-amber-700 font-medium">Late:</span>
                <span className="font-bold text-amber-800">{lateCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-indigo-700 font-medium">Excused:</span>
                <span className="font-bold text-indigo-800">{excusedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-rose-700 font-medium">Absent:</span>
                <span className="font-bold text-rose-800">{absentCount}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold">
                <span className="text-slate-700">Presence Turnout:</span>
                <span className="text-[#0A3A7A]">{attendancePercent}%</span>
              </div>
            </div>

            {sessionTopic && (
              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-700 block text-[11px]">Topic Covered:</span>
                <span className="text-slate-800">{sessionTopic}</span>
              </div>
            )}

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Once submitted, attendance marks will be permanently stored and reflected across the student portal and institutional compliance reports.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Back to Review
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmSubmit}
                className="px-5 py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Confirm &amp; Submit Records</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
