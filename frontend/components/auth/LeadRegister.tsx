import React, { useState } from 'react';
import { registerLead } from '../../api/lead';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../api/config.js';
import { useNavigate } from 'react-router-dom';

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
    electricityBillPhoto: '',
    rentalAgreementPhoto: '',
    creditCardPhoto: '',
    debitCardPhoto: ''
  });
  const [loading, setLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<{[key: string]: string}>({});

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const isStep1Valid = Boolean(formData.name && formData.email && formData.phone && formData.password && formData.aadharNo && formData.licenseNo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      if (step === 1 && isStep1Valid) nextStep();
      if (step === 2) nextStep();
      return;
    }
    
    setLoading(true);
    
    // Filter out empty string values and null values
    const cleanedData = Object.fromEntries(
      Object.entries(formData)
        .filter(([key, value]) => value !== '' && value !== null)
    );
    
    const result = await registerLead(cleanedData);
    
    if (result.success) {
      toast.success('Registration successful! Please wait for admin approval.');
      navigate('/lead/login');
    } else {
      toast.error(result.error || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-2">
      <form onSubmit={handleSubmit} className="animate-fade-in flex-grow flex flex-col w-full max-w-lg mx-auto overflow-y-auto">
        <div className="flex justify-between items-center mb-4 px-1">
          <button type="button" onClick={() => step === 1 ? navigate('/lead/login') : prevStep()} className="text-gray-400 hover:text-black flex items-center gap-1 text-sm font-bold transition">
            &larr; {step === 1 ? 'Back to Login' : 'Back'}
          </button>
          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
            Step {step} of 3
          </span>
        </div>
        
        <h2 className="text-xl font-bold mb-1 text-black px-1">
          {step === 1 ? 'Personal Details' : step === 2 ? 'Alternate Contacts' : 'Document Uploads'}
        </h2>
        <p className="text-xs text-gray-500 mb-2 px-1">
          {step === 1 ? 'Enter your basic profile information.' : step === 2 ? 'Provide any alternate contact numbers.' : 'Upload photos of required documents.'}
        </p>

        <div className="flex-grow overflow-y-auto pr-1 pb-4">
          {step === 1 && (
            <div className="space-y-3 animate-fade-in py-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Aadhar Number</label>
                <input type="text" value={formData.aadharNo} onChange={(e) => setFormData({...formData, aadharNo: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">License Number</label>
                <input type="text" value={formData.licenseNo} onChange={(e) => setFormData({...formData, licenseNo: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" required />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 animate-fade-in py-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alternate Phone 1</label>
                <input type="tel" value={formData.alternateMobile1} onChange={(e) => setFormData({...formData, alternateMobile1: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alternate Phone 2</label>
                <input type="tel" value={formData.alternateMobile2} onChange={(e) => setFormData({...formData, alternateMobile2: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alternate Phone 3</label>
                <input type="tel" value={formData.alternateMobile3} onChange={(e) => setFormData({...formData, alternateMobile3: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alternate Phone 4</label>
                <input type="tel" value={formData.alternateMobile4} onChange={(e) => setFormData({...formData, alternateMobile4: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">UPI ID (GPay/PhonePe)</label>
                <input type="text" value={formData.gpayNo} onChange={(e) => setFormData({...formData, gpayNo: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in space-y-3 py-2">
              <div className="grid grid-cols-2 gap-2">
                {['photo', 'dlPhoto', 'panPhoto', 'aadharPhoto', 'msmePhoto', 'rationCardPhoto', 'policeVerificationPhoto', 'electricityBillPhoto', 'rentalAgreementPhoto', 'creditCardPhoto', 'debitCardPhoto'].map((field) => (
                  <div key={field}>
                    <input 
                      type="file"
                      accept="image/*"
                      id={field}
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const previewUrl = URL.createObjectURL(file);
                          setImagePreviews({...imagePreviews, [field]: previewUrl});
                          try {
                            const fd = new FormData();
                            fd.append('file', file);
                            const response = await fetch(`${API_BASE_URL}/api/upload/file`, { method: 'POST', body: fd });
                            const result = await response.json();
                            if (result.success) setFormData(prev => ({...prev, [field]: result.fileId}));
                          } catch (error) {
                            console.error('Upload failed:', error);
                          }
                        }
                      }}
                    />
                    <label htmlFor={field} className="block w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition overflow-hidden">
                      {imagePreviews[field] || formData[field as keyof typeof formData] ? (
                        <img src={imagePreviews[field] || (String(formData[field as keyof typeof formData]).startsWith('http') ? String(formData[field as keyof typeof formData]) : `${API_BASE_URL}${formData[field as keyof typeof formData]}`)} alt={field} className="w-full h-full object-contain" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                          <svg className="w-4 h-4 mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span className="text-[10px] text-gray-400 text-center font-semibold leading-tight px-1">
                            {field.replace('Photo', '').replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())}
                          </span>
                        </div>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-100">
          {step < 3 ? (
            <button type="button" onClick={nextStep} disabled={step === 1 && !isStep1Valid} className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
              Continue to Step {step + 1}
            </button>
          ) : (
            <button type="submit" disabled={loading} className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
              {loading ? 'Registering...' : 'Complete Registration'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default LeadRegister;