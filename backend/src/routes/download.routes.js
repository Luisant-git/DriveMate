import express from 'express';
import { downloadDriverInfo } from '../controllers/download.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/driver/:driverId', authenticateToken, requireRole(['CUSTOMER', 'ADMIN']), downloadDriverInfo);

export default router;