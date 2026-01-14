import express from 'express';
import {
  createTrip,
  updateTripStatus,
} from '../controllers/trip.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, createTrip);
router.put('/:tripId/status', authenticateToken, updateTripStatus);

export default router;