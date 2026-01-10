import express from 'express';
import {
  createTrip,
  getDriverTrips,
  getCustomerTrips,
  updateTripStatus,
  getUpcomingTrips,
  getCompletedTrips,
} from '../controllers/trip.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, requireRole(['ADMIN', 'CUSTOMER']), createTrip);
router.get('/driver', authenticateToken, requireRole(['DRIVER']), getDriverTrips);
router.get('/customer', authenticateToken, requireRole(['CUSTOMER']), getCustomerTrips);
router.get('/upcoming', authenticateToken, getUpcomingTrips);
router.get('/completed', authenticateToken, getCompletedTrips);
router.put('/:tripId/status', authenticateToken, updateTripStatus);

export default router;