import { Router, Request, Response } from 'express';
import { dbAll, dbGet, dbRun } from '../database/index.js';
import { Experience, CulturalBusiness, Booking } from '../types/index.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { AuditService } from '../services/audit.service.js';

export const experiencesRouter = Router();

// List verified experiences
experiencesRouter.get('/', (req: Request, res: Response) => {
  const { district, category, max_price } = req.query;

  let sql = `
    SELECT e.*, c.business_name, c.contact_phone
    FROM experiences e
    JOIN cultural_businesses c ON e.business_id = c.id
    WHERE e.verified = 1
  `;
  const params: any[] = [];

  if (district) {
    sql += ` AND (LOWER(e.district) = LOWER(?) OR LOWER(e.locality) = LOWER(?))`;
    params.push(district, district);
  }

  if (category) {
    sql += ` AND LOWER(e.category) = LOWER(?)`;
    params.push(category);
  }

  if (max_price) {
    sql += ` AND e.price_per_person <= ?`;
    params.push(Number(max_price));
  }

  sql += ` ORDER BY e.rating_avg DESC, e.reviews_count DESC`;

  const experiences = dbAll<Experience>(sql, params);
  const parsed = experiences.map((exp) => ({
    ...exp,
    includes: typeof exp.includes === 'string' ? JSON.parse(exp.includes) : exp.includes,
  }));

  return res.json({ experiences: parsed });
});

// Single experience by slug
experiencesRouter.get('/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const experience = dbGet<Experience>(
    `SELECT e.*, c.business_name, c.address as business_address, c.contact_phone, c.description as business_bio
     FROM experiences e
     JOIN cultural_businesses c ON e.business_id = c.id
     WHERE e.slug = ?`,
    [slug]
  );

  if (!experience) {
    return res.status(404).json({ error: 'Experience not found.' });
  }

  const reviews = dbAll(
    `SELECT r.*, u.full_name as author_name 
     FROM reviews r 
     JOIN users u ON r.user_id = u.id 
     WHERE r.target_type = 'experience' AND r.target_id = ? AND r.is_approved = 1
     ORDER BY r.created_at DESC LIMIT 20`,
    [experience.id]
  );

  return res.json({
    experience: {
      ...experience,
      includes: typeof experience.includes === 'string' ? JSON.parse(experience.includes) : experience.includes,
      reviews,
    },
  });
});

// Business Owner: My Experiences
experiencesRouter.get('/me/experiences', requireAuth, requireRole(['business_owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const businesses = dbAll<CulturalBusiness>('SELECT id FROM cultural_businesses WHERE owner_id = ?', [req.user!.id]);
  if (!businesses.length) {
    return res.json({ experiences: [] });
  }

  const businessIds = businesses.map((b) => b.id).join(',');
  const experiences = dbAll<Experience>(`SELECT * FROM experiences WHERE business_id IN (${businessIds})`);

  const parsed = experiences.map((e) => ({
    ...e,
    includes: typeof e.includes === 'string' ? JSON.parse(e.includes) : e.includes,
  }));

  return res.json({ experiences: parsed });
});

// Business Owner: Create Experience
experiencesRouter.post('/', requireAuth, requireRole(['business_owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const {
    business_id,
    title,
    slug,
    description,
    category,
    region_code = 'KA',
    district,
    locality,
    duration_hours,
    price_per_person,
    max_group_size,
    includes,
    primary_image,
  } = req.body;

  if (!title || !slug || !price_per_person) {
    return res.status(400).json({ error: 'Title, slug, and price per person are required.' });
  }

  try {
    // Find or create business for user
    let businessId = business_id;
    if (!businessId) {
      const existingBiz = dbGet<CulturalBusiness>('SELECT id FROM cultural_businesses WHERE owner_id = ?', [req.user!.id]);
      if (existingBiz) {
        businessId = existingBiz.id;
      } else {
        const newBiz = dbRun(
          `INSERT INTO cultural_businesses (owner_id, business_name, category, description, region_code, district, locality, address, contact_phone, verified)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            req.user!.id,
            `${req.user!.full_name}'s Cultural Experiences`,
            category || 'Heritage & Craft',
            'Authentic local community experiences',
            region_code,
            district || 'Mysuru',
            locality || 'Heritage Zone',
            'Main Bazaar',
            '9876543210',
          ]
        );
        businessId = Number(newBiz.lastInsertRowid);
      }
    }

    const result = dbRun(
      `INSERT INTO experiences (
        business_id, title, slug, description, category, region_code,
        district, locality, duration_hours, price_per_person,
        max_group_size, includes, primary_image, verified, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
      [
        businessId,
        title,
        slug,
        description,
        category || 'Cultural Walk',
        region_code,
        district || 'Mysuru',
        locality || district,
        duration_hours || 2,
        price_per_person,
        max_group_size || 8,
        JSON.stringify(includes || ['Local Guide', 'Tasting & Materials', 'Certificate of Participation']),
        primary_image || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
      ]
    );

    AuditService.log(req.user!.id, 'experience_created', 'experience', Number(result.lastInsertRowid), `Created experience: ${title}`);

    return res.status(201).json({
      message: 'Experience submitted successfully. Will be publicly bookable once approved.',
      experienceId: Number(result.lastInsertRowid),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Business Owner: Received Bookings
experiencesRouter.get('/me/bookings', requireAuth, requireRole(['business_owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const bookings = dbAll<Booking>(
    `SELECT b.*, e.title as item_title, u.full_name as user_name, u.email as user_email, u.phone as user_phone,
            p.status as payment_status, p.payment_provider
     FROM bookings b
     JOIN experiences e ON b.item_id = e.id
     JOIN cultural_businesses c ON e.business_id = c.id
     JOIN users u ON b.user_id = u.id
     LEFT JOIN payments p ON b.id = p.booking_id
     WHERE b.booking_type = 'experience' AND c.owner_id = ?
     ORDER BY b.start_date DESC`,
    [req.user!.id]
  );

  return res.json({ bookings });
});
