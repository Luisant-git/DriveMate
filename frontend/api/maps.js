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
      // Fallback directly to Google geocode API
      const direct = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyAfUP27GUuOL0cBm_ROdjE2n6EyVKesIu8`);
      const data = await direct.json();
      if (data.status === 'OK' && data.results?.[0]) {
        const res = data.results[0];
        let city = '';
        let state = '';
        let area = '';
        for (const comp of (res.address_components || [])) {
          if (comp.types.includes('locality')) city = comp.long_name;
          if (!city && comp.types.includes('administrative_area_level_2')) city = comp.long_name;
          if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
          if (comp.types.includes('sublocality_level_1') || comp.types.includes('sublocality') || comp.types.includes('neighborhood')) {
            area = comp.long_name;
          }
        }
        return {
          success: true,
          lat: res.geometry.location.lat,
          lng: res.geometry.location.lng,
          formatted_address: res.formatted_address,
          area: area || city || res.formatted_address.split(',')[0],
          city: city || state,
          state
        };
      }
      return { success: false, error: 'Failed to geocode address' };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return { success: false, error: 'Failed to geocode address' };
  }
};

export const reverseGeocodeCoords = async (lat, lng) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/maps/reverse-geocode?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      // Fallback directly to Google geocode API
      const direct = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyAfUP27GUuOL0cBm_ROdjE2n6EyVKesIu8`);
      const data = await direct.json();
      if (data.status === 'OK' && data.results?.[0]) {
        const res = data.results[0];
        let city = '';
        let state = '';
        let area = '';
        for (const comp of (res.address_components || [])) {
          if (comp.types.includes('locality')) city = comp.long_name;
          if (!city && comp.types.includes('administrative_area_level_2')) city = comp.long_name;
          if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
          if (comp.types.includes('sublocality_level_1') || comp.types.includes('sublocality') || comp.types.includes('neighborhood')) {
            area = comp.long_name;
          }
        }
        return {
          success: true,
          lat,
          lng,
          formatted_address: res.formatted_address,
          area: area || city || res.formatted_address.split(',')[0],
          city: city || state,
          state
        };
      }
      return { success: false, error: 'Failed to reverse geocode' };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return { success: false, error: 'Failed to reverse geocode' };
  }
};
