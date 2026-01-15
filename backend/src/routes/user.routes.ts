import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getProfile,
  updateProfile,
  changePassword,
  getPreferences,
  updatePreferences,
  getNotificationPreferences,
  updateNotificationPreferences,
  getAppearancePreferences,
  updateAppearancePreferences,
  getSecurityPreferences,
  updateSecurityPreferences,
  getSessions,
  revokeSession,
  revokeAllSessions,
  getLoginHistory,
  exportData,
  deleteAccount,
} from '../controllers/user.controller';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);

// General Preferences
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

// Notification Preferences
router.get('/notification-preferences', getNotificationPreferences);
router.put('/notification-preferences', updateNotificationPreferences);

// Appearance Preferences
router.get('/appearance-preferences', getAppearancePreferences);
router.put('/appearance-preferences', updateAppearancePreferences);

// Security Preferences
router.get('/security-preferences', getSecurityPreferences);
router.put('/security-preferences', updateSecurityPreferences);

// Sessions
router.get('/sessions', getSessions);
router.delete('/sessions/:sessionId', revokeSession);
router.post('/sessions/revoke-all', revokeAllSessions);

// Login History
router.get('/login-history', getLoginHistory);

// Data Export & Account Deletion
router.get('/export-data', exportData);
router.delete('/account', deleteAccount);

export default router;
