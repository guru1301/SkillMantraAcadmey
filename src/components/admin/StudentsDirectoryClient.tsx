'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Download,
  Upload,
  Search,
  Building2,
  Layers,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  CheckCircle2,
  Info,
  MapPin,
  Trash2,
  UserX,
  UserCheck,
  RotateCcw,
  KeyRound,
  MoreVertical,
  Archive,
  ShieldAlert,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react';
import RosterUploadWizardModal from '@/components/admin/RosterUploadWizardModal';
import BulkStudentActionModal from '@/components/admin/BulkStudentActionModal';
import { MasterStudentItem } from '@/lib/db/students';
import {
  updateStudentStatusAction,
  resetStudentActivationAction,
  revokeStudentSessionsAction,
  deleteStudentAction,
} from '@/app/actions/students';

export interface CollegeOption {
  id: string;
  name: string;
  city?: string | null;
  enrolled_students_count?: number;
}

export interface BatchOption {
  id: string;
  code: string;
  college_id: string;
  college_name: string;
  program_name?: string;
  actual_students_count?: number;
  target_strength?: number;
}

interface StudentsDirectoryClientProps {
  students: MasterStudentItem[];
  total: number;
  colleges: CollegeOption[];
  batches: BatchOption[];
  currentSearch?: string;
  currentCollegeId?: string;
  currentBatchId?: string;
}

const ITEMS_PER_PAGE = 25;

