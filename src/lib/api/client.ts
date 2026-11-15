/**
 * Universal Server-Side API Client for Next.js App Router & Server Actions.
 * Handles automatic cookie forwarding, signed CSRF header injection, and response parsing.
 */
import { API_CONFIG, getApiUrl } from './config';
import { ApiError } from './errors';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
}

/**
 * Validates and encodes a single URL path segment, rejecting path traversal,
 * embedded separators, queries, fragments, or encoded equivalents.
 */
export function safePathSegment(segment: string, label = 'path segment'): string {
  if (typeof segment !== 'string' || segment.length === 0) {
    throw new Error(`Invalid ${label}: empty value.`);
  }
  if (/[\r\n\0/\\?#]/.test(segment) || segment.includes('..')) {
    throw new Error(`Invalid ${label}: unsafe characters detected.`);
  }
  let decoded: string;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    throw new Error(`Invalid ${label}: malformed URL encoding.`);
  }
  if (/[\r\n\0/\\?#]/.test(decoded) || decoded.includes('..')) {
    throw new Error(`Invalid ${label}: traversal or query characters detected.`);
  }
  return encodeURIComponent(decoded);
}

/**
 * Validates every segment of an API endpoint path and encodes remaining dynamic segments.
 */
export function sanitizeApiEndpoint(endpoint: string): string {
  if (typeof endpoint !== 'string' || endpoint.length === 0) {
    throw new Error('Invalid API endpoint path.');
  }
  if (/[\r\n\0\\?#]/.test(endpoint) || endpoint.includes('..') || /%(?:2e|2f|5c|3f|23)/i.test(endpoint)) {
    throw new Error('Unsafe API endpoint path rejected.');
  }
  const hasLeadingSlash = endpoint.startsWith('/');
  const segments = endpoint.split('/').filter((seg, idx) => !(idx === 0 && seg === ''));
  if (segments.some((s) => s.length === 0)) {
    throw new Error('Unsafe empty path segment rejected.');
  }
  const encoded = segments.map((seg) => safePathSegment(seg, 'API path segment'));
  return (hasLeadingSlash ? '/' : '') + encoded.join('/');
}

/**
 * Executes an HTTP request against the FastAPI backend with cookie & CSRF propagation.
 */
export async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const safeEndpoint = sanitizeApiEndpoint(endpoint);
  const urlObj = new URL(getApiUrl(safeEndpoint));

  // 1. Append query parameters
  if (options.params) {
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        urlObj.searchParams.set(key, String(val));
      }
    });
  }

  // 2. Read cookies from Next.js incoming request context
  let cookieStore: any = null;
  let sessionToken: string | undefined;
  let csrfToken: string | undefined;
  let forwardedClientIp: string | undefined;
  let incomingUserAgent: string | undefined;

  try {
    const { cookies, headers: nextHeaders } = await import('next/headers');
    cookieStore = await cookies();
    sessionToken = cookieStore.get(API_CONFIG.sessionCookieName)?.value;
    csrfToken = cookieStore.get(API_CONFIG.csrfCookieName)?.value;

    const reqHeaders = await nextHeaders();
    const trustedHeaderName = (API_CONFIG.trustedClientIpHeader || 'x-real-ip').toLowerCase();
    const rawIp = reqHeaders.get(trustedHeaderName);
    if (rawIp) {
      forwardedClientIp = rawIp.split(',')[0].trim();
    }
    incomingUserAgent = reqHeaders.get('user-agent') || undefined;
  } catch {
    // Ignore when called outside of Next.js request lifecycle
  }

  // 3. Prepare headers
  const headers = new Headers(options.headers || {});

  // Overwrite X-Forwarded-For strictly with the trusted client IP from the hosting platform
  if (forwardedClientIp) {
    headers.set('X-Forwarded-For', forwardedClientIp);
  } else {
    // Stop forwarding arbitrary client-supplied X-Forwarded-For / X-Real-IP
    headers.delete('X-Forwarded-For');
  }
  if (incomingUserAgent && !headers.has('User-Agent')) {
    headers.set('User-Agent', incomingUserAgent);
  }

  // Forward cookies server-to-server
  const cookieParts: string[] = [];
  if (sessionToken) {
    cookieParts.push(`${API_CONFIG.sessionCookieName}=${sessionToken}`);
  }
  if (csrfToken) {
    cookieParts.push(`${API_CONFIG.csrfCookieName}=${csrfToken}`);
  }
  if (cookieParts.length > 0 && !headers.has('Cookie')) {
    headers.set('Cookie', cookieParts.join('; '));
  }

  // Attach signed CSRF header on state-changing requests
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    if (csrfToken && !headers.has('X-CSRF-Token')) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  // Handle body formatting
  let finalBody: any = options.body;
  if (options.body !== undefined && options.body !== null) {
    if (typeof FormData !== 'undefined' && options.body instanceof FormData) {
      // Let fetch set multipart/form-data boundary automatically
      finalBody = options.body;
    } else if (typeof options.body === 'object') {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      finalBody = JSON.stringify(options.body);
    }
  }

  // 4. Execute fetch with timeout
  const timeoutMs = options.timeoutMs || API_CONFIG.timeoutMs;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(urlObj.toString(), {
      ...options,
      method,
      headers,
      body: finalBody,
      signal: options.signal || controller.signal,
      cache: options.cache || 'no-store',
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new ApiError(504, 'Backend API request timed out.');
    }
    throw new ApiError(503, `Unable to reach backend service: ${err.message || 'Connection failed'}`);
  } finally {
    clearTimeout(timeoutId);
  }

  // 5. Propagate any Set-Cookie headers from FastAPI response (e.g. login, logout)
  if (cookieStore) {
    try {
      // Handle standard getSetCookie if available, or fallback to set-cookie header
      const setCookies = typeof (res.headers as any).getSetCookie === 'function'
        ? (res.headers as any).getSetCookie()
        : res.headers.get('set-cookie') ? [res.headers.get('set-cookie')!] : [];

      for (const cookieStr of setCookies) {
        if (!cookieStr) continue;
        const [nameValue, ...attrParts] = cookieStr.split(';');
        const [cName, ...cValParts] = nameValue.split('=');
        const trimmedName = cName.trim();
        const trimmedVal = cValParts.join('=').trim();

        const cookieOptions: any = { path: '/' };
        for (const attr of attrParts) {
          const [rawKey, ...rawVal] = attr.trim().split('=');
          const key = rawKey.toLowerCase();
          const val = rawVal.join('=').trim();
          if (key === 'httponly') cookieOptions.httpOnly = true;
          else if (key === 'secure') cookieOptions.secure = true;
          else if (key === 'samesite') cookieOptions.sameSite = val.toLowerCase();
          else if (key === 'max-age') cookieOptions.maxAge = parseInt(val, 10);
        }

        if (trimmedVal === '' || cookieOptions.maxAge === 0) {
          cookieStore.delete(trimmedName);
        } else {
          cookieStore.set(trimmedName, trimmedVal, cookieOptions);
        }
      }
    } catch {
      // In Server Components, cookieStore is read-only. That is expected.
    }
  }

  // 6. Handle errors
  if (!res.ok) {
    let errorData: any = null;
    try {
      errorData = await res.json();
    } catch {
      errorData = await res.text();
    }
    throw ApiError.fromResponse(res.status, errorData);
  }

  // 7. Handle 204 No Content
  if (res.status === 204) {
    return null as T;
  }

  // 8. Return parsed JSON
  try {
    return await res.json() as T;
  } catch {
    return null as T;
  }
}

/** Convenience helper for GET requests */
export function apiGet<T>(endpoint: string, params?: Record<string, any>, init?: Omit<RequestOptions, 'params'>): Promise<T> {
  return apiFetch<T>(endpoint, { ...init, method: 'GET', params });
}

/** Convenience helper for POST requests */
export function apiPost<T>(endpoint: string, body?: any, init?: RequestOptions): Promise<T> {
  return apiFetch<T>(endpoint, { ...init, method: 'POST', body });
}

/** Convenience helper for PUT requests */
export function apiPut<T>(endpoint: string, body?: any, init?: RequestOptions): Promise<T> {
  return apiFetch<T>(endpoint, { ...init, method: 'PUT', body });
}

/** Convenience helper for PATCH requests */
export function apiPatch<T>(endpoint: string, body?: any, init?: RequestOptions): Promise<T> {
  return apiFetch<T>(endpoint, { ...init, method: 'PATCH', body });
}

/** Convenience helper for DELETE requests */
export function apiDelete<T>(endpoint: string, init?: RequestOptions): Promise<T> {
  return apiFetch<T>(endpoint, { ...init, method: 'DELETE' });
}

