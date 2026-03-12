import express from 'express';
import { registerLead, loginLead, getAllLeads, updateLeadStatus, updateLeadProfile, getLeadCountByType, getLeadCountByPackage } from '../controllers/lead.controller.js';
import { authenticateLead, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerLead);
router.post('/login', loginLead);
router.get('/', getAllLeads);
router.patch('/:id/status', updateLeadStatus);
router.patch('/profile', authenticateLead, updateLeadProfile);
router.get('/count-by-type/:packageType', authenticateToken, getLeadCountByType);
router.get('/count-by-package/:packageId', authenticateToken, getLeadCountByPackage);

export default router;
