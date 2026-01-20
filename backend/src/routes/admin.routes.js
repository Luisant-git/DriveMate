import express from 'express';
import {
  getAllDrivers,
  approveDriver,
  rejectDriver,
  getAllRides,
  getAnalytics,
  findNearestDrivers,
} from '../controllers/admin.controller.js';
import { updateDriverStatus } from '../controllers/driver.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/admin/drivers:
 *   get:
 *     summary: Get all drivers
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all drivers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Driver'
 */
router.get('/drivers', authenticateToken, requireRole(['ADMIN']), getAllDrivers);

/**
 * @swagger
 * /api/admin/drivers/{driverId}/approve:
 *   put:
 *     summary: Approve driver registration
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Driver approved
 */
router.put('/drivers/:driverId/approve', authenticateToken, requireRole(['ADMIN']), approveDriver);

/**
 * @swagger
 * /api/admin/drivers/{driverId}/reject:
 *   put:
 *     summary: Reject driver registration
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Driver rejected
 */
router.put('/drivers/:driverId/reject', authenticateToken, requireRole(['ADMIN']), rejectDriver);

/**
 * @swagger
 * /api/admin/drivers/{driverId}/status:
 *   put:
 *     summary: Update driver status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
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
 *                 enum: [PENDING, APPROVED, REJECTED, SUSPENDED]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/drivers/:driverId/status', authenticateToken, requireRole(['ADMIN']), updateDriverStatus);

/**
 * @swagger
 * /api/admin/rides:
 *   get:
 *     summary: Get all rides
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all rides
 */
router.get('/rides', authenticateToken, requireRole(['ADMIN']), getAllRides);

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get platform analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data
 */
router.get('/analytics', authenticateToken, requireRole(['ADMIN']), getAnalytics);

/**
 * @swagger
 * /api/admin/drivers/nearby:
 *   get:
 *     summary: Find nearest drivers
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 5
 *     responses:
 *       200:
 *         description: List of nearby drivers
 */
router.get('/drivers/nearby', authenticateToken, requireRole(['ADMIN']), findNearestDrivers);

export default router;