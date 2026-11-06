import { dbGet, dbRun, dbAll } from '../database/index.js';
import { Booking, BookingStatus, BookingType, Homestay, GuideProfile, Experience, User } from '../types/index.js';
import { NotificationService } from './notification.service.js';
import { AuditService } from './audit.service.js';

export interface CreateBookingInput {
  userId: number;
  bookingType: BookingType;
  itemId: number;
  roomId?: number | null;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  guestsCount: number;
  notes?: string;
}

export class BookingService {
  /**
   * Helper: Parse dates and calculate whole days/nights
   */
  static calculateDuration(startStr: string, endStr: string, isOvernight: boolean): number {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD.');
    }
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (isOvernight) {
      if (diffDays < 1) {
        throw new Error('Check-out date must be at least one day after check-in date.');
      }
      return diffDays;
    } else {
      if (diffDays < 0) {
        throw new Error('End date cannot be earlier than start date.');
      }
      return diffDays + 1; // inclusive of start day
    }
  }

  /**
   * Validates date availability and conflicts
   */
  static checkAvailability(
    bookingType: BookingType,
    itemId: number,
    roomId: number | null | undefined,
    startDate: string,
    endDate: string,
    guestsCount: number,
    excludeBookingId?: number
  ): { available: boolean; reason?: string } {
    // 1. Homestay validation
    if (bookingType === 'homestay') {
      const homestay = dbGet<Homestay>('SELECT * FROM homestays WHERE id = ?', [itemId]);
      if (!homestay) return { available: false, reason: 'Homestay listing not found.' };
      if (!homestay.verified) return { available: false, reason: 'This homestay is currently pending verification.' };
      if (guestsCount > homestay.max_guests) {
        return { available: false, reason: `Guest count (${guestsCount}) exceeds maximum capacity of ${homestay.max_guests}.` };
      }

      // Check overlapping bookings
      // Dates overlap if: existing.start < new.end AND existing.end > new.start
      let query = `
        SELECT id, reference_number, start_date, end_date FROM bookings
        WHERE booking_type = 'homestay'
          AND item_id = ?
          AND status IN ('pending', 'confirmed')
          AND start_date < ? AND end_date > ?
      `;
      const params: any[] = [itemId, endDate, startDate];

      if (roomId) {
        query += ` AND (room_id = ? OR room_id IS NULL)`;
        params.push(roomId);
      }
      if (excludeBookingId) {
        query += ` AND id != ?`;
        params.push(excludeBookingId);
      }

      const conflict = dbGet<Booking>(query, params);
      if (conflict) {
        return {
          available: false,
          reason: `Requested dates (${startDate} to ${endDate}) conflict with existing reservation (${conflict.start_date} to ${conflict.end_date}).`,
        };
      }
    }

    // 2. Guide validation
    if (bookingType === 'guide') {
      const guide = dbGet<GuideProfile>('SELECT * FROM guide_profiles WHERE id = ?', [itemId]);
      if (!guide) return { available: false, reason: 'Guide profile not found.' };
      if (!guide.verified) return { available: false, reason: 'This guide profile is not yet approved.' };

      let query = `
        SELECT id, reference_number, start_date, end_date FROM bookings
        WHERE booking_type = 'guide'
          AND item_id = ?
          AND status IN ('pending', 'confirmed')
          AND start_date <= ? AND end_date >= ?
      `;
      const params: any[] = [itemId, endDate, startDate];
      if (excludeBookingId) {
        query += ` AND id != ?`;
        params.push(excludeBookingId);
      }

      const conflict = dbGet<Booking>(query, params);
      if (conflict) {
        return {
          available: false,
          reason: `Guide is already booked for dates between ${conflict.start_date} and ${conflict.end_date}.`,
        };
      }
    }

    // 3. Experience validation
    if (bookingType === 'experience') {
      const exp = dbGet<Experience>('SELECT * FROM experiences WHERE id = ?', [itemId]);
      if (!exp) return { available: false, reason: 'Experience not found.' };
      if (!exp.verified) return { available: false, reason: 'This experience is pending verification.' };

      // Calculate total booked guests for this day
      const bookedGuests = dbGet<{ total: number }>(
        `SELECT COALESCE(SUM(guests_count), 0) as total FROM bookings
         WHERE booking_type = 'experience' AND item_id = ? AND start_date = ? AND status IN ('pending', 'confirmed')`,
        [itemId, startDate]
      );
      const currentCount = bookedGuests ? bookedGuests.total : 0;
      if (currentCount + guestsCount > exp.max_group_size) {
        return {
          available: false,
          reason: `Group size exceeds remaining capacity for this date. Remaining: ${exp.max_group_size - currentCount}, Requested: ${guestsCount}.`,
        };
      }
    }

    return { available: true };
  }

  /**
   * Creates a new booking with full backend pricing calculation and concurrency check
   */
  static createBooking(input: CreateBookingInput): Booking {
    const { userId, bookingType, itemId, roomId, startDate, endDate, guestsCount, notes } = input;

    if (guestsCount < 1) {
      throw new Error('At least one guest is required.');
    }

    // Check availability
    const avail = this.checkAvailability(bookingType, itemId, roomId, startDate, endDate, guestsCount);
    if (!avail.available) {
      throw new Error(avail.reason || 'Requested dates are unavailable.');
    }

    let unitPrice = 0;
    let units = 1;
    let totalAmount = 0;
    let ownerUserId: number | null = null;
    let itemTitle = '';

    if (bookingType === 'homestay') {
      const homestay = dbGet<Homestay>('SELECT * FROM homestays WHERE id = ?', [itemId])!;
      ownerUserId = homestay.owner_id;
      itemTitle = homestay.title;

      let roomPrice = homestay.price_per_night;
      if (roomId) {
        const room = dbGet<{ price_per_night: number }>('SELECT price_per_night FROM homestay_rooms WHERE id = ?', [roomId]);
        if (room) roomPrice = room.price_per_night;
      }
      unitPrice = roomPrice;
      units = this.calculateDuration(startDate, endDate, true);
      totalAmount = unitPrice * units;
    } else if (bookingType === 'guide') {
      const guide = dbGet<GuideProfile>('SELECT * FROM guide_profiles WHERE id = ?', [itemId])!;
      ownerUserId = guide.user_id;
      const guideUser = dbGet<User>('SELECT full_name FROM users WHERE id = ?', [guide.user_id]);
      itemTitle = guideUser ? `Guide ${guideUser.full_name}` : 'Local Guide';

      unitPrice = guide.pricing_per_day;
      units = this.calculateDuration(startDate, endDate, false);
      totalAmount = unitPrice * units;
    } else if (bookingType === 'experience') {
      const exp = dbGet<Experience>('SELECT e.*, c.owner_id FROM experiences e JOIN cultural_businesses c ON e.business_id = c.id WHERE e.id = ?', [itemId]) as (Experience & { owner_id: number }) | undefined;
      if (!exp) throw new Error('Experience not found.');
      ownerUserId = exp.owner_id;
      itemTitle = exp.title;

      unitPrice = exp.price_per_person;
      units = guestsCount;
      totalAmount = unitPrice * units;
    }

    // Generate unique reference number: LOC-YYYYMMDD-XXXX
    const refCode = `LOC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const result = dbRun(
      `INSERT INTO bookings (
        reference_number, user_id, booking_type, item_id, room_id,
        start_date, end_date, guests_count, unit_price,
        total_nights_or_days, total_amount, currency, status, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'INR', 'pending', ?, datetime('now'), datetime('now'))`,
      [
        refCode,
        userId,
        bookingType,
        itemId,
        roomId || null,
        startDate,
        endDate,
        guestsCount,
        unitPrice,
        units,
        totalAmount,
        notes || null,
      ]
    );

    const bookingId = Number(result.lastInsertRowid);

    // Record initial status history
    dbRun(
      `INSERT INTO booking_status_history (booking_id, from_status, to_status, changed_by_user_id, notes, created_at)
       VALUES (?, 'none', 'pending', ?, 'Booking submitted by tourist', datetime('now'))`,
      [bookingId, userId]
    );

    // Notify Tourist
    NotificationService.createNotification(
      userId,
      'booking_created',
      'Booking Request Submitted',
      `Your request for ${itemTitle} (${refCode}) has been received and is pending provider review.`,
      `/dashboard/bookings/${bookingId}`
    );

    // Notify Provider/Host
    if (ownerUserId) {
      NotificationService.createNotification(
        ownerUserId,
        'booking_received',
        'New Booking Request',
        `You have received a new booking request for ${itemTitle} (${refCode}).`,
        `/provider/bookings`
      );
    }

    return dbGet<Booking>('SELECT * FROM bookings WHERE id = ?', [bookingId])!;
  }

  /**
   * Transition booking state with authorization and conflict checks
   */
  static updateBookingStatus(
    bookingId: number,
    newStatus: BookingStatus,
    actorId: number,
    actorRole: string,
    reason?: string
  ): Booking {
    const booking = dbGet<Booking>('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) throw new Error('Booking not found.');

    const oldStatus = booking.status;
    if (oldStatus === newStatus) return booking;

    // Check authorization: who can transition this booking?
    let isProviderOwner = false;
    let providerUserId: number | null = null;

    if (booking.booking_type === 'homestay') {
      const h = dbGet<Homestay>('SELECT owner_id FROM homestays WHERE id = ?', [booking.item_id]);
      if (h) providerUserId = h.owner_id;
    } else if (booking.booking_type === 'guide') {
      const g = dbGet<GuideProfile>('SELECT user_id FROM guide_profiles WHERE id = ?', [booking.item_id]);
      if (g) providerUserId = g.user_id;
    } else if (booking.booking_type === 'experience') {
      const e = dbGet<{ owner_id: number }>('SELECT c.owner_id FROM experiences ex JOIN cultural_businesses c ON ex.business_id = c.id WHERE ex.id = ?', [booking.item_id]);
      if (e) providerUserId = e.owner_id;
    }

    if (actorId === providerUserId) isProviderOwner = true;
    const isTourist = actorId === booking.user_id;
    const isAdmin = actorRole === 'admin';

    // Validate state transitions
    if (newStatus === 'confirmed') {
      if (!isProviderOwner && !isAdmin) {
        throw new Error('Only the service provider or administrator can confirm a booking.');
      }
      // Re-verify availability to prevent race condition double bookings!
      const avail = this.checkAvailability(
        booking.booking_type,
        booking.item_id,
        booking.room_id,
        booking.start_date,
        booking.end_date,
        booking.guests_count,
        booking.id
      );
      if (!avail.available) {
        throw new Error(`Cannot confirm booking: ${avail.reason}`);
      }
    } else if (newStatus === 'rejected') {
      if (!isProviderOwner && !isAdmin) {
        throw new Error('Only the service provider or administrator can reject a booking.');
      }
    } else if (newStatus === 'cancelled') {
      if (!isTourist && !isProviderOwner && !isAdmin) {
        throw new Error('Unauthorized to cancel this booking.');
      }
    } else if (newStatus === 'completed') {
      if (!isProviderOwner && !isAdmin) {
        throw new Error('Only the service provider or administrator can mark a booking as completed.');
      }
    }

    dbRun(
      `UPDATE bookings SET status = ?, cancellation_reason = ?, updated_at = datetime('now') WHERE id = ?`,
      [newStatus, reason || null, bookingId]
    );

    // Record status history
    dbRun(
      `INSERT INTO booking_status_history (booking_id, from_status, to_status, changed_by_user_id, notes, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [bookingId, oldStatus, newStatus, actorId, reason || `Status changed to ${newStatus}`]
    );

    // Audit log
    AuditService.log(actorId, `booking_${newStatus}`, 'booking', bookingId, `Status changed from ${oldStatus} to ${newStatus}. Reason: ${reason || 'N/A'}`);

    // Send notifications to both parties
    const statusLabels: Record<string, string> = {
      confirmed: 'Confirmed! 🎉',
      rejected: 'Declined',
      cancelled: 'Cancelled',
      completed: 'Completed',
    };

    NotificationService.createNotification(
      booking.user_id,
      `booking_${newStatus}`,
      `Booking ${statusLabels[newStatus] || newStatus}`,
      `Your booking ${booking.reference_number} has been ${newStatus}. ${reason ? 'Note: ' + reason : ''}`,
      `/dashboard/bookings/${bookingId}`
    );

    if (providerUserId && providerUserId !== actorId) {
      NotificationService.createNotification(
        providerUserId,
        `booking_${newStatus}`,
        `Booking ${statusLabels[newStatus] || newStatus}`,
        `Booking ${booking.reference_number} was marked as ${newStatus}.`,
        `/provider/bookings`
      );
    }

    return dbGet<Booking>('SELECT * FROM bookings WHERE id = ?', [bookingId])!;
  }
}
