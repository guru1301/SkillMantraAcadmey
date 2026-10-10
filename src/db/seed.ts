import { neon, neonConfig } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { loadEnvLocal } from './loadEnv';

// Ensure correct HTTPS endpoint resolution for Neon regional hosts
neonConfig.fetchEndpoint = (host: string) => `https://${host}/sql`;

const DEMO_ADMIN = {
  fullName: 'Skill Matra Admin',
  email: 'admin@skillmatra.com',
  rawPassword: '1234',
  role: 'super_admin',
  status: 'active',
};

/**
 * Idempotent seed script to create or update the demo super_admin user.
 */
export async function seedDatabase() {
  loadEnvLocal();
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL is not set in environment or .env.local');
    process.exit(1);
  }

  console.log('🔄 Connecting to Neon PostgreSQL for seeding...');
  const sql = neon(databaseUrl);

  console.log(`🔐 Hashing password for demo admin (${DEMO_ADMIN.email})...`);
  const passwordHash = await bcrypt.hash(DEMO_ADMIN.rawPassword, 10);

  console.log('🌱 Inserting/Updating demo admin account in admin_users table...');
  const result = await sql.query(
    `
    INSERT INTO admin_users (email, password_hash, full_name, role, status)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (email) 
    DO UPDATE SET 
      password_hash = EXCLUDED.password_hash,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      status = EXCLUDED.status,
      updated_at = NOW()
    RETURNING id, email, full_name, role, status, created_at;
    `,
    [
      DEMO_ADMIN.email.toLowerCase(),
      passwordHash,
      DEMO_ADMIN.fullName,
      DEMO_ADMIN.role,
      DEMO_ADMIN.status,
    ]
  );

  console.log('✅ Demo Admin successfully seeded in Neon PostgreSQL:');
  console.log(result[0]);
  console.log('--------------------------------------------------');
  console.log(`Email:    ${DEMO_ADMIN.email}`);
  console.log(`Password: ${DEMO_ADMIN.rawPassword} (stored securely as bcrypt hash)`);
  console.log(`Role:     ${DEMO_ADMIN.role}`);
  console.log('--------------------------------------------------');
}

// Auto-run if executed directly
if (typeof process !== 'undefined' && process.argv[1]?.includes('seed')) {
  seedDatabase().catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
}
