import { Router, Request, Response } from 'express';
import { dbAll, dbGet, dbRun } from '../database/index.js';
import { Destination, Category, Region, DestinationAttraction, DestinationImage } from '../types/index.js';
import { requireAuth, requireRole, optionalAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { AuditService } from '../services/audit.service.js';

export const destinationsRouter = Router();

// Get categories
destinationsRouter.get('/categories', (_req: Request, res: Response) => {
  const categories = dbAll<Category>('SELECT * FROM categories ORDER BY name ASC');
  return res.json({ categories });
});

// Get regions
destinationsRouter.get('/regions', (_req: Request, res: Response) => {
  const regions = dbAll<Region>('SELECT * FROM regions WHERE is_active = 1 ORDER BY name ASC');
  return res.json({ regions });
});

// Get unique districts for filtering
destinationsRouter.get('/districts', (_req: Request, res: Response) => {
  const rows = dbAll<{ district: string }>(
    'SELECT DISTINCT district FROM destinations WHERE is_verified = 1 ORDER BY district ASC'
  );
  return res.json({ districts: rows.map((r) => r.district) });
});

// Search & list destinations
destinationsRouter.get('/', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { search, category, district, region = 'KA', featured } = req.query;

  let sql = `
    SELECT d.*, c.name as category_name, r.name as region_name
    FROM destinations d
    JOIN categories c ON d.category_slug = c.slug
    JOIN regions r ON d.region_code = r.code
    WHERE d.is_verified = 1
  `;
  const params: any[] = [];

  if (region) {
    sql += ` AND d.region_code = ?`;
    params.push(region);
  }

  if (category) {
    sql += ` AND d.category_slug = ?`;
    params.push(category);
  }

  if (district) {
    sql += ` AND LOWER(d.district) = LOWER(?)`;
    params.push(district);
  }

  if (featured === 'true' || featured === '1') {
    sql += ` AND d.is_featured = 1`;
  }

  if (search) {
    sql += ` AND (d.name LIKE ? OR d.description LIKE ? OR d.district LIKE ? OR d.locality LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  sql += ` ORDER BY d.is_featured DESC, d.name ASC`;

  const destinations = dbAll<Destination>(sql, params);

  // If user is authenticated, check saved status
  if (req.user) {
    const savedIds = new Set(
      dbAll<{ destination_id: number }>('SELECT destination_id FROM saved_destinations WHERE user_id = ?', [req.user.id]).map(
        (s) => s.destination_id
      )
    );
    const enriched = destinations.map((d) => ({
      ...d,
      is_saved: savedIds.has(d.id),
    }));
    return res.json({ destinations: enriched });
  }

  return res.json({ destinations });
});

// Get single destination by slug
destinationsRouter.get('/:slug', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { slug } = req.params;
  const destination = dbGet<Destination>(
    `SELECT d.*, c.name as category_name, r.name as region_name
     FROM destinations d
     JOIN categories c ON d.category_slug = c.slug
     JOIN regions r ON d.region_code = r.code
     WHERE d.slug = ?`,
    [slug]
  );

  if (!destination) {
    return res.status(404).json({ error: 'Destination not found.' });
  }

  const attractions = dbAll<DestinationAttraction>(
    'SELECT * FROM destination_attractions WHERE destination_id = ?',
    [destination.id]
  );

  const images = dbAll<DestinationImage>(
    'SELECT * FROM destination_images WHERE destination_id = ? ORDER BY sort_order ASC, id ASC',
    [destination.id]
  );

  // Associated Homestays nearby (same district)
  const nearbyHomestays = dbAll(
    `SELECT h.*, u.full_name as owner_name 
     FROM homestays h 
     JOIN users u ON h.owner_id = u.id 
     WHERE h.verified = 1 AND LOWER(h.district) = LOWER(?) 
     LIMIT 4`,
    [destination.district]
  );

  // Associated Guides nearby (same district or service area)
  const nearbyGuides = dbAll(
    `SELECT g.*, u.full_name, u.email 
     FROM guide_profiles g 
     JOIN users u ON g.user_id = u.id 
     WHERE g.verified = 1 AND (LOWER(g.district) = LOWER(?) OR g.service_area LIKE ?) 
     LIMIT 3`,
    [destination.district, `%${destination.district}%`]
  );

  // Associated Experiences
  const nearbyExperiences = dbAll(
    `SELECT e.*, c.business_name 
     FROM experiences e 
     JOIN cultural_businesses c ON e.business_id = c.id 
     WHERE e.verified = 1 AND LOWER(e.district) = LOWER(?) 
     LIMIT 3`,
    [destination.district]
  );

  let isSaved = false;
  if (req.user) {
    const saved = dbGet('SELECT id FROM saved_destinations WHERE user_id = ? AND destination_id = ?', [
      req.user.id,
      destination.id,
    ]);
    isSaved = !!saved;
  }

  return res.json({
    destination: {
      ...destination,
      attractions,
      images,
      nearbyHomestays,
      nearbyGuides,
      nearbyExperiences,
      is_saved: isSaved,
    },
  });
});

// Admin: Create official destination
destinationsRouter.post('/', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    slug,
    region_code,
    district,
    locality,
    category_slug,
    description,
    long_description,
    latitude,
    longitude,
    best_time_to_visit,
    suggested_duration,
    travel_tips,
    primary_image,
    is_featured = 0,
  } = req.body;

  if (!name || !slug || !region_code || !district || !category_slug) {
    return res.status(400).json({ error: 'Required fields: name, slug, region_code, district, category_slug' });
  }

  try {
    const result = dbRun(
      `INSERT INTO destinations (
        name, slug, region_code, district, locality, category_slug,
        description, long_description, latitude, longitude,
        best_time_to_visit, suggested_duration, travel_tips,
        primary_image, is_verified, is_featured, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'))`,
      [
        name,
        slug,
        region_code,
        district,
        locality || district,
        category_slug,
        description,
        long_description || description,
        latitude || 0,
        longitude || 0,
        best_time_to_visit || 'Year-round',
        suggested_duration || '1-2 Days',
        travel_tips || null,
        primary_image || 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80',
        is_featured ? 1 : 0,
      ]
    );

    AuditService.log(req.user!.id, 'destination_created', 'destination', Number(result.lastInsertRowid), `Created destination: ${name}`);

    return res.status(201).json({ message: 'Destination created.', id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
