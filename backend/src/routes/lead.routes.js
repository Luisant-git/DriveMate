import express from 'express';
import { registerLead, loginLead, getAllLeads, updateLeadStatus, updateLeadProfile, getLeadCountByType } from '../controllers/lead.controller.js';
import { authenticateLead } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerLead);
router.post('/login', loginLead);
router.get('/', getAllLeads);
router.patch('/:id/status', updateLeadStatus);
router.patch('/profile', authenticateLead, updateLeadProfile);
router.get('/count-by-type/:packageType', getLeadCountByType);

export default router;
