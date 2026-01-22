import React, { useState } from 'react';
import { API_BASE_URL } from '../../api/config.js';
import { login, register } from '../../api/auth';

interface DriverLoginProps {
  onLogin: (user: any) => void;
  onBack: () => void;
}

const DriverLogin: React.FC<DriverLoginProps> = ({ onLogin, onBack }) => {
  const [step, setStep] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [loginData, setLoginData] = useState({ phone: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    aadharNo: '',
    licenseNo: '',
    altPhone: ['', '', '', ''],
    upiId: '',
    photo: null,
    dlPhoto: null,
    panPhoto: null,
    aadharPhoto: null
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await login({
        phone: loginData.phone,
        password: loginData.password
      });
      
      if (response.success) {
        onLogin(response.user);
      } else {
        alert(response.error || response.message || 'Invalid credentials');
      }
    } catch (error) {
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Upload files first and get URLs
      const uploadFile = async (file: File | null, fieldName: string) => {
        if (!file) return '';
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE_URL}/api/upload/file`, {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        if (result.success) {
          return result.fileId; // This is now the full URL
        } else {
          throw new Error(`Failed to upload ${fieldName}`);
        }
      };
      
      // Upload all files
      const [photoUrl, dlPhotoUrl, panPhotoUrl, aadharPhotoUrl] = await Promise.all([
        uploadFile(registerData.photo, 'photo'),
        uploadFile(registerData.dlPhoto, 'driving license'),
        uploadFile(registerData.panPhoto, 'PAN card'),
        uploadFile(registerData.aadharPhoto, 'Aadhar card')
      ]);
      
      const response = await register({
        ...registerData,
        role: 'DRIVER',
        photo: photoUrl,
        dlPhoto: dlPhotoUrl,
        panPhoto: panPhotoUrl,
        aadharPhoto: aadharPhotoUrl
      });
      
      if (response.success) {
        alert('Registration successful! Please login with your credentials.');
        setStep('LOGIN');
      } else {
        alert(response.error || response.message || 'Registration failed');
      }
    } catch (error) {
      alert('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'REGISTER') {
    return (
      <form onSubmit={handleRegister} className="animate-fade-in flex-grow flex flex-col overflow-y-auto">
        <button type="button" onClick={() => setStep('LOGIN')} className="mb-4 text-gray-400 hover:text-black flex items-center gap-1 text-sm font-bold">
          ← Back to Login
        </button>
        <h2 className="text-xl font-bold mb-4 text-black">Driver Registration</h2>
        
        <div className="space-y-3 flex-grow overflow-y-auto pr-2">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Full Name</label>
            <input 
              type="text"
              className="w-full bg-gray-100 border-none rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-black"
              value={registerData.name}
              onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Email</label>
            <input 
              type="email"
              className="w-full bg-gray-100 border-none rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-black"
              value={registerData.email}
              onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Phone Number</label>
            <input 
              type="tel"
              className="w-full bg-gray-100 border-none rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-black"
              value={registerData.phone}
              onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Password</label>
            <input 
              type="password"
              className="w-full bg-gray-100 border-none rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-black"
              value={registerData.password}
              onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Aadhar Number</label>
            <input 
              type="text"
              className="w-full bg-gray-100 border-none rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-black"
              value={registerData.aadharNo}
              onChange={(e) => setRegisterData({...registerData, aadharNo: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">License Number</label>
            <input 
              type="text"
              className="w-full bg-gray-100 border-none rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-black"
              value={registerData.licenseNo}
              onChange={(e) => setRegisterData({...registerData, licenseNo: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Alternate Phone Numbers - Up to 4</label>
            <div className="space-y-2">
              {registerData.altPhone.map((phone, index) => (
                <input 
                  key={index}
                  type="tel"
                  className="w-full bg-gray-100 border-none rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-black"
                  placeholder={`Alternate Phone ${index + 1}`}
                  value={phone}
                  onChange={(e) => {
                    const newAltPhones = [...registerData.altPhone];
                    newAltPhones[index] = e.target.value;
                    setRegisterData({...registerData, altPhone: newAltPhones});
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">UPI ID</label>
            <input 
              type="text"
              className="w-full bg-gray-100 border-none rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-black"
              placeholder="yourname@upi"
              value={registerData.upiId}
              onChange={(e) => setRegisterData({...registerData, upiId: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Document Uploads</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input 
                  type="file"
                  accept="image/*"
                  id="photo"
                  className="hidden"
                  onChange={(e) => setRegisterData({...registerData, photo: e.target.files?.[0] || null})}
                />
                <label 
                  htmlFor="photo"
                  className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    <svg className="w-4 h-4 mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-xs text-gray-500 font-medium">Photo</p>
                    {registerData.photo && <p className="text-xs text-green-600 font-bold">✓ Selected</p>}
                  </div>
                </label>
              </div>
              
              <div className="relative">
                <input 
                  type="file"
                  accept="image/*"
                  id="dlPhoto"
                  className="hidden"
                  onChange={(e) => setRegisterData({...registerData, dlPhoto: e.target.files?.[0] || null})}
                />
                <label 
                  htmlFor="dlPhoto"
                  className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    <svg className="w-4 h-4 mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-xs text-gray-500 font-medium">Driving License</p>
                    {registerData.dlPhoto && <p className="text-xs text-green-600 font-bold">✓ Selected</p>}
                  </div>
                </label>
              </div>
              
              <div className="relative">
                <input 
                  type="file"
                  accept="image/*"
                  id="panPhoto"
                  className="hidden"
                  onChange={(e) => setRegisterData({...registerData, panPhoto: e.target.files?.[0] || null})}
                />
                <label 
                  htmlFor="panPhoto"
                  className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    <svg className="w-4 h-4 mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    <p className="text-xs text-gray-500 font-medium">PAN Card</p>
                    {registerData.panPhoto && <p className="text-xs text-green-600 font-bold">✓ Selected</p>}
                  </div>
                </label>
              </div>
              
              <div className="relative">
                <input 
                  type="file"
                  accept="image/*"
                  id="aadharPhoto"
                  className="hidden"
                  onChange={(e) => setRegisterData({...registerData, aadharPhoto: e.target.files?.[0] || null})}
                />
                <label 
                  htmlFor="aadharPhoto"
                  className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    <svg className="w-4 h-4 mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-xs text-gray-500 font-medium">Aadhar Card</p>
                    {registerData.aadharPhoto && <p className="text-xs text-green-600 font-bold">✓ Selected</p>}
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full mt-4 bg-black text-white py-3 rounded-xl font-bold text-base hover:bg-gray-800 transition disabled:opacity-50 flex justify-center"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : 'Register'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleLogin} className="animate-fade-in flex-grow flex flex-col">
      <button type="button" onClick={onBack} className="mb-4 text-gray-400 hover:text-black flex items-center gap-1 text-sm font-bold">
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
        Join as driver partner? <span onClick={() => setStep('REGISTER')} className="font-bold text-black cursor-pointer hover:underline">Register here</span>
      </p>
    </form>
  );
};

export default DriverLogin;