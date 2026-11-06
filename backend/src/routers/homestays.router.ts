import { Router, Request, Response } from 'express';
import { dbAll, dbGet, dbRun } from '../database/index.js';
import { Homestay, HomestayRoom, Booking } from '../types/index.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { AuditService } from '../services/audit.service.js';

export const homestaysRouter = Router();

// List verified homestays
homestaysRouter.get('/', (req: Request, res: Response) => {
  const { district, property_type, max_price, guests, min_rating } = req.query;

  let sql = `
    SELECT h.*, u.full_name as owner_name
    FROM homestays h
    JOIN users u ON h.owner_id = u.id
    WHERE h.verified = 1 AND u.is_active = 1
  `;
  const params: any[] = [];

  if (district) {
    sql += ` AND (LOWER(h.district) = LOWER(?) OR LOWER(h.locality) = LOWER(?))`;
    params.push(district, district);
  }

  if (property_type) {
    sql += ` AND LOWER(h.property_type) = LOWER(?)`;
    params.push(property_type);
  }

  if (max_price) {
    sql += ` AND h.price_per_night <= ?`;
    params.push(Number(max_price));
  }

  if (guests) {
    sql += ` AND h.max_guests >= ?`;
    params.push(Number(guests));
  }

  if (min_rating) {
    sql += ` AND h.rating_avg >= ?`;
    params.push(Number(min_rating));
  }

  sql += ` ORDER BY h.rating_avg DESC, h.reviews_count DESC`;

  const homestays = dbAll<Homestay>(sql, params);
  const parsed = homestays.map((h) => ({
    ...h,
    amenities: typeof h.amenities === 'string' ? JSON.parse(h.amenities) : h.amenities,
  }));

  return res.json({ homestays: parsed });
});

// Single homestay by slug
homestaysRouter.get('/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const homestay = dbGet<Homestay>(
    `SELECT h.*, u.full_name as owner_name, u.phone as owner_phone
     FROM homestays h
     JOIN users u ON h.owner_id = u.id
     WHERE h.slug = ?`,
    [slug]
  );

  if (!homestay) {
    return res.status(404).json({ error: 'Homestay not found.' });
  }

  const rooms = dbAll<HomestayRoom>('SELECT * FROM homestay_rooms WHERE homestay_id = ?', [homestay.id]);

  const reviews = dbAll(
    `SELECT r.*, u.full_name as author_name 
     FROM reviews r 
     JOIN users u ON r.user_id = u.id 
     WHERE r.target_type = 'homestay' AND r.target_id = ? AND r.is_approved = 1
     ORDER BY r.created_at DESC LIMIT 20`,
    [homestay.id]
  );

  return res.json({
    homestay: {
      ...homestay,
      amenities: typeof homestay.amenities === 'string' ? JSON.parse(homestay.amenities) : homestay.amenities,
      rooms,
      reviews,
    },
  });
});

// Owner: My Listings
homestaysRouter.get('/me/listings', requireAuth, requireRole(['homestay_owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const listings = dbAll<Homestay>('SELECT * FROM homestays WHERE owner_id = ?', [req.user!.id]);
  const parsed = listings.map((h) => ({
    ...h,
    amenities: typeof h.amenities === 'string' ? JSON.parse(h.amenities) : h.amenities,
  }));
  return res.json({ listings: parsed });
});

// Owner: Register a new property
homestaysRouter.post('/', requireAuth, requireRole(['homestay_owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    slug,
    region_code = 'KA',
    district,
    locality,
    address,
    description,
    property_type,
    max_guests,
    bedrooms,
    bathrooms,
    price_per_night,
    amenities,
    rules,
    check_in_time,
    check_out_time,
    latitude,
    longitude,
    primary_image,
    rooms,
  } = req.body;

  if (!title || !slug || !district || !price_per_night) {
    return res.status(400).json({ error: 'Title, slug, district, and price per night are required.' });
  }

  try {
    const existingSlug = dbGet('SELECT id FROM homestays WHERE slug = ?', [slug]);
    if (existingSlug) {
      return res.status(400).json({ error: 'A listing with this URL identifier already exists.' });
    }

    const result = dbRun(
      `INSERT INTO homestays (
        owner_id, title, slug, region_code, district, locality, address,
        description, property_type, max_guests, bedrooms, bathrooms,
        price_per_night, amenities, rules, check_in_time, check_out_time,
        latitude, longitude, primary_image, verified, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
      [
        req.user!.id,
        title,
        slug,
        region_code,
        district,
        locality || district,
        address || `${locality}, ${district}`,
        description,
        property_type || 'Homestay Villa',
        max_guests || 4,
        bedrooms || 2,
        bathrooms || 2,
        price_per_night,
        JSON.stringify(amenities || ['Free Wi-Fi', 'Home Cooked Meals', 'Hot Water']),
        rules || 'Quiet hours after 10 PM. Please respect local culture.',
        check_in_time || '12:00 PM',
        check_out_time || '11:00 AM',
        latitude || 12.9716,
        longitude || 77.5946,
        primary_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      ]
    );

    const homestayId = Number(result.lastInsertRowid);

    // Add optional individual rooms
    if (Array.isArray(rooms) && rooms.length > 0) {
      for (const room of rooms) {
        dbRun(
          `INSERT INTO homestay_rooms (homestay_id, room_name, capacity, price_per_night, description)
           VALUES (?, ?, ?, ?, ?)`,
          [homestayId, room.room_name, room.capacity || 2, room.price_per_night || price_per_night, room.description || '']
        );
      }
    }

    AuditService.log(req.user!.id, 'homestay_registered', 'homestay', homestayId, `Submitted homestay: ${title} (pending admin approval)`);

    return res.status(201).json({
      message: 'Homestay submitted successfully. It will become bookable once approved by administrators.',
      homestayId,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Owner: Received Bookings
homestaysRouter.get('/me/bookings', requireAuth, requireRole(['homestay_owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const bookings = dbAll<Booking>(
    `SELECT b.*, h.title as item_title, u.full_name as user_name, u.email as user_email, u.phone as user_phone,
            p.status as payment_status, p.payment_provider, r.room_name
     FROM bookings b
     JOIN homestays h ON b.item_id = h.id
     JOIN users u ON b.user_id = u.id
     LEFT JOIN homestay_rooms r ON b.room_id = r.id
     LEFT JOIN payments p ON b.id = p.booking_id
     WHERE b.booking_type = 'homestay' AND h.owner_id = ?
     ORDER BY b.start_date DESC`,
    [req.user!.id]
  );

  return res.json({ bookings });
});
