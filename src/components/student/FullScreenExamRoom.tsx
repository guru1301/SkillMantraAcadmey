'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Clock,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Check,
  X,
  FileCheck,
  AlertCircle,
  LogOut,
  Send,
  HelpCircle,
  ArrowLeft,
  Wifi,
  WifiOff,
  Loader2,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';
import { StudentQuizData, StudentQuizClientQuestion } from '@/lib/db/studentPortal';
import {
  submitStudentQuizAction,
  startStudentExamAction,
  saveStudentExamProgressAction,
  logStudentSecurityEventAction,
  SubmitQuizActionResult,
} from '@/app/actions/studentQuiz';
import { SecurityEventType } from '@/lib/api/proctoring';

interface FullScreenExamRoomProps {
  quizData: StudentQuizData;
}

export default function FullScreenExamRoom({ quizData }: FullScreenExamRoomProps) {
  const router = useRouter();
  const { assessment, questions, submission, isUpcoming, isExpired } = quizData;

  // 1. Answers state: hydrated from backend in-progress submission or local cache
  const [answers, setAnswers] = useState<Record<string, number>>(() => {
    if (submission?.answers && Object.keys(submission.answers).length > 0) {
      return submission.answers;
    }
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`exam_cache_${assessment.id}`);
        if (cached) return JSON.parse(cached);
      } catch {
        // ignore storage parse error
      }
    }
    return {};
  });

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [violationsCount, setViolationsCount] = useState<number>(submission ? 0 : 0);
  const [warningToast, setWarningToast] = useState<string | null>(null);
  const [showExitFullscreenPrompt, setShowExitFullscreenPrompt] = useState(false);
  const [confirmSubmitModal, setConfirmSubmitModal] = useState(false);
  const [confirmRulesChecked, setConfirmRulesChecked] = useState(false);
  const [fullscreenDeniedModal, setFullscreenDeniedModal] = useState(false);

  // Policy warning dialog (tier 1, 2, or flagged)
  const [policyAlert, setPolicyAlert] = useState<{
    level: 'warning_1' | 'warning_2' | 'flagged';
    message: string;
    duration?: number;
  } | null>(null);

  // Network & Save Status
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const [examQuestions, setExamQuestions] = useState<StudentQuizClientQuestion[]>(questions);
  const [startError, setStartError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  const terminalStatus =
    submission?.status === 'evaluated' ||
    submission?.status === 'submitted' ||
    submission?.status === 'pending_review';

  // Exam phase
  const [examStarted, setExamStarted] = useState<boolean>(() => terminalStatus);
  const [isCompleted, setIsCompleted] = useState<boolean>(() => terminalStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer: Duration in seconds
  const totalSeconds = (assessment.durationMinutes || 30) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);

  // Evaluation results state (if submitted)
  const [evalResult, setEvalResult] = useState<Extract<SubmitQuizActionResult, { success: true }> | null>(null);

  const currentQ: StudentQuizClientQuestion | undefined = examQuestions[currentQIndex];

  // Tracking references for durations, sequential numbering, and concurrency version
  const eventSeqRef = useRef<number>(1);
  const blurStartTimeRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const serverVersionRef = useRef<number>(submission?.version ?? 1);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Request browser Fullscreen API
  const enterFullScreen = useCallback(async (): Promise<boolean> => {
    try {
      const docEl = document.documentElement as any;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }

      const doc = document as any;
      const isFs = Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );

      if (isFs) {
        setShowExitFullscreenPrompt(false);
        setFullscreenDeniedModal(false);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Fullscreen entry rejected or unsupported:', err);
      return false;
    }
  }, []);

  const exitFullScreen = useCallback(async () => {
    try {
      const doc = document as any;
      if (doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement) {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Centralized security event reporter with stable idempotency key
  const reportSecurityEvent = useCallback(
    async (
      eventType: SecurityEventType,
      durationSeconds: number = 0.0,
      metadata: Record<string, any> = {}
    ) => {
      const seq = eventSeqRef.current++;
      // Stable idempotency key: deterministic per event occurrence to ensure backend deduplication works on retries
      const idempotencyKey = `${assessment.id}-seq${seq}-${eventType}`;
      const payloadMeta = {
        ...metadata,
        question_index: currentQIndex,
        time_remaining: secondsRemaining,
        answered_count: Object.keys(answers).length,
      };

      try {
        const res = await logStudentSecurityEventAction({
          assessmentId: assessment.id,
          eventType,
          sequenceNumber: seq,
          durationSeconds,
          metadata: payloadMeta,
          idempotencyKey,
        });

        if (res.success) {
          const { violations_count, security_level, policy_warning } = res.data;
          setViolationsCount(violations_count);

          if (policy_warning && security_level !== 'normal') {
            setPolicyAlert({
              level: security_level,
              message: policy_warning,
              duration: durationSeconds,
            });
          }
        }
      } catch (err) {
        console.warn('Could not transmit security event to backend (persisted locally):', eventType);
      }
    },
    [assessment.id, currentQIndex, secondsRemaining, answers]
  );

  // Background auto-save sync with optimistic concurrency control and deadline enforcement
  const syncAnswersWithBackend = useCallback(
    async (currentAnswers: Record<string, number>) => {
      setIsSaving(true);
      try {
        // 1. LocalStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(`exam_cache_${assessment.id}`, JSON.stringify(currentAnswers));
        }

        // 2. Server Action
        const res = await saveStudentExamProgressAction({
          assessmentId: assessment.id,
          answers: currentAnswers,
          violationsCount,
          expectedVersion: serverVersionRef.current,
        });

        if (res.success) {
          if (res.data.conflict) {
            // Reconcile server answers if a newer version exists:
            // Authoritative server state takes precedence over stale local state
            serverVersionRef.current = res.data.version;
            if (res.data.answers && Object.keys(res.data.answers).length > 0) {
              setAnswers((prev) => ({ ...prev, ...(res.data.answers || {}) }));
            }
          } else {
            serverVersionRef.current = res.data.version;
            setLastSavedAt(new Date());
          }

          // Authoritative server timer synchronization
          if (typeof res.data.seconds_remaining === 'number' && res.data.seconds_remaining >= 0) {
            setSecondsRemaining(res.data.seconds_remaining);
          }
        }
      } catch (err) {
        console.warn('Auto-save network blip (persisted locally in browser):', err);
      } finally {
        setIsSaving(false);
      }
    },
    [assessment.id, violationsCount]
  );

  // Start exam handler
  const handleBeginExam = async () => {
    if (isStarting) return;
    if (!confirmRulesChecked) {
      alert('Please check the confirmation box acknowledging the examination security rules.');
      return;
    }

    setStartError(null);
    const granted = await enterFullScreen();
    if (!granted) {
      setFullscreenDeniedModal(true);
      return;
    }

    setIsStarting(true);
    try {
      const startRes = await startStudentExamAction(assessment.id);
      if (!startRes.success) {
        await exitFullScreen();
        setFullscreenDeniedModal(false);
        setShowExitFullscreenPrompt(false);
        setStartError(startRes.error || 'Failed to start the examination. Please verify the test window and try again.');
        return;
      }

      if (startRes.data.status !== 'in_progress') {
        await exitFullScreen();
        setFullscreenDeniedModal(false);
        setShowExitFullscreenPrompt(false);
        if (
          startRes.data.status === 'evaluated' ||
          startRes.data.status === 'submitted' ||
          startRes.data.status === 'pending_review'
        ) {
          setIsCompleted(true);
        } else {
          setStartError('This examination session could not be initialized.');
        }
        return;
      }

      if (Array.isArray(startRes.data.questions) && startRes.data.questions.length > 0) {
        setExamQuestions(startRes.data.questions);
      }
      if (startRes.data.version) {
        serverVersionRef.current = startRes.data.version;
      }
      if (typeof startRes.data.seconds_remaining === 'number' && startRes.data.seconds_remaining >= 0) {
        setSecondsRemaining(startRes.data.seconds_remaining);
      }
      if (startRes.data.restored_answers && Object.keys(startRes.data.restored_answers).length > 0) {
        setAnswers((prev) => ({ ...prev, ...startRes.data.restored_answers }));
      }
      setViolationsCount(startRes.data.violations_count || 0);
    } catch (err: any) {
      await exitFullScreen();
      setFullscreenDeniedModal(false);
      setShowExitFullscreenPrompt(false);
      setStartError(err?.message || 'Unable to start the examination. Please try again.');
      return;
    } finally {
      setIsStarting(false);
    }

    setExamStarted(true);
    setShowExitFullscreenPrompt(false);
    setFullscreenDeniedModal(false);
  };

  // =========================================================
  // 1. UNIFIED PROCTORING & INTEGRITY EVENT MONITOR
  // =========================================================
  useEffect(() => {
    if (!examStarted || isCompleted) return;

    // A. Fullscreen State Monitoring
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isStillFullscreen = Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );

      if (!isStillFullscreen && assessment.antiCheatEnabled) {
        blurStartTimeRef.current = Date.now();
        setShowExitFullscreenPrompt(true);
        reportSecurityEvent('FULLSCREEN_EXIT', 0, { trigger: 'fullscreen_escaped' });
      } else if (isStillFullscreen) {
        setShowExitFullscreenPrompt(false);
        if (blurStartTimeRef.current) {
          const awaySecs = (Date.now() - blurStartTimeRef.current) / 1000;
          blurStartTimeRef.current = null;
          reportSecurityEvent('EXAM_RESUMED', awaySecs, { restored_from: 'fullscreen' });
        }
      }
    };

    // B. Tab Visibility Monitoring
    const handleVisibilityChange = () => {
      if (!assessment.antiCheatEnabled) return;

      if (document.visibilityState === 'hidden') {
        blurStartTimeRef.current = Date.now();
        reportSecurityEvent('TAB_HIDDEN', 0, { trigger: 'tab_switched_or_minimized' });
      } else if (document.visibilityState === 'visible') {
        if (blurStartTimeRef.current) {
          const awaySecs = (Date.now() - blurStartTimeRef.current) / 1000;
          blurStartTimeRef.current = null;
          reportSecurityEvent('EXAM_RESUMED', awaySecs, { restored_from: 'tab_visible' });
        }
      }
    };

    // C. Window Blur (External application focus switch)
    const handleWindowBlur = () => {
      if (!assessment.antiCheatEnabled) return;
      if (!blurStartTimeRef.current) {
        blurStartTimeRef.current = Date.now();
      }
      reportSecurityEvent('WINDOW_BLUR', 0, { trigger: 'os_window_focus_lost' });
    };

    const handleWindowFocus = () => {
      if (!assessment.antiCheatEnabled) return;
      if (blurStartTimeRef.current) {
        const awaySecs = (Date.now() - blurStartTimeRef.current) / 1000;
        blurStartTimeRef.current = null;
        reportSecurityEvent('EXAM_RESUMED', awaySecs, { restored_from: 'window_focus' });
      }
    };

    // D. Page Hide
    const handlePageHide = () => {
      reportSecurityEvent('PAGE_HIDDEN', 0, { trigger: 'pagehide' });
    };

    // E. Network Status Monitoring
    const handleOnline = () => {
      setIsOnline(true);
      reportSecurityEvent('CONNECTION_RESTORED', 0);
      syncAnswersWithBackend(answersRef.current);
    };

    const handleOffline = () => {
      setIsOnline(false);
      reportSecurityEvent('CONNECTION_LOST', 0);
    };

    // F. Prevent Accidental Page Close / Refresh
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    // G. Clipboard & Right Click Protection
    const handleCopyCutPaste = (e: ClipboardEvent) => {
      if (!assessment.antiCheatEnabled) return;
      e.preventDefault();
      setWarningToast('Clipboard operations (copy/cut/paste) are disabled during the examination.');
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (!assessment.antiCheatEnabled) return;
      e.preventDefault();
      setWarningToast('Right-click context menu is prohibited.');
    };

    // Register all listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('copy', handleCopyCutPaste);
    document.addEventListener('cut', handleCopyCutPaste);
    document.addEventListener('paste', handleCopyCutPaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('copy', handleCopyCutPaste);
      document.removeEventListener('cut', handleCopyCutPaste);
      document.removeEventListener('paste', handleCopyCutPaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [examStarted, isCompleted, assessment.antiCheatEnabled, reportSecurityEvent, syncAnswersWithBackend]);

  // Warning Toast auto-clear
  useEffect(() => {
    if (!warningToast) return;
    const timer = setTimeout(() => setWarningToast(null), 3500);
    return () => clearTimeout(timer);
  }, [warningToast]);

  // =========================================================
  // 2. TIMED COUNTDOWN WITH CONTROLLED SUBMISSION
  // =========================================================
  useEffect(() => {
    if (!examStarted || isCompleted) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, isCompleted]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  };

  // Option selection with immediate local cache + debounced server auto-save
  const handleSelectOption = (qId: string, optionIndex: number) => {
    if (isCompleted) return;
    const nextAnswers = { ...answers, [qId]: optionIndex };
    setAnswers(nextAnswers);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`exam_cache_${assessment.id}`, JSON.stringify(nextAnswers));
      } catch {
        // ignore storage error
      }
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      syncAnswersWithBackend(nextAnswers);
    }, 800);
  };

  const handleClearAnswer = (qId: string) => {
    if (isCompleted) return;
    const nextAnswers = { ...answers };
    delete nextAnswers[qId];
    setAnswers(nextAnswers);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`exam_cache_${assessment.id}`, JSON.stringify(nextAnswers));
      } catch {
        // ignore
      }
    }

    syncAnswersWithBackend(nextAnswers);
  };

  // =========================================================
  // 3. KEYBOARD NAVIGATION SUPPORT
  // =========================================================
  useEffect(() => {
    if (!examStarted || isCompleted) return;

    const handleKeyNav = (e: KeyboardEvent) => {
      if (showExitFullscreenPrompt || confirmSubmitModal || policyAlert) return;

      if (
        (e.ctrlKey || e.metaKey) &&
        ['c', 'C', 'v', 'V', 'x', 'X', 'u', 'U', 'p', 'P', 's', 'S'].includes(e.key)
      ) {
        e.preventDefault();
        setWarningToast('Copying, pasting, and source viewing are prohibited.');
        return;
      }

      if (e.key === 'F12') {
        e.preventDefault();
        setWarningToast('Developer tools inspection is blocked.');
        return;
      }

      // Option selection shortcuts: 1-4 or A-D
      if (currentQ) {
        const k = e.key.toUpperCase();
        let selectedIdx: number | null = null;
        if (['1', 'A'].includes(k)) selectedIdx = 0;
        else if (['2', 'B'].includes(k)) selectedIdx = 1;
        else if (['3', 'C'].includes(k)) selectedIdx = 2;
        else if (['4', 'D'].includes(k)) selectedIdx = 3;

        if (selectedIdx !== null && selectedIdx < currentQ.options.length) {
          e.preventDefault();
          handleSelectOption(currentQ.id, selectedIdx);
          return;
        }
      }

      // Question navigation: Left / Right Arrows
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentQIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentQIndex((prev) => Math.min(examQuestions.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyNav);
    return () => window.removeEventListener('keydown', handleKeyNav);
  }, [examStarted, isCompleted, currentQ, examQuestions.length, showExitFullscreenPrompt, confirmSubmitModal, policyAlert]);

  // =========================================================
  // 4. FINAL SUBMISSION HANDLER
  // =========================================================
  const handleFinalSubmit = async () => {
    if (isSubmitting || isCompleted) return;
    setIsSubmitting(true);
    setConfirmSubmitModal(false);

    try {
      const res = await submitStudentQuizAction({
        assessmentId: assessment.id,
        answers,
        violationsCount,
      });

      if (res.success) {
        setEvalResult(res);
        setViolationsCount(res.violationsCount);
        setIsCompleted(true);
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(`exam_cache_${assessment.id}`);
          } catch {
            // ignore
          }
        }
      } else {
        alert(res.error || 'Failed to submit examination. Please try again.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error occurred during final submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = examQuestions.length - answeredCount;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Flexible Window';
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

  // =========================================================
  // VIEW 1: QUIZ UPCOMING OR EXPIRED NOTICES
  // =========================================================
  if (isUpcoming && !isCompleted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex items-center justify-center p-6 antialiased">
        <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60">
              Exam Scheduled
            </span>
            <h2 className="text-xl font-black text-slate-900 pt-2">{assessment.title}</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              This examination has not yet opened. Please return during the scheduled window:
            </p>
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800">
              Starts: {formatDate(assessment.startTime)}
            </div>
          </div>
          <button
            onClick={() => router.push('/student/tests')}
            className="w-full py-3 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Assessments</span>
          </button>
        </div>
      </div>
    );
  }

  if (isExpired && !isCompleted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex items-center justify-center p-6 antialiased">
        <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full border border-rose-200/60">
              Exam Window Closed
            </span>
            <h2 className="text-xl font-black text-slate-900 pt-2">{assessment.title}</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              The submission deadline for this exam has passed:
            </p>
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-rose-700">
              Deadline: {formatDate(assessment.deadline)}
            </div>
          </div>
          <button
            onClick={() => router.push('/student/tests')}
            className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Assessments</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // VIEW 2: PRE-EXAM FULLSCREEN LAUNCH GATE
  // =========================================================
  if (!examStarted && !isCompleted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between p-6 sm:p-10 select-none antialiased">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-5 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs">
              <Image
                src="/images/brand/logo.png"
                alt="SkillThinker Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#0A3A7A]">
                SkillThinker Assessment Center
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Secure Proctored Examination Terminal
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/student/tests')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Assessments</span>
          </button>
        </div>

        {/* Center Instructions Card */}
        <div className="max-w-3xl mx-auto w-full my-auto py-8 space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#0A3A7A] bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-md">
                {assessment.batchCode}
              </span>
              <span className="text-xs text-slate-500 font-medium">{assessment.programName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {assessment.title}
            </h1>
            {assessment.description && (
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                {assessment.description}
              </p>
            )}
          </div>

          {/* Exam Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0A3A7A]" />
                <span>Duration</span>
              </div>
              <div className="text-lg font-black text-slate-900 mt-1">
                {assessment.durationMinutes} Mins
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Questions</span>
              </div>
              <div className="text-lg font-black text-slate-900 mt-1">
                {assessment.questionsCount ?? examQuestions.length} Questions
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>Total Marks</span>
              </div>
              <div className="text-lg font-black text-slate-900 mt-1">
                {assessment.totalMarks} Marks
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Passing Mark</span>
              </div>
              <div className="text-lg font-black text-slate-900 mt-1">
                {assessment.passingMarks} Marks
              </div>
            </div>
          </div>

          {/* Mandatory Secure Examination Rules */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3.5 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Mandatory Fullscreen & Integrity Rules</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <Maximize2 className="w-4 h-4 text-[#0A3A7A] shrink-0 mt-0.5" />
                <span>
                  <strong>Full Screen Terminal:</strong> The examination occupies your entire screen. Browser tabs, address bars, and OS controls remain hidden throughout.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Tab & Focus Monitoring:</strong> Switching tabs, minimizing the browser, or opening other apps is monitored and recorded as an integrity flag.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <CheckCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Automatic Answer Saving:</strong> Every response is saved in real time. If your network temporarily drops, answers are saved locally and resynced upon reconnecting.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Timer Countdown:</strong> When the countdown reaches 00:00, your current answers are automatically evaluated and submitted safely.
                </span>
              </div>
            </div>
          </div>

          {/* Student Confirmation Checkbox */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/70 flex items-start gap-3">
            <input
              type="checkbox"
              id="confirmRules"
              checked={confirmRulesChecked}
              onChange={(e) => setConfirmRulesChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#0A3A7A] border-slate-300 focus:ring-[#0A3A7A] cursor-pointer"
            />
            <label htmlFor="confirmRules" className="text-xs text-slate-800 font-medium cursor-pointer leading-relaxed">
              I confirm that I have read the examination integrity instructions. I agree to complete the assessment in uninterrupted Fullscreen mode without switching browser tabs or applications.
            </label>
          </div>

          {/* Error Banner if POST /start fails */}
          {startError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{startError}</span>
            </div>
          )}

          {/* Launch CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-4 justify-between border-t border-slate-200/80">
            <div className="text-xs text-slate-500">
              Ensure a stable environment. Click below to lock into fullscreen examination mode.
            </div>
            <button
              onClick={handleBeginExam}
              disabled={!confirmRulesChecked || isStarting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Maximize2 className="w-4 h-4" />}
              <span>{isStarting ? 'Starting Exam...' : 'Enter Full Screen & Start Exam'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-400 pb-2">
          SkillThinker • Secure Institutional Examination Terminal
        </div>

        {/* Fullscreen Denied Guidance Modal */}
        {fullscreenDeniedModal && (
          <div className="fixed inset-0 z-[10003] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white border border-amber-200 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                <Maximize2 className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-900">
                  Browser Fullscreen Required
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your browser did not enter full-screen mode. Secure Exam Mode requires full-screen access to conceal external tabs and guarantee assessment integrity.
                </p>
                <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  Please click <strong>&quot;Allow Full Screen&quot;</strong> below and approve any browser prompt to proceed.
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFullscreenDeniedModal(false)}
                  className="w-1/2 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBeginExam}
                  className="w-1/2 py-3 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Allow Full Screen</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // VIEW 3: POST-SUBMISSION SCORECARD & REVIEW
  // =========================================================
  if (isCompleted) {
    const finalScore = evalResult?.score ?? submission?.score ?? 0;
    const finalTotalMarks = evalResult?.totalMarks ?? assessment.totalMarks;
    const finalPercentage = evalResult?.percentage ?? Math.round((finalScore / finalTotalMarks) * 100);
    const submissionStatus = evalResult?.status ?? submission?.status ?? 'evaluated';
    const isPendingReview = submissionStatus === 'pending_review';
    const isPassed = isPendingReview ? false : (evalResult?.isPassed ?? (finalScore >= assessment.passingMarks));
    const reviewList = evalResult?.review || [];

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col p-4 sm:p-8 select-text antialiased">
        <div className="max-w-4xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
            <div>
              <div className={`text-[11px] font-bold uppercase tracking-wider ${
                isPendingReview ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                {isPendingReview ? 'Submitted — Pending Instructor Review' : 'Exam Completed & Evaluated'}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {assessment.title}
              </h1>
            </div>
            <button
              onClick={async () => {
                await exitFullScreen();
                router.push('/student/tests');
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit to Portal</span>
            </button>
          </div>

          {/* Score Banner */}
          <div className={`p-6 sm:p-8 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xs ${
            isPendingReview
              ? 'bg-amber-50/70 border-amber-200/80 text-amber-950'
              : isPassed
              ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
              : 'bg-rose-50/70 border-rose-200/80 text-rose-950'
          }`}>
            <div className="flex items-center gap-5 text-center sm:text-left">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border ${
                isPendingReview
                  ? 'bg-amber-100 border-amber-300 text-amber-700'
                  : isPassed
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                  : 'bg-rose-100 border-rose-300 text-rose-700'
              }`}>
                {isPendingReview ? <ShieldAlert className="w-8 h-8" /> : isPassed ? <Award className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
              </div>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md border ${
                  isPendingReview
                    ? 'bg-amber-100/80 border-amber-300 text-amber-800'
                    : isPassed
                    ? 'bg-emerald-100/80 border-emerald-300 text-emerald-800'
                    : 'bg-rose-100/80 border-rose-300 text-rose-800'
                }`}>
                  {isPendingReview ? 'Pending Review' : isPassed ? 'Passed Examination' : 'Needs Retest'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  {finalScore} <span className="text-sm font-normal text-slate-500">/ {finalTotalMarks} Marks</span>
                </h2>
                <div className="text-xs text-slate-600 mt-0.5">
                  Score: <strong className="text-slate-900">{finalPercentage}%</strong> (Passing requirement: {assessment.passingMarks} Marks)
                </div>
              </div>
            </div>

            <div className="text-right flex sm:flex-col items-center sm:items-end gap-1.5 text-xs text-slate-500">
              <div>Integrity Flags: <strong className="text-slate-800">{violationsCount}</strong></div>
              <div className="text-[11px]">Submission: Authenticated & Archived</div>
            </div>
          </div>

          {/* Question-by-Question Review */}
          {reviewList.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#0A3A7A]" />
                <span>{evalResult?.answersReleased ? 'Question Evaluation & Answer Key' : 'Recorded Responses (Answer Key Released After Deadline)'}</span>
              </h3>

              <div className="space-y-3">
                {reviewList.map((item, idx) => {
                  const hasKey = item.correctOptionIndex !== null && item.correctOptionIndex !== undefined;
                  return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl border transition-all bg-white shadow-2xs ${
                      !hasKey
                        ? 'border-slate-200'
                        : item.isCorrect
                        ? 'border-emerald-200'
                        : 'border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-500">
                            Q{idx + 1}
                          </span>
                          {hasKey ? (
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                              item.isCorrect
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {item.isCorrect ? `Correct (+${item.points})` : 'Incorrect (0)'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border bg-slate-50 text-slate-600 border-slate-200">
                              Recorded ({item.points} pt)
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-900">{item.question}</p>
                      </div>
                    </div>

                    {/* Options list */}
                    <div className="grid sm:grid-cols-2 gap-2 mt-4 text-xs">
                      {item.options.map((opt, oIdx) => {
                        const isStudentChoice = item.selectedOptionIndex === oIdx;
                        const isCorrectAnswer = hasKey && item.correctOptionIndex === oIdx;

                        let style = 'bg-slate-50 border-slate-200 text-slate-700';
                        if (isCorrectAnswer) {
                          style = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold';
                        } else if (hasKey && isStudentChoice && !item.isCorrect) {
                          style = 'bg-rose-50 border-rose-300 text-rose-800 line-through';
                        } else if (!hasKey && isStudentChoice) {
                          style = 'bg-blue-50 border-blue-300 text-slate-900 font-semibold';
                        }

                        return (
                          <div
                            key={oIdx}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${style}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-white border border-slate-200 flex items-center justify-center font-mono font-bold text-[10px] text-slate-700">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span>{opt}</span>
                            </div>
                            {isCorrectAnswer && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                            {hasKey && isStudentChoice && !item.isCorrect && (
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            )}
                            {!hasKey && isStudentChoice && (
                              <Check className="w-4 h-4 text-[#0A3A7A] shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {hasKey && item.explanation && (
                      <div className="mt-3 p-3 rounded-xl bg-blue-50/60 border border-blue-200/50 text-xs text-slate-700 leading-relaxed">
                        <strong className="text-[#0A3A7A]">Explanation: </strong>
                        {item.explanation}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Back Button */}
          <div className="pt-4 flex justify-end pb-12">
            <button
              onClick={async () => {
                await exitFullScreen();
                router.push('/student/tests');
              }}
              className="px-6 py-3 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Return to Assessments List</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // VIEW 4: ACTIVE FULLSCREEN PROCTORED EXAM
  // =========================================================
  return (
    <div className="fixed inset-0 z-[9999] bg-[#F8FAFC] text-slate-900 flex flex-col select-none overflow-hidden antialiased">
      {/* Network Offline Warning Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 shrink-0 animate-pulse">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            Network connection lost. Your responses are safely cached locally. Please do not close or refresh this tab while we reconnect.
          </span>
        </div>
      )}

      {/* 1. TOP PROCTORING HEADER */}
      <header className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200/90 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0A3A7A] flex items-center justify-center font-black text-white shadow-2xs">
            SM
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 truncate max-w-[180px] sm:max-w-md">
              {assessment.title}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-2">
              <span className="font-mono font-bold text-slate-600">{assessment.batchCode}</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Fullscreen Locked
              </span>
              <span>•</span>
              {isSaving ? (
                <span className="text-slate-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-[#0A3A7A]" />
                  Saving...
                </span>
              ) : lastSavedAt ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" />
                  Auto-saved
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Center Countdown Timer */}
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border font-mono font-bold text-sm shadow-2xs transition-colors ${
          secondsRemaining < 300
            ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
            : 'bg-white text-slate-800 border-slate-200/90'
        }`}>
          <Clock className={`w-4 h-4 ${secondsRemaining < 300 ? 'text-rose-600' : 'text-[#0A3A7A]'}`} />
          <span>{formatTimer(secondsRemaining)}</span>
        </div>

        {/* Right Actions & Violations Counter */}
        <div className="flex items-center gap-3">
          {violationsCount > 0 ? (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>{violationsCount} Flag{violationsCount > 1 ? 's' : ''}</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Clean Session</span>
            </div>
          )}

          <button
            onClick={() => setConfirmSubmitModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#059669] hover:bg-[#047857] text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Exam</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN BODY (LEFT: QUESTION WORKSPACE, RIGHT: QUESTION PALETTE) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col justify-between max-w-4xl mx-auto w-full">
          {currentQ ? (
            <div className="space-y-6">
              {/* Question Header & Marks */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#0A3A7A] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/50">
                    Question {currentQIndex + 1} of {examQuestions.length}
                  </span>
                  <span className="text-slate-500 font-medium">
                    ({currentQ.points} {currentQ.points === 1 ? 'Mark' : 'Marks'})
                  </span>
                </div>

                {answers[currentQ.id] !== undefined && (
                  <button
                    onClick={() => handleClearAnswer(currentQ.id)}
                    className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 underline cursor-pointer"
                  >
                    Clear Response
                  </button>
                )}
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                {currentQ.question}
              </div>

              {/* Options */}
              <div className="space-y-3 pt-2">
                {currentQ.options.map((opt, oIndex) => {
                  const isSelected = answers[currentQ.id] === oIndex;
                  return (
                    <button
                      key={oIndex}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, oIndex)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/70 border-[#0A3A7A] text-slate-900 shadow-2xs ring-1 ring-[#0A3A7A]'
                          : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-800 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className={`w-8 h-8 rounded-xl font-mono font-bold text-xs flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-[#0A3A7A] text-white border-[#0A3A7A]'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {String.fromCharCode(65 + oIndex)}
                        </span>
                        <span className="text-xs sm:text-sm font-medium">{opt}</span>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-[#0A3A7A] bg-[#0A3A7A] text-white'
                          : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Keyboard shortcuts helper note */}
              <div className="text-[11px] text-slate-400 font-mono">
                Keyboard shortcuts: Press <strong>A-D</strong> (or <strong>1-4</strong>) to select options · <strong>← / →</strong> for navigation
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">No questions available.</div>
          )}

          {/* Bottom Navigation */}
          <div className="pt-8 border-t border-slate-200/80 flex items-center justify-between gap-4">
            <button
              onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQIndex === 0}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200/90 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="text-xs text-slate-500 font-medium">
              Answered: <strong className="text-slate-900">{answeredCount}</strong> of {examQuestions.length}
            </div>

            {currentQIndex < examQuestions.length - 1 ? (
              <button
                onClick={() => setCurrentQIndex((prev) => prev + 1)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0A3A7A] hover:bg-[#062F68] text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setConfirmSubmitModal(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#059669] hover:bg-[#047857] text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Review & Submit</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </main>

        {/* Question Palette Sidebar */}
        <aside className="w-72 bg-white border-l border-slate-200/90 p-5 hidden lg:flex flex-col justify-between shrink-0 shadow-2xs">
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Question Palette</span>
              <span className="text-[11px] font-mono font-bold text-[#0A3A7A]">{answeredCount}/{examQuestions.length}</span>
            </div>

            <div className="grid grid-cols-5 gap-2 max-h-[50vh] overflow-y-auto pr-1">
              {examQuestions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === currentQIndex;

                let btnClass = 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';
                if (isAnswered) {
                  btnClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
                }
                if (isCurrent) {
                  btnClass = 'bg-[#0A3A7A] text-white border-[#0A3A7A] font-black ring-2 ring-blue-300';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-9 rounded-xl border text-xs font-mono transition-all flex items-center justify-center cursor-pointer ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-4 border-t border-slate-200/80 space-y-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-50 border border-emerald-300" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-200" />
                <span>Unanswered ({unansweredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-[#0A3A7A]" />
                <span>Active Question</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/80 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full Screen Proctoring Active</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Violations: {violationsCount}
            </div>
          </div>
        </aside>
      </div>

      {/* 3. WARNING TOAST */}
      {warningToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10001] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-medium flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-bottom-5 border border-slate-800">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{warningToast}</span>
          <button
            onClick={() => setWarningToast(null)}
            className="text-slate-400 hover:text-white ml-2 p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. FULLSCREEN EXITED BLOCKING PROMPT */}
      {showExitFullscreenPrompt && (
        <div className="fixed inset-0 z-[10002] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-rose-200 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">
                Full Screen Mode Required
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                You have exited Fullscreen mode. Per examination integrity rules, you cannot view other browser tabs or external windows during the assessment.
              </p>
              <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-mono font-bold text-rose-700">
                Malpractice Flags Recorded: {violationsCount}
              </div>
            </div>
            <button
              onClick={enterFullScreen}
              className="w-full py-3.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Return to Full Screen & Resume Exam</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. POLICY WARNING MODAL (TIER 1, 2, OR FLAGGED) */}
      {policyAlert && (
        <div className="fixed inset-0 z-[10003] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-in zoom-in-95 border ${
            policyAlert.level === 'flagged'
              ? 'border-rose-300'
              : 'border-amber-300'
          }`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border ${
              policyAlert.level === 'flagged'
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}>
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md border ${
                policyAlert.level === 'flagged'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {policyAlert.level === 'flagged' ? 'Security Review Flag' : 'Integrity Notice'}
              </span>
              <h3 className="text-lg font-black text-slate-900 pt-1">
                {policyAlert.level === 'flagged'
                  ? 'Session Flagged for Review'
                  : 'Focus Loss Detected'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {policyAlert.message}
              </p>
              {policyAlert.duration && policyAlert.duration > 0 ? (
                <div className="mt-2 text-[11px] font-mono text-slate-500">
                  Time elapsed outside terminal: {roundDuration(policyAlert.duration)}s
                </div>
              ) : null}
            </div>
            <button
              onClick={() => setPolicyAlert(null)}
              className="w-full py-3 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              I Understand & Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* 6. CONFIRM SUBMISSION MODAL */}
      {confirmSubmitModal && (
        <div className="fixed inset-0 z-[10002] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-xl animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Submit Examination?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your answers will be evaluated and officially archived.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Questions Answered:</span>
                <strong className="text-emerald-700">{answeredCount} of {examQuestions.length}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Unanswered:</span>
                <strong className={unansweredCount > 0 ? 'text-amber-700' : 'text-slate-500'}>
                  {unansweredCount}
                </strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Time Remaining:</span>
                <strong className="text-[#0A3A7A]">{formatTimer(secondsRemaining)}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Integrity Flags:</span>
                <strong className={violationsCount > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                  {violationsCount}
                </strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSubmitModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Continue Exam
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#059669] hover:bg-[#047857] text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Evaluating...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function roundDuration(secs: number): string {
  return secs.toFixed(1);
}
