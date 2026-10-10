import React from 'react';
import { getPrograms } from '@/lib/db/programs';
import PageHeader from '@/components/admin/PageHeader';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import ProgramsListClient from '@/components/admin/ProgramsListClient';

interface ProgramsPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function ProgramsPage({ searchParams }: ProgramsPageProps) {
  const { status } = await searchParams;
  const programs = await getPrograms({ status });

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Programs' },
        ]}
      />

      <PageHeader
        title="Training Programs Catalog"
        description="Global curriculum library reusable across multiple colleges, cohorts, and skill tracks"
      />

      <ProgramsListClient programs={programs} />
    </div>
  );
}
