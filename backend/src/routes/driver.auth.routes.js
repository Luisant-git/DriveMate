import express from 'express';
import { driverRegister, driverLogin } from '../controllers/driver.auth.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/driver/auth/register:
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
 *               altPhone:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["9876543211", "9876543212"]
 *               upiId:
 *                 type: string
 *                 example: "driver@upi"
 *               photo:
 *                 type: string
 *                 example: "https://example.com/photo.jpg"
 *               dlPhoto:
 *                 type: string
 *                 example: "https://example.com/dl.jpg"
 *               panPhoto:
 *                 type: string
 *                 example: "https://example.com/pan.jpg"
 *               aadharPhoto:
 *                 type: string
 *                 example: "https://example.com/aadhar.jpg"
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
 * /api/driver/auth/login:
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
 *               - phone
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9078654321"
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
