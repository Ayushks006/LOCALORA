import bcrypt from 'bcryptjs';
import { getDatabase } from '../database/index.js';

const db = getDatabase();

console.log('--- Verifying Authentication Security ---');

async function testLogin(email: string, passwordAttempt: string): Promise<boolean> {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || !user.password_hash) return false;
  if (user.password_hash.startsWith('!')) return false; // Locked account check
  return await bcrypt.compare(passwordAttempt, user.password_hash);
}

async function run() {
  const tests = [
    { email: 'ayush.tourist@example.com', pass: 'Localora@2026', expected: false, name: 'Seed tourist login with old demo password' },
    { email: 'raghu.guide@example.com', pass: 'Localora@2026', expected: false, name: 'Seed guide login with old demo password' },
    { email: 'priya.homestay@example.com', pass: 'Localora@2026', expected: false, name: 'Seed homestay host login with old demo password' },
    { email: 'kavita.crafts@example.com', pass: 'Localora@2026', expected: false, name: 'Seed artisan login with old demo password' },
    { email: 'admin@localora.in', pass: 'Localora@2026', expected: false, name: 'Admin login with old demo password' },
    { email: 'admin@localora.in', pass: 'AdminSecure2026!', expected: true, name: 'Admin login with newly bootstrapped secure credentials' },
  ];

  let allPassed = true;
  for (const t of tests) {
    const success = await testLogin(t.email, t.pass);
    const pass = success === t.expected;
    if (!pass) allPassed = false;
    const mark = pass ? '✓ PASS' : '✗ FAIL';
    console.log(`${mark}: ${t.name} -> Authenticated: ${success} (Expected: ${t.expected})`);
  }

  if (allPassed) {
    console.log('\n✓ ALL AUTHENTICATION SECURITY TESTS PASSED!');
    console.log('All legacy demo logins are fully blocked.');
    console.log('Admin account is authenticated only with the new bootstrapped credentials.');
  } else {
    console.error('\n✗ SOME AUTH CHECKS FAILED!');
    process.exit(1);
  }
}

run();
