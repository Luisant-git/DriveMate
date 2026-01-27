import prisma from '../config/database.js';

export const registerDriver = async (req, res) => {
  try {
    const { 
      phone, 
      aadharNo, 
      photo, 
      dlPhoto, 
      panPhoto, 
      alternateMobile1,
      alternateMobile2, 
      alternateMobile3, 
      alternateMobile4,
      gpayNo, 
      phonepeNo, 
      vehicleNo, 
      vehicleType,
      packageType 
    } = req.body;

    const driver = await prisma.driver.create({
      data: {
        phone,
        aadharNo,
        photo,
        dlPhoto,
        panPhoto,
        alternateMobile1,
        alternateMobile2,
        alternateMobile3,
        alternateMobile4,
        gpayNo,
        phonepeNo,
        vehicleNo,
        vehicleType,
        packageType: packageType || 'LOCAL',
      },
    });

    res.status(201).json(driver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateDriverStatus = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status } = req.body;

    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: { status },
      include: { user: true },
    });

    res.json(driver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateDriverLocation = async (req, res) => {
  try {
    const { latitude, longitude, rideId } = req.body;
    const driverId = req.user.userId;

    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: { latitude, longitude },
    });

    // If driver is on active ride, save tracking point
    if (rideId) {
      await prisma.trackingPoint.create({
        data: {
          rideId,
          latitude,
          longitude,
        },
      });
    }

    res.json(driver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const toggleOnlineStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;
    const driverId = req.user.userId;

    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: { isOnline },
    });

    res.json(driver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getDriverProfile = async (req, res) => {
  try {
    const driverId = req.user.userId;

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        subscriptions: {
          include: { plan: true },
        },
      },
    });

    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateDriverPackage = async (req, res) => {
  try {
    const { packageType } = req.body;
    const driverId = req.user.id;

    console.log('Updating driver package:', { driverId, packageType });

    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: { packageType },
    });

    console.log('Driver updated:', driver);

    res.json({ success: true, driver, packageType: driver.packageType });
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getAvailableDriversByPackage = async (req, res) => {
  try {
    const { packageType } = req.params;

    const drivers = await prisma.driver.findMany({
      where: {
        OR: [
          { packageType: packageType },
          { packageType: 'ALL_PREMIUM' }
        ]
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        rating: true,
        totalRides: true,
        vehicleNo: true,
        vehicleType: true,
        packageType: true,
        photo: true,
        status: true,
        isOnline: true
      },
      orderBy: {
        rating: 'desc'
      }
    });

    res.json({ success: true, drivers, count: drivers.length });
  } catch (error) {
    console.error('Error fetching available drivers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllDrivers = async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        rating: true,
        totalRides: true,
        vehicleNo: true,
        vehicleType: true,
        packageType: true,
        status: true,
        isOnline: true,
        photo: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: error.message });
  }
};