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
    const { packageType, hours, minimumCharge, immediateCharge, minimumKm, extraPerHour, extraPerHourImm, description } = req.body;
    
    const data = {
      packageType,
      hours: parseInt(hours),
      minimumCharge: parseFloat(minimumCharge),
      immediateCharge: immediateCharge ? parseFloat(immediateCharge) : null,
      minimumKm: minimumKm && minimumKm !== '' ? parseInt(minimumKm) : null,
      extraPerHour: parseFloat(extraPerHour),
      extraPerHourImm: extraPerHourImm ? parseFloat(extraPerHourImm) : null
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
    const { minimumCharge, immediateCharge, minimumKm, extraPerHour, extraPerHourImm, description, isActive } = req.body;
    
    const data = {
      minimumCharge: parseFloat(minimumCharge),
      minimumKm: minimumKm && minimumKm !== '' ? parseInt(minimumKm) : null,
      extraPerHour: parseFloat(extraPerHour)
    };
    
    if (immediateCharge !== undefined) data.immediateCharge = immediateCharge ? parseFloat(immediateCharge) : null;
    if (extraPerHourImm !== undefined) data.extraPerHourImm = extraPerHourImm ? parseFloat(extraPerHourImm) : null;
    
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
    const { packageType, hours, distance, isImmediate } = req.query;
    
    // For OUTSTATION with distance, auto-determine hours based on KM
    let queryHours = parseInt(hours);
    
    if (packageType === 'OUTSTATION' && distance) {
      const distanceKm = parseInt(distance);
      
      // Determine hours based on distance ranges
      if (distanceKm >= 60 && distanceKm <= 150) {
        queryHours = 8;
      } else if (distanceKm >= 151 && distanceKm <= 300) {
        queryHours = 10;
      } else if (distanceKm > 300) {
        queryHours = 12;
      } else {
        queryHours = 8; // Default minimum
      }
    }
    
    // For LOCAL_HOURLY with distance, auto-determine hours based on Min KM
    if (packageType === 'LOCAL_HOURLY' && distance && parseInt(distance) > 0) {
      const distanceKm = parseInt(distance);
      const localPackages = await prisma.pricingPackage.findMany({
        where: { packageType: 'LOCAL_HOURLY', isActive: true, minimumKm: { not: null } },
        orderBy: { minimumKm: 'asc' }
      });
      // Pick the smallest package whose Min KM covers the distance; else the largest
      const matching = localPackages.find(p => distanceKm <= p.minimumKm) || localPackages[localPackages.length - 1];
      if (matching) {
        queryHours = matching.hours;
      }
    }
    
    const pricing = await prisma.pricingPackage.findUnique({
      where: { 
        packageType_hours: { 
          packageType, 
          hours: queryHours
        },
        isActive: true
      }
    });
    
    if (!pricing) {
      return res.status(404).json({ success: false, error: 'Pricing not found' });
    }
    
    const finalEstimate = (isImmediate === 'true' && pricing.immediateCharge) 
      ? pricing.immediateCharge 
      : pricing.minimumCharge;
    
    res.json({ 
      success: true, 
      estimate: finalEstimate,
      pricing
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
