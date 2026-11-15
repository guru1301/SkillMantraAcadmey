'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  paramName?: string; // query param name, defaults to 'tab'
  defaultTab?: string;
  activeTab?: string; // optional override
  onChange?: (tabId: string) => void;
  className?: string;
}

export default function Tabs({
  tabs,
  paramName = 'tab',
  defaultTab,
  activeTab: controlledActiveTab,
  onChange,
  className = '',
}: TabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentParamValue = searchParams?.get(paramName);
  const activeId =
    controlledActiveTab ||
    currentParamValue ||
    defaultTab ||
    (tabs.length > 0 ? tabs[0].id : '');

  return (
    <div className={`border-b border-[#E4E8EF] ${className}`} role="tablist">
      <nav className="flex space-x-6 overflow-x-auto no-scrollbar" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;

          // If controlled by onChange without URL param rewrite
          if (onChange) {
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(tab.id)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-[#0A3A7A] text-[#0A3A7A]'
                    : 'border-transparent text-[#667085] hover:text-[#162033] hover:border-slate-300'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-blue-50 text-[#0A3A7A]'
                        : 'bg-slate-100 text-[#667085]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          }

          // URL-driven tab link
          const params = new URLSearchParams(searchParams?.toString() || '');
          params.set(paramName, tab.id);
          const href = `${pathname}?${params.toString()}`;

          return (
            <Link
              key={tab.id}
              href={href}
              role="tab"
              aria-selected={isActive}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-[#0A3A7A] text-[#0A3A7A]'
                  : 'border-transparent text-[#667085] hover:text-[#162033] hover:border-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-blue-50 text-[#0A3A7A]'
                      : 'bg-slate-100 text-[#667085]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
