import crypto from 'crypto';
import { config } from '../config/index.js';
import { dbGet, dbRun } from '../database/index.js';
import { Payment, Booking } from '../types/index.js';
import { NotificationService } from './notification.service.js';

export interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  provider: 'razorpay' | 'demo';
  keyId?: string;
  isSimulated: boolean;
}

export class PaymentService {
  /**
   * Initializes payment record and order id for a booking
   */
  static async createOrder(bookingId: number, userId: number): Promise<CreateOrderResult> {
    const booking = dbGet<Booking>('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) {
      throw new Error('Booking not found.');
    }

    if (booking.user_id !== userId) {
      throw new Error('Unauthorized to initiate payment for this booking.');
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const isDemo = config.paymentMode === 'demo' || !config.razorpayKeySecret || config.razorpayKeySecret.includes('placeholder');

    // Create or update pending payment record
    const existingPayment = dbGet<Payment>('SELECT id FROM payments WHERE booking_id = ?', [bookingId]);
    if (existingPayment) {
      dbRun(
        `UPDATE payments 
         SET amount = ?, currency = ?, status = 'pending', payment_provider = ?, order_id = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [booking.total_amount, booking.currency, isDemo ? 'demo' : 'razorpay', orderId, existingPayment.id]
      );
    } else {
      dbRun(
        `INSERT INTO payments (booking_id, amount, currency, status, payment_provider, order_id, created_at, updated_at)
         VALUES (?, ?, ?, 'pending', ?, ?, datetime('now'), datetime('now'))`,
        [booking.total_amount, booking.currency, isDemo ? 'demo' : 'razorpay', orderId]
      );
    }

    return {
      orderId,
      amount: booking.total_amount,
      currency: booking.currency,
      provider: isDemo ? 'demo' : 'razorpay',
      keyId: isDemo ? undefined : config.razorpayKeyId,
      isSimulated: isDemo,
    };
  }

  /**
   * Simulates payment in local demo mode (explicitly marked as simulation)
   */
  static async simulatePayment(bookingId: number, userId: number, shouldSucceed = true): Promise<Payment> {
    const booking = dbGet<Booking>('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) {
      throw new Error('Booking not found.');
    }
    if (booking.user_id !== userId) {
      throw new Error('Unauthorized.');
    }

    const transactionId = `SIM_TXN_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const status = shouldSucceed ? 'completed' : 'failed';

    let payment = dbGet<Payment>('SELECT * FROM payments WHERE booking_id = ?', [bookingId]);
    if (payment) {
      dbRun(
        `UPDATE payments 
         SET status = ?, payment_provider = 'demo', transaction_id = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [status, transactionId, payment.id]
      );
    } else {
      const res = dbRun(
        `INSERT INTO payments (booking_id, amount, currency, status, payment_provider, transaction_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'demo', ?, datetime('now'), datetime('now'))`,
        [bookingId, booking.total_amount, booking.currency, status, transactionId]
      );
      payment = dbGet<Payment>('SELECT * FROM payments WHERE id = ?', [res.lastInsertRowid]);
    }

    if (shouldSucceed) {
      NotificationService.createNotification(
        userId,
        'payment_completed',
        'Payment Processed (Simulated)',
        `Payment of ₹${booking.total_amount.toLocaleString('en-IN')} for booking ${booking.reference_number} was successfully completed.`,
        `/dashboard/bookings/${booking.id}`
      );
    } else {
      NotificationService.createNotification(
        userId,
        'payment_failed',
        'Payment Failed (Simulated)',
        `Payment for booking ${booking.reference_number} could not be processed.`,
        `/dashboard/bookings/${booking.id}`
      );
    }

    return dbGet<Payment>('SELECT * FROM payments WHERE booking_id = ?', [bookingId])!;
  }

  /**
   * Verifies Razorpay HMAC SHA256 signature
   */
  static async verifyRazorpayPayment(
    bookingId: number,
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<boolean> {
    const text = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(text)
      .digest('hex');

    if (expectedSignature !== signature) {
      dbRun(
        `UPDATE payments SET status = 'failed', updated_at = datetime('now') WHERE booking_id = ?`,
        [bookingId]
      );
      return false;
    }

    dbRun(
      `UPDATE payments 
       SET status = 'completed', transaction_id = ?, signature = ?, updated_at = datetime('now') 
       WHERE booking_id = ?`,
      [paymentId, signature, bookingId]
    );

    const booking = dbGet<Booking>('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (booking) {
      NotificationService.createNotification(
        booking.user_id,
        'payment_completed',
        'Payment Verified',
        `Razorpay payment ${paymentId} verified for booking ${booking.reference_number}.`,
        `/dashboard/bookings/${booking.id}`
      );
    }

    return true;
  }

  /**
   * Processes or records a refund
   */
  static async processRefund(bookingId: number, reason: string): Promise<boolean> {
    const payment = dbGet<Payment>('SELECT * FROM payments WHERE booking_id = ?', [bookingId]);
    if (!payment || payment.status !== 'completed') {
      return false;
    }

    dbRun(
      `UPDATE payments SET status = 'refunded', updated_at = datetime('now') WHERE id = ?`,
      [payment.id]
    );

    const booking = dbGet<Booking>('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (booking) {
      NotificationService.createNotification(
        booking.user_id,
        'refund_issued',
        'Refund Initiated',
        `A refund of ₹${payment.amount.toLocaleString('en-IN')} has been recorded for booking ${booking.reference_number}. Reason: ${reason}`,
        `/dashboard/bookings/${booking.id}`
      );
    }

    return true;
  }
}
