import express from 'express';
import { createBooking, getEstimate, getCustomerBookings, getDriverBookings, getLeadBookings, getLeadCompletedTrips, rateBooking } from '../controllers/booking.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { authenticateLead } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings for the authenticated user
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 */
router.get('/', authenticateToken, getCustomerBookings);

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickupLocation
 *               - dropLocation
 *               - bookingType
 *               - startDateTime
 *             properties:
 *               pickupLocation:
 *                 type: string
 *                 example: "123 Main St, City"
 *               dropLocation:
 *                 type: string
 *                 example: "456 Park Ave, City"
 *               bookingType:
 *                 type: string
 *                 example: "SPARE_DRIVER"
 *               serviceType:
 *                 type: string
 *                 example: "LOCAL_HOURLY"
 *               startDateTime:
 *                 type: string
 *                 format: date-time
 *               duration:
 *                 type: string
 *                 example: "4 hours"
 *               vehicleType:
 *                 type: string
 *                 example: "Sedan"
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 */
router.post('/', authenticateToken, createBooking);

/**
 * @swagger
 * /api/bookings/estimate:
 *   get:
 *     summary: Get booking estimate
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bookingType
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: duration
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estimate calculated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estimateAmount:
 *                   type: number
 */
router.get('/estimate', authenticateToken, getEstimate);

/**
 * @swagger
 * /api/bookings/my-bookings:
 *   get:
 *     summary: Get customer bookings
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customer bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 */
router.get('/my-bookings', authenticateToken, getCustomerBookings);

/**
 * @swagger
 * /api/bookings/driver-bookings:
 *   get:
 *     summary: Get driver bookings
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of driver bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 */
router.get('/driver-bookings', authenticateToken, getDriverBookings);

/**
 * @swagger
 * /api/bookings/{id}/rate:
 *   post:
 *     summary: Rate a completed booking
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rating submitted successfully
 */
router.post('/:id/rate', authenticateToken, rateBooking);

router.get('/lead/allocated', authenticateLead, getLeadBookings);
router.get('/lead/completed', authenticateLead, getLeadCompletedTrips);

export default router;