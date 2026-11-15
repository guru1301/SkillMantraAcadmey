import { runMigration } from './migrate';

async function main() {
  console.log('==================================================');
  console.log('SkillThinker: Legacy Database Setup (Migrations Only)');
  console.log('==================================================');

  await runMigration();

  console.log('🎉 Setup complete (legacy seeding disabled for security).');
}

main().catch((err) => {
  console.error('❌ Database setup failed:', err);
  process.exit(1);
});
