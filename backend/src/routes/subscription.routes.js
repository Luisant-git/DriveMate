import express from 'express';
import {
  createSubscriptionPlan,
  getSubscriptionPlans,
  purchaseSubscription,
  getDriverSubscription,
} from '../controllers/subscription.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/plans', authenticateToken, requireRole(['ADMIN']), createSubscriptionPlan);
router.get('/plans', getSubscriptionPlans);
router.post('/purchase', authenticateToken, requireRole(['DRIVER']), purchaseSubscription);
router.get('/driver', authenticateToken, requireRole(['DRIVER']), getDriverSubscription);

export default router;