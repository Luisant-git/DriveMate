import express from 'express';
import {
  registerDriver,
  updateDriverLocation,
  toggleOnlineStatus,
  getDriverProfile,
  updateDriverPackage,
  getAvailableDriversByPackage,
  getAllDrivers,
  getDriverCountByType,
} from '../controllers/driver.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { requireAuth } from '../middleware/sessionAuth.js';

const router = express.Router();

/**
 * @swagger
 * /api/drivers/register:
 *   post:
 *     summary: Register driver (deprecated - use /api/driver-auth/register)
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Driver registered
 */
router.post('/register', authenticateToken, requireRole(['DRIVER']), registerDriver);

/**
 * @swagger
 * /api/drivers/location:
 *   put:
 *     summary: Update driver location
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 12.9716
 *               longitude:
 *                 type: number
 *                 example: 77.5946
 *     responses:
 *       200:
 *         description: Location updated
 */
router.put('/location', authenticateToken, requireRole(['DRIVER']), updateDriverLocation);

/**
 * @swagger
 * /api/drivers/status:
 *   put:
 *     summary: Toggle driver online/offline status
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isOnline:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/status', authenticateToken, requireRole(['DRIVER']), toggleOnlineStatus);

/**
 * @swagger
 * /api/drivers/profile:
 *   get:
 *     summary: Get driver profile
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Driver'
 */
router.get('/profile', authenticateToken, requireRole(['DRIVER']), getDriverProfile);

/**
 * @swagger
 * /api/drivers/package:
 *   put:
 *     summary: Update driver package type
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               packageType:
 *                 type: string
 *                 enum: [LOCAL, OUTSTATION, ALL_PREMIUM]
 *     responses:
 *       200:
 *         description: Package updated
 */
router.put('/package', requireAuth, updateDriverPackage);

/**
 * @swagger
 * /api/drivers/available/{packageId}:
 *   get:
 *     summary: Get available drivers by package ID
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: packageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of available drivers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Driver'
 */
router.get('/available/:packageId', requireAuth, getAvailableDriversByPackage);

router.get('/count-by-type/:packageType', requireAuth, getDriverCountByType);

/**
 * @swagger
 * /api/drivers:
 *   get:
 *     summary: Get all drivers
 *     tags: [Driver]
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
router.get('/', getAllDrivers);

export default router;