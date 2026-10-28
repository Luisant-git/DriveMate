import React, { useState } from 'react';
import { registerLead } from '../../api/lead';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../api/config.js';
import { useNavigate } from 'react-router-dom';

const REQUIRED_DOCS = [
  { key: 'photo', label: 'Profile Photo', desc: 'Clear face photograph' },
  { key: 'dlPhoto', label: 'Driving License', desc: 'Front photo of Driving License' },
  { key: 'aadharPhoto', label: 'Aadhar Card', desc: 'Front photo of Aadhar Card' },
  { key: 'panPhoto', label: 'PAN Card', desc: 'Photo of PAN Card' }
];

const OPTIONAL_DOCS = [
  { key: 'policeVerificationPhoto', label: 'Police Verification', desc: 'Official verification certificate' },
  { key: 'msmePhoto', label: 'MSME Certificate', desc: 'MSME / Udyam registration' },
  { key: 'rationCardPhoto', label: 'Ration Card', desc: 'Family ration card photo' },
  { key: 'electricityBillPhoto', label: 'Electricity Bill', desc: 'Address proof electricity bill' },
  { key: 'rentalAgreementPhoto', label: 'Rental Agreement', desc: 'Current rental agreement' },
  { key: 'creditCardPhoto', label: 'Credit Card', desc: 'Front photo (hide CVV)' },
  { key: 'debitCardPhoto', label: 'Debit Card', desc: 'Front photo (hide CVV)' }
];

