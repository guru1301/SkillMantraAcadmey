'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { loginAction } from '@/app/actions/auth';
import { activateStudentAccountAction } from '@/app/actions/students';

export default function LoginForm() {
  const router = useRouter();

  // Active view: 'login' or 'activate'
  const [activeTab, setActiveTab] = useState<'login' | 'activate'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Activation form state
  const [activateRoll, setActivateRoll] = useState('');
  const [activateCollegeCode, setActivateCollegeCode] = useState('');
  const [activateEmail, setActivateEmail] = useState('');
  const [activateDob, setActivateDob] = useState('');
  const [activateCode, setActivateCode] = useState('');
  const [activateNewPw, setActivateNewPw] = useState('');
  const [activateConfirmPw, setActivateConfirmPw] = useState('');
  const [showActivatePw, setShowActivatePw] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;

    if (!email.trim() || !password) {
      setErrorMessage('Invalid email or password.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('email', email.trim());
    formData.append('password', password);

    startTransition(async () => {
      try {
        const response = await loginAction(null, formData);

        if (response.success && response.redirectTo) {
          window.location.href = response.redirectTo;
        } else {
          setErrorMessage(response.error || 'Invalid email or password.');
        }
      } catch (err) {
        setErrorMessage('Invalid email or password.');
      }
    });
  };

  const handleActivateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isActivating) return;

    if (!activateRoll.trim() || !activateDob.trim() || !activateCode.trim() || !activateNewPw) {
      setErrorMessage('Please fill in all activation fields.');
      return;
    }

    if (activateNewPw.length < 10) {
      setErrorMessage('New password must be at least 10 characters long.');
      return;
    }

    if (activateNewPw !== activateConfirmPw) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsActivating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await activateStudentAccountAction({
      roll_number: activateRoll.trim().toUpperCase(),
      dob: activateDob.trim(),
      activation_code: activateCode.trim().toUpperCase(),
      new_password: activateNewPw,
      college_code: activateCollegeCode.trim() ? activateCollegeCode.trim().toUpperCase() : undefined,
      email: activateEmail.trim() ? activateEmail.trim().toLowerCase() : undefined,
    });

    setIsActivating(false);

    if (res.success) {
      setSuccessMessage('Account activated successfully! You can now sign in with your roll number and new password.');
      setEmail(activateRoll.trim().toUpperCase());
      setPassword('');
      setActiveTab('login');
      // Clear activation form
      setActivateRoll('');
      setActivateCollegeCode('');
      setActivateEmail('');
      setActivateDob('');
      setActivateCode('');
      setActivateNewPw('');
      setActivateConfirmPw('');
    } else {
      setErrorMessage(res.error || 'Activation failed. Please check your credentials.');
    }
  };

  return (
    <div className="w-full max-w-[440px] mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white border border-slate-200 shadow-xs mb-3 p-1.5">
          <Image
            src="/images/brand/logo.png"
            alt="SkillThinker Logo"
            width={48}
            height={48}
            className="w-full h-full object-contain"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#062F68]">
          SKILLTHINKER
        </h1>
        <p className="text-xs font-medium text-slate-500 tracking-wide mt-0.5">
          Enterprise Training Management Platform
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage(null);
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In to Portal
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('activate');
              setErrorMessage(null);
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'activate'
                ? 'bg-[#0A3A7A] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Activate Account</span>
          </button>
        </div>

        {/* Success Notification */}
        {successMessage && (
          <div
            role="status"
            className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: PORTAL SIGN IN */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Email or Roll Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="name@college.edu or 22CS101"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0A3A7A]/20 focus:border-[#0A3A7A] transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0A3A7A]/20 focus:border-[#0A3A7A] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 px-4 bg-[#0A3A7A] hover:bg-[#062F68] disabled:bg-[#0A3A7A]/70 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* TAB 2: STUDENT FIRST-TIME ACTIVATION */
          <form onSubmit={handleActivateSubmit} className="space-y-3.5">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
              <span className="font-bold">First-time student activation:</span> Enter your institutional roll number, date of birth, and single-use activation credential to set your password.
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Student Roll Number *
              </label>
              <input
                type="text"
                required
                value={activateRoll}
                onChange={(e) => setActivateRoll(e.target.value)}
                placeholder="e.g. 22CS101"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono placeholder:text-slate-400 focus:outline-hidden focus:border-[#0A3A7A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="college_code" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  College Code <span className="text-slate-400 font-normal lowercase">(opt)</span>
                </label>
                <input
                  id="college_code"
                  type="text"
                  value={activateCollegeCode}
                  onChange={(e) => setActivateCollegeCode(e.target.value)}
                  placeholder="e.g. COL-001"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono uppercase placeholder:text-slate-400 focus:outline-hidden focus:border-[#0A3A7A]"
                />
              </div>
              <div>
                <label htmlFor="activation_email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Email <span className="text-slate-400 font-normal lowercase">(opt)</span>
                </label>
                <input
                  id="activation_email"
                  type="email"
                  value={activateEmail}
                  onChange={(e) => setActivateEmail(e.target.value)}
                  placeholder="student@college.edu"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#0A3A7A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Date of Birth (Identity Verification) *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={activateDob}
                  onChange={(e) => setActivateDob(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:border-[#0A3A7A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Activation Credential *
              </label>
              <input
                type="text"
                required
                value={activateCode}
                onChange={(e) => setActivateCode(e.target.value)}
                placeholder="e.g. ACT-X7K9-W2M4"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono uppercase placeholder:text-slate-400 focus:outline-hidden focus:border-[#0A3A7A]"
              />
              <span className="block text-[10px] text-slate-400 mt-0.5">
                Provided on your institution activation report
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Set New Personal Password *
              </label>
              <div className="relative">
                <input
                  type={showActivatePw ? 'text' : 'password'}
                  required
                  minLength={10}
                  value={activateNewPw}
                  onChange={(e) => setActivateNewPw(e.target.value)}
                  placeholder="Minimum 10 characters"
                  className="w-full px-3.5 py-2 pr-9 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#0A3A7A]"
                />
                <button
                  type="button"
                  onClick={() => setShowActivatePw(!showActivatePw)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showActivatePw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Confirm New Password *
              </label>
              <input
                type={showActivatePw ? 'text' : 'password'}
                required
                minLength={10}
                value={activateConfirmPw}
                onChange={(e) => setActivateConfirmPw(e.target.value)}
                placeholder="Re-type password"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#0A3A7A]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isActivating}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isActivating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Activating Account...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify &amp; Activate Account</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Security Disclaimer */}
      <p className="text-center text-[11px] text-slate-400 mt-5 flex items-center justify-center gap-1.5">
        <Lock className="w-3 h-3 text-slate-400" />
        <span>Authorized Personnel Only • Neon PostgreSQL Protected</span>
      </p>

      {/* Back to Public Website */}
      <div className="text-center mt-3">
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-[#0A3A7A] transition font-medium inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to SkillThinker Website</span>
        </Link>
      </div>
    </div>
  );
}
