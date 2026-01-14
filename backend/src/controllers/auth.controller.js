import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

// Hardcoded OTP for demo
const DEMO_OTP = '1234';

export const register = async (req, res) => {
  try {
    const { email, phone, password, name, role = 'CUSTOMER', ...otherFields } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    let user;
    if (role === 'CUSTOMER') {
      user = await prisma.customer.create({
        data: {
          email,
          phone,
          password: hashedPassword,
          name,
        },
      });
    } else if (role === 'DRIVER') {
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

      const { altPhone, upiId, photo, dlPhoto, panPhoto, aadharPhoto, ...validDriverFields } = otherFields;
      user = await prisma.driver.create({
        data: {
          email,
          phone,
          password: hashedPassword,
          name,
          ...validDriverFields,
          ...(altPhone?.[0] && { alternateMobile1: altPhone[0] }),
          ...(altPhone?.[1] && { alternateMobile2: altPhone[1] }),
          ...(altPhone?.[2] && { alternateMobile3: altPhone[2] }),
          ...(altPhone?.[3] && { alternateMobile4: altPhone[3] }),
          ...(upiId && { gpayNo: upiId, phonepeNo: upiId }),
          ...(photo && { photo }),
          ...(dlPhoto && { dlPhoto }),
          ...(panPhoto && { panPhoto }),
          ...(aadharPhoto && { aadharPhoto })
        },
      });
    } else if (role === 'ADMIN') {
      user = await prisma.admin.create({
        data: {
          email,
          phone,
          password: hashedPassword,
          name,
        },
      });
    }

    const token = jwt.sign({ userId: user.id, role }, process.env.JWT_SECRET);
    req.session.userId = user.id;
    req.session.role = role;
    
    res.status(201).json({
      token,
      user: { id: user.id, email, name, role, phone },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    
    // Try to find user in each table
    let user = null;
    let role = null;
    
    // Check customer
    user = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: email || '' },
          { phone: phone || '' }
        ]
      },
    });
    if (user) role = 'CUSTOMER';
    
    // Check driver if not found
    if (!user) {
      user = await prisma.driver.findFirst({
        where: {
          OR: [
            { email: email || '' },
            { phone: phone || '' }
          ]
        },
      });
      if (user) role = 'DRIVER';
    }
    
    // Check admin if not found
    if (!user) {
      user = await prisma.admin.findFirst({
        where: {
          OR: [
            { email: email || '' },
            { phone: phone || '' }
          ]
        },
      });
      if (user) role = 'ADMIN';
    }

    if (!user || !user.password || typeof user.password !== 'string') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, role }, process.env.JWT_SECRET);
    req.session.userId = user.id;
    req.session.role = role;
    
    res.json({
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role, 
        phone: user.phone,
        ...(role === 'DRIVER' && {
          aadharNo: user.aadharNo,
          licenseNo: user.licenseNo,
          alternateMobile1: user.alternateMobile1,
          alternateMobile2: user.alternateMobile2,
          alternateMobile3: user.alternateMobile3,
          alternateMobile4: user.alternateMobile4,
          gpayNo: user.gpayNo,
          phonepeNo: user.phonepeNo,
          upiId: user.gpayNo,
          altPhone: [
            user.alternateMobile1,
            user.alternateMobile2,
            user.alternateMobile3,
            user.alternateMobile4
          ].filter(Boolean),
          status: user.status,
          isOnline: user.isOnline,
          rating: user.rating,
          completedTrips: user.totalRides,
          packageSubscription: user.packageType,
          avatarUrl: user.photo || '/default-avatar.png',
          photo: user.photo,
          dlPhoto: user.dlPhoto,
          panPhoto: user.panPhoto,
          aadharPhoto: user.aadharPhoto
        }),
        ...(role === 'CUSTOMER' && {
          address: user.address,
          idProof: user.idProof
        })
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone || phone.length < 10) {
      return res.status(400).json({ error: 'Valid phone number required' });
    }

    // In production, send actual OTP via SMS service
    console.log(`OTP for ${phone}: ${DEMO_OTP}`);
    
    res.json({ message: 'OTP sent successfully', phone });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP required' });
    }

    if (otp !== DEMO_OTP) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // Find or create customer
    let user = await prisma.customer.findUnique({ where: { phone } });
    
    if (!user) {
      user = await prisma.customer.create({
        data: {
          phone,
        }
      });
    }

    const token = jwt.sign({ userId: user.id, role: 'CUSTOMER' }, process.env.JWT_SECRET);
    if (req.session) {
      req.session.userId = user.id;
      req.session.role = 'CUSTOMER';
    }
    
    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, role: 'CUSTOMER', phone: user.phone, address: user.address, idProof: user.idProof }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Could not log out' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    let user = null;
    
    if (req.user.role === 'CUSTOMER') {
      user = await prisma.customer.findUnique({ where: { id: req.user.id } });
    } else if (req.user.role === 'DRIVER') {
      user = await prisma.driver.findUnique({ where: { id: req.user.id } });
    } else if (req.user.role === 'ADMIN') {
      user = await prisma.admin.findUnique({ where: { id: req.user.id } });
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ 
      success: true, 
      user: { 
        ...user, 
        role: req.user.role,
        ...(req.user.role === 'DRIVER' && { packageType: user.packageType })
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, address, idProof, phone, alternateMobile1, alternateMobile2, alternateMobile3, alternateMobile4, upiId, photo, dlPhoto, panPhoto, aadharPhoto } = req.body;
    
    let user = null;
    
    if (req.user.role === 'CUSTOMER') {
      user = await prisma.customer.update({
        where: { id: req.user.id },
        data: {
          name,
          email,
          address,
          idProof
        }
      });
    } else if (req.user.role === 'DRIVER') {
      user = await prisma.driver.update({
        where: { id: req.user.id },
        data: {
          name,
          email,
          ...(phone && { phone }),
          ...(alternateMobile1 !== undefined && { alternateMobile1: alternateMobile1 || null }),
          ...(alternateMobile2 !== undefined && { alternateMobile2: alternateMobile2 || null }),
          ...(alternateMobile3 !== undefined && { alternateMobile3: alternateMobile3 || null }),
          ...(alternateMobile4 !== undefined && { alternateMobile4: alternateMobile4 || null }),
          ...(upiId !== undefined && { gpayNo: upiId, phonepeNo: upiId }),
          ...(photo !== undefined && { photo }),
          ...(dlPhoto !== undefined && { dlPhoto }),
          ...(panPhoto !== undefined && { panPhoto }),
          ...(aadharPhoto !== undefined && { aadharPhoto })
        }
      });
    } else if (req.user.role === 'ADMIN') {
      user = await prisma.admin.update({
        where: { id: req.user.id },
        data: {
          name,
          email
        }
      });
    }

    res.json({ 
      success: true,
      user: { 
        ...user,
        role: req.user.role
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};