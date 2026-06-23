import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig.js';
import { API_BASE_URL } from '../../api/config.js';

const docUrl = (path: string) => path ? (path.startsWith('http') ? path : `${API_BASE_URL}${path}`) : '';

type TabType = 'DRIVER' | 'LEAD';

interface OverdueEntity {
  id: string;
  name: string;
  phone: string;
  licenseNo: string;
  lastVerifiedAt?: string;
  nextVerificationDue?: string;
  licenseExpiryDate?: string;
  policeVerificationExpiryDate?: string;
  isActive: boolean;
}

const getOverdueDays = (nextDue?: string) => {
  if (!nextDue) return 0;
  const due = new Date(nextDue);
  const now = new Date();
  const diffDays = Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const isDocumentExpiring = (dateString?: string) => {
  if (!dateString) return true; // Missing is considered expiring/expired
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return new Date(dateString).getTime() <= thirtyDaysFromNow.getTime();
};

export default function OverdueReport() {
  const [tab, setTab] = useState<TabType>('DRIVER');
  const [drivers, setDrivers] = useState<OverdueEntity[]>([]);
  const [leads, setLeads] = useState<OverdueEntity[]>([]);
  const [loading, setLoading] = useState(true);

  // Verification Modal State
  const [verifyDriver, setVerifyDriver] = useState<OverdueEntity | null>(null);
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifyHistory, setVerifyHistory] = useState<any[]>([]);
  const [verifyHistoryLoading, setVerifyHistoryLoading] = useState(false);
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [verifyPoliceExpiry, setVerifyPoliceExpiry] = useState('');
  const [verifyLicenseExpiry, setVerifyLicenseExpiry] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dRes, lRes] = await Promise.all([
        apiClient.get('/admin/drivers'),
        apiClient.get('/admin/leads'),
      ]);
      
      const allDrivers = dRes.data || [];
      const allLeads = lRes.data?.leads || [];

      // Filter only overdue
      const checkDriverOverdue = (entity: OverdueEntity) => {
        if (entity.nextVerificationDue) {
          const due = new Date(entity.nextVerificationDue);
          if (due.getTime() < new Date().getTime()) return true;
        }
        if (isDocumentExpiring(entity.licenseExpiryDate)) return true;
        if (isDocumentExpiring(entity.policeVerificationExpiryDate)) return true;
        return false;
      };

      const checkLeadOverdue = (entity: OverdueEntity) => {
        if (entity.nextVerificationDue) {
          const due = new Date(entity.nextVerificationDue);
          if (due.getTime() < new Date().getTime()) return true;
        }
        return false;
      };

      setDrivers(allDrivers.filter(checkDriverOverdue));
      setLeads(allLeads.filter(checkLeadOverdue));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (entity: OverdueEntity) => {
    setVerifyDriver(entity);
    setVerifyPoliceExpiry(entity.policeVerificationExpiryDate ? entity.policeVerificationExpiryDate.split('T')[0] : '');
    setVerifyLicenseExpiry(entity.licenseExpiryDate ? entity.licenseExpiryDate.split('T')[0] : '');
    setVerifyHistoryLoading(true);
    try {
      const res = await apiClient.get(`/admin/verification/${entity.id}/history`);
      setVerifyHistory(res.data?.records || []);
    } catch {
      setVerifyHistory([]);
    } finally {
      setVerifyHistoryLoading(false);
    }
  };

  const submitVerification = async (status: string) => {
    if (!verifyDriver) return;
    setVerifySubmitting(true);
    try {
      await apiClient.post('/admin/verification', {
        entityId: verifyDriver.id,
        entityType: tab,
        status,
        notes: verifyNotes,
      });
      await fetchData(); // refresh list
      const res = await apiClient.get(`/admin/verification/${verifyDriver.id}/history`);
      setVerifyHistory(res.data?.records || []);
      
      const updatedEntity = tab === 'DRIVER' ? 
        (await apiClient.get('/admin/drivers')).data?.find((d: any) => d.id === verifyDriver.id) :
        (await apiClient.get('/admin/leads')).data?.leads?.find((l: any) => l.id === verifyDriver.id);
        
      if (updatedEntity) {
        setVerifyDriver(updatedEntity);
        setVerifyPoliceExpiry(updatedEntity.policeVerificationExpiryDate ? updatedEntity.policeVerificationExpiryDate.split('T')[0] : '');
        setVerifyLicenseExpiry(updatedEntity.licenseExpiryDate ? updatedEntity.licenseExpiryDate.split('T')[0] : '');
      }
      setShowVerifyForm(false);
      setVerifyNotes('');
    } catch (e) {
      console.error(e);
      alert('Failed to verify');
    } finally {
      setVerifySubmitting(false);
    }
  };

  const handleUploadDocument = async (e: any, docType: string, expiryDate: string) => {
    const file = e.target.files?.[0];
    if (!file || !verifyDriver) return;
    
    if (!expiryDate) {
      alert('Please select an expiry date for the document.');
      e.target.value = '';
      return;
    }
    const expiryDateObj = new Date(expiryDate);
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
        const endpoint = tab === 'DRIVER' ? `/admin/drivers/${verifyDriver.id}/document` : `/admin/leads/${verifyDriver.id}/document`;
        const res = await apiClient.put(endpoint, {
          documentType: docType,
          documentUrl: url,
          expiryDate: expiryDate
        });
        
        if (res.data.success) {
          const updatedEntity = res.data.driver || res.data.lead;
          setVerifyDriver(updatedEntity);
          await fetchData();
          alert('Document uploaded successfully!');
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

  const handleDeleteDocument = async (docType: string) => {
    if (!verifyDriver) return;
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    setIsUploadingDoc(true);
    try {
      const endpoint = tab === 'DRIVER' ? `/admin/drivers/${verifyDriver.id}/document` : `/admin/leads/${verifyDriver.id}/document`;
      const res = await apiClient.put(endpoint, {
        documentType: docType,
        documentUrl: null,
        expiryDate: null
      });
      
      if (res.data.success) {
        const updatedEntity = res.data.driver || res.data.lead;
        setVerifyDriver(updatedEntity);
        if (docType === 'policeVerificationPhoto') setVerifyPoliceExpiry('');
        if (docType === 'dlPhoto') setVerifyLicenseExpiry('');
        await fetchData();
        alert('Document deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const entities = tab === 'DRIVER' ? drivers : leads;

  if (loading) return <div className="p-6 text-gray-500 text-sm">Loading overdue report...</div>;

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Overdue Verification Report</h2>
        <p className="text-xs text-gray-500 mt-1">View all drivers and leads with overdue quarterly verification</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('DRIVER')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
            tab === 'DRIVER' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Drivers
          <span className="ml-2 bg-white/20 text-inherit px-2 py-0.5 rounded-full text-xs">{drivers.length}</span>
        </button>
        <button
          onClick={() => setTab('LEAD')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
            tab === 'LEAD' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Leads
          <span className="ml-2 bg-white/20 text-inherit px-2 py-0.5 rounded-full text-xs">{leads.length}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-bold text-red-600 uppercase mb-1">Total Overdue</p>
          <p className="text-3xl font-bold text-red-700">{entities.length}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-xs font-bold text-orange-600 uppercase mb-1">Active Overdue</p>
          <p className="text-3xl font-bold text-orange-700">{entities.filter(e => e.isActive).length}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-bold text-gray-600 uppercase mb-1">Inactive Overdue</p>
          <p className="text-3xl font-bold text-gray-700">{entities.filter(e => !e.isActive).length}</p>
        </div>
      </div>

      {/* Table */}
      {entities.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-bold text-gray-900 mb-1">All Clear!</p>
          <p className="text-xs text-gray-500">No overdue {tab === 'DRIVER' ? 'drivers' : 'leads'} found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Quarterly Due</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">DL Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PV Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entities.map((entity, index) => {
                  const overdueDays = getOverdueDays(entity.nextVerificationDue);
                  return (
                    <tr key={entity.id} className="bg-red-50 hover:bg-red-100 transition">
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-gray-900">{index + 1}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                            {entity.name?.[0] || '?'}
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{entity.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900">{entity.phone}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-medium text-gray-900">
                          {entity.nextVerificationDue ? new Date(entity.nextVerificationDue).toLocaleDateString('en-GB') : '—'}
                        </span>
                        {overdueDays > 0 && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                              {overdueDays}d overdue
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {(() => {
                          if (!entity.licenseExpiryDate) return <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Missing</span>;
                          const isExpiring = isDocumentExpiring(entity.licenseExpiryDate);
                          const isExpired = new Date(entity.licenseExpiryDate).getTime() < new Date().getTime();
                          return (
                            <span className={`text-xs font-medium ${isExpired ? 'text-white bg-red-600 px-2 py-1 rounded-md shadow-sm' : isExpiring ? 'text-orange-600 font-bold' : 'text-gray-900'}`}>
                              {isExpired ? 'Expired - ' : ''}{new Date(entity.licenseExpiryDate).toLocaleDateString('en-GB')}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-4">
                        {(() => {
                          if (!entity.policeVerificationExpiryDate) return <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Missing</span>;
                          const isExpiring = isDocumentExpiring(entity.policeVerificationExpiryDate);
                          const isExpired = new Date(entity.policeVerificationExpiryDate).getTime() < new Date().getTime();
                          return (
                            <span className={`text-xs font-medium ${isExpired ? 'text-white bg-red-600 px-2 py-1 rounded-md shadow-sm' : isExpiring ? 'text-orange-600 font-bold' : 'text-gray-900'}`}>
                              {isExpired ? 'Expired - ' : ''}{new Date(entity.policeVerificationExpiryDate).toLocaleDateString('en-GB')}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          entity.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {entity.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleVerify(entity)}
                          className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-800 transition shadow-sm"
                        >
                          Verify Now
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

      {/* Export Button */}
      {entities.length > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              const csvContent = [
                ['S.No', 'Name', 'Phone', 'Quarterly Due', 'Overdue Days', 'DL Expiry', 'PV Expiry', 'Status'],
                ...entities.map((e, i) => [
                  i + 1,
                  e.name,
                  e.phone,
                  e.nextVerificationDue ? new Date(e.nextVerificationDue).toLocaleDateString('en-GB') : '—',
                  getOverdueDays(e.nextVerificationDue),
                  e.licenseExpiryDate ? new Date(e.licenseExpiryDate).toLocaleDateString('en-GB') : 'Missing',
                  e.policeVerificationExpiryDate ? new Date(e.policeVerificationExpiryDate).toLocaleDateString('en-GB') : 'Missing',
                  e.isActive ? 'Active' : 'Inactive'
                ])
              ].map(row => row.join(',')).join('\n');
              
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `overdue-${tab.toLowerCase()}-report-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
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
                  <span className="text-xs px-3 py-1.5 rounded-lg font-bold bg-red-100 text-red-700 border border-red-200 shadow-sm">OVERDUE</span>
                </div>
              </div>

              {/* Driving License Status in Verification Modal */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-500 uppercase">Driving License Document</p>
                  <span className="text-sm font-bold text-gray-900">
                    {(verifyDriver as any).dlPhoto ? '✅ Uploaded' : '❌ Not Uploaded'}
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
                    {(verifyDriver as any).dlPhoto && (
                      <div className="flex gap-1.5 flex-1 sm:flex-none">
                        <button 
                          onClick={() => window.open(docUrl((verifyDriver as any).dlPhoto), '_blank')}
                          className="flex-1 text-xs bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition font-bold"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleDeleteDocument('dlPhoto')}
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
                        onChange={e => handleUploadDocument(e, 'dlPhoto', verifyLicenseExpiry)}
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
                    {(verifyDriver as any).policeVerificationPhoto ? '✅ Uploaded' : '❌ Not Uploaded'}
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
                    {(verifyDriver as any).policeVerificationPhoto && (
                      <div className="flex gap-1.5 flex-1 sm:flex-none">
                        <button 
                          onClick={() => window.open(docUrl((verifyDriver as any).policeVerificationPhoto), '_blank')}
                          className="flex-1 text-xs bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition font-bold"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleDeleteDocument('policeVerificationPhoto')}
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
                        onChange={e => handleUploadDocument(e, 'policeVerificationPhoto', verifyPoliceExpiry)}
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
                    {verifyHistory.map((r: any) => (
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
