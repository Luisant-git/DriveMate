import prisma from '../config/database.js';

export const createTrip = async (req, res) => {
  try {
    const {
      type,
      pickupLocation,
      dropLocation,
      startDate,
      startTime,
      duration,
    } = req.body;

    const userId = req.user.userId;
    let customer = await prisma.customer.findUnique({ where: { userId } });

    if (!customer) {
      // Get user's phone number
      const user = await prisma.user.findUnique({ where: { id: userId } });
      customer = await prisma.customer.create({
        data: { 
          userId,
          phone: user.phone
        }
      });
    }

    // Map frontend booking types to database enum values
    const packageTypeMap = {
      'Local - Hourly': 'LOCAL',
      'Outstation': 'OUTSTATION',
      'Monthly Driver': 'LOCAL',
      'Spare Driver': 'LOCAL',
      'Temporary Driver': 'LOCAL',
      'Weekly Driver': 'LOCAL',
      'Daily Driver': 'LOCAL',
      'Valet/Wallet Parking': 'LOCAL',
      'One-way Drop': 'OUTSTATION',
      'Two-way Drop': 'OUTSTATION'
    };

    const mappedPackageType = packageTypeMap[type] || 'LOCAL';

    const trip = await prisma.trip.create({
      data: {
        customerId: customer.id,
        fromLocation: pickupLocation,
        toLocation: dropLocation,
        packageType: mappedPackageType,
        duration,
        startDate: new Date(`${startDate}T${startTime}`),
        status: 'UPCOMING',
        totalAmount: 0,
      },
      include: {
        customer: { include: { user: true } },
      },
    });

    res.status(201).json({ trip });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getTrips = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { role } = req.user;
    
    let trips = [];
    
    if (role === 'DRIVER') {
      let driver = await prisma.driver.findUnique({ where: { userId } });
      if (!driver) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        driver = await prisma.driver.create({ 
          data: { 
            userId,
            phone: user.phone
          }
        });
      }
      trips = await prisma.trip.findMany({
        where: { 
          OR: [
            { driverId: driver.id },
            { status: 'PENDING', driverId: null }
          ]
        },
        include: {
          customer: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (role === 'CUSTOMER') {
      let customer = await prisma.customer.findUnique({ where: { userId } });
      if (!customer) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        customer = await prisma.customer.create({ 
          data: { 
            userId,
            phone: user.phone
          }
        });
      }
      trips = await prisma.trip.findMany({
        where: { customerId: customer.id },
        include: {
          driver: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json({ trips });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTripStatus = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    const updateData = { status };
    
    if (status === 'ACCEPTED') {
      const driver = await prisma.driver.findUnique({ where: { userId } });
      updateData.driverId = driver.id;
    }
    
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const trip = await prisma.trip.update({
      where: { id: tripId },
      data: updateData,
      include: {
        customer: { include: { user: true } },
        driver: { include: { user: true } },
      },
    });

    res.json({ trip });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};