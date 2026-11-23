import prisma from '../config/database.js';

export const getAllPricingPackages = async (req, res) => {
  try {
    const { city } = req.query;
    let where = {};
    if (city && city.trim() && city.toUpperCase() !== 'ALL') {
      where = {
        cities: { has: city.trim() }
      };
    }
    const pricing = await prisma.pricingPackage.findMany({
      where,
      orderBy: [{ packageType: 'asc' }, { hours: 'asc' }]
    });
    res.json({ success: true, pricing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createPricingPackage = async (req, res) => {
  try {
    const { packageType, hours, minimumCharge, immediateCharge, minimumKm, extraPerHour, extraPerHourImm, description, cities } = req.body;
    
    const parsedCities = Array.isArray(cities) 
      ? cities.map(c => String(c).trim()).filter(Boolean) 
      : (typeof cities === 'string' && cities.trim() ? [cities.trim()] : []);

    const data = {
      packageType,
      hours: parseInt(hours),
      minimumCharge: parseFloat(minimumCharge),
      immediateCharge: immediateCharge ? parseFloat(immediateCharge) : null,
      minimumKm: minimumKm && minimumKm !== '' ? parseInt(minimumKm) : null,
      extraPerHour: parseFloat(extraPerHour),
      extraPerHourImm: extraPerHourImm ? parseFloat(extraPerHourImm) : null,
      cities: parsedCities
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
    const { packageType, hours, minimumCharge, immediateCharge, minimumKm, extraPerHour, extraPerHourImm, description, isActive, cities } = req.body;
    
    const data = {
      minimumCharge: parseFloat(minimumCharge),
      minimumKm: minimumKm && minimumKm !== '' ? parseInt(minimumKm) : null,
      extraPerHour: parseFloat(extraPerHour)
    };
    
    if (packageType !== undefined) data.packageType = packageType;
    if (hours !== undefined) data.hours = parseInt(hours);
    if (immediateCharge !== undefined) data.immediateCharge = immediateCharge ? parseFloat(immediateCharge) : null;
    if (extraPerHourImm !== undefined) data.extraPerHourImm = extraPerHourImm ? parseFloat(extraPerHourImm) : null;
    if (description !== undefined) data.description = description;
    if (isActive !== undefined) data.isActive = isActive;
    if (cities !== undefined) {
      data.cities = Array.isArray(cities) 
        ? cities.map(c => String(c).trim()).filter(Boolean) 
        : [];
    }
    
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
    const { packageType, hours, distance, isImmediate, city } = req.query;

    let allPackages = await prisma.pricingPackage.findMany({
      where: { packageType, isActive: true },
      orderBy: { hours: 'asc' }
    });

    if (!allPackages || allPackages.length === 0) {
      return res.status(404).json({ success: false, error: 'Pricing not found' });
    }

    // City-wise matching:
    // If a city is passed, prioritize packages configured for this city.
    // Otherwise fallback to default packages (where cities is empty)
    if (city && city.trim()) {
      const targetCity = city.trim().toLowerCase();
      const cityPackages = allPackages.filter(p => 
        Array.isArray(p.cities) && p.cities.some(c => c.toLowerCase() === targetCity)
      );
      if (cityPackages.length > 0) {
        allPackages = cityPackages;
      } else {
        const defaultPackages = allPackages.filter(p => !p.cities || p.cities.length === 0);
        if (defaultPackages.length > 0) {
          allPackages = defaultPackages;
        }
      }
    } else {
      const defaultPackages = allPackages.filter(p => !p.cities || p.cities.length === 0);
      if (defaultPackages.length > 0) {
        allPackages = defaultPackages;
      }
    }

    const requestedHours = parseInt(hours) || 0;
    const distanceKm = distance ? parseFloat(distance) : 0;
    let minRequiredHours = 0;

    // Minimum required package hours based on distance
    if (packageType === 'OUTSTATION' && distanceKm > 0) {
      const bands = allPackages
        .filter(p => p.minimumKm)
        .sort((a, b) => a.minimumKm - b.minimumKm);
      // For outstation, pick the package whose minimumKm is closest to or covered by distanceKm
      const matching = [...bands].reverse().find(p => distanceKm >= p.minimumKm)
        || bands[0]
        || allPackages[0];
      if (matching) {
        minRequiredHours = matching.hours;
      }
    } else if (packageType === 'LOCAL_HOURLY' && distanceKm > 0) {
      const bands = allPackages
        .filter(p => p.minimumKm)
        .sort((a, b) => a.minimumKm - b.minimumKm);
      const matching = bands.find(p => distanceKm <= p.minimumKm)
        || bands[bands.length - 1]
        || allPackages[allPackages.length - 1];
      if (matching) {
        minRequiredHours = matching.hours;
      }
    }

    // Effective hours respects the customer's selection, enforcing at least the distance minimum
    const defaultHours = packageType === 'OUTSTATION' ? 8 : 4;
    const effectiveHours = Math.max(requestedHours, minRequiredHours) || defaultHours;

    // Check if an exact pricing package exists for this effectiveHours
    const exactPkg = allPackages.find(p => p.hours === effectiveHours);

    let basePkg = null;
    let extraHours = 0;

    if (exactPkg) {
      basePkg = exactPkg;
      extraHours = 0;
    } else {
      // Find the best base package:
      // Pick the largest available package that is <= effectiveHours;
      // if none fits (effectiveHours is below smallest package), pick the smallest package
      const fittingPkgs = allPackages.filter(p => p.hours <= effectiveHours);
      basePkg = fittingPkgs.length > 0
        ? fittingPkgs[fittingPkgs.length - 1]
        : (allPackages.find(p => p.hours === minRequiredHours) || allPackages[0]);
      extraHours = Math.max(0, effectiveHours - basePkg.hours);
    }

    const isImm = isImmediate === 'true' || isImmediate === true;
    const extraHourRateSch = basePkg.extraPerHour || 100;
    const extraHourRateImm = basePkg.extraPerHourImm || basePkg.extraPerHour || 100;
    const effectiveExtraRate = isImm ? extraHourRateImm : extraHourRateSch;

    const extraHourCharge = extraHours * effectiveExtraRate;
    const extraHourChargeSch = extraHours * extraHourRateSch;
    const extraHourChargeImm = extraHours * extraHourRateImm;

    const baseScheduled = basePkg.minimumCharge;
    const baseImmediate = basePkg.immediateCharge || basePkg.minimumCharge;

    const scheduledEstimate = baseScheduled + extraHourChargeSch;
    const immediateEstimate = baseImmediate + extraHourChargeImm;
    const finalEstimate = isImm ? immediateEstimate : scheduledEstimate;

    const extraText = extraHours > 0 ? ` + ${extraHours} Extra Hr${extraHours > 1 ? 's' : ''}` : '';
    const description = `${basePkg.description || `${basePkg.hours} Hour Package`}${extraText}`;

    res.json({
      success: true,
      estimate: finalEstimate,
      baseFare: isImm ? baseImmediate : baseScheduled,
      baseScheduled,
      baseImmediate,
      extraHours,
      extraHourRate: effectiveExtraRate,
      extraHourCharge,
      scheduledEstimate,
      immediateEstimate,
      effectiveHours,
      description,
      pricing: {
        ...basePkg,
        hours: basePkg.hours,
        requestedHours: effectiveHours,
        extraHours,
        extraHourCharge,
        extraPerHour: extraHourRateSch,
        extraPerHourImm: extraHourRateImm,
        scheduledCharge: scheduledEstimate,
        immediateCharge: immediateEstimate,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
