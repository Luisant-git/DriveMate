import React, { useState } from 'react';
import { API_BASE_URL } from '../../api/config.js';
import { driverRegister } from '../../api/auth';
import { useNavigate } from 'react-router-dom';

const DriverRegister: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [primaryOtp, setPrimaryOtp] = useState('');
  const [altOtp, setAltOtp] = useState('');
  const [isPrimaryVerified, setIsPrimaryVerified] = useState(false);
  const [isAltVerified, setIsAltVerified] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<any>({});
  const [isSameAddress, setIsSameAddress] = useState(false);
  
  const [registerData, setRegisterData] = useState({
    name: '',
    phone: '',
    currentAddress: '',
    permanentAddress: '',
    password: '',
    aadharNo: '',
    licenseNo: '',
    licenseExpiryDate: '',
    alternateMobile1: '',
    alternateMobile2: '',
    alternateMobile3: '',
    alternateMobile4: '',
    gpayNo: '',
    photo: null,
    dlPhoto: null,
    panPhoto: null,
    aadharPhoto: null,
    policeVerificationPhoto: null, // <-- ADD THIS
    policeVerificationExpiryDate: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const isValidPhone = (phone: string) => /^\d{10}$/.test(phone);
  const isValidAadhar = (aadhar: string) => /^\d{12}$/.test(aadhar);
  const isValidDL = (dl: string) => dl.trim().length >= 10;
  const isValidDLExpiry = (date: string) => {
    if (!date) return false;
    const expiry = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expiry >= today;
  };
  const isValidOptionalPhone = (phone: string) => !phone || /^\d{10}$/.test(phone);

  const isStep1Valid = Boolean(
    registerData.name.trim() && 
    isValidPhone(registerData.phone) && 
    registerData.password.trim() && 
    registerData.currentAddress.trim() && 
    registerData.permanentAddress.trim()
  );

  const isStep2Valid = Boolean(
    isValidAadhar(registerData.aadharNo) && 
    isValidDL(registerData.licenseNo) &&
    isValidDLExpiry((registerData as any).licenseExpiryDate) &&
    isValidOptionalPhone(registerData.gpayNo) &&
    isValidOptionalPhone(registerData.alternateMobile1) &&
    isValidOptionalPhone(registerData.alternateMobile2) &&
    isValidOptionalPhone(registerData.alternateMobile3) &&
    isValidOptionalPhone(registerData.alternateMobile4)
  );

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleVerifyOTP = async () => {
    // Mock OTP verification - wait for exactly 6 digits
    if (primaryOtp.length !== 6) {
      alert("Please enter a 6-digit OTP for the Primary Phone.");
      return;
    }
    if (registerData.alternateMobile1 && altOtp.length !== 6) {
      alert("Please enter a 6-digit OTP for the Alternate Phone.");
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare altPhone array
      const altPhone = [
        registerData.alternateMobile1,
        registerData.alternateMobile2,
        registerData.alternateMobile3,
        registerData.alternateMobile4
      ].filter(phone => phone && phone.trim() !== '');
      
      const response = await driverRegister({
        name: registerData.name,
        phone: registerData.phone,
        currentAddress: registerData.currentAddress,
        permanentAddress: registerData.permanentAddress,
        password: registerData.password,
        aadharNo: registerData.aadharNo,
        licenseNo: registerData.licenseNo,
        licenseExpiryDate: registerData.licenseExpiryDate,
        altPhone: altPhone,
        upiId: registerData.gpayNo,
        photo: uploadedUrls.photo,
        dlPhoto: uploadedUrls.dlPhoto,
        panPhoto: uploadedUrls.panPhoto,
        aadharPhoto: uploadedUrls.aadharPhoto,
        policeVerificationPhoto: uploadedUrls.policeVerificationPhoto,
        policeVerificationExpiryDate: registerData.policeVerificationExpiryDate
      });
      
      if (response.token) {
        setIsPrimaryVerified(true);
        if (registerData.alternateMobile1) setIsAltVerified(true);
        
        alert('Registration and Verification successful! Please login with your credentials.');
        navigate('/driver/login');
      } else {
        alert(response.error || response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      alert(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      if (step === 1 && isStep1Valid) nextStep();
      if (step === 2 && isStep2Valid) nextStep();
      return;
    }
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
      
      // Upload all files including police verification
      const [photoUrl, dlPhotoUrl, panPhotoUrl, aadharPhotoUrl, policeVerificationPhotoUrl] = await Promise.all([
        uploadFile(registerData.photo as any, 'photo'),
        uploadFile(registerData.dlPhoto as any, 'driving license'),
        uploadFile(registerData.panPhoto as any, 'PAN card'),
        uploadFile(registerData.aadharPhoto as any, 'Aadhar card'),
        uploadFile(registerData.policeVerificationPhoto as any, 'police verification')
      ]);
      
      setUploadedUrls({
        photo: photoUrl,
        dlPhoto: dlPhotoUrl,
        panPhoto: panPhotoUrl,
        aadharPhoto: aadharPhotoUrl,
        policeVerificationPhoto: policeVerificationPhotoUrl
      });
      
      // Go to OTP step WITHOUT saving to database
      setStep(4);
    } catch (error: any) {
      console.error('File upload error:', error);
      alert(error.message || 'Failed to upload files. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <form onSubmit={handleRegister} className="animate-fade-in flex-grow flex flex-col w-full max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4 px-1">
        {step < 4 && (
          <button type="button" onClick={() => step === 1 ? navigate('/driver/login') : prevStep()} className="text-gray-400 hover:text-black flex items-center gap-1 text-sm font-bold transition">
            ← {step === 1 ? 'Back to Login' : 'Back'}
          </button>
        )}
        {step === 4 && <div />}
        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
          Step {step} of {step === 4 ? 4 : 3}
        </span>
      </div>
      
      <h2 className="text-xl font-bold mb-1 text-black px-1">
        {step === 1 ? 'Personal Details' : step === 2 ? 'Identification & Contact' : step === 3 ? 'Document Uploads' : 'OTP Verification'}
      </h2>
      <p className="text-xs text-gray-500 mb-2 px-1">
        {step === 1 ? 'Enter your basic profile information to get started.' : step === 2 ? 'Provide your driving credentials and alternate contacts.' : step === 3 ? 'Upload clear photos of your required documents to complete.' : 'Please verify your phone numbers to activate your account.'}
      </p>
      
      <div className="space-y-4 flex-grow overflow-y-auto px-1 pb-4">
        {step === 4 && (
          <div className="space-y-4 animate-fade-in py-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-2">
              <p className="text-[10px] text-blue-800 font-medium">
                We've sent a 6-digit verification code to your registered mobile numbers.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">
                OTP for {registerData.phone || 'Primary Phone'} *
              </label>
              <input 
                type="text" 
                maxLength={6}
                placeholder="Enter 6-digit code"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-center tracking-[0.5em] text-lg font-bold placeholder:tracking-normal placeholder:text-sm placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black transition-all shadow-sm" 
                value={primaryOtp} 
                onChange={(e) => setPrimaryOtp(e.target.value.replace(/\D/g, ''))} 
              />
            </div>

            {registerData.alternateMobile1 && (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">
                  OTP for {registerData.alternateMobile1} (Alternate) *
                </label>
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-center tracking-[0.5em] text-lg font-bold placeholder:tracking-normal placeholder:text-sm placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black transition-all shadow-sm" 
                  value={altOtp} 
                  onChange={(e) => setAltOtp(e.target.value.replace(/\D/g, ''))} 
                />
              </div>
            )}
          </div>
        )}
        {step === 1 && (
          <div className="space-y-1.5 animate-fade-in">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Full Name *</label>
              <input 
                type="text"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm font-medium focus:ring-2 focus:ring-black focus:border-black transition-all shadow-sm"
                value={registerData.name}
                onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Phone Number * <span className="text-[10px] text-gray-400 normal-case ml-1 font-normal">(10 digits)</span></label>
              <input 
                type="tel"
                maxLength={10}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm font-medium focus:ring-2 focus:ring-black focus:border-black transition-all shadow-sm"
                value={registerData.phone}
                onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Password *</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 pr-10 text-sm font-medium focus:ring-2 focus:ring-black focus:border-black transition-all shadow-sm"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Permanent Address *</label>
              <textarea 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm font-medium focus:ring-2 focus:ring-black focus:border-black transition-all resize-none shadow-sm"
                rows={2}
                value={registerData.permanentAddress}
                onChange={(e) => {
                  const newAddress = e.target.value;
                  if (isSameAddress) {
                    setRegisterData({...registerData, permanentAddress: newAddress, currentAddress: newAddress});
                  } else {
                    setRegisterData({...registerData, permanentAddress: newAddress});
                  }
                }}
                required
              />
            </div>

            <div className="flex items-center gap-2 py-1">
              <input 
                type="checkbox" 
                id="sameAddress"
                checked={isSameAddress}
                onChange={(e) => {
                  setIsSameAddress(e.target.checked);
                  if (e.target.checked) {
                    setRegisterData({...registerData, currentAddress: registerData.permanentAddress});
                  } else {
                    setRegisterData({...registerData, currentAddress: ''});
                  }
                }}
                className="w-4 h-4 text-black bg-gray-50 border-gray-300 rounded focus:ring-black focus:ring-2 cursor-pointer"
              />
              <label htmlFor="sameAddress" className="text-xs font-bold text-gray-600 cursor-pointer">
                Current Address is same as Permanent Address
              </label>
            </div>

            {!isSameAddress && (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Current Address *</label>
                <textarea 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm font-medium focus:ring-2 focus:ring-black focus:border-black transition-all resize-none shadow-sm"
                  rows={2}
                  value={registerData.currentAddress}
                  onChange={(e) => setRegisterData({...registerData, currentAddress: e.target.value})}
                  required
                />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-1.5 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Aadhar Number * <span className="text-[10px] text-gray-400 normal-case ml-1 font-normal">(12 digits)</span></label>
                <input 
                  type="text"
                  maxLength={12}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm font-medium focus:ring-2 focus:ring-black focus:border-black transition-all shadow-sm"
                  value={registerData.aadharNo}
                  onChange={(e) => setRegisterData({...registerData, aadharNo: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Driving License No*</label>
                <input 
                  type="text"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm font-medium focus:ring-2 focus:ring-black focus:border-black transition-all shadow-sm mb-2"
                  value={registerData.licenseNo}
                  onChange={(e) => setRegisterData({...registerData, licenseNo: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">License Expiry Date *</label>
                <input 
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full bg-gray-50 border ${registerData.licenseExpiryDate && !isValidDLExpiry(registerData.licenseExpiryDate) ? 'border-red-500' : 'border-gray-200'} rounded-xl p-2 text-sm font-medium focus:ring-2 focus:ring-black focus:border-black transition-all shadow-sm`}
                  value={registerData.licenseExpiryDate}
                  onChange={(e) => setRegisterData({...registerData, licenseExpiryDate: e.target.value})}
                  required
                />
                {registerData.licenseExpiryDate && !isValidDLExpiry(registerData.licenseExpiryDate) && (
                  <p className="text-[10px] text-red-500 mt-1 font-bold">License must not be expired.</p>
                )}
              </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Gpay/PhonePe number</label>
              <input 
                type="text"
                maxLength={10}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm font-medium focus:ring-2 focus:ring-black focus:border-black transition-all shadow-sm"
                placeholder="Enter mobile number"
                value={registerData.gpayNo}
                onChange={(e) => setRegisterData({...registerData, gpayNo: e.target.value})}
              />
            </div>

            <div className="pt-2">
              <label className="block text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-wider border-b border-gray-100 pb-2">Alternate Contacts (Optional)</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">PHONE 1</label>
                  <input 
                    type="tel"
                    maxLength={10}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-black focus:border-black transition-all"
                    value={registerData.alternateMobile1}
                    onChange={(e) => setRegisterData({...registerData, alternateMobile1: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">PHONE 2</label>
                  <input 
                    type="tel"
                    maxLength={10}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-black focus:border-black transition-all"
                    value={registerData.alternateMobile2}
                    onChange={(e) => setRegisterData({...registerData, alternateMobile2: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">PHONE 3</label>
                  <input 
                    type="tel"
                    maxLength={10}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-black focus:border-black transition-all"
                    value={registerData.alternateMobile3}
                    onChange={(e) => setRegisterData({...registerData, alternateMobile3: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">PHONE 4</label>
                  <input 
                    type="tel"
                    maxLength={10}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-black focus:border-black transition-all"
                    value={registerData.alternateMobile4}
                    onChange={(e) => setRegisterData({...registerData, alternateMobile4: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in space-y-1.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input 
                  type="file"
                  accept="image/*"
                  id="photo"
                  className="hidden"
                  onChange={(e) => setRegisterData({...registerData, photo: (e.target.files?.[0] as any) || null})}
                />
                <label 
                  htmlFor="photo"
                  className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition ${registerData.photo ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}`}
                >
                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    <svg className={`w-6 h-6 mb-1 ${registerData.photo ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {registerData.photo ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6-6 0H6" />
                      )}
                    </svg>
                    <p className={`text-sm font-medium ${registerData.photo ? 'text-green-700' : 'text-gray-600'}`}>Profile Photo</p>
                  </div>
                </label>
              </div>
              
              <div className="relative">
                <input 
                  type="file"
                  accept="image/*"
                  id="dlPhoto"
                  className="hidden"
                  onChange={(e) => setRegisterData({...registerData, dlPhoto: (e.target.files?.[0] as any) || null})}
                />
                <label 
                  htmlFor="dlPhoto"
                  className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition ${registerData.dlPhoto ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}`}
                >
                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    <svg className={`w-6 h-6 mb-1 ${registerData.dlPhoto ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {registerData.dlPhoto ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      )}
                    </svg>
                    <p className={`text-sm font-medium ${registerData.dlPhoto ? 'text-green-700' : 'text-gray-600'}`}>Driving License</p>
                  </div>
                </label>
              </div>
              
              <div className="relative">
                <input 
                  type="file"
                  accept="image/*"
                  id="panPhoto"
                  className="hidden"
                  onChange={(e) => setRegisterData({...registerData, panPhoto: (e.target.files?.[0] as any) || null})}
                />
                <label 
                  htmlFor="panPhoto"
                  className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition ${registerData.panPhoto ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}`}
                >
                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    <svg className={`w-6 h-6 mb-1 ${registerData.panPhoto ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {registerData.panPhoto ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      )}
                    </svg>
                    <p className={`text-sm font-medium ${registerData.panPhoto ? 'text-green-700' : 'text-gray-600'}`}>PAN Card</p>
                  </div>
                </label>
              </div>
              
              <div className="relative">
                <input 
                  type="file"
                  accept="image/*"
                  id="aadharPhoto"
                  className="hidden"
                  onChange={(e) => setRegisterData({...registerData, aadharPhoto: (e.target.files?.[0] as any) || null})}
                />
                <label 
                  htmlFor="aadharPhoto"
                  className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition ${registerData.aadharPhoto ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}`}
                >
                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    <svg className={`w-6 h-6 mb-1 ${registerData.aadharPhoto ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {registerData.aadharPhoto ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      )}
                    </svg>
                    <p className={`text-sm font-medium ${registerData.aadharPhoto ? 'text-green-700' : 'text-gray-600'}`}>Aadhar Card</p>
                  </div>
                </label>
              </div>

              <div className="relative col-span-2">
                <input 
                  type="file"
                  accept="image/*"
                  id="policeVerificationPhoto"
                  className="hidden"
                  onChange={(e) => setRegisterData({...registerData, policeVerificationPhoto: (e.target.files?.[0] as any) || null})}
                />
                <label 
                  htmlFor="policeVerificationPhoto"
                  className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition ${registerData.policeVerificationPhoto ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}`}
                >
                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    <svg className={`w-6 h-6 mb-1 ${registerData.policeVerificationPhoto ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {registerData.policeVerificationPhoto ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      )}
                    </svg>
                    <p className={`text-sm font-medium ${registerData.policeVerificationPhoto ? 'text-green-700' : 'text-gray-600'}`}>Police Verification</p>
                    {!registerData.policeVerificationPhoto && <p className="text-[10px] text-gray-400 mt-0.5">Upload verification document</p>}
                  </div>
                </label>
              </div>
              
              <div className="col-span-2 mt-2">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Police Verification Expiry Date *</label>
                <p className="text-[10px] text-gray-400 mb-1">Typically valid for 1 year from issue date.</p>
                <input 
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm font-medium focus:ring-2 focus:ring-black focus:border-black transition-all shadow-sm"
                  value={registerData.policeVerificationExpiryDate}
                  onChange={(e) => setRegisterData({...registerData, policeVerificationExpiryDate: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-gray-100">
        {step < 3 && (
          <button 
            type="button" 
            onClick={nextStep}
            disabled={step === 1 ? !isStep1Valid : step === 2 ? !isStep2Valid : false}
            className="w-full bg-black text-white py-2 rounded-xl font-bold text-sm hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            Continue to Next Step
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
        {step === 3 && (
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-2 rounded-xl font-bold text-sm hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-green-200"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Complete Registration'
            )}
          </button>
        )}
        {step === 4 && (
          <button 
            type="button" 
            onClick={handleVerifyOTP}
            disabled={primaryOtp.length !== 6 || (registerData.alternateMobile1 ? altOtp.length !== 6 : false) || isLoading}
            className="w-full bg-black text-white py-2 rounded-xl font-bold text-sm hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying & Registering...
              </span>
            ) : (
              <>
                Verify & Login
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
};

export default DriverRegister;
