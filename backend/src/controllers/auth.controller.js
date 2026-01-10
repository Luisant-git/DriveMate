import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

// Hardcoded OTP for demo
const DEMO_OTP = '1234';

export const register = async (req, res) => {
  try {
    const { email, phone, password, name, role = 'CUSTOMER' } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        name,
        role,
      },
    });

    // Create role-specific record
    if (role === 'CUSTOMER') {
      await prisma.customer.create({
        data: { userId: user.id },
      });
    } else if (role === 'ADMIN') {
      await prisma.admin.create({
        data: { userId: user.id },
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
    
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || '' },
          { phone: phone || '' }
        ]
      },
    });

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET);
    req.session.userId = user.id;
    req.session.role = user.role;
    
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone },
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
    let user = await prisma.user.findUnique({ where: { phone } });
    
    if (!user) {
      const hashedPassword = await bcrypt.hash('otp-user', 10);
      user = await prisma.user.create({
        data: {
          phone,
          name: `Customer ${phone.slice(-4)}`,
          role: 'CUSTOMER',
          email: `${phone}@temp.com`,
          password: hashedPassword
        }
      });
      
      await prisma.customer.create({
        data: { userId: user.id }
      });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET);
    if (req.session) {
      req.session.userId = user.id;
      req.session.role = user.role;
    }
    
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone }
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
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        customer: true,
        driver: true,
        admin: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};