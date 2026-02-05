import prisma from '../config/database.js';

export const getDriverReports = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    const where = {};
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const drivers = await prisma.driver.findMany({
      where,
      include: {
        subscriptions: { include: { plan: true } },
        bookings: { where: { status: 'COMPLETED' } },
        trips: { where: { status: 'COMPLETED' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const report = drivers.map((driver) => {
      const activeSubscription = driver.subscriptions.find((s) => s.status === 'ACTIVE');
      return {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        status: driver.status,
        packageType: activeSubscription ? activeSubscription.plan.name : 'No Active Plan',
        totalRides: driver.totalRides,
        rating: driver.rating,
        completedBookings: driver.bookings.length,
        completedTrips: driver.trips.length,
        activeSubscriptions: driver.subscriptions.filter((s) => s.status === 'ACTIVE').length,
        totalRevenue: driver.bookings.reduce((sum, b) => sum + (b.finalAmount || 0), 0),
        joinedDate: driver.createdAt,
      };
    });

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error fetching driver reports:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch driver reports' });
  }
};

export const getCustomerReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        bookings: true,
        trips: true,
        rides: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const report = customers.map((customer) => ({
      id: customer.id,
      name: customer.name || 'N/A',
      email: customer.email || 'N/A',
      phone: customer.phone,
      totalBookings: customer.bookings.length,
      completedBookings: customer.bookings.filter((b) => b.status === 'COMPLETED').length,
      totalTrips: customer.trips.length,
      totalRides: customer.rides.length,
      totalSpent: customer.bookings.reduce((sum, b) => sum + (b.finalAmount || 0), 0),
      advancePayment: customer.advancePayment,
      joinedDate: customer.createdAt,
    }));

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error fetching customer reports:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customer reports' });
  }
};

export const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = { status: 'COMPLETED' };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const bookings = await prisma.booking.findMany({ where });
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.finalAmount || 0), 0);
    const totalAdvance = bookings.reduce((sum, b) => sum + b.advancePayment, 0);

    res.json({
      success: true,
      data: {
        totalBookings: bookings.length,
        totalRevenue,
        totalAdvance,
        averageBookingValue: bookings.length ? totalRevenue / bookings.length : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching revenue report:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch revenue report' });
  }
};

export const getDriverTrips = async (req, res) => {
  try {
    const { driverId } = req.params;

    const [bookings, trips, rides] = await Promise.all([
      prisma.booking.findMany({ 
        where: { driverId }, 
        include: { customer: true }, 
        orderBy: { createdAt: 'desc' } 
      }),
      prisma.trip.findMany({ 
        where: { driverId }, 
        include: { customer: true }, 
        orderBy: { createdAt: 'desc' } 
      }),
      prisma.ride.findMany({ 
        where: { driverId }, 
        include: { customer: true }, 
        orderBy: { requestedAt: 'desc' } 
      }),
    ]);

    res.json({ success: true, data: { bookings, trips, rides } });
  } catch (error) {
    console.error('Error fetching driver trips:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch driver trips' });
  }
};

export const getCustomerTrips = async (req, res) => {
  try {
    const { customerId } = req.params;

    const [bookings, trips, rides] = await Promise.all([
      prisma.booking.findMany({ 
        where: { customerId }, 
        include: { driver: true }, 
        orderBy: { createdAt: 'desc' } 
      }),
      prisma.trip.findMany({ 
        where: { customerId }, 
        include: { driver: true }, 
        orderBy: { createdAt: 'desc' } 
      }),
      prisma.ride.findMany({ 
        where: { customerId }, 
        include: { driver: true }, 
        orderBy: { requestedAt: 'desc' } 
      }),
    ]);

    res.json({ success: true, data: { bookings, trips, rides } });
  } catch (error) {
    console.error('Error fetching customer trips:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customer trips' });
  }
};
