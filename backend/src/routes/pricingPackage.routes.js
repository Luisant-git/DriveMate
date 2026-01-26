import express from 'express';
import { getAllPricingPackages, createPricingPackage, updatePricingPackage, deletePricingPackage, getEstimateByPackage } from '../controllers/pricingPackage.controller.js';

const router = express.Router();

router.get('/', getAllPricingPackages);
router.get('/estimate', getEstimateByPackage);
router.post('/', createPricingPackage);
router.put('/:id', updatePricingPackage);
router.delete('/:id', deletePricingPackage);

export default router;
