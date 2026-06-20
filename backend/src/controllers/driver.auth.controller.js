import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export const driverRegister = async (req, res) => {
  try {
    const { 
      name, phone, password, aadharNo, licenseNo, licenseExpiryDate,
      currentAddress, permanentAddress,
      altPhone, upiId, photo, dlPhoto, panPhoto, aadharPhoto,
      policeVerificationPhoto
    } = req.body;
    
    // Check if driver already exists
    const existingDriver = await prisma.driver.findFirst({
      where: { phone }
    });

    if (existingDriver) {
      return res.status(400).json({ error: 'Driver with this phone already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const driverData = {
      name,
      phone,
      password: hashedPassword,
      aadharNo,
      licenseNo,
      ...(licenseExpiryDate && { licenseExpiryDate }),
      ...(currentAddress && { currentAddress }),
      ...(permanentAddress && { permanentAddress }),
      ...(altPhone?.[0] && { alternateMobile1: altPhone[0] }),
      ...(altPhone?.[1] && { alternateMobile2: altPhone[1] }),
      ...(altPhone?.[2] && { alternateMobile3: altPhone[2] }),
      ...(altPhone?.[3] && { alternateMobile4: altPhone[3] }),
      ...(upiId && { gpayNo: upiId, phonepeNo: upiId }),
      ...(photo && { photo }),
      ...(dlPhoto && { dlPhoto }),
      ...(panPhoto && { panPhoto }),
      ...(aadharPhoto && { aadharPhoto }),
      ...(policeVerificationPhoto && { policeVerificationPhoto }) 
    };

    const driver = await prisma.driver.create({
      data: driverData
    });

    const token = jwt.sign({ userId: driver.id, role: 'DRIVER' }, process.env.JWT_SECRET);
    req.session.userId = driver.id;
    req.session.role = 'DRIVER';
    
    res.status(201).json({
      token,
      driver: { 
        id: driver.id, 
        name, 
        phone, 
        status: driver.status
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const driverLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone number and password are required' });
    }
    
    const driver = await prisma.driver.findFirst({
      where: { phone }
    });

    if (!driver) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!driver.password || typeof driver.password !== 'string') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, driver.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!driver.isActive) {
      return res.status(403).json({ error: 'Your account is not active. Please contact admin.' });
    }

    const token = jwt.sign({ userId: driver.id, role: 'DRIVER' }, process.env.JWT_SECRET);
    req.session.userId = driver.id;
    req.session.role = 'DRIVER';
    
    const { password: _, ...driverWithoutPassword } = driver;
    res.json({
      token,
      driver: { 
        ...driverWithoutPassword,
        role: 'DRIVER'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

