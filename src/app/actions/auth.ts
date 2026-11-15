'use server';

import { redirect } from 'next/navigation';
import { loginSchema } from '@/lib/validations/auth';
import { destroySession } from '@/lib/auth/session';
import { apiPost } from '@/lib/api/client';
import { LoginResponse } from '@/lib/api/types';
import { ApiError } from '@/lib/api/errors';

export interface ActionResponse {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

/**
 * Server Action: Authenticates via FastAPI backend, sets session & CSRF cookies,
 * and determines portal redirect path.
 */
export async function loginAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const rawEmail = formData.get('email');
  const rawPassword = formData.get('password');

  // 1. Validate inputs using Zod
  const validationResult = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: 'Invalid email or password.',
    };
  }

  const { email, password } = validationResult.data;

  try {
    // 2. Authenticate through FastAPI backend
    const res = await apiPost<LoginResponse>('/auth/login', {
      email,
      password,
    });

    const userRole = res?.role || res?.user?.role;
    if (!res || !userRole) {
      return {
        success: false,
        error: 'Authentication failed. Please verify credentials.',
      };
    }

    const redirectMap: Record<string, string> = {
      super_admin: '/admin/dashboard',
      college_admin: '/portal',
      trainer: '/trainer',
      student: '/student',
    };

    return {
      success: true,
      redirectTo: res.redirect_to || redirectMap[userRole] || '/student',
    };
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      return {
        success: false,
        error: err.message,
      };
    }
    return {
      success: false,
      error: 'Unable to connect to the authentication service. Please verify backend service.',
    };
  }
}

/**
 * Server Action: Clears the session on backend and browser, redirecting to /login.
 */
export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/login');
}

/**
 * Server Action: Submits password change request to FastAPI backend,
 * revoking other sessions and rotating the session on success.
 */
export async function changePasswordAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const currentPassword = (formData.get('currentPassword') as string) || '';
  const newPassword = (formData.get('newPassword') as string) || '';
  const confirmPassword = (formData.get('confirmPassword') as string) || '';

  if (!currentPassword || !newPassword || !confirmPassword) {
    return {
      success: false,
      error: 'All fields are required.',
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      success: false,
      error: 'New password and confirm password do not match.',
    };
  }

  if (newPassword.length < 10) {
    return {
      success: false,
      error: 'New password must be at least 10 characters in length.',
    };
  }

  try {
    const res = await apiPost<{ success: boolean; message: string; redirect_to?: string }>(
      '/auth/change-password',
      {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }
    );

    return {
      success: true,
      redirectTo: res?.redirect_to || '/login',
    };
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      return {
        success: false,
        error: err.message,
      };
    }
    return {
      success: false,
      error: 'Failed to update password. Please ensure it meets policy requirements.',
    };
  }
}
