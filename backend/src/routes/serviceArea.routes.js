import express from 'express';
import { getAllServiceAreas, createServiceArea, updateServiceArea, deleteServiceArea, checkServiceAvailability } from '../controllers/serviceArea.controller.js';

const router = express.Router();

router.get('/', getAllServiceAreas);
router.post('/', createServiceArea);
router.put('/:id', updateServiceArea);
router.delete('/:id', deleteServiceArea);
router.get('/check', checkServiceAvailability);

export default router;
