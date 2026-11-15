'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Plus,
  ArrowRight,
  Edit,
  Mail,
  Phone,
  Layers,
  GraduationCap,
  Zap,
} from 'lucide-react';
import { CollegeWithCounts } from '@/lib/db/colleges';
import OptimisticCollegeStatusBadge, { CollegeStatusType } from './OptimisticCollegeStatusBadge';
import EmptyState from './EmptyState';

interface CollegesDirectoryClientProps {
  initialColleges: CollegeWithCounts[];
  cities: string[];
}

export default function CollegesDirectoryClient({
  initialColleges,
  cities,
}: CollegesDirectoryClientProps) {
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');

  const counts = useMemo(() => {
    return {
      all: initialColleges.length,
      active: initialColleges.filter((c) => c.status === 'active').length,
      inactive: initialColleges.filter((c) => c.status === 'inactive').length,
    };
  }, [initialColleges]);

  // Client-side instant filtering (0ms latency)
  const filteredColleges = useMemo(() => {
    return initialColleges.filter((c) => {
      // 1. Tab filter
      if (activeTab !== 'all' && c.status !== activeTab) {
        return false;
      }

      // 2. City filter
      if (
        selectedCity !== 'all' &&
        (!c.city || c.city.toLowerCase() !== selectedCity.toLowerCase())
      ) {
        return false;
      }

      // 3. Search query
      const q = search.toLowerCase().trim();
      if (!q) return true;

      return (
        c.name.toLowerCase().includes(q) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.state && c.state.toLowerCase().includes(q)) ||
        (c.contact_name && c.contact_name.toLowerCase().includes(q)) ||
        (c.contact_email && c.contact_email.toLowerCase().includes(q))
      );
    });
  }, [initialColleges, activeTab, selectedCity, search]);

  return (
    <div className="space-y-4">
      {/* 1. Instant Status Filter Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { key: 'all', label: 'All Institutions', count: counts.all },
              { key: 'active', label: 'Active Partners', count: counts.active },
              { key: 'inactive', label: 'Inactive', count: counts.inactive },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0A3A7A] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & City Filter */}
        <div className="flex items-center gap-2 flex-1 sm:max-w-md justify-end">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search college, city, or coordinator..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0A3A7A]/20 focus:border-[#0A3A7A]"
            />
          </div>

          {cities.length > 0 && (
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-hidden max-w-[140px] truncate"
            >
              <option value="all">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 2. Colleges Table */}
      {filteredColleges.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-8 h-8 text-slate-400" />}
          title={search ? 'No matching colleges found' : 'No partner colleges registered'}
          description={
            search
              ? `No partner institutions match "${search}". Try adjusting your filters.`
              : 'Register a partner educational institution or university campus to start scheduling cohorts.'
          }
          actionLabel="Add Partner College"
          actionHref="/admin/colleges/new"
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">College / Institution</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Coordinator Contact</th>
                  <th className="py-3 px-4 text-center">Active Batches</th>
                  <th className="py-3 px-4 text-center">Enrolled Students</th>
                  <th className="py-3 px-4">Quick Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredColleges.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition group">
                    {/* College Identity */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-[#0A3A7A] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/admin/colleges/${c.id}`}
                            className="font-bold text-slate-900 group-hover:text-[#0A3A7A] transition block text-xs"
                          >
                            {c.name}
                          </Link>
                          {c.contact_name && (
                            <span className="text-[11px] text-slate-400 block font-normal">
                              Lead: {c.contact_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{c.city || '—'}</div>
                      <div className="text-[11px] text-slate-400">{c.state || 'India'}</div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      {c.contact_email ? (
                        <div className="space-y-0.5">
                          <div className="text-slate-800 font-medium flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[150px]">{c.contact_email}</span>
                          </div>
                          {c.contact_phone && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{c.contact_phone}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not specified</span>
                      )}
                    </td>

                    {/* Active Batches */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-900 font-bold text-xs border border-blue-100">
                        <Layers className="w-3 h-3 text-blue-600" />
                        <span>{c.active_batches_count}</span>
                      </span>
                    </td>

                    {/* Enrolled Students */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-900 font-bold text-xs border border-emerald-100">
                        <GraduationCap className="w-3 h-3 text-emerald-600" />
                        <span>{c.enrolled_students_count}</span>
                      </span>
                    </td>

                    {/* Optimistic Status Badge with instant toggle */}
                    <td className="py-3.5 px-4">
                      <OptimisticCollegeStatusBadge
                        collegeId={c.id}
                        initialStatus={c.status as CollegeStatusType}
                        collegeName={c.name}
                      />
                    </td>

                    {/* Row Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/colleges/${c.id}/batches/new`}
                          title="Schedule a new batch for this college"
                          className="p-1 rounded-md text-slate-500 hover:text-[#0A3A7A] hover:bg-blue-50 transition"
                        >
                          <Plus className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/colleges/${c.id}/edit`}
                          title="Edit institution details"
                          className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/colleges/${c.id}`}
                          className="inline-flex items-center gap-1 font-bold text-xs text-[#0A3A7A] hover:underline px-2.5 py-1 rounded-md hover:bg-blue-50 transition"
                        >
                          <span>View College</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500 flex items-center justify-between">
            <span>
              Showing {filteredColleges.length} of {initialColleges.length} partner institution(s)
            </span>
            <span className="text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Status changes update optimistically in 0ms</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
