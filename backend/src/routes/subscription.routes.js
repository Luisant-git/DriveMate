import express from 'express';
import {
  createSubscriptionPlan,
  getSubscriptionPlans,
  purchaseSubscription,
  getDriverSubscription,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
} from '../controllers/subscription.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/subscriptions/plans:
 *   post:
 *     summary: Create subscription plan (Admin)
 *     tags: [Subscription]
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
 *               - duration
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Monthly Plan"
 *               duration:
 *                 type: integer
 *                 example: 30
 *                 description: Duration in days
 *               price:
 *                 type: number
 *                 example: 999
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Plan created successfully
 */
router.post('/plans', authenticateToken, requireRole(['ADMIN']), createSubscriptionPlan);

/**
 * @swagger
 * /api/subscriptions/plans:
 *   get:
 *     summary: Get all subscription plans
 *     tags: [Subscription]
 *     responses:
 *       200:
 *         description: List of subscription plans
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
 *                   duration:
 *                     type: integer
 *                   price:
 *                     type: number
 */
router.get('/plans', getSubscriptionPlans);

/**
 * @swagger
 * /api/subscriptions/purchase:
 *   post:
 *     summary: Purchase subscription (Driver)
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subscription purchased
 */


router.post('/purchase', authenticateToken, requireRole(['DRIVER']), purchaseSubscription);
/**
 * @swagger
 * /api/subscriptions/plans/{id}:
 *   put:
 *     summary: Update subscription plan (Admin)
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               duration:
 *                 type: integer
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Plan updated successfully
 */
router.put(
  '/plans/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  updateSubscriptionPlan
);

/**
 * @swagger
 * /api/subscriptions/plans/{id}:
 *   delete:
 *     summary: Delete subscription plan (Admin)
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Plan deleted successfully
 */
router.delete(
  '/plans/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  deleteSubscriptionPlan
);

/**
 * @swagger
 * /api/subscriptions/driver:
 *   get:
 *     summary: Get driver's subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver subscription details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [ACTIVE, EXPIRED, CANCELLED]
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 */
router.get('/driver', authenticateToken, requireRole(['DRIVER']), getDriverSubscription);

export default router;