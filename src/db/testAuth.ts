import { loadEnvLocal } from './loadEnv';
loadEnvLocal();

import { testDbConnection, getAdminStats, query } from '../lib/db';
import { verifyPassword } from '../lib/auth/password';
import { signSession, verifySessionToken } from '../lib/auth/session';

async function runTests() {
  console.log('==================================================');
  console.log('Skill Matra: Running Automated Verification Tests');
  console.log('==================================================');

  // Test 1: Neon Database Connectivity
  console.log('\n[TEST 1] Testing Neon PostgreSQL Connection...');
  const connTest = await testDbConnection();
  console.log('Status:', connTest.connected ? '✅ PASS' : '❌ FAIL', connTest.message);
  if (!connTest.connected) throw new Error('Database connection failed');

  // Test 2: Admin User in Neon Database
  console.log('\n[TEST 2] Verifying Admin User in Neon Database...');
  const users = await query(
    `SELECT id, email, password_hash, full_name, role, status, created_at, last_login_at 
     FROM admin_users 
     WHERE LOWER(email) = LOWER($1)`,
    ['admin@skillmatra.com']
  );
  if (!users || users.length === 0) throw new Error('Admin user not found in database');
  const admin = users[0];
  console.log('Admin found in Neon DB:');
  console.log('  ID:       ', admin.id);
  console.log('  Email:    ', admin.email);
  console.log('  Full Name:', admin.full_name);
  console.log('  Role:     ', admin.role);
  console.log('  Status:   ', admin.status);
  console.log('Result: ✅ PASS');

  // Test 3: Password Hash Verification (bcrypt)
  console.log('\n[TEST 3] Verifying Password Hashing & Comparison...');
  const correctMatch = await verifyPassword('1234', admin.password_hash);
  const wrongMatch = await verifyPassword('wrongpassword999', admin.password_hash);
  console.log('  Password "1234":            ', correctMatch ? '✅ MATCHED (PASS)' : '❌ FAILED');
  console.log('  Password "wrongpassword999":', !wrongMatch ? '✅ REJECTED (PASS)' : '❌ FAILED');
  if (!correctMatch || wrongMatch) throw new Error('Password verification logic failed');

  // Test 4: Real Database Statistics Queries
  console.log('\n[TEST 4] Testing Real Database Statistics (Neon Queries)...');
  const stats = await getAdminStats();
  console.log('  Total Admins:   ', stats.totalAdmins, stats.totalAdmins >= 1 ? '✅ PASS' : '❌ FAIL');
  console.log('  Active Admins:  ', stats.activeAdmins, stats.activeAdmins >= 1 ? '✅ PASS' : '❌ FAIL');
  console.log('  Database Status:', stats.dbConnected ? '✅ Connected (PASS)' : '❌ Disconnected');
  console.log('  System Status:  ', stats.systemStatus, stats.systemStatus === 'Operational' ? '✅ PASS' : '❌ FAIL');
  if (!stats.dbConnected || stats.totalAdmins < 1) throw new Error('Stats queries failed');

  // Test 5: Session Token Encryption & Verification (JWT)
  console.log('\n[TEST 5] Testing Session Signing & Verification (jose / JWT)...');
  const token = await signSession({
    id: admin.id,
    email: admin.email,
    fullName: admin.full_name,
    role: admin.role,
  });
  console.log('  Generated Session Token Length:', token.length, 'chars');
  const verified = await verifySessionToken(token);
  console.log('  Verified Session User:         ', verified?.email === admin.email ? '✅ PASS' : '❌ FAIL');
  if (verified?.email !== admin.email || verified?.role !== 'super_admin') {
    throw new Error('Session verification failed');
  }

  console.log('\n==================================================');
  console.log('🎉 ALL 5 BACKEND & DATABASE VERIFICATION TESTS PASSED!');
  console.log('==================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Verification test failed:', err);
  process.exit(1);
});
