// Token validation utility
export const isTokenValid = (token) => {
  if (!token) {
    console.log('[Auth Utils] No token provided');
    return false;
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    console.log('[Auth Utils] Token payload:', { userId: payload.userId, role: payload.role, exp: payload.exp });
    
    // If token has expiration, check it (with 5 minute buffer)
    if (payload.exp) {
      const isExpired = payload.exp <= (currentTime + 300);
      console.log('[Auth Utils] Token expiration check:', { exp: payload.exp, current: currentTime, isExpired });
      return !isExpired;
    }
    
    // If no expiration field, consider token valid (for backward compatibility)
    console.log('[Auth Utils] Token has no expiration, considering valid');
    return true;
  } catch (error) {
    console.error('[Auth Utils] Error validating token:', error);
    return false;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem('auth-token');
  // Clear any other auth-related data
};

export const checkAuthStatus = () => {
  const token = localStorage.getItem('auth-token');
  console.log('[Auth Utils] Checking auth status, token exists:', !!token);
  
  if (!token || !isTokenValid(token)) {
    console.log('[Auth Utils] Token invalid, clearing auth data');
    clearAuthData();
    return false;
  }
  
  console.log('[Auth Utils] Token valid, user authenticated');
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