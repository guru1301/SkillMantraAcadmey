import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'skillmatra_session';
let cachedSecretKey: Uint8Array | null = null;

function getSecretKey(): Uint8Array {
  if (!cachedSecretKey) {
    const secret = process.env.AUTH_SECRET || 'skillmatra_development_secret_key_minimum_32_characters_long_12345';
    cachedSecretKey = new TextEncoder().encode(secret);
  }
  return cachedSecretKey;
}

/**
 * Next.js Middleware: Server-side route protection for /admin and /login routes.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  let isAuthenticated = false;
  let userRole = '';

  if (sessionCookie?.value) {
    try {
      const secretKey = getSecretKey();
      const { payload } = await jwtVerify(sessionCookie.value, secretKey, {
        algorithms: ['HS256'],
      });

      if (payload.id && payload.email) {
        isAuthenticated = true;
        userRole = (payload.role as string) || '';
      }
    } catch {
      isAuthenticated = false;
    }
  }

  // 1. Protection for /admin routes (Super Admin only)
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'super_admin') {
      // College admins cannot access super admin area
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
    return NextResponse.next();
  }

  // 3. Redirect already authenticated users away from /login
  if (pathname === '/login') {
    if (isAuthenticated) {
      if (userRole === 'super_admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/portal', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*', '/login'],
};
