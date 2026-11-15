/**
 * Legacy Database Module — Fully Migrated to FastAPI Backend.
 * Direct PostgreSQL / Neon connections have been retired in Stage D.
 * All platform data and administrative statistics are now retrieved via FastAPI (/api/v1).
 */
import { apiGet } from '@/lib/api/client';

export interface AdminStats {
  totalAdmins: number;
  activeAdmins: number;
  dbConnected: boolean;
  systemStatus: string;
}

export interface PlatformOverviewStats {
  totalColleges: number;
  totalPrograms: number;
  totalBatches: number;
  activeBatches: number;
  totalStudents: number;
  totalResources: number;
  totalTrainers: number;
}

/**
 * Executes a query — DEPRECATED in Stage D.
 * Direct SQL queries from the Next.js frontend to PostgreSQL are forbidden.
 * All operations must route through the FastAPI backend API (/api/v1).
 */
export async function query<T = any>(
  _queryText: string,
  _params: any[] = []
): Promise<T[]> {
  throw new Error(
    'Direct database queries are deprecated and disabled in Stage D. ' +
    'All data access must route through the FastAPI backend at /api/v1.'
  );
}

/**
 * Returns a database client — DEPRECATED in Stage D.
 */
export function getDb(): never {
  throw new Error(
    'Direct database connections are deprecated and disabled in Stage D. ' +
    'The frontend communicates exclusively with the FastAPI backend via HTTP.'
  );
}

/**
 * Tests connectivity to the backend service.
 */
export async function testDbConnection(): Promise<{
  connected: boolean;
  message: string;
  error?: string;
}> {
  try {
    const health = await apiGet<{ status: string }>('/health/live');
    if (health?.status === 'alive') {
      return {
        connected: true,
        message: 'Successfully connected to FastAPI backend.',
      };
    }
    return {
      connected: false,
      message: 'Unexpected health probe response from backend.',
    };
  } catch (error: any) {
    return {
      connected: false,
      message: 'Failed to connect to FastAPI backend.',
      error: error?.message || 'Connection error',
    };
  }
}

/**
 * Fetches admin statistics via FastAPI backend (/api/v1/admin/stats).
 */
export async function getAdminStats(): Promise<AdminStats> {
  try {
    const stats = await apiGet<AdminStats>('/admin/stats');
    return {
      totalAdmins: Number(stats?.totalAdmins ?? 0),
      activeAdmins: Number(stats?.activeAdmins ?? 0),
      dbConnected: Boolean(stats?.dbConnected ?? true),
      systemStatus: stats?.systemStatus ?? 'Operational',
    };
  } catch (error: any) {
    console.error('[Error fetching admin stats via API]:', error?.message || error);
    return {
      totalAdmins: 0,
      activeAdmins: 0,
      dbConnected: false,
      systemStatus: 'Degraded',
    };
  }
}

/**
 * Fetches platform module statistics via FastAPI backend (/api/v1/admin/overview-stats).
 */
export async function getPlatformOverviewStats(): Promise<PlatformOverviewStats> {
  try {
    const stats = await apiGet<PlatformOverviewStats>('/admin/overview-stats');
    return {
      totalColleges: Number(stats?.totalColleges ?? 0),
      totalPrograms: Number(stats?.totalPrograms ?? 0),
      totalBatches: Number(stats?.totalBatches ?? 0),
      activeBatches: Number(stats?.activeBatches ?? 0),
      totalStudents: Number(stats?.totalStudents ?? 0),
      totalResources: Number(stats?.totalResources ?? 0),
      totalTrainers: Number(stats?.totalTrainers ?? 0),
    };
  } catch (error: any) {
    console.error('[Error fetching platform stats via API]:', error?.message || error);
    return {
      totalColleges: 0,
      totalPrograms: 0,
      totalBatches: 0,
      activeBatches: 0,
      totalStudents: 0,
      totalResources: 0,
      totalTrainers: 0,
    };
  }
}
