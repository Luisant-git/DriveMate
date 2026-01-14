const API_BASE_URL = import.meta.env.VITE_APP_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Update customer profile
export const updateCustomerProfile = async (profileData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
      credentials: 'include',
    });
    const data = await response.json();
    return { success: response.ok, ...data };
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
};