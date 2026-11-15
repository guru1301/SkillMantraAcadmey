/**
 * Universal Data Transfer Types for FastAPI Backend Communication.
 */

export interface MessageResponse {
  success: boolean;
  message: string;
}

export interface UserProfileResponse {
  id: string;
  role: 'super_admin' | 'college_admin' | 'trainer' | 'student';
  email: string | null;
  full_name: string;
  college_id?: string | null;
  college_name?: string | null;
  college_code?: string | null;
  must_change_password?: boolean;
}

export interface LoginResponse {
  success?: boolean;
  status?: string;
  message?: string;
  user_id?: string;
  email?: string;
  full_name?: string;
  role?: string;
  college_id?: string | null;
  college_name?: string | null;
  redirect_to?: string;
  csrf_token?: string | null;
  user?: UserProfileResponse;
}

export interface SessionStatusResponse {
  authenticated: boolean;
  role: string | null;
  user_id: string | null;
  email: string | null;
  college_id: string | null;
}

