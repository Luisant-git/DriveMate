import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registerLead = async (req, res) => {
  try {
    const { 
      name, email, phone, password, aadharNo, licenseNo,
      alternateMobile1, alternateMobile2, alternateMobile3, alternateMobile4,
      gpayNo, photo, dlPhoto, panPhoto, aadharPhoto,
      msmePhoto, rationCardPhoto, policeVerificationPhoto,
      electricityBillPhoto, rentalAgreementPhoto, creditCardPhoto, debitCardPhoto
    } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Clean data - convert empty strings to null
    const cleanData = (value) => value === '' ? null : value;
    
    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        aadharNo,
        licenseNo,
        alternateMobile1: cleanData(alternateMobile1),
        alternateMobile2: cleanData(alternateMobile2),
        alternateMobile3: cleanData(alternateMobile3),
        alternateMobile4: cleanData(alternateMobile4),
        gpayNo: cleanData(gpayNo),
        photo: cleanData(photo),
        dlPhoto: cleanData(dlPhoto),
        panPhoto: cleanData(panPhoto),
        aadharPhoto: cleanData(aadharPhoto),
        msmePhoto: cleanData(msmePhoto),
        rationCardPhoto: cleanData(rationCardPhoto),
        policeVerificationPhoto: cleanData(policeVerificationPhoto),
        electricityBillPhoto: cleanData(electricityBillPhoto),
        rentalAgreementPhoto: cleanData(rentalAgreementPhoto),
        creditCardPhoto: cleanData(creditCardPhoto),
        debitCardPhoto: cleanData(debitCardPhoto)
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
    
    if (!lead.isActive) {
      return res.status(403).json({ success: false, error: 'Your lead account is not active. Please contact admin.' });
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
          orderBy: { startDate: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
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

export const getLeadProfile = async (req, res) => {
  try {
    const leadId = req.user.id;
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        leadSubscriptions: {
          include: { plan: true },
          orderBy: { startDate: 'desc' },
          take: 1
        }
      }
    });

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    res.json({ success: true, user: { ...lead, role: 'LEAD' } });
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

export const getLeadCountByPackage = async (req, res) => {
  try {
    const { packageId } = req.params;
    const { serviceType } = req.query; // Get service type from query params
    
    console.log(`[Lead Count] Counting leads with active subscriptions to package ${packageId} for service type ${serviceType}`);
    
    // Map booking service type to package type
    let requiredPackageType;
    if (serviceType === 'Local - Hourly') {
      requiredPackageType = 'LOCAL';
    } else if (serviceType === 'Outstation') {
      requiredPackageType = 'OUTSTATION';
    } else if (serviceType === 'Monthly') {
      requiredPackageType = 'MONTHLY';
    } else {
      requiredPackageType = 'LOCAL'; // Default fallback
    }

    console.log(`[Lead Count] Required package type: ${requiredPackageType}`);
    
    const count = await prisma.lead.count({
      where: {
        leadSubscriptions: {
          some: {
            status: 'ACTIVE',
            planId: packageId,
            endDate: {
              gte: new Date()
            },
            plan: {
              OR: [
                { type: requiredPackageType }, // Main type matches
                { types: { has: requiredPackageType } } // Or types array contains required type
              ]
            }
          }
        }
      }
    });
    
    console.log(`[Lead Count] Found ${count} leads with active subscriptions to package ${packageId} supporting ${requiredPackageType}`);
    
    res.json({ success: true, count });
  } catch (error) {
    console.error('[Lead Count] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
