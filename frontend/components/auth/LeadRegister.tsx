import React, { useState } from 'react';
import { registerLead } from '../../api/lead';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../api/config.js';
import { useNavigate } from 'react-router-dom';

const LeadRegister: React.FC = () => {
  const navigate = useNavigate();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      toast.error((result as any).message || 'Registration failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="animate-fade-in flex-grow flex flex-col overflow-y-auto w-full">
      <button onClick={() => navigate('/lead/login')} className="flex items-center gap-2 text-gray-600 hover:text-black mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm font-bold">Back</span>
      </button>

      <h2 className="text-xl font-bold mb-4">Lead Registration</h2>
      
      <form onSubmit={handleSubmit} className="space-y-3 flex-grow flex flex-col w-full">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm"
            required
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm"
            required
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm"
            required
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm"
            required
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Aadhar Number</label>
          <input
            type="text"
            value={formData.aadharNo}
            onChange={(e) => setFormData({...formData, aadharNo: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm"
            required
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">License Number</label>
          <input
            type="text"
            value={formData.licenseNo}
            onChange={(e) => setFormData({...formData, licenseNo: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm"
            required
          />
        </div>
        
        {/* Alternate Phones */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Alternate Phone 1</label>
          <input
            type="tel"
            value={formData.alternateMobile1}
            onChange={(e) => setFormData({...formData, alternateMobile1: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm"
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Alternate Phone 2</label>
          <input
            type="tel"
            value={formData.alternateMobile2}
            onChange={(e) => setFormData({...formData, alternateMobile2: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm"
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Alternate Phone 3</label>
          <input
            type="tel"
            value={formData.alternateMobile3}
            onChange={(e) => setFormData({...formData, alternateMobile3: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm"
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Alternate Phone 4</label>
          <input
            type="tel"
            value={formData.alternateMobile4}
            onChange={(e) => setFormData({...formData, alternateMobile4: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm"
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">UPI ID (GPay/PhonePe)</label>
          <input
            type="text"
            value={formData.gpayNo}
            onChange={(e) => setFormData({...formData, gpayNo: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm"
          />
        </div>
        
        <div className="pt-2">
          <p className="text-xs font-bold text-gray-700 mb-2">Document Uploads</p>
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
                        const formData = new FormData();
                        formData.append('file', file);
                        const response = await fetch(`${API_BASE_URL}/api/upload/file`, {
                          method: 'POST',
                          body: formData
                        });
                        const result = await response.json();
                        if (result.success) {
                          setFormData(prev => ({...prev, [field]: result.fileId}));
                        }
                      } catch (error) {
                        console.error('Upload failed:', error);
                      }
                    }
                  }}
                />
                <label 
                  htmlFor={field}
                  className="block w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition overflow-hidden"
                >
                  {imagePreviews[field] || formData[field as keyof typeof formData] ? (
                    <img 
                      src={imagePreviews[field] || (String(formData[field as keyof typeof formData]).startsWith('http') ? String(formData[field as keyof typeof formData]) : `${API_BASE_URL}${formData[field as keyof typeof formData]}`)} 
                      alt={field} 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <svg className="w-4 h-4 mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-xs text-gray-400">
                        {field === 'photo' ? 'Photo' : 
                         field === 'dlPhoto' ? 'Driving License' : 
                         field === 'panPhoto' ? 'PAN Card' : 
                         field === 'aadharPhoto' ? 'Aadhaar' : 
                         field === 'msmePhoto' ? 'MSME Certificate' : 
                         field === 'rationCardPhoto' ? 'Ration Card' : 
                         field === 'policeVerificationPhoto' ? 'Police Verification' : 
                         field === 'electricityBillPhoto' ? 'Electricity Bill' : 
                         field === 'rentalAgreementPhoto' ? 'Rental Agreement' : 
                         field === 'creditCardPhoto' ? 'Credit Card' : 
                         field === 'debitCardPhoto' ? 'Debit Card' : field}
                      </span>
                    </div>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex-grow"></div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition disabled:bg-gray-400"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default LeadRegister;