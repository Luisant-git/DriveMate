import axios from 'axios';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';

export async function checkServiceAvailability(latitude: number, longitude: number) {
  try {
    const response = await axios.get(`${API_URL}/api/service-areas/check`, {
      params: { latitude, longitude }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking service availability:', error);
    return { success: false, available: false };
  }
}

export function extractCoordinates(locationString: string): { lat: number; lng: number } | null {
  try {
    // Location format: "Address, City, State, Country"
    // We'll use Google Geocoding API to get coordinates
    return null; // Will be handled by LocationAutocomplete component
  } catch (error) {
    return null;
  }
}
