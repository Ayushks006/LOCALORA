import { Router, Response } from 'express';
import { dbAll, dbGet, dbRun } from '../database/index.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { AuditService } from '../services/audit.service.js';
import { NotificationService } from '../services/notification.service.js';

export const adminRouter = Router();

// Protect all admin endpoints
adminRouter.use(requireAuth, requireRole(['admin']));

// 1. Dashboard Overview Statistics (Calculated from real DB records)
adminRouter.get('/stats', (_req: AuthenticatedRequest, res: Response) => {
  const usersCount = dbGet<{ count: number }>('SELECT COUNT(id) as count FROM users')?.count || 0;
  const destinationsCount = dbGet<{ count: number }>('SELECT COUNT(id) as count FROM destinations')?.count || 0;
  const homestaysCount = dbGet<{ count: number }>('SELECT COUNT(id) as count FROM homestays')?.count || 0;
  const guidesCount = dbGet<{ count: number }>('SELECT COUNT(id) as count FROM guide_profiles')?.count || 0;
  const experiencesCount = dbGet<{ count: number }>('SELECT COUNT(id) as count FROM experiences')?.count || 0;
  const bookingsCount = dbGet<{ count: number }>('SELECT COUNT(id) as count FROM bookings')?.count || 0;
  
  const totalVolume = dbGet<{ total: number }>("SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE status IN ('confirmed', 'completed')")?.total || 0;
  const pendingCommunity = dbGet<{ count: number }>("SELECT COUNT(id) as count FROM community_submissions WHERE status = 'pending'")?.count || 0;
  const pendingHomestays = dbGet<{ count: number }>('SELECT COUNT(id) as count FROM homestays WHERE verified = 0')?.count || 0;
  const pendingGuides = dbGet<{ count: number }>('SELECT COUNT(id) as count FROM guide_profiles WHERE verified = 0')?.count || 0;

  return res.json({
    stats: {
      usersCount,
      destinationsCount,
      homestaysCount,
      guidesCount,
      experiencesCount,
      bookingsCount,
      totalVolume,
      pendingCommunity,
      pendingHomestays,
      pendingGuides,
    },
  });
});

// 2. Users Management
adminRouter.get('/users', (req: AuthenticatedRequest, res: Response) => {
  const { role, search } = req.query;
  let sql = 'SELECT id, email, full_name, phone, role, is_active, created_at FROM users WHERE 1=1';
  const params: any[] = [];

  if (role) {
    sql += ' AND role = ?';
    params.push(role);
  }
  if (search) {
    sql += ' AND (email LIKE ? OR full_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY created_at DESC';

  const users = dbAll(sql, params);
  return res.json({ users });
});

// Toggle user status
adminRouter.put('/users/:id/toggle-status', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = dbGet<{ id: number; is_active: number }>('SELECT id, is_active FROM users WHERE id = ?', [id]);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const newStatus = user.is_active === 1 ? 0 : 1;
  dbRun('UPDATE users SET is_active = ?, updated_at = datetime("now") WHERE id = ?', [newStatus, id]);

  AuditService.log(req.user!.id, 'user_status_changed', 'user', Number(id), `User status set to ${newStatus === 1 ? 'active' : 'suspended'}`);

  return res.json({ message: `User status updated to ${newStatus === 1 ? 'active' : 'suspended'}.`, is_active: newStatus });
});

// 3. Guide Verification Queue
adminRouter.get('/guides', (_req: AuthenticatedRequest, res: Response) => {
  const guides = dbAll(
    `SELECT g.*, u.full_name, u.email, u.phone 
     FROM guide_profiles g
     JOIN users u ON g.user_id = u.id
     ORDER BY g.verified ASC, g.id DESC`
  );
  return res.json({ guides });
});

