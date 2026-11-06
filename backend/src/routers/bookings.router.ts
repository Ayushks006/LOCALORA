import { Router, Response } from 'express';
import { dbAll, dbGet } from '../database/index.js';
import { Booking, BookingStatus, BookingType } from '../types/index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { BookingService } from '../services/booking.service.js';

export const bookingsRouter = Router();

// Check availability without committing
bookingsRouter.get('/check-availability', (req, res) => {
  const { booking_type, item_id, room_id, start_date, end_date, guests_count } = req.query;

  if (!booking_type || !item_id || !start_date || !end_date) {
    return res.status(400).json({ error: 'Missing parameters: booking_type, item_id, start_date, end_date required.' });
  }

  const result = BookingService.checkAvailability(
    booking_type as BookingType,
    Number(item_id),
    room_id ? Number(room_id) : null,
    String(start_date),
    String(end_date),
    guests_count ? Number(guests_count) : 1
  );

  return res.json(result);
});

// Create booking (Tourist or any authenticated user)
bookingsRouter.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { booking_type, item_id, room_id, start_date, end_date, guests_count, notes } = req.body;

    if (!booking_type || !item_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required booking fields.' });
    }

    const booking = BookingService.createBooking({
      userId: req.user!.id,
      bookingType: booking_type,
      itemId: Number(item_id),
      roomId: room_id ? Number(room_id) : null,
      startDate: String(start_date),
      endDate: String(end_date),
      guestsCount: guests_count ? Number(guests_count) : 1,
      notes,
    });

    return res.status(201).json({
      message: 'Booking request submitted successfully.',
      booking,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create booking.' });
  }
});

// Tourist: My Bookings
bookingsRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.query;

  let sql = `
    SELECT b.*,
           p.status as payment_status, p.payment_provider, p.transaction_id,
           CASE 
             WHEN b.booking_type = 'homestay' THEN (SELECT title FROM homestays WHERE id = b.item_id)
             WHEN b.booking_type = 'guide' THEN (SELECT u.full_name FROM guide_profiles g JOIN users u ON g.user_id = u.id WHERE g.id = b.item_id)
             WHEN b.booking_type = 'experience' THEN (SELECT title FROM experiences WHERE id = b.item_id)
           END as item_title,
           CASE 
             WHEN b.booking_type = 'homestay' THEN (SELECT primary_image FROM homestays WHERE id = b.item_id)
             WHEN b.booking_type = 'guide' THEN (SELECT profile_image FROM guide_profiles WHERE id = b.item_id)
             WHEN b.booking_type = 'experience' THEN (SELECT primary_image FROM experiences WHERE id = b.item_id)
           END as item_image,
           CASE 
             WHEN b.booking_type = 'homestay' THEN (SELECT district FROM homestays WHERE id = b.item_id)
             WHEN b.booking_type = 'guide' THEN (SELECT district FROM guide_profiles WHERE id = b.item_id)
             WHEN b.booking_type = 'experience' THEN (SELECT district FROM experiences WHERE id = b.item_id)
           END as item_locality
    FROM bookings b
    LEFT JOIN payments p ON b.id = p.booking_id
    WHERE b.user_id = ?
  `;
  const params: any[] = [req.user!.id];

  if (status) {
    sql += ` AND b.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY b.created_at DESC`;

  const bookings = dbAll<Booking>(sql, params);
  return res.json({ bookings });
});

// Single Booking Details
bookingsRouter.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const booking = dbGet<Booking>(
    `SELECT b.*,
            p.status as payment_status, p.payment_provider, p.transaction_id, p.order_id,
            u.full_name as user_name, u.email as user_email, u.phone as user_phone,
            CASE 
              WHEN b.booking_type = 'homestay' THEN (SELECT title FROM homestays WHERE id = b.item_id)
              WHEN b.booking_type = 'guide' THEN (SELECT u.full_name FROM guide_profiles g JOIN users u ON g.user_id = u.id WHERE g.id = b.item_id)
              WHEN b.booking_type = 'experience' THEN (SELECT title FROM experiences WHERE id = b.item_id)
            END as item_title,
            CASE 
              WHEN b.booking_type = 'homestay' THEN (SELECT primary_image FROM homestays WHERE id = b.item_id)
              WHEN b.booking_type = 'guide' THEN (SELECT profile_image FROM guide_profiles WHERE id = b.item_id)
              WHEN b.booking_type = 'experience' THEN (SELECT primary_image FROM experiences WHERE id = b.item_id)
            END as item_image
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     LEFT JOIN payments p ON b.id = p.booking_id
     WHERE b.id = ?`,
    [id]
  );

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  // Authorization check: Must be tourist, host/provider, or admin
  let isAuthorized = req.user!.role === 'admin' || booking.user_id === req.user!.id;

  if (!isAuthorized) {
    if (booking.booking_type === 'homestay') {
      const h = dbGet('SELECT owner_id FROM homestays WHERE id = ?', [booking.item_id]);
      if (h && (h as any).owner_id === req.user!.id) isAuthorized = true;
    } else if (booking.booking_type === 'guide') {
      const g = dbGet('SELECT user_id FROM guide_profiles WHERE id = ?', [booking.item_id]);
      if (g && (g as any).user_id === req.user!.id) isAuthorized = true;
    } else if (booking.booking_type === 'experience') {
      const exp = dbGet('SELECT c.owner_id FROM experiences e JOIN cultural_businesses c ON e.business_id = c.id WHERE e.id = ?', [booking.item_id]);
      if (exp && (exp as any).owner_id === req.user!.id) isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return res.status(403).json({ error: 'Unauthorized to view this booking.' });
  }

  const history = dbAll(
    `SELECT h.*, u.full_name as changed_by_name 
     FROM booking_status_history h 
     LEFT JOIN users u ON h.changed_by_user_id = u.id 
     WHERE h.booking_id = ? 
     ORDER BY h.created_at ASC`,
    [booking.id]
  );

  return res.json({ booking, history });
});

// Update Booking Status (Accept / Reject / Complete)
bookingsRouter.put('/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['confirmed', 'rejected', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid booking status target.' });
    }

    const updated = BookingService.updateBookingStatus(
      Number(id),
      status as BookingStatus,
      req.user!.id,
      req.user!.role,
      reason
    );

    return res.json({ message: `Booking marked as ${status}.`, booking: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Cancel Booking
bookingsRouter.post('/:id/cancel', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const updated = BookingService.updateBookingStatus(
      Number(id),
      'cancelled',
      req.user!.id,
      req.user!.role,
      reason || 'Cancelled by user.'
    );

    return res.json({ message: 'Booking cancelled successfully.', booking: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});
