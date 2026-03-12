import React, { useEffect, useState } from 'react';
import { checkAuthStatus } from '../utils/auth.js';

const AuthGuard = ({ children, onAuthRequired }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = checkAuthStatus();
      setIsAuthenticated(authStatus);
      
      if (!authStatus && onAuthRequired) {
        onAuthRequired();
      }
    };

    checkAuth();
    
    // Check auth status periodically
    const interval = setInterval(checkAuth, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [onAuthRequired]);

  if (isAuthenticated === null) {
    return <div>Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-required">
        <h3>Authentication Required</h3>
        <p>Your session has expired. Please login again to continue.</p>
        <button onClick={() => window.location.href = '/customer/login'}>
          Login
        </button>
      </div>
    );
  }

  return children;
};

export default AuthGuard;