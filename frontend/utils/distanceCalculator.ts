// Calculate distance between two locations using Google Maps API
export async function calculateDistance(
  pickup: string,
  drop: string
): Promise<{ distance: number; duration: number } | null> {
  try {
    // Use backend proxy to avoid CORS issues
    const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
    
    const response = await fetch(
      `${API_URL}/api/distance/calculate?pickup=${encodeURIComponent(
        pickup
      )}&drop=${encodeURIComponent(drop)}`
    );
    
    const data = await response.json();
    
    if (data.success && data.distance) {
      return {
        distance: data.distance,
        duration: data.duration
      };
    }
    
    return null;
  } catch (error) {
    console.error('Distance calculation error:', error);
    return null;
  }
}

// Determine package based on distance for Outstation
export function getPackageByDistance(distanceKm: number): {
  hours: number;
  description: string;
} {
  if (distanceKm >= 60 && distanceKm <= 150) {
    return { hours: 8, description: '8 Hours Package (60-150 KM)' };
  } else if (distanceKm >= 151 && distanceKm <= 300) {
    return { hours: 10, description: '10 Hours Package (151-300 KM)' };
  } else if (distanceKm > 300) {
    return { hours: 12, description: '12 Hours Package (300+ KM)' };
  }
  
  // Default to 8 hours for distances below 60km
  return { hours: 8, description: '8 Hours Package (Minimum)' };
}

// Filter duration options based on distance for outstation bookings
export function getFilteredDurationOptions(distanceKm: number | null): string[] {
  const allOptions = ['8 Hrs', '9 Hrs', '10 Hrs', '11 Hrs', '12 Hrs', '13 Hrs', '14 Hrs', '15 Hrs', '16 Hrs', '17 Hrs', '18 Hrs', '19 Hrs', '20 Hrs', '21 Hrs', '22 Hrs', '23 Hrs', '24 Hrs', '1 Day', '2 Days', '3 Days', '4 Days', '5 Days', '6 Days', '7 Days', '8 Days', '9 Days', '10 Days', '11 Days', '12 Days', '13 Days', '14 Days', '15 Days', '16 Days', '17 Days', '18 Days', '19 Days', '20 Days', '21 Days', '22 Days', '23 Days', '24 Days', '25 Days', '26 Days', '27 Days', '28 Days', '29 Days', '30 Days'];
  
  // If no distance calculated yet, return all options
  if (!distanceKm) {
    return allOptions;
  }
  
  // For 150km or below: show 8hrs, 10hrs
  if (distanceKm <= 150) {
    return ['8 Hrs', '10 Hrs'];
  }
  
  // For above 150km: show minimum 12hrs and above (hide below 12hr)
  return allOptions.filter(option => {
    if (option.includes('Hrs')) {
      const hours = parseInt(option.split(' ')[0]);
      return hours >= 12;
    }
    // Include all day options
    return true;
  });
}
