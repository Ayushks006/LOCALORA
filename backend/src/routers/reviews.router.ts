import { Router, Request, Response } from 'express';
import { dbAll, dbGet, dbRun } from '../database/index.js';
import { Review, Booking } from '../types/index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const reviewsRouter = Router();

// Helper to recalculate and update target's average rating
function updateTargetRating(targetType: string, targetId: number) {
  const stats = dbGet<{ avg_rating: number; total_count: number }>(
    `SELECT AVG(rating) as avg_rating, COUNT(id) as total_count 
     FROM reviews 
     WHERE target_type = ? AND target_id = ? AND is_approved = 1`,
    [targetType, targetId]
  );

  const avg = stats && stats.avg_rating ? Math.round(stats.avg_rating * 10) / 10 : 0;
  const count = stats ? stats.total_count : 0;

  if (targetType === 'homestay') {
    dbRun('UPDATE homestays SET rating_avg = ?, reviews_count = ? WHERE id = ?', [avg, count, targetId]);
  } else if (targetType === 'guide') {
    dbRun('UPDATE guide_profiles SET rating_avg = ?, reviews_count = ? WHERE id = ?', [avg, count, targetId]);
  } else if (targetType === 'experience') {
    dbRun('UPDATE experiences SET rating_avg = ?, reviews_count = ? WHERE id = ?', [avg, count, targetId]);
  }
}

// Get reviews for an item
reviewsRouter.get('/item/:type/:id', (req: Request, res: Response) => {
  const { type, id } = req.params;
  const reviews = dbAll<Review>(
    `SELECT r.*, u.full_name as user_name
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.target_type = ? AND r.target_id = ? AND r.is_approved = 1
     ORDER BY r.created_at DESC`,
    [type, id]
  );
  return res.json({ reviews });
});

// Check eligible bookings awaiting review for logged in user
reviewsRouter.get('/eligible', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const completedBookings = dbAll<Booking>(
    `SELECT b.*,
            CASE 
              WHEN b.booking_type = 'homestay' THEN (SELECT title FROM homestays WHERE id = b.item_id)
              WHEN b.booking_type = 'guide' THEN (SELECT u.full_name FROM guide_profiles g JOIN users u ON g.user_id = u.id WHERE g.id = b.item_id)
              WHEN b.booking_type = 'experience' THEN (SELECT title FROM experiences WHERE id = b.item_id)
            END as item_title
     FROM bookings b
     WHERE b.user_id = ? 
       AND (b.status = 'completed' OR (b.status = 'confirmed' AND b.end_date < date('now')))
       AND b.id NOT IN (SELECT booking_id FROM reviews WHERE booking_id IS NOT NULL)
     ORDER BY b.end_date DESC`,
    [req.user!.id]
  );

  return res.json({ eligibleBookings: completedBookings });
});

// Submit a review
reviewsRouter.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { target_type, target_id, rating, comment, booking_id } = req.body;

  if (!target_type || !target_id || !rating || !comment) {
    return res.status(400).json({ error: 'target_type, target_id, rating, and comment are required.' });
  }

  const ratingNum = parseInt(rating, 10);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
  }

  // If booking_id is provided, verify it belongs to user and prevent duplicate
  if (booking_id) {
    const booking = dbGet<Booking>('SELECT * FROM bookings WHERE id = ?', [booking_id]);
    if (!booking) {
      return res.status(400).json({ error: 'Referenced booking not found.' });
    }
    if (booking.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Cannot review a booking that does not belong to you.' });
    }

    const existingReview = dbGet('SELECT id FROM reviews WHERE booking_id = ?', [booking_id]);
    if (existingReview) {
      return res.status(400).json({ error: 'You have already submitted a review for this booking.' });
    }
  }

  const result = dbRun(
    `INSERT INTO reviews (user_id, booking_id, target_type, target_id, rating, comment, is_moderated, is_approved, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, 1, datetime('now'))`,
    [req.user!.id, booking_id || null, target_type, target_id, ratingNum, comment.trim()]
  );

  // Update target's aggregate score
  updateTargetRating(target_type, Number(target_id));

  return res.status(201).json({
    message: 'Review submitted successfully. Thank you for your feedback!',
    reviewId: Number(result.lastInsertRowid),
  });
});
