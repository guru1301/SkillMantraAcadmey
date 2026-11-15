import React from 'react';
import { getColleges, getDistinctCities } from '@/lib/db/colleges';
import PageHeader from '@/components/admin/PageHeader';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import CollegesDirectoryClient from '@/components/admin/CollegesDirectoryClient';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CollegesPage() {
  const [colleges, cities] = await Promise.all([
    getColleges(),
    getDistinctCities(),
  ]);

  return (
    <div className="space-y-3.5 sm:space-y-4 max-w-7xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Colleges' },
        ]}
      />

      <PageHeader
        title="Colleges &amp; Organizations"
        description="Manage all SkillThinker partner educational institutions and university cohorts"
        action={{
          label: 'Add College',
          href: '/admin/colleges/new',
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      {/* Interactive Colleges Directory with Instant Filtering & Optimistic Statuses */}
      <CollegesDirectoryClient initialColleges={colleges} cities={cities} />
    </div>
  );
}
