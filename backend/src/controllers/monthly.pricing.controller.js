import prisma from '../config/database.js';

export const getAllMonthlyPricing = async (req, res) => {
  try {
    const pricing = await prisma.monthlyPricing.findMany({
      orderBy: [
        { vehicleType: 'asc' },
        { hoursPerDay: 'asc' }
      ]
    });
    res.json({ success: true, pricing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createMonthlyPricing = async (req, res) => {
  try {
    const { vehicleType, hoursPerDay, daysPerWeek, charge5Days, charge6Days, extraPerHour } = req.body;
    
    const pricing = await prisma.monthlyPricing.create({
      data: {
        vehicleType,
        hoursPerDay,
        daysPerWeek,
        charge5Days: charge5Days ? parseFloat(charge5Days) : null,
        charge6Days: charge6Days ? parseFloat(charge6Days) : null,
        extraPerHour: parseFloat(extraPerHour) || 90
      }
    });
    
    res.json({ success: true, pricing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateMonthlyPricing = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicleType, hoursPerDay, daysPerWeek, charge5Days, charge6Days, extraPerHour, isActive } = req.body;
    
    const pricing = await prisma.monthlyPricing.update({
      where: { id },
      data: {
        vehicleType,
        hoursPerDay,
        daysPerWeek,
        charge5Days: charge5Days ? parseFloat(charge5Days) : null,
        charge6Days: charge6Days ? parseFloat(charge6Days) : null,
        extraPerHour: parseFloat(extraPerHour),
        isActive
      }
    });
    
    res.json({ success: true, pricing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteMonthlyPricing = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.monthlyPricing.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
