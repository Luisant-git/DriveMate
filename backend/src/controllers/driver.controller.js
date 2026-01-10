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
    const userId = req.user.userId;

    const driver = await prisma.driver.create({
      data: {
        userId,
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
    const userId = req.user.userId;

    const driver = await prisma.driver.update({
      where: { userId },
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
    const userId = req.user.userId;

    const driver = await prisma.driver.update({
      where: { userId },
      data: { isOnline },
    });

    res.json(driver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getDriverProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const driver = await prisma.driver.findUnique({
      where: { userId },
      include: {
        user: true,
        subscription: {
          include: { plan: true },
        },
      },
    });

    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};