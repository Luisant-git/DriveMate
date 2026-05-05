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

const VerificationBadge = ({ driver }) => {
  const s = getVerificationStatus(driver);
  if (s === 'NEVER') return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold">Never</span>;
  if (s === 'OVERDUE') return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">Overdue</span>;
  if (s === 'DUE_SOON') return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-bold">Due Soon</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">Verified</span>;
};

export default function Driver() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [modalTab, setModalTab] = useState('details');
  const [verifyFilter, setVerifyFilter] = useState('ALL');

  // Verification state
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

  const openDriver = async (driver) => {
    setSelectedDriver(driver);
    setModalTab('details');
    setShowVerifyForm(false);
    setVerifyNotes('');
  };

  const loadVerifyHistory = async (driverId) => {
    setVerifyHistoryLoading(true);
    try {
      const res = await apiClient.get(`/admin/verification/${driverId}/history`);
      setVerifyHistory(res.data?.records || []);
    } catch {
      setVerifyHistory([]);
    } finally {
      setVerifyHistoryLoading(false);
    }
  };

  const handleModalTabChange = (tab) => {
    setModalTab(tab);
    if (tab === 'verification' && selectedDriver) {
      loadVerifyHistory(selectedDriver.id);
    }
  };

  const submitVerification = async (status) => {
    if (!selectedDriver) return;
    setVerifySubmitting(true);
    try {
      await apiClient.post('/admin/verification', {
        entityId: selectedDriver.id,
        entityType: 'DRIVER',
        status,
        notes: verifyNotes,
      });
      await fetchDrivers();
      await loadVerifyHistory(selectedDriver.id);
      // update selected driver with fresh data
      const res = await apiClient.get('/admin/drivers');
      const updated = (res.data || []).find(d => d.id === selectedDriver.id);
      if (updated) setSelectedDriver({ ...updated, activeSubscription: updated.subscriptions?.find(s => s.status === 'ACTIVE') });
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

  if (loading) {
    return <div className="px-6 py-6 flex items-center justify-center py-12"><div className="text-gray-500">Loading drivers...</div></div>;
  }

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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">License No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Package</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Verification</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Active</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDrivers.map((driver, index) => (
                  <tr key={driver.id} className="hover:bg-gray-50 transition">
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
                    <td className="px-4 py-4"><VerificationBadge driver={driver} /></td>
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
                        onClick={() => openDriver(driver)}
                        className="w-8 h-8 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
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

            {/* Modal Tabs */}
            <div className="flex gap-1 px-5 pt-4">
              {['details', 'verification'].map(t => (
                <button
                  key={t}
                  onClick={() => handleModalTabChange(t)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition capitalize ${modalTab === t ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {t === 'verification' ? 'Quarterly Verification' : 'Details'}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* Details Tab */}
              {modalTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Personal Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {selectedDriver.name}</div>
                      <div><span className="font-medium">Email:</span> {selectedDriver.email}</div>
                      <div><span className="font-medium">Phone:</span> {selectedDriver.phone}</div>
                      <div><span className="font-medium">Aadhar No:</span> {selectedDriver.aadharNo}</div>
                      <div><span className="font-medium">License No:</span> {selectedDriver.licenseNo}</div>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mt-4 mb-3">Documents</h3>
                    <div className="space-y-2">
                      {[
                        { label: 'Photo', path: selectedDriver.photo },
                        { label: 'DL Photo', path: selectedDriver.dlPhoto },
                        { label: 'PAN Photo', path: selectedDriver.panPhoto },
                        { label: 'Aadhar Photo', path: selectedDriver.aadharPhoto },
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
                      <div><span className="font-medium">GPay:</span> {selectedDriver.gpayNo || 'N/A'}</div>
                      <div><span className="font-medium">PhonePe:</span> {selectedDriver.phonepeNo || 'N/A'}</div>
                      <div><span className="font-medium">Package:</span> {selectedDriver.activeSubscription?.plan?.name || 'No Active Package'}</div>
                      <div><span className="font-medium">Total Rides:</span> {selectedDriver.totalRides}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Tab */}
              {modalTab === 'verification' && (
                <div className="space-y-5">
                  {/* Status bar */}
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Last Verified</p>
                      <p className="text-sm font-bold">{selectedDriver.lastVerifiedAt ? new Date(selectedDriver.lastVerifiedAt).toLocaleDateString('en-GB') : 'Never'}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div>
                      <p className="text-xs text-gray-500">Next Due</p>
                      <p className="text-sm font-bold">{selectedDriver.nextVerificationDue ? new Date(selectedDriver.nextVerificationDue).toLocaleDateString('en-GB') : '—'}</p>
                    </div>
                    <div className="ml-auto"><VerificationBadge driver={selectedDriver} /></div>
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
