import prisma from '../config/database.js';

export const createSubscriptionPlan = async (req, res) => {
  try {
    const { name, duration, price, description } = req.body;

    const plan = await prisma.subscriptionPlan.create({
      data: { name, duration, price, description },
    });

    res.status(201).json(plan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
    });

    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const purchaseSubscription = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.userId;

    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);

    // Cancel existing subscription
    await prisma.subscription.updateMany({
      where: { driverId: driver.id },
      data: { status: 'CANCELLED' },
    });

    const subscription = await prisma.subscription.create({
      data: {
        driverId: driver.id,
        planId,
        startDate,
        endDate,
        amount: plan.price,
      },
      include: { plan: true },
    });

    res.status(201).json(subscription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getDriverSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;

    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    const subscription = await prisma.subscription.findFirst({
      where: {
        driverId: driver.id,
        status: 'ACTIVE',
      },
      include: { plan: true },
    });

    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};