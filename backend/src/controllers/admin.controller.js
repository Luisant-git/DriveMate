import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';

export const getAllCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { email: null },
          { email: { not: { startsWith: 'deleted_' } } }
        ]
      },
      include: {
        bookings: {
          select: {
            id: true,
            status: true,
            serviceType: true,
            driverType: true,
            tripType: true,
            estimateAmount: true,
            finalAmount: true,
            startDateTime: true,
            pickupLocation: true,
            dropLocation: true,
            createdAt: true,
            paymentMethod: true,
            paymentStatus: true,
            cancellationRequested: true,
            driver: { select: { id: true, name: true, phone: true } },
            lead: { select: { id: true, name: true, phone: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Manually fetch customerNo, alternateMobile, whatsappNumber, address, idProof in case raw DB has fresh fields
    try {
      const rawCustomers = await prisma.$queryRawUnsafe(
        'SELECT id, "customerNo", "alternateMobile", "whatsappNumber", "address", "idProof", "advancePayment" FROM customers'
      );
      const rawMap = {};
      rawCustomers.forEach(c => { rawMap[c.id] = c; });
      const mappedCustomers = customers.map(c => {
        const raw = rawMap[c.id] || {};
        const bookings = c.bookings || [];
        const completedTrips = bookings.filter(b => b.status === 'COMPLETED').length;
        const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length;
        const totalSpent = bookings
          .filter(b => b.status === 'COMPLETED')
          .reduce((sum, b) => sum + (b.finalAmount || b.estimateAmount || 0), 0);

        // Sanitize email: if email is temporary placeholder (ends with @temp.com or contains temp/placeholder), hide it
        const hasTempEmail = c.email && (c.email.endsWith('@temp.com') || c.email.includes('placeholder') || c.email.includes('@temp.'));
        const sanitizedEmail = hasTempEmail ? null : c.email;

        return {
          ...c,
          email: sanitizedEmail,
          customerNo: raw.customerNo || c.customerNo,
          alternateMobile: raw.alternateMobile || c.alternateMobile || null,
          alternatePhone: raw.alternateMobile || c.alternatePhone || null,
          whatsappNumber: raw.whatsappNumber || c.whatsappNumber || null,
          address: raw.address || c.address || null,
          idProof: raw.idProof || c.idProof || null,
          advancePayment: raw.advancePayment !== undefined ? raw.advancePayment : (c.advancePayment || 0),
          totalBookings: bookings.length,
          completedTrips,
          cancelledBookings,
          totalSpent,
          bookings
        };
      });
      return res.json({ customers: mappedCustomers });
    } catch (e) {
      return res.json({ customers });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllDrivers = async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany({
      where: {
        OR: [
          { email: null },
          { email: { not: { startsWith: 'deleted_' } } }
        ]
      },
      include: {
        subscriptions: { include: { plan: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Manually fetch driverNo & policeVerificationNo since Prisma client is cached
    try {
      const driverCols = await prisma.$queryRawUnsafe('SELECT id, "driverNo", "policeVerificationNo" FROM drivers');
      const driverMap = {};
      driverCols.forEach(d => { driverMap[d.id] = d; });
      const mappedDrivers = drivers.map(d => ({
        ...d,
        driverNo: driverMap[d.id]?.driverNo || d.driverNo,
        policeVerificationNo: driverMap[d.id]?.policeVerificationNo || d.policeVerificationNo || null
      }));
      return res.json(mappedDrivers);
    } catch (e) {
      return res.json(drivers);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBusyDrivers = async (req, res) => {
  try {
    const busyBookings = await prisma.booking.findMany({
      where: { status: { in: ['CONFIRMED', 'ONGOING'] }, driverId: { not: null } },
      select: { driverId: true }
    });
    const busyTrips = await prisma.trip.findMany({
      where: { status: { in: ['UPCOMING', 'ONGOING'] }, driverId: { not: null } },
      select: { driverId: true }
    });
    const busyRides = await prisma.ride.findMany({
      where: { status: { in: ['ASSIGNED', 'STARTED'] }, driverId: { not: null } },
      select: { driverId: true }
    });

    const busyIds = new Set([
      ...busyBookings.map(b => b.driverId),
      ...busyTrips.map(t => t.driverId),
      ...busyRides.map(r => r.driverId)
    ]);
    
    res.json({ busyDriverIds: Array.from(busyIds) });
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

export const getAllLeads = async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      where: {
        NOT: {
          email: { startsWith: 'deleted_' }
        }
      },
      include: {
        leadSubscriptions: {
          include: { plan: true },
          orderBy: { startDate: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    try {
      const leadCols = await prisma.$queryRawUnsafe('SELECT id, "leadNo", "policeVerificationNo" FROM leads');
      const leadMap = {};
      leadCols.forEach(l => { leadMap[l.id] = l; });
      const mappedLeads = leads.map(l => ({
        ...l,
        leadNo: leadMap[l.id]?.leadNo || l.leadNo,
        policeVerificationNo: leadMap[l.id]?.policeVerificationNo || l.policeVerificationNo || null
      }));
      return res.json({ success: true, leads: mappedLeads });
    } catch (e) {
      return res.json({ success: true, leads });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const toggleLeadActiveStatus = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, error: 'isActive must be a boolean' });
    }

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: { isActive }
    });
    
    res.json({ success: true, lead });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const toggleDriverActiveStatus = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, error: 'isActive must be a boolean' });
    }

    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: { isActive }
    });
    
    res.json({ success: true, driver });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllLeadSubscriptions = async (req, res) => {
  try {
    const subscriptions = await prisma.leadSubscription.findMany({
      include: {
        lead: true,
        plan: true
      },
      orderBy: { startDate: 'desc' }
    });
    res.json({ success: true, subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ---- Quarterly Verification ----

export const submitVerification = async (req, res) => {
  try {
    const { entityId, entityType, status, notes } = req.body;
    if (!entityId || !entityType || !status) {
      return res.status(400).json({ success: false, error: 'entityId, entityType and status are required' });
    }

    const verifiedAt = new Date();
    const nextVerificationDue = new Date(verifiedAt);
    nextVerificationDue.setMonth(nextVerificationDue.getMonth() + 3);

    const record = await prisma.verificationRecord.create({
      data: { entityId, entityType, status, notes, verifiedAt }
    });

    if (entityType === 'DRIVER') {
      await prisma.driver.update({
        where: { id: entityId },
        data: { lastVerifiedAt: verifiedAt, nextVerificationDue }
      });
    } else if (entityType === 'LEAD') {
      await prisma.lead.update({
        where: { id: entityId },
        data: { lastVerifiedAt: verifiedAt, nextVerificationDue }
      });
    }

    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getVerificationHistory = async (req, res) => {
  try {
    const { entityId } = req.params;
    const records = await prisma.verificationRecord.findMany({
      where: { entityId },
      orderBy: { verifiedAt: 'desc' }
    });
    res.json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateDriverDocument = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { documentType, documentUrl, expiryDate, certificateNo, policeVerificationNo } = req.body;
    
    if (!documentType) {
      return res.status(400).json({ success: false, error: 'documentType is required' });
    }

    const data = {};
    if (documentType === 'policeVerificationPhoto') {
      data.policeVerificationPhoto = documentUrl || null;
      const certNo = certificateNo !== undefined ? certificateNo : policeVerificationNo;
      if (certNo !== undefined) {
        data.policeVerificationNo = certNo ? certNo.trim() : null;
      }
      if (documentUrl) {
        if (expiryDate) data.policeVerificationExpiryDate = new Date(expiryDate).toISOString();
      } else {
        data.policeVerificationExpiryDate = null;
      }
    } else if (documentType === 'dlPhoto') {
      data.dlPhoto = documentUrl || null;
      if (documentUrl) {
        if (expiryDate) data.licenseExpiryDate = new Date(expiryDate).toISOString();
      } else {
        data.licenseExpiryDate = null;
      }
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported document type' });
    }

    const driver = await prisma.driver.update({
      where: { id: driverId },
      data
    });

    res.json({ success: true, driver });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDeletedAccounts = async (req, res) => {
  try {
    const deletedAccounts = await prisma.deletedAccountArchive.findMany({
      orderBy: { deletedAt: 'desc' }
    });
    res.json({ success: true, deletedAccounts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const changeDriverPassword = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const approveLead = async (req, res) => { try { const lead = await prisma.lead.update({ where: { id: req.params.leadId }, data: { status: 'APPROVED' } }); res.json(lead); } catch (error) { res.status(400).json({ error: error.message }); } };
export const rejectLead = async (req, res) => { try { const lead = await prisma.lead.update({ where: { id: req.params.leadId }, data: { status: 'REJECTED' } }); res.json(lead); } catch (error) { res.status(400).json({ error: error.message }); } };
export const updateLeadDocument = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { documentType, documentUrl, expiryDate, certificateNo, policeVerificationNo } = req.body;

    if (!documentType) {
      return res.status(400).json({ success: false, error: 'documentType is required' });
    }

    const allowedDocs = [
      'photo', 'dlPhoto', 'aadharPhoto', 'panPhoto',
      'policeVerificationPhoto', 'msmePhoto', 'rationCardPhoto',
      'rentalAgreementPhoto', 'electricityBillPhoto', 'creditCardPhoto', 'debitCardPhoto'
    ];

    if (!allowedDocs.includes(documentType)) {
      return res.status(400).json({ success: false, error: `Unsupported document type: ${documentType}` });
    }

    const data = {};
    if (documentType === 'policeVerificationPhoto') {
      data.policeVerificationPhoto = documentUrl || null;
      const certNo = certificateNo !== undefined ? certificateNo : policeVerificationNo;
      if (certNo !== undefined) {
        data.policeVerificationNo = certNo ? certNo.trim() : null;
      }
      if (documentUrl) {
        if (expiryDate) data.policeVerificationExpiryDate = new Date(expiryDate).toISOString();
      } else {
        data.policeVerificationExpiryDate = null;
      }
    } else if (documentType === 'dlPhoto') {
      data.dlPhoto = documentUrl || null;
      if (documentUrl) {
        if (expiryDate) data.licenseExpiryDate = new Date(expiryDate).toISOString();
      } else {
        data.licenseExpiryDate = null;
      }
    } else {
      data[documentType] = documentUrl || null;
    }

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data
    });

    res.json({ success: true, lead });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
export const changeLeadPassword = async (req, res) => { try { const hashedPassword = await bcrypt.hash(req.body.password, 10); await prisma.lead.update({ where: { id: req.params.leadId }, data: { password: hashedPassword } }); res.json({ success: true }); } catch (error) { res.status(400).json({ error: error.message }); } };
