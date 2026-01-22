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
    const { planId } = req.body;
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