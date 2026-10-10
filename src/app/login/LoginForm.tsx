'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, Eye, EyeOff, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { loginAction } from '@/app/actions/auth';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDemoAdminFill = () => {
    setEmail('admin@skillmatra.com');
    setPassword('1234');
    setErrorMessage(null);
  };

  const handleDemoCollegeFill = () => {
    setEmail('coordinator@saranathan.ac.in');
    setPassword('1234');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;

    if (!email.trim() || !password) {
      setErrorMessage('Invalid email or password.');
      return;
    }

    setErrorMessage(null);

    const formData = new FormData();
    formData.append('email', email.trim());
    formData.append('password', password);

    startTransition(async () => {
      try {
        const response = await loginAction(null, formData);

        if (response.success && response.redirectTo) {
          router.push(response.redirectTo);
          router.refresh();
        } else {
          setErrorMessage(response.error || 'Invalid email or password.');
        }
      } catch (err) {
        setErrorMessage('Invalid email or password.');
      }
    });
  };

  return (
    <div className="w-full max-w-[420px] mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0A3A7A] text-[#FCAF0A] font-extrabold text-xl shadow-sm mb-3">
          SM
        </div>
        <h1 className="text-2xl font-black tracking-tight text-[#062F68]">
          SKILL MATRA
        </h1>
        <p className="text-xs font-medium text-slate-500 tracking-wide mt-0.5">
          Training Management Platform
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-7 sm:p-8">
        <div className="text-center pb-5 mb-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            Sign In to Portal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Super Admin or Institutional College Coordinator
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="admin@skillmatra.com"
                disabled={isPending}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/15 text-slate-900 placeholder:text-slate-400 transition-all disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
          </div>

          {/* Password Input */}
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
                disabled={isPending}
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/15 text-slate-900 placeholder:text-slate-400 transition-all disabled:bg-slate-50 disabled:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 px-4 bg-[#0A3A7A] hover:bg-[#062F68] disabled:bg-[#0A3A7A]/70 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>LOGIN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Demo Credentials Helper */}
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Quick Demo Accounts (Password: 1234)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDemoAdminFill}
              className="p-2 rounded-lg bg-blue-50/60 hover:bg-blue-100/70 border border-blue-200/60 text-left transition text-xs group"
            >
              <div className="font-bold text-[#0A3A7A] group-hover:underline flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3 h-3 text-[#FCAF0A]" />
                <span>Super Admin</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate">
                admin@skillmatra.com
              </div>
            </button>

            <button
              type="button"
              onClick={handleDemoCollegeFill}
              className="p-2 rounded-lg bg-amber-50/60 hover:bg-amber-100/70 border border-amber-200/60 text-left transition text-xs group"
            >
              <div className="font-bold text-amber-900 group-hover:underline flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>College Partner</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate">
                coordinator@saranathan.ac.in
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Security Disclaimer */}
      <p className="text-center text-[11px] text-slate-400 mt-5">
        🔒 Authorized Personnel Only • Neon PostgreSQL Protected
      </p>

      {/* Back to Public Website */}
      <div className="text-center mt-3">
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-[#0A3A7A] transition font-medium inline-flex items-center gap-1.5"
        >
          <span>← Back to Skill Mantra Website</span>
        </Link>
      </div>
    </div>
  );
}
