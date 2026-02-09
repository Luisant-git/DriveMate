import prisma from '../config/database.js';

// Helper function to update expired subscriptions
const updateExpiredSubscriptions = async (driverId = null) => {
  const whereClause = {
    status: 'ACTIVE',
    endDate: {
      lt: new Date()
    }
  };
  
  if (driverId) {
    whereClause.driverId = driverId;
  }
  
  await prisma.subscription.updateMany({
    where: whereClause,
    data: {
      status: 'EXPIRED'
    }
  });
};

export const createSubscriptionPlan = async (req, res) => {
  try {
    const { name, duration, price, description ,type} = req.body;

    const plan = await prisma.subscriptionPlan.create({
      data: { name, duration, price, description, type },
    });

    res.status(201).json(plan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: {
        price: 'asc',   
      },
    });

    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSubscriptionPlan = async (req, res) => {
  try {
    const id = (req.params.id);
    const { name, duration, price, description, type, isActive } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (duration !== undefined) updateData.duration = duration;
    if (price !== undefined) updateData.price = price;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (isActive !== undefined) updateData.isActive = isActive;

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: updateData,
    });

    res.json(plan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


export const deleteSubscriptionPlan = async (req, res) => {
  try {
    const id = req.params.id; 

    await prisma.subscriptionPlan.update({
      where: { id }, 
      data: { isActive: false },
    });

    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
export const purchaseSubscription = async (req, res) => {
  try {
    const { planId, paymentMethod } = req.body;
    const driverId = req.user.userId;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);

    // Cancel existing active subscriptions
    await prisma.subscription.updateMany({
      where: { 
        driverId,
        status: 'ACTIVE'
      },
      data: { status: 'CANCELLED' },
    });

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        driverId,
        planId,
        startDate,
        endDate,
        amount: plan.price,
        paymentMethod,
        status: 'ACTIVE',
      },
      include: { plan: true },
    });

    res.status(201).json(subscription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getActivePackagesForDrivers = async (req, res) => {
  try {
    const packages = await prisma.subscriptionPlan.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        price: 'asc'
      }
    });

    res.json({ success: true, packages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllSubscriptions = async (req, res) => {
  try {
    // Update expired subscriptions
    await updateExpiredSubscriptions();

    const subscriptions = await prisma.subscription.findMany({
      include: {
        driver: {
          select: {
            name: true,
            phone: true
          }
        },
        plan: true
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    res.json({ success: true, subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const rejectSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await prisma.subscription.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: {
        driver: {
          select: {
            name: true,
            phone: true
          }
        },
        plan: true
      }
    });

    res.json({ success: true, subscription });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getDriverSubscription = async (req, res) => {
  try {
    const driverId = req.user.userId;

    // Update expired subscriptions for this driver
    await updateExpiredSubscriptions(driverId);

    const subscription = await prisma.subscription.findFirst({
      where: {
        driverId,
        status: 'ACTIVE',
      },
      include: { plan: true },
    });

    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const adminCreateSubscription = async (req, res) => {
  try {
    const { driverId, planId, paidAmount, paymentMethod } = req.body;

    if (!driverId || !planId || !paidAmount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    const paid = parseFloat(paidAmount);
    if (paid <= 0 || paid > plan.price) {
      return res.status(400).json({ success: false, error: 'Invalid paid amount' });
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);

    // Cancel existing active subscriptions
    await prisma.subscription.updateMany({
      where: { driverId, status: 'ACTIVE' },
      data: { status: 'CANCELLED' }
    });

    const subscription = await prisma.subscription.create({
      data: {
        driverId,
        planId,
        startDate,
        endDate,
        amount: plan.price,
        paidAmount: paid,
        remainingAmount: plan.price - paid,
        paymentMethod: paymentMethod || 'CASH',
        isAdminCreated: true,
        status: 'ACTIVE'
      },
      include: { plan: true, driver: true }
    });

    res.json({ success: true, subscription });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateSubscriptionPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { additionalPayment } = req.body;

    if (!additionalPayment || additionalPayment <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid payment amount' });
    }

    const subscription = await prisma.subscription.findUnique({ where: { id } });
    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Subscription not found' });
    }

    const newPaidAmount = (subscription.paidAmount || 0) + parseFloat(additionalPayment);
    const newRemainingAmount = subscription.amount - newPaidAmount;

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount > 0 ? newRemainingAmount : 0
      },
      include: { plan: true, driver: true }
    });

    res.json({ success: true, subscription: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};