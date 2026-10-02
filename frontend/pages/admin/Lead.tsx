import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig.js';
import { API_BASE_URL } from '../../api/config.js';

const getVerificationStatus = (lead) => {
  if (!lead.lastVerifiedAt) return 'NEVER';
  const due = lead.nextVerificationDue ? new Date(lead.nextVerificationDue) : null;
  if (!due) return 'NEVER';
  const diffDays = Math.ceil((due.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'OVERDUE';
  if (diffDays <= 30) return 'DUE_SOON';
  return 'OK';
};

const VerificationBadge = ({ lead, onClick }) => {
  const s = getVerificationStatus(lead);
  const base = 'text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer transition border shadow-sm active:scale-95';
  if (s === 'NEVER') return <button onClick={onClick} className={`${base} bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200`}>Never Verified</button>;
  if (s === 'OVERDUE') return <button onClick={onClick} className={`${base} bg-red-100 text-red-700 border-red-200 hover:bg-red-200`}>Overdue ▸</button>;
  if (s === 'DUE_SOON') return <button onClick={onClick} className={`${base} bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200`}>Due Soon ▸</button>;
  return <button onClick={onClick} className={`${base} bg-green-100 text-green-700 border-green-200 hover:bg-green-200`}>Verified ▸</button>;
};

export default function Lead() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [verifyFilter, setVerifyFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Verification modal state
  const [verifyLead, setVerifyLead] = useState(null);
  const [verifyHistory, setVerifyHistory] = useState([]);
  const [verifyHistoryLoading, setVerifyHistoryLoading] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [verifyPoliceExpiry, setVerifyPoliceExpiry] = useState('');
  const [verifyLicenseExpiry, setVerifyLicenseExpiry] = useState('');

  // Add lead modal state
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
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
  const [addLeadForm, setAddLeadForm] = useState({
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

  useEffect(() => { 
    fetchLeads(); 
    fetchSubscriptionPlans();
  }, []);

  const fetchSubscriptionPlans = async () => {
    try {
      const res = await apiClient.get('/subscriptions/plans');
      setSubscriptionPlans(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };


  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/leads');
      const data = (res.data || []).map(lead => ({
        ...lead,
        activeSubscription: lead.subscriptions?.find(sub => sub.status === 'ACTIVE'),
      }));
      setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLeadSubmit = async (e) => {
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
        uploadFile(addLeadForm.photo, 'photo'),
        uploadFile(addLeadForm.dlPhoto, 'driving license'),
        uploadFile(addLeadForm.panPhoto, 'PAN card'),
        uploadFile(addLeadForm.aadharPhoto, 'Aadhar card'),
        uploadFile(addLeadForm.policeVerificationPhoto, 'police verification')
      ]);

      const altPhone = [
        addLeadForm.alternateMobile1,
        addLeadForm.alternateMobile2,
        addLeadForm.alternateMobile3,
        addLeadForm.alternateMobile4
      ].filter(phone => phone && phone.trim() !== '');

      const payload = {
        ...addLeadForm,
        altPhone,
        photo: photoUrl,
        dlPhoto: dlPhotoUrl,
        panPhoto: panPhotoUrl,
        aadharPhoto: aadharPhotoUrl,
        policeVerificationPhoto: policeVerificationPhotoUrl,
        gpayNo: addLeadForm.upiId
      };
      
      const response = await apiClient.post('/leads/register', payload);
      if (response.data) {
        setShowAddLeadModal(false);
        setIsSameAddress(false);
        setAddLeadForm({ 
          name: '', phone: '', email: '', password: '', licenseNo: '', licenseExpiryDate: '', aadharNo: '', currentAddress: '', permanentAddress: '', alternateMobile1: '', alternateMobile2: '', alternateMobile3: '', alternateMobile4: '', upiId: '', policeVerificationExpiryDate: '', photo: null, dlPhoto: null, panPhoto: null, aadharPhoto: null, policeVerificationPhoto: null
        });
        fetchLeads();
      }
    } catch (error) {
      console.error('Error adding lead:', error);
      alert(error.message || error.response?.data?.error || 'Failed to add lead. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openVerifyModal = async (lead) => {
    setVerifyLead(lead);
    setShowVerifyForm(false);
    setVerifyNotes('');
    setVerifyHistoryLoading(true);
    setVerifyPoliceExpiry(lead.policeVerificationExpiryDate ? lead.policeVerificationExpiryDate.split('T')[0] : '');
    setVerifyLicenseExpiry(lead.licenseExpiryDate ? lead.licenseExpiryDate.split('T')[0] : '');
    try {
      const res = await apiClient.get(`/admin/verification/${lead.id}/history`);
      setVerifyHistory(res.data?.records || []);
    } catch {
      setVerifyHistory([]);
    } finally {
      setVerifyHistoryLoading(false);
    }
  };

  const submitVerification = async (status) => {
    if (!verifyLead) return;
    setVerifySubmitting(true);
    try {
      await apiClient.post('/admin/verification', {
        entityId: verifyLead.id,
        entityType: 'DRIVER',
        status,
        notes: verifyNotes,
      });
      await fetchLeads();
      const res = await apiClient.get(`/admin/verification/${verifyLead.id}/history`);
      setVerifyHistory(res.data?.records || []);
      const leadsRes = await apiClient.get('/admin/leads');
      const updated = (leadsRes.data || []).find(d => d.id === verifyLead.id);
      if (updated) setVerifyLead({ ...updated, activeSubscription: updated.subscriptions?.find(s => s.status === 'ACTIVE') });
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
    if (!file || !verifyLead) return;
    
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
        const res = await apiClient.put(`/admin/leads/${verifyLead.id}/document`, {
          documentType: 'policeVerificationPhoto',
          documentUrl: url,
          expiryDate: verifyPoliceExpiry
        });
        
        if (res.data.success) {
          const updatedLead = res.data.lead;
          setVerifyLead({ ...verifyLead, policeVerificationPhoto: updatedLead.policeVerificationPhoto, policeVerificationExpiryDate: updatedLead.policeVerificationExpiryDate });
          
          const leadsRes = await apiClient.get('/admin/leads');
          const data = (leadsRes.data || []).map(d => ({
            ...d,
            activeSubscription: d.subscriptions?.find(sub => sub.status === 'ACTIVE'),
          }));
          setLeads(data);
          
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
    if (!file || !verifyLead) return;
    
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
        const res = await apiClient.put(`/admin/leads/${verifyLead.id}/document`, {
          documentType: 'dlPhoto',
          documentUrl: url,
          expiryDate: verifyLicenseExpiry
        });
        
        if (res.data.success) {
          const updatedLead = res.data.lead;
          setVerifyLead({ ...verifyLead, dlPhoto: updatedLead.dlPhoto, licenseExpiryDate: updatedLead.licenseExpiryDate });
          
          const leadsRes = await apiClient.get('/admin/leads');
          const data = (leadsRes.data || []).map(d => ({
            ...d,
            activeSubscription: d.subscriptions?.find(sub => sub.status === 'ACTIVE'),
          }));
          setLeads(data);
          
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
    if (!verifyLead) return;
    if (!window.confirm('Are you sure you want to remove this document?')) return;
    
    try {
      const res = await apiClient.put(`/admin/leads/${verifyLead.id}/document`, {
        documentType: 'policeVerificationPhoto',
        documentUrl: null
      });
      
      if (res.data.success) {
        setVerifyLead({ ...verifyLead, policeVerificationPhoto: null, policeVerificationExpiryDate: null });
        setVerifyPoliceExpiry('');
        
        const leadsRes = await apiClient.get('/admin/leads');
        const data = (leadsRes.data || []).map(d => ({
          ...d,
          activeSubscription: d.subscriptions?.find(sub => sub.status === 'ACTIVE'),
        }));
        setLeads(data);
      }
    } catch (error) {
      console.error('Error removing document:', error);
      alert('Failed to remove document');
    }
  };

  const handleDeleteLicense = async () => {
    if (!verifyLead) return;
    if (!window.confirm('Are you sure you want to remove this document?')) return;
    
    try {
      const res = await apiClient.put(`/admin/leads/${verifyLead.id}/document`, {
        documentType: 'dlPhoto',
        documentUrl: null
      });
      
      if (res.data.success) {
        setVerifyLead({ ...verifyLead, dlPhoto: null, licenseExpiryDate: null });
        setVerifyLicenseExpiry('');
        
        const leadsRes = await apiClient.get('/admin/leads');
        const data = (leadsRes.data || []).map(d => ({
          ...d,
          activeSubscription: d.subscriptions?.find(sub => sub.status === 'ACTIVE'),
        }));
        setLeads(data);
      }
    } catch (error) {
      console.error('Error removing document:', error);
      alert('Failed to remove document');
    }
  };

  const toggleActiveStatus = async (leadId, currentStatus) => {
    try {
      const res = await apiClient.put(`/admin/leads/${leadId}/active`, { isActive: !currentStatus });
      if (res.data.success) fetchLeads();
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  const docUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  };

  const filteredLeads = leads.filter(d => {
    let matchesStatus = true;
    if (verifyFilter !== 'ALL') {
      matchesStatus = getVerificationStatus(d) === verifyFilter;
    }

    let matchesSearch = true;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const leadIdFormatted = `drv-${d.leadNo ? d.leadNo.toString().padStart(4, '0') : 'xxxx'}`;
      matchesSearch = 
        (d.phone && d.phone.toLowerCase().includes(q)) ||
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.id && d.id.toLowerCase().includes(q)) ||
        leadIdFormatted.includes(q) ||
        (d.leadNo && d.leadNo.toString().includes(q));
    }

    return matchesStatus && matchesSearch;
  });

  const filterCounts = {
    ALL: leads.length,
    OVERDUE: leads.filter(d => getVerificationStatus(d) === 'OVERDUE').length,
    DUE_SOON: leads.filter(d => getVerificationStatus(d) === 'DUE_SOON').length,
    NEVER: leads.filter(d => getVerificationStatus(d) === 'NEVER').length,
    OK: leads.filter(d => getVerificationStatus(d) === 'OK').length,
  };

  if (loading) return <div className="px-6 py-6 flex items-center justify-center"><div className="text-gray-500">Loading leads...</div></div>;

  const handleUpdatePackageSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingPackage(true);
    try {
      if (!updatePackageForm.planId || !updatePackageForm.paidAmount) {
        throw new Error('Please select a plan and enter the paid amount.');
      }
      const response = await apiClient.post('/subscriptions/admin/create', {
        leadId: selectedLead.id,
        planId: updatePackageForm.planId,
        paidAmount: parseFloat(updatePackageForm.paidAmount),
        paymentMethod: 'CASH'
      });
      if (response.data.success) {
        setShowUpdatePackageModal(false);
        fetchLeads(); // Refresh leads list
        // Update selectedLead locally so modal reflects changes immediately
        setSelectedLead(prev => ({
          ...prev,
          activeSubscription: response.data.subscription,
          subscriptions: [...(prev.subscriptions || []), response.data.subscription]
        }));
      }
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to update package');
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
      await apiClient.put(`/admin/leads/${selectedLead.id}/password`, { password: newPassword });
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
        <h2 className="text-xl font-bold text-gray-900">All Leads</h2>
        <button 
          onClick={() => setShowAddLeadModal(true)} 
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-gray-800 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Lead
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

      {filteredLeads.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500 text-sm">No leads found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">S.No</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Lead ID</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Phone</th>


                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Verification</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Active</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeads.map((lead, index) => {
                  const vs = getVerificationStatus(lead);
                  const rowBg = vs === 'OVERDUE' ? 'bg-red-50 hover:bg-red-100' : vs === 'DUE_SOON' ? 'bg-yellow-50 hover:bg-yellow-100' : vs === 'NEVER' ? 'bg-gray-50 hover:bg-gray-100' : 'bg-green-50 hover:bg-green-100';
                  return (
                  <tr key={lead.id} className={`${rowBg} transition`}>
                    <td className="px-3 py-3"><p className="text-xs font-bold text-gray-900">{index + 1}</p></td>
                    <td className="px-3 py-3">
                      <p className="text-xs font-bold text-gray-900">
                        DRV-{lead.leadNo ? lead.leadNo.toString().padStart(4, '0') : 'XXXX'}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-[10px]">
                          {lead.name ? lead.name[0] : 'D'}
                        </div>
                        <p className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{lead.name}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3"><p className="text-xs text-gray-700">{lead.phone}</p></td>


                    <td className="px-3 py-3">
                      <VerificationBadge lead={lead} onClick={() => openVerifyModal(lead)} />
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => toggleActiveStatus(lead.id, lead.isActive)}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold transition ${lead.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      >
                        {lead.isActive ? 'Active' : 'Deactive'}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => setSelectedLead(lead)}
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

      {/* Add Lead Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Add New Lead</h3>
              <button onClick={() => setShowAddLeadModal(false)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto p-5 flex-grow custom-scrollbar">
              <form id="addLeadForm" onSubmit={handleAddLeadSubmit} className="space-y-6">
                
                {/* Personal Details */}
                <div>
                  <h4 className="text-sm font-bold border-b pb-2 mb-3">Personal Details</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                      <input required type="text" value={addLeadForm.name} onChange={e => setAddLeadForm({...addLeadForm, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="Enter full name" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                      <input type="email" value={addLeadForm.email} onChange={e => setAddLeadForm({...addLeadForm, email: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="Optional email" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Primary Phone *</label>
                      <input required type="tel" maxLength={10} value={addLeadForm.phone} onChange={e => setAddLeadForm({...addLeadForm, phone: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="10-digit number" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Initial Password *</label>
                      <input required type="text" value={addLeadForm.password} onChange={e => setAddLeadForm({...addLeadForm, password: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="Set a password" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Permanent Address *</label>
                    <textarea 
                      required 
                      value={addLeadForm.permanentAddress} 
                      onChange={e => {
                        const newAddress = e.target.value;
                        if (isSameAddress) {
                          setAddLeadForm({...addLeadForm, permanentAddress: newAddress, currentAddress: newAddress});
                        } else {
                          setAddLeadForm({...addLeadForm, permanentAddress: newAddress});
                        }
                      }} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none resize-none" 
                      rows={2} 
                      placeholder="Lead's permanent address"
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
                          setAddLeadForm({...addLeadForm, currentAddress: addLeadForm.permanentAddress});
                        } else {
                          setAddLeadForm({...addLeadForm, currentAddress: ''});
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
                        value={addLeadForm.currentAddress} 
                        onChange={e => setAddLeadForm({...addLeadForm, currentAddress: e.target.value})} 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none resize-none" 
                        rows={2} 
                        placeholder="Lead's current address"
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
                      <input required type="text" value={addLeadForm.licenseNo} onChange={e => setAddLeadForm({...addLeadForm, licenseNo: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="DL Number" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">License Expiry *</label>
                      <input required type="date" value={addLeadForm.licenseExpiryDate} onChange={e => setAddLeadForm({...addLeadForm, licenseExpiryDate: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Aadhar Number *</label>
                      <input required type="text" maxLength={12} value={addLeadForm.aadharNo} onChange={e => setAddLeadForm({...addLeadForm, aadharNo: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="12-digit Aadhar" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">UPI ID (Optional)</label>
                      <input type="text" value={addLeadForm.upiId} onChange={e => setAddLeadForm({...addLeadForm, upiId: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="GPay / PhonePe" />
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Alternate Contacts (Optional)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input type="tel" maxLength={10} value={addLeadForm.alternateMobile1} onChange={e => setAddLeadForm({...addLeadForm, alternateMobile1: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="Alternate Phone 1" />
                      </div>
                      <div>
                        <input type="tel" maxLength={10} value={addLeadForm.alternateMobile2} onChange={e => setAddLeadForm({...addLeadForm, alternateMobile2: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="Alternate Phone 2" />
                      </div>
                      <div>
                        <input type="tel" maxLength={10} value={addLeadForm.alternateMobile3} onChange={e => setAddLeadForm({...addLeadForm, alternateMobile3: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="Alternate Phone 3" />
                      </div>
                      <div>
                        <input type="tel" maxLength={10} value={addLeadForm.alternateMobile4} onChange={e => setAddLeadForm({...addLeadForm, alternateMobile4: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="Alternate Phone 4" />
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
                        <input type="file" accept="image/*" id={`admin_${doc.id}`} className="hidden" onChange={e => setAddLeadForm({...addLeadForm, [doc.id]: e.target.files?.[0] || null})} />
                        <label htmlFor={`admin_${doc.id}`} className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-xl cursor-pointer transition ${addLeadForm[doc.id] ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                          <div className="flex flex-col items-center justify-center pt-2 pb-2">
                            <svg className={`w-5 h-5 mb-1 ${addLeadForm[doc.id] ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {addLeadForm[doc.id] ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />}
                            </svg>
                            <p className={`text-[10px] font-bold text-center px-1 ${addLeadForm[doc.id] ? 'text-green-700' : 'text-gray-500'}`}>{doc.label}</p>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="relative">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Police Verification</label>
                      <input type="file" accept="image/*" id="admin_policeVerificationPhoto" className="hidden" onChange={e => setAddLeadForm({...addLeadForm, policeVerificationPhoto: e.target.files?.[0] || null})} />
                      <label htmlFor="admin_policeVerificationPhoto" className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-xl cursor-pointer transition ${addLeadForm.policeVerificationPhoto ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                        <div className="flex flex-col items-center justify-center pt-2 pb-2">
                          <svg className={`w-5 h-5 mb-1 ${addLeadForm.policeVerificationPhoto ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {addLeadForm.policeVerificationPhoto ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />}
                          </svg>
                          <p className={`text-[10px] font-bold ${addLeadForm.policeVerificationPhoto ? 'text-green-700' : 'text-gray-500'}`}>Police Verification</p>
                        </div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Police Verification Expiry</label>
                      <input type="date" value={addLeadForm.policeVerificationExpiryDate} onChange={e => setAddLeadForm({...addLeadForm, policeVerificationExpiryDate: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none h-[calc(100%-1.5rem)]" />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-gray-100">
              <button form="addLeadForm" type="submit" disabled={isSubmitting} className="w-full bg-black text-white font-bold py-2.5 rounded-lg hover:bg-gray-800 transition disabled:opacity-50">
                {isSubmitting ? 'Creating...' : 'Create Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedLead.name}</h2>
                <p className="text-xs text-gray-500">{selectedLead.phone} · {selectedLead.licenseNo}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowPasswordModal(true)} className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition">
                  Change Password
                </button>
                <button onClick={() => setSelectedLead(null)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Personal Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedLead.name}</div>
                    <div><span className="font-medium">Phone:</span> {selectedLead.phone}</div>
                    <div><span className="font-medium">Aadhar No:</span> {selectedLead.aadharNo}</div>
                    <div><span className="font-medium">Driving License:</span> {selectedLead.licenseNo}</div>
                    <div><span className="font-medium">DL Expiry:</span> {selectedLead.licenseExpiryDate ? new Date(selectedLead.licenseExpiryDate).toLocaleDateString('en-GB') : 'N/A'}</div>
                    <div><span className="font-medium">Police Verif. Expiry:</span> {selectedLead.policeVerificationExpiryDate ? new Date(selectedLead.policeVerificationExpiryDate).toLocaleDateString('en-GB') : 'N/A'}</div>
                    <div><span className="font-medium">Current Address:</span> {selectedLead.currentAddress || 'N/A'}</div>
                    <div><span className="font-medium">Permanent Address:</span> {selectedLead.permanentAddress || 'N/A'}</div>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mt-4 mb-3">Documents</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Photo', path: selectedLead.photo },
                      { label: 'DL Photo', path: selectedLead.dlPhoto },
                      { label: 'PAN Photo', path: selectedLead.panPhoto },
                      { label: 'Aadhar Photo', path: selectedLead.aadharPhoto },
                      { label: 'MSME', path: selectedLead?.msmePhoto },
{ label: 'Ration Card', path: selectedLead?.rationCardPhoto },
{ label: 'Police Verification', path: selectedLead?.policeVerificationPhoto },
{ label: 'Electricity Bill', path: selectedLead?.electricityBillPhoto },
{ label: 'Rental Agreement', path: selectedLead?.rentalAgreementPhoto },
{ label: 'Credit Card', path: selectedLead?.creditCardPhoto },
{ label: 'Debit Card', path: selectedLead?.debitCardPhoto } // <-- ADDED HERE
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
                    <div><span className="font-medium">Alt Mobile 1:</span> {selectedLead.alternateMobile1 || 'N/A'}</div>
                    <div><span className="font-medium">Alt Mobile 2:</span> {selectedLead.alternateMobile2 || 'N/A'}</div>
                    <div><span className="font-medium">Alt Mobile 3:</span> {selectedLead.alternateMobile3 || 'N/A'}</div>
                    <div><span className="font-medium">Alt Mobile 4:</span> {selectedLead.alternateMobile4 || 'N/A'}</div>
                    <div><span className="font-medium">Gpay/PhonePe number:</span> {selectedLead.gpayNo || selectedLead.phonepeNo || 'N/A'}</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">Package:</span> 
                      <span className="flex-1 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">{selectedLead.activeSubscription?.plan?.name || 'No Active Package'}</span>
                      <button onClick={() => {
                        setUpdatePackageForm({ planId: '', paidAmount: '' });
                        setShowUpdatePackageModal(true);
                      }} className="bg-black text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-gray-800 transition shadow-sm ml-auto">
                        Update
                      </button>
                    </div>
                    <div><span className="font-medium">Total Rides:</span> {selectedLead.totalRides}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Package Modal */}
      {showUpdatePackageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">Update Package</h3>
              <button onClick={() => setShowUpdatePackageModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleUpdatePackageSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Package</label>
                <select 
                  value={updatePackageForm.planId}
                  onChange={(e) => setUpdatePackageForm({...updatePackageForm, planId: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  required
                >
                  <option value="">-- Choose Package --</option>
                  {subscriptionPlans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name} - ₹{plan.price}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Paid Amount (₹)</label>
                <input 
                  type="number"
                  min="0"
                  value={updatePackageForm.paidAmount}
                  onChange={(e) => setUpdatePackageForm({...updatePackageForm, paidAmount: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="e.g. 500"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isUpdatingPackage}
                className="w-full py-2 bg-black text-white rounded-lg font-bold text-sm hover:bg-gray-800 disabled:opacity-50 transition"
              >
                {isUpdatingPackage ? 'Updating...' : 'Confirm Update'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {verifyLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-900">Quarterly Verification</h3>
                <p className="text-xs text-gray-500 mt-0.5">{verifyLead.name} · {verifyLead.phone}</p>
              </div>
              <button onClick={() => setVerifyLead(null)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Status bar */}
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Last Verified</p>
                  <p className="text-sm font-bold">{verifyLead.lastVerifiedAt ? new Date(verifyLead.lastVerifiedAt).toLocaleDateString('en-GB') : 'Never'}</p>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div>
                  <p className="text-xs text-gray-500">Next Due</p>
                  <p className="text-sm font-bold">{verifyLead.nextVerificationDue ? new Date(verifyLead.nextVerificationDue).toLocaleDateString('en-GB') : '—'}</p>
                </div>
                <div className="ml-auto">
                  <VerificationBadge lead={verifyLead} onClick={() => {}} />
                </div>
              </div>

              {/* Driving License Status in Verification Modal */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-500 uppercase">Driving License Document</p>
                  <span className="text-sm font-bold text-gray-900">
                    {verifyLead.dlPhoto ? '✅ Uploaded' : '❌ Not Uploaded'}
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
                      value={verifyLicenseExpiry}
                      onChange={e => setVerifyLicenseExpiry(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none shadow-sm"
                    />
                  </div>
                  
                  <div className="flex gap-2 w-full sm:w-auto">
                    {verifyLead.dlPhoto && (
                      <div className="flex gap-1.5 flex-1 sm:flex-none">
                        <button 
                          onClick={() => window.open(docUrl(verifyLead.dlPhoto), '_blank')}
                          className="flex-1 text-xs bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition font-bold"
                        >
                          View
                        </button>
                        <button 
                          onClick={handleDeleteLicense}
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
                        id="updateLicense" 
                        className="hidden" 
                        onChange={handleUploadLicense}
                        disabled={isUploadingDoc}
                      />
                      <label 
                        htmlFor="updateLicense" 
                        className={`flex items-center justify-center gap-1.5 w-full text-xs bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition cursor-pointer font-bold inline-block text-center shadow-md ${isUploadingDoc ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        {isUploadingDoc ? 'Uploading...' : 'Upload New'}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Police Verification Status in Verification Modal */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-500 uppercase">Police Verification Document</p>
                  <span className="text-sm font-bold text-gray-900">
                    {verifyLead.policeVerificationPhoto ? '✅ Uploaded' : '❌ Not Uploaded'}
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
                    {verifyLead.policeVerificationPhoto && (
                      <div className="flex gap-1.5 flex-1 sm:flex-none">
                        <button 
                          onClick={() => window.open(docUrl(verifyLead.policeVerificationPhoto), '_blank')}
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
      {/* Password Modal */}
      {showPasswordModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleChangePasswordSubmit} className="p-5">
              <p className="text-xs text-gray-500 mb-4">Set a new password for lead: <span className="font-bold">{selectedLead.name}</span></p>
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