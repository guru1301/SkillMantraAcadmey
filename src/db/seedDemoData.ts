import bcrypt from 'bcryptjs';
import { loadEnvLocal } from './loadEnv';
loadEnvLocal();
import { query } from '../lib/db';

/**
 * OPTIONAL DEVELOPMENT SEED DATA.
 * Run explicitly via: npm run db:seed-demo
 * DO NOT RUN AUTOMATICALLY IN PRODUCTION.
 */
export async function seedDemoData() {
  console.log('🔄 Connecting to Neon PostgreSQL for Optional Demo Seeding...');

  // 1. Seed Demo College: Saranathan College of Engineering
  console.log('🏛️ Seeding demo college: Saranathan College of Engineering...');
  const existingCollege = await query(
    `SELECT id, name FROM colleges WHERE LOWER(TRIM(name)) = 'saranathan college of engineering' AND LOWER(TRIM(COALESCE(city, ''))) = 'trichy'`
  );

  let collegeId: string;
  if (existingCollege.length > 0) {
    collegeId = existingCollege[0].id;
    await query(
      `
      UPDATE colleges 
      SET state = $1, contact_name = $2, contact_email = $3, contact_phone = $4, status = $5, updated_at = NOW()
      WHERE id = $6
      `,
      [
        'Tamil Nadu',
        'Dr. K. Rajasekaran',
        'principal@saranathan.ac.in',
        '+91 94431 12345',
        'active',
        collegeId,
      ]
    );
    console.log(`  ✅ Existing college updated: Saranathan College of Engineering (${collegeId})`);
  } else {
    const createdCollege = await query(
      `
      INSERT INTO colleges (name, city, state, contact_name, contact_email, contact_phone, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name;
      `,
      [
        'Saranathan College of Engineering',
        'Trichy',
        'Tamil Nadu',
        'Dr. K. Rajasekaran',
        'principal@saranathan.ac.in',
        '+91 94431 12345',
        'active',
      ]
    );
    collegeId = createdCollege[0].id;
    console.log(`  ✅ New college created: Saranathan College of Engineering (${collegeId})`);
  }

  // 2. Seed Demo Programs: Data Analytics, Full Stack Development
  console.log('📚 Seeding demo programs...');
  const upsertProgram = async (name: string, description: string, durationDays: number) => {
    const existing = await query(
      `SELECT id, name FROM programs WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))`,
      [name]
    );
    if (existing.length > 0) {
      await query(
        `UPDATE programs SET description = $1, duration_days = $2, status = 'active', updated_at = NOW() WHERE id = $3`,
        [description, durationDays, existing[0].id]
      );
      return existing[0].id;
    } else {
      const created = await query(
        `INSERT INTO programs (name, description, duration_days, status) VALUES ($1, $2, $3, 'active') RETURNING id`,
        [name, description, durationDays]
      );
      return created[0].id;
    }
  };

  const programDAId = await upsertProgram(
    'Data Analytics',
    'Comprehensive Data Analysis curriculum including Python, SQL, PowerBI, and Business Intelligence benchmarks.',
    45
  );
  const programFSDId = await upsertProgram(
    'Full Stack Development',
    'Modern web application engineering featuring Next.js, Node.js, PostgreSQL, and Cloud DevOps.',
    60
  );
  console.log(`  ✅ Program ready: Data Analytics (${programDAId})`);
  console.log(`  ✅ Program ready: Full Stack Development (${programFSDId})`);

  // 3. Seed Demo Batch: DA-TRI-2026-01
  console.log('🚀 Seeding demo cohort batch: DA-TRI-2026-01...');
  const existingBatch = await query(
    `SELECT id, code FROM batches WHERE code = 'DA-TRI-2026-01'`
  );
  let batchId: string;
  if (existingBatch.length > 0) {
    batchId = existingBatch[0].id;
    await query(
      `
      UPDATE batches 
      SET college_id = $1, program_id = $2, start_date = $3, end_date = $4, target_strength = $5, status = $6, updated_at = NOW()
      WHERE id = $7
      `,
      [
        collegeId,
        programDAId,
        '2026-10-15',
        '2026-11-10',
        60,
        'planned',
        batchId,
      ]
    );
    console.log(`  ✅ Existing batch updated: DA-TRI-2026-01 (${batchId})`);
  } else {
    const createdBatch = await query(
      `
      INSERT INTO batches (code, college_id, program_id, start_date, end_date, target_strength, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, code, target_strength, status;
      `,
      [
        'DA-TRI-2026-01',
        collegeId,
        programDAId,
        '2026-10-15',
        '2026-11-10',
        60,
        'planned',
      ]
    );
    batchId = createdBatch[0].id;
    console.log(`  ✅ New batch created: DA-TRI-2026-01 (${batchId})`);
  }

  // 4. Seed Demo Resource (Google Drive Link) for DA-TRI-2026-01
  console.log('📁 Seeding demo resource link...');
  const existingResource = await query(
    `SELECT id FROM resources WHERE batch_id = $1 AND name = 'Data Analytics Materials'`,
    [batchId]
  );
  if (existingResource.length === 0) {
    const resourceResult = await query(
      `
      INSERT INTO resources (batch_id, name, type, url, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, type, url;
      `,
      [
        batchId,
        'Data Analytics Materials',
        'google_drive',
        'https://drive.google.com/drive/folders/skillmatra-demo-cohort',
        'Curriculum lecture slides, starter datasets, and lab exercises.',
      ]
    );
    console.log(`  ✅ Resource created: ${resourceResult[0].name} (${resourceResult[0].url})`);
  } else {
    console.log(`  ✅ Resource already attached: Data Analytics Materials`);
  }

  // 5. Seed Demo Trainers
  console.log('👨‍🏫 Seeding demo trainers...');
  const upsertTrainer = async (fullName: string, email: string, phone: string, skills: string) => {
    const existing = await query(
      `SELECT id FROM trainers WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))`,
      [email]
    );
    if (existing.length > 0) {
      await query(
        `UPDATE trainers SET full_name = $1, phone = $2, skills = $3, status = 'active', updated_at = NOW() WHERE id = $4`,
        [fullName, phone, skills, existing[0].id]
      );
      return existing[0].id;
    } else {
      const created = await query(
        `INSERT INTO trainers (full_name, email, phone, skills, status) VALUES ($1, $2, $3, $4, 'active') RETURNING id`,
        [fullName, email, phone, skills]
      );
      return created[0].id;
    }
  };

  const trainerLeadId = await upsertTrainer(
    'Dr. K. Suresh',
    'suresh.k@skillmatra.com',
    '+91 98401 23456',
    'Python, SQL, Machine Learning, Data Analytics'
  );
  const trainerAssistantId = await upsertTrainer(
    'Priya Raman',
    'priya.raman@skillmatra.com',
    '+91 97910 87654',
    'Power BI, Tableau, Advanced Excel, Statistics'
  );
  await upsertTrainer(
    'Karthik Raja',
    'karthik.raja@skillmatra.com',
    '+91 99420 54321',
    'Next.js, React, Node.js, Cloud Architecture'
  );
  console.log('  ✅ Demo trainers ready');

  // 6. Assign Trainers to Demo Batch DA-TRI-2026-01
  console.log('🤝 Assigning demo trainers to batch DA-TRI-2026-01...');
  // Ensure Lead Trainer
  const existingLead = await query(
    `SELECT id FROM batch_trainers WHERE batch_id = $1 AND trainer_id = $2`,
    [batchId, trainerLeadId]
  );
  if (existingLead.length === 0) {
    await query(
      `INSERT INTO batch_trainers (batch_id, trainer_id, is_lead, role) VALUES ($1, $2, true, 'Senior Lead Trainer')`,
      [batchId, trainerLeadId]
    );
    console.log('  ✅ Assigned Dr. K. Suresh as Lead Trainer');
  } else {
    await query(
      `UPDATE batch_trainers SET is_lead = true, role = 'Senior Lead Trainer' WHERE id = $1`,
      [existingLead[0].id]
    );
  }

  // Ensure Assistant Trainer
  const existingAssistant = await query(
    `SELECT id FROM batch_trainers WHERE batch_id = $1 AND trainer_id = $2`,
    [batchId, trainerAssistantId]
  );
  if (existingAssistant.length === 0) {
    await query(
      `INSERT INTO batch_trainers (batch_id, trainer_id, is_lead, role) VALUES ($1, $2, false, 'Hands-on Lab Mentor')`,
      [batchId, trainerAssistantId]
    );
    console.log('  ✅ Assigned Priya Raman as Assistant Trainer');
  }

  // 7. Seed Demo College User (Institutional Coordinator)
  console.log('🏛️ Seeding demo college user...');
  const passwordHash = await bcrypt.hash('1234', 10);
  const existingCollegeUser = await query(
    `SELECT id FROM college_users WHERE LOWER(email) = LOWER($1)`,
    ['coordinator@saranathan.ac.in']
  );
  if (existingCollegeUser.length === 0) {
    await query(
      `INSERT INTO college_users (college_id, email, password_hash, full_name, phone, role, status)
       VALUES ($1, $2, $3, $4, $5, 'college_admin', 'active')`,
      [
        collegeId,
        'coordinator@saranathan.ac.in',
        passwordHash,
        'Dr. K. Rajasekaran',
        '+91 94431 12345',
      ]
    );
    console.log('  ✅ Created demo college user: coordinator@saranathan.ac.in (pw: 1234)');
  } else {
    await query(
      `UPDATE college_users 
       SET password_hash = $1, college_id = $2, full_name = $3, status = 'active', updated_at = NOW() 
       WHERE id = $4`,
      [passwordHash, collegeId, 'Dr. K. Rajasekaran', existingCollegeUser[0].id]
    );
    console.log('  ✅ Updated demo college user: coordinator@saranathan.ac.in (pw: 1234)');
  }

  console.log('\n🎉 Optional Demo Seeding Complete!');
}

if (typeof process !== 'undefined' && process.argv[1]?.includes('seedDemoData')) {
  seedDemoData().catch((err) => {
    console.error('❌ Demo seeding failed:', err);
    process.exit(1);
  });
}
