import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { API_CONFIG } from '@/lib/api/config';

const SESSION_COOKIE_NAME = API_CONFIG.sessionCookieName;

/**
 * Next.js Middleware: Server-side route protection for /admin, /portal, /trainer, /student, and /login routes.
 * Authenticates active session against the FastAPI backend.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  let isAuthenticated = false;
  let userRole = '';
  let mustChangePassword = false;

  if (sessionCookie?.value) {
    try {
      const authMeUrl = `${API_CONFIG.baseUrl}${API_CONFIG.prefix}/auth/me`;
      const res = await fetch(authMeUrl, {
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${sessionCookie.value}`,
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const payload = await res.json();
        if (payload?.id && payload?.role) {
          isAuthenticated = true;
          userRole = payload.role;
          mustChangePassword = Boolean(payload.must_change_password);
        }
      }
    } catch {
      isAuthenticated = false;
    }
  }

  // 0. Enforce mandatory password rotation across all routes except /change-password and /login
  if (isAuthenticated && mustChangePassword) {
    if (pathname.startsWith('/api/certificates')) {
      return NextResponse.json(
        { error: 'Password change required before accessing certificates.' },
        { status: 403 }
      );
    }
    if (pathname !== '/change-password' && pathname !== '/login') {
      return NextResponse.redirect(new URL('/change-password', request.url));
    }
  }

  // If user visits /change-password while not authenticated, redirect to /login
  if (pathname === '/change-password') {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // 1. Protection for /admin routes (Super Admin only)
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'super_admin') {
      return NextResponse.redirect(new URL('/portal', request.url));
    }
    return NextResponse.next();
  }

  // 2. Protection for /portal routes (College Coordinators & Super Admins)
  if (pathname.startsWith('/portal')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'college_admin' && userRole !== 'super_admin') {
      if (userRole === 'trainer') return NextResponse.redirect(new URL('/trainer', request.url));
      if (userRole === 'student') return NextResponse.redirect(new URL('/student', request.url));
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // 3. Protection for /trainer routes (Trainers & Super Admins)
  if (pathname.startsWith('/trainer')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'trainer' && userRole !== 'super_admin') {
      if (userRole === 'college_admin') return NextResponse.redirect(new URL('/portal', request.url));
      if (userRole === 'student') return NextResponse.redirect(new URL('/student', request.url));
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // 4. Protection for /student routes (Students & Super Admins)
  if (pathname.startsWith('/student')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'student' && userRole !== 'super_admin') {
      if (userRole === 'college_admin') return NextResponse.redirect(new URL('/portal', request.url));
      if (userRole === 'trainer') return NextResponse.redirect(new URL('/trainer', request.url));
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // 5. Redirect already authenticated users away from /login
  if (pathname === '/login') {
    if (isAuthenticated) {
      if (mustChangePassword) {
        return NextResponse.redirect(new URL('/change-password', request.url));
      }
      if (userRole === 'super_admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      if (userRole === 'trainer') {
        return NextResponse.redirect(new URL('/trainer', request.url));
      }
      if (userRole === 'student') {
        return NextResponse.redirect(new URL('/student', request.url));
      }
      return NextResponse.redirect(new URL('/portal', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/portal/:path*',
    '/trainer/:path*',
    '/student/:path*',
    '/login',
    '/change-password',
    '/api/certificates/:path*',
  ],
};
