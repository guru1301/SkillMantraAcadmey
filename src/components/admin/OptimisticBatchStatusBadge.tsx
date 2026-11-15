'use client';

import React, { useState, useOptimistic, useTransition, useRef, useEffect } from 'react';
import { ChevronDown, Check, Loader2 } from 'lucide-react';
import { updateBatchStatusAction } from '@/app/actions/batches';
import { useAdminToast } from './AdminToast';

export type BatchStatusType = 'planned' | 'active' | 'completed' | 'cancelled';

interface OptimisticBatchStatusBadgeProps {
  batchId: string;
  initialStatus: BatchStatusType;
  batchCode?: string;
  disabled?: boolean;
}

const STATUS_CONFIG: Record<
  BatchStatusType,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
  }
> = {
  planned: {
    label: 'Planned',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  active: {
    label: 'Active',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
  },
};

export default function OptimisticBatchStatusBadge({
  batchId,
  initialStatus,
  batchCode,
  disabled = false,
}: OptimisticBatchStatusBadgeProps) {
  const [currentStatus, setCurrentStatus] = useState<BatchStatusType>(initialStatus);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toast = useAdminToast();

  // React 19 Optimistic State
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    currentStatus,
    (_state, newStatus: BatchStatusType) => newStatus
  );

  // Close dropdown on click outside
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

  const handleSelectStatus = (newStatus: BatchStatusType) => {
    if (newStatus === optimisticStatus || isPending) {
      setIsOpen(false);
      return;
    }

    setIsOpen(false);

    startTransition(async () => {
      // 1. Optimistically update UI in 0ms
      setOptimisticStatus(newStatus);

      try {
        const res = await updateBatchStatusAction(batchId, newStatus);
        if (res.success) {
          setCurrentStatus(newStatus);
          toast.success(
            batchCode
              ? `Batch ${batchCode} marked as ${STATUS_CONFIG[newStatus].label}.`
              : `Batch marked as ${STATUS_CONFIG[newStatus].label}.`
          );
        } else {
          toast.error(res.error || 'Failed to update batch status.');
        }
      } catch (err: any) {
        toast.error('Network error updating batch status.');
      }
    });
  };

  const currentCfg = STATUS_CONFIG[optimisticStatus] || STATUS_CONFIG.planned;

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
        title="Click to quickly change batch status"
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-36 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-50 text-xs animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            Change Status
          </div>
          {(['planned', 'active', 'completed', 'cancelled'] as BatchStatusType[]).map((st) => {
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
