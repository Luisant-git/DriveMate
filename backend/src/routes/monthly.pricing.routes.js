import express from 'express';
import { getAllMonthlyPricing, createMonthlyPricing, updateMonthlyPricing, deleteMonthlyPricing } from '../controllers/monthly.pricing.controller.js';

const router = express.Router();

router.get('/', getAllMonthlyPricing);
router.post('/', createMonthlyPricing);
router.put('/:id', updateMonthlyPricing);
router.delete('/:id', deleteMonthlyPricing);

export default router;
