import prisma from '../config/database.js';

// ADMIN: Get all pending bookings for review
export const getAdminPendingBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { status: 'PENDING' },
          { status: 'CONFIRMED' }
        ],
        allocatedDriverId: null
      },
      include: {
        customer: true,
        package: true,
        driverResponses: {
          include: { driver: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Error fetching pending bookings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ADMIN: Review booking and select package type
export const adminReviewBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { selectedPackageType } = req.body;

    if (!selectedPackageType) {
      return res.status(400).json({ success: false, error: 'Package type required' });
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        selectedPackageType,
        adminReviewedAt: new Date(),
        status: 'CONFIRMED'
      },
      include: { customer: true }
    });

    res.json({ success: true, booking, message: 'Booking reviewed. Sending to drivers...' });
  } catch (error) {
    console.error('Error reviewing booking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ADMIN: Send booking to all drivers with selected package type
export const sendBookingToDrivers = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (!booking.selectedPackageType) {
      return res.status(400).json({ success: false, error: 'Package type not selected' });
    }

    // Find all drivers with the selected package type
    const drivers = await prisma.driver.findMany({
      where: {
        OR: [
          { packageType: booking.selectedPackageType },
          { packageType: 'ALL_PREMIUM' }
        ]
      }
    });

    if (drivers.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: `No online drivers available with ${booking.selectedPackageType} package` 
      });
    }

    // Create booking responses for each driver
    const responses = await Promise.all(
      drivers.map(driver =>
        prisma.bookingResponse.create({
          data: {
            bookingId,
            driverId: driver.id,
            status: 'PENDING'
          }
        })
      )
    );

    res.json({ 
      success: true, 
      message: `Booking sent to ${drivers.length} drivers`,
      driversCount: drivers.length,
      responses
    });
  } catch (error) {
    console.error('Error sending booking to drivers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DRIVER: Get pending booking requests
export const getDriverPendingRequests = async (req, res) => {
  try {
    const driverId = req.user.id;

    const responses = await prisma.bookingResponse.findMany({
      where: {
        driverId,
        status: 'PENDING'
      },
      include: {
        booking: {
          include: { customer: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, requests: responses });
  } catch (error) {
    console.error('Error fetching driver requests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DRIVER: Accept or reject booking request
export const respondToBookingRequest = async (req, res) => {
  try {
    const { responseId } = req.params;
    const { action } = req.body; // 'ACCEPTED' or 'REJECTED'

    if (!['ACCEPTED', 'REJECTED'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    const response = await prisma.bookingResponse.update({
      where: { id: responseId },
      data: {
        status: action,
        respondedAt: new Date()
      },
      include: {
        booking: true,
        driver: true
      }
    });

    res.json({ 
      success: true, 
      response,
      message: `Booking request ${action.toLowerCase()}`
    });
  } catch (error) {
    console.error('Error responding to booking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ADMIN: Get booking responses for allocation
export const getBookingResponses = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const responses = await prisma.bookingResponse.findMany({
      where: { bookingId },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            rating: true,
            totalRides: true,
            vehicleNo: true,
            vehicleType: true,
            photo: true
          }
        }
      }
    });

    const acceptedDrivers = responses.filter(r => r.status === 'ACCEPTED');

    res.json({ 
      success: true, 
      responses,
      acceptedDrivers,
      acceptedCount: acceptedDrivers.length
    });
  } catch (error) {
    console.error('Error fetching booking responses:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ADMIN: Allocate specific driver to booking
export const allocateDriverToBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({ success: false, error: 'Driver ID required' });
    }

    // Verify driver accepted the booking
    const response = await prisma.bookingResponse.findUnique({
      where: {
        bookingId_driverId: { bookingId, driverId }
      }
    });

    if (!response || response.status !== 'ACCEPTED') {
      return res.status(400).json({ 
        success: false, 
        error: 'Driver has not accepted this booking' 
      });
    }

    // Update booking with allocated driver
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        driverId,
        allocatedDriverId: driverId,
        allocatedAt: new Date(),
        status: 'CONFIRMED'
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
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            rating: true,
            vehicleNo: true,
            vehicleType: true,
            photo: true
          }
        }
      }
    });

    res.json({ 
      success: true, 
      booking,
      message: 'Driver allocated successfully'
    });
  } catch (error) {
    console.error('Error allocating driver:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// CUSTOMER: Get booking with driver details
export const getCustomerBookingWithDriver = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const customerId = req.user.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true
          }
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            rating: true,
            totalRides: true,
            vehicleNo: true,
            vehicleType: true,
            photo: true
          }
        }
      }
    });

    if (!booking || booking.customerId !== customerId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DRIVER: Get allocated booking details with customer info
export const getDriverAllocatedBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const driverId = req.user.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true
          }
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    if (!booking || booking.driverId !== driverId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
