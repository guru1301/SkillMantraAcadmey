'use client';

import React, { useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';

interface CollegeFiltersProps {
  cities: string[];
  currentSearch?: string;
  currentStatus?: string;
  currentCity?: string;
}

export default function CollegeFilters({
  cities,
  currentSearch = '',
  currentStatus = 'all',
  currentCity = 'all',
}: CollegeFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (value && value !== 'all' && value.trim() !== '') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const clearAll = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters =
    (currentSearch && currentSearch.trim() !== '') ||
    (currentStatus && currentStatus !== 'all') ||
    (currentCity && currentCity !== 'all');

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
      {/* Search Bar */}
      <div className="relative flex-1 w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search colleges by name or city..."
          defaultValue={currentSearch}
          onChange={(e) => updateParam('search', e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
        />
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* Status Filter */}
        <select
          value={currentStatus}
          onChange={(e) => updateParam('status', e.target.value)}
          className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-white text-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* City Filter */}
        <select
          value={currentCity}
          onChange={(e) => updateParam('city', e.target.value)}
          className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-white text-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition cursor-pointer max-w-[140px] truncate"
        >
          <option value="all">All Cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        {/* Clear Filter Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 transition"
            title="Reset filters"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
