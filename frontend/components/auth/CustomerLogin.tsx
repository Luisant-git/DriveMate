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
        <div className="flex flex-wrap items-center gap-2 mb-6 sm:mb-8 text-sm text-gray-500">
          <p>Enter your mobile number to continue.</p>
        </div>
        
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
          className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center mb-4"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : 'Send Code'}
        </button>

        <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
          OTP will be sent via
          <span className="inline-flex items-center gap-1 font-bold text-green-600">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 3.825 0 6.938 3.112 6.938 6.937 0 3.825-3.113 6.938-6.938 6.938z"/>
            </svg>
            WhatsApp
          </span>
        </p>
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