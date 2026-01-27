import React, { useState } from 'react';
import { login } from '../../api/auth';

const API_BASE_URL = import.meta.env.VITE_APP_API_URL;

const adminLogin = async (credentials: { email: string; password: string }) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
    credentials: 'include',
  });
  const data = await response.json();
  if (data.token) localStorage.setItem('auth-token', data.token);
  return { success: response.ok, ...data };
};

interface AdminLoginProps {
  onLogin: (user: any) => void;
  onBack: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBack }) => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await adminLogin({
        email: loginData.email,
        password: loginData.password
      });
      
      if (response.success && response.user.role === 'ADMIN') {
        onLogin(response.user);
      } else if (response.success) {
        alert('Access denied. Admin credentials required.');
      } else {
        alert(response.error || response.message || 'Invalid admin credentials');
      }
    } catch (error) {
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="animate-fade-in flex-grow flex flex-col">
      <button type="button" onClick={onBack} className="mb-4 text-gray-400 hover:text-black flex items-center gap-1 text-sm font-bold">
        ← Back
      </button>
      <h2 className="text-xl sm:text-2xl font-bold mb-2 text-black">Admin Portal</h2>
      <p className="text-gray-500 text-sm mb-4 sm:mb-6">Enter your credentials to continue.</p>
      
      <div className="space-y-4 flex-grow">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Email</label>
          <input 
            type="email"
            className="w-full bg-gray-100 border-none rounded-lg p-3 font-medium text-lg focus:ring-2 focus:ring-black outline-none"
            placeholder="admin@drivemate.com"
            value={loginData.email}
            onChange={(e) => setLoginData({...loginData, email: e.target.value})}
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
        disabled={!loginData.email || !loginData.password || isLoading}
        className="w-full mt-6 bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : 'Login'}
      </button>
    </form>
  );
};

export default AdminLogin;