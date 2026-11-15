'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Layers,
  Building2,
  Users,
  GraduationCap,
  CalendarCheck,
  FolderOpen,
  BarChart3,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Command,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  category: 'Actions' | 'Navigation';
  icon: React.ComponentType<{ className?: string }>;
}

const DEFAULT_COMMANDS: CommandItem[] = [
  {
    id: 'create-batch',
    title: 'Create Training Batch',
    subtitle: 'Step-by-step guided batch wizard with trainers & students',
    href: '/admin/batches/new',
    category: 'Actions',
    icon: Plus,
  },
  {
    id: 'add-college',
    title: 'Add Partner College',
    subtitle: 'Register a new institutional campus or university partner',
    href: '/admin/colleges/new',
    category: 'Actions',
    icon: Building2,
  },
  {
    id: 'mark-attendance',
    title: 'Mark Session Attendance',
    subtitle: 'Rapid daily attendance entry with 1-click toggles',
    href: '/admin/attendance',
    category: 'Actions',
    icon: CalendarCheck,
  },
  {
    id: 'import-students',
    title: 'Import Students via CSV',
    subtitle: 'Bulk roster upload with instant column validation',
    href: '/admin/students',
    category: 'Actions',
    icon: GraduationCap,
  },
  {
    id: 'nav-batches',
    title: 'All Training Batches',
    subtitle: 'View, filter, and manage all active & planned batches',
    href: '/admin/batches',
    category: 'Navigation',
    icon: Layers,
  },
  {
    id: 'nav-colleges',
    title: 'Partner Colleges Directory',
    subtitle: 'Directory of all affiliated colleges and contacts',
    href: '/admin/colleges',
    category: 'Navigation',
    icon: Building2,
  },
  {
    id: 'nav-trainers',
    title: 'Faculty & Trainers Directory',
    subtitle: 'Certified domain instructors and active assignments',
    href: '/admin/trainers',
    category: 'Navigation',
    icon: Users,
  },
  {
    id: 'nav-materials',
    title: 'Curriculum Learning Materials',
    subtitle: 'Course syllabi, lecture slides, and student resources',
    href: '/admin/resources',
    category: 'Navigation',
    icon: FolderOpen,
  },
  {
    id: 'nav-reports',
    title: 'Reports & Institutional Analytics',
    subtitle: 'Batch capacity utilization and institutional reports',
    href: '/admin/reports',
    category: 'Navigation',
    icon: BarChart3,
  },
  {
    id: 'nav-portal',
    title: 'Switch to College Portal View',
    subtitle: 'Preview the institutional coordinator experience',
    href: '/portal',
    category: 'Navigation',
    icon: ExternalLink,
  },
];

interface AdminCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminCommandPalette({ isOpen, onClose }: AdminCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter commands based on search
  const filteredCommands = DEFAULT_COMMANDS.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation inside palette
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(filteredCommands.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? Math.max(filteredCommands.length - 1, 0) : prev - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          const target = filteredCommands[selectedIndex];
          onClose();
          router.push(target.href);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose, router]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Modal */}
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden transform animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50/50">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, search pages, or jump to actions..."
            className="w-full text-xs sm:text-sm bg-transparent border-none text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100">
          {filteredCommands.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No actions found matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    onClose();
                    router.push(cmd.href);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                    isSelected ? 'bg-blue-50 text-[#0A3A7A]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#0A3A7A] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {cmd.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {cmd.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        cmd.category === 'Actions'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {cmd.category}
                    </span>
                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5 text-[#0A3A7A]" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Palette Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">
                ↓
              </kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">
                ↵
              </kbd>
              <span>to select</span>
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">SkillThinker Command Bar</span>
        </div>
      </div>
    </div>
  );
}
