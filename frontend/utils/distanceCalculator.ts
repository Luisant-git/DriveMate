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
