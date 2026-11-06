import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../index.js';
import { runSeed } from '../seed/index.js';

describe('LOCALORA Comprehensive Test Suite', () => {
  let adminToken: string;
  let touristToken: string;
  let guideToken: string;
  let homestayHostToken: string;
  let touristId: number;
  let createdBookingId: number;

  before(async () => {
    // Reset and seed database for a clean test environment
    await runSeed(true, { enableTestCredentials: true });

    // Login Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@localora.in', password: 'Localora@2026' });
    assert.strictEqual(adminRes.status, 200);
    adminToken = adminRes.body.token;

    // Login Tourist
    const touristRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ayush.tourist@example.com', password: 'Localora@2026' });
    assert.strictEqual(touristRes.status, 200);
    touristToken = touristRes.body.token;
    touristId = touristRes.body.user.id;

    // Login Guide
    const guideRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'raghu.guide@example.com', password: 'Localora@2026' });
    assert.strictEqual(guideRes.status, 200);
    guideToken = guideRes.body.token;

    // Login Homestay Host
    const hostRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'priya.homestay@example.com', password: 'Localora@2026' });
    assert.strictEqual(hostRes.status, 200);
    homestayHostToken = hostRes.body.token;
  });

  // 1. AUTHENTICATION & ROLE-BASED ACCESS CONTROL
  describe('1. Authentication & Security', () => {
    test('Tourist registration succeeds with valid fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'new.traveler@example.com',
          password: 'Password123!',
          full_name: 'Ananya Sharma',
          role: 'tourist',
        });
      assert.strictEqual(res.status, 201);
      assert.ok(res.body.token);
      assert.strictEqual(res.body.user.role, 'tourist');
    });

    test('Block public self-registration with admin role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'fake.admin@example.com',
          password: 'Password123!',
          full_name: 'Hacker',
          role: 'admin',
        });
      assert.strictEqual(res.status, 403);
      assert.match(res.body.error, /cannot be registered publicly/i);
    });

    test('Login fails with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@localora.in', password: 'WrongPassword' });
      assert.strictEqual(res.status, 401);
    });

    test('Unauthorized access to protected endpoint without token is rejected', async () => {
      const res = await request(app).get('/api/admin/stats');
      assert.strictEqual(res.status, 401);
    });

    test('Tourist token cannot access admin endpoints (RBAC check)', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${touristToken}`);
      assert.strictEqual(res.status, 403);
    });

    test('Admin token can access admin stats successfully', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.stats.destinationsCount > 0);
    });

    test('User can retrieve detailed personal profile', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${touristToken}`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.user);
      assert.strictEqual(res.body.user.email, 'ayush.tourist@example.com');
    });

    test('User can update personal profile information', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({
          full_name: 'Ayush Kumar Sah Updated',
          city: 'Bengaluru',
          bio: 'Avid traveler and photography enthusiast discovering Karnataka heritage.',
          preferred_language: 'Kannada',
        });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.user.full_name, 'Ayush Kumar Sah Updated');
      assert.strictEqual(res.body.user.city, 'Bengaluru');
      assert.strictEqual(res.body.user.preferred_language, 'Kannada');
    });

    test('Reject security privilege escalation through profile update', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({
          full_name: 'Ayush Kumar Sah',
          role: 'admin', // Malicious attempt to escalate role
        });
      assert.strictEqual(res.status, 403);
      assert.match(res.body.error, /Changing user roles through profile update is prohibited/i);
    });

    test('User can upload a profile photo with valid image format verification', async () => {
      // 1x1 valid JPEG image encoded in base64 with ffd8ff magic bytes
      const validJpegBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
      const res = await request(app)
        .post('/api/auth/profile-photo')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({ image: validJpegBase64 });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.avatar_url);
      assert.match(res.body.avatar_url, /^\/uploads\/avatars\/avatar-user-/);
      assert.strictEqual(res.body.user.avatar_url, res.body.avatar_url);
    });

    test('Reject invalid profile photo with spoofed or corrupted data', async () => {
      const fakeImage = Buffer.from('NOT_AN_IMAGE_FILE').toString('base64');
      const res = await request(app)
        .post('/api/auth/profile-photo')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({ image: fakeImage });
      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /Only authentic image files/i);
    });
  });

  // 2. DESTINATION DISCOVERY
  describe('2. Destination Discovery', () => {
    test('List all published destinations', async () => {
      const res = await request(app).get('/api/destinations');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.destinations));
      assert.ok(res.body.destinations.length >= 10);
    });

    test('Filter destinations by category: heritage', async () => {
      const res = await request(app).get('/api/destinations?category=heritage');
      assert.strictEqual(res.status, 200);
      for (const dest of res.body.destinations) {
        assert.strictEqual(dest.category_slug, 'heritage');
      }
    });

    test('Search destinations by keyword: Hampi', async () => {
      const res = await request(app).get('/api/destinations?search=Hampi');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.destinations.some((d: any) => d.slug === 'hampi'));
    });

    test('Load single destination detail by slug with attractions and image gallery', async () => {
      const res = await request(app).get('/api/destinations/hampi');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.destination.slug, 'hampi');
      assert.ok(Array.isArray(res.body.destination.attractions));
      assert.ok(res.body.destination.attractions.length > 0);
      assert.ok(Array.isArray(res.body.destination.images));
    });

    test('Returns 404 for non-existent destination slug', async () => {
      const res = await request(app).get('/api/destinations/non-existent-place');
      assert.strictEqual(res.status, 404);
    });
  });

  // 3. HOMESTAY MARKETPLACE & DOUBLE-BOOKING PREVENTION
  describe('3. Homestay Booking & Concurrency Control', () => {
    let homestayId: number;

    test('Retrieve homestay listings and find Mandalpatti Mist', async () => {
      const res = await request(app).get('/api/homestays');
      assert.strictEqual(res.status, 200);
      const homestay = res.body.homestays.find((h: any) => h.slug === 'mandalpatti-mist-plantation-stay');
      assert.ok(homestay);
      homestayId = homestay.id;
    });

    test('Reject reservation if check-out date is not after check-in date', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({
          booking_type: 'homestay',
          item_id: homestayId,
          start_date: '2026-12-10',
          end_date: '2026-12-05',
          guests_count: 2,
        });
      assert.strictEqual(res.status, 400);
    });

    test('Reject reservation exceeding maximum guest capacity', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({
          booking_type: 'homestay',
          item_id: homestayId,
          start_date: '2026-12-10',
          end_date: '2026-12-15',
          guests_count: 20, // max is 6
        });
      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /exceeds maximum capacity/i);
    });

    test('Submit valid homestay booking request with automatic backend pricing calculation', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({
          booking_type: 'homestay',
          item_id: homestayId,
          start_date: '2026-12-20',
          end_date: '2026-12-23', // 3 nights @ 4200 = 12600
          guests_count: 2,
          notes: 'Family holiday',
        });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.booking.total_nights_or_days, 3);
      assert.strictEqual(res.body.booking.total_amount, 12600);
      assert.strictEqual(res.body.booking.status, 'pending');
      assert.ok(res.body.booking.reference_number.startsWith('LOC-'));
      createdBookingId = res.body.booking.id;
    });

    test('Prevent overlapping reservation for the same dates (Concurrency & Collision Protection)', async () => {
      // Attempting to book overlapping dates: Dec 21 to Dec 24
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({
          booking_type: 'homestay',
          item_id: homestayId,
          start_date: '2026-12-21',
          end_date: '2026-12-24',
          guests_count: 2,
        });
      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /conflict with existing reservation/i);
    });

    test('Host accepts the booking', async () => {
      const res = await request(app)
        .put(`/api/bookings/${createdBookingId}/status`)
        .set('Authorization', `Bearer ${homestayHostToken}`)
        .send({ status: 'confirmed', reason: 'Welcome to Coorg!' });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.booking.status, 'confirmed');
    });

    test('Unauthorized user cannot modify or cancel someone else booking', async () => {
      // Create another tourist
      const newTouristRes = await request(app)
        .post('/api/auth/register')
        .send({ email: 'other.traveler@example.com', password: 'Password123!', full_name: 'Stranger' });
      const otherToken = newTouristRes.body.token;

      const res = await request(app)
        .post(`/api/bookings/${createdBookingId}/cancel`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ reason: 'Malicious cancellation attempt' });
      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /unauthorized/i);
    });
  });

  // 4. GUIDE MARKETPLACE & BOOKINGS
  describe('4. Local Guide Marketplace', () => {
    let guideId: number;
    let guideBookingId: number;

    test('Discover verified guides', async () => {
      const res = await request(app).get('/api/guides');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.guides.length > 0);
      const guide = res.body.guides.find((g: any) => g.email === 'raghu.guide@example.com') || res.body.guides[0];
      guideId = guide.id;
    });

    test('Submit a guide booking request', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({
          booking_type: 'guide',
          item_id: guideId,
          start_date: '2026-11-20',
          end_date: '2026-11-21', // 2 days @ 2200 = 4400
          guests_count: 2,
          notes: 'Full day Hampi monument tour',
        });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.booking.total_amount, 4400);
      guideBookingId = res.body.booking.id;
    });

    test('Guide can accept incoming booking request', async () => {
      const res = await request(app)
        .put(`/api/bookings/${guideBookingId}/status`)
        .set('Authorization', `Bearer ${guideToken}`)
        .send({ status: 'confirmed' });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.booking.status, 'confirmed');
    });

    test('Guide rejects overlapping booking for occupied dates', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({
          booking_type: 'guide',
          item_id: guideId,
          start_date: '2026-11-20',
          end_date: '2026-11-20',
          guests_count: 1,
        });
      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /already booked/i);
    });
  });

  // 5. PAYMENT SERVICE & DEMO SIMULATION
  describe('5. Decoupled Payment Processing', () => {
    test('Simulate payment processing in demo mode', async () => {
      const simRes = await request(app)
        .post('/api/payments/simulate')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({ booking_id: createdBookingId, should_succeed: true });
      assert.strictEqual(simRes.status, 200);
      assert.strictEqual(simRes.body.payment.status, 'completed');
      assert.strictEqual(simRes.body.payment.payment_provider, 'demo');
      assert.ok(simRes.body.isSimulation);
    });
  });

  // 6. COMMUNITY SUBMISSIONS ("Discover Hidden Gems") & MODERATION
  describe('6. Community Hidden Gems & Editorial Moderation', () => {
    let submissionId: number;

    test('Submit a community destination suggestion', async () => {
      const res = await request(app)
        .post('/api/community/suggest')
        .send({
          contributor_name: 'Manjunath Gowda',
          contributor_email: 'manju@example.com',
          destination_name: 'Dodda Aalada Mara (Big Banyan Tree)',
          district: 'Bengaluru Urban',
          category_slug: 'hills-nature',
          description: 'A 400-year-old giant banyan tree spanning across 3 acres in Kethohalli.',
          best_time: 'October to May',
          latitude: 12.9200,
          longitude: 77.3900,
        });
      assert.strictEqual(res.status, 201);
      assert.ok(res.body.submissionId);
      submissionId = res.body.submissionId;
    });

    test('Unapproved community submission is NOT visible in public destinations', async () => {
      const res = await request(app).get('/api/destinations?search=Dodda+Aalada+Mara');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.destinations.length, 0);
    });

    test('Admin reviews and approves community submission, publishing it to public catalog', async () => {
      const modRes = await request(app)
        .put(`/api/admin/community/${submissionId}/moderate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'approved',
          admin_notes: 'Verified historical and ecological significance.',
          publish_as_destination: true,
        });
      assert.strictEqual(modRes.status, 200);

      // Now it must appear in public destinations catalog!
      const pubRes = await request(app).get('/api/destinations?search=Dodda+Aalada+Mara');
      assert.strictEqual(pubRes.status, 200);
      assert.strictEqual(pubRes.body.destinations.length, 1);
      assert.strictEqual(pubRes.body.destinations[0].name, 'Dodda Aalada Mara (Big Banyan Tree)');
    });
  });

  // 7. REVIEWS & RATINGS ELIGIBILITY
  describe('7. Reviews & Ratings', () => {
    test('Submit a verified review for a destination', async () => {
      const hampiRes = await request(app).get('/api/destinations/hampi');
      const hampiId = hampiRes.body.destination.id;

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({
          target_type: 'destination',
          target_id: hampiId,
          rating: 5,
          comment: 'Spectacular sunrise over Matanga Hill. A true wonder of Indian civilization.',
        });
      assert.strictEqual(res.status, 201);
      assert.ok(res.body.reviewId);
    });

    test('Reject review with invalid rating score', async () => {
      const hampiRes = await request(app).get('/api/destinations/hampi');
      const hampiId = hampiRes.body.destination.id;

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({
          target_type: 'destination',
          target_id: hampiId,
          rating: 7, // out of range 1-5
          comment: 'Invalid rating test',
        });
      assert.strictEqual(res.status, 400);
    });
  });

  // 8. NOTIFICATIONS & ITINERARIES
  describe('8. Notifications & Trip Planner', () => {
    test('Tourist receives persistent in-app notifications', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${touristToken}`);
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.notifications));
      assert.ok(res.body.notifications.length > 0);
    });

    test('Save and toggle saved destination', async () => {
      const mysuruRes = await request(app).get('/api/destinations/mysuru-palace');
      const mysuruId = mysuruRes.body.destination.id;

      const toggleRes = await request(app)
        .post('/api/itineraries/saved/toggle')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({ destination_id: mysuruId });
      assert.strictEqual(toggleRes.status, 200);
      assert.strictEqual(toggleRes.body.isSaved, true);

      const listRes = await request(app)
        .get('/api/itineraries/saved')
        .set('Authorization', `Bearer ${touristToken}`);
      assert.strictEqual(listRes.status, 200);
      assert.ok(listRes.body.savedDestinations.some((d: any) => d.id === mysuruId));
    });

    test('Create and retrieve custom tourist itinerary', async () => {
      const hampiRes = await request(app).get('/api/destinations/hampi');
      const hampiId = hampiRes.body.destination.id;

      const createRes = await request(app)
        .post('/api/itineraries')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({
          title: '3-Day Royal Karnataka Heritage Circuit',
          description: 'Exploring Mysore Palace and ancient Hoysala temples',
          start_date: '2026-12-01',
          end_date: '2026-12-04',
        });
      assert.strictEqual(createRes.status, 201);
      const itineraryId = createRes.body.itineraryId;

      // Add Hampi to Day 1
      const addRes = await request(app)
        .post(`/api/itineraries/${itineraryId}/items`)
        .set('Authorization', `Bearer ${touristToken}`)
        .send({
          destination_id: hampiId,
          day_number: 1,
          notes: 'Rent bicycle at sunrise and explore Virupaksha.',
        });
      assert.strictEqual(addRes.status, 201);

      // Fetch itinerary details
      const getRes = await request(app)
        .get(`/api/itineraries/${itineraryId}`)
        .set('Authorization', `Bearer ${touristToken}`);
      assert.strictEqual(getRes.status, 200);
      assert.strictEqual(getRes.body.itinerary.items.length, 1);
      assert.strictEqual(getRes.body.itinerary.items[0].destination_name, 'Hampi');
    });
  });

  after(() => {
    // Ensure test worker exits cleanly without hanging on internal handles
    setTimeout(() => process.exit(0), 100);
  });
});

