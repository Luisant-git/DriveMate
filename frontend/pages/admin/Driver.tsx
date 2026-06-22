import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig.js';
import { API_BASE_URL } from '../../api/config.js';

const getVerificationStatus = (driver) => {
  if (!driver.lastVerifiedAt) return 'NEVER';
  const due = driver.nextVerificationDue ? new Date(driver.nextVerificationDue) : null;
  if (!due) return 'NEVER';
  const diffDays = Math.ceil((due.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'OVERDUE';
  if (diffDays <= 30) return 'DUE_SOON';
  return 'OK';
};

const VerificationBadge = ({ driver, onClick }) => {
  const s = getVerificationStatus(driver);
  const base = 'text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer transition border shadow-sm active:scale-95';
  if (s === 'NEVER') return <button onClick={onClick} className={`${base} bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200`}>Never Verified</button>;
  if (s === 'OVERDUE') return <button onClick={onClick} className={`${base} bg-red-100 text-red-700 border-red-200 hover:bg-red-200`}>Overdue ▸</button>;
  if (s === 'DUE_SOON') return <button onClick={onClick} className={`${base} bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200`}>Due Soon ▸</button>;
  return <button onClick={onClick} className={`${base} bg-green-100 text-green-700 border-green-200 hover:bg-green-200`}>Verified ▸</button>;
};

export default function Driver() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [verifyFilter, setVerifyFilter] = useState('ALL');

  // Verification modal state
  const [verifyDriver, setVerifyDriver] = useState(null);
  const [verifyHistory, setVerifyHistory] = useState([]);
  const [verifyHistoryLoading, setVerifyHistoryLoading] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [verifyPoliceExpiry, setVerifyPoliceExpiry] = useState('');

  // Add driver modal state
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSameAddress, setIsSameAddress] = useState(false);
  const [addDriverForm, setAddDriverForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    licenseNo: '',
    licenseExpiryDate: '',
    aadharNo: '',
    currentAddress: '',
    permanentAddress: '',
    alternateMobile1: '',
    alternateMobile2: '',
    alternateMobile3: '',
    alternateMobile4: '',
    upiId: '',
    policeVerificationExpiryDate: '',
    photo: null,
    dlPhoto: null,
    panPhoto: null,
    aadharPhoto: null,
    policeVerificationPhoto: null
  });

  useEffect(() => { fetchDrivers(); }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/drivers');
      const data = (res.data || []).map(driver => ({
        ...driver,
        activeSubscription: driver.subscriptions?.find(sub => sub.status === 'ACTIVE'),
      }));
      setDrivers(data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDriverSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const uploadFile = async (file, fieldName) => {
        if (!file) return '';
        const formData = new FormData(); 
        formData.append('file', file);
        const response = await fetch(`${API_BASE_URL}/api/upload/file`, { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) return result.fileId;
        throw new Error(`Failed to upload ${fieldName}`);
      };

      const [photoUrl, dlPhotoUrl, panPhotoUrl, aadharPhotoUrl, policeVerificationPhotoUrl] = await Promise.all([
        uploadFile(addDriverForm.photo, 'photo'),
        uploadFile(addDriverForm.dlPhoto, 'driving license'),
        uploadFile(addDriverForm.panPhoto, 'PAN card'),
        uploadFile(addDriverForm.aadharPhoto, 'Aadhar card'),
        uploadFile(addDriverForm.policeVerificationPhoto, 'police verification')
      ]);

      const altPhone = [
        addDriverForm.alternateMobile1,
        addDriverForm.alternateMobile2,
        addDriverForm.alternateMobile3,
        addDriverForm.alternateMobile4
      ].filter(phone => phone && phone.trim() !== '');

      const payload = {
        ...addDriverForm,
        altPhone,
        photo: photoUrl,
        dlPhoto: dlPhotoUrl,
        panPhoto: panPhotoUrl,
        aadharPhoto: aadharPhotoUrl,
        policeVerificationPhoto: policeVerificationPhotoUrl,
        gpayNo: addDriverForm.upiId
      };
      
      const response = await apiClient.post('/driver/auth/register', payload);
      if (response.data) {
        setShowAddDriverModal(false);
        setIsSameAddress(false);
        setAddDriverForm({ 
          name: '', phone: '', email: '', password: '', licenseNo: '', licenseExpiryDate: '', aadharNo: '', currentAddress: '', permanentAddress: '', alternateMobile1: '', alternateMobile2: '', alternateMobile3: '', alternateMobile4: '', upiId: '', policeVerificationExpiryDate: '', photo: null, dlPhoto: null, panPhoto: null, aadharPhoto: null, policeVerificationPhoto: null
        });
        fetchDrivers();
      }
    } catch (error) {
      console.error('Error adding driver:', error);
      alert(error.message || error.response?.data?.error || 'Failed to add driver. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openVerifyModal = async (driver) => {
    setVerifyDriver(driver);
    setShowVerifyForm(false);
    setVerifyNotes('');
    setVerifyHistoryLoading(true);
    setVerifyPoliceExpiry(driver.policeVerificationExpiryDate ? driver.policeVerificationExpiryDate.split('T')[0] : '');
    try {
      const res = await apiClient.get(`/admin/verification/${driver.id}/history`);
      setVerifyHistory(res.data?.records || []);
    } catch {
      setVerifyHistory([]);
    } finally {
      setVerifyHistoryLoading(false);
    }
  };

  const submitVerification = async (status) => {
    if (!verifyDriver) return;
    setVerifySubmitting(true);
    try {
      await apiClient.post('/admin/verification', {
        entityId: verifyDriver.id,
        entityType: 'DRIVER',
        status,
        notes: verifyNotes,
      });
      await fetchDrivers();
      const res = await apiClient.get(`/admin/verification/${verifyDriver.id}/history`);
      setVerifyHistory(res.data?.records || []);
      const driversRes = await apiClient.get('/admin/drivers');
      const updated = (driversRes.data || []).find(d => d.id === verifyDriver.id);
      if (updated) setVerifyDriver({ ...updated, activeSubscription: updated.subscriptions?.find(s => s.status === 'ACTIVE') });
      setShowVerifyForm(false);
      setVerifyNotes('');
    } catch (e) {
      console.error(e);
    } finally {
      setVerifySubmitting(false);
    }
  };

  const handleUploadPoliceVerification = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !verifyDriver) return;
    
    if (!verifyPoliceExpiry) {
      alert('Please select an expiry date for the document.');
      e.target.value = '';
      return;
    }
    const expiryDateObj = new Date(verifyPoliceExpiry);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (expiryDateObj <= today) {
      alert('Expiry date must be in the future.');
      e.target.value = '';
      return;
    }
    
    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch(`${API_BASE_URL}/api/upload/file`, { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      
      if (uploadData.success) {
        const url = uploadData.fileId;
        const res = await apiClient.put(`/admin/drivers/${verifyDriver.id}/document`, {
          documentType: 'policeVerificationPhoto',
          documentUrl: url,
          expiryDate: verifyPoliceExpiry
        });
        
        if (res.data.success) {
          // Update the local state
          const updatedDriver = res.data.driver;
          setVerifyDriver({ ...verifyDriver, policeVerificationPhoto: updatedDriver.policeVerificationPhoto });
          
          // Also update the drivers list
          const driversRes = await apiClient.get('/admin/drivers');
          const data = (driversRes.data || []).map(d => ({
            ...d,
            activeSubscription: d.subscriptions?.find(sub => sub.status === 'ACTIVE'),
          }));
          setDrivers(data);
          
          alert('Police Verification document uploaded successfully!');
        }
      } else {
        throw new Error('File upload failed');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDeletePoliceVerification = async () => {
    if (!verifyDriver) return;
    if (!window.confirm('Are you sure you want to remove this document?')) return;
    
    try {
      const res = await apiClient.put(`/admin/drivers/${verifyDriver.id}/document`, {
        documentType: 'policeVerificationPhoto',
        documentUrl: null
      });
      
      if (res.data.success) {
        // Update local state
        setVerifyDriver({ 
          ...verifyDriver, 
          policeVerificationPhoto: null, 
          policeVerificationExpiryDate: null 
        });
        setVerifyPoliceExpiry('');
        
        // Update drivers list
        const driversRes = await apiClient.get('/admin/drivers');
        const data = (driversRes.data || []).map(d => ({
          ...d,
          activeSubscription: d.subscriptions?.find(sub => sub.status === 'ACTIVE'),
        }));
        setDrivers(data);
      }
    } catch (error) {
      console.error('Error removing document:', error);
      alert('Failed to remove document');
    }
  };

  const toggleActiveStatus = async (driverId, currentStatus) => {
    try {
      const res = await apiClient.put(`/admin/drivers/${driverId}/active`, { isActive: !currentStatus });
      if (res.data.success) fetchDrivers();
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  const docUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  };

  const filteredDrivers = drivers.filter(d => {
    if (verifyFilter === 'ALL') return true;
    return getVerificationStatus(d) === verifyFilter;
  });

  const filterCounts = {
    ALL: drivers.length,
    OVERDUE: drivers.filter(d => getVerificationStatus(d) === 'OVERDUE').length,
    DUE_SOON: drivers.filter(d => getVerificationStatus(d) === 'DUE_SOON').length,
    NEVER: drivers.filter(d => getVerificationStatus(d) === 'NEVER').length,
    OK: drivers.filter(d => getVerificationStatus(d) === 'OK').length,
  };

  if (loading) return <div className="px-6 py-6 flex items-center justify-center"><div className="text-gray-500">Loading drivers...</div></div>;

  return (
    <div className="px-6 py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">All Drivers</h2>
        <button 
          onClick={() => setShowAddDriverModal(true)} 
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-gray-800 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Driver
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: 'ALL', label: 'All' },
          { key: 'OVERDUE', label: 'Overdue' },
          { key: 'DUE_SOON', label: 'Due Soon' },
          { key: 'NEVER', label: 'Never Verified' },
          { key: 'OK', label: 'Verified' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setVerifyFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition border ${
              verifyFilter === f.key ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
            <span className="ml-1.5 text-[10px] opacity-70">({filterCounts[f.key]})</span>
          </button>
        ))}
      </div>

      {filteredDrivers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500 text-sm">No drivers found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Driving License</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Package</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Verification</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Active</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDrivers.map((driver, index) => {
                  const vs = getVerificationStatus(driver);
                  const rowBg = vs === 'OVERDUE' ? 'bg-red-50 hover:bg-red-100' : vs === 'DUE_SOON' ? 'bg-yellow-50 hover:bg-yellow-100' : vs === 'NEVER' ? 'bg-gray-50 hover:bg-gray-100' : 'bg-green-50 hover:bg-green-100';
                  return (
                  <tr key={driver.id} className={`${rowBg} transition`}>
                    <td className="px-4 py-4"><p className="text-sm font-semibold text-gray-900">{index + 1}</p></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                          {driver.name ? driver.name[0] : 'D'}
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{driver.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4"><p className="text-sm text-gray-900">{driver.phone}</p></td>
                    <td className="px-4 py-4"><p className="text-sm text-gray-900">{driver.licenseNo}</p></td>
                    <td className="px-4 py-4">
                      <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
                        {driver.activeSubscription?.plan?.name || 'No Active Package'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <VerificationBadge driver={driver} onClick={() => openVerifyModal(driver)} />
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleActiveStatus(driver.id, driver.isActive)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition ${driver.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      >
                        {driver.isActive ? 'Active' : 'Deactive'}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setSelectedDriver(driver)}
                        className="w-8 h-8 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      {showAddDriverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Add New Driver</h3>
              <button onClick={() => setShowAddDriverModal(false)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto p-5 flex-grow custom-scrollbar">
              <form id="addDriverForm" onSubmit={handleAddDriverSubmit} className="space-y-6">
                
                {/* Personal Details */}
                <div>
                  <h4 className="text-sm font-bold border-b pb-2 mb-3">Personal Details</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                      <input required type="text" value={addDriverForm.name} onChange={e => setAddDriverForm({...addDriverForm, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="Enter full name" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                      <input type="email" value={addDriverForm.email} onChange={e => setAddDriverForm({...addDriverForm, email: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="Optional email" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Primary Phone *</label>
                      <input required type="tel" maxLength={10} value={addDriverForm.phone} onChange={e => setAddDriverForm({...addDriverForm, phone: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="10-digit number" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Initial Password *</label>
                      <input required type="text" value={addDriverForm.password} onChange={e => setAddDriverForm({...addDriverForm, password: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="Set a password" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Permanent Address *</label>
                    <textarea 
                      required 
                      value={addDriverForm.permanentAddress} 
                      onChange={e => {
                        const newAddress = e.target.value;
                        if (isSameAddress) {
                          setAddDriverForm({...addDriverForm, permanentAddress: newAddress, currentAddress: newAddress});
                        } else {
                          setAddDriverForm({...addDriverForm, permanentAddress: newAddress});
                        }
                      }} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none resize-none" 
                      rows={2} 
                      placeholder="Driver's permanent address"
                    ></textarea>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <input 
                      type="checkbox" 
                      id="adminSameAddress"
                      checked={isSameAddress}
                      onChange={(e) => {
                        setIsSameAddress(e.target.checked);
                        if (e.target.checked) {
                          setAddDriverForm({...addDriverForm, currentAddress: addDriverForm.permanentAddress});
                        } else {
                          setAddDriverForm({...addDriverForm, currentAddress: ''});
                        }
                      }}
                      className="w-4 h-4 text-black bg-gray-50 border-gray-300 rounded focus:ring-black focus:ring-2 cursor-pointer"
                    />
                    <label htmlFor="adminSameAddress" className="text-xs font-bold text-gray-600 cursor-pointer">
                      Current Address is same as Permanent Address
                    </label>
                  </div>

                  {!isSameAddress && (
                    <div className="mb-3">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Address *</label>
                      <textarea 
                        required 
                        value={addDriverForm.currentAddress} 
                        onChange={e => setAddDriverForm({...addDriverForm, currentAddress: e.target.value})} 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none resize-none" 
                        rows={2} 
                        placeholder="Driver's current address"
                      ></textarea>
                    </div>
                  )}
                </div>
                {/* Identification & Contact */}
                <div>
                  <h4 className="text-sm font-bold border-b pb-2 mb-3">Identification & Contact</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">License Number *</label>
                      <input required type="text" value={addDriverForm.licenseNo} onChange={e => setAddDriverForm({...addDriverForm, licenseNo: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="DL Number" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">License Expiry *</label>
                      <input required type="date" value={addDriverForm.licenseExpiryDate} onChange={e => setAddDriverForm({...addDriverForm, licenseExpiryDate: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Aadhar Number *</label>
                      <input required type="text" maxLength={12} value={addDriverForm.aadharNo} onChange={e => setAddDriverForm({...addDriverForm, aadharNo: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="12-digit Aadhar" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">UPI ID (Optional)</label>
                      <input type="text" value={addDriverForm.upiId} onChange={e => setAddDriverForm({...addDriverForm, upiId: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="GPay / PhonePe" />
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Alternate Contacts (Optional)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input type="tel" maxLength={10} value={addDriverForm.alternateMobile1} onChange={e => setAddDriverForm({...addDriverForm, alternateMobile1: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="Alternate Phone 1" />
                      </div>
                      <div>
                        <input type="tel" maxLength={10} value={addDriverForm.alternateMobile2} onChange={e => setAddDriverForm({...addDriverForm, alternateMobile2: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="Alternate Phone 2" />
                      </div>
                      <div>
                        <input type="tel" maxLength={10} value={addDriverForm.alternateMobile3} onChange={e => setAddDriverForm({...addDriverForm, alternateMobile3: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="Alternate Phone 3" />
                      </div>
                      <div>
                        <input type="tel" maxLength={10} value={addDriverForm.alternateMobile4} onChange={e => setAddDriverForm({...addDriverForm, alternateMobile4: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="Alternate Phone 4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Uploads */}
                <div>
                  <h4 className="text-sm font-bold border-b pb-2 mb-3 mt-4">Document Uploads</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'photo', label: 'Profile Photo' },
                      { id: 'dlPhoto', label: 'Driving License' },
                      { id: 'panPhoto', label: 'PAN Card' },
                      { id: 'aadharPhoto', label: 'Aadhar Card' }
                    ].map(doc => (
                      <div key={doc.id} className="relative">
                        <input type="file" accept="image/*" id={`admin_${doc.id}`} className="hidden" onChange={e => setAddDriverForm({...addDriverForm, [doc.id]: e.target.files?.[0] || null})} />
                        <label htmlFor={`admin_${doc.id}`} className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-xl cursor-pointer transition ${addDriverForm[doc.id] ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                          <div className="flex flex-col items-center justify-center pt-2 pb-2">
                            <svg className={`w-5 h-5 mb-1 ${addDriverForm[doc.id] ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {addDriverForm[doc.id] ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />}
                            </svg>
                            <p className={`text-[10px] font-bold text-center px-1 ${addDriverForm[doc.id] ? 'text-green-700' : 'text-gray-500'}`}>{doc.label}</p>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="relative">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Police Verification</label>
                      <input type="file" accept="image/*" id="admin_policeVerificationPhoto" className="hidden" onChange={e => setAddDriverForm({...addDriverForm, policeVerificationPhoto: e.target.files?.[0] || null})} />
                      <label htmlFor="admin_policeVerificationPhoto" className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-xl cursor-pointer transition ${addDriverForm.policeVerificationPhoto ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                        <div className="flex flex-col items-center justify-center pt-2 pb-2">
                          <svg className={`w-5 h-5 mb-1 ${addDriverForm.policeVerificationPhoto ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {addDriverForm.policeVerificationPhoto ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />}
                          </svg>
                          <p className={`text-[10px] font-bold ${addDriverForm.policeVerificationPhoto ? 'text-green-700' : 'text-gray-500'}`}>Police Verification</p>
                        </div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Police Verification Expiry</label>
                      <input type="date" value={addDriverForm.policeVerificationExpiryDate} onChange={e => setAddDriverForm({...addDriverForm, policeVerificationExpiryDate: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none h-[calc(100%-1.5rem)]" />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-gray-100">
              <button form="addDriverForm" type="submit" disabled={isSubmitting} className="w-full bg-black text-white font-bold py-2.5 rounded-lg hover:bg-gray-800 transition disabled:opacity-50">
                {isSubmitting ? 'Creating...' : 'Create Driver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedDriver.name}</h2>
                <p className="text-xs text-gray-500">{selectedDriver.phone} · {selectedDriver.licenseNo}</p>
              </div>
              <button onClick={() => setSelectedDriver(null)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Personal Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedDriver.name}</div>
                    <div><span className="font-medium">Phone:</span> {selectedDriver.phone}</div>
                    <div><span className="font-medium">Aadhar No:</span> {selectedDriver.aadharNo}</div>
                    <div><span className="font-medium">Driving License:</span> {selectedDriver.licenseNo}</div>
                    <div><span className="font-medium">DL Expiry:</span> {selectedDriver.licenseExpiryDate ? new Date(selectedDriver.licenseExpiryDate).toLocaleDateString('en-GB') : 'N/A'}</div>
                    <div><span className="font-medium">Police Verif. Expiry:</span> {selectedDriver.policeVerificationExpiryDate ? new Date(selectedDriver.policeVerificationExpiryDate).toLocaleDateString('en-GB') : 'N/A'}</div>
                    <div><span className="font-medium">Current Address:</span> {selectedDriver.currentAddress || 'N/A'}</div>
                    <div><span className="font-medium">Permanent Address:</span> {selectedDriver.permanentAddress || 'N/A'}</div>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mt-4 mb-3">Documents</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Photo', path: selectedDriver.photo },
                      { label: 'DL Photo', path: selectedDriver.dlPhoto },
                      { label: 'PAN Photo', path: selectedDriver.panPhoto },
                      { label: 'Aadhar Photo', path: selectedDriver.aadharPhoto },
                      { label: 'Police Verification', path: selectedDriver.policeVerificationPhoto } // <-- ADDED HERE
                    ].filter(d => d.path).map(doc => (
                      <div key={doc.label} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-900">{doc.label}</span>
                        <button onClick={() => window.open(docUrl(doc.path), '_blank')} className="w-8 h-8 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Contact & Vehicle</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Alt Mobile 1:</span> {selectedDriver.alternateMobile1 || 'N/A'}</div>
                    <div><span className="font-medium">Alt Mobile 2:</span> {selectedDriver.alternateMobile2 || 'N/A'}</div>
                    <div><span className="font-medium">Alt Mobile 3:</span> {selectedDriver.alternateMobile3 || 'N/A'}</div>
                    <div><span className="font-medium">Alt Mobile 4:</span> {selectedDriver.alternateMobile4 || 'N/A'}</div>
                    <div><span className="font-medium">Gpay/PhonePe number:</span> {selectedDriver.gpayNo || selectedDriver.phonepeNo || 'N/A'}</div>
                    <div><span className="font-medium">Package:</span> {selectedDriver.activeSubscription?.plan?.name || 'No Active Package'}</div>
                    <div><span className="font-medium">Total Rides:</span> {selectedDriver.totalRides}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {verifyDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-900">Quarterly Verification</h3>
                <p className="text-xs text-gray-500 mt-0.5">{verifyDriver.name} · {verifyDriver.phone}</p>
              </div>
              <button onClick={() => setVerifyDriver(null)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Status bar */}
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Last Verified</p>
                  <p className="text-sm font-bold">{verifyDriver.lastVerifiedAt ? new Date(verifyDriver.lastVerifiedAt).toLocaleDateString('en-GB') : 'Never'}</p>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div>
                  <p className="text-xs text-gray-500">Next Due</p>
                  <p className="text-sm font-bold">{verifyDriver.nextVerificationDue ? new Date(verifyDriver.nextVerificationDue).toLocaleDateString('en-GB') : '—'}</p>
                </div>
                <div className="ml-auto">
                  <VerificationBadge driver={verifyDriver} onClick={() => {}} />
                </div>
              </div>

              {/* Police Verification Status in Verification Modal */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-500 uppercase">Police Verification Document</p>
                  <span className="text-sm font-bold text-gray-900">
                    {verifyDriver.policeVerificationPhoto ? '✅ Uploaded' : '❌ Not Uploaded'}
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-gray-600 mb-1 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Expiry Date *
                    </label>
                    <input 
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={verifyPoliceExpiry}
                      onChange={e => setVerifyPoliceExpiry(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none shadow-sm"
                    />
                  </div>
                  
                  <div className="flex gap-2 w-full sm:w-auto">
                    {verifyDriver.policeVerificationPhoto && (
                      <div className="flex gap-1.5 flex-1 sm:flex-none">
                        <button 
                          onClick={() => window.open(docUrl(verifyDriver.policeVerificationPhoto), '_blank')}
                          className="flex-1 text-xs bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition font-bold"
                        >
                          View
                        </button>
                        <button 
                          onClick={handleDeletePoliceVerification}
                          className="px-2.5 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition"
                          title="Remove Document"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    )}
                    <div className="relative flex-1 sm:flex-none">
                      <input 
                        type="file" 
                        accept="image/*" 
                        id="updatePoliceVerif" 
                        className="hidden" 
                        onChange={handleUploadPoliceVerification}
                        disabled={isUploadingDoc}
                      />
                      <label 
                        htmlFor="updatePoliceVerif" 
                        className={`flex items-center justify-center gap-1.5 w-full text-xs bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition cursor-pointer font-bold inline-block text-center shadow-md ${isUploadingDoc ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        {isUploadingDoc ? 'Uploading...' : 'Upload New'}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verify form */}
              {showVerifyForm ? (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-gray-700 uppercase">Mark Verification Result</p>
                  <textarea
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-black focus:outline-none"
                    rows={3}
                    placeholder="Notes (optional)"
                    value={verifyNotes}
                    onChange={e => setVerifyNotes(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => submitVerification('PASSED')} disabled={verifySubmitting} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50 transition">
                      {verifySubmitting ? 'Saving...' : '✓ Mark as Passed'}
                    </button>
                    <button onClick={() => submitVerification('FAILED')} disabled={verifySubmitting} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-50 transition">
                      {verifySubmitting ? 'Saving...' : '✗ Mark as Failed'}
                    </button>
                    <button onClick={() => setShowVerifyForm(false)} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowVerifyForm(true)} className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition">
                  Start Verification
                </button>
              )}

              {/* History */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Verification History</p>
                {verifyHistoryLoading ? (
                  <p className="text-xs text-gray-400">Loading...</p>
                ) : verifyHistory.length === 0 ? (
                  <p className="text-xs text-gray-400">No verification history yet</p>
                ) : (
                  <div className="space-y-2">
                    {verifyHistory.map(r => (
                      <div key={r.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${r.status === 'PASSED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {r.status}
                        </span>
                        <div>
                          <p className="text-xs text-gray-500">{new Date(r.verifiedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          {r.notes && <p className="text-xs text-gray-700 mt-0.5">{r.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}