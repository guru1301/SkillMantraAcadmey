'use server';

import { redirect } from 'next/navigation';
import { loginSchema } from '@/lib/validations/auth';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, destroySession } from '@/lib/auth/session';
import { query } from '@/lib/db';

export interface ActionResponse {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

interface AdminUserRecord {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: string;
  status: string;
}

/**
 * Server Action: Validates input, queries Neon PostgreSQL, verifies password hash,
 * sets HTTP-only session cookie, and directs to /admin/dashboard.
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
interface CollegeUserRecord {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: string;
  status: string;
  college_id: string;
  college_name: string;
  college_status: string;
}

    // 2. Query Neon PostgreSQL for admin account by normalized lowercase email
    const adminUsers = await query<AdminUserRecord>(
      `SELECT id, email, password_hash, full_name, role, status 
       FROM admin_users 
       WHERE LOWER(email) = LOWER($1) 
       LIMIT 1`,
      [email]
    );

    if (adminUsers && adminUsers.length > 0) {
      const admin = adminUsers[0];

      // Verify active status
      if (admin.status !== 'active') {
        return { success: false, error: 'Invalid email or password.' };
      }

      // Verify password hash
      const passwordMatch = await verifyPassword(password, admin.password_hash);
      if (!passwordMatch || admin.role !== 'super_admin') {
        return { success: false, error: 'Invalid email or password.' };
      }

      // Update last_login_at
      try {
        await query(
          `UPDATE admin_users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [admin.id]
        );
      } catch (updateErr) {
        console.warn('[Auth Warning]: Failed to update last_login_at:', updateErr);
      }

      // Create super_admin session
      await createSession({
        id: admin.id,
        email: admin.email,
        fullName: admin.full_name,
        role: admin.role,
      });

      return {
        success: true,
        redirectTo: '/admin/dashboard',
      };
    }

    // 3. If not an admin_user, check college_users (Institutional Coordinator)
    const collegeUsers = await query<CollegeUserRecord>(
      `SELECT 
         cu.id, 
         cu.email, 
         cu.password_hash, 
         cu.full_name, 
         cu.role, 
         cu.status,
         cu.college_id,
         c.name as college_name,
         c.status as college_status
       FROM college_users cu
       JOIN colleges c ON c.id = cu.college_id
       WHERE LOWER(cu.email) = LOWER($1) 
       LIMIT 1`,
      [email]
    );

    if (collegeUsers && collegeUsers.length > 0) {
      const collegeUser = collegeUsers[0];

      // Verify user and institution status
      if (collegeUser.status !== 'active' || collegeUser.college_status !== 'active') {
        return { success: false, error: 'Your account or institution is currently inactive.' };
      }

      // Verify password
      const passwordMatch = await verifyPassword(password, collegeUser.password_hash);
      if (!passwordMatch) {
        return { success: false, error: 'Invalid email or password.' };
      }

      // Update last_login_at
      try {
        await query(
          `UPDATE college_users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [collegeUser.id]
        );
      } catch (updateErr) {
        console.warn('[Auth Warning]: Failed to update college user last_login_at:', updateErr);
      }

      // Create college_admin session
      await createSession({
        id: collegeUser.id,
        email: collegeUser.email,
        fullName: collegeUser.full_name,
        role: 'college_admin',
        collegeId: collegeUser.college_id,
        collegeName: collegeUser.college_name,
      });

      return {
        success: true,
        redirectTo: '/portal',
      };
    }

    // No account found in admin_users or college_users
    return {
      success: false,
      error: 'Invalid email or password.',
    };
  } catch (err: any) {
    console.error('[Auth Error]: Database query or connection failed:', err?.message || err);
    return {
      success: false,
      error: 'Unable to connect to the authentication service. Please verify database connection or try again.',
    };
  }
}

/**
 * Server Action: Clears the session cookie and redirects user to /login.
 */
export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/login');
}
