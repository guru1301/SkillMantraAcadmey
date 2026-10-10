import React from 'react';
import { notFound } from 'next/navigation';
import { getCollegeById } from '@/lib/db/colleges';
import { getStudentsByCollegeId } from '@/lib/db/students';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import CollegeTabs from '@/components/admin/CollegeTabs';
import StatusBadge from '@/components/admin/StatusBadge';
import CollegeStudentsList from '@/components/admin/CollegeStudentsList';
import { MapPin } from 'lucide-react';

interface CollegeStudentsPageProps {
  params: Promise<{ collegeId: string }>;
}

export default async function CollegeStudentsPage({
  params,
}: CollegeStudentsPageProps) {
  const { collegeId } = await params;

  const [college, students] = await Promise.all([
    getCollegeById(collegeId),
    getStudentsByCollegeId(collegeId),
  ]);

  if (!college) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Colleges', href: '/admin/colleges' },
          { label: college.name, href: `/admin/colleges/${college.id}` },
          { label: 'Students Roster' },
        ]}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#0A3A7A] text-[#FCAF0A] flex items-center justify-center font-black text-lg shadow-sm shrink-0">
            {college.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {college.name}
              </h1>
              <StatusBadge status={college.status} />
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {[college.city, college.state].filter(Boolean).join(', ') ||
                  'Location unassigned'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <CollegeTabs collegeId={college.id} activeTab="students" />

      <CollegeStudentsList
        collegeId={college.id}
        collegeName={college.name}
        initialStudents={students}
      />
    </div>
  );
}