export default function StudentsDirectoryClient({
  students,
  total,
  colleges,
  batches,
  currentSearch,
  currentCollegeId,
  currentBatchId,
}: StudentsDirectoryClientProps) {
  const router = useRouter();

  // Navigation View: 'campuses' (Hierarchy view) vs 'roster' (Specific batch / search roster)
  const [activeView, setActiveView] = useState<'campuses' | 'roster'>(() => {
    return currentBatchId || currentSearch || currentCollegeId ? 'roster' : 'campuses';
  });

  const [selectedBatchId, setSelectedBatchId] = useState<string>(currentBatchId || 'all');
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(currentCollegeId || 'all');
  const [search, setSearch] = useState<string>(currentSearch || '');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllFiltered, setSelectAllFiltered] = useState<boolean>(false);

  // Modal states
  const [rosterWizardOpen, setRosterWizardOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<
    'deactivate' | 'reactivate' | 'revoke_sessions' | 'reset_activation' | 'delete' | null
  >(null);
  const [activeMenuStudentId, setActiveMenuStudentId] = useState<string | null>(null);

  // Single action feedback
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Group batches by College
  const collegeBatchesMap = useMemo(() => {
    const map = new Map<string, BatchOption[]>();
    colleges.forEach((c) => map.set(c.id, []));
    batches.forEach((b) => {
      const list = map.get(b.college_id) || [];
      list.push(b);
      map.set(b.college_id, list);
    });
    return map;
  }, [colleges, batches]);

  // Client filtering for the active roster
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      if (selectedBatchId !== 'all') {
        const batch = batches.find((b) => b.id === selectedBatchId);
        if (batch && !st.batch_codes?.includes(batch.code)) {
          return false;
        }
      }

      if (selectedCollegeId !== 'all' && st.college_id !== selectedCollegeId) {
        return false;
      }

      const q = search.toLowerCase().trim();
      if (!q) return true;

      return (
        st.roll_number.toLowerCase().includes(q) ||
        st.full_name.toLowerCase().includes(q) ||
        (st.email && st.email.toLowerCase().includes(q)) ||
        (st.college_name && st.college_name.toLowerCase().includes(q)) ||
        (st.department && st.department.toLowerCase().includes(q))
      );
    });
  }, [students, batches, selectedBatchId, selectedCollegeId, search]);

  // Pagination (25 items per page)
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  // Selection handlers
  const isAllOnPageSelected = useMemo(() => {
    if (paginatedStudents.length === 0) return false;
    return paginatedStudents.every((s) => selectedIds.has(s.id));
  }, [paginatedStudents, selectedIds]);

  const handleToggleSelectAllOnPage = () => {
    const newSet = new Set(selectedIds);
    if (isAllOnPageSelected) {
      paginatedStudents.forEach((s) => newSet.delete(s.id));
      setSelectAllFiltered(false);
    } else {
      paginatedStudents.forEach((s) => newSet.add(s.id));
    }
    setSelectedIds(newSet);
  };

  const handleSelectAllFiltered = () => {
    const newSet = new Set(filteredStudents.map((s) => s.id));
    setSelectedIds(newSet);
    setSelectAllFiltered(true);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setSelectAllFiltered(false);
  };

  const handleToggleRow = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
      setSelectAllFiltered(false);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectedStudentsList = useMemo(() => {
    return students.filter((s) => selectedIds.has(s.id));
  }, [students, selectedIds]);

  const handleSelectBatchToView = (batchId: string, collegeId: string) => {
    setSelectedBatchId(batchId);
    setSelectedCollegeId(collegeId);
    setActiveView('roster');
    setCurrentPage(1);
  };

  // Single Student Actions
  const handleToggleSingleStatus = async (st: MasterStudentItem) => {
    const newStatus = st.status === 'active' ? 'inactive' : 'active';
    const res = await updateStudentStatusAction(st.id, newStatus);
    if (res.success) {
      setNoticeMessage(`Student ${st.roll_number} account set to '${newStatus}'.`);
      router.refresh();
    } else {
      setNoticeMessage(`Error: ${res.error}`);
    }
    setActiveMenuStudentId(null);
  };

  const handleResetSingleActivation = async (st: MasterStudentItem) => {
    const res = await resetStudentActivationAction(st.id);
    if (res.success && res.data) {
      setNoticeMessage(res.data.message);
      router.refresh();
    } else {
      setNoticeMessage(`Error: ${res.error}`);
    }
    setActiveMenuStudentId(null);
  };

  const handleRevokeSingleSessions = async (st: MasterStudentItem) => {
    const res = await revokeStudentSessionsAction(st.id);
    if (res.success && res.data) {
      setNoticeMessage(res.data.message);
    } else {
      setNoticeMessage(`Error: ${res.error}`);
    }
    setActiveMenuStudentId(null);
  };

  const handleDeleteSingleArchive = async (st: MasterStudentItem, mode: 'archive' | 'permanent') => {
    const res = await deleteStudentAction(st.id, mode);
    if (res.success && res.data) {
      setNoticeMessage(res.data.message);
      router.refresh();
    } else {
      setNoticeMessage(`Error: ${res.error}`);
    }
    setActiveMenuStudentId(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP VIEW SELECTOR BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('campuses')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeView === 'campuses'
                ? 'bg-[#0A3A7A] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Campus &amp; Cohorts View</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeView === 'campuses' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {colleges.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('roster')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeView === 'roster'
                ? 'bg-[#0A3A7A] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Focused Student Roster</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeView === 'roster' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {filteredStudents.length}
            </span>
          </button>
        </div>

        {/* Action Link for Upload Wizard and Template */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRosterWizardOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-blue-900 text-white text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Import Student Roster</span>
          </button>

          <a
            href="/sample_students_demo.csv"
            download
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Template</span>
          </a>
        </div>
      </div>

      {noticeMessage && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setNoticeMessage(null)}
            className="text-blue-500 hover:text-blue-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* VIEW A: Campus & Cohorts Overview (Hierarchical) */}
      {activeView === 'campuses' && (
        <div className="space-y-4">
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Institutional Campus Directory:</strong> Click on any cohort batch below to inspect its student roster, credentials, and academic status.
              </span>
            </div>
            <span className="font-mono text-blue-900 font-bold bg-white/80 px-2 py-0.5 rounded border border-blue-200 self-start sm:self-auto">
              {total} Total Students Enrolled
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {colleges.map((college) => {
              const collegeBatches = collegeBatchesMap.get(college.id) || [];
              const totalCollegeStudents = collegeBatches.reduce(
                (sum, b) => sum + (b.actual_students_count || 0),
                0
              );

              return (
                <div
                  key={college.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 hover:border-slate-300 transition"
                >
                  {/* College Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#0A3A7A]" />
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {college.name}
                        </h3>
                      </div>
                      {college.city && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{college.city}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>{totalCollegeStudents} Students</span>
                      </span>
                    </div>
                  </div>

                  {/* Batches List for College */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Active Training Cohorts ({collegeBatches.length})
                    </span>

                    {collegeBatches.length === 0 ? (
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-400">
                        No batches configured for this college.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {collegeBatches.map((batch) => (
                          <div
                            key={batch.id}
                            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/30 hover:border-blue-200 transition flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[#0A3A7A]">
                                  {batch.code}
                                </span>
                                {batch.program_name && (
                                  <span className="text-slate-600 font-medium">
                                    • {batch.program_name}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500">
                                {batch.actual_students_count || 0} students enrolled
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSelectBatchToView(batch.id, college.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 font-bold text-xs shadow-2xs transition cursor-pointer"
                            >
                              <span>View Roster</span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW B: Focused Student Roster with BULK ACTIONS */}
      {activeView === 'roster' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveView('campuses')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A3A7A] hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Campus &amp; Cohorts Overview</span>
              </button>

              <span className="text-xs text-slate-500 font-medium">
                Showing {filteredStudents.length} matching students (Page {currentPage} of {totalPages})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Filter by student name, roll no..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#0A3A7A]"
                />
              </div>

              <div>
                <select
                  value={selectedCollegeId}
                  onChange={(e) => {
                    setSelectedCollegeId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-hidden"
                >
                  <option value="all">All Partner Colleges</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedBatchId}
                  onChange={(e) => {
                    setSelectedBatchId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-hidden"
                >
                  <option value="all">All Cohort Batches</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} ({b.college_name})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* BULK SELECTION ACTION TOOLBAR */}
          {selectedIds.size > 0 && (
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold">
                  {selectedIds.size} Selected
                </span>
                <span className="text-xs text-slate-300">
                  {selectAllFiltered
                    ? `All ${filteredStudents.length} matching students selected`
                    : `Selected from current view`}
                </span>
                {!selectAllFiltered && filteredStudents.length > selectedIds.size && (
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-xs text-blue-300 hover:text-white underline font-medium cursor-pointer"
                  >
                    Select all {filteredStudents.length} matching students
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Deselect All
                </button>
              </div>

              {/* Bulk Action Buttons */}
              <div className="flex items-center flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setBulkActionType('deactivate')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5 text-amber-400" />
                  <span>Deactivate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBulkActionType('reactivate')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Reactivate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBulkActionType('revoke_sessions')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                  <span>Revoke Sessions</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBulkActionType('reset_activation')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                  <span>Reset Activation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBulkActionType('delete')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete / Archive</span>
                </button>
              </div>
            </div>
          )}

          {/* Roster Table */}
          {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">No students match this filter</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No students found matching your selected batch or search query.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isAllOnPageSelected}
                          onChange={handleToggleSelectAllOnPage}
                          className="rounded border-slate-300 text-[#0A3A7A] focus:ring-[#0A3A7A] cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-3">Roll Number</th>
                      <th className="py-3 px-3">Student Name</th>
                      <th className="py-3 px-3">College</th>
                      <th className="py-3 px-3">Department</th>
                      <th className="py-3 px-3">Enrolled Cohort</th>
                      <th className="py-3 px-3">Account Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {paginatedStudents.map((st) => {
                      const isSelected = selectedIds.has(st.id);
                      return (
                        <tr
                          key={st.id}
                          className={`hover:bg-slate-50/70 transition ${isSelected ? 'bg-blue-50/40' : ''}`}
                        >
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleRow(st.id)}
                              className="rounded border-slate-300 text-[#0A3A7A] focus:ring-[#0A3A7A] cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-blue-900">
                            {st.roll_number}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            {st.full_name}
                            {st.email && (
                              <span className="block text-[11px] text-slate-400 font-normal">
                                {st.email}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-800">{st.college_name}</td>
                          <td className="py-3 px-3 text-slate-600">{st.department || '—'}</td>
                          <td className="py-3 px-3">
                            {st.batch_codes ? (
                              <span className="font-mono text-[11px] font-bold bg-blue-50 text-blue-900 px-2 py-0.5 rounded border border-blue-200">
                                {st.batch_codes}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {st.status === 'active' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                Active
                              </span>
                            )}
                            {st.status === 'pending_activation' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                Pending Activation
                              </span>
                            )}
                            {st.status === 'inactive' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                Inactive
                              </span>
                            )}
                            {st.status === 'archived' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                                Archived
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveMenuStudentId(
                                    activeMenuStudentId === st.id ? null : st.id
                                  )
                                }
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {activeMenuStudentId === st.id && (
                                <div className="origin-top-right absolute right-0 mt-1 w-44 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-slate-100 z-30 focus:outline-hidden animate-in fade-in duration-100">
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => handleResetSingleActivation(st)}
                                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                                      <span>Reset Activation</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRevokeSingleSessions(st)}
                                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                                      <span>Revoke Sessions</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSingleStatus(st)}
                                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      {st.status === 'active' ? (
                                        <>
                                          <UserX className="w-3.5 h-3.5 text-amber-600" />
                                          <span>Deactivate</span>
                                        </>
                                      ) : (
                                        <>
                                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Reactivate</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSingleArchive(st, 'archive')}
                                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Archive className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Safe Archive</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSingleArchive(st, 'permanent')}
                                      className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Permanent Delete</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Clean Pagination Bar */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                <span>
                  Showing{' '}
                  <strong className="text-slate-900">
                    {Math.min(
                      (currentPage - 1) * ITEMS_PER_PAGE + 1,
                      filteredStudents.length
                    )}
                    -
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredStudents.length
                    )}
                  </strong>{' '}
                  of <strong className="text-slate-900">{filteredStudents.length}</strong> students
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-3 py-1 text-xs font-bold font-mono">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Roster Upload Wizard Modal */}
      <RosterUploadWizardModal
        isOpen={rosterWizardOpen}
        onClose={() => setRosterWizardOpen(false)}
        colleges={colleges}
        batches={batches}
        preselectedCollegeId={selectedCollegeId !== 'all' ? selectedCollegeId : undefined}
        preselectedBatchId={selectedBatchId !== 'all' ? selectedBatchId : undefined}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Bulk Action Modal */}
      <BulkStudentActionModal
        isOpen={bulkActionType !== null}
        onClose={() => setBulkActionType(null)}
        selectedStudents={selectedStudentsList}
        actionType={bulkActionType}
        onSuccess={() => {
          setSelectedIds(new Set());
          setSelectAllFiltered(false);
          router.refresh();
        }}
      />
    </div>
  );
}
