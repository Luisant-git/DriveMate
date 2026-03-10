import express from 'express';
import { driverBookingAssignment } from '../controllers/whatsapp.controller.js';

const router = express.Router();

router.post('/driver-booking-assignment', driverBookingAssignment);

export default router;