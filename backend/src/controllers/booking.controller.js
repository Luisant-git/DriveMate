import prisma from '../config/database.js';
import { autoRouteBooking } from './bookingRouting.controller.js';

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
      serviceType,
      tripType,
      driverType,
      startDateTime, 
      duration,
      vehicleType,
      carType,
      estimateAmount,
      paymentMethod
    } = req.body;

    console.log('[Booking] User from token:', req.user);
    
    if (!req.user || (!req.user.id && !req.user.userId)) {
      return res.status(401).json({ success: false, error: 'User not logged in' });
    }

    const userId = req.user.userId || req.user.id;
    console.log('[Booking] Using userId:', userId);

    const paymentStatus = paymentMethod === 'UPI' ? 'PAID' : 'UNPAID';

    const booking = await prisma.booking.create({
      data: {
        customerId: userId,
        pickupLocation,
        dropLocation,
        driverType,
        serviceType,
        tripType,
        startDateTime: new Date(startDateTime),
        duration,
        vehicleType,
        carType,
        estimateAmount,
        paymentMethod,
        paymentStatus,
        status: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      booking,
      message: 'Booking request sent to drivers!'
    });

    // Auto-route booking to drivers/leads based on routing config (fire and forget)
    autoRouteBooking(booking.id).then(result => {
      console.log(`[AutoRoute] Result for booking ${booking.id}:`, result);
    }).catch(err => {
      console.error(`[AutoRoute] Failed for booking ${booking.id}:`, err.message);
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const adminCreateBooking = async (req, res) => {
  try {
    const { 
      customerName,
      customerPhone,
      pickupLocation, 
      dropLocation, 
      serviceType,
      tripType,
      startDateTime, 
      estimateAmount,
      duration,
      carType,
      vehicleType,
      driverType
    } = req.body;

    if (!customerName || !customerPhone || !pickupLocation || !serviceType || !startDateTime) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { phone: customerPhone }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          phone: customerPhone,
          email: `${customerPhone}@temp.com`, // temporary placeholder
          password: 'admin_created',
        }
      });
    }

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        pickupLocation,
        dropLocation,
        serviceType,
        tripType: tripType || 'One Way',
        startDateTime: new Date(startDateTime),
        estimateAmount: parseFloat(estimateAmount) || 0,
        paymentMethod: 'CASH',
        paymentStatus: 'UNPAID',
        status: 'PENDING',
        duration,
        carType,
        vehicleType,
        driverType
      }
    });

    res.status(201).json({
      success: true,
      booking,
      message: 'Booking request sent to drivers!'
    });

    // Auto-route booking
    autoRouteBooking(booking.id).then(result => {
      console.log(`[AutoRoute] Result for booking ${booking.id}:`, result);
    }).catch(err => {
      console.error(`[AutoRoute] Failed for booking ${booking.id}:`, err.message);
    });
  } catch (error) {
    console.error('Admin Booking creation error:', error);
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
    const userId = req.user.userId || req.user.id;
    console.log('[Booking] Fetching bookings for userId:', userId);
    
    const bookings = await prisma.booking.findMany({
      where: {
        customerId: userId
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
            alternateMobile2: true,
            alternateMobile3: true,
            alternateMobile4: true,
            photo: true,
            dlPhoto: true,
            rating: true,
            totalRides: true
          }
        },
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            licenseNo: true,
            alternateMobile1: true,
            alternateMobile2: true,
            alternateMobile3: true,
            alternateMobile4: true,
            photo: true,
            dlPhoto: true,
            rating: true,
            totalRides: true
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
      } : null,
      lead: booking.lead ? {
        ...booking.lead,
        photo: getFileUrl(booking.lead.photo),
        dlPhoto: getFileUrl(booking.lead.dlPhoto)
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
    const userId = req.user.userId || req.user.id;
    
    const bookings = await prisma.booking.findMany({
      where: {
        driverId: userId
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

export const getLeadBookings = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    console.log('Fetching bookings for leadId:', userId);
    
    const bookings = await prisma.booking.findMany({
      where: {
        leadId: userId
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

    console.log(`Found ${bookings.length} bookings for lead`);
    console.log('Booking statuses:', bookings.map(b => ({ id: b.id, status: b.status })));

    // Filter out completed and cancelled on frontend display
    const activeBookings = bookings.filter(b => !['COMPLETED', 'CANCELLED'].includes(b.status));

    res.json({
      success: true,
      bookings: activeBookings
    });
  } catch (error) {
    console.error('Error fetching lead bookings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getLeadCompletedTrips = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    const bookings = await prisma.booking.findMany({
      where: {
        leadId: userId,
        status: 'COMPLETED'
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
    console.error('Error fetching completed trips:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const rateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Valid rating between 1 and 5 is required' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { driver: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (booking.customerId !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to rate this booking' });
    }

    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, error: 'Can only rate completed bookings' });
    }

    if (booking.rating) {
      return res.status(400).json({ success: false, error: 'Booking has already been rated' });
    }

    // Update booking with rating and feedback
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        rating,
        feedback
      }
    });

    // Update driver's average rating
    if (booking.driverId) {
      const driverBookings = await prisma.booking.findMany({
        where: { 
          driverId: booking.driverId,
          rating: { not: null }
        }
      });
      
      const totalRatings = driverBookings.length;
      const sumRatings = driverBookings.reduce((sum, b) => sum + (b.rating || 0), 0);
      const newAverageRating = totalRatings > 0 ? (sumRatings / totalRatings) : rating;

      await prisma.driver.update({
        where: { id: booking.driverId },
        data: {
          rating: newAverageRating
        }
      });
    }

    res.json({
      success: true,
      booking: updatedBooking,
      message: 'Rating submitted successfully'
    });
  } catch (error) {
    console.error('Error rating booking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
