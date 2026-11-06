import path from 'path';
import dotenv from 'dotenv';

// Load root or local .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const canonicalDbPath = path.resolve(__dirname, '../../data/localora.sqlite');

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_localora_jwt_key_default_development_min_32_chars',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  databasePath: canonicalDbPath,
  adminBootstrapToken: process.env.ADMIN_BOOTSTRAP_TOKEN || 'localora_admin_bootstrap_secret_2026',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  paymentMode: (process.env.PAYMENT_MODE || 'demo') as 'demo' | 'razorpay',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key_id',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'mock_key_secret_for_signing',
};
