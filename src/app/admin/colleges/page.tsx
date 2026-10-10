import React from 'react';
import Link from 'next/link';
import { getColleges, getDistinctCities } from '@/lib/db/colleges';
import PageHeader from '@/components/admin/PageHeader';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import StatusBadge from '@/components/admin/StatusBadge';
import EmptyState from '@/components/admin/EmptyState';
import CollegeFilters from '@/components/admin/CollegeFilters';
import {
  Building2,
  Plus,
  ArrowRight,
  Edit,
  Mail,
  Phone,
  Layers,
  GraduationCap,
} from 'lucide-react';

interface CollegesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    city?: string;
  }>;
}

export default async function CollegesPage({ searchParams }: CollegesPageProps) {
  const { search, status, city } = await searchParams;

  const [colleges, cities] = await Promise.all([
    getColleges({ search, status, city }),
    getDistinctCities(),
  ]);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Colleges' },
        ]}
      />

      <PageHeader
        title="Colleges & Organizations"
        description="Manage all Skill Matra partner educational institutions and university cohorts"
        action={{
          label: 'Add College',
          href: '/admin/colleges/new',
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      {/* Filter Toolbar */}
      <CollegeFilters
        cities={cities}
        currentSearch={search}
        currentStatus={status}
        currentCity={city}
      />

      {/* Colleges Table */}
      {colleges.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-8 h-8 text-slate-400" />}
          title="No colleges found"
          description={
            search || (status && status !== 'all') || (city && city !== 'all')
              ? 'Try modifying your search or filters to locate college records.'
              : 'No partner colleges have been registered yet. Add the first college to begin onboarding training batches.'
          }
          actionLabel="Add New College"
          actionHref="/admin/colleges/new"
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">College / Institution</th>
                  <th className="py-3.5 px-4">City & State</th>
                  <th className="py-3.5 px-4">Key Contact</th>
                  <th className="py-3.5 px-4 text-center">Active Batches</th>
                  <th className="py-3.5 px-4 text-center">Enrolled Students</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {colleges.map((college) => (
                  <tr
                    key={college.id}
                    className="hover:bg-slate-50/80 transition group"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {college.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/admin/colleges/${college.id}`}
                            className="font-bold text-slate-900 group-hover:text-blue-700 transition block text-sm"
                          >
                            {college.name}
                          </Link>
                          <span className="text-[11px] text-slate-500">
                            ID: {college.id.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {college.city || '—'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {college.state || 'India'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {college.contact_name ? (
                        <div>
                          <div className="font-semibold text-slate-900">
                            {college.contact_name}
                          </div>
                          {college.contact_email && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[160px]">
                                {college.contact_email}
                              </span>
                            </div>
                          )}
                          {college.contact_phone && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{college.contact_phone}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not specified</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold text-xs border border-blue-100">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span>{college.active_batches_count}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-100">
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{college.enrolled_students_count}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={college.status} />
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/colleges/${college.id}/edit`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                          title="Edit college details"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/colleges/${college.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-xs border border-blue-200 transition"
                        >
                          <span>Workspace</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>
              Showing {colleges.length} {colleges.length === 1 ? 'college' : 'colleges'}
            </span>
            <span>All stats queried directly from PostgreSQL</span>
          </div>
        </div>
      )}
    </div>
  );
}
