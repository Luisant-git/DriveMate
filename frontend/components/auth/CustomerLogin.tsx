import React, { useState } from 'react';
import { sendOTP, verifyOTP } from '../../api/auth';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

interface CustomerLoginProps {
  onLogin: (user: any) => void;
}

const CustomerLogin: React.FC<CustomerLoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Sending OTP to your mobile number');
    if (phoneNumber.length < 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await sendOTP(phoneNumber);
      if (response.success) {
        setStep('OTP');
        toast.success(`OTP sent to ${phoneNumber} via WhatsApp`);
      } else {
        alert(response.error || response.message || 'Failed to send OTP');
      }
    } catch (error) {
      alert('Error sending OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      alert("Please enter a valid 6-digit OTP");
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('[CustomerLogin] Verifying OTP...');
      const response = await verifyOTP(phoneNumber, otp);
      console.log('[CustomerLogin] OTP verification response:', response);
      
      if (response.success) {
        console.log('[CustomerLogin] OTP verified successfully, user:', response.user);
        
        // Check if token is stored
        const storedToken = localStorage.getItem('auth-token');
        console.log('[CustomerLogin] Token stored in localStorage:', storedToken ? 'Yes' : 'No');
        
        toast.success('Successfully logged in!');
        setTimeout(() => {
          onLogin(response.user);
        }, 1000);
      } else {
        console.log('[CustomerLogin] OTP verification failed:', response.error || response.message);
        toast.error(response.error || response.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('[CustomerLogin] Error during OTP verification:', error);
      toast.error('Error verifying OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'PHONE') {
    return (
      <form onSubmit={handleSendOtp} className="animate-fade-in flex-grow flex flex-col">
        <button type="button" onClick={() => navigate('/')} className="mb-4 text-gray-400 hover:text-black flex items-center gap-1 text-sm font-bold">
          ← Back
        </button>
        <h2 className="text-xl sm:text-2xl font-bold mb-2 text-black">What's your number?</h2>
        <p className="text-gray-500 text-sm mb-6 sm:mb-8">We'll send you a code to verify your account.</p>
        
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
              value={phoneNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if(val.length <= 10) setPhoneNumber(val);
              }}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={phoneNumber.length < 10 || isLoading}
          className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : 'Send Code'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyOtp} className="animate-fade-in flex-grow flex flex-col">
      <button type="button" onClick={() => setStep('PHONE')} className="mb-4 text-gray-400 hover:text-black flex items-center gap-1 text-sm font-bold">
        ← Edit Number
      </button>
      <h2 className="text-xl sm:text-2xl font-bold mb-2 text-black">Verify account</h2>
      <p className="text-gray-500 text-sm mb-6 sm:mb-8">Enter the 6-digit code sent to <span className="font-bold text-black">+91 {phoneNumber}</span> via WhatsApp</p>
      
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
        className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : 'Verify & Login'}
      </button>
    </form>
  );
};

export default CustomerLogin;