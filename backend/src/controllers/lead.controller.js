import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registerLead = async (req, res) => {
  try {
    const { 
      name, email, phone, password, aadharNo, licenseNo,
      alternateMobile1, alternateMobile2, alternateMobile3, alternateMobile4,
      gpayNo, photo, dlPhoto, panPhoto, aadharPhoto
    } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        aadharNo,
        licenseNo,
        alternateMobile1,
        alternateMobile2,
        alternateMobile3,
        alternateMobile4,
        gpayNo,
        photo,
        dlPhoto,
        panPhoto,
        aadharPhoto
      }
    });
    
    res.status(201).json({ success: true, lead });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const loginLead = async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    const lead = await prisma.lead.findUnique({ where: { phone } });
    if (!lead) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const isValid = await bcrypt.compare(password, lead.password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: lead.id, type: 'lead' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ success: true, token, lead });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllLeads = async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        leadSubscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    res.json({ success: true, leads });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const lead = await prisma.lead.update({
      where: { id },
      data: updates
    });
    
    res.json({ success: true, lead });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateLeadProfile = async (req, res) => {
  try {
    const leadId = req.user.id;
    const updates = req.body;
    
    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: updates
    });
    
    res.json({ success: true, lead });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getLeadCountByType = async (req, res) => {
  try {
    const { packageType } = req.params;
    
    const count = await prisma.lead.count({
      where: {
        leadSubscriptions: {
          some: {
            status: 'ACTIVE',
            plan: {
              type: packageType,
              isActive: true
            },
            endDate: {
              gte: new Date()
            }
          }
        }
      }
    });
    
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
