import express from 'express';
import {
  getAllDrivers,
  getAllCustomers,
  approveDriver,
  rejectDriver,
  getAllRides,
  getAnalytics,
  findNearestDrivers,
  getAllLeads,
  toggleLeadActiveStatus,
  toggleDriverActiveStatus,
  getAllLeadSubscriptions,
} from '../controllers/admin.controller.js';
import { updateDriverStatus } from '../controllers/driver.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/drivers', authenticateToken, getAllDrivers);
router.get('/customers', authenticateToken, getAllCustomers);
router.get('/leads', authenticateToken, getAllLeads);
router.get('/lead-subscriptions', authenticateToken, getAllLeadSubscriptions);
router.put('/drivers/:driverId/approve', authenticateToken, approveDriver);
router.put('/drivers/:driverId/reject', authenticateToken, rejectDriver);
router.put('/drivers/:driverId/active', authenticateToken, toggleDriverActiveStatus);
router.put('/drivers/:driverId/status', authenticateToken, updateDriverStatus);
router.put('/leads/:leadId/active', authenticateToken, toggleLeadActiveStatus);
router.get('/rides', authenticateToken, getAllRides);
router.get('/analytics', authenticateToken, getAnalytics);
router.get('/drivers/nearby', authenticateToken, findNearestDrivers);

export default router;