import { cache } from 'react';
import { cookies } from 'next/headers';
import { apiGet, apiPost } from '@/lib/api/client';
import { UserProfileResponse } from '@/lib/api/types';
import { API_CONFIG } from '@/lib/api/config';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'college_admin' | 'trainer' | 'student' | string;
  collegeId?: string;
  collegeName?: string;
  mustChangePassword?: boolean;
}

export const SESSION_COOKIE_NAME = API_CONFIG.sessionCookieName;

async function fetchSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const user = await apiGet<UserProfileResponse>('/auth/me');
    if (!user || !user.id || !user.role) {
      return null;
    }

    return {
      id: String(user.id),
      email: user.email || '',
      fullName: user.full_name || 'User',
      role: user.role,
      collegeId: user.college_id ? String(user.college_id) : undefined,
      collegeName: user.college_name || undefined,
      mustChangePassword: Boolean(user.must_change_password),
    };
  } catch {
    return null;
  }
}

/**
 * Retrieves and validates the current user session from the FastAPI backend.
 * Deduplicated per request using React cache() in runtime, or un-memoized in test runners.
 */
export const getSession = process.env.NODE_ENV === 'test'
  ? fetchSession
  : cache(fetchSession);

/**
 * Revokes the session on the FastAPI backend and clears all authentication cookies.
 */
export async function destroySession(): Promise<void> {
  try {
    await apiPost('/auth/logout');
  } catch {
    // If backend already expired or unreachable, still clear local cookies
  }

  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    cookieStore.delete(API_CONFIG.csrfCookieName);
  } catch {
    // Ignore if called in read-only cookie context
  }
}

/**
 * Legacy compatibility stubs for Stage D FastAPI architecture.
 */
export async function createSession(_user: SessionUser): Promise<void> {
  // In FastAPI architecture, sessions are created on the backend during /auth/login
}

export async function signSession(_payload: any): Promise<string> {
  throw new Error('signSession is deprecated in Stage D. FastAPI manages server-side sessions.');
}

export async function verifySessionToken(_token: string): Promise<any> {
  throw new Error('verifySessionToken is deprecated in Stage D. FastAPI manages server-side sessions.');
}
