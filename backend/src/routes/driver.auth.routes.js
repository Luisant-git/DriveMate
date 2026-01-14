import express from 'express';
import { driverRegister, driverLogin } from '../controllers/driver.auth.controller.js';

const router = express.Router();

router.post('/register', driverRegister);
router.post('/login', driverLogin);

export default router;
