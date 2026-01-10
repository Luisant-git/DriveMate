import express from 'express';
import { register, login, sendOTP, verifyOTP, logout, getProfile, updateProfile } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/sessionAuth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/logout', logout);
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);

export default router;