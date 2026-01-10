import express from 'express';
import {
  registerDriver,
  updateDriverLocation,
  toggleOnlineStatus,
  getDriverProfile,
} from '../controllers/driver.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', authenticateToken, requireRole(['DRIVER']), registerDriver);
router.put('/location', authenticateToken, requireRole(['DRIVER']), updateDriverLocation);
router.put('/status', authenticateToken, requireRole(['DRIVER']), toggleOnlineStatus);
router.get('/profile', authenticateToken, requireRole(['DRIVER']), getDriverProfile);

export default router;