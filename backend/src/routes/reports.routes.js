import express from 'express';
import { getDriverReports, getCustomerReports, getRevenueReport, getDriverTrips, getCustomerTrips, getAllBookingsReport } from '../controllers/reports.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/drivers', authenticateToken, getDriverReports);
router.get('/drivers/:driverId/trips', authenticateToken, getDriverTrips);
router.get('/customers', authenticateToken, getCustomerReports);
router.get('/customers/:customerId/trips', authenticateToken, getCustomerTrips);
router.get('/revenue', authenticateToken, getRevenueReport);
router.get('/bookings', authenticateToken, getAllBookingsReport);

export default router;
