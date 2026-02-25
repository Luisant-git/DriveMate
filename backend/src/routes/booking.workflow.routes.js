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
  getDriverAllocatedBooking,
  sendBookingToLeads,
  getLeadPendingRequests,
  respondToLeadBookingRequest,
  getLeadBookingResponses,
  allocateLeadToBooking
} from '../controllers/booking.workflow.controller.js';
import { requireAuth } from '../middleware/sessionAuth.js';
import { authenticateLead } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/booking-workflow/admin/pending:
 *   get:
 *     summary: Get all pending bookings for admin review
 *     tags: [Booking Workflow]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending bookings
 */
router.get('/admin/pending', requireAuth, getAdminPendingBookings);

/**
 * @swagger
 * /api/booking-workflow/admin/{bookingId}/review:
 *   put:
 *     summary: Admin reviews and sets package type for booking
 *     tags: [Booking Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               selectedPackageType:
 *                 type: string
 *                 enum: [LOCAL, OUTSTATION, ALL_PREMIUM]
 *     responses:
 *       200:
 *         description: Booking reviewed successfully
 */
router.put('/admin/:bookingId/review', requireAuth, adminReviewBooking);

/**
 * @swagger
 * /api/booking-workflow/admin/{bookingId}/send-to-drivers:
 *   post:
 *     summary: Send booking to drivers based on package type
 *     tags: [Booking Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking sent to drivers
 */
router.post('/admin/:bookingId/send-to-drivers', requireAuth, sendBookingToDrivers);

/**
 * @swagger
 * /api/booking-workflow/admin/{bookingId}/responses:
 *   get:
 *     summary: Get all driver responses for a booking
 *     tags: [Booking Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of driver responses
 */
router.get('/admin/:bookingId/responses', requireAuth, getBookingResponses);

/**
 * @swagger
 * /api/booking-workflow/admin/{bookingId}/allocate-driver:
 *   post:
 *     summary: Allocate a driver to booking
 *     tags: [Booking Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               driverId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Driver allocated successfully
 */
router.post('/admin/:bookingId/allocate-driver', requireAuth, allocateDriverToBooking);

/**
 * @swagger
 * /api/booking-workflow/driver/pending-requests:
 *   get:
 *     summary: Get pending booking requests for driver
 *     tags: [Booking Workflow]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending requests
 */
router.get('/driver/pending-requests', requireAuth, getDriverPendingRequests);

/**
 * @swagger
 * /api/booking-workflow/driver/respond/{responseId}:
 *   put:
 *     summary: Driver responds to booking request
 *     tags: [Booking Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: responseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACCEPTED, REJECTED]
 *     responses:
 *       200:
 *         description: Response recorded
 */
router.put('/driver/respond/:responseId', requireAuth, respondToBookingRequest);

/**
 * @swagger
 * /api/booking-workflow/driver/{bookingId}:
 *   get:
 *     summary: Get allocated booking details for driver
 *     tags: [Booking Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details
 */
router.get('/driver/:bookingId', requireAuth, getDriverAllocatedBooking);

/**
 * @swagger
 * /api/booking-workflow/customer/{bookingId}:
 *   get:
 *     summary: Get booking with driver details for customer
 *     tags: [Booking Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking with driver details
 */
router.get('/customer/:bookingId', requireAuth, getCustomerBookingWithDriver);

// Lead workflow routes
router.post('/admin/:bookingId/send-to-leads', requireAuth, sendBookingToLeads);
router.get('/admin/:bookingId/lead-responses', requireAuth, getLeadBookingResponses);
router.post('/admin/:bookingId/allocate-lead', requireAuth, allocateLeadToBooking);
router.get('/lead/pending-requests', authenticateLead, getLeadPendingRequests);
router.put('/lead/respond/:responseId', authenticateLead, respondToLeadBookingRequest);

export default router;
