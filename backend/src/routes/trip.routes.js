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

/**
 * @swagger
 * /api/trips:
 *   post:
 *     summary: Create a new trip (Customer)
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromLocation
 *               - toLocation
 *               - packageType
 *               - startDate
 *             properties:
 *               fromLocation:
 *                 type: string
 *                 example: "Bangalore"
 *               toLocation:
 *                 type: string
 *                 example: "Mysore"
 *               packageType:
 *                 type: string
 *                 enum: [LOCAL, OUTSTATION, ALL_PREMIUM]
 *               duration:
 *                 type: string
 *                 example: "2 days"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Trip created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trip'
 */
router.post('/', authenticateToken, requireRole(['CUSTOMER']), createTrip);

/**
 * @swagger
 * /api/trips/available:
 *   get:
 *     summary: Get available trips for driver
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available trips
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Trip'
 */
router.get('/available', authenticateToken, requireRole(['DRIVER']), getAvailableTrips);

/**
 * @swagger
 * /api/trips/driver:
 *   get:
 *     summary: Get driver's trips
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of driver trips
 */
router.get('/driver', authenticateToken, requireRole(['DRIVER']), getDriverTrips);

/**
 * @swagger
 * /api/trips/customer:
 *   get:
 *     summary: Get customer's trips
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customer trips
 */
router.get('/customer', authenticateToken, requireRole(['CUSTOMER']), getCustomerTrips);

/**
 * @swagger
 * /api/trips/{tripId}/accept:
 *   post:
 *     summary: Driver accepts trip
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip accepted
 */
router.post('/:tripId/accept', authenticateToken, requireRole(['DRIVER']), acceptTrip);

/**
 * @swagger
 * /api/trips/{tripId}/complete:
 *   post:
 *     summary: Driver completes trip
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip completed
 */
router.post('/:tripId/complete', authenticateToken, requireRole(['DRIVER']), completeTrip);

/**
 * @swagger
 * /api/trips/{tripId}/cancel:
 *   post:
 *     summary: Cancel trip
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip cancelled
 */
router.post('/:tripId/cancel', authenticateToken, requireRole(['DRIVER']), cancelTrip);

/**
 * @swagger
 * /api/trips/{tripId}/status:
 *   put:
 *     summary: Update trip status
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
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
 *                 enum: [UPCOMING, ONGOING, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/:tripId/status', authenticateToken, updateTripStatus);

/**
 * @swagger
 * /api/trips/upcoming:
 *   get:
 *     summary: Get upcoming trips (Admin)
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of upcoming trips
 */
router.get('/upcoming', authenticateToken, requireRole(['ADMIN']), getUpcomingTrips);

/**
 * @swagger
 * /api/trips/completed:
 *   get:
 *     summary: Get completed trips (Admin)
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of completed trips
 */
router.get('/completed', authenticateToken, requireRole(['ADMIN']), getCompletedTrips);

export default router;