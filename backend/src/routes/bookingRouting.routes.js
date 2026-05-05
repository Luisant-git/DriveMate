import express from 'express';
import { getAllRoutingConfigs, createRoutingConfig, updateRoutingConfig, deleteRoutingConfig } from '../controllers/bookingRouting.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getAllRoutingConfigs);
router.post('/', authenticateToken, createRoutingConfig);
router.put('/:id', authenticateToken, updateRoutingConfig);
router.delete('/:id', authenticateToken, deleteRoutingConfig);

export default router;
