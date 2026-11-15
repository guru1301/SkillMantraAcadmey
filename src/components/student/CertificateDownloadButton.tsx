'use client';

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

interface CertificateDownloadButtonProps {
  eligible: boolean;
  pendingRequirement?: string | null;
  batchId?: string;
}

export default function CertificateDownloadButton({
  eligible,
  pendingRequirement,
  batchId,
}: CertificateDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!eligible || !batchId) return;
    setDownloading(true);

    try {
      // 1. Explicitly issue the certificate via POST before initiating download (P2-10 & P4-08)
      await fetch(`/api/certificates/${batchId}/issue`, {
        method: 'POST',
      });

      // 2. Stream the issued certificate PDF
      const downloadUrl = `/api/certificates/${batchId}/download`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'Official_Certificate.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Certificate download error:', err);
    } finally {
      setTimeout(() => {
        setDownloading(false);
      }, 2500);
    }
  };

  return (
    <div className="space-y-3 pt-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={!eligible || downloading}
        className={`inline-flex items-center justify-center gap-2.5 h-13 px-8 rounded-xl text-base font-bold transition-all shadow-md active:scale-[0.99] cursor-pointer ${
          eligible
            ? 'bg-[#0A3A7A] text-white hover:bg-[#062F68] shadow-[#0A3A7A]/20'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/80 shadow-none'
        }`}
      >
        {downloading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Download className="w-5 h-5" />}
        <span>{downloading ? 'Preparing Official PDF...' : 'Download Official Certificate (PDF)'}</span>
      </button>
      {!eligible && (
        <p className="text-xs sm:text-sm font-medium text-amber-700 bg-amber-50/80 border border-amber-200/60 rounded-xl px-4 py-2.5 inline-block">
          {pendingRequirement || 'Available after all requirements are completed.'}
        </p>
      )}
    </div>
  );
}
