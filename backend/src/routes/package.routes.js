import express from 'express';
import {
  createPackage,
  getPackages,
  updatePackage,
  deletePackage,
} from '../controllers/package.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/packages:
 *   post:
 *     summary: Create a new package (Admin)
 *     tags: [Package]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - duration
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: "4 Hour Package"
 *               type:
 *                 type: string
 *                 enum: [LOCAL, OUTSTATION, ALL_PREMIUM]
 *               duration:
 *                 type: string
 *                 example: "hourly"
 *               price:
 *                 type: number
 *                 example: 500
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Package created successfully
 */
router.post('/', authenticateToken, requireRole(['ADMIN']), createPackage);

/**
 * @swagger
 * /api/packages:
 *   get:
 *     summary: Get all packages
 *     tags: [Package]
 *     responses:
 *       200:
 *         description: List of packages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   type:
 *                     type: string
 *                   price:
 *                     type: number
 */
router.get('/', getPackages);

/**
 * @swagger
 * /api/packages/{packageId}:
 *   put:
 *     summary: Update package (Admin)
 *     tags: [Package]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: packageId
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
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Package updated
 */
router.put('/:packageId', authenticateToken, requireRole(['ADMIN']), updatePackage);

/**
 * @swagger
 * /api/packages/{packageId}:
 *   delete:
 *     summary: Delete package (Admin)
 *     tags: [Package]
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
 *         description: Package deleted
 */
router.delete('/:packageId', authenticateToken, requireRole(['ADMIN']), deletePackage);

export default router;