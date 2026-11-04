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

  const maxDutiesWhere = {
    status: 'ACTIVE',
    maxDuties: { gt: 0 }
  };
  if (driverId) {
    maxDutiesWhere.driverId = driverId;
  }

  const activeSubs = await prisma.subscription.findMany({ where: maxDutiesWhere });
  const expiredIds = activeSubs.filter(s => s.dutiesCompleted >= s.maxDuties).map(s => s.id);

  if (expiredIds.length > 0) {
    await prisma.subscription.updateMany({
      where: { id: { in: expiredIds } },
      data: { status: 'EXPIRED' }
    });
  }

  // ── Auto-deactivate overdue partial payments (5-day limit exceeded) ──
  const overdueWhere = {
    status: 'ACTIVE',
    paymentStatus: 'PARTIAL',
    paymentDueDate: { lt: new Date() }
  };
  if (driverId) overdueWhere.driverId = driverId;

  await prisma.subscription.updateMany({
    where: overdueWhere,
    data: { status: 'CANCELLED', paymentStatus: 'OVERDUE' }
  });
};

const VALID_CATEGORIES = ['Silver', 'Gold', 'Platinum', 'Diamond'];

export const createSubscriptionPlan = async (req, res) => {
  try {
    const { category, name, duration, price, description, type, maxDuties, excessAmountPerRide, minHours, extraPerHourRate } = req.body;

    const planCategory = VALID_CATEGORIES.includes(category) ? category : 'Silver';

    const plan = await prisma.subscriptionPlan.create({
      data: {
        category: planCategory,
        name,
        duration,
        price,
        description,
        type,
        maxDuties: maxDuties || 0,
        excessAmountPerRide: excessAmountPerRide !== undefined ? parseFloat(excessAmountPerRide) : 0,
        minHours: minHours !== undefined ? parseInt(minHours) : 0,
        extraPerHourRate: extraPerHourRate !== undefined ? parseFloat(extraPerHourRate) : 0,
      },
    });

    res.status(201).json(plan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getPlanSortValue = (plan) => {
  const lowerName = (plan.category || plan.name || '').toLowerCase();
  if (lowerName.includes('silver')) return 1;
  if (lowerName.includes('gold')) return 2;
  if (lowerName.includes('platinum')) return 3;
  if (lowerName.includes('diamond')) return 4;
  return 99;
};

const sortPlans = (plans) => {
  return plans.sort((a, b) => {
    const tierA = getPlanSortValue(a);
    const tierB = getPlanSortValue(b);

    if (tierA !== tierB) return tierA - tierB;
    if (a.duration !== b.duration) return (a.duration || 0) - (b.duration || 0);
    if (a.maxDuties !== undefined && b.maxDuties !== undefined && a.maxDuties !== b.maxDuties) {
      return (a.maxDuties || 0) - (b.maxDuties || 0);
    }
    return (a.price || 0) - (b.price || 0);
  });
};

export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany();

    const sortedPlans = sortPlans(plans);

    res.json(sortedPlans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSubscriptionPlan = async (req, res) => {
  try {
    const id = (req.params.id);
    const { category, name, duration, price, description, type, isActive, maxDuties, excessAmountPerRide } = req.body;

    const updateData = {};
    if (category !== undefined) updateData.category = VALID_CATEGORIES.includes(category) ? category : 'Silver';
    if (name !== undefined) updateData.name = name;
    if (duration !== undefined) updateData.duration = duration;
    if (price !== undefined) updateData.price = price;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (maxDuties !== undefined) updateData.maxDuties = maxDuties;
    if (excessAmountPerRide !== undefined) updateData.excessAmountPerRide = parseFloat(excessAmountPerRide);
    const { minHours, extraPerHourRate } = req.body;
    if (minHours !== undefined) updateData.minHours = parseInt(minHours);
    if (extraPerHourRate !== undefined) updateData.extraPerHourRate = parseFloat(extraPerHourRate);

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
    const { planId, paymentMethod, paidAmount } = req.body;
    const driverId = req.user.userId;

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const paid = paidAmount !== undefined ? parseFloat(paidAmount) : plan.price;
    if (isNaN(paid) || paid <= 0) return res.status(400).json({ error: 'Invalid paid amount' });
    if (paid > plan.price) return res.status(400).json({ error: `Paid amount cannot exceed plan price ₹${plan.price}` });

    const isPartial = paid < plan.price;
    const remaining = isPartial ? parseFloat((plan.price - paid).toFixed(2)) : 0;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);
    const paymentDueDate = isPartial ? new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000) : null;

    // Cancel existing active subscription of the same planId if any
    await prisma.subscription.updateMany({
      where: { driverId, planId, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    });

    const subscription = await prisma.subscription.create({
      data: {
        driverId,
        planId,
        startDate,
        endDate,
        amount: plan.price,
        paidAmount: paid,
        remainingAmount: remaining,
        paymentMethod: paymentMethod || 'CASH',
        paymentStatus: isPartial ? 'PARTIAL' : 'PAID',
        paymentDueDate,
        status: 'ACTIVE',
        maxDuties: plan.maxDuties || 0,
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
      }
    });

    const sortedPackages = sortPlans(packages);

    res.json({ success: true, packages: sortedPackages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── Excess amount (admin cut per completed ride) ──────────────────────
// Single source of truth used by the admin ledger, the settlement endpoint
// and the driver subscription responses.
//   rate  → SubscriptionPlan.excessAmountPerRide (set in Admin → Packages)
//   total → amount recorded on each completed ride (Booking.adminCommission)
//           falling back to rate × rides for rows completed before the field existed
//   due   → total − already collected
// Queries attach _totalAdminCommission / _completedRidesCount to avoid N+1 lookups.
export const resolveExcess = (sub) => {
  if (!sub) return { perRide: 0, rides: 0, total: 0, paid: 0, due: 0 };
  const perRide = sub.plan?.excessAmountPerRide || 0;
  const rides = sub._completedRidesCount !== undefined
    ? sub._completedRidesCount
    : (sub.dutiesCompleted || 0);
  const recorded = sub._totalAdminCommission || 0;
  const total = recorded > 0 ? recorded : perRide * rides;
  const paid = sub.commissionPaid || 0;
  return { perRide, rides, total, paid, due: Math.max(0, total - paid) };
};

// A plan that was rejected or cancelled never granted duties, so no completed
// ride can be charged against it. Only ACTIVE / EXPIRED plans accrue excess.
const DELIVERED_PLAN_STATUSES = ['ACTIVE', 'EXPIRED'];
export const isPlanDelivered = (status) =>
  DELIVERED_PLAN_STATUSES.includes(String(status || '').toUpperCase());

export const attachExcessData = (sub) => {
  if (!sub) return sub;
  const { perRide, rides, total, paid, due } = resolveExcess(sub);
  // Strip internal fields so they don't leak into the API response
  const { _totalAdminCommission, _completedRidesCount, ...rest } = sub;
  return {
    ...rest,
    excessPerRide: perRide,
    dutiesCompleted: rides,
    totalExcess: total,
    excessPaid: paid,
    excessDue: due,
  };
};
export const getAllSubscriptions = async (req, res) => {
  try {
    // Update expired subscriptions
    await updateExpiredSubscriptions();

    const subscriptions = await prisma.subscription.findMany({
      include: {
        driver: {
          select: { name: true, phone: true }
        },
        plan: true
      },
      orderBy: { startDate: 'desc' }
    });

    // For each subscription, sum adminCommission from completed bookings
    // that fall within the subscription period for that driver
    const enriched = await Promise.all(subscriptions.map(async (sub) => {
      // Rejected / cancelled plans never accrued any excess amount
      if (!isPlanDelivered(sub.status)) {
        return { ...sub, _totalAdminCommission: 0, _completedRidesCount: 0 };
      }
      const completedBookings = await prisma.booking.findMany({
        where: {
          driverId: sub.driverId,
          status: 'COMPLETED',
          completedAt: {
            gte: sub.startDate,
            lte: sub.endDate,
          },
        },
        select: { adminCommission: true }
      });
      const totalAdminCommission = completedBookings.reduce(
        (sum, b) => sum + (b.adminCommission || 0), 0
      );
      const completedRidesCount = completedBookings.length;
      return { ...sub, _totalAdminCommission: totalAdminCommission, _completedRidesCount: completedRidesCount };
    }));

    res.json({ success: true, subscriptions: enriched.map(attachExcessData) });
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

    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        driverId,
        status: 'ACTIVE',
        endDate: { gte: new Date() }
      },
      include: { plan: true },
      orderBy: { startDate: 'desc' }
    });

    if (activeSubscriptions.length === 0) {
      return res.json(null);
    }

    // Attach the excess amount owed so the driver sees the same numbers as admin
    const enriched = await Promise.all(activeSubscriptions.map(async (sub) => {
      const completedBookings = await prisma.booking.findMany({
        where: {
          driverId: sub.driverId,
          status: 'COMPLETED',
          completedAt: { gte: sub.startDate, lte: sub.endDate },
        },
        select: { adminCommission: true },
      });
      const totalAdminCommission = completedBookings.reduce(
        (sum, b) => sum + (b.adminCommission || 0), 0
      );
      return { ...sub, _totalAdminCommission: totalAdminCommission, _completedRidesCount: completedBookings.length };
    }));
    const withExcess = enriched.map(attachExcessData);

    // Attach all active subscriptions list while keeping primary fields top-level
    const responsePayload = {
      ...withExcess[0],
      activeSubscriptions: withExcess
    };

    res.json(responsePayload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDriverAllActiveSubscriptions = async (req, res) => {
  try {
    const driverId = req.user.userId;
    await updateExpiredSubscriptions(driverId);
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        driverId,
        status: 'ACTIVE',
        endDate: { gte: new Date() }
      },
      include: { plan: true },
      orderBy: { startDate: 'desc' }
    });
    res.json({ success: true, subscriptions: activeSubscriptions.map(attachExcessData) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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

    // Cancel existing active subscription of the same planId for this driver
    await prisma.subscription.updateMany({
      where: { driverId, planId, status: 'ACTIVE' },
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
        paymentStatus: paid < plan.price ? 'PARTIAL' : 'PAID',
        paymentDueDate: paid < plan.price ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) : null,
        status: 'ACTIVE',
        maxDuties: plan.maxDuties || 0,
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
    const newRemainingAmount = Math.max(0, subscription.amount - newPaidAmount);
    const nowFullyPaid = newRemainingAmount <= 0;

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        paymentStatus: nowFullyPaid ? 'PAID' : 'PARTIAL',
        paymentDueDate: nowFullyPaid ? null : subscription.paymentDueDate,
      },
      include: { plan: true, driver: true }
    });

    res.json({ success: true, subscription: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Driver pays remaining amount on their own partial subscription
export const payRemainingAmount = async (req, res) => {
  try {
    const { id } = req.params;
    const { paidAmount, paymentMethod } = req.body;
    const driverId = req.user.userId;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true }
    });

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Subscription not found' });
    }
    if (subscription.driverId !== driverId) {
      return res.status(403).json({ success: false, error: 'Not your subscription' });
    }
    if (subscription.paymentStatus === 'PAID') {
      return res.status(400).json({ success: false, error: 'Subscription is already fully paid' });
    }

    const payment = parseFloat(paidAmount);
    const remaining = subscription.remainingAmount || 0;
    if (isNaN(payment) || payment <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid payment amount' });
    }
    if (payment > remaining) {
      return res.status(400).json({ success: false, error: `Payment cannot exceed remaining amount ₹${remaining}` });
    }

    const newPaid = (subscription.paidAmount || 0) + payment;
    const newRemaining = Math.max(0, remaining - payment);
    const fullyPaid = newRemaining <= 0;

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        paymentStatus: fullyPaid ? 'PAID' : 'PARTIAL',
        paymentDueDate: fullyPaid ? null : subscription.paymentDueDate,
        ...(paymentMethod && { paymentMethod }),
      },
      include: { plan: true }
    });

    res.json({ success: true, subscription: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Admin collects / settles the excess amount owed for completed rides
export const settleDriverCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod } = req.body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid settlement amount' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true, driver: true }
    });

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Subscription not found' });
    }

    // Sum actual adminCommission from completed bookings in this subscription period
    // (rejected / cancelled plans never accrued any excess amount)
    const completedBookings = isPlanDelivered(subscription.status)
      ? await prisma.booking.findMany({
          where: {
            driverId: subscription.driverId,
            status: 'COMPLETED',
            completedAt: { gte: subscription.startDate, lte: subscription.endDate },
          },
          select: { adminCommission: true }
        })
      : [];
    const totalCommission = completedBookings.reduce((sum, b) => sum + (b.adminCommission || 0), 0);
    const completedRidesCount = completedBookings.length;
    // Same helper as the ledger so the validated due matches the displayed due
    const { due: currentDue } = resolveExcess({
      ...subscription,
      _totalAdminCommission: totalCommission,
      _completedRidesCount: completedRidesCount,
    });

    if (parsedAmount > currentDue) {
      return res.status(400).json({
        success: false,
        error: `Settlement amount cannot exceed current excess due (₹${currentDue})`
      });
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        commissionPaid: { increment: parsedAmount }
      },
      include: { plan: true, driver: true }
    });

    res.json({
      success: true,
      subscription: attachExcessData({ ...updated, _totalAdminCommission: totalCommission, _completedRidesCount: completedRidesCount }),
      message: `Successfully collected excess amount of ₹${parsedAmount}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};