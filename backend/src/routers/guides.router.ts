import { Router, Request, Response } from 'express';
import { dbAll, dbGet, dbRun } from '../database/index.js';
import { GuideProfile, Booking } from '../types/index.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

export const guidesRouter = Router();

// List verified guides
guidesRouter.get('/', (req: Request, res: Response) => {
  const { district, language, max_price, min_rating } = req.query;

  let sql = `
    SELECT g.*, u.full_name, u.email
    FROM guide_profiles g
    JOIN users u ON g.user_id = u.id
    WHERE g.verified = 1 AND u.is_active = 1
  `;
  const params: any[] = [];

  if (district) {
    sql += ` AND (LOWER(g.district) = LOWER(?) OR g.service_area LIKE ?)`;
    params.push(district, `%${district}%`);
  }

  if (language) {
    sql += ` AND g.languages LIKE ?`;
    params.push(`%${language}%`);
  }

  if (max_price) {
    sql += ` AND g.pricing_per_day <= ?`;
    params.push(Number(max_price));
  }

  if (min_rating) {
    sql += ` AND g.rating_avg >= ?`;
    params.push(Number(min_rating));
  }

  sql += ` ORDER BY g.rating_avg DESC, g.reviews_count DESC`;

  const guides = dbAll<GuideProfile>(sql, params);
  const parsed = guides.map((g) => ({
    ...g,
    languages: typeof g.languages === 'string' ? JSON.parse(g.languages) : g.languages,
  }));

  return res.json({ guides: parsed });
});

// Single guide profile
guidesRouter.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const guide = dbGet<GuideProfile>(
    `SELECT g.*, u.full_name, u.email
     FROM guide_profiles g
     JOIN users u ON g.user_id = u.id
     WHERE g.id = ?`,
    [id]
  );

  if (!guide) {
    return res.status(404).json({ error: 'Guide profile not found.' });
  }

  const reviews = dbAll(
    `SELECT r.*, u.full_name as author_name 
     FROM reviews r 
     JOIN users u ON r.user_id = u.id 
     WHERE r.target_type = 'guide' AND r.target_id = ? AND r.is_approved = 1
     ORDER BY r.created_at DESC LIMIT 20`,
    [guide.id]
  );

  return res.json({
    guide: {
      ...guide,
      languages: typeof guide.languages === 'string' ? JSON.parse(guide.languages) : guide.languages,
      reviews,
    },
  });
});

// Guide: My Profile
guidesRouter.get('/me/profile', requireAuth, requireRole(['guide', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const guide = dbGet<GuideProfile>('SELECT * FROM guide_profiles WHERE user_id = ?', [req.user!.id]);
  if (!guide) {
    return res.status(404).json({ error: 'Guide profile does not exist yet.' });
  }

  return res.json({
    guide: {
      ...guide,
      languages: typeof guide.languages === 'string' ? JSON.parse(guide.languages) : guide.languages,
    },
  });
});

// Guide: Update Profile
guidesRouter.put('/me/profile', requireAuth, requireRole(['guide', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const { service_area, district, languages, years_experience, bio, pricing_per_day, profile_image } = req.body;

  let guide = dbGet<GuideProfile>('SELECT id FROM guide_profiles WHERE user_id = ?', [req.user!.id]);
  if (!guide) {
    dbRun(
      `INSERT INTO guide_profiles (user_id, service_area, district, languages, years_experience, bio, pricing_per_day, profile_image, verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        req.user!.id,
        service_area || 'Karnataka',
        district || 'Bengaluru',
        JSON.stringify(languages || ['English', 'Kannada']),
        years_experience || 1,
        bio || 'Certified guide',
        pricing_per_day || 1500,
        profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      ]
    );
  } else {
    dbRun(
      `UPDATE guide_profiles 
       SET service_area = ?, district = ?, languages = ?, years_experience = ?, bio = ?, pricing_per_day = ?, profile_image = ?
       WHERE user_id = ?`,
      [
        service_area,
        district,
        JSON.stringify(languages || ['English', 'Kannada']),
        years_experience,
        bio,
        pricing_per_day,
        profile_image,
        req.user!.id,
      ]
    );
  }

  return res.json({ message: 'Guide profile saved successfully.' });
});

// Guide: Received Bookings
guidesRouter.get('/me/bookings', requireAuth, requireRole(['guide', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const guide = dbGet<GuideProfile>('SELECT id FROM guide_profiles WHERE user_id = ?', [req.user!.id]);
  if (!guide) {
    return res.json({ bookings: [] });
  }

  const bookings = dbAll<Booking>(
    `SELECT b.*, u.full_name as user_name, u.email as user_email, u.phone as user_phone,
            p.status as payment_status, p.payment_provider
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     LEFT JOIN payments p ON b.id = p.booking_id
     WHERE b.booking_type = 'guide' AND b.item_id = ?
     ORDER BY b.start_date DESC`,
    [guide.id]
  );

  return res.json({ bookings });
});
