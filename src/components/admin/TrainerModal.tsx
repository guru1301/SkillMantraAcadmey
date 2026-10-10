'use client';

import React from 'react';
import { X, UserPlus, Edit3 } from 'lucide-react';
import TrainerForm from './TrainerForm';
import { TrainerInput } from '@/lib/validations/trainer';

interface TrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEdit?: boolean;
  trainerId?: string;
  initialData?: Partial<TrainerInput>;
  onSuccess?: (id?: string) => void;
}

export default function TrainerModal({
  isOpen,
  onClose,
  isEdit = false,
  trainerId,
  initialData,
  onSuccess,
}: TrainerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-[#062F68] to-[#0A3A7A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-[#FCAF0A]">
              {isEdit ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {isEdit ? 'Edit Trainer Profile' : 'Register New Trainer'}
              </h3>
              <p className="text-xs text-blue-200">
                {isEdit
                  ? 'Update instructor qualifications and contact details.'
                  : 'Add a technical trainer to the Skill Mantra faculty network.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <TrainerForm
            isEdit={isEdit}
            trainerId={trainerId}
            initialData={initialData}
            onSuccess={(id) => {
              if (onSuccess) onSuccess(id);
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
