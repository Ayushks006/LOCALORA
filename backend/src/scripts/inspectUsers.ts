import { getDatabase } from '../database/index.js';

const db = getDatabase();
const users = db.prepare('SELECT id, email, full_name, role, is_active, password_hash FROM users').all();
console.log('Current Database Users:');
for (const u of users as any[]) {
  console.log(`- ID: ${u.id} | Email: ${u.email} | Role: ${u.role} | Active: ${u.is_active} | PwdHash: ${u.password_hash.substring(0, 15)}...`);
}
