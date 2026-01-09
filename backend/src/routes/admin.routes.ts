import { Router } from 'express';
import { setUserSubscription, getAllUsers, resetUserPassword, deleteUser } from '../controllers/admin.controller';
import { requireAdminSecret } from '../middleware/adminAuth';
import { validate } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

const setSubscriptionSchema = z.object({
  body: z.object({
    email: z.string().email(),
    tier: z.enum(['free', 'pro']),
    expiresInDays: z.number().optional(),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
    newPassword: z.string().min(8),
  }),
});

const deleteUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

// All admin routes require admin secret
router.use(requireAdminSecret);

// Get all users (for admin panel)
router.get('/users', getAllUsers);

// Manual subscription override for testing
router.post('/subscription', validate(setSubscriptionSchema), setUserSubscription);

// Reset user password (for beta testing)
router.post('/reset-password', validate(resetPasswordSchema), resetUserPassword);

// Delete user account (for cleanup)
router.delete('/user', validate(deleteUserSchema), deleteUser);

export default router;