const LeadRegister: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    aadharNo: '',
    licenseNo: '',
    alternateMobile1: '',
    alternateMobile2: '',
    alternateMobile3: '',
    alternateMobile4: '',
    gpayNo: '',
    photo: '',
    dlPhoto: '',
    panPhoto: '',
    aadharPhoto: '',
    msmePhoto: '',
    rationCardPhoto: '',
    policeVerificationPhoto: '',
    policeVerificationNo: '',
    electricityBillPhoto: '',
    rentalAgreementPhoto: '',
    creditCardPhoto: '',
    debitCardPhoto: ''
  });

  const [loading, setLoading] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<{ [key: string]: boolean }>({});
  const [imagePreviews, setImagePreviews] = useState<{ [key: string]: string }>({});
  const [showOptionalDocs, setShowOptionalDocs] = useState(false);

  // Validation helpers
  const isValidPhone = (p: string) => /^\d{10}$/.test(p.trim());
  const isValidOptionalPhone = (p: string) => !p || isValidPhone(p);
  const isValidAadhar = (a: string) => /^\d{12}$/.test(a.trim());
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  const isValidUpi = (u: string) => !u || /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(u.trim()) || /^\d{10}$/.test(u.trim());

  const isStep1Valid = Boolean(
    formData.name.trim().length >= 2 &&
    isValidEmail(formData.email) &&
    isValidPhone(formData.phone) &&
    formData.password.length >= 6 &&
    isValidAadhar(formData.aadharNo) &&
    formData.licenseNo.trim().length >= 6
  );

  const isStep2Valid = Boolean(
    isValidOptionalPhone(formData.alternateMobile1) &&
    isValidOptionalPhone(formData.alternateMobile2) &&
    isValidOptionalPhone(formData.alternateMobile3) &&
    isValidOptionalPhone(formData.alternateMobile4) &&
    isValidUpi(formData.gpayNo)
  );

  const isAnyUploading = Object.values(uploadingFields).some(Boolean);
  const requiredUploadedCount = REQUIRED_DOCS.filter(d => Boolean(formData[d.key as keyof typeof formData])).length;
  const isStep3Valid = requiredUploadedCount === REQUIRED_DOCS.length && !isAnyUploading;

  const nextStep = () => {
    if (step === 1 && !isStep1Valid) {
      toast.warning('Please fill all required personal details correctly.');
      return;
    }
    if (step === 2 && !isStep2Valid) {
      toast.warning('Please enter valid 10-digit phone numbers or UPI ID.');
      return;
    }
    setStep(s => Math.min(s + 1, 3));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleFileUpload = async (field: string, file: File) => {
    if (!file) return;

    // Set local image preview immediately
    const previewUrl = URL.createObjectURL(file);
    setImagePreviews(prev => ({ ...prev, [field]: previewUrl }));
    setUploadingFields(prev => ({ ...prev, [field]: true }));

    try {
      const fd = new FormData();
      fd.append('file', file);
      const response = await fetch(`${API_BASE_URL}/api/upload/file`, { method: 'POST', body: fd });
      const result = await response.json();
      if (result.success && result.fileId) {
        setFormData(prev => ({ ...prev, [field]: result.fileId }));
        toast.success(`${field.replace('Photo', '').replace(/([A-Z])/g, ' $1').trim()} uploaded!`);
      } else {
        toast.error(result.error || `Failed to upload document`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed due to network error');
    } finally {
      setUploadingFields(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      nextStep();
      return;
    }

    if (!isStep3Valid) {
      toast.warning('Please upload all 4 required documents before completing registration.');
      return;
    }

    setLoading(true);

    // Clean data - filter out empty strings and null values
    const cleanedData = Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => value !== '' && value !== null)
    );

    const result = await registerLead(cleanedData);

    if (result.success) {
      toast.success('Registration successful! Please wait for admin approval.');
      navigate('/lead/login');
    } else {
      toast.error(result.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-2">
      <form onSubmit={handleSubmit} className="animate-fade-in flex-grow flex flex-col w-full max-w-lg mx-auto overflow-y-auto">
        {/* Header navigation & progress */}
        <div className="flex justify-between items-center mb-4 px-1">
          <button 
            type="button" 
            onClick={() => step === 1 ? navigate('/lead/login') : prevStep()} 
            className="text-gray-400 hover:text-black flex items-center gap-1 text-sm font-bold transition"
          >
            &larr; {step === 1 ? 'Back to Login' : 'Back'}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
              Step {step} of 3
            </span>
          </div>
        </div>

        {/* Step Title & Subtitle */}
        <div className="mb-3 px-1">
          <h2 className="text-xl font-bold text-black tracking-tight">
            {step === 1 ? 'Personal Details' : step === 2 ? 'Alternate Contacts' : 'Document Uploads'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {step === 1 
              ? 'Enter your basic profile information to get started.' 
              : step === 2 
              ? 'Provide any alternate contact numbers and UPI ID.' 
              : 'Upload required identity documents so admin can verify your account.'}
          </p>
        </div>

        {/* Step Form Body */}
        <div className="flex-grow overflow-y-auto pr-1 pb-4">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-3 animate-fade-in py-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" 
                  placeholder="Enter full name"
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email *</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" 
                  placeholder="name@example.com"
                  required 
                />
                {formData.email && !isValidEmail(formData.email) && (
                  <p className="text-[10px] text-red-500 mt-0.5">Please enter a valid email address.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number (10 digits) *</label>
                <input 
                  type="tel" 
                  maxLength={10}
                  value={formData.phone} 
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" 
                  placeholder="10-digit primary phone"
                  required 
                />
                {formData.phone && !isValidPhone(formData.phone) && (
                  <p className="text-[10px] text-red-500 mt-0.5">Phone number must be exactly 10 digits.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password (min 6 characters) *</label>
                <input 
                  type="password" 
                  value={formData.password} 
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" 
                  placeholder="••••••••"
                  required 
                />
                {formData.password && formData.password.length < 6 && (
                  <p className="text-[10px] text-red-500 mt-0.5">Password must be at least 6 characters.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Aadhar Number (12 digits) *</label>
                <input 
                  type="text" 
                  maxLength={12}
                  value={formData.aadharNo} 
                  onChange={(e) => setFormData({ ...formData, aadharNo: e.target.value.replace(/\D/g, '') })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" 
                  placeholder="12-digit Aadhar number"
                  required 
                />
                {formData.aadharNo && !isValidAadhar(formData.aadharNo) && (
                  <p className="text-[10px] text-red-500 mt-0.5">Aadhar number must be exactly 12 digits.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Driving License Number *</label>
                <input 
                  type="text" 
                  value={formData.licenseNo} 
                  onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value.toUpperCase() })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" 
                  placeholder="DL Number"
                  required 
                />
                {formData.licenseNo && formData.licenseNo.trim().length < 6 && (
                  <p className="text-[10px] text-red-500 mt-0.5">Please enter a valid Driving License number.</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-3 animate-fade-in py-1">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-2">
                <p className="text-xs text-gray-600 font-medium">
                  Alternate contact details help us reach you in case your primary phone is busy or unreachable.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alternate Phone 1 (Optional)</label>
                <input 
                  type="tel" 
                  maxLength={10}
                  value={formData.alternateMobile1} 
                  onChange={(e) => setFormData({ ...formData, alternateMobile1: e.target.value.replace(/\D/g, '') })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" 
                  placeholder="10-digit alternate mobile"
                />
                {formData.alternateMobile1 && !isValidPhone(formData.alternateMobile1) && (
                  <p className="text-[10px] text-red-500 mt-0.5">Must be 10 digits.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alternate Phone 2 (Optional)</label>
                <input 
                  type="tel" 
                  maxLength={10}
                  value={formData.alternateMobile2} 
                  onChange={(e) => setFormData({ ...formData, alternateMobile2: e.target.value.replace(/\D/g, '') })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" 
                  placeholder="10-digit alternate mobile"
                />
                {formData.alternateMobile2 && !isValidPhone(formData.alternateMobile2) && (
                  <p className="text-[10px] text-red-500 mt-0.5">Must be 10 digits.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alternate Phone 3 (Optional)</label>
                <input 
                  type="tel" 
                  maxLength={10}
                  value={formData.alternateMobile3} 
                  onChange={(e) => setFormData({ ...formData, alternateMobile3: e.target.value.replace(/\D/g, '') })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" 
                  placeholder="10-digit alternate mobile"
                />
                {formData.alternateMobile3 && !isValidPhone(formData.alternateMobile3) && (
                  <p className="text-[10px] text-red-500 mt-0.5">Must be 10 digits.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alternate Phone 4 (Optional)</label>
                <input 
                  type="tel" 
                  maxLength={10}
                  value={formData.alternateMobile4} 
                  onChange={(e) => setFormData({ ...formData, alternateMobile4: e.target.value.replace(/\D/g, '') })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" 
                  placeholder="10-digit alternate mobile"
                />
                {formData.alternateMobile4 && !isValidPhone(formData.alternateMobile4) && (
                  <p className="text-[10px] text-red-500 mt-0.5">Must be 10 digits.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">UPI ID (GPay / PhonePe) (Optional)</label>
                <input 
                  type="text" 
                  value={formData.gpayNo} 
                  onChange={(e) => setFormData({ ...formData, gpayNo: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" 
                  placeholder="e.g. 9876543210 or yourname@upi"
                />
                {formData.gpayNo && !isValidUpi(formData.gpayNo) && (
                  <p className="text-[10px] text-red-500 mt-0.5">Please enter a valid 10-digit phone or UPI ID (e.g. name@bank).</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="animate-fade-in space-y-4 py-1">
              {/* Mandatory Documents Banner */}
              <div className="flex items-center justify-between bg-black text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm">
                <span>Required Documents ({requiredUploadedCount}/{REQUIRED_DOCS.length})</span>
                {requiredUploadedCount === REQUIRED_DOCS.length ? (
                  <span className="flex items-center gap-1 text-green-400 text-xs">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    All Uploaded
                  </span>
                ) : (
                  <span className="text-yellow-300 text-xs">
                    {REQUIRED_DOCS.length - requiredUploadedCount} Remaining
                  </span>
                )}
              </div>

              {/* Grid of 4 Required Documents */}
              <div className="grid grid-cols-2 gap-3">
                {REQUIRED_DOCS.map((doc) => {
                  const isUploaded = Boolean(formData[doc.key as keyof typeof formData]);
                  const isUploading = uploadingFields[doc.key];
                  const preview = imagePreviews[doc.key] || (formData[doc.key as keyof typeof formData] ? (
                    String(formData[doc.key as keyof typeof formData]).startsWith('http') 
                      ? String(formData[doc.key as keyof typeof formData]) 
                      : `${API_BASE_URL}${formData[doc.key as keyof typeof formData]}`
                  ) : null);

                  return (
                    <div key={doc.key} className="relative">
                      <input 
                        type="file"
                        accept="image/*"
                        id={`file_${doc.key}`}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(doc.key, file);
                        }}
                      />
                      <label 
                        htmlFor={`file_${doc.key}`}
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition overflow-hidden relative ${
                          isUploaded 
                            ? 'border-green-500 bg-green-50/50' 
                            : isUploading 
                            ? 'border-blue-400 bg-blue-50' 
                            : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-black'
                        }`}
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center justify-center p-2 text-blue-600">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-1"></div>
                            <span className="text-[10px] font-bold">Uploading...</span>
                          </div>
                        ) : preview ? (
                          <div className="relative w-full h-full flex items-center justify-center bg-gray-900/5">
                            <img src={preview} alt={doc.label} className="w-full h-full object-contain" />
                            <div className="absolute top-1 right-1 bg-green-600 text-white rounded-full p-1 shadow">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5 truncate px-1">
                              {doc.label} ✓
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-2 text-center">
                            <svg className="w-6 h-6 mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            <p className="text-xs font-bold text-gray-800 leading-tight">
                              {doc.label} <span className="text-red-500">*</span>
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{doc.desc}</p>
                            <span className="mt-1.5 text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              Upload
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>

              {/* Optional Documents Accordion */}
              <div className="border border-gray-200 rounded-xl overflow-hidden mt-4 bg-white">
                <button
                  type="button"
                  onClick={() => setShowOptionalDocs(!showOptionalDocs)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition text-left"
                >
                  <div>
                    <p className="text-xs font-bold text-gray-800">Additional Documents (Optional)</p>
                    <p className="text-[10px] text-gray-500">Police Verification, MSME, Rental Agreement, etc.</p>
                  </div>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${showOptionalDocs ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {showOptionalDocs && (
                  <div className="p-3 border-t border-gray-200 grid grid-cols-2 gap-2 bg-gray-50/50">
                    <div className="col-span-2 pt-2 pb-1">
                      <label className="block text-xs font-bold text-gray-700 mb-1">Police Verification Certificate No (Optional)</label>
                      <input 
                        type="text" 
                        value={formData.policeVerificationNo || ''} 
                        onChange={(e) => setFormData({ ...formData, policeVerificationNo: e.target.value })} 
                        placeholder="e.g. POL-VER-2026-XXXX"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm font-mono bg-white" 
                      />
                    </div>
                    {OPTIONAL_DOCS.map((doc) => {
                      const isUploaded = Boolean(formData[doc.key as keyof typeof formData]);
                      const isUploading = uploadingFields[doc.key];
                      const preview = imagePreviews[doc.key] || (formData[doc.key as keyof typeof formData] ? (
                        String(formData[doc.key as keyof typeof formData]).startsWith('http') 
                          ? String(formData[doc.key as keyof typeof formData]) 
                          : `${API_BASE_URL}${formData[doc.key as keyof typeof formData]}`
                      ) : null);

                      return (
                        <div key={doc.key} className="relative">
                          <input 
                            type="file"
                            accept="image/*"
                            id={`file_${doc.key}`}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(doc.key, file);
                            }}
                          />
                          <label 
                            htmlFor={`file_${doc.key}`}
                            className={`flex flex-col items-center justify-center w-full h-24 border border-dashed rounded-lg cursor-pointer transition overflow-hidden ${
                              isUploaded 
                                ? 'border-green-500 bg-green-50' 
                                : isUploading 
                                ? 'border-blue-400 bg-blue-50' 
                                : 'border-gray-300 bg-white hover:bg-gray-100'
                            }`}
                          >
                            {isUploading ? (
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : preview ? (
                              <div className="relative w-full h-full flex items-center justify-center">
                                <img src={preview} alt={doc.label} className="w-full h-full object-contain" />
                                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5 truncate px-1">
                                  {doc.label} ✓
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center p-1 text-center">
                                <span className="text-[11px] font-bold text-gray-700 leading-tight">{doc.label}</span>
                                <span className="text-[9px] text-gray-400 mt-0.5">Optional</span>
                              </div>
                            )}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="mt-2 pt-2 border-t border-gray-100">
          {step < 3 ? (
            <button 
              type="button" 
              onClick={nextStep} 
              disabled={step === 1 ? !isStep1Valid : !isStep2Valid} 
              className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md"
            >
              Continue to Step {step + 1}
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={loading || !isStep3Valid} 
              className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Registering...
                </>
              ) : isStep3Valid ? (
                'Complete Registration'
              ) : (
                `Upload 4 Required Documents (${requiredUploadedCount}/4)`
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default LeadRegister;