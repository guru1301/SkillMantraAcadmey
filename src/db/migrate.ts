import { neon, neonConfig } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import { loadEnvLocal } from './loadEnv';

// Ensure correct HTTPS endpoint resolution for Neon regional hosts
neonConfig.fetchEndpoint = (host: string) => `https://${host}/sql`;

/**
 * Migration runner for Skill Matra Neon PostgreSQL database.
 * Scans src/db/migrations/ in numerical order and applies all SQL files.
 */
export async function runMigration() {
  loadEnvLocal();
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL is not set in environment or .env.local');
    process.exit(1);
  }

  console.log('🔄 Connecting to Neon PostgreSQL...');
  const sql = neon(databaseUrl);

  const migrationsDir = path.join(process.cwd(), 'src', 'db', 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  console.log(`📁 Found ${files.length} migration file(s) in ${migrationsDir}`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    console.log(`\n📄 Running migration: ${file}...`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');

    // Strip SQL comments and split statements cleanly by semicolon
    const cleanSql = sqlContent.replace(/--.*$/gm, '').trim();
    const statements = cleanSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`  Executing ${statements.length} statement(s)...`);

    for (const statement of statements) {
      try {
        await sql.query(statement);
      } catch (err: any) {
        // Ignore extension permissions if cloud DB user lacks superuser
        if (statement.includes('CREATE EXTENSION') && err.message?.includes('permission')) {
          console.warn('  ⚠️ Notice: pgcrypto extension requires elevated permissions. Proceeding...');
        } else {
          console.error(`  ❌ Statement failed in ${file}:\n`, statement);
          throw err;
        }
      }
    }

    console.log(`  ✅ Applied: ${file}`);
  }

  console.log('\n🎉 All migrations completed successfully.');
}

// Auto-run if executed directly
if (typeof process !== 'undefined' && process.argv[1]?.includes('migrate')) {
  runMigration().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
}
