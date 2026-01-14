import express from 'express';
import {
  createTrip,
  getAvailableTrips,
  getDriverTrips,
  getCustomerTrips,
  acceptTrip,
  completeTrip,
  cancelTrip,
  updateTripStatus,
  getUpcomingTrips,
  getCompletedTrips,
} from '../controllers/trip.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Customer creates trip
router.post('/', authenticateToken, requireRole(['CUSTOMER']), createTrip);

// Driver gets available trips to accept
router.get('/available', authenticateToken, requireRole(['DRIVER']), getAvailableTrips);

// Driver gets their trips
router.get('/driver', authenticateToken, requireRole(['DRIVER']), getDriverTrips);

// Customer gets their trips
router.get('/customer', authenticateToken, requireRole(['CUSTOMER']), getCustomerTrips);

// Driver accepts trip
router.post('/:tripId/accept', authenticateToken, requireRole(['DRIVER']), acceptTrip);

// Driver completes trip
router.post('/:tripId/complete', authenticateToken, requireRole(['DRIVER']), completeTrip);

// Driver cancels trip
router.post('/:tripId/cancel', authenticateToken, requireRole(['DRIVER']), cancelTrip);

// Generic status update
router.put('/:tripId/status', authenticateToken, updateTripStatus);

// Admin routes
router.get('/upcoming', authenticateToken, requireRole(['ADMIN']), getUpcomingTrips);
router.get('/completed', authenticateToken, requireRole(['ADMIN']), getCompletedTrips);

export default router;