import React, { useState } from 'react';
import { API_BASE_URL } from '../../api/config.js';
import { useNavigate } from 'react-router-dom';

interface DriverLoginProps {
  onLogin: (user: any) => void;
}

const DriverLogin: React.FC<DriverLoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({ phone: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/driver/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginData.phone, password: loginData.password }),
        credentials: 'include',
      });
      const data = await response.json();
      if (data.token) localStorage.setItem('auth-token', data.token);
      
      if (response.ok) {
        onLogin({ ...data.driver, role: 'DRIVER' });
      } else {
        alert(data.error || data.message || 'Invalid credentials');
      }
    } catch (error) {
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="animate-fade-in flex-grow flex flex-col">
      <button type="button" onClick={() => navigate('/')} className="mb-4 text-gray-400 hover:text-black flex items-center gap-1 text-sm font-bold">
        ← Back
      </button>
      <h2 className="text-xl sm:text-2xl font-bold mb-2 text-black">Driver Login</h2>
      <p className="text-gray-500 text-sm mb-4 sm:mb-6">Enter your credentials to continue.</p>
      
      <div className="space-y-4 flex-grow">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Phone Number</label>
          <input 
            type="tel"
            className="w-full bg-gray-100 border-none rounded-lg p-3 font-medium text-lg focus:ring-2 focus:ring-black outline-none"
            placeholder="9876543210"
            value={loginData.phone}
            onChange={(e) => setLoginData({...loginData, phone: e.target.value})}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Password</label>
          <input 
            type="password" 
            className="w-full bg-gray-100 border-none rounded-lg p-3 font-medium text-lg focus:ring-2 focus:ring-black outline-none"
            placeholder="••••••••"
            value={loginData.password}
            onChange={(e) => setLoginData({...loginData, password: e.target.value})}
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={!loginData.phone || !loginData.password || isLoading}
        className="w-full mt-6 bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : 'Login'}
      </button>
      
      <p className="text-center text-sm text-gray-500 mt-4">
        Join as driver partner? <span onClick={() => navigate('/driver/register')} className="font-bold text-black cursor-pointer hover:underline">Register here</span>
      </p>
    </form>
  );
};

export default DriverLogin;