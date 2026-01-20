import express from 'express';
import { createBooking, getEstimate, getCustomerBookings, getDriverBookings } from '../controllers/booking.controller.js';
import { requireAuth } from '../middleware/sessionAuth.js';

const router = express.Router();

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
router.post('/', requireAuth, createBooking);

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
router.get('/estimate', requireAuth, getEstimate);

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
router.get('/my-bookings', requireAuth, getCustomerBookings);

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
router.get('/driver-bookings', requireAuth, getDriverBookings);

export default router;