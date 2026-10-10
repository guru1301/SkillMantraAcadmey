import { runMigration } from './migrate';
import { seedDatabase } from './seed';

async function main() {
  console.log('==================================================');
  console.log('Skill Matra: Database Setup (Migration & Seeding)');
  console.log('==================================================');

  await runMigration();
  await seedDatabase();

  console.log('🎉 Setup complete! Neon PostgreSQL is ready for Skill Matra.');
}

main().catch((err) => {
  console.error('❌ Database setup failed:', err);
  process.exit(1);
});
