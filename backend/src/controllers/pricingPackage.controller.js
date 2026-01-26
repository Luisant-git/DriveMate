import prisma from '../config/database.js';

export const getAllPricingPackages = async (req, res) => {
  try {
    const pricing = await prisma.pricingPackage.findMany({
      orderBy: [{ packageType: 'asc' }, { hours: 'asc' }]
    });
    res.json({ success: true, pricing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createPricingPackage = async (req, res) => {
  try {
    const { packageType, hours, minimumCharge, minimumKm, extraPerHour, description } = req.body;
    
    const data = {
      packageType,
      hours: parseInt(hours),
      minimumCharge: parseFloat(minimumCharge),
      minimumKm: minimumKm && minimumKm !== '' ? parseInt(minimumKm) : null,
      extraPerHour: parseFloat(extraPerHour)
    };
    
    if (description) data.description = description;
    
    const pricing = await prisma.pricingPackage.create({ data });
    
    res.status(201).json({ success: true, pricing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePricingPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { minimumCharge, minimumKm, extraPerHour, description, isActive } = req.body;
    
    const data = {
      minimumCharge: parseFloat(minimumCharge),
      minimumKm: minimumKm && minimumKm !== '' ? parseInt(minimumKm) : null,
      extraPerHour: parseFloat(extraPerHour)
    };
    
    if (description !== undefined) data.description = description;
    if (isActive !== undefined) data.isActive = isActive;
    
    const pricing = await prisma.pricingPackage.update({
      where: { id },
      data
    });
    
    res.json({ success: true, pricing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deletePricingPackage = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.pricingPackage.delete({ where: { id } });
    res.json({ success: true, message: 'Pricing deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getEstimateByPackage = async (req, res) => {
  try {
    const { packageType, hours } = req.query;
    
    const pricing = await prisma.pricingPackage.findUnique({
      where: { 
        packageType_hours: { 
          packageType, 
          hours: parseInt(hours) 
        },
        isActive: true
      }
    });
    
    if (!pricing) {
      return res.status(404).json({ success: false, error: 'Pricing not found' });
    }
    
    res.json({ 
      success: true, 
      estimate: pricing.minimumCharge,
      pricing
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
