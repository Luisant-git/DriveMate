import express from 'express';
import { customerLoginOtp, customerDriverAssigned, driverBookingAssignment, driverBookingConfirmation } from '../controllers/whatsapp.controller.js';

const router = express.Router();

router.post('/customer-login-otp', customerLoginOtp);
router.post('/customer-driver-assigned', customerDriverAssigned);
router.post('/driver-booking-assignment', driverBookingAssignment);
router.post('/driver-booking-confirmation', driverBookingConfirmation);

export default router;