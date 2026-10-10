import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTrainerById } from '@/lib/db/trainers';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import TrainerDetailView from '@/components/admin/TrainerDetailView';

interface TrainerDetailPageProps {
  params: Promise<{ trainerId: string }>;
}

export async function generateMetadata({
  params,
}: TrainerDetailPageProps): Promise<Metadata> {
  const { trainerId } = await params;
  const trainer = await getTrainerById(trainerId);
  return {
    title: trainer
      ? `${trainer.full_name} | Faculty Profile | Skill Matra`
      : 'Trainer Not Found | Skill Matra',
  };
}

export const dynamic = 'force-dynamic';

export default async function TrainerDetailPage({ params }: TrainerDetailPageProps) {
  const { trainerId } = await params;
  const trainer = await getTrainerById(trainerId);

  if (!trainer) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Trainers Directory', href: '/admin/trainers' },
          { label: trainer.full_name },
        ]}
      />

      <TrainerDetailView trainer={trainer} />
    </div>
  );
}
