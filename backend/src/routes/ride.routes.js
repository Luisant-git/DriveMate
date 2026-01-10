import express from 'express';
import {
  createTrip,
  getTrips,
  updateTripStatus,
} from '../controllers/trip.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, createTrip);
router.get('/', authenticateToken, getTrips);
router.put('/:tripId/status', authenticateToken, updateTripStatus);

export default router;