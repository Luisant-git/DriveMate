import prisma from '../config/database.js';

export const getAllRoutingConfigs = async (req, res) => {
  try {
    const configs = await prisma.bookingRoutingConfig.findMany({
      orderBy: [{ serviceType: 'asc' }, { tripType: 'asc' }]
    });

    const [driverPlans, leadPlans] = await Promise.all([
      prisma.subscriptionPlan.findMany({ where: { isActive: true } }),
      prisma.leadSubscriptionPlan.findMany({ where: { isActive: true } })
    ]);

    const enriched = configs.map(config => ({
      ...config,
      driverPlans: driverPlans.filter(p => config.driverPlanIds.includes(p.id)),
      leadPlans: leadPlans.filter(p => config.leadPlanIds.includes(p.id)),
    }));

    res.json({ success: true, configs: enriched, driverPlans, leadPlans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createRoutingConfig = async (req, res) => {
  try {
    const { serviceType, tripType, driverPlanIds, leadPlanIds } = req.body;
    if (!serviceType || !tripType) {
      return res.status(400).json({ success: false, error: 'serviceType and tripType are required' });
    }
    const config = await prisma.bookingRoutingConfig.create({
      data: { serviceType, tripType, driverPlanIds: driverPlanIds || [], leadPlanIds: leadPlanIds || [] }
    });
    res.json({ success: true, config });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'This combination already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateRoutingConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverPlanIds, leadPlanIds } = req.body;
    const config = await prisma.bookingRoutingConfig.update({
      where: { id },
      data: { driverPlanIds: driverPlanIds || [], leadPlanIds: leadPlanIds || [] }
    });
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteRoutingConfig = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.bookingRoutingConfig.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Called automatically when a booking is created
export const autoRouteBooking = async (bookingId) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true }
    });

    if (!booking) return { success: false, error: 'Booking not found' };

    const serviceType = booking.serviceType;
    const tripType = booking.tripType || 'One Way';

    const config = await prisma.bookingRoutingConfig.findUnique({
      where: { serviceType_tripType: { serviceType, tripType } }
    });

    if (!config || (config.driverPlanIds.length === 0 && config.leadPlanIds.length === 0)) {
      console.log(`[AutoRoute] No routing config for ${serviceType} - ${tripType}`);
      return { success: false, error: 'No routing config found' };
    }

    console.log(`[AutoRoute] Routing booking ${bookingId} for ${serviceType} - ${tripType}`);
    console.log(`[AutoRoute] Driver plans: ${config.driverPlanIds}, Lead plans: ${config.leadPlanIds}`);

    let totalDrivers = 0;
    let totalLeads = 0;

    // Send to drivers for each mapped driver plan
    for (const planId of config.driverPlanIds) {
      const drivers = await prisma.driver.findMany({
        where: {
          isActive: true,
          subscriptions: {
            some: {
              status: 'ACTIVE',
              planId,
              endDate: { gte: new Date() }
            }
          }
        }
      });

      if (drivers.length === 0) continue;

      // Get existing responses to avoid duplicates
      const existing = await prisma.bookingResponse.findMany({
        where: { bookingId, driverId: { in: drivers.map(d => d.id) } },
        select: { driverId: true }
      });
      const existingIds = new Set(existing.map(r => r.driverId));
      const newDrivers = drivers.filter(d => !existingIds.has(d.id));

      if (newDrivers.length > 0) {
        await prisma.bookingResponse.createMany({
          data: newDrivers.map(d => ({ bookingId, driverId: d.id, status: 'PENDING' })),
          skipDuplicates: true
        });
        totalDrivers += newDrivers.length;
        console.log(`[AutoRoute] Sent to ${newDrivers.length} drivers for plan ${planId}`);
      }
    }

    // Send to leads for each mapped lead plan
    for (const planId of config.leadPlanIds) {
      const leads = await prisma.lead.findMany({
        where: {
          isActive: true,
          leadSubscriptions: {
            some: {
              status: 'ACTIVE',
              planId,
              endDate: { gte: new Date() }
            }
          }
        }
      });

      if (leads.length === 0) continue;

      const existing = await prisma.leadBookingResponse.findMany({
        where: { bookingId, leadId: { in: leads.map(l => l.id) } },
        select: { leadId: true }
      });
      const existingIds = new Set(existing.map(r => r.leadId));
      const newLeads = leads.filter(l => !existingIds.has(l.id));

      if (newLeads.length > 0) {
        await prisma.leadBookingResponse.createMany({
          data: newLeads.map(l => ({ bookingId, leadId: l.id, status: 'PENDING' })),
          skipDuplicates: true
        });

        // Update booking with lead package reference (use first plan)
        if (!booking.selectedLeadPackageId) {
          await prisma.booking.update({
            where: { id: bookingId },
            data: { selectedLeadPackageId: planId }
          });
        }

        totalLeads += newLeads.length;
        console.log(`[AutoRoute] Sent to ${newLeads.length} leads for plan ${planId}`);
      }
    }

    // Mark booking as CONFIRMED and reviewed
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        adminReviewedAt: new Date(),
        selectedPackageType: config.driverPlanIds.length > 0 ? 'LOCAL' : null
      }
    });

    console.log(`[AutoRoute] Done. Sent to ${totalDrivers} drivers and ${totalLeads} leads`);
    return { success: true, totalDrivers, totalLeads };
  } catch (error) {
    console.error('[AutoRoute] Error:', error.message);
    return { success: false, error: error.message };
  }
};
