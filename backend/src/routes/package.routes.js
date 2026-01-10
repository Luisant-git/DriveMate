import express from 'express';
import {
  createPackage,
  getPackages,
  updatePackage,
  deletePackage,
} from '../controllers/package.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, requireRole(['ADMIN']), createPackage);
router.get('/', getPackages);
router.put('/:packageId', authenticateToken, requireRole(['ADMIN']), updatePackage);
router.delete('/:packageId', authenticateToken, requireRole(['ADMIN']), deletePackage);

export default router;