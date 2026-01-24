// Fare calculator based on pricing chart

export interface FareBreakdown {
  baseFare: number;
  extraHours: number;
  extraHourCharge: number;
  totalFare: number;
  packageType: 'LOCAL' | 'OUTSTATION';
  description: string;
}

// Local hourly pricing
const LOCAL_PRICING = {
  4: 500,
  5: 600,
  6: 700,
  7: 800,
  8: 900,
  9: 1000,
  10: 1100,
  11: 1200,
  12: 1300,
};

// Outstation pricing
const OUTSTATION_PRICING = [
  { hours: 8, minKm: 40, charge: 850 },
  { hours: 10, minKm: 150, charge: 900 },
  { hours: 12, minKm: 300, charge: 1200 },
  { hours: 16, minKm: 0, charge: 1500 }, // Full day 6AM-10PM
];

const EXTRA_PER_HOUR = 100;

export function calculateFare(
  hours: number,
  distance: number = 0,
  isOutstation: boolean = false
): FareBreakdown {
  if (isOutstation) {
    return calculateOutstationFare(hours, distance);
  } else {
    return calculateLocalFare(hours);
  }
}

function calculateLocalFare(hours: number): FareBreakdown {
  const roundedHours = Math.ceil(hours);
  
  if (roundedHours <= 12) {
    const baseFare = LOCAL_PRICING[roundedHours as keyof typeof LOCAL_PRICING] || 0;
    return {
      baseFare,
      extraHours: 0,
      extraHourCharge: 0,
      totalFare: baseFare,
      packageType: 'LOCAL',
      description: `${roundedHours} Hour Package`
    };
  } else {
    const baseFare = LOCAL_PRICING[12];
    const extraHours = roundedHours - 12;
    const extraHourCharge = extraHours * EXTRA_PER_HOUR;
    return {
      baseFare,
      extraHours,
      extraHourCharge,
      totalFare: baseFare + extraHourCharge,
      packageType: 'LOCAL',
      description: `12 Hour Package + ${extraHours} Extra Hours`
    };
  }
}

function calculateOutstationFare(hours: number, distance: number): FareBreakdown {
  const roundedHours = Math.ceil(hours);
  
  // Find matching package
  let selectedPackage = OUTSTATION_PRICING[0];
  for (const pkg of OUTSTATION_PRICING) {
    if (roundedHours >= pkg.hours && distance >= pkg.minKm) {
      selectedPackage = pkg;
    }
  }
  
  const baseFare = selectedPackage.charge;
  
  if (roundedHours > selectedPackage.hours) {
    const extraHours = roundedHours - selectedPackage.hours;
    const extraHourCharge = extraHours * EXTRA_PER_HOUR;
    return {
      baseFare,
      extraHours,
      extraHourCharge,
      totalFare: baseFare + extraHourCharge,
      packageType: 'OUTSTATION',
      description: `${selectedPackage.hours} Hour Package (${selectedPackage.minKm}+ KM) + ${extraHours} Extra Hours`
    };
  }
  
  return {
    baseFare,
    extraHours,
    extraHourCharge,
    extraHourCharge: 0,
    totalFare: baseFare,
    packageType: 'OUTSTATION',
    description: `${selectedPackage.hours} Hour Package (${selectedPackage.minKm}+ KM)`
  };
}

// Parse duration string like "4 Hrs", "1 Day" to hours
export function parseDurationToHours(duration: string): number {
  const lower = duration.toLowerCase();
  
  if (lower.includes('day')) {
    const days = parseInt(lower);
    return days * 24;
  } else if (lower.includes('hr')) {
    return parseInt(lower);
  }
  
  return 4; // default
}
