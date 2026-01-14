import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export const driverRegister = async (req, res) => {
  try {
    const { name, email, phone, password, aadharNo, licenseNo, altPhone, upiId } = req.body;
    
    // Check if driver already exists
    const existingDriver = await prisma.driver.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      }
    });

    if (existingDriver) {
      return res.status(400).json({ error: 'Driver with this email or phone already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const driverData = {
      name,
      email,
      phone,
      password: hashedPassword,
      aadharNo,
      licenseNo,
      ...(altPhone?.[0] && { alternateMobile1: altPhone[0] }),
      ...(altPhone?.[1] && { alternateMobile2: altPhone[1] }),
      ...(altPhone?.[2] && { alternateMobile3: altPhone[2] }),
      ...(altPhone?.[3] && { alternateMobile4: altPhone[3] }),
      ...(upiId && { gpayNo: upiId, phonepeNo: upiId })
    };

    const driver = await prisma.driver.create({
      data: driverData
    });

    const token = jwt.sign({ userId: driver.id, role: 'DRIVER' }, process.env.JWT_SECRET);
    req.session.userId = driver.id;
    req.session.role = 'DRIVER';
    
    res.status(201).json({
      token,
      driver: { id: driver.id, email, name, phone, status: driver.status }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const driverLogin = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    
    const driver = await prisma.driver.findFirst({
      where: {
        OR: [
          { email: email || '' },
          { phone: phone || '' }
        ]
      }
    });

    if (!driver) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Ensure password is a string
    if (!driver.password || typeof driver.password !== 'string') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, driver.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: driver.id, role: 'DRIVER' }, process.env.JWT_SECRET);
    req.session.userId = driver.id;
    req.session.role = 'DRIVER';
    
    res.json({
      token,
      driver: { 
        id: driver.id, 
        email: driver.email, 
        name: driver.name, 
        phone: driver.phone,
        status: driver.status,
        isOnline: driver.isOnline
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
