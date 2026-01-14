import express from 'express';
import { createBooking, getEstimate, getCustomerBookings, getDriverBookings } from '../controllers/booking.controller.js';
import { requireAuth } from '../middleware/sessionAuth.js';

const router = express.Router();

router.post('/', requireAuth, createBooking);
router.get('/estimate', requireAuth, getEstimate);
router.get('/my-bookings', requireAuth, getCustomerBookings);
router.get('/driver-bookings', requireAuth, getDriverBookings);

export default router;