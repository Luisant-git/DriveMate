// Token validation utility
export const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    // Check if token is expired (with 5 minute buffer)
    return payload.exp > (currentTime + 300);
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem('auth-token');
  // Clear any other auth-related data
};

export const checkAuthStatus = () => {
  const token = localStorage.getItem('auth-token');
  
  if (!token || !isTokenValid(token)) {
    clearAuthData();
    return false;
  }
  
  return true;
};

// Enhanced auth headers with validation
export const getValidAuthHeaders = () => {
  const token = localStorage.getItem('auth-token');
  
  if (!token || !isTokenValid(token)) {
    clearAuthData();
    throw new Error('Authentication required');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};