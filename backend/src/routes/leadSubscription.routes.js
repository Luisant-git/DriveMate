import express from 'express';
import { getAllLeadPlans, createLeadPlan, updateLeadPlan, createLeadSubscription, getLeadSubscriptions, purchaseLeadSubscription, rejectLeadSubscription, adminCreateLeadSubscription, adminUpdateLeadPayment } from '../controllers/leadSubscription.controller.js';
import { authenticateLead, authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/plans', getAllLeadPlans);
router.post('/plans', createLeadPlan);
router.put('/plans/:id', updateLeadPlan);
router.post('/', createLeadSubscription);
router.get('/my-subscriptions', authenticateLead, getLeadSubscriptions);
router.post('/purchase', authenticateLead, purchaseLeadSubscription);
router.put('/reject/:id', rejectLeadSubscription);
router.post('/admin/create', authenticateToken, requireRole(['ADMIN']), adminCreateLeadSubscription);
router.put('/admin/update-payment/:id', authenticateToken, requireRole(['ADMIN']), adminUpdateLeadPayment);

export default router;
