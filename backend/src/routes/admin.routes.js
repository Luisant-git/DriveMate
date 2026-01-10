import express from 'express';
import {
  getAllDrivers,
  approveDriver,
  rejectDriver,
  getAllRides,
  getAnalytics,
  findNearestDrivers,
} from '../controllers/admin.controller.js';
import { updateDriverStatus } from '../controllers/driver.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/drivers', authenticateToken, requireRole(['ADMIN']), getAllDrivers);
router.put('/drivers/:driverId/approve', authenticateToken, requireRole(['ADMIN']), approveDriver);
router.put('/drivers/:driverId/reject', authenticateToken, requireRole(['ADMIN']), rejectDriver);
router.put('/drivers/:driverId/status', authenticateToken, requireRole(['ADMIN']), updateDriverStatus);
router.get('/rides', authenticateToken, requireRole(['ADMIN']), getAllRides);
router.get('/analytics', authenticateToken, requireRole(['ADMIN']), getAnalytics);
router.get('/drivers/nearby', authenticateToken, requireRole(['ADMIN']), findNearestDrivers);

export default router;