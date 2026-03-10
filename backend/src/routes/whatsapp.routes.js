import express from 'express';
import { sendTemplate } from '../controllers/whatsapp.controller.js';

const router = express.Router();

router.post('/driver-booking-assignment', sendTemplate);

export default router;