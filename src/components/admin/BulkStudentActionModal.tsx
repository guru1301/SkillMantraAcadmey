'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Trash2,
  UserX,
  UserCheck,
  RotateCcw,
  KeyRound,
  ShieldAlert,
  Download,
  AlertCircle,
  Archive,
} from 'lucide-react';
import { executeBulkStudentAction, previewBulkDeleteAction } from '@/app/actions/students';
import { MasterStudentItem } from '@/lib/db/students';

// Helper to prevent CSV / Formula Injection (DDE injection)
function sanitizeCsvCell(val: string | null | undefined): string {
  if (!val) return '""';
  const s = String(val).replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(s)) {
    return `"'${s}"`;
  }
  return `"${s}"`;
}

interface BulkStudentActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudents: MasterStudentItem[];
  actionType: 'deactivate' | 'reactivate' | 'revoke_sessions' | 'reset_activation' | 'delete' | null;
  onSuccess: () => void;
}

export default function BulkStudentActionModal({
  isOpen,
  onClose,
  selectedStudents,
  actionType,
  onSuccess,
}: BulkStudentActionModalProps) {
  const [deleteMode, setDeleteMode] = useState<'archive' | 'permanent'>('archive');
  const [deletePreview, setDeletePreview] = useState<any | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionResult, setActionResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmUnderstood, setConfirmUnderstood] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && actionType === 'delete') {
      setIsLoadingPreview(true);
      previewBulkDeleteAction(selectedStudents.map((s) => s.id))
        .then((res) => {
          setIsLoadingPreview(false);
          if (res.success && res.data) {
            setDeletePreview(res.data);
          }
        })
        .catch(() => setIsLoadingPreview(false));
    } else {
      setDeletePreview(null);
      setConfirmUnderstood(false);
      setActionResult(null);
      setErrorMessage(null);
    }
  }, [isOpen, actionType, selectedStudents]);

  if (!isOpen || !actionType) return null;

  const handleExecute = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const studentIds = selectedStudents.map((s) => s.id);
    const mode = actionType === 'delete' ? deleteMode : 'archive';

    const res = await executeBulkStudentAction(studentIds, actionType, mode);
    setIsSubmitting(false);

    if (res.success && res.data) {
      setActionResult(res.data);
      onSuccess();
    } else {
      setErrorMessage(res.error || 'Bulk operation failed.');
    }
  };

  const handleDownloadNewCredentials = () => {
    if (!actionResult?.activationCredentials) return;

    let csv = 'roll_number,full_name,department,activation_code\n';
    actionResult.activationCredentials.forEach((c: any) => {
      csv += `${sanitizeCsvCell(c.rollNumber)},${sanitizeCsvCell(c.fullName)},${sanitizeCsvCell(c.department)},${sanitizeCsvCell(c.activationCode)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reset_credentials_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTitle = () => {
    switch (actionType) {
      case 'deactivate':
        return 'Bulk Deactivate Student Accounts';
      case 'reactivate':
        return 'Bulk Reactivate Student Accounts';
      case 'revoke_sessions':
        return 'Bulk Revoke Active Sessions';
      case 'reset_activation':
        return 'Bulk Reset Activation Credentials';
      case 'delete':
        return 'Safeguarded Bulk Student Account Deletion';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                actionType === 'delete'
                  ? 'bg-rose-100 text-rose-700'
                  : actionType === 'deactivate'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {actionType === 'delete' && <Trash2 className="w-5 h-5" />}
              {actionType === 'deactivate' && <UserX className="w-5 h-5" />}
              {actionType === 'reactivate' && <UserCheck className="w-5 h-5" />}
              {actionType === 'revoke_sessions' && <RotateCcw className="w-5 h-5" />}
              {actionType === 'reset_activation' && <KeyRound className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{getTitle()}</h3>
              <p className="text-xs text-slate-500">
                Affects <strong>{selectedStudents.length}</strong> selected student records
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Result Summary (Post-Execution) */}
          {actionResult ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-950">
                    Bulk Operation Completed
                  </h4>
                  <p className="text-xs text-emerald-800">
                    Processed <strong>{actionResult.processedCount}</strong> students successfully. 
                    {actionResult.skippedCount > 0 && ` (${actionResult.skippedCount} skipped)`}
                    {actionResult.failedCount > 0 && ` (${actionResult.failedCount} failed)`}
                  </p>
                </div>
              </div>

              {/* Activation credentials export if reset */}
              {actionResult.activationCredentials && actionResult.activationCredentials.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase">
                    <KeyRound className="w-4 h-4 text-amber-700" />
                    <span>One-Time Activation Credentials Generated</span>
                  </div>
                  <p className="text-xs text-amber-800">
                    {actionResult.activationCredentials.length} new credentials generated. Download the report now:
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadNewCredentials}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Activation Credentials (CSV)</span>
                  </button>
                </div>
              )}

              {/* Itemized Results */}
              <div className="border border-slate-200 rounded-xl max-h-56 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr className="text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-2 px-3">Roll No</th>
                      <th className="py-2 px-3">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {actionResult.results.map((r: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{r.roll_number || 'N/A'}</td>
                        <td className="py-2 px-3 text-slate-700">
                          {r.success ? (
                            <span className="text-emerald-700 font-semibold">{r.message}</span>
                          ) : (
                            <span className="text-rose-700">{r.message}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : actionType === 'delete' ? (
            /* BULK DELETION SAFEGUARD PREVIEW */
            <div className="space-y-4">
              {isLoadingPreview ? (
                <div className="py-8 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0A3A7A] mx-auto" />
                  <p className="text-xs text-slate-500">Analyzing historical attendance, exams, and certificates...</p>
                </div>
              ) : (
                deletePreview && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <span className="text-[10px] font-bold text-amber-700 uppercase">Records With Academic History</span>
                        <div className="text-lg font-bold text-amber-900 mt-0.5">{deletePreview.history_count}</div>
                        <span className="text-[10px] text-amber-700">Must be safely archived to preserve audit compliance</span>
                      </div>
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase">Clean Records (0 History)</span>
                        <div className="text-lg font-bold text-emerald-900 mt-0.5">{deletePreview.clean_count}</div>
                        <span className="text-[10px] text-emerald-700">Eligible for permanent deletion</span>
                      </div>
                    </div>

                    <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 text-xs text-rose-950 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-rose-900">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Data Retention &amp; Compliance Safeguards</span>
                      </div>
                      <p className="text-rose-800 leading-relaxed text-[11px]">
                        Educational records (attendance logs, exam submissions, certificates) cannot be destroyed.
                        <strong> Safe Archival</strong> disables student login credentials and marks accounts as archived, while permanently protecting institutional audit integrity.
                      </p>
                    </div>

                    {/* Mode Choice */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700">
                        Choose Processing Mode
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div
                          onClick={() => setDeleteMode('archive')}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col gap-1 ${
                            deleteMode === 'archive'
                              ? 'border-[#0A3A7A] bg-blue-50/30'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <Archive className="w-3.5 h-3.5 text-[#0A3A7A]" />
                              Safe Archival (Recommended)
                            </span>
                            {deleteMode === 'archive' && <CheckCircle2 className="w-4 h-4 text-[#0A3A7A]" />}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Revokes all login access. Retains all attendance, examination, and certificate history.
                          </span>
                        </div>

                        <div
                          onClick={() => setDeleteMode('permanent')}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col gap-1 ${
                            deleteMode === 'permanent'
                              ? 'border-rose-600 bg-rose-50/30'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              Permanent Deletion
                            </span>
                            {deleteMode === 'permanent' && <CheckCircle2 className="w-4 h-4 text-rose-600" />}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Permanently removes clean records with zero academic history. Automatically archives records with history.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Affected Students Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                          <tr className="text-[10px] font-bold text-slate-500 uppercase">
                            <th className="py-1.5 px-3">Roll No</th>
                            <th className="py-1.5 px-3">Name</th>
                            <th className="py-1.5 px-3">College</th>
                            <th className="py-1.5 px-3">Academic History</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {deletePreview.students.map((st: any) => (
                            <tr key={st.id} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-mono font-bold text-slate-900">{st.roll_number}</td>
                              <td className="py-2 px-3 font-medium text-slate-800">{st.full_name}</td>
                              <td className="py-2 px-3 text-slate-600">{st.college_name}</td>
                              <td className="py-2 px-3">
                                {st.has_academic_history ? (
                                  <span className="text-amber-700 font-semibold">{st.academic_summary}</span>
                                ) : (
                                  <span className="text-slate-400">Zero records</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Explicit Confirmation Checkbox */}
                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmUnderstood}
                        onChange={(e) => setConfirmUnderstood(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-[#0A3A7A] focus:ring-[#0A3A7A]"
                      />
                      <span>
                        I understand that active user sessions will be revoked immediately and login access will be disabled for all {selectedStudents.length} selected students.
                      </span>
                    </label>
                  </>
                )
              )}
            </div>
          ) : (
            /* STANDARD ACTIONS: Deactivate, Reactivate, Revoke, Reset */
            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                You are about to execute <strong>{actionType}</strong> on <strong>{selectedStudents.length}</strong> selected students.
              </p>

              {actionType === 'deactivate' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Selected student accounts will be deactivated and all their active portal sessions will be revoked immediately.</span>
                </div>
              )}

              {actionType === 'reset_activation' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 shrink-0" />
                  <span>Generates new single-use activation credentials for selected students and resets account state to 'pending_activation'.</span>
                </div>
              )}

              {/* Affected Students List Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr className="text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-2 px-3">Roll No</th>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">College</th>
                      <th className="py-2 px-3">Current Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{st.roll_number}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{st.full_name}</td>
                        <td className="py-2 px-3 text-slate-600">{st.college_name}</td>
                        <td className="py-2 px-3">
                          <span className="capitalize text-slate-700">{st.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {actionResult ? (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-[#0A3A7A] text-white text-xs font-bold hover:bg-blue-900 transition cursor-pointer"
              >
                Close &amp; Refresh Roster
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecute}
                disabled={isSubmitting || (actionType === 'delete' && !confirmUnderstood)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                  actionType === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#0A3A7A] hover:bg-blue-900'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Bulk Action...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm {getTitle()}</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

