import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import { dbGet, dbRun } from '../database/index.js';
import { User, UserRole } from '../types/index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { AuditService } from '../services/audit.service.js';

export const authRouter = Router();

// Registration
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, phone, role, service_area, languages, property_name, business_name, description } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Explicitly disallow public admin registration
    const requestedRole: UserRole = role || 'tourist';
    if (requestedRole === 'admin') {
      return res.status(403).json({ error: 'Administrator accounts cannot be registered publicly.' });
    }

    const validRoles: UserRole[] = ['tourist', 'guide', 'homestay_owner', 'business_owner'];
    if (!validRoles.includes(requestedRole)) {
      return res.status(400).json({ error: 'Invalid user role specified.' });
    }

    // Check if email already in use
    const existing = dbGet<User>('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = dbRun(
      `INSERT INTO users (email, password_hash, full_name, phone, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      [email.toLowerCase().trim(), passwordHash, full_name.trim(), phone || null, requestedRole]
    );

    const userId = Number(result.lastInsertRowid);

    // Create role-specific initial profile records
    if (requestedRole === 'guide') {
      dbRun(
        `INSERT INTO guide_profiles (user_id, service_area, district, languages, years_experience, bio, pricing_per_day, verified, profile_image)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [
          userId,
          service_area || 'Karnataka',
          service_area || 'Bengaluru',
          JSON.stringify(languages || ['English', 'Kannada']),
          1,
          description || 'Certified regional guide.',
          1500,
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        ]
      );
    } else if (requestedRole === 'business_owner') {
      dbRun(
        `INSERT INTO cultural_businesses (owner_id, business_name, category, description, region_code, district, locality, address, contact_phone, verified)
         VALUES (?, ?, 'Art & Craft', ?, 'KA', 'Mysuru', 'Heritage City', 'Central Market', ?, 0)`,
        [userId, business_name || `${full_name}'s Workshop`, description || 'Traditional cultural experiences and artisanal crafts.', phone || '9999999999']
      );
    }

    const token = jwt.sign(
      { id: userId, email: email.toLowerCase().trim(), role: requestedRole, full_name: full_name.trim() },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    AuditService.log(userId, 'user_registered', 'user', userId, `New ${requestedRole} account created.`);

    return res.status(201).json({
      message: 'Account registered successfully.',
      token,
      user: {
        id: userId,
        email: email.toLowerCase().trim(),
        full_name: full_name.trim(),
        phone: phone || null,
        role: requestedRole,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

// Login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = dbGet<User>('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.is_active !== 1) {
      return res.status(403).json({ error: 'This account has been deactivated.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    AuditService.log(user.id, 'user_login', 'user', user.id, 'User signed in successfully.');

    return res.json({
      message: 'Signed in successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

// Current User Profile
// Current User Profile (Lightweight)
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = dbGet<User>(
    'SELECT id, email, full_name, phone, role, avatar_url, bio, city, preferred_language, is_active, created_at, updated_at FROM users WHERE id = ?',
    [req.user!.id]
  );
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  return res.json({ user });
});

// Detailed User Profile + Role-Specific Details
authRouter.get('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = dbGet<User>(
    'SELECT id, email, full_name, phone, role, avatar_url, bio, city, preferred_language, is_active, created_at, updated_at FROM users WHERE id = ?',
    [req.user!.id]
  );
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  let guideProfile = null;
  let homestay = null;
  let culturalBusiness = null;

  if (user.role === 'guide') {
    guideProfile = dbGet('SELECT * FROM guide_profiles WHERE user_id = ?', [user.id]) || null;
    if (guideProfile && typeof (guideProfile as any).languages === 'string') {
      try {
        (guideProfile as any).languages = JSON.parse((guideProfile as any).languages);
      } catch (_) {}
    }
  } else if (user.role === 'homestay_owner') {
    homestay = dbGet('SELECT * FROM homestays WHERE owner_id = ? ORDER BY id DESC LIMIT 1', [user.id]) || null;
    if (homestay && typeof (homestay as any).amenities === 'string') {
      try {
        (homestay as any).amenities = JSON.parse((homestay as any).amenities);
      } catch (_) {}
    }
  } else if (user.role === 'business_owner') {
    culturalBusiness = dbGet('SELECT * FROM cultural_businesses WHERE owner_id = ? ORDER BY id DESC LIMIT 1', [user.id]) || null;
  }

  return res.json({
    user,
    guideProfile,
    homestay,
    culturalBusiness,
  });
});

// Profile update (Enforcing Strict Role & Identity Integrity)
authRouter.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const {
    full_name,
    phone,
    avatar_url,
    bio,
    city,
    preferred_language,
    guideProfile,
    homestay,
    culturalBusiness,
  } = req.body;

  if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
    return res.status(400).json({ error: 'Full name is required.' });
  }

  // Security Integrity: Reject any payload attempting to modify role or ID
  if (req.body.role && req.body.role !== req.user!.role) {
    return res.status(403).json({ error: 'Security policy: Changing user roles through profile update is prohibited.' });
  }
  if (req.body.id && req.body.id !== req.user!.id) {
    return res.status(403).json({ error: 'Security policy: Modifying user identifiers is prohibited.' });
  }

  // Update base user record
  dbRun(
    `UPDATE users SET
       full_name = ?,
       phone = ?,
       avatar_url = COALESCE(?, avatar_url),
       bio = ?,
       city = ?,
       preferred_language = ?,
       updated_at = datetime('now')
     WHERE id = ?`,
    [
      full_name.trim(),
      phone ? phone.trim() : null,
      avatar_url || null,
      bio ? bio.trim() : null,
      city ? city.trim() : null,
      preferred_language ? preferred_language.trim() : null,
      req.user!.id,
    ]
  );

  // Update role-specific profile records if applicable
  if (req.user!.role === 'guide' && guideProfile) {
    const langs = Array.isArray(guideProfile.languages)
      ? JSON.stringify(guideProfile.languages)
      : typeof guideProfile.languages === 'string'
      ? JSON.stringify(guideProfile.languages.split(',').map((s: string) => s.trim()).filter(Boolean))
      : undefined;

    dbRun(
      `UPDATE guide_profiles SET
         service_area = COALESCE(?, service_area),
         district = COALESCE(?, district),
         languages = COALESCE(?, languages),
         years_experience = COALESCE(?, years_experience),
         bio = COALESCE(?, bio),
         pricing_per_day = COALESCE(?, pricing_per_day),
         profile_image = COALESCE(?, profile_image)
       WHERE user_id = ?`,
      [
        guideProfile.service_area || null,
        guideProfile.district || null,
        langs || null,
        guideProfile.years_experience !== undefined ? Number(guideProfile.years_experience) : null,
        guideProfile.bio || null,
        guideProfile.pricing_per_day !== undefined ? Number(guideProfile.pricing_per_day) : null,
        avatar_url || guideProfile.profile_image || null,
        req.user!.id,
      ]
    );
  } else if (req.user!.role === 'homestay_owner' && homestay) {
    const amenitiesJson = Array.isArray(homestay.amenities)
      ? JSON.stringify(homestay.amenities)
      : typeof homestay.amenities === 'string'
      ? JSON.stringify(homestay.amenities.split(',').map((s: string) => s.trim()).filter(Boolean))
      : undefined;

    dbRun(
      `UPDATE homestays SET
         title = COALESCE(?, title),
         property_type = COALESCE(?, property_type),
         district = COALESCE(?, district),
         locality = COALESCE(?, locality),
         address = COALESCE(?, address),
         description = COALESCE(?, description),
         price_per_night = COALESCE(?, price_per_night),
         max_guests = COALESCE(?, max_guests),
         amenities = COALESCE(?, amenities),
         rules = COALESCE(?, rules),
         primary_image = COALESCE(?, primary_image)
       WHERE owner_id = ?`,
      [
        homestay.title || null,
        homestay.property_type || null,
        homestay.district || null,
        homestay.locality || null,
        homestay.address || null,
        homestay.description || null,
        homestay.price_per_night !== undefined ? Number(homestay.price_per_night) : null,
        homestay.max_guests !== undefined ? Number(homestay.max_guests) : null,
        amenitiesJson || null,
        homestay.rules || null,
        homestay.primary_image || null,
        req.user!.id,
      ]
    );
  } else if (req.user!.role === 'business_owner' && culturalBusiness) {
    dbRun(
      `UPDATE cultural_businesses SET
         business_name = COALESCE(?, business_name),
         category = COALESCE(?, category),
         description = COALESCE(?, description),
         district = COALESCE(?, district),
         locality = COALESCE(?, locality),
         address = COALESCE(?, address),
         contact_phone = COALESCE(?, contact_phone)
       WHERE owner_id = ?`,
      [
        culturalBusiness.business_name || null,
        culturalBusiness.category || null,
        culturalBusiness.description || null,
        culturalBusiness.district || null,
        culturalBusiness.locality || null,
        culturalBusiness.address || null,
        culturalBusiness.contact_phone || null,
        req.user!.id,
      ]
    );
  }

  AuditService.log(req.user!.id, 'profile_updated', 'user', req.user!.id, 'User updated their account profile.');

  const updatedUser = dbGet<User>(
    'SELECT id, email, full_name, phone, role, avatar_url, bio, city, preferred_language, is_active, created_at, updated_at FROM users WHERE id = ?',
    [req.user!.id]
  );

  return res.json({
    message: 'Profile updated successfully.',
    user: updatedUser,
  });
});

// Profile Photo Upload Endpoint (Base64 payload with magic bytes validation)
authRouter.post('/profile-photo', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { image, filename: clientFilename } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Image data is required.' });
    }

    // Strip data URI header if present
    const base64Data = image.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    // Size check: limit to 5MB
    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image size exceeds maximum limit of 5MB.' });
    }
    if (buffer.length < 16) {
      return res.status(400).json({ error: 'Invalid or corrupt image payload.' });
    }

    // Magic bytes verification
    let ext = 'jpg';
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      ext = 'jpg';
    } else if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      ext = 'png';
    } else if (
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      ext = 'webp';
    } else if (buffer.toString('ascii', 0, 4) === 'GIF8') {
      ext = 'gif';
    } else {
      return res.status(400).json({
        error: 'Invalid file format. Only authentic image files (JPEG, PNG, WebP, GIF) are accepted.',
      });
    }

    const safeFilename = `avatar-user-${req.user!.id}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const relativeUrl = `/uploads/avatars/${safeFilename}`;

    // Target directories
    const backendUploadDir = path.resolve(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(backendUploadDir)) {
      fs.mkdirSync(backendUploadDir, { recursive: true });
    }
    fs.writeFileSync(path.join(backendUploadDir, safeFilename), buffer);

    // Also mirror to frontend/public for instant Vite dev server serving
    const frontendUploadDir = path.resolve(process.cwd(), '..', 'frontend', 'public', 'uploads', 'avatars');
    try {
      if (!fs.existsSync(frontendUploadDir)) {
        fs.mkdirSync(frontendUploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(frontendUploadDir, safeFilename), buffer);
    } catch (_) {
      // Non-fatal if frontend directory path is different in standalone
    }

    // Update database records
    dbRun(
      `UPDATE users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?`,
      [relativeUrl, req.user!.id]
    );

    if (req.user!.role === 'guide') {
      dbRun(
        `UPDATE guide_profiles SET profile_image = ? WHERE user_id = ?`,
        [relativeUrl, req.user!.id]
      );
    }

    AuditService.log(
      req.user!.id,
      'profile_photo_uploaded',
      'user',
      req.user!.id,
      `User uploaded new avatar: ${safeFilename}`
    );

    const updatedUser = dbGet<User>(
      'SELECT id, email, full_name, phone, role, avatar_url, bio, city, preferred_language, is_active, created_at, updated_at FROM users WHERE id = ?',
      [req.user!.id]
    );

    return res.json({
      message: 'Profile photo uploaded successfully.',
      avatar_url: relativeUrl,
      user: updatedUser,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to process image upload.' });
  }
});

// Secure Administrator Bootstrap Endpoint
authRouter.post('/bootstrap-admin', async (req: Request, res: Response) => {
  try {
    const bootstrapToken = req.headers['x-admin-bootstrap-token'] || req.body.bootstrap_token;
    if (!bootstrapToken || bootstrapToken !== config.adminBootstrapToken) {
      return res.status(403).json({ error: 'Invalid administrative bootstrap token.' });
    }

    const { email, password, full_name } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name required.' });
    }

    const existing = dbGet<User>('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    const passwordHash = await bcrypt.hash(password, 10);

    let userId: number;
    if (existing) {
      dbRun(
        `UPDATE users SET role = 'admin', password_hash = ?, full_name = ?, updated_at = datetime('now') WHERE id = ?`,
        [passwordHash, full_name, existing.id]
      );
      userId = existing.id;
    } else {
      const result = dbRun(
        `INSERT INTO users (email, password_hash, full_name, role, is_active, created_at, updated_at)
         VALUES (?, ?, ?, 'admin', 1, datetime('now'), datetime('now'))`,
        [email.toLowerCase().trim(), passwordHash, full_name]
      );
      userId = Number(result.lastInsertRowid);
    }

    AuditService.log(userId, 'admin_bootstrapped', 'user', userId, 'Administrator account created or promoted via bootstrap.');

    return res.json({ message: 'Administrator account configured successfully.', userId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Bootstrap failed.' });
  }
});
