import express from 'express';
import { calculateDistance } from '../controllers/distance.controller.js';

const router = express.Router();

router.get('/calculate', calculateDistance);

export default router;
