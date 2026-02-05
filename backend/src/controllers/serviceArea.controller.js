import prisma from '../config/database.js';

export const getAllServiceAreas = async (req, res) => {
  try {
    const areas = await prisma.serviceArea.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, areas });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createServiceArea = async (req, res) => {
  try {
    const { name, city, state, radius, latitude, longitude } = req.body;
    
    const area = await prisma.serviceArea.create({
      data: {
        name,
        city,
        state,
        radius: parseFloat(radius),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      }
    });
    
    res.status(201).json({ success: true, area });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateServiceArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, city, state, radius, latitude, longitude, isActive } = req.body;
    
    const area = await prisma.serviceArea.update({
      where: { id },
      data: {
        name,
        city,
        state,
        radius: parseFloat(radius),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        isActive
      }
    });
    
    res.json({ success: true, area });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteServiceArea = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.serviceArea.delete({ where: { id } });
    res.json({ success: true, message: 'Service area deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const checkServiceAvailability = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    
    const areas = await prisma.serviceArea.findMany({
      where: { isActive: true }
    });
    
    // If no service areas defined, service is not available
    if (areas.length === 0) {
      return res.json({ success: true, available: false });
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    for (const area of areas) {
      const distance = calculateDistance(lat, lng, area.latitude, area.longitude);
      if (distance <= area.radius) {
        return res.json({ success: true, available: true, area: area.name });
      }
    }
    
    res.json({ success: true, available: false });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
