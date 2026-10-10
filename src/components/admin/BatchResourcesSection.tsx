'use client';

import React, { useState } from 'react';
import { ResourceRecord } from '@/lib/db/resources';
import ResourceModal from './ResourceModal';
import {
  FolderPlus,
  HardDrive,
  ExternalLink,
  FileText,
  Video,
  Link2,
  Calendar,
} from 'lucide-react';

interface BatchResourcesSectionProps {
  batchId: string;
  initialResources: ResourceRecord[];
}

export default function BatchResourcesSection({
  batchId,
  initialResources,
}: BatchResourcesSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case 'google_drive':
        return <HardDrive className="w-5 h-5 text-emerald-600" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-600" />;
      default:
        return <Link2 className="w-5 h-5 text-slate-600" />;
    }
  };

  const getBadge = (type: string) => {
    switch (type) {
      case 'google_drive':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Google Drive
          </span>
        );
      case 'document':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Document
          </span>
        );
      case 'video':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            Video
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Link
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-600" />
            Batch Resources & Drive Links
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Access shared curriculum folders, drive repos, and reference docs.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm hover:shadow transition"
        >
          <FolderPlus className="w-4 h-4" />
          <span>+ Add Resource</span>
        </button>
      </div>

      <div className="p-6">
        {initialResources.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400 mb-3 shadow-sm">
              <HardDrive className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No resources attached yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Attach a Google Drive folder link or course repository for this cohort.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#082e61] text-white font-semibold text-xs shadow transition"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Attach Google Drive URL</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {initialResources.map((res) => (
              <div
                key={res.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm bg-slate-50/40 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                        {getIcon(res.type)}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition">
                          {res.name}
                        </h4>
                        <div className="mt-0.5">{getBadge(res.type)}</div>
                      </div>
                    </div>
                  </div>

                  {res.description && (
                    <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                      {res.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(res.created_at).toLocaleDateString()}</span>
                  </div>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-900 hover:underline"
                  >
                    <span>Open Resource</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ResourceModal
        isOpen={modalOpen}
        batchId={batchId}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
