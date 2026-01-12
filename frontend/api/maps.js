const API_BASE_URL = import.meta.env.VITE_APP_API_URL;

export const getPlaceAutocomplete = async (input) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/maps/autocomplete?input=${encodeURIComponent(input)}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to fetch suggestions' };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching autocomplete:', error);
    return { success: false, error: 'Failed to fetch suggestions' };
  }
};

export const geocodeAddress = async (address) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/maps/geocode?address=${encodeURIComponent(address)}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to geocode address' };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return { success: false, error: 'Failed to geocode address' };
  }
};