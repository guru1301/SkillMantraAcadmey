'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import {
  StudentQuizData,
  StudentQuizClientQuestion,
} from '@/lib/db/studentPortal';
import { submitStudentQuizAction } from '@/app/actions/studentQuiz';

interface QuizRoomModalProps {
  quizData: StudentQuizData;
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function QuizRoomModal({
  quizData,
  onClose,
  onSubmitted,
}: QuizRoomModalProps) {
  const { assessment, questions, submission } = quizData;

  // Answers state: questionId -> selectedOptionIndex (0, 1, 2, 3)
  const [answers, setAnswers] = useState<Record<string, number>>(() => {
    return submission?.answers || {};
  });

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [violationsCount, setViolationsCount] = useState(0);
  const [warningToast, setWarningToast] = useState<string | null>(null);

  // Timer: Duration in seconds
  const totalSeconds = (assessment.durationMinutes || 20) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(submission?.status === 'evaluated');

  // Evaluation results state
  const [evalResult, setEvalResult] = useState<{
    score: number;
    totalMarks: number;
    percentage: number;
    isPassed: boolean;
    review: Array<{
      id: string;
      question: string;
      options: string[];
      selectedOptionIndex: number | null;
      correctOptionIndex: number | null;
      isCorrect: boolean | null;
      points: number;
      explanation?: string;
    }>;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const currentQ: StudentQuizClientQuestion | undefined = questions[currentQIndex];

  // =========================================================
  // 1. STRICT ANTI-CHEATING LOCKDOWN LISTENERS
  // =========================================================
  useEffect(() => {
    if (isCompleted || !assessment.antiCheatEnabled) return;

    // Detect tab switching or window blur
    const handleBlur = () => {
      setViolationsCount((prev) => {
        const next = prev + 1;
        setWarningToast(
          `Exam Violation Detected (${next}): Leaving or minimizing the exam window is prohibited!`
        );
        return next;
      });
    };

    // Block keyboard copy/paste & inspect shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+U, F12
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V' || e.key === 'x' || e.key === 'X' || e.key === 'u' || e.key === 'U')
      ) {
        e.preventDefault();
        setWarningToast('Copying and pasting are strictly disabled during this exam.');
      }
      if (e.key === 'F12') {
        e.preventDefault();
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCompleted, assessment.antiCheatEnabled]);

  // =========================================================
  // 2. COUNTDOWN TIMER & AUTO-SUBMISSION
  // =========================================================
  useEffect(() => {
    if (isCompleted || isSubmitting) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit when time runs out
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted, isSubmitting]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Select Option
  const handleSelectOption = (qId: string, optIdx: number) => {
    if (isCompleted) return;
    setAnswers((prev) => ({
      ...prev,
      [qId]: optIdx,
    }));
  };

  // Submit Quiz
  const handleFinalSubmit = async () => {
    if (isSubmitting || isCompleted) return;
    setIsSubmitting(true);
    setWarningToast(null);

    try {
      const res = await submitStudentQuizAction({
        assessmentId: assessment.id,
        answers,
        violationsCount,
      });

      if (res.success) {
        setEvalResult({
          score: res.score,
          totalMarks: res.totalMarks,
          percentage: res.percentage,
          isPassed: res.isPassed,
          review: res.review,
        });
        setIsCompleted(true);
        if (onSubmitted) onSubmitted();
      } else {
        alert(res.error || 'Failed to submit quiz.');
      }
    } catch (err: any) {
      alert(err.message || 'Error submitting quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div
      ref={containerRef}
      onCopy={(e) => {
        e.preventDefault();
        setWarningToast('Copying is strictly disabled during the exam.');
      }}
      onCut={(e) => {
        e.preventDefault();
      }}
      onPaste={(e) => {
        e.preventDefault();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setWarningToast('Right-click context menu is disabled during the exam.');
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-3 sm:p-5 select-none overflow-y-auto"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* ========================================================= */}
        {/* TOP BAR: TIMER, PROGRESS & CLOSE */}
        {/* ========================================================= */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#FCAF0A] bg-white/10 px-2 py-0.5 rounded">
              {assessment.batchCode}
            </span>
            <span className="text-xs font-bold truncate max-w-[200px] sm:max-w-xs text-white">
              {assessment.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Countdown Clock */}
            {!isCompleted && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold border ${
                  secondsRemaining < 120
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse'
                    : 'bg-white/10 text-white border-white/20'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(secondsRemaining)}</span>
              </div>
            )}

            {/* Anti-cheat status pill */}
            {assessment.antiCheatEnabled && !isCompleted && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <ShieldAlert className="w-3 h-3" />
                <span>Lockdown Active</span>
              </span>
            )}

            {/* Exit/Close Button */}
            {isCompleted && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Anti-Cheat Toast Warning */}
        {warningToast && (
          <div className="px-4 py-2.5 bg-rose-500 text-white text-xs font-bold flex items-center justify-between shrink-0 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{warningToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setWarningToast(null)}
              className="text-white/80 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* COMPLETED RESULTS SCREEN */}
        {/* ========================================================= */}
        {isCompleted && evalResult ? (
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Score Banner */}
            <div
              className={`p-6 rounded-3xl border text-center ${
                evalResult.isPassed
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white bg-gradient-to-br from-[#0A3A7A] to-[#062F68] shadow-md">
                <Award className="w-8 h-8 text-[#FCAF0A]" />
              </div>

              <h2 className="text-xl font-bold">
                {evalResult.isPassed ? 'Assessment Completed — Passing Grade' : 'Assessment Completed'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Your assessment has been evaluated automatically.
              </p>

              <div className="mt-4 inline-flex items-center gap-6 px-6 py-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Score</span>
                  <span className="text-xl font-black text-slate-900">
                    {evalResult.score} / {evalResult.totalMarks}
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Percentage</span>
                  <span
                    className={`text-xl font-black ${
                      evalResult.isPassed ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {evalResult.percentage}%
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Result</span>
                  <span
                    className={`text-xs font-black uppercase px-2 py-0.5 rounded ${
                      evalResult.isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {evalResult.isPassed ? 'Passed' : 'Needs Review'}
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Question Review */}
            <div>
              <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Detailed Question Review & Explanations</span>
              </h3>

              <div className="space-y-3">
                {evalResult.review.map((q, idx) => {
                  const hasKey = q.correctOptionIndex !== null && q.correctOptionIndex !== undefined;
                  return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-2xl border text-xs ${
                      !hasKey
                        ? 'border-slate-200 bg-slate-50/40'
                        : q.isCorrect
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-bold text-slate-900">
                        #{idx + 1}. {q.question}
                      </div>
                      {hasKey ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                            q.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {q.isCorrect ? `+${q.points} Correct` : '0 Incorrect'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0 bg-slate-100 text-slate-600">
                          Recorded ({q.points} pt)
                        </span>
                      )}
                    </div>

                    {/* Options list */}
                    <div className="space-y-1.5 my-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = q.selectedOptionIndex === optIdx;
                        const isCorrectKey = hasKey && q.correctOptionIndex === optIdx;

                        return (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-xl flex items-center justify-between text-[11px] font-semibold border ${
                              isCorrectKey
                                ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950 font-bold'
                                : hasKey && isSelected && !isCorrectKey
                                ? 'bg-rose-100/70 border-rose-300 text-rose-950 line-through'
                                : isSelected
                                ? 'bg-blue-50 border-blue-300 text-slate-900'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <span>
                              {String.fromCharCode(65 + optIdx)}: {opt}
                            </span>
                            {isCorrectKey && (
                              <span className="text-[10px] font-bold text-emerald-800 inline-flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>Correct Answer</span>
                              </span>
                            )}
                            {hasKey && isSelected && !isCorrectKey && <span className="text-[10px] font-bold text-rose-800">Your Answer</span>}
                            {!hasKey && isSelected && <span className="text-[10px] font-bold text-[#0A3A7A]">Selected</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {hasKey && q.explanation && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 italic">
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[#0A3A7A] text-white text-xs font-bold hover:bg-[#062F68] transition cursor-pointer"
              >
                Return to Assessment Center
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* ACTIVE EXAM RUNNER */
          /* ========================================================= */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Question Progress & Palette Strip */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs font-bold text-slate-700">
                Question <span className="text-[#0A3A7A] text-sm">{currentQIndex + 1}</span> of{' '}
                <span>{questions.length}</span>
              </div>

              {/* Palette pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-sm scrollbar-thin">
                {questions.map((q, idx) => {
                  const isAnswered = answers[q.id] !== undefined;
                  const isCurrent = idx === currentQIndex;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentQIndex(idx)}
                      className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center transition cursor-pointer shrink-0 ${
                        isCurrent
                          ? 'bg-[#0A3A7A] text-white ring-2 ring-[#0A3A7A]/30'
                          : isAnswered
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] text-slate-500 font-semibold shrink-0">
                {answeredCount}/{questions.length} Answered
              </div>
            </div>

            {/* Question Card Area */}
            {currentQ && (
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {/* Question Prompt */}
                <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/80">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Question #{currentQIndex + 1} ({currentQ.points} {currentQ.points === 1 ? 'Point' : 'Points'})
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {currentQ.question}
                  </h3>
                </div>

                {/* Multiple Choice Options */}
                <div className="space-y-2.5">
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = answers[currentQ.id] === optIdx;

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.id, optIdx)}
                        className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 border-[#0A3A7A] ring-2 ring-[#0A3A7A]/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected
                                ? 'bg-[#0A3A7A] text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span
                            className={`text-xs sm:text-sm ${
                              isSelected ? 'font-bold text-slate-900' : 'text-slate-700'
                            }`}
                          >
                            {opt}
                          </span>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-[#0A3A7A] bg-[#0A3A7A] text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Stepper & Submit Bar */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex((i) => Math.max(0, i - 1))}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2">
                {currentQIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQIndex((i) => Math.min(questions.length - 1, i + 1))}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleFinalSubmit}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Submit Final Exam</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
