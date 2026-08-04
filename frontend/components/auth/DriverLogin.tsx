import React, { useState } from 'react';
import { API_BASE_URL } from '../../api/config.js';
import { useNavigate } from 'react-router-dom';
import { sendOTP, verifyOTPOnly, resetDriverPassword } from '../../api/auth';
import { toast } from 'react-toastify';

interface DriverLoginProps {
  onLogin: (user: any) => void;
}

const DriverLogin: React.FC<DriverLoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'LOGIN' | 'FORGOT_PHONE' | 'FORGOT_OTP' | 'FORGOT_RESET'>('LOGIN');
  const [loginData, setLoginData] = useState({ phone: '', password: '' });
  const [forgotPhone, setForgotPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

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
        setErrorModal({ isOpen: true, message: data.error || data.message || 'Invalid credentials' });
      }
    } catch (error) {
      setErrorModal({ isOpen: true, message: 'Login failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await sendOTP(forgotPhone);
      if (response.success) {
        setStep('FORGOT_OTP');
        toast.success(`OTP sent to ${forgotPhone} via WhatsApp`);
      } else {
        toast.error(response.error || response.message || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Error sending OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await verifyOTPOnly(forgotPhone, otp);
      if (response.success) {
        setStep('FORGOT_RESET');
        toast.success('OTP verified successfully!');
      } else {
        toast.error(response.error || response.message || 'Invalid OTP');
      }
    } catch (error) {
      toast.error('Error verifying OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await resetDriverPassword(forgotPhone, newPassword);
      if (response.success) {
        toast.success('Password reset successfully!');
        setStep('LOGIN');
        setLoginData({ phone: forgotPhone, password: newPassword });
      } else {
        toast.error(response.error || response.message || 'Failed to reset password');
      }
    } catch (error) {
      toast.error('Error resetting password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'FORGOT_PHONE') {
    return (
      <form onSubmit={handleSendOtp} className="animate-fade-in flex-grow flex flex-col">
        <button type="button" onClick={() => setStep('LOGIN')} className="mb-4 text-gray-400 hover:text-black flex items-center gap-1 text-sm font-bold">
          ← Back to Login
        </button>
        <h2 className="text-xl sm:text-2xl font-bold mb-2 text-black">Forgot Password?</h2>
        <p className="text-gray-500 text-sm mb-6 sm:mb-8">Enter your registered mobile number to receive an OTP.</p>
        
        <div className="mb-8">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Mobile Number</label>
          <div className="flex gap-3">
            <div className="bg-gray-100 rounded-lg px-3 py-3 flex items-center justify-center font-bold text-gray-500 text-sm">
              +91
            </div>
            <input 
              type="tel" 
              autoFocus
              className="flex-1 bg-gray-100 border-none rounded-lg p-3 font-bold text-lg focus:ring-2 focus:ring-black outline-none"
              placeholder="98765 43210"
              value={forgotPhone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if(val.length <= 10) setForgotPhone(val);
              }}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={forgotPhone.length < 10 || isLoading}
          className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center mt-auto"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : 'Send OTP'}
        </button>
      </form>
    );
  }

  if (step === 'FORGOT_OTP') {
    return (
      <form onSubmit={handleVerifyOtp} className="animate-fade-in flex-grow flex flex-col">
        <button type="button" onClick={() => setStep('FORGOT_PHONE')} className="mb-4 text-gray-400 hover:text-black flex items-center gap-1 text-sm font-bold">
          ← Edit Number
        </button>
        <h2 className="text-xl sm:text-2xl font-bold mb-2 text-black">Verify OTP</h2>
        <p className="text-gray-500 text-sm mb-6 sm:mb-8">Enter the 6-digit code sent to <span className="font-bold text-black">+91 {forgotPhone}</span> via WhatsApp</p>
        
        <div className="mb-8">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">One Time Password</label>
          <input 
            type="text" 
            autoFocus
            maxLength={6}
            className="w-full bg-gray-100 border-none rounded-lg p-4 font-bold text-2xl tracking-[0.5em] text-center focus:ring-2 focus:ring-black outline-none"
            placeholder="••••••"
            value={otp}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setOtp(val);
            }}
          />
          <div className="mt-4 text-center">
            <button type="button" onClick={handleSendOtp} className="text-xs font-bold text-gray-400 hover:text-black">
              Resend Code
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={otp.length < 6 || isLoading}
          className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center mt-auto"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : 'Verify OTP'}
        </button>
      </form>
    );
  }

  if (step === 'FORGOT_RESET') {
    return (
      <form onSubmit={handleResetPassword} className="animate-fade-in flex-grow flex flex-col">
        <h2 className="text-xl sm:text-2xl font-bold mb-2 text-black">Reset Password</h2>
        <p className="text-gray-500 text-sm mb-6 sm:mb-8">Create a new password for your account.</p>
        
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">New Password</label>
            <div className="relative">
              <input 
                type={showNewPassword ? "text" : "password"} 
                autoFocus
                className="w-full bg-gray-100 border-none rounded-lg p-3 pr-10 font-medium text-lg focus:ring-2 focus:ring-black outline-none"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-black"
              >
                {showNewPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.978 9.978 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Confirm Password</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                className="w-full bg-gray-100 border-none rounded-lg p-3 pr-10 font-medium text-lg focus:ring-2 focus:ring-black outline-none"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-black"
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.978 9.978 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={newPassword.length < 6 || confirmPassword.length < 6 || isLoading}
          className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center mt-auto"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : 'Reset Password'}
        </button>
      </form>
    );
  }

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
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-bold text-gray-500 uppercase">Password</label>
            <button type="button" onClick={() => setStep('FORGOT_PHONE')} className="text-xs font-bold text-black hover:underline">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              className="w-full bg-gray-100 border-none rounded-lg p-3 pr-10 font-medium text-lg focus:ring-2 focus:ring-black outline-none"
              placeholder="••••••••"
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-black"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.978 9.978 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              )}
            </button>
          </div>
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

      {/* Error Modal */}
      {errorModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all scale-100">
            <div className="bg-red-500 p-6 flex justify-center">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="p-6 text-center">
              <h3 className="text-xl font-black text-gray-900 mb-2">Access Denied</h3>
              <p className="text-sm text-gray-600 font-medium leading-relaxed mb-6">
                {errorModal.message}
              </p>
              <button 
                type="button"
                onClick={() => setErrorModal({ isOpen: false, message: '' })}
                className="w-full bg-black text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition shadow-lg active:scale-95"
              >
                Okay, Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default DriverLogin;