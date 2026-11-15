'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import { apiGet, apiPost, apiPatch } from '@/lib/api/client';
import { assertUuid } from '@/lib/validations/ids';

export interface AdminUserItem {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'college_admin';
  status: 'active' | 'inactive';
  college_id?: string | null;
  college_name?: string | null;
  last_login_at?: string | null;
  created_at: string;
}

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export async function getAdminUsersAction(roleFilter?: string): Promise<AdminUserItem[]> {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return [];
  }

  try {
    const params: Record<string, string> = {};
    if (roleFilter && roleFilter !== 'all') {
      params.role = roleFilter;
    }
    const users = await apiGet<AdminUserItem[]>('/admin/users', params);
    return users || [];
  } catch (err: any) {
    console.error('[getAdminUsersAction error]:', err?.message);
    return [];
  }
}

export async function createAdminUserAction(payload: {
  email: string;
  full_name: string;
  role: 'super_admin' | 'college_admin';
  college_id?: string;
  password?: string;
}): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Super Admin authorization required.' };
  }

  try {
    if (payload.college_id) {
      assertUuid(payload.college_id, 'collegeId');
    }
    const res = await apiPost<{ success: boolean; message: string }>('/admin/users', payload);
    revalidatePath('/admin/users');
    return { success: true, message: res?.message || 'User created successfully.' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to create user.' };
  }
}

export async function toggleAdminUserStatusAction(
  userId: string,
  newStatus: 'active' | 'inactive'
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Super Admin authorization required.' };
  }

  try {
    const safeUserId = assertUuid(userId, 'userId');
    const res = await apiPatch<{ success: boolean; message: string }>(`/admin/users/${safeUserId}/status`, {
      status: newStatus,
    });
    revalidatePath('/admin/users');
    return { success: true, message: res?.message || 'Account status updated.' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update user status.' };
  }
}

export async function resetAdminUserPasswordAction(
  userId: string,
  customPassword?: string
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Super Admin authorization required.' };
  }

  try {
    const safeUserId = assertUuid(userId, 'userId');
    const res = await apiPost<{ success: boolean; message: string }>(`/admin/users/${safeUserId}/reset-password`, {
      password: customPassword || undefined,
    });
    revalidatePath('/admin/users');
    return { success: true, message: res?.message || 'Password reset successfully.' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to reset password.' };
  }
}

