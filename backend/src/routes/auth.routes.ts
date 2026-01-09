import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getProfile } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Strict rate limiting for auth endpoints to prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: 'Too many accounts created, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});

router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/profile', authenticate, getProfile);

export default router;
