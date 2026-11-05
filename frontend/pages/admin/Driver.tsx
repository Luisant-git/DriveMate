import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig.js';
import { API_BASE_URL } from '../../api/config.js';
import UberDriverDetailsModal from '../../components/admin/UberDriverDetailsModal';
import UberPackageUpdateModal from '../../components/admin/UberPackageUpdateModal';

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

// Read-only version of the badge for the verification modal (no fake ▶ button).
const verificationTone = (driver) => {
  const s = getVerificationStatus(driver);
  if (s === 'NEVER') return { label: 'Never Verified', cls: 'bg-gray-100 text-gray-600 border-gray-200' };
  if (s === 'OVERDUE') return { label: 'Overdue', cls: 'bg-red-50 text-red-700 border-red-200' };
  if (s === 'DUE_SOON') return { label: 'Due Soon', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
  return { label: 'Verified', cls: 'bg-green-50 text-green-700 border-green-200' };
};

export default function Driver() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [verifyFilter, setVerifyFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Verification modal state
  const [verifyDriver, setVerifyDriver] = useState(null);
  const [verifyHistory, setVerifyHistory] = useState([]);
  const [verifyHistoryLoading, setVerifyHistoryLoading] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [verifyPoliceExpiry, setVerifyPoliceExpiry] = useState('');
  const [verifyPoliceNo, setVerifyPoliceNo] = useState('');
  const [verifyLicenseExpiry, setVerifyLicenseExpiry] = useState('');

  // Add driver modal state
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [showUpdatePackageModal, setShowUpdatePackageModal] = useState(false);
  
  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [updatePackageForm, setUpdatePackageForm] = useState({ planId: '', paidAmount: '' });
  const [isUpdatingPackage, setIsUpdatingPackage] = useState(false);
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
    policeVerificationNo: '',
    photo: null,
    dlPhoto: null,
    panPhoto: null,
    aadharPhoto: null,
    policeVerificationPhoto: null
  });

  useEffect(() => { 
    fetchDrivers(); 
    fetchSubscriptionPlans();
  }, []);

  const fetchSubscriptionPlans = async () => {
    try {
      const res = await apiClient.get('/subscriptions/plans');
      const plans = Array.isArray(res.data) ? res.data : (res.data?.plans || res.data?.data || []);
      setSubscriptionPlans(plans);
    } catch (e) {
      console.error('Failed to fetch subscription plans:', e);
      setSubscriptionPlans([]);
    }
  };


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
          name: '', phone: '', email: '', password: '', licenseNo: '', licenseExpiryDate: '', aadharNo: '', currentAddress: '', permanentAddress: '', alternateMobile1: '', alternateMobile2: '', alternateMobile3: '', alternateMobile4: '', upiId: '', policeVerificationExpiryDate: '', policeVerificationNo: '', photo: null, dlPhoto: null, panPhoto: null, aadharPhoto: null, policeVerificationPhoto: null
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
    setVerifyPoliceNo(driver.policeVerificationNo || '');
    setVerifyLicenseExpiry(driver.licenseExpiryDate ? driver.licenseExpiryDate.split('T')[0] : '');
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

  
  const handleSavePoliceCertificateNo = async () => {
    if (!verifyDriver) return;
    try {
      const res = await apiClient.put(`/admin/drivers/${verifyDriver.id}/document`, {
        documentType: 'policeVerificationPhoto',
        documentUrl: verifyDriver.policeVerificationPhoto,
        expiryDate: verifyPoliceExpiry || verifyDriver.policeVerificationExpiryDate,
        certificateNo: verifyPoliceNo
      });
      if (res.data?.success) {
        setVerifyDriver({ ...verifyDriver, policeVerificationNo: verifyPoliceNo });
        const driversRes = await apiClient.get('/admin/drivers');
        const data = (driversRes.data || []).map(d => ({
          ...d,
          activeSubscription: d.subscriptions?.find(sub => sub.status === 'ACTIVE'),
        }));
        setDrivers(data);
        alert('Police Verification Certificate No saved successfully!');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save certificate number');
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
          expiryDate: verifyPoliceExpiry,
          certificateNo: verifyPoliceNo
        });
        
        if (res.data.success) {
          const updatedDriver = res.data.driver;
          setVerifyDriver({ ...verifyDriver, policeVerificationPhoto: updatedDriver.policeVerificationPhoto, policeVerificationExpiryDate: updatedDriver.policeVerificationExpiryDate, policeVerificationNo: updatedDriver.policeVerificationNo || verifyPoliceNo });
          
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

  const handleUploadLicense = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !verifyDriver) return;
    
    if (!verifyLicenseExpiry) {
      alert('Please select an expiry date for the document.');
      e.target.value = '';
      return;
    }
    const expiryDateObj = new Date(verifyLicenseExpiry);
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
          documentType: 'dlPhoto',
          documentUrl: url,
          expiryDate: verifyLicenseExpiry
        });
        
        if (res.data.success) {
          const updatedDriver = res.data.driver;
          setVerifyDriver({ ...verifyDriver, dlPhoto: updatedDriver.dlPhoto, licenseExpiryDate: updatedDriver.licenseExpiryDate });
          
          const driversRes = await apiClient.get('/admin/drivers');
          const data = (driversRes.data || []).map(d => ({
            ...d,
            activeSubscription: d.subscriptions?.find(sub => sub.status === 'ACTIVE'),
          }));
          setDrivers(data);
          
          alert('Driving License uploaded successfully!');
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
        setVerifyDriver({ ...verifyDriver, policeVerificationPhoto: null, policeVerificationExpiryDate: null });
        setVerifyPoliceExpiry('');
        
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

  const handleDeleteLicense = async () => {
    if (!verifyDriver) return;
    if (!window.confirm('Are you sure you want to remove this document?')) return;
    
    try {
      const res = await apiClient.put(`/admin/drivers/${verifyDriver.id}/document`, {
        documentType: 'dlPhoto',
        documentUrl: null
      });
      
      if (res.data.success) {
        setVerifyDriver({ ...verifyDriver, dlPhoto: null, licenseExpiryDate: null });
        setVerifyLicenseExpiry('');
        
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

  const togglePayLater = async (driverId, currentValue) => {
    try {
      const res = await apiClient.put(`/admin/drivers/${driverId}/pay-later`, { payLaterAllowed: !currentValue });
      if (res.data.success) fetchDrivers();
    } catch (error) {
      console.error('Error toggling pay later permission:', error);
    }
  };

  const docUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  };

  const filteredDrivers = drivers.filter(d => {
    let matchesStatus = true;
    if (verifyFilter !== 'ALL') {
      matchesStatus = getVerificationStatus(d) === verifyFilter;
    }

    let matchesSearch = true;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const driverIdFormatted = `drv-${d.driverNo ? d.driverNo.toString().padStart(4, '0') : 'xxxx'}`;
      matchesSearch = 
        (d.phone && d.phone.toLowerCase().includes(q)) ||
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.id && d.id.toLowerCase().includes(q)) ||
        driverIdFormatted.includes(q) ||
        (d.driverNo && d.driverNo.toString().includes(q));
    }

    return matchesStatus && matchesSearch;
  });

  const filterCounts = {
    ALL: drivers.length,
    OVERDUE: drivers.filter(d => getVerificationStatus(d) === 'OVERDUE').length,
    DUE_SOON: drivers.filter(d => getVerificationStatus(d) === 'DUE_SOON').length,
    NEVER: drivers.filter(d => getVerificationStatus(d) === 'NEVER').length,
    OK: drivers.filter(d => getVerificationStatus(d) === 'OK').length,
  };

  if (loading) return <div className="px-6 py-6 flex items-center justify-center"><div className="text-gray-500">Loading drivers...</div></div>;

  const handleUpdatePackageSubmit = async ({ planId, paidAmount, paymentMethod }: { planId: string; paidAmount: number; paymentMethod: string }) => {
    setIsUpdatingPackage(true);
    try {
      if (!planId || !paidAmount) {
        throw new Error('Please select a plan and enter the paid amount.');
      }
      const response = await apiClient.post('/subscriptions/admin/create', {
        driverId: selectedDriver.id,
        planId,
        paidAmount,
        paymentMethod: paymentMethod || 'CASH'
      });
      if (response.data.success) {
        setShowUpdatePackageModal(false);
        fetchDrivers(); // Refresh drivers list
        // Update selectedDriver locally so modal reflects changes immediately
        setSelectedDriver(prev => ({
          ...prev,
          activeSubscription: response.data.subscription,
          subscriptions: [...(prev.subscriptions || []), response.data.subscription]
        }));
        alert('Driver package updated successfully!');
      }
    } catch (error: any) {
      alert(error.response?.data?.error || error.message || 'Failed to update package');
      throw error;
    } finally {
      setIsUpdatingPackage(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    setIsChangingPassword(true);
    try {
      await apiClient.put(`/admin/drivers/${selectedDriver.id}/password`, { password: newPassword });
      alert('Password changed successfully');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'ALL', label: 'All' },
          /* { key: 'OVERDUE', label: 'Overdue' },
          { key: 'DUE_SOON', label: 'Due Soon' }, */
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
        
        <div className="w-full sm:w-64">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search by name, phone or ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black transition shadow-sm"
            />
          </div>
        </div>
      </div>

      {filteredDrivers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500 text-sm">No drivers found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">S.No</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Driver ID</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Phone</th>


                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Verification</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Active</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pay Later</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDrivers.map((driver, index) => {
                  const vs = getVerificationStatus(driver);
                  const rowBg = vs === 'OVERDUE' ? 'bg-red-50 hover:bg-red-100' : vs === 'DUE_SOON' ? 'bg-yellow-50 hover:bg-yellow-100' : vs === 'NEVER' ? 'bg-gray-50 hover:bg-gray-100' : 'bg-green-50 hover:bg-green-100';
                  return (
                  <tr key={driver.id} className={`${rowBg} transition`}>
                    <td className="px-3 py-3"><p className="text-xs font-bold text-gray-900">{index + 1}</p></td>
                    <td className="px-3 py-3">
                      <p className="text-xs font-bold text-gray-900">
                        DRV-{driver.driverNo ? driver.driverNo.toString().padStart(4, '0') : 'XXXX'}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-[10px]">
                          {driver.name ? driver.name[0] : 'D'}
                        </div>
                        <p className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{driver.name}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3"><p className="text-xs text-gray-700">{driver.phone}</p></td>


                    <td className="px-3 py-3">
                      <VerificationBadge driver={driver} onClick={() => openVerifyModal(driver)} />
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => toggleActiveStatus(driver.id, driver.isActive)}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold transition ${driver.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      >
                        {driver.isActive ? 'Active' : 'Deactive'}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => togglePayLater(driver.id, driver.payLaterAllowed)}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold transition ${driver.payLaterAllowed ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {driver.payLaterAllowed ? 'Allowed' : 'Blocked'}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => setSelectedDriver(driver)}
                        className="w-7 h-7 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center"
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
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Police Verif. Certificate No</label>
                      <input 
                        type="text" 
                        value={addDriverForm.policeVerificationNo || ''} 
                        onChange={e => setAddDriverForm({...addDriverForm, policeVerificationNo: e.target.value})} 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none font-mono" 
                        placeholder="e.g. POL-VER-2026-XXXX" 
                      />
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

      {/* Uber Driver Details Modal */}
      {selectedDriver && (
        <UberDriverDetailsModal
          driver={selectedDriver}
          onClose={() => setSelectedDriver(null)}
          onOpenUpdatePackage={() => setShowUpdatePackageModal(true)}
          onOpenChangePassword={() => setShowPasswordModal(true)}
          docUrl={docUrl}
        />
      )}

      {/* Uber Update Package Modal */}
      {showUpdatePackageModal && selectedDriver && (
        <UberPackageUpdateModal
          isOpen={showUpdatePackageModal}
          onClose={() => setShowUpdatePackageModal(false)}
          entityName={selectedDriver.name}
          entityIdentifier={`DRV-${selectedDriver.driverNo ? selectedDriver.driverNo.toString().padStart(4, '0') : selectedDriver.id.slice(-6).toUpperCase()}`}
          currentPackageName={selectedDriver.activeSubscription?.plan?.name}
          subscriptionPlans={subscriptionPlans}
          onSubmit={handleUpdatePackageSubmit}
          isLoading={isUpdatingPackage}
        />
      )}

      {/* Verification Modal */}
      {verifyDriver && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
          <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Quarterly Verification</p>
                <p className="truncate text-sm font-bold text-gray-900">{verifyDriver.name}</p>
                <p className="text-[11px] text-gray-500">{verifyDriver.phone}</p>
              </div>
              <button onClick={() => setVerifyDriver(null)} aria-label="Close" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 transition hover:bg-gray-200">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
              {/* Status summary — static chip, nothing clickable */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Last Verified</p>
                  <p className="text-sm font-bold text-gray-900">{verifyDriver.lastVerifiedAt ? new Date(verifyDriver.lastVerifiedAt).toLocaleDateString('en-GB') : 'Never'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Next Due</p>
                  <p className="text-sm font-bold text-gray-900">{verifyDriver.nextVerificationDue ? new Date(verifyDriver.nextVerificationDue).toLocaleDateString('en-GB') : '—'}</p>
                </div>
                <span className={`ml-auto shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${verificationTone(verifyDriver).cls}`}>
                  {verificationTone(verifyDriver).label}
                </span>
              </div>

              {/* Driving License */}
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-900">Driving License</p>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${verifyDriver.dlPhoto ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {verifyDriver.dlPhoto ? 'Uploaded' : 'Not uploaded'}
                  </span>
                </div>
                
                <div className="space-y-2.5 p-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Expiry Date *</label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={verifyLicenseExpiry}
                      onChange={e => setVerifyLicenseExpiry(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(docUrl(verifyDriver.dlPhoto), '_blank')}
                      disabled={!verifyDriver.dlPhoto}
                      className="flex-1 rounded-lg bg-gray-100 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      View
                    </button>
                    <div className="flex-1">
                      <input type="file" accept="image/*" id="updateLicense" className="hidden" onChange={handleUploadLicense} disabled={isUploadingDoc} />
                      <label htmlFor="updateLicense" className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-black py-2 text-xs font-bold text-white transition hover:bg-gray-800 ${isUploadingDoc ? 'cursor-not-allowed opacity-50' : ''}`}>
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        {isUploadingDoc ? 'Uploading...' : 'Upload New'}
                      </label>
                    </div>
                    {verifyDriver.dlPhoto && (
                      <button onClick={handleDeleteLicense} title="Remove document" className="flex w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Police Verification */}
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-900">Police Verification</p>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${verifyDriver.policeVerificationPhoto ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {verifyDriver.policeVerificationPhoto ? 'Uploaded' : 'Not uploaded'}
                  </span>
                </div>
                
                <div className="space-y-2.5 p-3">
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Expiry Date *</label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={verifyPoliceExpiry}
                        onChange={e => setVerifyPoliceExpiry(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Certificate No</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={verifyPoliceNo}
                          onChange={e => setVerifyPoliceNo(e.target.value)}
                          placeholder="POL-VER-2026-XXXX"
                          className="w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-black"
                        />
                        <button
                          type="button"
                          onClick={handleSavePoliceCertificateNo}
                          title="Save Certificate Number"
                          className="shrink-0 rounded-lg bg-gray-900 px-2.5 text-[11px] font-bold text-white transition hover:bg-black"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(docUrl(verifyDriver.policeVerificationPhoto), '_blank')}
                      disabled={!verifyDriver.policeVerificationPhoto}
                      className="flex-1 rounded-lg bg-gray-100 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      View
                    </button>
                    <div className="flex-1">
                      <input type="file" accept="image/*" id="updatePoliceVerif" className="hidden" onChange={handleUploadPoliceVerification} disabled={isUploadingDoc} />
                      <label htmlFor="updatePoliceVerif" className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-black py-2 text-xs font-bold text-white transition hover:bg-gray-800 ${isUploadingDoc ? 'cursor-not-allowed opacity-50' : ''}`}>
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        {isUploadingDoc ? 'Uploading...' : 'Upload New'}
                      </label>
                    </div>
                    {verifyDriver.policeVerificationPhoto && (
                      <button onClick={handleDeletePoliceVerification} title="Remove document" className="flex w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Verify result */}
              {showVerifyForm ? (
                <div className="space-y-2.5 rounded-xl border border-gray-200 p-3">
                  <p className="text-[10px] font-bold uppercase text-gray-500">Mark Verification Result</p>
                  <textarea
                    className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm outline-none focus:ring-2 focus:ring-black"
                    rows={3}
                    placeholder="Notes (optional)"
                    value={verifyNotes}
                    onChange={e => setVerifyNotes(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => submitVerification('PASSED')} disabled={verifySubmitting} className="min-w-[110px] flex-1 rounded-lg bg-green-600 py-2 text-xs font-bold text-white transition hover:bg-green-700 disabled:opacity-50">
                      {verifySubmitting ? 'Saving...' : '✓ Mark as Passed'}
                    </button>
                    <button onClick={() => submitVerification('FAILED')} disabled={verifySubmitting} className="min-w-[110px] flex-1 rounded-lg bg-red-600 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50">
                      {verifySubmitting ? 'Saving...' : '✗ Mark as Failed'}
                    </button>
                    <button onClick={() => setShowVerifyForm(false)} className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-200">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowVerifyForm(true)} className="w-full rounded-xl bg-black py-2.5 text-sm font-bold text-white transition hover:bg-gray-800">
                  Start Verification
                </button>
              )}

              {/* History */}
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase text-gray-500">Verification History</p>
                {verifyHistoryLoading ? (
                  <p className="text-xs text-gray-400">Loading...</p>
                ) : verifyHistory.length === 0 ? (
                  <p className="text-xs text-gray-400">No verification history yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {verifyHistory.map(r => (
                      <div key={r.id} className="flex items-start gap-2 rounded-lg bg-gray-50 px-2.5 py-2">
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${r.status === 'PASSED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {r.status}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-gray-700">
                            {new Date(r.verifiedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          {r.notes && <p className="break-words text-[11px] text-gray-500">{r.notes}</p>}
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
      {/* Password Modal */}
      {showPasswordModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleChangePasswordSubmit} className="p-5">
              <p className="text-xs text-gray-500 mb-4">Set a new password for driver: <span className="font-bold">{selectedDriver.name}</span></p>
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">New Password</label>
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none transition"
                  placeholder="Enter new password"
                  minLength={6}
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Confirm Password</label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none transition"
                  placeholder="Re-enter new password"
                  minLength={6}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                  Cancel
                </button>
                <button type="submit" disabled={isChangingPassword} className="px-4 py-2 text-sm font-bold text-white bg-black hover:bg-gray-800 rounded-lg transition disabled:opacity-50">
                  {isChangingPassword ? 'Saving...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}