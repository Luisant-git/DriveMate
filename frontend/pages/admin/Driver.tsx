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

  const openVerifyModal = async (driver) => {
    setVerifyDriver(driver);
    setShowVerifyForm(false);
    setVerifyNotes('');
    setVerifyHistoryLoading(true);
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
      <h2 className="text-xl font-bold text-gray-900 mb-4">All Drivers</h2>

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
              <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Police Verification Document</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {verifyDriver.policeVerificationPhoto ? '✅ Uploaded' : '❌ Not Uploaded'}
                  </span>
                  {verifyDriver.policeVerificationPhoto && (
                    <button 
                      onClick={() => window.open(docUrl(verifyDriver.policeVerificationPhoto), '_blank')}
                      className="text-xs bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
                    >
                      View Document
                    </button>
                  )}
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