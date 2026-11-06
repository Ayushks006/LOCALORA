import bcrypt from 'bcryptjs';
import { getDatabase, dbGet, dbRun, dbAll } from '../database/index.js';

async function main() {
  const db = getDatabase();
  const defaultPassword = 'Localora@2026';
  const hash = await bcrypt.hash(defaultPassword, 10);

  // 1. Update locked users
  dbRun("UPDATE users SET password_hash = ? WHERE password_hash LIKE '!LOCKED%'", [hash]);

  // 2. Ensure Suresh Bhat exists in users
  let suresh = dbGet<{ id: number }>('SELECT id FROM users WHERE email = ?', ['suresh.bhat@example.com']);
  if (!suresh) {
    const res = dbRun(
      `INSERT INTO users (email, password_hash, full_name, phone, role, is_active, bio, city, preferred_language, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'tourist', 1, 'Local explorer and heritage enthusiast.', 'Kumta, Uttara Kannada', 'Kannada', datetime('now'), datetime('now'))`,
      ['suresh.bhat@example.com', hash, 'Suresh Bhat', '+91 98765 00054']
    );
    suresh = { id: Number(res.lastInsertRowid) };
    console.log(`Created user account for Suresh Bhat (ID: ${suresh.id})`);
  } else {
    dbRun('UPDATE users SET password_hash = ? WHERE id = ?', [hash, suresh.id]);
    console.log(`Updated password for Suresh Bhat (ID: ${suresh.id})`);
  }

  // 3. Link Suresh Bhat to community submission
  dbRun('UPDATE community_submissions SET user_id = ? WHERE contributor_email = ?', [suresh.id, 'suresh.bhat@example.com']);

  // 4. Output summary
  const users = dbAll<{ id: number; email: string; full_name: string; role: string }>(
    'SELECT id, email, full_name, role FROM users ORDER BY role, id'
  );
  console.log('\n--- ACTIVE ACCOUNTS SUMMARY ---');
  for (const u of users) {
    console.log(`Role: ${u.role.padEnd(16)} | Email: ${u.email.padEnd(32)} | Name: ${u.full_name}`);
  }
}

main().catch(console.error);

