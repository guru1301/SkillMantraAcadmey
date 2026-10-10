import React from 'react';
import PageHeader from '@/components/admin/PageHeader';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import CollegeForm from '@/components/admin/CollegeForm';

export default function NewCollegePage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Colleges', href: '/admin/colleges' },
          { label: 'New College' },
        ]}
      />

      <PageHeader
        title="Add Partner College"
        description="Register a new academic partner institution or enterprise campus in Skill Matra"
      />

      <CollegeForm />
    </div>
  );
}
