const API_BASE_URL = 'http://localhost:5000/api';

export const getPlaceAutocomplete = async (input) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/maps/autocomplete?input=${encodeURIComponent(input)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch autocomplete suggestions');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching autocomplete:', error);
    throw error;
  }
};

export const geocodeAddress = async (address) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/maps/geocode?address=${encodeURIComponent(address)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to geocode address');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
};