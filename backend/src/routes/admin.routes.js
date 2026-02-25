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
  approveLeadStatus,
  getAllLeadSubscriptions,
} from '../controllers/admin.controller.js';
import { updateDriverStatus } from '../controllers/driver.controller.js';
import { requireAuth } from '../middleware/sessionAuth.js';

const router = express.Router();

router.get('/drivers', requireAuth, getAllDrivers);
router.get('/customers', requireAuth, getAllCustomers);
router.get('/leads', requireAuth, getAllLeads);
router.get('/lead-subscriptions', requireAuth, getAllLeadSubscriptions);
router.put('/drivers/:driverId/approve', requireAuth, approveDriver);
router.put('/drivers/:driverId/reject', requireAuth, rejectDriver);
router.put('/drivers/:driverId/status', requireAuth, updateDriverStatus);
router.put('/leads/:leadId/status', requireAuth, approveLeadStatus);
router.get('/rides', requireAuth, getAllRides);
router.get('/analytics', requireAuth, getAnalytics);
router.get('/drivers/nearby', requireAuth, findNearestDrivers);

export default router;