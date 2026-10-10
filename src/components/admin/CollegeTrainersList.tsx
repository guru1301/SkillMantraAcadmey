'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Mail,
  Phone,
  Layers,
  ShieldCheck,
  ExternalLink,
  Crown,
  Calendar,
} from 'lucide-react';
import { CollegeAssignedTrainerRecord } from '@/lib/db/trainers';
import StatusBadge from '@/components/admin/StatusBadge';

interface CollegeTrainersListProps {
  collegeId: string;
  collegeName: string;
  trainers: CollegeAssignedTrainerRecord[];
}

export default function CollegeTrainersList({
  collegeId,
  collegeName,
  trainers,
}: CollegeTrainersListProps) {
  const [search, setSearch] = useState('');

  const filtered = trainers.filter((t) => {
    const s = search.toLowerCase().trim();
    if (!s) return true;
    return (
      t.full_name.toLowerCase().includes(s) ||
      (t.email && t.email.toLowerCase().includes(s)) ||
      (t.skills && t.skills.toLowerCase().includes(s)) ||
      t.batch_code.toLowerCase().includes(s) ||
      t.program_name.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Assigned Faculty &amp; Instructors</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Technical trainers and mentors currently instructing cohorts at{' '}
            <strong className="text-slate-800">{collegeName}</strong>.
          </p>
        </div>

        <Link
          href="/admin/trainers"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 shadow-2xs transition self-start sm:self-auto"
        >
          <Users className="w-3.5 h-3.5 text-blue-600" />
          <span>Trainers Directory</span>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by instructor name, batch, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
          />
        </div>
      </div>

      {/* List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {trainers.length === 0 ? (
          <div className="py-14 text-center px-4">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No trainers assigned yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Instructors are allocated to specific batches within the Batch Workspace.
            </p>
            <Link
              href={`/admin/colleges/${collegeId}/batches`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A3A7A] text-white font-bold text-xs shadow-sm hover:bg-[#082e61] transition"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>View College Batches</span>
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            No instructors found matching &quot;{search}&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Assigned Cohort</th>
                  <th className="py-3 px-4">Program</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((t, idx) => (
                  <tr key={`${t.trainer_id}-${t.batch_id}-${idx}`} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {t.full_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/admin/trainers/${t.trainer_id}`}
                            className="font-bold text-slate-900 hover:text-blue-700 transition block"
                          >
                            {t.full_name}
                          </Link>
                          {t.email && (
                            <span className="text-[11px] text-slate-400 font-normal">
                              {t.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {t.is_lead ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
                          <Crown className="w-3 h-3 text-amber-600" />
                          <span>Lead Trainer</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          {t.role || 'Assistant'}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <Link
                        href={`/admin/batches/${t.batch_id}`}
                        className="font-mono font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-100 transition"
                      >
                        {t.batch_code}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      {t.program_name}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {t.start_date} → {t.end_date}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/batches/${t.batch_id}/trainers`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline"
                      >
                        <span>Manage Assignment</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
