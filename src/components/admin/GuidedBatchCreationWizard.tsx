'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  BookOpen,
  Calendar,
  Users,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Crown,
  Upload,
  AlertCircle,
  FileSpreadsheet,
  X,
  Layers,
  Sparkles,
  Download,
  Check,
  MapPin,
} from 'lucide-react';
import { createBatchFullWorkflowAction, GuidedBatchPayload } from '@/app/actions/batches';
import { useAdminToast } from './AdminToast';
import * as XLSX from 'xlsx';

interface CollegeOption {
  id: string;
  name: string;
  city: string | null;
}

interface ProgramOption {
  id: string;
  name: string;
  domain?: string | null;
  duration_days?: number;
  duration_hours?: string;
}

interface TrainerOption {
  id: string;
  full_name: string;
  skills: string | null;
  status: string;
  assigned_batches_count?: number;
}

interface GuidedBatchCreationWizardProps {
  colleges: CollegeOption[];
  programs: ProgramOption[];
  trainers: TrainerOption[];
  initialCollegeId?: string;
  preselectedCollegeId?: string;
}

export default function GuidedBatchCreationWizard({
  colleges,
  programs,
  trainers,
  initialCollegeId,
  preselectedCollegeId,
}: GuidedBatchCreationWizardProps) {
  const router = useRouter();
  const toast = useAdminToast();

  // Step 1: Training Details
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [collegeId, setCollegeId] = useState<string>(
    initialCollegeId || preselectedCollegeId || colleges[0]?.id || ''
  );
  const [programId, setProgramId] = useState<string>(programs[0]?.id || '');
  const [batchCode, setBatchCode] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [targetStrength, setTargetStrength] = useState<number>(60);
  const [status, setStatus] = useState<'planned' | 'active' | 'completed'>('planned');

  // Step 2: Assign Trainers
  const [leadTrainerId, setLeadTrainerId] = useState<string>('');
  const [assistantTrainerIds, setAssistantTrainerIds] = useState<string[]>([]);
  const [trainerSearch, setTrainerSearch] = useState<string>('');

  // Step 3: Students
  const [studentsList, setStudentsList] = useState<
    Array<{
      rollNumber: string;
      fullName: string;
      email?: string;
      phone?: string;
      department?: string;
      yearOrSemester?: string;
    }>
  >([]);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvParseError, setCsvParseError] = useState<string | null>(null);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-generate batch code suggestion
  const generateCodeSuggestion = () => {
    const col = colleges.find((c) => c.id === collegeId);
    const prog = programs.find((p) => p.id === programId);
    const colPrefix = col
      ? col.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()
      : 'COL';
    const progPrefix = prog
      ? prog.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()
      : 'TRN';
    const year = new Date().getFullYear();
    const rand = Math.floor(10 + Math.random() * 90);
    const generated = `${colPrefix}-${progPrefix}-${year}-${rand}`;
    setBatchCode(generated);
  };

  // Excel & CSV parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvParseError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);

    const isExcel =
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls') ||
      file.type.includes('spreadsheet') ||
      file.type.includes('excel');

    const parseMatrix = (matrix: any[][]) => {
      if (!matrix || matrix.length < 2) {
        setCsvParseError('The file appears empty or missing a header row.');
        return;
      }

      const headers = matrix[0].map((h) =>
        String(h || '').replace(/^["']|["']$/g, '').trim().toLowerCase()
      );
      const rollIdx = headers.findIndex(
        (h) => h.includes('roll') || h.includes('reg') || h.includes('id')
      );
      const nameIdx = headers.findIndex((h) => h.includes('name'));
      const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('mail'));
      const deptIdx = headers.findIndex(
        (h) => h.includes('dept') || h.includes('department') || h.includes('branch')
      );

      if (rollIdx === -1 || nameIdx === -1) {
        setCsvParseError(
          'Missing required column headers: Roll Number and Student Name are required.'
        );
        return;
      }

      const parsedRows = [];
      for (let i = 1; i < matrix.length; i++) {
        const row = matrix[i];
        if (!row || row.length === 0) continue;
        const rollNumber = String(row[rollIdx] || '').trim();
        const fullName = String(row[nameIdx] || '').trim();

        if (rollNumber && fullName) {
          parsedRows.push({
            rollNumber,
            fullName,
            email: emailIdx !== -1 && row[emailIdx] ? String(row[emailIdx]).trim() : undefined,
            department: deptIdx !== -1 && row[deptIdx] ? String(row[deptIdx]).trim() : undefined,
          });
        }
      }

      if (parsedRows.length === 0) {
        setCsvParseError('Could not find any valid student rows in the uploaded file.');
      } else {
        setStudentsList(parsedRows);
        toast.success(`Validated ${parsedRows.length} student records from spreadsheet!`);
      }
    };

    const reader = new FileReader();
    if (isExcel) {
      reader.onload = (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const data = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets[firstSheet], { header: 1 });
          parseMatrix(data);
        } catch {
          setCsvParseError('Failed to parse Excel file. Ensure it is a valid spreadsheet.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const workbook = XLSX.read(text, { type: 'string' });
          const firstSheet = workbook.SheetNames[0];
          const data = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets[firstSheet], { header: 1 });
          parseMatrix(data);
        } catch {
          setCsvParseError('Failed to parse CSV file. Ensure it is formatted properly.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Validation
  const canProceedStep1 = collegeId && programId && batchCode.trim() && startDate && endDate;

  // Final submission
  const handleFinalSubmit = async () => {
    if (!canProceedStep1) {
      setErrorMessage('Please complete all required fields in Step 1.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: GuidedBatchPayload = {
      code: batchCode.trim().toUpperCase(),
      collegeId,
      programId,
      startDate,
      endDate,
      targetStrength: Number(targetStrength) || 60,
      status,
      leadTrainerId: leadTrainerId || undefined,
      assistantTrainerIds: assistantTrainerIds.length > 0 ? assistantTrainerIds : undefined,
      studentsCsvRows: studentsList.length > 0 ? studentsList : undefined,
    };

    try {
      const result = await createBatchFullWorkflowAction(payload);
      if (result.success && result.data?.id) {
        toast.success(`Batch ${batchCode} successfully configured and created!`);
        router.push(`/admin/batches/${result.data.id}`);
      } else {
        setErrorMessage(result.error || 'Failed to create training batch.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred while creating the batch.');
      setIsSubmitting(false);
    }
  };

  const filteredTrainers = trainers.filter((t) =>
    trainerSearch
      ? t.full_name.toLowerCase().includes(trainerSearch.toLowerCase()) ||
        (t.skills && t.skills.toLowerCase().includes(trainerSearch.toLowerCase()))
      : true
  );

  const selectedCollege = colleges.find((c) => c.id === collegeId);
  const selectedProgram = programs.find((p) => p.id === programId);
  const selectedLead = trainers.find((t) => t.id === leadTrainerId);

  return (
    <div className="space-y-3.5 sm:space-y-4 max-w-4xl mx-auto">
      {/* 1. Progress Step Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2.5 sm:p-3 shadow-2xs">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 text-center text-xs">
          {[
            { num: 1, label: '1. Training Details' },
            { num: 2, label: '2. Assign Trainers' },
            { num: 3, label: '3. Student Roster' },
            { num: 4, label: '4. Review & Confirm' },
          ].map((s) => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num < currentStep || (s.num === 2 && canProceedStep1)) {
                    setCurrentStep(s.num);
                  }
                }}
                className={`py-2 sm:py-2.5 px-2 rounded-xl border transition-all text-left sm:text-center cursor-pointer ${
                  isActive
                    ? 'border-[#0A3A7A] bg-blue-50/80 text-[#0A3A7A] font-bold shadow-2xs'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800 font-semibold'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <span
                    className={`w-4.5 h-4.5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                      isActive
                        ? 'bg-[#0A3A7A] text-white shadow-2xs'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </span>
                  <span className="hidden sm:inline font-bold text-xs">{s.label.split('. ')[1]}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: Training Details */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
          <div className="border-b border-slate-100 pb-2.5">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Step 1 — Training Details &amp; Institution
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select the partner institution, training curriculum, timeline, and unique batch code.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Select College */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Partner College <span className="text-rose-500">*</span>
              </label>
              <select
                value={collegeId}
                onChange={(e) => setCollegeId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white font-medium hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A3A7A]/15 focus:border-[#0A3A7A]"
              >
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.city ? `(${c.city})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Program */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Training Curriculum <span className="text-rose-500">*</span>
              </label>
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white font-medium hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A3A7A]/15 focus:border-[#0A3A7A]"
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.domain ? `• ${p.domain}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch Code */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Batch Code <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateCodeSuggestion}
                  className="text-xs text-[#0A3A7A] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FCAF0A]" />
                  <span>Auto Suggest</span>
                </button>
              </div>
              <input
                type="text"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                placeholder="e.g. SRM-FSD-2025-01"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-xs sm:text-sm text-slate-900 uppercase font-bold hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A3A7A]/15 focus:border-[#0A3A7A]"
              />
            </div>

            {/* Target Student Capacity */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Target Capacity (Seats)
              </label>
              <input
                type="number"
                min="1"
                value={targetStrength}
                onChange={(e) => setTargetStrength(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A3A7A]/15 focus:border-[#0A3A7A]"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A3A7A]/15 focus:border-[#0A3A7A]"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A3A7A]/15 focus:border-[#0A3A7A]"
              />
            </div>
          </div>

          {/* STEP ACTION BUTTONS */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <Link
              href="/admin/batches"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </Link>
            <button
              type="button"
              disabled={!canProceedStep1}
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] disabled:bg-[#0A3A7A]/60 text-white text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition cursor-pointer disabled:cursor-not-allowed group"
            >
              <span>Continue to Assign Faculty</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Assign Trainer */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
          <div className="border-b border-slate-100 pb-2.5">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Step 2 — Assign Certified Faculty
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Designate an instructor to lead this cohort. You can also assign assistant instructors.
            </p>
          </div>

          {/* Search trainers */}
          <div className="relative">
            <input
              type="text"
              value={trainerSearch}
              onChange={(e) => setTrainerSearch(e.target.value)}
              placeholder="Search instructors by name or technical skills..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A3A7A]/15 focus:border-[#0A3A7A]"
            />
          </div>

          {/* Trainers list */}
          <div className="max-h-56 sm:max-h-64 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
            {filteredTrainers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No trainers found matching your search.
              </div>
            ) : (
              filteredTrainers.map((t) => {
                const isLead = leadTrainerId === t.id;
                const isAssistant = assistantTrainerIds.includes(t.id);

                return (
                  <div
                    key={t.id}
                    className={`p-3 text-xs sm:text-sm flex items-center justify-between gap-3 transition ${
                      isLead ? 'bg-amber-50/70' : isAssistant ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{t.full_name}</span>
                        {isLead && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Crown className="w-2.5 h-2.5 text-amber-600" />
                            Lead
                          </span>
                        )}
                        {isAssistant && (
                          <span className="px-2 py-0.2 rounded-md text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                            Assistant
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Domain Skills: {t.skills || 'General Technical Skilling'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (isLead) {
                            setLeadTrainerId('');
                          } else {
                            setLeadTrainerId(t.id);
                            setAssistantTrainerIds((prev) => prev.filter((id) => id !== t.id));
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isLead
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-amber-50'
                        }`}
                      >
                        {isLead ? (
                          <span className="inline-flex items-center gap-1">
                            <span>Lead</span>
                            <Check className="w-3 h-3" />
                          </span>
                        ) : (
                          'Make Lead'
                        )}
                      </button>

                      {!isLead && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isAssistant) {
                              setAssistantTrainerIds((prev) => prev.filter((id) => id !== t.id));
                            } else {
                              setAssistantTrainerIds((prev) => [...prev, t.id]);
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isAssistant
                              ? 'bg-blue-700 text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-blue-50'
                          }`}
                        >
                          {isAssistant ? (
                            <span className="inline-flex items-center gap-1">
                              <span>Assistant</span>
                              <Check className="w-3 h-3" />
                            </span>
                          ) : (
                            '+ Assistant'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* STEP ACTION BUTTONS */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition cursor-pointer group"
            >
              <span>Continue to Student Enrollment</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Add Students (CSV or Skip) */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
          <div className="border-b border-slate-100 pb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Step 3 — Enroll Students Roster
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload a student CSV file now, or proceed and enroll students after batch creation.
              </p>
            </div>
            <a
              href="/sample_students_demo.csv"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-[#0A3A7A] self-start"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sample CSV</span>
            </a>
          </div>

          {/* Upload Drop Zone */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 sm:p-6 text-center hover:border-[#0A3A7A] transition bg-slate-50/60">
            <input
              type="file"
              accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              id="batch-students-csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="batch-students-csv"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0A3A7A] flex items-center justify-center shadow-2xs">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                  {csvFileName ? `Attached: ${csvFileName}` : 'Click to select or drag & drop Excel (.xlsx) or CSV file'}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Required columns: <strong>Roll Number</strong>, <strong>Full Name</strong> (Optional: Email, Department)
                </span>
              </div>
            </label>
          </div>

          {csvParseError && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {csvParseError}
            </p>
          )}

          {/* Preview Parsed Count */}
          {studentsList.length > 0 && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs sm:text-sm text-emerald-950">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>{studentsList.length} students</strong> validated and attached to this batch.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStudentsList([]);
                  setCsvFileName(null);
                }}
                className="text-rose-600 hover:underline font-bold text-xs cursor-pointer"
              >
                Remove Roster
              </button>
            </div>
          )}

          {/* STEP ACTION BUTTONS */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition cursor-pointer group"
            >
              <span>{studentsList.length > 0 ? 'Continue to Final Review' : 'Skip & Continue to Review'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review & Create */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
          <div className="border-b border-slate-100 pb-2.5">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Step 4 — Review &amp; Launch Batch
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify all cohort details before publishing this batch to the institutional portal.
            </p>
          </div>

          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Partner College
              </span>
              <div className="font-bold text-xs sm:text-sm text-slate-900">{selectedCollege?.name}</div>
              {selectedCollege?.city && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{selectedCollege.city}</span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Training Curriculum
              </span>
              <div className="font-bold text-xs sm:text-sm text-slate-900">{selectedProgram?.name}</div>
              <div className="text-[11px] text-slate-500 font-mono">Code: {batchCode}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Timeline &amp; Capacity
              </span>
              <div className="font-bold text-xs sm:text-sm text-slate-900">
                {startDate} to {endDate}
              </div>
              <div className="text-[11px] text-slate-500">
                Target: {targetStrength} seats • Initial Roster: {studentsList.length} students
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Assigned Faculty
              </span>
              <div className="font-bold text-xs sm:text-sm text-slate-900">
                {selectedLead ? selectedLead.full_name : 'No lead instructor (Assign later)'}
              </div>
              <div className="text-[11px] text-slate-500">
                {assistantTrainerIds.length > 0
                  ? `+ ${assistantTrainerIds.length} assistant trainer(s)`
                  : 'No assistant trainers'}
              </div>
            </div>
          </div>

          {/* FINAL LAUNCH BUTTONS */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting || !canProceedStep1}
              onClick={handleFinalSubmit}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] disabled:bg-[#0A3A7A]/60 text-white text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs active:scale-[0.99] transition-all cursor-pointer disabled:cursor-not-allowed group"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Configuring &amp; Creating Batch...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#FCAF0A]" />
                  <span>Confirm &amp; Launch Batch</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
