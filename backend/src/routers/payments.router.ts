import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { PaymentService } from '../services/payment.service.js';

export const paymentsRouter = Router();

// Create / Initiate payment order
paymentsRouter.post('/create-order', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { booking_id } = req.body;
    if (!booking_id) {
      return res.status(400).json({ error: 'booking_id is required.' });
    }

    const order = await PaymentService.createOrder(Number(booking_id), req.user!.id);
    return res.json(order);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Demo / Simulation Payment
paymentsRouter.post('/simulate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { booking_id, should_succeed = true } = req.body;
    if (!booking_id) {
      return res.status(400).json({ error: 'booking_id is required.' });
    }

    const payment = await PaymentService.simulatePayment(
      Number(booking_id),
      req.user!.id,
      Boolean(should_succeed)
    );

    return res.json({
      message: should_succeed
        ? 'Payment simulation successful (Demo Mode).'
        : 'Payment simulation failed as requested.',
      payment,
      isSimulation: true,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Verify live Razorpay Payment
paymentsRouter.post('/verify-razorpay', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!booking_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required Razorpay verification parameters.' });
    }

    const verified = await PaymentService.verifyRazorpayPayment(
      Number(booking_id),
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!verified) {
      return res.status(400).json({ error: 'Payment signature verification failed.' });
    }

    return res.json({ message: 'Razorpay payment verified successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
