const API_BASE_URL = import.meta.env.VITE_APP_API_URL;

// Debug: Log the API URL being used
console.log('API_BASE_URL:', API_BASE_URL);

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Register function
export const register = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
      credentials: 'include',
    });
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('auth-token', data.token);
    }
    return { success: response.ok, ...data };
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
};

// Login function
export const login = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(credentials),
      credentials: 'include',
    });
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('auth-token', data.token);
    }
    return { success: response.ok, ...data };
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
};

// Send OTP function
export const sendOTP = async (phoneNumber) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ phone: phoneNumber }),
      credentials: 'include',
    });
    const data = await response.json();
    return { success: response.ok, ...data };
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
};

// Verify OTP function
export const verifyOTP = async (phoneNumber, otp) => {
  try {
    console.log('[Auth API] Verifying OTP for:', phoneNumber);
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ phone: phoneNumber, otp }),
      credentials: 'include',
    });
    const data = await response.json();
    console.log('[Auth API] OTP verification response:', data);
    
    if (data.token) {
      console.log('[Auth API] Storing token in localStorage:', data.token.substring(0, 20) + '...');
      localStorage.setItem('auth-token', data.token);
    } else {
      console.log('[Auth API] No token received in response');
    }
    return { success: response.ok, ...data };
  } catch (error) {
    console.error('[Auth API] Error verifying OTP:', error);
    return { success: false, message: 'Network error' };
  }
};

// Logout function
export const logout = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    localStorage.removeItem('auth-token');
    const data = await response.json();
    return { success: response.ok, ...data };
  } catch (error) {
    localStorage.removeItem('auth-token');
    return { success: false, message: 'Network error' };
  }
};

// Get profile function
export const getProfile = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    const data = await response.json();
    return { success: response.ok, ...data };
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
};

// Check authentication status
export const checkAuth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return { success: response.ok, authenticated: response.ok };
  } catch (error) {
    return { success: false, authenticated: false };
  }
};