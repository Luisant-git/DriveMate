import express from 'express';
import { driverRegister, driverLogin } from '../controllers/driver.auth.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/driver-auth/register:
 *   post:
 *     summary: Register a new driver
 *     tags: [Driver Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - password
 *               - aadharNo
 *               - licenseNo
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Driver"
 *               email:
 *                 type: string
 *                 example: "driver@example.com"
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               aadharNo:
 *                 type: string
 *                 example: "123456789012"
 *               licenseNo:
 *                 type: string
 *                 example: "DL1234567890"
 *               vehicleNo:
 *                 type: string
 *                 example: "KA01AB1234"
 *               vehicleType:
 *                 type: string
 *                 example: "Sedan"
 *     responses:
 *       201:
 *         description: Driver registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 driver:
 *                   $ref: '#/components/schemas/Driver'
 */
router.post('/register', driverRegister);

/**
 * @swagger
 * /api/driver-auth/login:
 *   post:
 *     summary: Driver login
 *     tags: [Driver Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "driver@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 driver:
 *                   $ref: '#/components/schemas/Driver'
 */
router.post('/login', driverLogin);

export default router;
