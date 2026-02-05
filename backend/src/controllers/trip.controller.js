import prisma from '../config/database.js';

// Customer creates a trip
export const createTrip = async (req, res) => {
  try {
    const { pickupLocation, dropLocation, startDate, startTime, duration, packageType, estimatedCost } = req.body;
    const customerId = req.user.id;

    const trip = await prisma.trip.create({
      data: {
        customerId,
        fromLocation: pickupLocation,
        toLocation: dropLocation,
        packageType: packageType || 'LOCAL',
        duration: duration || '1 day',
        startDate: new Date(`${startDate}T${startTime}`),
        status: 'UPCOMING',
        totalAmount: estimatedCost || 0,
      },
      include: {
        customer: true,
      },
    });

    res.status(201).json({ success: true, trip });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get available trips for drivers - DISABLED (Admin assigns bookings)
export const getAvailableTrips = async (req, res) => {
  try {
    // Return empty array - drivers don't see available trips anymore
    // Only admin assigns bookings through the booking workflow
    res.json({ success: true, trips: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get driver's trips (accepted/ongoing)
export const getDriverTrips = async (req, res) => {
  try {
    const driverId = req.user.userId || req.user.id;

    console.log('getDriverTrips - driverId:', driverId);

    // Get bookings assigned to this driver
    const bookings = await prisma.booking.findMany({
      where: { driverId },
      include: {
        customer: true,
      },
      orderBy: { startDateTime: 'desc' },
    });

    console.log('Found bookings for driver:', bookings.length);

    // Transform bookings to match the trip format expected by frontend
    const trips = bookings.map(booking => ({
      id: booking.id,
      customerId: booking.customerId,
      driverId: booking.driverId,
      customer: booking.customer,
      pickupLocation: booking.pickupLocation,
      dropLocation: booking.dropLocation,
      type: booking.bookingType,
      serviceType: booking.serviceType,
      startDate: booking.startDateTime.toISOString().split('T')[0],
      startTime: booking.startDateTime.toISOString().split('T')[1].substring(0, 5),
      duration: booking.duration,
      vehicleType: booking.vehicleType,
      estimateAmount: booking.estimateAmount,
      estimatedCost: booking.estimateAmount,
      status: booking.status,
    }));

    res.json({ success: true, trips });
  } catch (error) {
    console.error('getDriverTrips error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get customer's trips
export const getCustomerTrips = async (req, res) => {
  try {
    const customerId = req.user.id;

    const trips = await prisma.trip.findMany({
      where: { customerId },
      include: {
        driver: true,
      },
      orderBy: { startDate: 'desc' },
    });

    res.json({ success: true, trips });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Driver accepts a trip - DISABLED (Admin assigns bookings)
export const acceptTrip = async (req, res) => {
  try {
    // Drivers can't accept trips directly anymore
    // Only admin assigns bookings through the booking workflow
    res.status(403).json({ 
      success: false, 
      error: 'Direct trip acceptance is disabled. Admin assigns bookings.' 
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Driver completes a trip
export const completeTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const driverId = req.user.userId; // Changed from req.user.id to req.user.userId

    console.log('Complete trip - driverId:', driverId, 'tripId:', tripId);

    if (!driverId) {
      return res.status(401).json({ success: false, error: 'Driver ID not found in request' });
    }

    // Update booking status to completed
    const booking = await prisma.booking.update({
      where: {
        id: tripId,
      },
      data: {
        status: 'COMPLETED',
        driverId: driverId, // Set the driverId when completing
      },
      include: {
        customer: true,
        driver: true,
      },
    });

    // Update driver's completed trips count
    await prisma.driver.update({
      where: { id: driverId },
      data: {
        totalRides: { increment: 1 },
      },
    });

    // Transform to trip format
    const trip = {
      id: booking.id,
      customerId: booking.customerId,
      driverId: booking.driverId,
      customer: booking.customer,
      driver: booking.driver,
      pickupLocation: booking.pickupLocation,
      dropLocation: booking.dropLocation,
      type: booking.bookingType,
      serviceType: booking.serviceType,
      startDate: booking.startDateTime.toISOString().split('T')[0],
      startTime: booking.startDateTime.toISOString().split('T')[1].substring(0, 5),
      duration: booking.duration,
      vehicleType: booking.vehicleType,
      estimateAmount: booking.estimateAmount,
      estimatedCost: booking.estimateAmount,
      status: 'COMPLETED',
    };

    res.json({ success: true, trip });
  } catch (error) {
    console.error('Complete trip error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update trip status (generic)
export const updateTripStatus = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { status } = req.body;

    const updateData = { status };
    
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const trip = await prisma.trip.update({
      where: { id: tripId },
      data: updateData,
      include: {
        customer: true,
        driver: true,
      },
    });

    res.json({ success: true, trip });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Driver cancels a trip
export const cancelTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const driverId = req.user.userId;

    console.log('Cancel trip - driverId:', driverId, 'tripId:', tripId);

    // Update booking status to cancelled
    const booking = await prisma.booking.update({
      where: {
        id: tripId,
      },
      data: {
        status: 'CANCELLED',
      },
      include: {
        customer: true,
        driver: true,
      },
    });

    res.json({ success: true, message: 'Trip cancelled successfully' });
  } catch (error) {
    console.error('Cancel trip error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getUpcomingTrips = async (req, res) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { status: 'UPCOMING' },
      include: { customer: true, driver: true },
      orderBy: { startDate: 'asc' },
    });
    res.json({ success: true, trips });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCompletedTrips = async (req, res) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { status: 'COMPLETED' },
      include: { customer: true, driver: true },
      orderBy: { completedAt: 'desc' },
    });
    res.json({ success: true, trips });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};