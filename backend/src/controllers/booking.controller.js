import prisma from '../config/database.js';

const getFileUrl = (fileId) => {
  if (!fileId) return null;
  if (fileId.startsWith('http')) return fileId;
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/${fileId}`;
};

export const createBooking = async (req, res) => {
  try {
    const { 
      pickupLocation, 
      dropLocation, 
      bookingType, 
      serviceType,
      startDateTime, 
      duration,
      vehicleType,
      carType,
      estimateAmount 
    } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: 'User not logged in' });
    }

    const booking = await prisma.booking.create({
      data: {
        customerId: req.user.id,
        pickupLocation,
        dropLocation,
        bookingType,
        serviceType,
        startDateTime: new Date(startDateTime),
        duration,
        vehicleType,
        carType,
        estimateAmount,
        status: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      booking,
      message: 'Booking request sent to drivers!'
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getEstimate = async (req, res) => {
  try {
    const { packageType, hours } = req.query;
    
    if (!packageType || !hours) {
      return res.status(400).json({ success: false, error: 'Package type and hours required' });
    }

    const pkg = await prisma.pricingPackage.findUnique({
      where: { 
        packageType_hours: { 
          packageType, 
          hours: parseInt(hours) 
        },
        isActive: true
      }
    });

    if (!pkg) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }
    
    res.json({
      success: true,
      estimate: pkg.minimumCharge,
      currency: 'INR',
      breakdown: {
        minimumCharge: pkg.minimumCharge,
        hours: pkg.hours,
        extraPerHour: pkg.extraPerHour,
        minimumKm: pkg.minimumKm,
        description: pkg.description
      }
    });
  } catch (error) {
    console.error('Estimate calculation error:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate estimate' });
  }
};

export const getCustomerBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        customerId: req.user.id
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            licenseNo: true,
            alternateMobile1: true,
            photo: true,
            dlPhoto: true
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const transformedBookings = bookings.map(booking => ({
      ...booking,
      driver: booking.driver ? {
        ...booking.driver,
        photo: getFileUrl(booking.driver.photo),
        dlPhoto: getFileUrl(booking.driver.dlPhoto),
        documents: {
          photo: getFileUrl(booking.driver.photo),
          dl: getFileUrl(booking.driver.dlPhoto)
        }
      } : null
    }));

    res.json({
      success: true,
      bookings: transformedBookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDriverBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        driverId: req.user.id
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Error fetching driver bookings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
