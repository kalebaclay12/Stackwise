import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getProfile,
  updateProfile,
  changePassword,
  getPreferences,
  updatePreferences,
} from '../controllers/user.controller';

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

export default router;