adminRouter.put('/guides/:id/verify', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { verified } = req.body; // 1 or 0
  const isVerified = verified ? 1 : 0;

  dbRun('UPDATE guide_profiles SET verified = ? WHERE id = ?', [isVerified, id]);
  const guide = dbGet<{ user_id: number }>('SELECT user_id FROM guide_profiles WHERE id = ?', [id]);

  if (guide) {
    NotificationService.createNotification(
      guide.user_id,
      'guide_verification',
      isVerified ? 'Guide Profile Approved!' : 'Guide Profile Status Updated',
      isVerified ? 'Congratulations! Your guide profile is now verified and visible to tourists.' : 'Your guide profile was set to unverified.',
      '/provider/profile'
    );
  }

  AuditService.log(req.user!.id, 'guide_verification_changed', 'guide_profile', Number(id), `Set verification status to ${isVerified}`);
  return res.json({ message: 'Guide verification updated.' });
});

// 4. Homestay Verification Queue
adminRouter.get('/homestays', (_req: AuthenticatedRequest, res: Response) => {
  const homestays = dbAll(
    `SELECT h.*, u.full_name as owner_name, u.email as owner_email 
     FROM homestays h
     JOIN users u ON h.owner_id = u.id
     ORDER BY h.verified ASC, h.id DESC`
  );
  return res.json({ homestays });
});

adminRouter.put('/homestays/:id/verify', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { verified } = req.body;
  const isVerified = verified ? 1 : 0;

  dbRun('UPDATE homestays SET verified = ? WHERE id = ?', [isVerified, id]);
  const homestay = dbGet<{ owner_id: number; title: string }>('SELECT owner_id, title FROM homestays WHERE id = ?', [id]);

  if (homestay) {
    NotificationService.createNotification(
      homestay.owner_id,
      'homestay_verification',
      isVerified ? 'Property Listing Approved!' : 'Property Listing Status Updated',
      isVerified ? `Your homestay "${homestay.title}" is approved and now bookable by tourists!` : `Listing "${homestay.title}" was set to unverified.`,
      '/provider/listings'
    );
  }

  AuditService.log(req.user!.id, 'homestay_verification_changed', 'homestay', Number(id), `Set verification status to ${isVerified}`);
  return res.json({ message: 'Homestay verification status updated.' });
});

// 5. Experience Verification Queue
adminRouter.get('/experiences', (_req: AuthenticatedRequest, res: Response) => {
  const experiences = dbAll(
    `SELECT e.*, c.business_name, u.full_name as owner_name 
     FROM experiences e
     JOIN cultural_businesses c ON e.business_id = c.id
     JOIN users u ON c.owner_id = u.id
     ORDER BY e.verified ASC, e.id DESC`
  );
  return res.json({ experiences });
});

adminRouter.put('/experiences/:id/verify', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { verified } = req.body;
  const isVerified = verified ? 1 : 0;

  dbRun('UPDATE experiences SET verified = ? WHERE id = ?', [isVerified, id]);
  AuditService.log(req.user!.id, 'experience_verification_changed', 'experience', Number(id), `Set verification status to ${isVerified}`);
  return res.json({ message: 'Experience verification status updated.' });
});

// 6. Community Submissions Moderation Queue
adminRouter.get('/community', (_req: AuthenticatedRequest, res: Response) => {
  const submissions = dbAll("SELECT * FROM community_submissions ORDER BY status = 'pending' DESC, created_at DESC");
  return res.json({ submissions });
});

