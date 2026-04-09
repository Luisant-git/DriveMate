import express from 'express';
import { customerLoginOtp, customerDriverAssigned, driverBookingAssignment, driverBookingConfirmation, tripCompletedNotification, leadBookingAssignment, leadBookingConfirmation } from '../controllers/whatsapp.controller.js';

const router = express.Router();

router.post('/customer-login-otp', customerLoginOtp);
router.post('/customer-driver-assigned', customerDriverAssigned);
router.post('/driver-booking-assignment', driverBookingAssignment);
router.post('/driver-booking-confirmation', driverBookingConfirmation);
router.post('/lead-booking-assignment', leadBookingAssignment);
router.post('/lead-booking-confirmation', leadBookingConfirmation);
router.post('/trip-completed-notification', tripCompletedNotification);

export default router;