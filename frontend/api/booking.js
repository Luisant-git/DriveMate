const API_BASE_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';

// Get fare estimate
export const getFareEstimate = async (pickupLocation, dropLocation, vehicleType) => {
  try {
    const params = new URLSearchParams({
      pickupLocation,
      dropLocation,
      vehicleType
    });
    
    const response = await fetch(`${API_BASE_URL}/api/bookings/estimate?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
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
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(bookingData),
    });
    const data = await response.json();
    return { success: response.ok, ...data };
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
};

// Get customer bookings
export const getCustomerBookings = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bookings/my-bookings`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return { success: false, error: 'Failed to fetch bookings' };
  }
};