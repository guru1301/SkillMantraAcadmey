'use client';

import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  ShieldCheck,
  Building2,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Power,
} from 'lucide-react';
import {
  AdminUserItem,
  createAdminUserAction,
  toggleAdminUserStatusAction,
  resetAdminUserPasswordAction,
} from '@/app/actions/adminUsers';
import { useRouter } from 'next/navigation';

interface CollegeOption {
  id: string;
  name: string;
  code?: string;
}

interface Props {
  initialUsers: AdminUserItem[];
  colleges: CollegeOption[];
  currentUserId: string;
}

export default function AdminUsersClient({ initialUsers, colleges, currentUserId }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    email: '',
    fullName: '',
    role: 'college_admin' as 'super_admin' | 'college_admin',
    collegeId: colleges[0]?.id || '',
    password: '',
  });

  const filtered = users.filter((u) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q || u.email.toLowerCase().includes(q) || u.full_name.toLowerCase().includes(q) || (u.college_name && u.college_name.toLowerCase().includes(q));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email || !createForm.fullName) {
      setFeedbackMsg({ type: 'error', text: 'Email and Full Name are required.' });
      return;
    }
    if (createForm.role === 'college_admin' && !createForm.collegeId) {
      setFeedbackMsg({ type: 'error', text: 'Please select an associated college institution.' });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg(null);

    const res = await createAdminUserAction({
      email: createForm.email.trim(),
      full_name: createForm.fullName.trim(),
      role: createForm.role,
      college_id: createForm.role === 'college_admin' ? createForm.collegeId : undefined,
      password: createForm.password.trim() || undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message || 'User created successfully.' });
      setShowCreateModal(false);
      setCreateForm({
        email: '',
        fullName: '',
        role: 'college_admin',
        collegeId: colleges[0]?.id || '',
        password: '',
      });
      router.refresh();
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || 'Failed to create user.' });
    }
  };

  const handleToggleStatus = async (user: AdminUserItem) => {
    if (user.id === currentUserId && user.status === 'active') {
      alert('You cannot deactivate your own current administrator account.');
      return;
    }
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const confirmMsg = `Are you sure you want to ${newStatus === 'inactive' ? 'deactivate' : 'activate'} ${user.full_name}?`;
    if (!window.confirm(confirmMsg)) return;

    const res = await toggleAdminUserStatusAction(user.id, newStatus);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message || 'Status updated successfully.' });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
      router.refresh();
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || 'Failed to update status.' });
    }
  };

  const handleResetPassword = async (user: AdminUserItem) => {
    const customPw = window.prompt(
      `Enter new password for ${user.full_name} (minimum 8 characters), or leave blank to auto-generate a secure temporary password:`
    );
    if (customPw === null) return; // cancelled

    const res = await resetAdminUserPasswordAction(user.id, customPw.trim() || undefined);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message || 'Password reset successfully.' });
      router.refresh();
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || 'Failed to reset password.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or college..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-600 transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admins</option>
            <option value="college_admin">College Admins</option>
          </select>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#FCAF0A]" />
            <span>Create Administrator</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Institution Scope</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No administrator accounts found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{u.full_name}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.role === 'super_admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[11px] border border-purple-200">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Super Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200">
                          <Building2 className="w-3 h-3" />
                          <span>College Admin</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.college_name ? (
                        <span className="font-semibold text-slate-800">{u.college_name}</span>
                      ) : (
                        <span className="text-slate-400 italic">Platform-Wide</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.status === 'active' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                          INACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleResetPassword(u)}
                        title="Reset Password"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Reset PW</span>
                      </button>

                      {u.id !== currentUserId && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          title={u.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                            u.status === 'active'
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{u.status === 'active' ? 'Disable' : 'Enable'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Administrator */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Provision Administrator Account</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, role: 'college_admin' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      createForm.role === 'college_admin'
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>College Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, role: 'super_admin' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      createForm.role === 'super_admin'
                        ? 'bg-purple-50 border-purple-600 text-purple-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Super Admin</span>
                  </button>
                </div>
              </div>

              {createForm.role === 'college_admin' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Associated College *</label>
                  <select
                    value={createForm.collegeId}
                    onChange={(e) => setCreateForm({ ...createForm, collegeId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-hidden focus:border-blue-600"
                    required
                  >
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="admin@institution.edu"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Leave empty to auto-generate secure password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>{isSubmitting ? 'Provisioning...' : 'Provision Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

