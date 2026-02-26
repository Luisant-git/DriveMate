import prisma from '../config/database.js';

export const getAllLeadPlans = async (req, res) => {
  try {
    const plans = await prisma.leadSubscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });
    res.json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createLeadPlan = async (req, res) => {
  try {
    const { name, duration, price, description, type } = req.body;
    
    const plan = await prisma.leadSubscriptionPlan.create({
      data: { name, duration: parseInt(duration), price: parseFloat(price), description, type }
    });
    
    res.status(201).json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateLeadPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration, price, description, type, isActive } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (duration !== undefined) updateData.duration = parseInt(duration);
    if (price !== undefined) updateData.price = parseFloat(price);
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const plan = await prisma.leadSubscriptionPlan.update({
      where: { id },
      data: updateData
    });
    
    res.json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createLeadSubscription = async (req, res) => {
  try {
    const { leadId, planId, amount, paidAmount, paymentMethod } = req.body;
    
    const plan = await prisma.leadSubscriptionPlan.findUnique({ where: { id: planId } });
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);
    
    const subscription = await prisma.leadSubscription.create({
      data: {
        leadId,
        planId,
        amount: parseFloat(amount),
        paidAmount: parseFloat(paidAmount || 0),
        remainingAmount: parseFloat(amount) - parseFloat(paidAmount || 0),
        paymentMethod,
        startDate,
        endDate,
        isAdminCreated: true
      }
    });
    
    res.status(201).json({ success: true, subscription });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getLeadSubscriptions = async (req, res) => {
  try {
    const leadId = req.user.id;
    
    const subscriptions = await prisma.leadSubscription.findMany({
      where: { leadId },
      include: { plan: true },
      orderBy: { startDate: 'desc' }
    });
    
    res.json({ success: true, subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const purchaseLeadSubscription = async (req, res) => {
  try {
    const leadId = req.user.id;
    const { planId, paymentMethod } = req.body;
    
    const plan = await prisma.leadSubscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }
    
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);
    
    const subscription = await prisma.leadSubscription.create({
      data: {
        leadId,
        planId,
        amount: plan.price,
        paidAmount: plan.price,
        remainingAmount: 0,
        paymentMethod,
        startDate,
        endDate,
        status: 'ACTIVE'
      },
      include: { plan: true }
    });
    
    res.status(201).json({ success: true, subscription });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const rejectLeadSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subscription = await prisma.leadSubscription.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: {
        lead: { select: { name: true, phone: true } },
        plan: true
      }
    });
    
    res.json({ success: true, subscription });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const adminCreateLeadSubscription = async (req, res) => {
  try {
    const { leadId, planId, paidAmount, paymentMethod } = req.body;
    
    const plan = await prisma.leadSubscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }
    
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);
    const paid = parseFloat(paidAmount);
    const remaining = plan.price - paid;
    
    // Cancel existing active subscriptions
    await prisma.leadSubscription.updateMany({
      where: { leadId, status: 'ACTIVE' },
      data: { status: 'CANCELLED' }
    });
    
    const subscription = await prisma.leadSubscription.create({
      data: {
        leadId,
        planId,
        amount: plan.price,
        paidAmount: paid,
        remainingAmount: remaining,
        paymentMethod,
        startDate,
        endDate,
        status: 'ACTIVE',
        isAdminCreated: true
      },
      include: {
        lead: { select: { name: true, phone: true } },
        plan: true
      }
    });
    
    res.status(201).json({ success: true, subscription });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const adminUpdateLeadPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { additionalPayment } = req.body;
    
    const subscription = await prisma.leadSubscription.findUnique({ where: { id } });
    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Subscription not found' });
    }
    
    const newPaidAmount = subscription.paidAmount + parseFloat(additionalPayment);
    const newRemainingAmount = subscription.amount - newPaidAmount;
    
    const updated = await prisma.leadSubscription.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount
      },
      include: {
        lead: { select: { name: true, phone: true } },
        plan: true
      }
    });
    
    res.json({ success: true, subscription: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
