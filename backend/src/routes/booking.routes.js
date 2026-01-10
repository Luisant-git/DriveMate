import express from 'express';
import { createBooking, getEstimate, getCustomerBookings } from '../controllers/booking.controller.js';
import { requireAuth } from '../middleware/sessionAuth.js';

const router = express.Router();

router.post('/', requireAuth, createBooking);
router.get('/estimate', requireAuth, getEstimate);
router.get('/my-bookings', requireAuth, getCustomerBookings);

export default router;