'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import BatchForm from './BatchForm';
import ProgramModal from './ProgramModal';
import { ProgramRecord } from '@/lib/db/programs';

interface NewBatchWrapperProps {
  collegeId: string;
  collegeName: string;
  initialPrograms: ProgramRecord[];
}

export default function NewBatchWrapper({
  collegeId,
  collegeName,
  initialPrograms,
}: NewBatchWrapperProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [programsList, setProgramsList] = useState(initialPrograms);

  return (
    <>
      <BatchForm
        collegeId={collegeId}
        collegeName={collegeName}
        programs={programsList}
        onOpenNewProgramModal={() => setModalOpen(true)}
      />

      <ProgramModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(newProg) => {
          setProgramsList((prev) => [
            {
              id: newProg.id,
              name: newProg.name,
              description: null,
              duration_days: 30,
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            ...prev,
          ]);
          router.refresh();
        }}
      />
    </>
  );
}
