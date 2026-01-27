import express from 'express';
import { getDriverReports, getCustomerReports, getRevenueReport, getDriverTrips, getCustomerTrips } from '../controllers/reports.controller.js';
import { requireAuth } from '../middleware/sessionAuth.js';

const router = express.Router();

router.get('/drivers', requireAuth, getDriverReports);
router.get('/drivers/:driverId/trips', requireAuth, getDriverTrips);
router.get('/customers', requireAuth, getCustomerReports);
router.get('/customers/:customerId/trips', requireAuth, getCustomerTrips);
router.get('/revenue', requireAuth, getRevenueReport);

export default router;
