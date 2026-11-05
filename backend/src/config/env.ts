import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('8085'),
  CORS_ORIGIN: z.string().default('*'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().default(10),
  PAYPAL_CLIENT_ID: z.string().default(''),
  PAYPAL_CLIENT_SECRET: z.string().default(''),
  PAYPAL_API_BASE: z.string().default('https://api-m.sandbox.paypal.com'),
  PAYPAL_WEBHOOK_ID: z.string().default(''),
  PAYPAL_CURRENCY: z.string().default('USD'),
  PAYPAL_EXCHANGE_RATE: z.coerce.number().default(83.5),
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  RESEND_API_KEY: z.string().default(''),
  EMAIL_FROM: z.string().default('WayRivo AI <onboarding@resend.dev>'),
  PASSWORD_RESET_TOKEN_EXPIRY_MINUTES: z.coerce.number().default(15),
  // Google OAuth 2.0 Configuration
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_CALLBACK_URL: z.string().default('http://localhost:8085/api/v1/auth/google/callback'),
  BACKEND_URL: z.string().default('http://localhost:8085'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Environment configuration error:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
