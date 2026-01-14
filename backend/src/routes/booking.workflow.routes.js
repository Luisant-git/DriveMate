import express from 'express';
import {
  getAdminPendingBookings,
  adminReviewBooking,
  sendBookingToDrivers,
  getDriverPendingRequests,
  respondToBookingRequest,
  getBookingResponses,
  allocateDriverToBooking,
  getCustomerBookingWithDriver,
  getDriverAllocatedBooking
} from '../controllers/booking.workflow.controller.js';
import { requireAuth } from '../middleware/sessionAuth.js';

const router = express.Router();

// ADMIN ROUTES
router.get('/admin/pending', requireAuth, getAdminPendingBookings);
router.put('/admin/:bookingId/review', requireAuth, adminReviewBooking);
router.post('/admin/:bookingId/send-to-drivers', requireAuth, sendBookingToDrivers);
router.get('/admin/:bookingId/responses', requireAuth, getBookingResponses);
router.post('/admin/:bookingId/allocate-driver', requireAuth, allocateDriverToBooking);

// DRIVER ROUTES
router.get('/driver/pending-requests', requireAuth, getDriverPendingRequests);
router.put('/driver/respond/:responseId', requireAuth, respondToBookingRequest);
router.get('/driver/:bookingId', requireAuth, getDriverAllocatedBooking);

// CUSTOMER ROUTES
router.get('/customer/:bookingId', requireAuth, getCustomerBookingWithDriver);

export default router;
