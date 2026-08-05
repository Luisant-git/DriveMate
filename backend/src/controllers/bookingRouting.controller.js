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

    const getPlanRank = (name) => {
      const lowerName = (name || '').toLowerCase();
      if (lowerName.includes('diamond')) return 4;
      if (lowerName.includes('platinum')) return 3;
      if (lowerName.includes('gold')) return 2;
      if (lowerName.includes('silver')) return 1;
      return 0;
    };

    // Group plans by rank and price
    const tiersMap = {};
    const allPlans = [
      ...driverPlans.map(p => ({ ...p, isDriver: true, rank: getPlanRank(p.name) })),
      ...leadPlans.map(p => ({ ...p, isDriver: false, rank: getPlanRank(p.name) }))
    ];

    for (const p of allPlans) {
      const tierKey = `${p.rank}_${p.price}`;
      
      if (!tiersMap[tierKey]) {
        tiersMap[tierKey] = { rank: p.rank, price: p.price, driverPlanIds: [], leadPlanIds: [] };
      }
      
      if (p.isDriver) {
        tiersMap[tierKey].driverPlanIds.push(p.id);
      } else {
        tiersMap[tierKey].leadPlanIds.push(p.id);
      }
    }

    // Sort the keys based on rank first (descending), then price (descending)
    const sortedTierKeys = Object.keys(tiersMap).sort((a, b) => {
      const tierA = tiersMap[a];
      const tierB = tiersMap[b];
      if (tierA.rank !== tierB.rank) return tierB.rank - tierA.rank;
      return tierB.price - tierA.price;
    });

    console.log(`[AutoRoute] Found ${sortedTierKeys.length} tiers for routing.`);

    // Start background processing
    processTiersInBackground(bookingId, tiersMap, sortedTierKeys, booking);

    return { success: true, message: 'Routing started in background', tiers: sortedTierKeys.length };
  } catch (error) {
    console.error('[AutoRoute] Error:', error.message);
    return { success: false, error: error.message };
  }
};

const processTiersInBackground = async (bookingId, tiersMap, sortedTierKeys, booking) => {
  for (let i = 0; i < sortedTierKeys.length; i++) {
    const tierKey = sortedTierKeys[i];
    const tier = tiersMap[tierKey];

    // Check if booking is still available
    const currentBooking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!currentBooking || currentBooking.driverId || currentBooking.leadId) {
      console.log(`[AutoRoute] Booking ${bookingId} is already allocated. Stopping routing.`);
      break;
    }

    console.log(`[AutoRoute] Processing Tier ${i + 1}/${sortedTierKeys.length} (Rank: ${tier.rank}, Price: ₹${tier.price}) for booking ${bookingId}`);

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

    if ((driversSent > 0 || leadsSent > 0) && i < sortedTierKeys.length - 1) {
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
