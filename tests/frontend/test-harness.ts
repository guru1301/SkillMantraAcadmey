import { API_CONFIG } from '@/lib/api/config';

export const VALID_UUID = '11111111-1111-4111-8111-111111111111';

export interface MockSessionInput {
  id: string;
  role: 'super_admin' | 'college_admin' | 'trainer' | 'student' | string;
  email?: string;
  fullName?: string;
  collegeId?: string;
  mustChangePassword?: boolean;
}

export interface CapturedApiCall {
  url: string;
  method: string;
  body: unknown;
}

declare global {
  var __TEST_COOKIES__: Record<string, string> | undefined;
}

export async function withActionContext<T>(
  session: MockSessionInput | null,
  fn: (calls: CapturedApiCall[]) => Promise<T>,
  customResponder?: (url: string, init: RequestInit) => { status?: number; json: unknown } | null
): Promise<T> {
  const prevFetch = globalThis.fetch;
  const prevCookies = globalThis.__TEST_COOKIES__;
  const calls: CapturedApiCall[] = [];

  globalThis.__TEST_COOKIES__ = session
    ? { [API_CONFIG.sessionCookieName]: 'mock-session-token', [API_CONFIG.csrfCookieName]: 'mock-csrf' }
    : {};

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = (init?.method || 'GET').toUpperCase();
    let parsedBody: unknown = init?.body;
    if (typeof parsedBody === 'string') {
      try {
        parsedBody = JSON.parse(parsedBody);
      } catch {
        // leave raw string
      }
    }

    if (url.endsWith('/api/v1/auth/me') || url.includes('/auth/me')) {
      if (!session) {
        return new Response(JSON.stringify({ detail: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(
        JSON.stringify({
          id: session.id,
          email: session.email || `${session.role}@test.edu`,
          full_name: session.fullName || 'Test User',
          role: session.role,
          college_id: session.collegeId || null,
          college_name: session.collegeId ? 'Test College' : null,
          must_change_password: session.mustChangePassword ?? false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    calls.push({ url, method, body: parsedBody });

    if (customResponder) {
      const custom = customResponder(url, init || {});
      if (custom) {
        return new Response(JSON.stringify(custom.json), {
          status: custom.status ?? 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        id: '11111111-1111-4111-8111-111111111111',
        assignment_id: '22222222-2222-4222-8222-222222222222',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }) as typeof fetch;

  try {
    return await fn(calls);
  } finally {
    globalThis.fetch = prevFetch;
    globalThis.__TEST_COOKIES__ = prevCookies;
  }
}
