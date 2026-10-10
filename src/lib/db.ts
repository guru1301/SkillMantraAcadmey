import { neon, neonConfig } from '@neondatabase/serverless';

// Ensure correct HTTPS endpoint resolution for Neon regional hosts
neonConfig.fetchEndpoint = (host: string) => `https://${host}/sql`;

let cachedSql: ReturnType<typeof neon> | null = null;

/**
 * Returns a serverless Neon SQL query executor.
 * Reuses a cached connection client to avoid TCP/TLS handshake latency on repeated queries.
 * Strictly runs server-side to prevent exposing DATABASE_URL to the client.
 */
export function getDb() {
  if (typeof window !== 'undefined') {
    throw new Error('Database operations are restricted to server-side environments.');
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is not configured in .env.local. Please provide your Neon PostgreSQL connection string.'
    );
  }

  if (!cachedSql) {
    cachedSql = neon(databaseUrl);
  }

  return cachedSql;
}

/**
 * Safely executes a parameterized SQL query using Neon PostgreSQL with resilient network retry.
 */
export async function query<T = any>(
  queryText: string,
  params: any[] = []
): Promise<T[]> {
  const sql = getDb();
  let lastError: any;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await sql.query(queryText, params);
      return result as T[];
    } catch (err: any) {
      lastError = err;
      const isTransientNetwork =
        err?.message?.includes('fetch failed') ||
        err?.message?.includes('Connect Timeout') ||
        err?.message?.includes('UND_ERR_CONNECT_TIMEOUT') ||
        err?.message?.includes('ENOTFOUND');

      if (isTransientNetwork && attempt < 3) {
        await new Promise((res) => setTimeout(res, 800 * attempt));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

/**
 * Tests connectivity to the Neon PostgreSQL database.
 */
export async function testDbConnection(): Promise<{
  connected: boolean;
  message: string;
  error?: string;
}> {
  try {
    const rows = await query('SELECT 1 as connected, NOW() as server_time');
    if (rows && rows.length > 0) {
      return {
        connected: true,
        message: 'Successfully connected to Neon PostgreSQL.',
      };
    }
    return {
      connected: false,
      message: 'No response from database.',
    };
  } catch (error: any) {
    console.error('[Database Connection Error]:', error?.message || error);
    return {
      connected: false,
      message: 'Failed to connect to Neon PostgreSQL.',
      error: error?.message || 'Unknown database error',
    };
  }
}

/**
 * Fetches real admin user statistics from the Neon database in a single optimized query.
 */
export async function getAdminStats(): Promise<{
  totalAdmins: number;
  activeAdmins: number;
  dbConnected: boolean;
  systemStatus: string;
}> {
  try {
    const rows = await query<{
      total_count: number;
      active_count: number;
    }>(`
      SELECT 
        COUNT(*)::int as total_count,
        COUNT(*) FILTER (WHERE status = 'active')::int as active_count
      FROM admin_users
    `);

    const r = rows[0];
    return {
      totalAdmins: Number(r?.total_count ?? 0),
      activeAdmins: Number(r?.active_count ?? 0),
      dbConnected: true,
      systemStatus: 'Operational',
    };
  } catch (error: any) {
    console.error('[Error fetching admin stats]:', error?.message || error);
    return {
      totalAdmins: 0,
      activeAdmins: 0,
      dbConnected: false,
      systemStatus: 'Degraded',
    };
  }
}

/**
 * Fetches platform module statistics in a single consolidated SQL query,
 * cutting multiple HTTP round trips down to a single network call.
 */
export async function getPlatformOverviewStats(): Promise<{
  totalColleges: number;
  totalPrograms: number;
  totalBatches: number;
  totalResources: number;
  totalTrainers: number;
}> {
  try {
    const rows = await query<{
      colleges_count: number;
      programs_count: number;
      batches_count: number;
      resources_count: number;
      trainers_count: number;
    }>(`
      SELECT 
        (SELECT COUNT(*)::int FROM colleges) as colleges_count,
        (SELECT COUNT(*)::int FROM programs) as programs_count,
        (SELECT COUNT(*)::int FROM batches) as batches_count,
        (SELECT COUNT(*)::int FROM resources) as resources_count,
        (SELECT COUNT(*)::int FROM trainers) as trainers_count
    `);

    const r = rows[0];
    return {
      totalColleges: Number(r?.colleges_count ?? 0),
      totalPrograms: Number(r?.programs_count ?? 0),
      totalBatches: Number(r?.batches_count ?? 0),
      totalResources: Number(r?.resources_count ?? 0),
      totalTrainers: Number(r?.trainers_count ?? 0),
    };
  } catch (error: any) {
    console.error('[Error fetching platform stats]:', error?.message || error);
    return {
      totalColleges: 0,
      totalPrograms: 0,
      totalBatches: 0,
      totalResources: 0,
      totalTrainers: 0,
    };
  }
}

