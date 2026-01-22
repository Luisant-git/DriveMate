import prisma from '../config/database.js';

export const getAllCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllDrivers = async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany({
      include: {
        subscriptions: { include: { plan: true } },
      },
    });

    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveDriver = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: { status: 'APPROVED' },
      include: { user: true },
    });

    res.json(driver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const rejectDriver = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: { status: 'REJECTED' },
      include: { user: true },
    });

    res.json(driver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllRides = async (req, res) => {
  try {
    const rides = await prisma.ride.findMany({
      include: {
        customer: { include: { user: true } },
        driver: { include: { user: true } },
      },
      orderBy: { requestedAt: 'desc' },
    });

    res.json(rides);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const totalDrivers = await prisma.driver.count();
    const activeDrivers = await prisma.driver.count({
      where: { status: 'APPROVED', isOnline: true },
    });
    const totalCustomers = await prisma.customer.count();
    const totalRides = await prisma.ride.count();
    const completedRides = await prisma.ride.count({
      where: { status: 'COMPLETED' },
    });

    const totalRevenue = await prisma.ride.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { fare: true },
    });

    res.json({
      totalDrivers,
      activeDrivers,
      totalCustomers,
      totalRides,
      completedRides,
      totalRevenue: totalRevenue._sum.fare || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const findNearestDrivers = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    const drivers = await prisma.driver.findMany({
      where: {
        status: 'APPROVED',
        isOnline: true,
        latitude: { not: null },
        longitude: { not: null },
        subscriptions: {
          some: {
            status: 'ACTIVE',
            endDate: { gt: new Date() },
          }
        },
      },
      include: {
        user: true,
        subscriptions: { include: { plan: true } },
      },
    });

    // Calculate distance and filter
    const nearbyDrivers = drivers
      .map(driver => ({
        ...driver,
        distance: calculateDistance(lat, lng, driver.latitude, driver.longitude),
      }))
      .filter(driver => driver.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    res.json(nearbyDrivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}