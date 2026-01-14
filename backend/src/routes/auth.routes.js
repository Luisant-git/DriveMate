import express from 'express';
import { register, login, sendOTP, verifyOTP, logout, getProfile, updateProfile } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/sessionAuth.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register admin account
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - phone
 *               - password
 *               - name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@drivemate.com
 *               phone:
 *                 type: string
 *                 example: "1234567890"
 *               password:
 *                 type: string
 *                 example: admin123
 *               name:
 *                 type: string
 *                 example: Admin User
 *               role:
 *                 type: string
 *                 enum: [ADMIN]
 *                 example: ADMIN
 *     responses:
 *       201:
 *         description: Admin registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                       example: ADMIN
 *                     phone:
 *                       type: string
 *       400:
 *         description: Bad request
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Admin login with username/email and password
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 description: Admin email or username
 *                 example: admin@drivemate.com
 *               password:
 *                 type: string
 *                 example: admin123
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
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                       example: ADMIN
 *                     phone:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/logout', logout);
router.get('/profile', requireAuth, getProfile);
router.get('/me', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);

export default router;