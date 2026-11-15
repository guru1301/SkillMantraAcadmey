'use client';

import React, { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileCheck,
  Calendar,
  Clock,
  Upload,
  Download,
  Shuffle,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Plus,
  Trash2,
  Users,
  Check,
  Building2,
  Eye,
  Sparkles,
  FileSpreadsheet,
  ShieldCheck,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { TrainerBatchItem } from '@/lib/db/trainerPortal';
import { TrainerAssessmentItem, TrainerAssessmentDetail } from '@/lib/db/trainerAssessments';
import { ExamProctoringLogItem } from '@/lib/api/proctoring';
import {
  parseQuizQuestionsFile,
  generateSampleQuizCSV,
  ParsedQuizQuestion,
} from '@/lib/quizParser';
import {
  createTrainerQuizAction,
  deleteTrainerQuizAction,
  getTrainerAssessmentDetailsAction,
  getExamProctoringLogsAction,
} from '@/app/actions/trainerQuizzes';

interface TrainerTestsClientProps {
  batches: TrainerBatchItem[];
  assessments: TrainerAssessmentItem[];
}

export default function TrainerTestsClient({
  batches,
  assessments: initialAssessments,
}: TrainerTestsClientProps) {
  const router = useRouter();
  const [assessments, setAssessments] = useState(initialAssessments);
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [batchId, setBatchId] = useState<string>(batches[0]?.id || '');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [passingPercentage, setPassingPercentage] = useState(60);

  // Schedule window (Start time & Deadline)
  const defaultStartTime = useMemo(() => {
    const now = new Date();
    // Round to next hour
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }, []);

  const defaultDeadline = useMemo(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 3);
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }, []);

  const [startTime, setStartTime] = useState(defaultStartTime);
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [antiCheatEnabled, setAntiCheatEnabled] = useState(true);

  // Questions state
  const [questions, setQuestions] = useState<ParsedQuizQuestion[]>([]);
  const [fileParseErrors, setFileParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState(false);

  // Form submission state
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filtered assessments list
  const filteredAssessments = useMemo(() => {
    if (selectedBatchFilter === 'all') return assessments;
    return assessments.filter((a) => a.batch_id === selectedBatchFilter);
  }, [assessments, selectedBatchFilter]);

  // Submissions & Proctoring Detail Inspection State
  const [inspectQuiz, setInspectQuiz] = useState<TrainerAssessmentItem | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectData, setInspectData] = useState<TrainerAssessmentDetail | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);

  // Proctoring Audit Trail Modal State
  const [selectedAuditStudent, setSelectedAuditStudent] = useState<{
    studentId: string;
    studentName: string;
    rollNumber: string;
    violationsCount: number;
  } | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<ExamProctoringLogItem[]>([]);
  const [auditSummary, setAuditSummary] = useState<any>(null);

  const handleOpenInspect = async (quiz: TrainerAssessmentItem) => {
    setInspectQuiz(quiz);
    setInspectLoading(true);
    setInspectError(null);
    setInspectData(null);
    setSelectedAuditStudent(null);
    try {
      const res = await getTrainerAssessmentDetailsAction(quiz.id);
      if (res.success && res.details) {
        setInspectData(res.details);
      } else {
        setInspectError(res.error || 'Failed to load submissions.');
      }
    } catch (err: any) {
      setInspectError(err.message || 'Error fetching submissions.');
    } finally {
      setInspectLoading(false);
    }
  };

  const handleOpenAuditLog = async (student: {
    student_id: string;
    full_name: string;
    roll_number: string;
    violations_count: number;
  }) => {
    if (!inspectQuiz) return;
    setSelectedAuditStudent({
      studentId: student.student_id,
      studentName: student.full_name,
      rollNumber: student.roll_number,
      violationsCount: student.violations_count,
    });
    setAuditLoading(true);
    setAuditLogs([]);
    try {
      const res = await getExamProctoringLogsAction(inspectQuiz.id, student.student_id);
      if (res.success && res.summary) {
        setAuditSummary(res.summary);
        setAuditLogs(res.summary.logs || []);
      }
    } catch {
      // keep empty
    } finally {
      setAuditLoading(false);
    }
  };

  // Handle CSV/Excel File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileParseErrors([]);
    setFormError(null);

    const buffer = await file.arrayBuffer();
    const result = parseQuizQuestionsFile(buffer);

    if (result.success && result.questions.length > 0) {
      setQuestions(result.questions);
      setFileParseErrors(result.errors);
    } else {
      setQuestions([]);
      setFileParseErrors(result.errors.length > 0 ? result.errors : ['Failed to parse questions from file.']);
    }
  };

  // Download Sample CSV
  const handleDownloadSampleCSV = () => {
    const csvContent = generateSampleQuizCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'skillthinker_sample_quiz_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit and Create Quiz
  const handleCreateQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Please enter a quiz title.');
      return;
    }

    if (questions.length === 0) {
      setFormError('Please upload questions via CSV or Excel file before scheduling.');
      return;
    }

    if (new Date(deadline) <= new Date(startTime)) {
      setFormError('The deadline must be set later than the exam start time.');
      return;
    }

    const totalMarks = questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const passingMarks = Math.round((passingPercentage / 100) * totalMarks);

    startTransition(async () => {
      const res = await createTrainerQuizAction({
        batchId,
        title: title.trim(),
        topic: topic.trim() || undefined,
        description: description.trim() || undefined,
        durationMinutes: Number(durationMinutes) || 20,
        totalMarks,
        passingMarks,
        startTime: new Date(startTime).toISOString(),
        deadline: new Date(deadline).toISOString(),
        shuffleQuestions,
        antiCheatEnabled,
        questions,
      });

      if (res.success && res.quizId) {
        setIsModalOpen(false);
        setSuccessToast(`Quiz "${title}" successfully scheduled! Students will see it in their portal.`);
        // Reset form
        setTitle('');
        setTopic('');
        setDescription('');
        setQuestions([]);
        setFileName(null);
        router.refresh();
      } else {
        setFormError(res.error || 'Failed to create quiz.');
      }
    });
  };

  // Delete Quiz
  const handleDeleteQuiz = (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? Student submissions will also be deleted.')) {
      return;
    }

    startTransition(async () => {
      const res = await deleteTrainerQuizAction(quizId);
      if (res.success) {
        setAssessments((prev) => prev.filter((a) => a.id !== quizId));
        setSuccessToast('Quiz deleted successfully.');
      } else {
        alert(res.error || 'Failed to delete quiz.');
      }
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Not set';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* 1. HEADER & ACTION BAR */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A3A7A] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
              Exam & Quiz Management
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              {assessments.length} Total Quizzes Scheduled
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Batch Quizzes & Assessments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Upload questions in CSV/Excel, randomize order per student, set start windows and strict anti-cheat countdown timers.
          </p>
        </div>

        {/* Schedule Quiz Button */}
        <button
          type="button"
          onClick={() => {
            setIsModalOpen(true);
            setFormError(null);
          }}
          className="px-4 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Quiz</span>
        </button>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-emerald-600 hover:text-emerald-800 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Tabs by Batch */}
      {batches.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Filter Cohort:</span>
          <button
            type="button"
            onClick={() => setSelectedBatchFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
              selectedBatchFilter === 'all'
                ? 'bg-[#0A3A7A] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Cohorts ({assessments.length})
          </button>
          {batches.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedBatchFilter(b.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                selectedBatchFilter === b.id
                  ? 'bg-[#0A3A7A] text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {b.code} ({assessments.filter((a) => a.batch_id === b.id).length})
            </button>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. QUIZZES LIST */}
      {/* ========================================================= */}
      {filteredAssessments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-xs">
          <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Quizzes Scheduled Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Upload question sets in Excel/CSV, set exam timings, and test your students with automated evaluations and anti-cheating lockdown.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#0A3A7A] text-white text-xs font-bold hover:bg-[#062F68] transition cursor-pointer"
          >
            Schedule First Quiz
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAssessments.map((quiz) => {
            const now = new Date();
            const startObj = quiz.start_time ? new Date(quiz.start_time) : null;
            const deadlineObj = quiz.deadline ? new Date(quiz.deadline) : null;

            const isUpcoming = startObj ? startObj > now : false;
            const isExpired = deadlineObj ? deadlineObj < now : false;
            const isActive = !isUpcoming && !isExpired;

            return (
              <div
                key={quiz.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Status & Batch Pill */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-[#0A3A7A] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {quiz.batch_code}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                        {quiz.college_name.split(' ')[0]}
                      </span>
                    </div>

                    {/* Active / Upcoming / Closed Badge */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : isUpcoming
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {isActive ? 'Active Now' : isUpcoming ? 'Upcoming' : 'Closed'}
                    </span>
                  </div>

                  {/* Title & Topic */}
                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {quiz.title}
                  </h3>
                  {quiz.topic && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      Topic: {quiz.topic}
                    </p>
                  )}

                  {/* Badges: Questions, Time, Anti-Cheat, Shuffle */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 font-semibold">
                      <FileCheck className="w-3 h-3 text-[#0A3A7A]" />
                      <span>{quiz.questions_count} Questions</span>
                    </span>

                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 font-semibold">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{quiz.duration_minutes} Mins</span>
                    </span>

                    {quiz.shuffle_questions && (
                      <span className="flex items-center gap-1 bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200/60 font-semibold">
                        <Shuffle className="w-3 h-3" />
                        <span>Shuffled</span>
                      </span>
                    )}

                    {quiz.anti_cheat_enabled && (
                      <span className="flex items-center gap-1 bg-rose-50 text-rose-800 px-2 py-0.5 rounded border border-rose-200/60 font-semibold">
                        <ShieldAlert className="w-3 h-3" />
                        <span>Lockdown Active</span>
                      </span>
                    )}
                  </div>

                  {/* Timing window info */}
                  <div className="mt-3 text-xs bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/60 space-y-1">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Opens:</span>
                      <span className="font-semibold text-slate-800">{formatDateTime(quiz.start_time)}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Deadline:</span>
                      <span className="font-semibold text-slate-800">{formatDateTime(quiz.deadline)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Submissions stats & Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-bold text-slate-900">{quiz.total_submissions}</span>
                    <span className="text-slate-500"> Submissions</span>
                    {quiz.average_score !== null && (
                      <span className="text-[11px] text-emerald-700 font-semibold ml-1.5">
                        (Avg: {quiz.average_score}%)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenInspect(quiz)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-[#0A3A7A] hover:bg-blue-100 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 border border-blue-200/60"
                      title="Review Submissions & Proctoring Integrity"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Submissions & Audit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete Quiz"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. SCHEDULE QUIZ MODAL WITH CSV / EXCEL UPLOAD */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0A3A7A] text-white flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Schedule Batch Quiz</h2>
                  <p className="text-[11px] text-slate-500">Upload questions via Excel or CSV with automated timing.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateQuiz} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Batch Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assign To Cohort *
                </label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0A3A7A]"
                  required
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} — {b.program_name} ({b.college_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title & Topic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Quiz Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Day 15: SQL Joins Assessment"
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0A3A7A]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Topic / Subject
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Relational Queries, JOINs, Grouping"
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0A3A7A]"
                  />
                </div>
              </div>

              {/* Timings: Start Time & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Exam Start Time *</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#0A3A7A]"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">When students can begin taking quiz</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Submission Deadline *</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#0A3A7A]"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">When the exam window strictly closes</span>
                </div>
              </div>

              {/* Duration & Passing marks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0A3A7A]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Passing Criteria (%) *
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={passingPercentage}
                    onChange={(e) => setPassingPercentage(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0A3A7A]"
                    required
                  />
                </div>
              </div>

              {/* Anti-Cheat & Shuffle Toggles */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#0A3A7A] rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                      <Shuffle className="w-3.5 h-3.5 text-purple-600" />
                      <span>Shuffle Questions per Student</span>
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Each student receives a randomized question order so adjacent students have different sequences.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={antiCheatEnabled}
                    onChange={(e) => setAntiCheatEnabled(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#0A3A7A] rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      <span>Strict Anti-Cheating Lockdown</span>
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Blocks Copy, Cut, Paste, Right-Click Inspect, and warns on tab/window switching during the exam.
                    </span>
                  </div>
                </label>
              </div>

              {/* ========================================================= */}
              {/* CSV / EXCEL QUESTION UPLOAD SECTION */}
              {/* ========================================================= */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Upload Questions (CSV or Excel) *
                  </label>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCSV}
                    className="text-xs font-bold text-[#0A3A7A] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Sample Template</span>
                  </button>
                </div>

                {/* Upload Dropzone */}
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center hover:border-[#0A3A7A]/50 transition bg-slate-50/40">
                  <input
                    type="file"
                    id="quiz-file-input"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="quiz-file-input" className="cursor-pointer block">
                    <FileSpreadsheet className="w-8 h-8 text-[#0A3A7A] mx-auto mb-2" />
                    <span className="text-xs font-bold text-slate-800 block">
                      {fileName ? fileName : 'Click to select CSV or Excel (.xlsx) file'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Columns: Question, Option A, Option B, Option C, Option D, Correct Option, Points
                    </span>
                  </label>
                </div>

                {/* Upload Success Badge & Errors */}
                {questions.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{questions.length} Questions successfully parsed & ready!</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewQuestions(!previewQuestions)}
                      className="text-xs font-bold text-emerald-900 underline cursor-pointer"
                    >
                      {previewQuestions ? 'Hide Preview' : 'Preview Questions'}
                    </button>
                  </div>
                )}

                {fileParseErrors.length > 0 && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 space-y-0.5">
                    {fileParseErrors.slice(0, 3).map((err, i) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                )}

                {/* Question Preview Drawer */}
                {previewQuestions && questions.length > 0 && (
                  <div className="mt-3 max-h-48 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/70 text-xs">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="p-2.5 rounded-lg bg-white border border-slate-200">
                        <div className="font-bold text-slate-900 mb-1">
                          #{idx + 1}. {q.question}
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                          {q.options.map((opt, optIdx) => (
                            <span
                              key={optIdx}
                              className={`px-2 py-0.5 rounded ${
                                optIdx === q.correctOptionIndex
                                  ? 'bg-emerald-100 font-bold text-emerald-800'
                                  : 'text-slate-600'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}: {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || questions.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Scheduling Quiz...</span>
                    </>
                  ) : (
                    <span>Publish & Schedule Quiz</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. SUBMISSIONS & PROCTORING AUDIT MODAL */}
      {/* ========================================================= */}
      {inspectQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0A3A7A] text-white flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{inspectQuiz.title}</h2>
                    <span className="font-mono text-[11px] font-bold text-[#0A3A7A] bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                      {inspectQuiz.batch_code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cohort Submissions, Automated Evaluation, and Anti-Cheat Proctoring Audit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInspectQuiz(null);
                  setInspectData(null);
                  setSelectedAuditStudent(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
              {inspectLoading ? (
                <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 text-[#0A3A7A] animate-spin" />
                  <span className="text-xs font-semibold">Loading student submissions & security metrics...</span>
                </div>
              ) : inspectError ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{inspectError}</span>
                </div>
              ) : !inspectData || inspectData.submissions.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-800">No Enrolled Students or Submissions</h4>
                  <p className="text-xs text-slate-400 mt-1">No student records exist for this cohort.</p>
                </div>
              ) : (
                <>
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Enrolled Cohort</div>
                      <div className="text-lg font-bold text-slate-900 mt-0.5">{inspectData.submissions.length} Students</div>
                    </div>
                    <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#0A3A7A]">Submitted</div>
                      <div className="text-lg font-bold text-[#0A3A7A] mt-0.5">
                        {inspectData.submissions.filter((s) => s.status === 'submitted' || s.status === 'evaluated').length}
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Clean Sessions</div>
                      <div className="text-lg font-bold text-emerald-700 mt-0.5">
                        {inspectData.submissions.filter((s) => s.violations_count === 0).length}
                      </div>
                    </div>
                    <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-100">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Flagged / Warned</div>
                      <div className="text-lg font-bold text-rose-700 mt-0.5">
                        {inspectData.submissions.filter((s) => s.violations_count > 0).length}
                      </div>
                    </div>
                  </div>

                  {/* Submissions Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                            <th className="py-3 px-4">Student</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3 text-center">Score</th>
                            <th className="py-3 px-3 text-center">Proctoring Status</th>
                            <th className="py-3 px-4 text-right">Audit Trail</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {inspectData.submissions.map((sub) => {
                            const isClean = sub.violations_count === 0;
                            const isWarning = sub.violations_count > 0 && sub.violations_count < 3;
                            const isFlagged = sub.violations_count >= 3;

                            return (
                              <tr key={sub.student_id} className="hover:bg-slate-50/70 transition">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-900">{sub.full_name}</div>
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    {sub.roll_number} {sub.department ? `• ${sub.department}` : ''}
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <span
                                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                      sub.status === 'evaluated'
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : sub.status === 'submitted'
                                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                        : sub.status === 'in_progress'
                                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                                    }`}
                                  >
                                    {sub.status.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {sub.score !== null ? (
                                    <span className="font-bold text-slate-800 font-mono">
                                      {sub.score} / {inspectQuiz.total_marks}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {isClean ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                      <span>Clean (0)</span>
                                    </span>
                                  ) : isWarning ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                                      <span>Warning ({sub.violations_count})</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                                      <span>Flagged ({sub.violations_count})</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAuditLog(sub)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-[#0A3A7A] hover:text-white text-slate-700 transition cursor-pointer"
                                  >
                                    Inspect Log
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setInspectQuiz(null);
                  setInspectData(null);
                  setSelectedAuditStudent(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. STUDENT PROCTORING AUDIT TRAIL TIMELINE MODAL */}
      {/* ========================================================= */}
      {selectedAuditStudent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Proctoring Audit: {selectedAuditStudent.studentName}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Roll #{selectedAuditStudent.rollNumber} • {selectedAuditStudent.violationsCount} Total Violations Logged
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Audit Logs List */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {auditLoading ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-[#0A3A7A] animate-spin" />
                  <span className="text-xs font-semibold">Retrieving proctoring events timeline...</span>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-800">Clean Examination Session</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    No tab switches, fullscreen exits, or focus blurs recorded for this student.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => {
                    const isViolation = ['TAB_HIDDEN', 'WINDOW_BLUR', 'FULLSCREEN_EXIT', 'PAGE_HIDDEN'].includes(
                      log.event_type
                    );

                    return (
                      <div
                        key={log.id}
                        className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                          isViolation
                            ? 'bg-rose-50/50 border-rose-200 text-rose-950'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-slate-400">
                              #{log.sequence_number}
                            </span>
                            <span
                              className={`font-mono text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                isViolation ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {log.event_type.replace('_', ' ')}
                            </span>
                          </div>
                          {log.duration_seconds > 0 && (
                            <div className="text-[11px] text-slate-600 font-medium">
                              Away duration: <span className="font-bold">{log.duration_seconds.toFixed(1)}s</span>
                            </div>
                          )}
                        </div>

                        <div className="text-right text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(log.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedAuditStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0A3A7A] hover:bg-[#062F68] text-white transition cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
