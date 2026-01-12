import express from 'express';
import { geocodeAddress, getDirections, findNearbyDrivers, getPlaceAutocomplete } from '../controllers/maps.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/geocode', authenticateToken, geocodeAddress);
router.get('/autocomplete', getPlaceAutocomplete);
router.get('/directions', authenticateToken, getDirections);
router.get('/nearby-drivers', authenticateToken, findNearbyDrivers);

export default router;