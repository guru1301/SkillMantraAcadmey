import React from 'react';
import { notFound } from 'next/navigation';
import { getCollegeById } from '@/lib/db/colleges';
import PageHeader from '@/components/admin/PageHeader';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import CollegeForm from '@/components/admin/CollegeForm';

interface EditCollegePageProps {
  params: Promise<{ collegeId: string }>;
}

export default async function EditCollegePage({ params }: EditCollegePageProps) {
  const { collegeId } = await params;
  const college = await getCollegeById(collegeId);

  if (!college) {
    notFound();
  }

  return (
    <div className="space-y-3.5 sm:space-y-4 max-w-6xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Colleges', href: '/admin/colleges' },
          { label: college.name, href: `/admin/colleges/${college.id}` },
          { label: 'Edit' },
        ]}
      />

      <PageHeader
        title={`Edit ${college.name}`}
        description="Update institutional details, key coordinator contact, or operating status"
      />

      <CollegeForm initialData={college} isEditing />
    </div>
  );
}
