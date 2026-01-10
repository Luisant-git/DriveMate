import express from 'express';
import { register, login, sendOTP, verifyOTP, logout, getProfile } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/logout', logout);
router.get('/profile', authenticateToken, getProfile);

export default router;