import React from 'react';
import Link from 'next/link';
import { getAllStudents } from '@/lib/db/students';
import { getColleges } from '@/lib/db/colleges';
import { getBatches } from '@/lib/db/batches';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import StudentsDirectoryClient from '@/components/admin/StudentsDirectoryClient';
import { Download, Upload, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface StudentsPageProps {
  searchParams: Promise<{
    search?: string;
    collegeId?: string;
    batchId?: string;
    department?: string;
  }>;
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const { search, collegeId, batchId, department } = await searchParams;

  const [{ students, total }, colleges, batches] = await Promise.all([
    getAllStudents({ search, collegeId, batchId, department, limit: 100 }),
    getColleges(),
    getBatches(),
  ]);

  return (
    <div className="space-y-3.5 sm:space-y-4 max-w-7xl mx-auto">
      {/* 1. Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Students' },
        ]}
      />

      {/* 2. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Students Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified student records and academic cohort rosters across all partner colleges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/sample_students_demo.csv"
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV Template</span>
          </a>
        </div>
      </div>

      {/* 3. Interactive Students Directory with Search, Filters, and Roster */}
      <StudentsDirectoryClient
        students={students}
        total={total}
        colleges={colleges.map((c) => ({
          id: c.id,
          name: c.name,
          city: c.city,
          enrolled_students_count: c.enrolled_students_count,
        }))}
        batches={batches.map((b) => ({
          id: b.id,
          code: b.code,
          college_id: b.college_id,
          college_name: b.college_name,
          program_name: b.program_name,
          actual_students_count: b.actual_students_count,
          target_strength: b.target_strength,
        }))}
        currentSearch={search}
        currentCollegeId={collegeId}
        currentBatchId={batchId}
      />
    </div>
  );
}
