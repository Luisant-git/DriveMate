import prisma from '../config/database.js';

export const createBooking = async (req, res) => {
  try {
    const {
      packageId,
      pickupLocation,
      dropLocation,
      bookingType,
      duration,
      startDateTime,
      endDateTime,
      quotationAmount,
      advancePayment,
    } = req.body;
    const userId = req.user.userId;

    const customer = await prisma.customer.findUnique({
      where: { userId },
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        packageId,
        pickupLocation,
        dropLocation,
        bookingType,
        duration,
        startDateTime: new Date(startDateTime),
        endDateTime: endDateTime ? new Date(endDateTime) : null,
        quotationAmount,
        advancePayment,
      },
      include: {
        package: true,
        customer: { include: { user: true } },
      },
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getCustomerBookings = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const customer = await prisma.customer.findUnique({
      where: { userId },
    });

    const bookings = await prisma.booking.findMany({
      where: { customerId: customer.id },
      include: {
        package: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, finalAmount } = req.body;

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        status,
        ...(finalAmount && { finalAmount }),
      },
      include: {
        package: true,
        customer: { include: { user: true } },
      },
    });

    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        package: true,
        customer: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMonthlyDriverQuotation = async (req, res) => {
  try {
    const { bookingType, duration, location } = req.query;
    
    // Calculate quotation based on booking type and duration
    let basePrice = 0;
    
    switch (bookingType) {
      case 'MONTHLY_DRIVER':
        basePrice = 25000;
        break;
      case 'WEEKLY':
        basePrice = 7000;
        break;
      case 'DAILY':
        basePrice = 1200;
        break;
      case 'HOURLY':
        basePrice = 150;
        break;
      case 'ONEWAY_DROP':
        basePrice = 800;
        break;
      case 'TWOWAY_DROP':
        basePrice = 1500;
        break;
      default:
        basePrice = 1000;
    }

    // Add location-based pricing if needed
    const locationMultiplier = location?.includes('outstation') ? 1.5 : 1;
    const quotation = basePrice * locationMultiplier;

    res.json({
      bookingType,
      duration,
      location,
      quotation,
      breakdown: {
        basePrice,
        locationMultiplier,
        finalAmount: quotation,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};