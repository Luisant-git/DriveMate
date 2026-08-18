import axios from 'axios';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';

export interface FareBreakdown {
  baseFare: number;
  extraHours: number;
  extraHourCharge: number;
  totalFare: number;
  packageType: 'LOCAL' | 'OUTSTATION';
  description: string;
  scheduledCharge?: number;
  immediateCharge?: number;
  extraPerHourSch?: number;
  extraPerHourImm?: number;
  hours?: number;
  minimumKm?: number;
}

export async function calculateFare(
  hours: number,
  distance: number = 0,
  isOutstation: boolean = false,
  isImmediate: boolean = false
): Promise<FareBreakdown | null> {
  try {
    const packageType = isOutstation ? 'OUTSTATION' : 'LOCAL_HOURLY';
    const roundedHours = Math.ceil(hours);
    
    const response = await axios.get(`${API_URL}/api/pricing-packages/estimate`, {
      params: { packageType, hours: roundedHours, distance, isImmediate }
    });
    
    if (response.data.success && response.data.pricing) {
      const pricing = response.data.pricing;
      const finalEstimate = response.data.estimate || pricing.minimumCharge;
      
      return {
        baseFare: finalEstimate,
        extraHours: 0,
        extraHourCharge: 0,
        totalFare: finalEstimate,
        packageType: isOutstation ? 'OUTSTATION' : 'LOCAL',
        description: pricing.description || `${pricing.hours} Hour Package`,
        scheduledCharge: pricing.minimumCharge,
        immediateCharge: pricing.immediateCharge,
        extraPerHourSch: pricing.extraPerHour,
        extraPerHourImm: pricing.extraPerHourImm
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching fare:', error);
    return null;
  }
}

export async function calculateOutstationFareByDistance(
  distanceKm: number,
  isImmediate: boolean = false
): Promise<FareBreakdown | null> {
  try {
    // Determine hours based on distance
    let hours = 8;
    if (distanceKm >= 151 && distanceKm <= 300) {
      hours = 10;
    } else if (distanceKm > 300) {
      hours = 12;
    }
    
    const response = await axios.get(`${API_URL}/api/pricing-packages/estimate`, {
      params: { packageType: 'OUTSTATION', hours, distance: distanceKm, isImmediate }
    });
    
    if (response.data.success && response.data.pricing) {
      const pricing = response.data.pricing;
      const finalEstimate = response.data.estimate || pricing.minimumCharge;

      return {
        baseFare: finalEstimate,
        extraHours: 0,
        extraHourCharge: 0,
        totalFare: finalEstimate,
        packageType: 'OUTSTATION',
        description: `${pricing.hours} Hours Package (${distanceKm} KM)`,
        scheduledCharge: pricing.minimumCharge,
        immediateCharge: pricing.immediateCharge,
        extraPerHourSch: pricing.extraPerHour,
        extraPerHourImm: pricing.extraPerHourImm
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching outstation fare:', error);
    return null;
  }
}

export async function calculateLocalFareByDistance(
  distanceKm: number,
  isImmediate: boolean = false
): Promise<FareBreakdown | null> {
  try {
    const response = await axios.get(`${API_URL}/api/pricing-packages/estimate`, {
      params: { packageType: 'LOCAL_HOURLY', hours: 1, distance: distanceKm, isImmediate }
    });
    
    if (response.data.success && response.data.pricing) {
      const pricing = response.data.pricing;
      const finalEstimate = response.data.estimate || pricing.minimumCharge;

      return {
        baseFare: finalEstimate,
        extraHours: 0,
        extraHourCharge: 0,
        totalFare: finalEstimate,
        packageType: 'LOCAL',
        description: pricing.description || `${pricing.hours} Hour${pricing.hours > 1 ? 's' : ''} Package (Min KM ${pricing.minimumKm})`,
        scheduledCharge: pricing.minimumCharge,
        immediateCharge: pricing.immediateCharge,
        extraPerHourSch: pricing.extraPerHour,
        extraPerHourImm: pricing.extraPerHourImm,
        hours: pricing.hours,
        minimumKm: pricing.minimumKm
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching local fare:', error);
    return null;
  }
}

export function parseDurationToHours(duration: string): number {
  const lower = duration.toLowerCase();
  
  if (lower.includes('day')) {
    const days = parseInt(lower);
    return days * 24;
  } else if (lower.includes('hr')) {
    return parseInt(lower);
  }
  
  return 4;
}
