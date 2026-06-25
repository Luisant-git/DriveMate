import prisma from '../config/database.js';
import { driverBookingAssignment, leadBookingAssignment } from './whatsapp.controller.js';

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

    // Fetch all plans to get their prices
    const driverPlans = await prisma.subscriptionPlan.findMany({
      where: { id: { in: config.driverPlanIds } }
    });
    const leadPlans = await prisma.leadSubscriptionPlan.findMany({
      where: { id: { in: config.leadPlanIds } }
    });

    // Group plans by price
    const tiersMap = {};
    for (const p of driverPlans) {
      if (!tiersMap[p.price]) tiersMap[p.price] = { driverPlanIds: [], leadPlanIds: [] };
      tiersMap[p.price].driverPlanIds.push(p.id);
    }
    for (const p of leadPlans) {
      if (!tiersMap[p.price]) tiersMap[p.price] = { driverPlanIds: [], leadPlanIds: [] };
      tiersMap[p.price].leadPlanIds.push(p.id);
    }

    // Sort prices descending
    const sortedPrices = Object.keys(tiersMap).map(Number).sort((a, b) => b - a);
    console.log(`[AutoRoute] Found ${sortedPrices.length} price tiers for routing.`);

    // Start background processing
    processTiersInBackground(bookingId, tiersMap, sortedPrices, booking);

    return { success: true, message: 'Routing started in background', tiers: sortedPrices.length };
  } catch (error) {
    console.error('[AutoRoute] Error:', error.message);
    return { success: false, error: error.message };
  }
};

const processTiersInBackground = async (bookingId, tiersMap, sortedPrices, booking) => {
  for (let i = 0; i < sortedPrices.length; i++) {
    const price = sortedPrices[i];
    const tier = tiersMap[price];

    // Check if booking is still available
    const currentBooking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!currentBooking || currentBooking.driverId || currentBooking.leadId) {
      console.log(`[AutoRoute] Booking ${bookingId} is already allocated. Stopping routing.`);
      break;
    }

    console.log(`[AutoRoute] Processing Tier ${i + 1}/${sortedPrices.length} (Price: ₹${price}) for booking ${bookingId}`);

    let driversSent = 0;
    let leadsSent = 0;

    // Send to drivers
    for (const planId of tier.driverPlanIds) {
      const drivers = await prisma.driver.findMany({
        where: {
          isActive: true,
          subscriptions: { some: { status: 'ACTIVE', planId, endDate: { gte: new Date() } } }
        }
      });
      if (drivers.length === 0) continue;

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
        driversSent += newDrivers.length;

        // Send WA
        for (const driver of newDrivers) {
          if (driver.phone) {
            try {
              const mockReq = { body: {
                phone: driver.phone,
                templateName: 'driver_booking_assignment1',
                parameters: {
                  bookingType: `${booking.serviceType} - ${booking.tripType || 'One Way'}`,
                  fareAmount: `₹${booking.estimateAmount || 0}`,
                  pickup: booking.pickupLocation,
                  destination: booking.dropLocation,
                  tripTime: new Date(booking.startDateTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
                }
              }};
              const mockRes = { json: () => {}, status: () => ({ json: () => {} }) };
              await driverBookingAssignment(mockReq, mockRes);
            } catch (e) { console.error('[AutoRoute] WA Driver error:', e.message); }
          }
        }
      }
    }

    // Send to leads
    for (const planId of tier.leadPlanIds) {
      const leads = await prisma.lead.findMany({
        where: {
          isActive: true,
          leadSubscriptions: { some: { status: 'ACTIVE', planId, endDate: { gte: new Date() } } }
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
        leadsSent += newLeads.length;

        // Send WA
        for (const lead of newLeads) {
          if (lead.phone) {
            try {
              const mockReq = { body: {
                phone: lead.phone,
                templateName: 'driver_booking_assignment1',
                parameters: {
                  bookingType: `${booking.serviceType} - ${booking.tripType || 'One Way'}`,
                  fareAmount: `₹${booking.estimateAmount || 0}`,
                  pickup: booking.pickupLocation,
                  destination: booking.dropLocation,
                  tripTime: new Date(booking.startDateTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
                }
              }};
              const mockRes = { json: () => {}, status: () => ({ json: () => {} }) };
              await leadBookingAssignment(mockReq, mockRes);
            } catch (e) { console.error('[AutoRoute] WA Lead error:', e.message); }
          }
        }
      }
    }

    console.log(`[AutoRoute] Tier ${i + 1} sent to ${driversSent} drivers and ${leadsSent} leads.`);

    if ((driversSent > 0 || leadsSent > 0) && i < sortedPrices.length - 1) {
      console.log(`[AutoRoute] Waiting 2 minutes for Tier ${i + 1} responses...`);
      await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
    }
  }

  // After all tiers, update status to CONFIRMED (meaning fully broadcasted) if not yet allocated
  const finalCheck = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (finalCheck && !finalCheck.driverId && !finalCheck.leadId && finalCheck.status === 'PENDING') {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED', adminReviewedAt: new Date() }
    });
    console.log(`[AutoRoute] Routing finished. Booking ${bookingId} broadcasted to all tiers.`);
  }
};
