import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is still active in database for Drivers and Leads
    if (user.role === 'DRIVER') {
      const driver = await prisma.driver.findUnique({ where: { id: user.userId || user.id } });
      if (!driver || !driver.isActive) {
        return res.status(401).json({ error: 'Account is deactivated. Logout required.' });
      }
    } else if (user.type === 'lead') {
      const lead = await prisma.lead.findUnique({ where: { id: user.id } });
      if (!lead || !lead.isActive) {
        return res.status(401).json({ error: 'Lead account is deactivated. Logout required.' });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    console.log('JWT verify error:', err);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const authenticateLead = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.type !== 'lead') {
      return res.status(403).json({ error: 'Invalid token type' });
    }

    const lead = await prisma.lead.findUnique({ where: { id: user.id } });
    if (!lead || !lead.isActive) {
      return res.status(401).json({ error: 'Account is deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    const userRole = req.user.role || (req.user.type === 'lead' ? 'LEAD' : null);
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};