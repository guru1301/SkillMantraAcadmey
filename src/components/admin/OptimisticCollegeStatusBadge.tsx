'use client';

import React, { useState, useOptimistic, useTransition, useRef, useEffect } from 'react';
import { ChevronDown, Check, Loader2 } from 'lucide-react';
import { updateCollegeStatusAction } from '@/app/actions/colleges';
import { useAdminToast } from './AdminToast';

export type CollegeStatusType = 'active' | 'inactive';

interface OptimisticCollegeStatusBadgeProps {
  collegeId: string;
  initialStatus: CollegeStatusType;
  collegeName?: string;
  disabled?: boolean;
}

const STATUS_CONFIG: Record<
  CollegeStatusType,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
  }
> = {
  active: {
    label: 'Active',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  inactive: {
    label: 'Inactive',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
  },
};

export default function OptimisticCollegeStatusBadge({
  collegeId,
  initialStatus,
  collegeName,
  disabled = false,
}: OptimisticCollegeStatusBadgeProps) {
  const [currentStatus, setCurrentStatus] = useState<CollegeStatusType>(initialStatus);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toast = useAdminToast();

  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    currentStatus,
    (_state, newStatus: CollegeStatusType) => newStatus
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectStatus = (newStatus: CollegeStatusType) => {
    if (newStatus === optimisticStatus || isPending) {
      setIsOpen(false);
      return;
    }

    setIsOpen(false);

    startTransition(async () => {
      setOptimisticStatus(newStatus);

      try {
        const res = await updateCollegeStatusAction(collegeId, newStatus);
        if (res.success) {
          setCurrentStatus(newStatus);
          toast.success(
            collegeName
              ? `${collegeName} is now ${STATUS_CONFIG[newStatus].label}.`
              : `College marked as ${STATUS_CONFIG[newStatus].label}.`
          );
        } else {
          toast.error(res.error || 'Failed to update college status.');
        }
      } catch (err: any) {
        toast.error('Network error updating college status.');
      }
    });
  };

  const currentCfg = STATUS_CONFIG[optimisticStatus] || STATUS_CONFIG.active;

  if (disabled) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${currentCfg.bg} ${currentCfg.text} ${currentCfg.border}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${currentCfg.dot}`} />
        <span>{currentCfg.label}</span>
      </span>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isPending}
        title="Click to toggle institution status"
        className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer shadow-2xs hover:shadow-xs ${currentCfg.bg} ${currentCfg.text} ${currentCfg.border}`}
      >
        {isPending ? (
          <Loader2 className="w-2.5 h-2.5 animate-spin text-slate-500" />
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full ${currentCfg.dot}`} />
        )}
        <span>{currentCfg.label}</span>
        <ChevronDown
          className={`w-3 h-3 opacity-60 group-hover:opacity-100 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-32 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-50 text-xs animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            Status
          </div>
          {(['active', 'inactive'] as CollegeStatusType[]).map((st) => {
            const cfg = STATUS_CONFIG[st];
            const isSelected = st === optimisticStatus;

            return (
              <button
                key={st}
                type="button"
                onClick={() => handleSelectStatus(st)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-left transition hover:bg-slate-50 cursor-pointer ${
                  isSelected ? 'font-bold text-slate-900 bg-slate-50/50' : 'text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span>{cfg.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#0A3A7A]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
