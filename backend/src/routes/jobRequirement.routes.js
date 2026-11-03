import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  createJobRequirement,
  getMyJobRequirements,
  getAllJobRequirements,
  deleteJobRequirement,
  adminGetAllJobs,
  adminUpdateJobStatus,
  adminDeleteJob,
} from '../controllers/jobRequirement.controller.js';

const router = express.Router();

// Public — anyone can browse
router.get('/', getAllJobRequirements);

// Customer-authenticated routes
router.post('/', authenticateToken, createJobRequirement);
router.get('/mine', authenticateToken, getMyJobRequirements);
router.delete('/:id', authenticateToken, deleteJobRequirement);

// Admin-only routes
router.get('/admin/all', authenticateToken, requireRole(['ADMIN']), adminGetAllJobs);
router.patch('/admin/:id/status', authenticateToken, requireRole(['ADMIN']), adminUpdateJobStatus);
router.delete('/admin/:id', authenticateToken, requireRole(['ADMIN']), adminDeleteJob);

export default router;
