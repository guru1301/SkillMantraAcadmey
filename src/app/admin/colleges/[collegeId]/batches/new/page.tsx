import React from 'react';
import { notFound } from 'next/navigation';
import { getCollegeById } from '@/lib/db/colleges';
import { getPrograms } from '@/lib/db/programs';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import PageHeader from '@/components/admin/PageHeader';
import NewBatchWrapper from '@/components/admin/NewBatchWrapper';

interface NewBatchPageProps {
  params: Promise<{ collegeId: string }>;
}

export default async function NewBatchPage({ params }: NewBatchPageProps) {
  const { collegeId } = await params;

  const [college, programs] = await Promise.all([
    getCollegeById(collegeId),
    getPrograms({ status: 'active' }),
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
          { label: 'Batches', href: `/admin/colleges/${college.id}/batches` },
          { label: 'Create Batch' },
        ]}
      />

      <PageHeader
        title="Initialize Training Batch"
        description={`Set up a training cohort for ${college.name} with curriculum and timeline.`}
      />

      <NewBatchWrapper
        collegeId={college.id}
        collegeName={college.name}
        initialPrograms={programs}
      />
    </div>
  );
}
