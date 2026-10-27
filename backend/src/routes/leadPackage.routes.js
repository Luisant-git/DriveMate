import express from 'express';
import prisma from '../config/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const packages = await prisma.leadSubscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });
    res.json({ success: true, packages, plans: packages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
