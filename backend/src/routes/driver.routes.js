import express from 'express';
import {
  registerDriver,
  updateDriverLocation,
  toggleOnlineStatus,
  getDriverProfile,
  updateDriverPackage,
  getAvailableDriversByPackage,
  getAllDrivers,
} from '../controllers/driver.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { requireAuth } from '../middleware/sessionAuth.js';

const router = express.Router();

router.post('/register', authenticateToken, requireRole(['DRIVER']), registerDriver);
router.put('/location', authenticateToken, requireRole(['DRIVER']), updateDriverLocation);
router.put('/status', authenticateToken, requireRole(['DRIVER']), toggleOnlineStatus);
router.get('/profile', authenticateToken, requireRole(['DRIVER']), getDriverProfile);
router.put('/package', requireAuth, updateDriverPackage);
router.get('/available/:packageType', requireAuth, getAvailableDriversByPackage);
router.get('/', getAllDrivers);

export default router;