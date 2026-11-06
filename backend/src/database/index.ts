import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dbDir = path.dirname(config.databasePath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbInstance = new DatabaseSync(config.databasePath);

  // Performance and integrity pragmas
  dbInstance.exec('PRAGMA foreign_keys = ON;');
  dbInstance.exec('PRAGMA journal_mode = WAL;');

  initSchema(dbInstance);

  return dbInstance;
}

export function initSchema(db: DatabaseSync) {
  db.exec(`
    -- Regions (scalable across all India)
    CREATE TABLE IF NOT EXISTS regions (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'India',
      is_active INTEGER NOT NULL DEFAULT 1
    );

    -- Destination Categories
    CREATE TABLE IF NOT EXISTS categories (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL
    );

    -- Users & Roles
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL CHECK(role IN ('tourist', 'guide', 'homestay_owner', 'business_owner', 'admin')),
      avatar_url TEXT,
      bio TEXT,
      city TEXT,
      preferred_language TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Destinations
    CREATE TABLE IF NOT EXISTS destinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      region_code TEXT NOT NULL REFERENCES regions(code),
      district TEXT NOT NULL,
      locality TEXT NOT NULL,
      category_slug TEXT NOT NULL REFERENCES categories(slug),
      description TEXT NOT NULL,
      long_description TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      best_time_to_visit TEXT NOT NULL,
      suggested_duration TEXT NOT NULL,
      travel_tips TEXT,
      primary_image TEXT NOT NULL,
      is_verified INTEGER NOT NULL DEFAULT 1,
      is_featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Destination Attractions
    CREATE TABLE IF NOT EXISTS destination_attractions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      destination_id INTEGER NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT NOT NULL
    );

    -- Destination Image Gallery & Manifest
    CREATE TABLE IF NOT EXISTS destination_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      destination_id INTEGER NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      caption TEXT NOT NULL,
      attribution TEXT NOT NULL,
      license TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_cover INTEGER NOT NULL DEFAULT 0,
      alt_text TEXT
    );

    -- Local Guides Profiles
    CREATE TABLE IF NOT EXISTS guide_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      service_area TEXT NOT NULL,
      district TEXT NOT NULL,
      languages TEXT NOT NULL, -- JSON array
      years_experience INTEGER NOT NULL DEFAULT 1,
      bio TEXT NOT NULL,
      pricing_per_day REAL NOT NULL DEFAULT 1500,
      pricing_unit TEXT NOT NULL DEFAULT 'per day',
      verified INTEGER NOT NULL DEFAULT 0,
      profile_image TEXT NOT NULL,
      rating_avg REAL NOT NULL DEFAULT 0,
      reviews_count INTEGER NOT NULL DEFAULT 0
    );

    -- Homestays
    CREATE TABLE IF NOT EXISTS homestays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      region_code TEXT NOT NULL REFERENCES regions(code),
      district TEXT NOT NULL,
      locality TEXT NOT NULL,
      address TEXT NOT NULL,
      description TEXT NOT NULL,
      property_type TEXT NOT NULL, -- 'Heritage Villa', 'Plantation Stay', 'Eco Cottage', etc.
      max_guests INTEGER NOT NULL DEFAULT 2,
      bedrooms INTEGER NOT NULL DEFAULT 1,
      bathrooms INTEGER NOT NULL DEFAULT 1,
      price_per_night REAL NOT NULL,
      amenities TEXT NOT NULL, -- JSON array
      rules TEXT NOT NULL,
      check_in_time TEXT NOT NULL DEFAULT '12:00 PM',
      check_out_time TEXT NOT NULL DEFAULT '11:00 AM',
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      primary_image TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      rating_avg REAL NOT NULL DEFAULT 0,
      reviews_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Homestay Separate Rooms
    CREATE TABLE IF NOT EXISTS homestay_rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      homestay_id INTEGER NOT NULL REFERENCES homestays(id) ON DELETE CASCADE,
      room_name TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 2,
      price_per_night REAL NOT NULL,
      description TEXT NOT NULL
    );

    -- Cultural Businesses
    CREATE TABLE IF NOT EXISTS cultural_businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      business_name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      region_code TEXT NOT NULL REFERENCES regions(code),
      district TEXT NOT NULL,
      locality TEXT NOT NULL,
      address TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Cultural Experiences
    CREATE TABLE IF NOT EXISTS experiences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL REFERENCES cultural_businesses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      region_code TEXT NOT NULL REFERENCES regions(code),
      district TEXT NOT NULL,
      locality TEXT NOT NULL,
      duration_hours REAL NOT NULL,
      price_per_person REAL NOT NULL,
      max_group_size INTEGER NOT NULL DEFAULT 10,
      includes TEXT NOT NULL, -- JSON array
      primary_image TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      rating_avg REAL NOT NULL DEFAULT 0,
      reviews_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Bookings (Transactions across Homestays, Guides, and Experiences)
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_number TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      booking_type TEXT NOT NULL CHECK(booking_type IN ('homestay', 'guide', 'experience')),
      item_id INTEGER NOT NULL,
      room_id INTEGER REFERENCES homestay_rooms(id) ON DELETE SET NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      guests_count INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      total_nights_or_days INTEGER NOT NULL DEFAULT 1,
      total_amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')),
      notes TEXT,
      cancellation_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Booking Status History
    CREATE TABLE IF NOT EXISTS booking_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      changed_by_user_id INTEGER REFERENCES users(id),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Payments (Decoupled lifecycle)
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed', 'refunded')),
      payment_provider TEXT NOT NULL CHECK(payment_provider IN ('razorpay', 'demo')),
      transaction_id TEXT,
      order_id TEXT,
      signature TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Reviews & Ratings
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
      target_type TEXT NOT NULL CHECK(target_type IN ('destination', 'homestay', 'guide', 'experience')),
      target_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      is_moderated INTEGER NOT NULL DEFAULT 0,
      is_approved INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Community Destination Submissions (Discover Hidden Gems)
    CREATE TABLE IF NOT EXISTS community_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contributor_name TEXT NOT NULL,
      contributor_email TEXT NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      destination_name TEXT NOT NULL,
      region_code TEXT NOT NULL REFERENCES regions(code),
      district TEXT NOT NULL,
      locality TEXT NOT NULL,
      category_slug TEXT NOT NULL REFERENCES categories(slug),
      description TEXT NOT NULL,
      best_time TEXT,
      latitude REAL,
      longitude REAL,
      image_url TEXT,
      image_attribution TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'needs_info', 'approved', 'rejected')),
      admin_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed_at TEXT
    );

    -- Saved Destinations
    CREATE TABLE IF NOT EXISTS saved_destinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      destination_id INTEGER NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, destination_id)
    );

    -- Itineraries
    CREATE TABLE IF NOT EXISTS itineraries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      start_date TEXT,
      end_date TEXT,
      is_public INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Itinerary Items
    CREATE TABLE IF NOT EXISTS itinerary_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itinerary_id INTEGER NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
      destination_id INTEGER NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
      day_number INTEGER NOT NULL DEFAULT 1,
      order_index INTEGER NOT NULL DEFAULT 0,
      notes TEXT
    );

    -- In-App Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link_url TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Administrative Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Indexes for fast query resolution
    CREATE INDEX IF NOT EXISTS idx_destinations_category ON destinations(category_slug);
    CREATE INDEX IF NOT EXISTS idx_destinations_region ON destinations(region_code);
    CREATE INDEX IF NOT EXISTS idx_destinations_district ON destinations(district);
    CREATE INDEX IF NOT EXISTS idx_homestays_region ON homestays(region_code);
    CREATE INDEX IF NOT EXISTS idx_homestays_district ON homestays(district);
    CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_item ON bookings(booking_type, item_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_type, target_id);
  `);

  // Safe schema migrations for destination_images
  try {
    db.exec('ALTER TABLE destination_images ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;');
  } catch (_) {}
  try {
    db.exec('ALTER TABLE destination_images ADD COLUMN is_cover INTEGER NOT NULL DEFAULT 0;');
  } catch (_) {}
  try {
    db.exec('ALTER TABLE destination_images ADD COLUMN alt_text TEXT;');
  } catch (_) {}

  // Safe schema migrations for users profile management
  try {
    db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT;');
  } catch (_) {}
  try {
    db.exec('ALTER TABLE users ADD COLUMN bio TEXT;');
  } catch (_) {}
  try {
    db.exec('ALTER TABLE users ADD COLUMN city TEXT;');
  } catch (_) {}
  try {
    db.exec('ALTER TABLE users ADD COLUMN preferred_language TEXT;');
  } catch (_) {}
}

// Database helper functions for safe parameterized execution
export function dbAll<T>(sql: string, params: any[] = []): T[] {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}

export function dbGet<T>(sql: string, params: any[] = []): T | undefined {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  return stmt.get(...params) as T | undefined;
}

export function dbRun(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number | bigint } {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  const result = stmt.run(...params);
  return {
    changes: Number(result.changes),
    lastInsertRowid: Number(result.lastInsertRowid),
  };
}
