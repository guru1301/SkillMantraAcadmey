/**
 * Central API Configuration for FastAPI Backend Integration.
 */

export const API_CONFIG = {
  baseUrl: process.env.FASTAPI_BASE_URL || 'http://127.0.0.1:8000',
  prefix: '/api/v1',
  sessionCookieName: 'skillmatra_session',
  csrfCookieName: 'csrf_token',
  timeoutMs: 30000,
  trustedClientIpHeader: process.env.TRUSTED_CLIENT_IP_HEADER || 'x-real-ip',
};

/**
 * Builds the full backend URL ensuring single prefixing.
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath.startsWith(API_CONFIG.prefix)) {
    return `${API_CONFIG.baseUrl}${cleanPath}`;
  }
  return `${API_CONFIG.baseUrl}${API_CONFIG.prefix}${cleanPath}`;
}

