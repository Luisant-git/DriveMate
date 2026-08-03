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
  submitVerification,
  getVerificationHistory,
  updateDriverDocument,
  getDeletedAccounts,
  getBusyDrivers,
  changeDriverPassword,
} from '../controllers/admin.controller.js';
import { updateDriverStatus } from '../controllers/driver.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/busy-drivers', authenticateToken, getBusyDrivers);
router.get('/drivers', authenticateToken, getAllDrivers);
router.get('/customers', authenticateToken, getAllCustomers);
router.get('/leads', authenticateToken, getAllLeads);
router.get('/lead-subscriptions', authenticateToken, getAllLeadSubscriptions);
router.put('/drivers/:driverId/document', authenticateToken, updateDriverDocument);
router.put('/drivers/:driverId/approve', authenticateToken, approveDriver);
router.put('/drivers/:driverId/reject', authenticateToken, rejectDriver);
router.put('/drivers/:driverId/active', authenticateToken, toggleDriverActiveStatus);
router.put('/drivers/:driverId/status', authenticateToken, updateDriverStatus);
router.put('/drivers/:driverId/password', authenticateToken, changeDriverPassword);
router.put('/leads/:leadId/active', authenticateToken, toggleLeadActiveStatus);
router.get('/rides', authenticateToken, getAllRides);
router.get('/analytics', authenticateToken, getAnalytics);
router.get('/drivers/nearby', authenticateToken, findNearestDrivers);
router.post('/verification', authenticateToken, submitVerification);
router.get('/verification/:entityId/history', authenticateToken, getVerificationHistory);
router.get('/deleted-accounts', authenticateToken, getDeletedAccounts);

export default router;