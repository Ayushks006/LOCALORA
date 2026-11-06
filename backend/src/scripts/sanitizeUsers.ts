import crypto from 'crypto';
import { getDatabase } from '../database/index.js';

const db = getDatabase();

console.log('--- Sanitizing LOCALORA Database Accounts ---');

// 1. Remove ephemeral test accounts created during test runs
const deleteTestUsers = db.prepare(
  "DELETE FROM users WHERE email IN ('new.traveler@example.com', 'other.traveler@example.com', 'fake.admin@example.com')"
);
const delResult = deleteTestUsers.run();
console.log(`✓ Removed ${delResult.changes} test runner artifacts.`);

// 2. Lock seed listing accounts to disable public login while preserving listing foreign keys
const seedEmails = [
  'ayush.tourist@example.com',
  'raghu.guide@example.com',
  'priya.homestay@example.com',
  'kavita.crafts@example.com',
];

for (const email of seedEmails) {
  const disabledHash = `!LOCKED_SEED_PROFILE_${crypto.randomUUID()}`;
  const res = db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(disabledHash, email);
  if (res.changes > 0) {
    console.log(`✓ Locked credentials for seed listing provider "${email}" (direct login disabled).`);
  }
}

// 3. Output current user roster
const remaining = db.prepare('SELECT id, email, full_name, role, is_active, password_hash FROM users').all() as any[];
console.log('\nCurrent Database Users:');
for (const u of remaining) {
  const isLocked = u.password_hash.startsWith('!');
  const statusStr = isLocked ? '[LOCKED SEED ACCOUNT]' : '[ACTIVE AUTHENTICATED]';
  console.log(`- ID: ${u.id} | Email: ${u.email} | Role: ${u.role} | Status: ${statusStr}`);
}
