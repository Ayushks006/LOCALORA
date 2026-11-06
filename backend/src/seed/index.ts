import bcrypt from 'bcryptjs';
import { getDatabase, dbRun, dbGet } from '../database/index.js';
import { karnatakaDestinations } from './destinationData.js';
import { additionalGuides, additionalHomestays } from './providersData.js';

export async function runSeed(reset = false, options: { enableTestCredentials?: boolean } = {}) {
  const db = getDatabase();
  const isTestMode = process.env.NODE_ENV === 'test' || options.enableTestCredentials === true;

  console.log('\x1b[34m%s\x1b[0m', '--- Starting LOCALORA Database Seeding ---');

  if (reset) {
    console.log('Resetting existing database records...');
    db.exec('PRAGMA foreign_keys = OFF;');
    db.exec(`
      DELETE FROM audit_logs;
      DELETE FROM notifications;
      DELETE FROM itinerary_items;
      DELETE FROM itineraries;
      DELETE FROM saved_destinations;
      DELETE FROM community_submissions;
      DELETE FROM reviews;
      DELETE FROM payments;
      DELETE FROM booking_status_history;
      DELETE FROM bookings;
      DELETE FROM experiences;
      DELETE FROM cultural_businesses;
      DELETE FROM homestay_rooms;
      DELETE FROM homestays;
      DELETE FROM guide_profiles;
      DELETE FROM destination_images;
      DELETE FROM destination_attractions;
      DELETE FROM destinations;
      DELETE FROM categories;
      DELETE FROM regions;
      DELETE FROM users;
    `);
    db.exec('PRAGMA foreign_keys = ON;');
  }

  // 1. Seed Regions (Architecture designed for all Indian states)
  const regions = [
    { code: 'KA', name: 'Karnataka', country: 'India', is_active: 1 },
    { code: 'KL', name: 'Kerala', country: 'India', is_active: 1 },
    { code: 'GA', name: 'Goa', country: 'India', is_active: 1 },
    { code: 'TN', name: 'Tamil Nadu', country: 'India', is_active: 1 },
    { code: 'MH', name: 'Maharashtra', country: 'India', is_active: 1 },
  ];

  for (const r of regions) {
    const existing = dbGet('SELECT code FROM regions WHERE code = ?', [r.code]);
    if (!existing) {
      dbRun('INSERT INTO regions (code, name, country, is_active) VALUES (?, ?, ?, ?)', [
        r.code,
        r.name,
        r.country,
        r.is_active,
      ]);
    }
  }

  // 2. Seed Categories
  const categories = [
    { slug: 'heritage', name: 'Heritage & History', description: 'Ancient empires, monolithic stone temples, and royal palaces', icon: 'Landmark' },
    { slug: 'hills-nature', name: 'Hills & Nature', description: 'Misty peaks, coffee valleys, and pristine Western Ghats ridges', icon: 'Mountain' },
    { slug: 'wildlife', name: 'Wildlife & Sanctuaries', description: 'Tiger reserves, wild elephant corridors, and endemic bird colonies', icon: 'Trees' },
    { slug: 'coastal', name: 'Beaches & Coastal', description: 'Arabian Sea coastlines, geological islands, and tranquil shores', icon: 'Waves' },
    { slug: 'waterfalls', name: 'Waterfalls & Gorges', description: 'Plunging river cascades and deep forest canyons', icon: 'Droplets' },
    { slug: 'spiritual', name: 'Spiritual Destinations', description: 'Centuries-old pilgrimage centers, mutts, and sacred rivers', icon: 'Sun' },
    { slug: 'culture-cities', name: 'Culture & Cities', description: 'Botanical parks, vibrant bazaars, and traditional festivals like Mysuru Dasara', icon: 'Sparkles' },
  ];

  for (const c of categories) {
    const existing = dbGet('SELECT slug FROM categories WHERE slug = ?', [c.slug]);
    if (!existing) {
      dbRun('INSERT INTO categories (slug, name, description, icon) VALUES (?, ?, ?, ?)', [
        c.slug,
        c.name,
        c.description,
        c.icon,
      ]);
    }
  }

  // 3. Seed Authentic Destinations
  for (const dest of karnatakaDestinations) {
    let destRow = dbGet<{ id: number }>('SELECT id FROM destinations WHERE slug = ?', [dest.slug]);
    let destId: number;

    if (!destRow) {
      const res = dbRun(
        `INSERT INTO destinations (
          name, slug, region_code, district, locality, category_slug,
          description, long_description, latitude, longitude,
          best_time_to_visit, suggested_duration, travel_tips,
          primary_image, is_verified, is_featured, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'))`,
        [
          dest.name,
          dest.slug,
          dest.region_code,
          dest.district,
          dest.locality,
          dest.category_slug,
          dest.description,
          dest.long_description,
          dest.latitude,
          dest.longitude,
          dest.best_time_to_visit,
          dest.suggested_duration,
          dest.travel_tips,
          dest.primary_image,
          dest.is_featured,
        ]
      );
      destId = Number(res.lastInsertRowid);
    } else {
      destId = destRow.id;
      dbRun(
        `UPDATE destinations SET
          name = ?, region_code = ?, district = ?, locality = ?, category_slug = ?,
          description = ?, long_description = ?, latitude = ?, longitude = ?,
          best_time_to_visit = ?, suggested_duration = ?, travel_tips = ?,
          primary_image = ?, is_featured = ?
        WHERE id = ?`,
        [
          dest.name,
          dest.region_code,
          dest.district,
          dest.locality,
          dest.category_slug,
          dest.description,
          dest.long_description,
          dest.latitude,
          dest.longitude,
          dest.best_time_to_visit,
          dest.suggested_duration,
          dest.travel_tips,
          dest.primary_image,
          dest.is_featured,
          destId,
        ]
      );
      // Clean previous attractions & images to ensure fresh, authentic records
      dbRun('DELETE FROM destination_attractions WHERE destination_id = ?', [destId]);
      dbRun('DELETE FROM destination_images WHERE destination_id = ?', [destId]);
    }

    // Seed Attractions
    for (const a of dest.attractions) {
      dbRun(
        'INSERT INTO destination_attractions (destination_id, title, description, image_url) VALUES (?, ?, ?, ?)',
        [destId, a.title, a.description, a.image_url]
      );
    }

    // Seed Image Manifest with Attribution, sort_order, is_cover, and alt_text
    let order = 1;
    for (const img of dest.images) {
      dbRun(
        'INSERT INTO destination_images (destination_id, url, caption, attribution, license, sort_order, is_cover, alt_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          destId,
          img.url,
          img.caption,
          img.attribution,
          img.license,
          img.sort_order ?? order,
          img.is_cover ?? (order === 1 ? 1 : 0),
          img.alt_text ?? img.caption,
        ]
      );
      order++;
    }
  }

  // 4. Seed Users (Listing owners & Admin)
  // In test mode, allow known credentials for automated suite execution.
  // In standard mode, listing accounts have disabled/unusable password hashes to prevent public login abuse.
  const testPasswordHash = isTestMode ? await bcrypt.hash('Localora@2026', 10) : null;
  const lockedHash = '!LOCKED_SEED_RECORD_' + Math.random().toString(36).substring(2);

  const usersToSeed = [
    {
      email: 'admin@localora.in',
      full_name: 'Localora Admin Team',
      role: 'admin',
      phone: '+91 98765 00001',
      avatar_url: '/images/guides/basavaraj-naik.jpg',
      bio: 'Editorial & Platform Administrator for Karnataka Smart Tourism Portal.',
      city: 'Bengaluru',
      preferred_language: 'English',
    },
    {
      email: 'ayush.tourist@example.com',
      full_name: 'Ayush Kumar Sah',
      role: 'tourist',
      phone: '+91 98765 00002',
      avatar_url: '/images/guides/manjunath-swamy.jpg',
      bio: 'Explorer, travel blogger, and heritage enthusiast documenting Karnataka architecture and sacred trails.',
      city: 'Bengaluru',
      preferred_language: 'English',
    },
    {
      email: 'raghu.guide@example.com',
      full_name: 'Raghavendra Rao',
      role: 'guide',
      phone: '+91 98765 00003',
      avatar_url: '/images/guides/raghavendra-rao.jpg',
      bio: 'Certified senior archaeological guide for Vijayanagara empire ruins at Hampi.',
      city: 'Hampi, Vijayanagara',
      preferred_language: 'Kannada',
    },
    {
      email: 'priya.homestay@example.com',
      full_name: 'Priya Hegde',
      role: 'homestay_owner',
      phone: '+91 98765 00004',
      avatar_url: null,
      bio: 'Coffee estate planter and homestay host dedicated to sustainable rural hospitality in Coorg.',
      city: 'Madikeri, Kodagu',
      preferred_language: 'Kannada',
    },
    {
      email: 'kavita.crafts@example.com',
      full_name: 'Kavita Somanna',
      role: 'business_owner',
      phone: '+91 98765 00005',
      avatar_url: null,
      bio: 'Master artisan patron preserving GI-tagged Mysore silk weaving and traditional rosewood inlay handicrafts.',
      city: 'Mysuru',
      preferred_language: 'Kannada',
    },
  ];

  const userIds: Record<string, number> = {};

  for (const u of usersToSeed) {
    let existing = dbGet<{ id: number; password_hash: string }>('SELECT id, password_hash FROM users WHERE email = ?', [u.email]);
    if (!existing) {
      let pwdHash: string;
      if (u.role === 'admin') {
        if (isTestMode) {
          pwdHash = testPasswordHash!;
        } else if (process.env.ADMIN_INITIAL_PASSWORD) {
          pwdHash = await bcrypt.hash(process.env.ADMIN_INITIAL_PASSWORD, 10);
        } else {
          pwdHash = lockedHash;
        }
      } else {
        pwdHash = isTestMode ? testPasswordHash! : lockedHash;
      }

      const res = dbRun(
        `INSERT INTO users (email, password_hash, full_name, phone, role, avatar_url, bio, city, preferred_language, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
        [u.email, pwdHash, u.full_name, u.phone, u.role, u.avatar_url ?? null, u.bio, u.city, u.preferred_language]
      );
      userIds[u.role] = Number(res.lastInsertRowid);
    } else {
      userIds[u.role] = existing.id;
      dbRun(
        `UPDATE users SET full_name = ?, phone = ?, avatar_url = ?, bio = ?, city = ?, preferred_language = ? WHERE id = ?`,
        [u.full_name, u.phone, u.avatar_url ?? null, u.bio, u.city, u.preferred_language, existing.id]
      );
      if (isTestMode && testPasswordHash) {
        dbRun('UPDATE users SET password_hash = ? WHERE id = ?', [testPasswordHash, existing.id]);
      }
    }
  }

  const getOrCreateUser = async (email: string, fullName: string, phone: string, role: string): Promise<number> => {
    let existing = dbGet<{ id: number; password_hash: string }>('SELECT id, password_hash FROM users WHERE email = ?', [email]);
    if (!existing) {
      const pwdHash = isTestMode ? testPasswordHash! : lockedHash;
      const res = dbRun(
        `INSERT INTO users (email, password_hash, full_name, phone, role, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
        [email, pwdHash, fullName, phone, role]
      );
      return Number(res.lastInsertRowid);
    } else {
      if (isTestMode && testPasswordHash) {
        dbRun('UPDATE users SET password_hash = ? WHERE id = ?', [testPasswordHash, existing.id]);
      }
      return existing.id;
    }
  };

  // 5. Seed Guide Profiles
  if (userIds['guide']) {
    const existingGuide = dbGet('SELECT id FROM guide_profiles WHERE user_id = ?', [userIds['guide']]);
    if (!existingGuide) {
      dbRun(
        `INSERT INTO guide_profiles (
          user_id, service_area, district, languages, years_experience,
          bio, pricing_per_day, pricing_unit, verified, profile_image,
          rating_avg, reviews_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'per day', 1, ?, 4.9, 18)`,
        [
          userIds['guide'],
          'Vijayanagara & Hampi Ruins',
          'Vijayanagara',
          JSON.stringify(['English', 'Kannada', 'Hindi']),
          8,
          'Licensed Archaeological Survey of India (ASI) certified guide specializing in Vijayanagara epigraphy, temple architecture, and boulder trail hiking.',
          2200,
          '/images/guides/raghavendra-rao.jpg',
        ]
      );
    } else {
      dbRun(
        `UPDATE guide_profiles SET
          service_area = ?, district = ?, languages = ?, years_experience = ?,
          bio = ?, pricing_per_day = ?, profile_image = ?
        WHERE user_id = ?`,
        [
          'Vijayanagara & Hampi Ruins',
          'Vijayanagara',
          JSON.stringify(['English', 'Kannada', 'Hindi']),
          8,
          'Licensed Archaeological Survey of India (ASI) certified guide specializing in Vijayanagara epigraphy, temple architecture, and boulder trail hiking.',
          2200,
          '/images/guides/raghavendra-rao.jpg',
          userIds['guide'],
        ]
      );
    }
    dbRun(`UPDATE users SET avatar_url = ? WHERE id = ?`, ['/images/guides/raghavendra-rao.jpg', userIds['guide']]);
  }

  for (const g of additionalGuides) {
    const guideUserId = await getOrCreateUser(g.email, g.full_name, g.phone, 'guide');
    const existingGuide = dbGet('SELECT id FROM guide_profiles WHERE user_id = ?', [guideUserId]);
    if (!existingGuide) {
      dbRun(
        `INSERT INTO guide_profiles (
          user_id, service_area, district, languages, years_experience,
          bio, pricing_per_day, pricing_unit, verified, profile_image,
          rating_avg, reviews_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'per day', 1, ?, ?, ?)`,
        [
          guideUserId,
          g.service_area,
          g.district,
          JSON.stringify(g.languages),
          g.years_experience,
          g.bio,
          g.pricing_per_day,
          g.profile_image,
          g.rating_avg,
          g.reviews_count,
        ]
      );
    } else {
      dbRun(
        `UPDATE guide_profiles SET
          service_area = ?, district = ?, languages = ?, years_experience = ?,
          bio = ?, pricing_per_day = ?, profile_image = ?, rating_avg = ?, reviews_count = ?
        WHERE user_id = ?`,
        [
          g.service_area,
          g.district,
          JSON.stringify(g.languages),
          g.years_experience,
          g.bio,
          g.pricing_per_day,
          g.profile_image,
          g.rating_avg,
          g.reviews_count,
          guideUserId,
        ]
      );
    }
    dbRun(`UPDATE users SET avatar_url = ? WHERE id = ?`, [g.profile_image, guideUserId]);
  }

  // 6. Seed Homestays
  let homestayId: number = 1;
  if (userIds['homestay_owner']) {
    const existingHomestay = dbGet<{ id: number }>('SELECT id FROM homestays WHERE slug = ?', ['mandalpatti-mist-plantation-stay']);
    if (!existingHomestay) {
      const hRes = dbRun(
        `INSERT INTO homestays (
          owner_id, title, slug, region_code, district, locality, address,
          description, property_type, max_guests, bedrooms, bathrooms,
          price_per_night, amenities, rules, check_in_time, check_out_time,
          latitude, longitude, primary_image, verified, rating_avg, reviews_count, created_at
        ) VALUES (?, ?, ?, 'KA', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '01:00 PM', '11:00 AM', ?, ?, ?, 1, 4.9, 24, datetime('now'))`,
        [
          userIds['homestay_owner'],
          'Mandalpatti Mist Estate Stay',
          'mandalpatti-mist-plantation-stay',
          'Kodagu',
          'Madikeri',
          'Estate Road 4, Near Mandalpatti Peak Viewpoint, Madikeri',
          'Serene 40-acre organic Arabica and Robusta coffee estate nestled in the Western Ghats. Enjoy home-cooked Kodava pandi curry (or vegetarian traditional spread), guided plantation morning walks, birdwatching, and campfire evenings under starry skies.',
          'Plantation Bungalow',
          6,
          3,
          3,
          4200,
          JSON.stringify(['Free Estate Wi-Fi', 'Authentic Kodava Meals', 'Guided Plantation Tour', 'Campfire & BBQ', 'Hot Water 24/7', 'Power Backup']),
          'No loud music past 10 PM. Smoking allowed in designated outdoor zones only. Pets welcome with prior notice.',
          12.4244,
          75.7382,
          '/images/homestays/mandalpatti-mist-plantation-stay/images.jpg',
        ]
      );
      homestayId = Number(hRes.lastInsertRowid);

      // Add rooms
      dbRun('INSERT INTO homestay_rooms (homestay_id, room_name, capacity, price_per_night, description) VALUES (?, ?, ?, ?, ?)', [
        homestayId,
        'Estate Master Suite',
        2,
        4200,
        'Spacious room with king bed and balcony overlooking the coffee gardens.',
      ]);
      dbRun('INSERT INTO homestay_rooms (homestay_id, room_name, capacity, price_per_night, description) VALUES (?, ?, ?, ?, ?)', [
        homestayId,
        'Garden Valley Cottage',
        4,
        6500,
        'Two-bedroom interconnected family cottage with private porch.',
      ]);
    } else {
      homestayId = existingHomestay.id;
      dbRun('UPDATE homestays SET primary_image = ? WHERE id = ?', [
        '/images/homestays/mandalpatti-mist-plantation-stay/images.jpg',
        homestayId,
      ]);
    }
  }

  for (const h of additionalHomestays) {
    const ownerUserId = await getOrCreateUser(h.owner_email, h.owner_name, h.owner_phone, 'homestay_owner');
    const existingHomestay = dbGet<{ id: number }>('SELECT id FROM homestays WHERE slug = ?', [h.slug]);
    let currHomestayId: number;
    if (!existingHomestay) {
      const hRes = dbRun(
        `INSERT INTO homestays (
          owner_id, title, slug, region_code, district, locality, address,
          description, property_type, max_guests, bedrooms, bathrooms,
          price_per_night, amenities, rules, check_in_time, check_out_time,
          latitude, longitude, primary_image, verified, rating_avg, reviews_count, created_at
        ) VALUES (?, ?, ?, 'KA', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '01:00 PM', '11:00 AM', ?, ?, ?, 1, ?, ?, datetime('now'))`,
        [
          ownerUserId,
          h.title,
          h.slug,
          h.district,
          h.locality,
          h.address,
          h.description,
          h.property_type,
          h.max_guests,
          h.bedrooms,
          h.bathrooms,
          h.price_per_night,
          JSON.stringify(h.amenities),
          h.rules,
          h.latitude,
          h.longitude,
          h.primary_image,
          h.rating_avg,
          h.reviews_count,
        ]
      );
      currHomestayId = Number(hRes.lastInsertRowid);
      for (const r of h.rooms) {
        dbRun('INSERT INTO homestay_rooms (homestay_id, room_name, capacity, price_per_night, description) VALUES (?, ?, ?, ?, ?)', [
          currHomestayId,
          r.name,
          r.capacity,
          r.price,
          r.description,
        ]);
      }
    } else {
      dbRun('UPDATE homestays SET primary_image = ? WHERE id = ?', [h.primary_image, existingHomestay.id]);
    }
  }

  // 7. Seed Cultural Experiences
  let expId: number = 1;
  if (userIds['business_owner']) {
    let biz = dbGet<{ id: number }>('SELECT id FROM cultural_businesses WHERE owner_id = ?', [userIds['business_owner']]);
    let bizId: number;
    if (!biz) {
      const bRes = dbRun(
        `INSERT INTO cultural_businesses (owner_id, business_name, category, description, region_code, district, locality, address, contact_phone, verified, created_at)
         VALUES (?, ?, ?, ?, 'KA', 'Mysuru', 'Sayyaji Rao Road', 'Heritage Arts Enclave, Mysuru', '+91 98765 00005', 1, datetime('now'))`,
        [
          userIds['business_owner'],
          'Heritage Mysuru Artisans Guild',
          'Traditional Arts & Wood Inlay',
          'Promoting authentic sandalwood carving, rosewood inlay work, and GI-tagged Mysore silk traditions for over three decades.',
        ]
      );
      bizId = Number(bRes.lastInsertRowid);
    } else {
      bizId = biz.id;
    }

    const existingExp = dbGet<{ id: number }>('SELECT id FROM experiences WHERE slug = ?', ['mysuru-rosewood-inlay-masterclass']);
    if (!existingExp) {
      const eRes = dbRun(
        `INSERT INTO experiences (
          business_id, title, slug, description, category, region_code,
          district, locality, duration_hours, price_per_person,
          max_group_size, includes, primary_image, verified, rating_avg, reviews_count, created_at
        ) VALUES (?, ?, ?, ?, ?, 'KA', 'Mysuru', 'Sayyaji Rao Road', 3.5, 1200, 8, ?, ?, 1, 4.8, 14, datetime('now'))`,
        [
          bizId,
          'Mysuru Rosewood Inlay & Silk Workshop',
          'mysuru-rosewood-inlay-masterclass',
          'Hands-on workshop guided by state award-winning artisans. Learn how geometric wood veneers and mother-of-pearl are carved and inlaid to create legendary Mysore art pieces, followed by a tea tasting and take-home souvenir crafted by yourself.',
          'Artisanal Workshop',
          JSON.stringify(['All Woodworking Materials & Tools', 'Expert Artisan Mentorship', 'Fresh Mysuru Filter Coffee & Snacks', 'Crafted Keepsake Souvenir']),
          'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
        ]
      );
      expId = Number(eRes.lastInsertRowid);
    } else {
      expId = existingExp.id;
    }
  }

  // 8. Seed Verified Sample Reviews
  if (userIds['tourist']) {
    const existingReview = dbGet("SELECT id FROM reviews WHERE user_id = ? AND target_type = 'homestay'", [userIds['tourist']]);
    if (!existingReview) {
      dbRun(
        `INSERT INTO reviews (user_id, target_type, target_id, rating, comment, is_moderated, is_approved, created_at)
         VALUES (?, 'homestay', ?, 5, 'An unforgettable stay in Coorg. The coffee aroma in the morning and Priya’s homemade Akki Roti with bamboo shoot curry were exceptional!', 1, 1, datetime('now'))`,
        [userIds['tourist'], homestayId]
      );
    }

    // Seed Saved Destination
    const hampiDest = dbGet<{ id: number }>("SELECT id FROM destinations WHERE slug = 'hampi'");
    if (hampiDest) {
      const savedExists = dbGet('SELECT id FROM saved_destinations WHERE user_id = ? AND destination_id = ?', [
        userIds['tourist'],
        hampiDest.id,
      ]);
      if (!savedExists) {
        dbRun('INSERT INTO saved_destinations (user_id, destination_id) VALUES (?, ?)', [
          userIds['tourist'],
          hampiDest.id,
        ]);
      }
    }

    // Seed Sample Tourist Booking
    const existingBooking = dbGet<{ id: number }>('SELECT id FROM bookings WHERE user_id = ?', [userIds['tourist']]);
    if (!existingBooking) {
      const room = dbGet<{ id: number }>('SELECT id FROM homestay_rooms WHERE homestay_id = ?', [homestayId]);
      const roomId = room ? room.id : null;

      const bRes = dbRun(
        `INSERT INTO bookings (
          reference_number, user_id, booking_type, item_id, room_id,
          start_date, end_date, guests_count, unit_price,
          total_nights_or_days, total_amount, currency, status, notes,
          created_at, updated_at
        ) VALUES ('LOC-20261015-SAMPLE', ?, 'homestay', ?, ?, '2026-11-10', '2026-11-13', 2, 4200, 3, 12600, 'INR', 'confirmed', 'Arriving by car around 2 PM.', datetime('now'), datetime('now'))`,
        [userIds['tourist'], homestayId, roomId]
      );

      const bId = Number(bRes.lastInsertRowid);

      // Status history
      dbRun(
        `INSERT INTO booking_status_history (booking_id, from_status, to_status, changed_by_user_id, notes, created_at)
         VALUES (?, 'pending', 'confirmed', ?, 'Host accepted reservation.', datetime('now'))`,
        [bId, userIds['homestay_owner']]
      );

      // Completed payment record (simulated)
      dbRun(
        `INSERT INTO payments (booking_id, amount, currency, status, payment_provider, transaction_id, created_at, updated_at)
         VALUES (?, 12600, 'INR', 'completed', 'demo', 'SIM_TXN_SEED_9999', datetime('now'), datetime('now'))`,
        [bId]
      );

      // Notification
      dbRun(
        `INSERT INTO notifications (user_id, type, title, message, link_url, is_read, created_at)
         VALUES (?, 'booking_confirmed', 'Reservation Confirmed! 🎉', 'Your stay at Mandalpatti Mist Estate Stay (LOC-20261015-SAMPLE) is confirmed for Nov 10-13, 2026.', '/dashboard/bookings/${bId}', 0, datetime('now'))`,
        [userIds['tourist']]
      );
    }
  }

  // 9. Seed Community Submission Queue
  const subExists = dbGet("SELECT id FROM community_submissions WHERE destination_name = 'Yana Rocks & Caves'");
  if (!subExists) {
    dbRun(
      `INSERT INTO community_submissions (
        contributor_name, contributor_email, destination_name, region_code,
        district, locality, category_slug, description, best_time,
        latitude, longitude, image_url, image_attribution, status, created_at
      ) VALUES (?, ?, ?, 'KA', 'Uttara Kannada', 'Kumta Forest', 'heritage', ?, 'October to February', 14.5900, 74.5600, ?, ?, 'pending', datetime('now'))`,
      [
        'Suresh Bhat',
        'suresh.bhat@example.com',
        'Yana Rocks & Caves',
        'Spectacular twin solid black crystalline karst rock monoliths (Bhairaveshwara Shikhara & Mohini Shikhara) rising 390 feet amidst deep evergreen Sahyadri forest.',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        'Wikimedia Commons / Subhashish Sahu',
      ]
    );
  }

  console.log('\x1b[32m%s\x1b[0m', '✓ LOCALORA database successfully seeded!');
  console.log('✓ Authentic Karnataka regional destinations and curated attractions loaded.');
  if (isTestMode) {
    console.log('ℹ Test mode enabled: Automated test credentials configured.');
  } else {
    console.log('✓ Public demo logins disabled for production security.');
    console.log('ℹ To configure or rotate an Administrator account, run:');
    console.log('    npm run bootstrap-admin -- --password "YourStrongPassword123!"');
  }
}

// Direct script execution
const scriptPath = process.argv[1]?.replace(/\\/g, '/') || '';
if (scriptPath.endsWith('seed/index.ts') || scriptPath.endsWith('seed/index.js')) {
  runSeed(process.argv.includes('--reset')).catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}
