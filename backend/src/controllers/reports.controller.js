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
        subscriptions: { 
          include: { plan: true } 
        },
        bookings: {
          where: { status: 'COMPLETED' },
        },
        trips: { 
          where: { status: 'COMPLETED' },
        },
        rides: { 
          where: { status: 'COMPLETED' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const report = await Promise.all(drivers.map(async (driver) => {
      const activeSubscription = driver.subscriptions.find((s) => s.status === 'ACTIVE');

      // Calculate revenue from bookings
      let totalRevenue = 0;
      const bookingIdsWithoutAmount = [];

      // First, sum up all bookings with amounts
      if (driver.bookings && driver.bookings.length > 0) {
        driver.bookings.forEach(booking => {
          const amount = booking.finalAmount || booking.estimateAmount || 0;
          if (amount > 0) {
            totalRevenue += Number(amount);
          } else {
            // Track bookings without amounts for payment lookup
            bookingIdsWithoutAmount.push(booking.id);
          }
        });
      }

      // Sum from trips
      if (driver.trips && driver.trips.length > 0) {
        driver.trips.forEach(trip => {
          totalRevenue += Number(trip.totalAmount || 0);
        });
      }

      // Sum from rides
      if (driver.rides && driver.rides.length > 0) {
        driver.rides.forEach(ride => {
          totalRevenue += Number(ride.fare || 0);
        });
      }

      // If there are bookings without amounts, check payments table
      if (bookingIdsWithoutAmount.length > 0) {
        const payments = await prisma.payment.findMany({
          where: {
            bookingId: { in: bookingIdsWithoutAmount },
          }
        });

        payments.forEach(payment => {
          totalRevenue += Number(payment.amount || 0);
        });
      }

      return {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        status: driver.status,
        packageType: activeSubscription ? activeSubscription.plan.name : 'No Active Plan',
        totalRides: driver.totalRides || 0,
        rating: driver.rating || 0,
        completedBookings: driver.bookings?.length || 0,
        completedTrips: driver.trips?.length || 0,
        completedRides: driver.rides?.length || 0,
        activeSubscriptions: driver.subscriptions.filter((s) => s.status === 'ACTIVE').length,
        totalRevenue: totalRevenue,
        joinedDate: driver.createdAt,
      };
    }));

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

    const report = await Promise.all(customers.map(async (customer) => {
      const bookingsSum = customer.bookings ? customer.bookings.filter((b) => b.status === 'COMPLETED').reduce((sum, b) => sum + (b.finalAmount || b.estimateAmount || 0), 0) : 0;
      const tripsSum = customer.trips ? customer.trips.filter((t) => t.status === 'COMPLETED').reduce((sum, t) => sum + (t.totalAmount || 0), 0) : 0;
      const ridesSum = customer.rides ? customer.rides.filter((r) => r.status === 'COMPLETED').reduce((sum, r) => sum + (r.fare || 0), 0) : 0;

      const missingBookingIds = customer.bookings ? customer.bookings.filter((b) => b.status === 'COMPLETED' && !b.finalAmount).map((b) => b.id) : [];
      const missingTripIds = customer.trips ? customer.trips.filter((t) => t.status === 'COMPLETED' && !t.totalAmount).map((t) => t.id) : [];

      let paymentSumForMissing = 0;
      if (missingBookingIds.length || missingTripIds.length) {
        const paymentWhere = { OR: [] };
        if (missingBookingIds.length) paymentWhere.OR.push({ bookingId: { in: missingBookingIds } });
        if (missingTripIds.length) paymentWhere.OR.push({ tripId: { in: missingTripIds } });
        const agg = await prisma.payment.aggregate({ where: paymentWhere, _sum: { amount: true } });
        paymentSumForMissing = (agg._sum && agg._sum.amount) || 0;
      }

      return {
        id: customer.id,
        name: customer.name || 'N/A',
        email: customer.email || 'N/A',
        phone: customer.phone,
        totalBookings: customer.bookings.length,
        completedBookings: customer.bookings.filter((b) => b.status === 'COMPLETED').length,
        totalTrips: customer.trips.length,
        totalRides: customer.rides.length,
        totalSpent: bookingsSum + tripsSum + ridesSum + paymentSumForMissing,
        advancePayment: customer.advancePayment,
        joinedDate: customer.createdAt,
      };
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
    // include completed trips and rides in the revenue calculation as well
    const tripWhere = { status: 'COMPLETED' };
    const rideWhere = { status: 'COMPLETED' };
    if (where.createdAt) {
      tripWhere.createdAt = where.createdAt;
      // rides use requestedAt for timestamp in schema
      rideWhere.requestedAt = where.createdAt;
    }
    const trips = await prisma.trip.findMany({ where: tripWhere });
    const rides = await prisma.ride.findMany({ where: rideWhere });

    const bookingsSum = bookings ? bookings.reduce((sum, b) => sum + (b.finalAmount || b.estimateAmount || 0), 0) : 0;
    const tripsSum = trips ? trips.reduce((sum, t) => sum + (t.totalAmount || 0), 0) : 0;
    const ridesSum = rides ? rides.reduce((sum, r) => sum + (r.fare || 0), 0) : 0;

    // sum payments for bookings/trips that don't have stored amounts
    const missingBookingIds = bookings ? bookings.filter((b) => !b.finalAmount).map((b) => b.id) : [];
    const missingTripIds = trips ? trips.filter((t) => !t.totalAmount).map((t) => t.id) : [];
    let paymentSumForMissing = 0;
    if (missingBookingIds.length || missingTripIds.length) {
      const paymentWhere = { OR: [] };
      if (missingBookingIds.length) paymentWhere.OR.push({ bookingId: { in: missingBookingIds } });
      if (missingTripIds.length) paymentWhere.OR.push({ tripId: { in: missingTripIds } });
      const agg = await prisma.payment.aggregate({ where: paymentWhere, _sum: { amount: true } });
      paymentSumForMissing = (agg._sum && agg._sum.amount) || 0;
    }

    const totalRevenue = bookingsSum + tripsSum + ridesSum + paymentSumForMissing;
    const totalAdvance = bookings.reduce((sum, b) => sum + (b.advancePayment || 0), 0);

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
