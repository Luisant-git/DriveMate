import express from 'express';
import { geocodeAddress, getDirections, findNearbyDrivers, getPlaceAutocomplete } from '../controllers/maps.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/maps/geocode:
 *   get:
 *     summary: Geocode an address to coordinates
 *     tags: [Maps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         example: "Bangalore, Karnataka"
 *     responses:
 *       200:
 *         description: Geocoded coordinates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 latitude:
 *                   type: number
 *                 longitude:
 *                   type: number
 */
router.get('/geocode', authenticateToken, geocodeAddress);

/**
 * @swagger
 * /api/maps/autocomplete:
 *   get:
 *     summary: Get place autocomplete suggestions
 *     tags: [Maps]
 *     parameters:
 *       - in: query
 *         name: input
 *         required: true
 *         schema:
 *           type: string
 *         example: "Bangalore"
 *     responses:
 *       200:
 *         description: List of place suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   description:
 *                     type: string
 *                   place_id:
 *                     type: string
 */
router.get('/autocomplete', getPlaceAutocomplete);

/**
 * @swagger
 * /api/maps/directions:
 *   get:
 *     summary: Get directions between two points
 *     tags: [Maps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: destination
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Route directions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 distance:
 *                   type: number
 *                 duration:
 *                   type: number
 *                 route:
 *                   type: array
 */
router.get('/directions', authenticateToken, getDirections);

/**
 * @swagger
 * /api/maps/nearby-drivers:
 *   get:
 *     summary: Find nearby drivers
 *     tags: [Maps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 5
 *     responses:
 *       200:
 *         description: List of nearby drivers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Driver'
 */
router.get('/nearby-drivers', authenticateToken, findNearbyDrivers);

export default router;