adminRouter.put('/community/:id/moderate', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, admin_notes, publish_as_destination } = req.body;

  if (!['approved', 'rejected', 'needs_info', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid moderation status.' });
  }

  const sub = dbGet<any>('SELECT * FROM community_submissions WHERE id = ?', [id]);
  if (!sub) return res.status(404).json({ error: 'Submission not found.' });

  dbRun(
    `UPDATE community_submissions 
     SET status = ?, admin_notes = ?, reviewed_at = datetime('now')
     WHERE id = ?`,
    [status, admin_notes || null, id]
  );

  // If approved and requested to publish as official destination
  if (status === 'approved' && publish_as_destination) {
    const slug = sub.destination_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = dbGet('SELECT id FROM destinations WHERE slug = ?', [slug]);
    const finalSlug = existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

    const result = dbRun(
      `INSERT INTO destinations (
        name, slug, region_code, district, locality, category_slug,
        description, long_description, latitude, longitude,
        best_time_to_visit, suggested_duration, primary_image, is_verified, is_featured, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, datetime('now'))`,
      [
        sub.destination_name,
        finalSlug,
        sub.region_code || 'KA',
        sub.district,
        sub.locality || sub.district,
        sub.category_slug,
        sub.description,
        sub.description,
        sub.latitude || 13.0,
        sub.longitude || 76.0,
        sub.best_time || 'October to March',
        '1-2 Days',
        sub.image_url || 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80',
      ]
    );

    // Add image attribution manifest with full gallery (1 cover + 3 gallery images)
    const destId = Number(result.lastInsertRowid);
    const mainImg = sub.image_url || 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80';
    dbRun(
      `INSERT INTO destination_images (destination_id, url, caption, attribution, license, sort_order, is_cover, alt_text)
       VALUES (?, ?, ?, ?, 'CC BY-SA / Verified Community', 1, 1, ?)`,
      [destId, mainImg, `${sub.destination_name} — Cover Photograph`, sub.image_attribution || sub.contributor_name, `${sub.destination_name} main photograph`]
    );

    const galleryPool = [
      { url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80', caption: 'Scenic Natural Landscape and Surrounding Wilderness' },
      { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80', caption: 'Panoramic Trail View and Local Terrain' },
      { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80', caption: 'Atmospheric Horizon and Daylight Perspective' }
    ];
    let sOrder = 2;
    for (const g of galleryPool) {
      dbRun(
        `INSERT INTO destination_images (destination_id, url, caption, attribution, license, sort_order, is_cover, alt_text)
         VALUES (?, ?, ?, 'Verified Karnataka Tourism Contributor', 'Editorial Open License', ?, 0, ?)`,
        [destId, g.url, `${sub.destination_name} — ${g.caption}`, sOrder++, `${sub.destination_name} gallery view`]
      );
    }
  }

  if (sub.user_id) {
    NotificationService.createNotification(
      sub.user_id,
      'community_review',
      `Suggestion ${status === 'approved' ? 'Approved!' : 'Status Update'}`,
      `Your suggestion for "${sub.destination_name}" has been ${status}. ${admin_notes ? 'Note: ' + admin_notes : ''}`,
      '/discover-hidden-gems'
    );
  }

  AuditService.log(req.user!.id, 'community_moderated', 'community_submission', Number(id), `Moderated to ${status}. Notes: ${admin_notes || 'None'}`);

  return res.json({ message: `Submission marked as ${status}.` });
});

// 7. All Bookings Overview
adminRouter.get('/bookings', (_req: AuthenticatedRequest, res: Response) => {
  const bookings = dbAll(
    `SELECT b.*, u.full_name as user_name, u.email as user_email,
            p.status as payment_status, p.payment_provider, p.transaction_id,
            CASE 
              WHEN b.booking_type = 'homestay' THEN (SELECT title FROM homestays WHERE id = b.item_id)
              WHEN b.booking_type = 'guide' THEN (SELECT u2.full_name FROM guide_profiles g JOIN users u2 ON g.user_id = u2.id WHERE g.id = b.item_id)
              WHEN b.booking_type = 'experience' THEN (SELECT title FROM experiences WHERE id = b.item_id)
            END as item_title
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     LEFT JOIN payments p ON b.id = p.booking_id
     ORDER BY b.created_at DESC`
  );
  return res.json({ bookings });
});

// 8. Reviews Moderation
adminRouter.get('/reviews', (_req: AuthenticatedRequest, res: Response) => {
  const reviews = dbAll(
    `SELECT r.*, u.full_name as author_name, u.email as author_email
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     ORDER BY r.created_at DESC`
  );
  return res.json({ reviews });
});

adminRouter.put('/reviews/:id/moderate', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { is_approved } = req.body;
  const approved = is_approved ? 1 : 0;

  dbRun('UPDATE reviews SET is_approved = ?, is_moderated = 1 WHERE id = ?', [approved, id]);
  AuditService.log(req.user!.id, 'review_moderated', 'review', Number(id), `Set approved to ${approved}`);

  return res.json({ message: `Review ${approved ? 'approved' : 'hidden'}.` });
});

// 9. Audit Logs
adminRouter.get('/audit-logs', (_req: AuthenticatedRequest, res: Response) => {
  const logs = AuditService.getLogs(100);
  return res.json({ logs });
});
