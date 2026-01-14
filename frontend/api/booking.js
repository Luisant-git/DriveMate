const API_BASE_URL = import.meta.env.VITE_APP_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Get fare estimate
export const getFareEstimate = async (pickupLocation, dropLocation, vehicleType) => {
  try {
    const params = new URLSearchParams({
      pickupLocation,
      dropLocation,
      vehicleType
    });
    
    const response = await fetch(`${API_BASE_URL}/api/bookings/estimate?${params}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to get estimate' };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching estimate:', error);
    return { success: false, error: 'Failed to get estimate' };
  }
};

// Create booking/ride request
export const createBooking = async (bookingData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(bookingData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to create booking' };
    }
    
    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    console.error('Error creating booking:', error);
    return { success: false, error: 'Network error' };
  }
};

// Get customer bookings
export const getCustomerBookings = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bookings/my-bookings`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to fetch bookings' };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return { success: false, error: 'Failed to fetch bookings' };
  }
};