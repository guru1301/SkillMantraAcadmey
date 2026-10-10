import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'college_admin' | string;
  collegeId?: string;
  collegeName?: string;
}

export const SESSION_COOKIE_NAME = 'skillmatra_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

let cachedSecretKey: Uint8Array | null = null;

function getSecretKey(): Uint8Array {
  if (cachedSecretKey) return cachedSecretKey;

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET environment variable is missing in production!');
    }
    // Fallback development secret
    cachedSecretKey = new TextEncoder().encode('skillmatra_development_secret_key_minimum_32_characters_long_12345');
    return cachedSecretKey;
  }
  cachedSecretKey = new TextEncoder().encode(secret);
  return cachedSecretKey;
}

/**
 * Encrypts and signs a JWT session token.
 */
export async function signSession(payload: SessionUser): Promise<string> {
  const secretKey = getSecretKey();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secretKey);
}

/**
 * Verifies a JWT session token and returns the decoded payload.
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    if (!payload.id || !payload.email || !payload.role) {
      return null;
    }

    return {
      id: payload.id as string,
      email: payload.email as string,
      fullName: (payload.fullName as string) || 'User',
      role: payload.role as string,
      collegeId: (payload.collegeId as string) || undefined,
      collegeName: (payload.collegeName as string) || undefined,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Creates an HTTP-only secure session cookie on the server.
 */
export async function createSession(user: SessionUser): Promise<void> {
  const token = await signSession(user);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/**
 * Retrieves and validates the current user session from cookies.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    return verifySessionToken(sessionCookie.value);
  } catch {
    return null;
  }
}

/**
 * Destroys the session cookie upon logout.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
