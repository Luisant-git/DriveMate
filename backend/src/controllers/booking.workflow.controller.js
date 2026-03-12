import prisma from '../config/database.js';
import { driverBookingAssignment, driverBookingConfirmation, customerDriverAssigned } from './whatsapp.controller.js';

// ADMIN: Get all pending bookings for review
export const getAdminPendingBookings = async (req, res) => {
  try {
    const { bookingType, serviceType, paymentStatus, tripType, paymentMethod } = req.query;
    
    const whereClause = {
      OR: [
        { status: 'PENDING' },
        { status: 'CONFIRMED' }
      ],
      driverId: null,
      leadId: null
    };
    
    if (bookingType) {
      whereClause.bookingType = bookingType;
    }
    
    if (serviceType) {
      whereClause.serviceType = serviceType;
    }
    
    if (paymentStatus) {
      whereClause.paymentStatus = paymentStatus;
    }
    
    if (tripType) {
      whereClause.tripType = tripType;
    }
    
    if (paymentMethod) {
      whereClause.paymentMethod = paymentMethod;
    }
    
    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        customer: true,
        driverResponses: {
          include: { driver: true }
        },
        leadResponses: {
          include: { lead: true }
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
    const { selectedPackageType, selectedPackageId } = req.body;

    if (!selectedPackageType || !selectedPackageId) {
      return res.status(400).json({ success: false, error: 'Package type and ID required' });
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

    // Find all drivers with active subscriptions matching the package type
    const drivers = await prisma.driver.findMany({
      where: {
        subscriptions: {
          some: {
            status: 'ACTIVE',
            plan: {
              type: booking.selectedPackageType
            },
            endDate: {
              gte: new Date()
            }
          }
        }
      }
    });

    if (drivers.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: `No drivers available with this package subscription` 
      });
    }

    // Create booking responses for each driver using upsert to prevent duplicates
    console.log(`[Booking] Creating responses for ${drivers.length} drivers using upsert`);
    
    const responses = await Promise.allSettled(
      drivers.map(driver =>
        prisma.bookingResponse.upsert({
          where: {
            bookingId_driverId: {
              bookingId,
              driverId: driver.id
            }
          },
          update: {}, // Don't update if exists
          create: {
            bookingId,
            driverId: driver.id,
            status: 'PENDING'
          }
        })
      )
    );
    
    const successfulResponses = responses.filter(r => r.status === 'fulfilled').map(r => r.value);
    const newResponses = responses.filter((r, index) => {
      if (r.status === 'fulfilled') {
        // Check if this was a new creation (createdAt is very recent)
        const response = r.value;
        const isNew = new Date() - new Date(response.createdAt) < 5000; // Created within last 5 seconds
        return isNew;
      }
      return false;
    });
    
    console.log(`[Booking] Total responses: ${successfulResponses.length}, New responses: ${newResponses.length}`);
    
    if (newResponses.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Booking already sent to all available drivers' 
      });
    }

    // Send WhatsApp templates only to drivers with new responses
    const newDriverIds = newResponses.map(r => r.value.driverId);
    const driversToNotify = drivers.filter(d => newDriverIds.includes(d.id));
    
    console.log(`[Booking] Sending WhatsApp templates to ${driversToNotify.length} drivers with new responses`);
    const whatsappResults = await Promise.allSettled(
      driversToNotify.map(async (driver) => {
        if (driver.phone) {
          try {
            const templateData = {
              phone: driver.phone,
              templateName: 'driver_booking_assignment_1',
              parameters: {
                bookingType: `${booking.serviceType} - ${booking.tripType}`,
                fareAmount: `₹${booking.estimateAmount || 0}`,
                pickup: booking.pickupLocation,
                destination: booking.dropLocation,
                tripTime: new Date(booking.startDateTime).toLocaleTimeString('en-IN', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  timeZone: 'Asia/Kolkata'
                })
              }
            };
            
            // Create a mock request object for driverBookingAssignment function
            const mockReq = { body: templateData };
            let whatsappResult = { success: false };
            let statusCode = 200;
            const mockRes = {
              json: (data) => {
                whatsappResult = data;
                return data;
              },
              status: (code) => {
                statusCode = code;
                return {
                  json: (data) => {
                    whatsappResult = { ...data, statusCode: code };
                    return { status: code, ...data };
                  }
                };
              }
            };
            
            await driverBookingAssignment(mockReq, mockRes);
            
            // Check both success flag and status code
            if (whatsappResult.success && statusCode < 400) {
              console.log(`[WhatsApp] Template sent to ${driver.phone}`);
              return { success: true, phone: driver.phone };
            } else {
              console.error(`[WhatsApp] Failed to send to ${driver.phone}:`, whatsappResult.error || whatsappResult.details);
              return { success: false, phone: driver.phone, error: whatsappResult.error || whatsappResult.details };
            }
          } catch (error) {
            console.error(`[WhatsApp] Failed to send to ${driver.phone}:`, error.message);
            return { success: false, phone: driver.phone, error: error.message };
          }
        }
        return { success: false, phone: 'N/A', error: 'No phone number' };
      })
    );

    const whatsappSuccess = whatsappResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
    console.log(`[WhatsApp] Successfully sent ${whatsappSuccess}/${driversToNotify.length} templates`);

    res.json({ 
      success: true, 
      message: `Booking sent to ${newResponses.length} new drivers (${drivers.length} total available)`,
      newDriversCount: newResponses.length,
      totalDriversCount: drivers.length,
      existingResponsesCount: successfulResponses.length - newResponses.length,
      whatsappSent: whatsappSuccess,
      responses: successfulResponses
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
        driverId
      },
      include: {
        booking: {
          include: { 
            customer: true
          }
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

    // Send WhatsApp confirmation to allocated driver
    if (booking.driver?.phone) {
      try {
        const confirmationData = {
          phone: booking.driver.phone,
          templateName: 'driver_booking_confirmation_2',
          parameters: {
            bookingType: `${booking.serviceType} - ${booking.tripType}`,
            fareAmount: `₹${booking.estimateAmount || 0}`,
            pickup: booking.pickupLocation,
            destination: booking.dropLocation,
            pickupTime: new Date(booking.startDateTime).toLocaleTimeString('en-IN', { 
              hour: '2-digit', 
              minute: '2-digit',
              timeZone: 'Asia/Kolkata'
            }),
            customerContact: booking.customer?.phone || 'N/A'
          }
        };
        
        const mockReq = { body: confirmationData };
        let whatsappResult = { success: false };
        let statusCode = 200;
        const mockRes = {
          json: (data) => {
            whatsappResult = data;
            return data;
          },
          status: (code) => {
            statusCode = code;
            return {
              json: (data) => {
                whatsappResult = { ...data, statusCode: code };
                return { status: code, ...data };
              }
            };
          }
        };
        
        await driverBookingConfirmation(mockReq, mockRes);
        
        if (whatsappResult.success && statusCode < 400) {
          console.log(`[WhatsApp] Confirmation sent to driver ${booking.driver.phone}`);
        } else {
          console.error(`[WhatsApp] Failed to send confirmation to ${booking.driver.phone}:`, whatsappResult.error);
        }
      } catch (error) {
        console.error(`[WhatsApp] Error sending confirmation:`, error.message);
      }
    }

    // Send WhatsApp notification to customer
    if (booking.customer?.phone) {
      try {
        const customerNotificationData = {
          phone: booking.customer.phone,
          templateName: 'customer_driver_assigned',
          parameters: {
            customerName: booking.customer.name || 'Customer',
            pickupTime: new Date(booking.startDateTime).toLocaleTimeString('en-IN', { 
              hour: '2-digit', 
              minute: '2-digit',
              timeZone: 'Asia/Kolkata'
            }),
            driverName: booking.driver?.name || 'Driver',
            driverMobile: `+91 ${booking.driver?.phone || 'N/A'}`,
            bookingType: `${booking.serviceType} - ${booking.tripType}`
          }
        };
        
        const mockReqCustomer = { body: customerNotificationData };
        let customerWhatsappResult = { success: false };
        let customerStatusCode = 200;
        const mockResCustomer = {
          json: (data) => {
            customerWhatsappResult = data;
            return data;
          },
          status: (code) => {
            customerStatusCode = code;
            return {
              json: (data) => {
                customerWhatsappResult = { ...data, statusCode: code };
                return { status: code, ...data };
              }
            };
          }
        };
        
        await customerDriverAssigned(mockReqCustomer, mockResCustomer);
        
        if (customerWhatsappResult.success && customerStatusCode < 400) {
          console.log(`[WhatsApp] Customer notification sent to ${booking.customer.phone}`);
        } else {
          console.error(`[WhatsApp] Failed to send customer notification to ${booking.customer.phone}:`, customerWhatsappResult.error);
        }
      } catch (error) {
        console.error(`[WhatsApp] Error sending customer notification:`, error.message);
      }
    }

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

// ADMIN: Send booking to leads with selected package
export const sendBookingToLeads = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { leadPackageId } = req.body;

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const leadPackage = await prisma.leadSubscriptionPlan.findUnique({ where: { id: leadPackageId } });
    if (!leadPackage) {
      return res.status(404).json({ success: false, error: 'Lead package not found' });
    }

    const leads = await prisma.lead.findMany({
      where: {
        leadSubscriptions: {
          some: {
            status: 'ACTIVE',
            planId: leadPackageId,
            endDate: { gte: new Date() }
          }
        }
      }
    });

    if (leads.length === 0) {
      return res.status(400).json({ success: false, error: 'No leads available with this package' });
    }

    // Create booking responses for each lead using upsert to prevent duplicates
    console.log(`[Booking] Creating lead responses for ${leads.length} leads using upsert`);
    
    const responses = await Promise.allSettled(
      leads.map(lead =>
        prisma.leadBookingResponse.upsert({
          where: {
            bookingId_leadId: {
              bookingId,
              leadId: lead.id
            }
          },
          update: {}, // Don't update if exists
          create: {
            bookingId,
            leadId: lead.id,
            status: 'PENDING'
          }
        })
      )
    );
    
    const successfulResponses = responses.filter(r => r.status === 'fulfilled').map(r => r.value);
    const newResponses = responses.filter((r, index) => {
      if (r.status === 'fulfilled') {
        // Check if this was a new creation (createdAt is very recent)
        const response = r.value;
        const isNew = new Date() - new Date(response.createdAt) < 5000; // Created within last 5 seconds
        return isNew;
      }
      return false;
    });
    
    console.log(`[Booking] Total lead responses: ${successfulResponses.length}, New responses: ${newResponses.length}`);
    
    if (newResponses.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Booking already sent to all available leads' 
      });
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { selectedLeadPackageId: leadPackageId }
    });

    res.json({ 
      success: true, 
      message: `Booking sent to ${newResponses.length} new leads (${leads.length} total available)`, 
      newLeadsCount: newResponses.length,
      totalLeadsCount: leads.length,
      existingResponsesCount: successfulResponses.length - newResponses.length
    });
  } catch (error) {
    console.error('Error sending booking to leads:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// LEAD: Get pending booking requests
export const getLeadPendingRequests = async (req, res) => {
  try {
    const leadId = req.user.id;

    const responses = await prisma.leadBookingResponse.findMany({
      where: { leadId },
      include: {
        booking: {
          include: { customer: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, requests: responses });
  } catch (error) {
    console.error('Error fetching lead requests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// LEAD: Accept or reject booking request
export const respondToLeadBookingRequest = async (req, res) => {
  try {
    const { responseId } = req.params;
    const { action } = req.body;

    if (!['ACCEPTED', 'REJECTED'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    const response = await prisma.leadBookingResponse.update({
      where: { id: responseId },
      data: { status: action, respondedAt: new Date() },
      include: { booking: true, lead: true }
    });

    res.json({ success: true, response, message: `Booking request ${action.toLowerCase()}` });
  } catch (error) {
    console.error('Error responding to booking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ADMIN: Get lead booking responses
export const getLeadBookingResponses = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const responses = await prisma.leadBookingResponse.findMany({
      where: { bookingId },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            rating: true,
            totalRides: true,
            photo: true
          }
        }
      }
    });

    const acceptedLeads = responses.filter(r => r.status === 'ACCEPTED');

    res.json({ success: true, responses, acceptedLeads, acceptedCount: acceptedLeads.length });
  } catch (error) {
    console.error('Error fetching lead responses:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ADMIN: Allocate lead to booking
export const allocateLeadToBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { leadId } = req.body;

    if (!leadId) {
      return res.status(400).json({ success: false, error: 'Lead ID required' });
    }

    const response = await prisma.leadBookingResponse.findUnique({
      where: { bookingId_leadId: { bookingId, leadId } }
    });

    if (!response || response.status !== 'ACCEPTED') {
      return res.status(400).json({ success: false, error: 'Lead has not accepted this booking' });
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        leadId,
        allocatedAt: new Date(),
        status: 'CONFIRMED'
      },
      include: {
        customer: true,
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            rating: true,
            photo: true
          }
        }
      }
    });

    res.json({ success: true, booking, message: 'Lead allocated successfully' });
  } catch (error) {
    console.error('Error allocating lead:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
