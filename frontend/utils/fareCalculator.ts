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
  isImmediate: boolean = false,
  city?: string
): Promise<FareBreakdown | null> {
  try {
    const packageType = isOutstation ? 'OUTSTATION' : 'LOCAL_HOURLY';
    const roundedHours = Math.ceil(hours);
    
    const response = await axios.get(`${API_URL}/api/pricing-packages/estimate`, {
      params: { packageType, hours: roundedHours, distance, isImmediate, ...(city && { city }) }
    });
    
    if (response.data.success && response.data.pricing) {
      const pricing = response.data.pricing;
      const finalEstimate = response.data.estimate ?? pricing.minimumCharge;
      const extraHours = response.data.extraHours || 0;
      const extraHourCharge = response.data.extraHourCharge || 0;
      const baseFare = response.data.baseFare || pricing.minimumCharge;
      const description = response.data.description || `${pricing.hours} Hour Package`;
      
      return {
        baseFare,
        extraHours,
        extraHourCharge,
        totalFare: finalEstimate,
        packageType: isOutstation ? 'OUTSTATION' : 'LOCAL',
        description,
        scheduledCharge: response.data.scheduledEstimate || (pricing.minimumCharge + extraHourCharge),
        immediateCharge: response.data.immediateEstimate || ((pricing.immediateCharge || pricing.minimumCharge) + extraHourCharge),
        extraPerHourSch: pricing.extraPerHour,
        extraPerHourImm: pricing.extraPerHourImm || pricing.extraPerHour,
        hours: pricing.hours,
        minimumKm: pricing.minimumKm
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
  isImmediate: boolean = false,
  selectedHours?: number,
  city?: string
): Promise<FareBreakdown | null> {
  try {
    // If selectedHours is provided and > 0, use it. Otherwise determine minimum hours based on distance
    let hours = selectedHours && selectedHours > 0 ? selectedHours : 8;
    if (!selectedHours || selectedHours <= 0) {
      if (distanceKm >= 151 && distanceKm <= 300) {
        hours = 10;
      } else if (distanceKm > 300) {
        hours = 12;
      }
    }
    
    const response = await axios.get(`${API_URL}/api/pricing-packages/estimate`, {
      params: { packageType: 'OUTSTATION', hours, distance: distanceKm, isImmediate, ...(city && { city }) }
    });
    
    if (response.data.success && response.data.pricing) {
      const pricing = response.data.pricing;
      const finalEstimate = response.data.estimate ?? pricing.minimumCharge;
      const extraHours = response.data.extraHours || 0;
      const extraHourCharge = response.data.extraHourCharge || 0;
      const baseFare = response.data.baseFare || pricing.minimumCharge;
      const description = response.data.description || `${pricing.hours} Hours Package (${distanceKm} KM)`;

      return {
        baseFare,
        extraHours,
        extraHourCharge,
        totalFare: finalEstimate,
        packageType: 'OUTSTATION',
        description,
        scheduledCharge: response.data.scheduledEstimate || (pricing.minimumCharge + extraHourCharge),
        immediateCharge: response.data.immediateEstimate || ((pricing.immediateCharge || pricing.minimumCharge) + extraHourCharge),
        extraPerHourSch: pricing.extraPerHour,
        extraPerHourImm: pricing.extraPerHourImm || pricing.extraPerHour,
        hours: pricing.hours,
        minimumKm: pricing.minimumKm
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
  isImmediate: boolean = false,
  selectedHours?: number,
  city?: string
): Promise<FareBreakdown | null> {
  try {
    // Base hours must exist in LOCAL_HOURLY pricing — the backend overrides it
    // with the package required by the distance (Min KM bands) or requested hours
    const hours = selectedHours && selectedHours > 0 ? selectedHours : 4;
    const response = await axios.get(`${API_URL}/api/pricing-packages/estimate`, {
      params: { packageType: 'LOCAL_HOURLY', hours, distance: distanceKm, isImmediate, ...(city && { city }) }
    });
    
    if (response.data.success && response.data.pricing) {
      const pricing = response.data.pricing;
      const finalEstimate = response.data.estimate ?? pricing.minimumCharge;
      const extraHours = response.data.extraHours || 0;
      const extraHourCharge = response.data.extraHourCharge || 0;
      const baseFare = response.data.baseFare || pricing.minimumCharge;
      const description = response.data.description || `${pricing.hours} Hour Package`;

      return {
        baseFare,
        extraHours,
        extraHourCharge,
        totalFare: finalEstimate,
        packageType: 'LOCAL',
        description,
        scheduledCharge: response.data.scheduledEstimate || (pricing.minimumCharge + extraHourCharge),
        immediateCharge: response.data.immediateEstimate || ((pricing.immediateCharge || pricing.minimumCharge) + extraHourCharge),
        extraPerHourSch: pricing.extraPerHour,
        extraPerHourImm: pricing.extraPerHourImm || pricing.extraPerHour,
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
