import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, XCircle, Award, ShieldCheck, Calendar, Building2, User, BookOpen } from 'lucide-react';
import { API_CONFIG, getApiUrl } from '@/lib/api/config';

export const metadata: Metadata = {
  title: 'Official Credential Verification | SkillThinker',
  description: 'Verify authentic certificates and educational credentials issued by SkillThinker.',
};

export default async function CertificateVerificationPage(props: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await props.params;

  let verificationData: any = null;
  try {
    const res = await fetch(getApiUrl(`/certificates/verify/${code}`), {
      cache: 'no-store',
    });
    if (res.ok) {
      verificationData = await res.json();
    }
  } catch {
    verificationData = { valid: false };
  }

  const isValid = Boolean(verificationData?.valid);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/60 to-white flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
        {/* Accent Top Banner */}
        <div
          className={`h-2.5 w-full ${
            isValid ? 'bg-gradient-to-r from-emerald-500 via-[#0A3A7A] to-[#FCAF0A]' : 'bg-rose-500'
          }`}
        />

        <div className="p-8 sm:p-10 space-y-6 text-center">
          {/* Status Badge */}
          <div className="flex justify-center">
            {isValid ? (
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm ring-8 ring-emerald-500/10">
                <ShieldCheck className="w-9 h-9" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm ring-8 ring-rose-500/10">
                <XCircle className="w-9 h-9" />
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#062F68] tracking-tight">
              {isValid ? 'Authentic Credential Verified' : 'Invalid or Unrecognized Certificate'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              SkillThinker Central Academic Registry
            </p>
          </div>

          {isValid ? (
            <div className="text-left bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-400 font-medium block text-xs">Recipient Name</span>
                  <span className="font-bold text-slate-900 text-base">{verificationData.studentName}</span>
                  <span className="font-mono text-slate-500 block text-xs">Roll: {verificationData.studentRoll}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-slate-200/60 pt-3">
                <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-400 font-medium block text-xs">College Institution</span>
                  <span className="font-bold text-slate-800">{verificationData.collegeName}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-slate-200/60 pt-3">
                <BookOpen className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-400 font-medium block text-xs">Program Completed</span>
                  <span className="font-bold text-blue-900">{verificationData.programName}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-200/60 pt-3">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 font-medium block text-xs">Issue Date</span>
                    <span className="font-semibold text-slate-800">{verificationData.issuedAt || 'Verified'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Award className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 font-medium block text-xs">Attendance</span>
                    <span className="font-bold text-emerald-700">{verificationData.attendanceRate}%</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200/60 pt-3 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Cert No: {verificationData.certificateNumber}</span>
                <span className="text-emerald-700 font-bold bg-emerald-100/60 px-2 py-0.5 rounded">STATUS: ACTIVE</span>
              </div>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-xs sm:text-sm text-rose-800 space-y-2">
              <p className="font-semibold">
                No active certificate was found corresponding to verification token:
              </p>
              <p className="font-mono bg-white/70 py-1 px-2 rounded text-slate-700 break-all">{code}</p>
              <p className="text-slate-500 text-xs mt-2">
                This certificate may have been revoked, expired, or the verification link is malformed.
              </p>
            </div>
          )}

          <div className="pt-2">
            <Link
              href="/"
              className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline"
            >
              <span>← Return to SkillThinker</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

