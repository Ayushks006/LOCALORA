import bcrypt from 'bcryptjs';
import { getDatabase, dbGet, dbRun } from '../database/index.js';
import { AuditService } from '../services/audit.service.js';

interface AdminBootstrapOptions {
  email: string;
  name: string;
  password?: string;
  force: boolean;
}

function parseArgs(): AdminBootstrapOptions {
  const args = process.argv.slice(2);
  let email = 'admin@localora.in';
  let name = 'System Administrator';
  let password: string | undefined = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  let force = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--email' && args[i + 1]) {
      email = args[++i].trim().toLowerCase();
    } else if (arg.startsWith('--email=')) {
      email = arg.split('=')[1].trim().toLowerCase();
    } else if (arg === '--name' && args[i + 1]) {
      name = args[++i].trim();
    } else if (arg.startsWith('--name=')) {
      name = arg.substring('--name='.length).trim();
    } else if (arg === '--password' && args[i + 1]) {
      password = args[++i];
    } else if (arg.startsWith('--password=')) {
      password = arg.substring('--password='.length);
    } else if (arg === '--force') {
      force = true;
    }
  }

  return { email, name, password, force };
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string): { valid: boolean; reason?: string } {
  if (!password || password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must contain both letters and numbers.' };
  }
  return { valid: true };
}

export async function bootstrapAdmin(options: AdminBootstrapOptions) {
  const db = getDatabase();
  const { email, name, password, force } = options;

  console.log('--- LOCALORA Administrator Bootstrap ---');

  if (!validateEmail(email)) {
    console.error(`Error: Invalid email format "${email}".`);
    process.exit(1);
  }

  // Check existing admins
  const existingAdmin = dbGet<{ id: number; email: string; full_name: string }>(
    "SELECT id, email, full_name FROM users WHERE role = 'admin' LIMIT 1"
  );

  const targetUser = dbGet<{ id: number; email: string; role: string }>(
    'SELECT id, email, role FROM users WHERE email = ?',
    [email]
  );

  if (existingAdmin && !force && (!targetUser || targetUser.role !== 'admin')) {
    console.warn(`[LOCKED] An active administrator account (${existingAdmin.email}) already exists.`);
    console.warn('To prevent unauthorized privilege escalation, pass --force to provision an additional admin or update credentials.');
    process.exit(1);
  }

  // Determine password
  let resolvedPassword = password;
  if (!resolvedPassword) {
    console.error('Error: Administrator password is required. Provide via --password "<secure-password>".');
    console.error('Password requirements: Minimum 8 characters, containing both letters and numbers.');
    process.exit(1);
  }

  const validation = validatePassword(resolvedPassword);
  if (!validation.valid) {
    console.error(`Error: ${validation.reason}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(resolvedPassword, 10);

  let userId: number;
  if (targetUser) {
    dbRun(
      `UPDATE users SET
        full_name = ?,
        password_hash = ?,
        role = 'admin',
        is_active = 1,
        updated_at = datetime('now')
      WHERE id = ?`,
      [name, passwordHash, targetUser.id]
    );
    userId = targetUser.id;
    console.log(`[SUCCESS] Existing user "${email}" (ID: ${userId}) promoted to Administrator with updated credentials.`);
  } else {
    const res = dbRun(
      `INSERT INTO users (email, password_hash, full_name, phone, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, '+91 80000 00001', 'admin', 1, datetime('now'), datetime('now'))`,
      [email, passwordHash, name]
    );
    userId = Number(res.lastInsertRowid);
    console.log(`[SUCCESS] Created new Administrator account "${email}" (ID: ${userId}).`);
  }

  AuditService.log(userId, 'admin_bootstrapped_cli', 'user', userId, `Administrator account ${email} bootstrapped via secure CLI tool.`);

  console.log('✓ Administrator setup complete.');
  console.log(`✓ Email: ${email}`);
  console.log(`✓ Role: admin`);
  console.log(`✓ User ID: ${userId}`);
  console.log('✓ Password has been securely hashed with bcrypt (cost: 10).');
  console.log('NOTE: Store administrator credentials securely in your password manager.');
}

const isDirectRun = process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/bootstrapAdmin.ts');
if (isDirectRun) {
  const options = parseArgs();
  bootstrapAdmin(options).catch((err) => {
    console.error('Bootstrap failed with error:', err);
    process.exit(1);
  });
}
