import { neon, neonConfig } from '@neondatabase/serverless';
import { loadEnvLocal } from './loadEnv';

neonConfig.fetchEndpoint = (host: string) => `https://${host}/sql`;

export async function verifyDatabase() {
  loadEnvLocal();
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL is not set in environment or .env.local');
    process.exit(1);
  }

  console.log('🔍 Running Database Verification against Neon PostgreSQL...\n');
  const sql = neon(databaseUrl);

  // 1. Table Counts
  console.log('--- 1. REAL TABLE COUNTS ---');
  const [collegesCount] = await sql.query('SELECT COUNT(*)::int as count FROM colleges');
  const [programsCount] = await sql.query('SELECT COUNT(*)::int as count FROM programs');
  const [batchesCount] = await sql.query('SELECT COUNT(*)::int as count FROM batches');
  const [resourcesCount] = await sql.query('SELECT COUNT(*)::int as count FROM resources');
  const [sessionsCount] = await sql.query('SELECT COUNT(*)::int as count FROM training_sessions');
  const [studentsCount] = await sql.query('SELECT COUNT(*)::int as count FROM students');

  const [trainersCount] = await sql.query('SELECT COUNT(*)::int as count FROM trainers');
  const [batchTrainersCount] = await sql.query('SELECT COUNT(*)::int as count FROM batch_trainers');

  console.log(`Colleges count:          ${collegesCount.count}`);
  console.log(`Programs count:          ${programsCount.count}`);
  console.log(`Batches count:           ${batchesCount.count}`);
  console.log(`Resources count:         ${resourcesCount.count}`);
  console.log(`Training Sessions count: ${sessionsCount.count}`);
  console.log(`Master Students count:   ${studentsCount.count}`);
  console.log(`Master Trainers count:   ${trainersCount.count}`);
  console.log(`Batch Assignments count: ${batchTrainersCount.count}`);

  // 2. Duplicate Protection: Case-Insensitive College Uniqueness
  console.log('\n--- 2. VERIFY DUPLICATE PROTECTION ---');
  try {
    // Attempt duplicate college insert with same lower name & city
    await sql.query(
      `INSERT INTO colleges (name, city) VALUES ('saranathan college of engineering', 'trichy')`
    );
    console.error('❌ FAILED: Duplicate college should have been rejected!');
  } catch (err: any) {
    if (err.message?.includes('duplicate key') || err.message?.includes('unique')) {
      console.log('✅ PASSED: Case-insensitive duplicate college insert correctly rejected by PostgreSQL index constraint.');
    } else {
      console.log('⚠️ Rejection reason:', err.message);
    }
  }

  // 2b. Duplicate Protection: Case-Insensitive Trainer Email
  try {
    const testEmail = 'verify_test_unique@skillmantra.com';
    const [t1] = await sql.query(
      `INSERT INTO trainers (full_name, email) VALUES ('Verify Trainer 1', $1) RETURNING id`,
      [testEmail]
    );
    try {
      await sql.query(
        `INSERT INTO trainers (full_name, email) VALUES ('Verify Trainer 2', $1)`,
        [testEmail.toUpperCase()]
      );
      console.error('❌ FAILED: Duplicate trainer email should have been rejected!');
    } catch (dupErr: any) {
      if (dupErr.message?.includes('duplicate key') || dupErr.message?.includes('unique') || dupErr.message?.includes('idx_trainers_email_lower')) {
        console.log('✅ PASSED: Duplicate trainer email rejected by idx_trainers_email_lower unique constraint.');
      } else {
        console.log('⚠️ Rejection reason:', dupErr.message);
      }
    } finally {
      if (t1) {
        await sql.query(`DELETE FROM trainers WHERE id = $1`, [t1.id]);
      }
    }
  } catch (err: any) {
    console.warn('⚠️ Notice during trainer email check:', err.message);
  }

  // 2c. Constraint: At Most One Lead Trainer Per Batch
  try {
    const [b] = await sql.query('SELECT id FROM batches LIMIT 1');
    if (b) {
      const [tA] = await sql.query(`INSERT INTO trainers (full_name) VALUES ('Lead Trainer Test A') RETURNING id`);
      const [tB] = await sql.query(`INSERT INTO trainers (full_name) VALUES ('Lead Trainer Test B') RETURNING id`);

      try {
        await sql.query(
          `INSERT INTO batch_trainers (batch_id, trainer_id, is_lead, role) VALUES ($1, $2, true, 'Lead Trainer')`,
          [b.id, tA.id]
        );

        // Attempt 2nd lead trainer in same batch
        try {
          await sql.query(
            `INSERT INTO batch_trainers (batch_id, trainer_id, is_lead, role) VALUES ($1, $2, true, 'Lead Trainer')`,
            [b.id, tB.id]
          );
          console.error('❌ FAILED: Second lead trainer should have been rejected by constraint!');
        } catch (leadErr: any) {
          if (leadErr.message?.includes('idx_batch_trainers_one_lead_per_batch') || leadErr.message?.includes('unique')) {
            console.log('✅ PASSED: Second lead trainer rejected by idx_batch_trainers_one_lead_per_batch index constraint.');
          } else {
            console.log('⚠️ Rejection reason:', leadErr.message);
          }
        }
      } finally {
        await sql.query(`DELETE FROM batch_trainers WHERE trainer_id IN ($1, $2)`, [tA.id, tB.id]);
        await sql.query(`DELETE FROM trainers WHERE id IN ($1, $2)`, [tA.id, tB.id]);
      }
    }
  } catch (err: any) {
    console.warn('⚠️ Notice during lead trainer constraint test:', err.message);
  }

  // 3. Invalid Batch Dates Rejection
  console.log('\n--- 3. VERIFY INVALID DATES REJECTION ---');
  try {
    // Pick first college & program for testing
    const [c] = await sql.query('SELECT id FROM colleges LIMIT 1');
    const [p] = await sql.query('SELECT id FROM programs LIMIT 1');

    if (c && p) {
      await sql.query(
        `INSERT INTO batches (code, college_id, program_id, start_date, end_date, target_strength)
         VALUES ('INVALID-DATES-TEST', $1, $2, '2026-12-01', '2026-11-01', 50)`,
        [c.id, p.id]
      );
      console.error('❌ FAILED: Invalid batch dates (end_date < start_date) should have been rejected!');
    }
  } catch (err: any) {
    if (err.message?.includes('chk_batch_dates') || err.message?.includes('check constraint')) {
      console.log('✅ PASSED: Invalid batch dates (end_date < start_date) rejected by CHECK(end_date >= start_date) constraint.');
    } else {
      console.log('⚠️ Rejection reason:', err.message);
    }
  }

  // 4. Invalid Foreign Keys Rejection: Invalid College ID
  console.log('\n--- 4. VERIFY INVALID COLLEGE ID FOREIGN KEY REJECTION ---');
  try {
    const [p] = await sql.query('SELECT id FROM programs LIMIT 1');
    if (p) {
      await sql.query(
        `INSERT INTO batches (code, college_id, program_id, start_date, end_date, target_strength)
         VALUES ('INVALID-COLLEGE-FK', '00000000-0000-0000-0000-000000000000', $1, '2026-10-01', '2026-10-30', 50)`,
        [p.id]
      );
      console.error('❌ FAILED: Non-existent college_id should have been rejected by foreign key!');
    }
  } catch (err: any) {
    if (err.message?.includes('foreign key') || err.message?.includes('violates foreign key constraint')) {
      console.log('✅ PASSED: Invalid college_id rejected by FOREIGN KEY (college_id) REFERENCES colleges(id) constraint.');
    } else {
      console.log('⚠️ Rejection reason:', err.message);
    }
  }

  // 5. Invalid Foreign Keys Rejection: Invalid Program ID
  console.log('\n--- 5. VERIFY INVALID PROGRAM ID FOREIGN KEY REJECTION ---');
  try {
    const [c] = await sql.query('SELECT id FROM colleges LIMIT 1');
    if (c) {
      await sql.query(
        `INSERT INTO batches (code, college_id, program_id, start_date, end_date, target_strength)
         VALUES ('INVALID-PROGRAM-FK', $1, '00000000-0000-0000-0000-000000000000', '2026-10-01', '2026-10-30', 50)`,
        [c.id]
      );
      console.error('❌ FAILED: Non-existent program_id should have been rejected by foreign key!');
    }
  } catch (err: any) {
    if (err.message?.includes('foreign key') || err.message?.includes('violates foreign key constraint')) {
      console.log('✅ PASSED: Invalid program_id rejected by FOREIGN KEY (program_id) REFERENCES programs(id) constraint.');
    } else {
      console.log('⚠️ Rejection reason:', err.message);
    }
  }

  console.log('\n🏁 ALL DATABASE VERIFICATION TESTS CONCLUDED.');
}

if (typeof process !== 'undefined' && process.argv[1]?.includes('verifyDb')) {
  verifyDatabase().catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  });
}
