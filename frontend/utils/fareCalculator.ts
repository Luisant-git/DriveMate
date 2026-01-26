import axios from 'axios';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';

export interface FareBreakdown {
  baseFare: number;
  extraHours: number;
  extraHourCharge: number;
  totalFare: number;
  packageType: 'LOCAL' | 'OUTSTATION';
  description: string;
}

export async function calculateFare(
  hours: number,
  distance: number = 0,
  isOutstation: boolean = false
): Promise<FareBreakdown | null> {
  try {
    const packageType = isOutstation ? 'OUTSTATION' : 'LOCAL_HOURLY';
    const roundedHours = Math.ceil(hours);
    
    const response = await axios.get(`${API_URL}/api/pricing-packages/estimate`, {
      params: { packageType, hours: roundedHours }
    });
    
    if (response.data.success && response.data.pricing) {
      const pricing = response.data.pricing;
      return {
        baseFare: pricing.minimumCharge,
        extraHours: 0,
        extraHourCharge: 0,
        totalFare: pricing.minimumCharge,
        packageType: isOutstation ? 'OUTSTATION' : 'LOCAL',
        description: pricing.description || `${pricing.hours} Hour Package`
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching fare:', error);
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
