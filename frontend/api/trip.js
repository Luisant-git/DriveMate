const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem('auth-token');
    window.location.href = '/login';
    return { success: false, error: 'Authentication required' };
  }
  if (response.status === 403) {
    return { success: false, error: 'Access denied - insufficient permissions' };
  }
  return response.json();
};

export const tripAPI = {
  // Get available trips for driver
  getAvailableTrips: async () => {
    const response = await fetch(`${API_URL}/api/trips/available`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  // Get driver's trips
  getDriverTrips: async () => {
    const response = await fetch(`${API_URL}/api/trips/driver`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  // Accept trip
  acceptTrip: async (tripId) => {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/accept`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  // Complete trip
  completeTrip: async (tripId) => {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  // Create trip (customer)
  createTrip: async (tripData) => {
    const response = await fetch(`${API_URL}/api/trips`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(tripData),
    });
    return handleResponse(response);
  },
};
