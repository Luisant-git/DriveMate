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
  const base = 'text-xs px-2 py-0.5 rounded-full font-bold cursor-pointer hover:opacity-80 transition';
  if (s === 'NEVER') return <span onClick={onClick} className={`${base} bg-gray-100 text-gray-600`}>Never</span>;
  if (s === 'OVERDUE') return <span onClick={onClick} className={`${base} bg-red-100 text-red-700`}>Overdue</span>;
  if (s === 'DUE_SOON') return <span onClick={onClick} className={`${base} bg-yellow-100 text-yellow-700`}>Due Soon</span>;
  return <span onClick={onClick} className={`${base} bg-green-100 text-green-700`}>Verified</span>;
};

export default function Lead() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [verifyFilter, setVerifyFilter] = useState('ALL');

  // Verification modal state
  const [verifyLead, setVerifyLead] = useState(null);
  const [verifyHistory, setVerifyHistory] = useState([]);
  const [verifyHistoryLoading, setVerifyHistoryLoading] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [showVerifyForm, setShowVerifyForm] = useState(false);

  useEffect(() => { fetchLeads(); }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/leads');
      const data = (res.data?.leads || []).map(lead => ({
        ...lead,
        activeSubscription: lead.leadSubscriptions?.find(sub => sub.status === 'ACTIVE'),
      }));
      setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const openVerifyModal = async (lead) => {
    setVerifyLead(lead);
    setShowVerifyForm(false);
    setVerifyNotes('');
    setVerifyHistoryLoading(true);
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
        entityType: 'LEAD',
        status,
        notes: verifyNotes,
      });
      await fetchLeads();
      const res = await apiClient.get(`/admin/verification/${verifyLead.id}/history`);
      setVerifyHistory(res.data?.records || []);
      const leadsRes = await apiClient.get('/admin/leads');
      const updated = (leadsRes.data?.leads || []).find(l => l.id === verifyLead.id);
      if (updated) setVerifyLead({ ...updated, activeSubscription: updated.leadSubscriptions?.find(s => s.status === 'ACTIVE') });
      setShowVerifyForm(false);
      setVerifyNotes('');
    } catch (e) {
      console.error(e);
    } finally {
      setVerifySubmitting(false);
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

  const filteredLeads = leads.filter(l => {
    if (verifyFilter === 'ALL') return true;
    return getVerificationStatus(l) === verifyFilter;
  });

  const filterCounts = {
    ALL: leads.length,
    OVERDUE: leads.filter(l => getVerificationStatus(l) === 'OVERDUE').length,
    DUE_SOON: leads.filter(l => getVerificationStatus(l) === 'DUE_SOON').length,
    NEVER: leads.filter(l => getVerificationStatus(l) === 'NEVER').length,
    OK: leads.filter(l => getVerificationStatus(l) === 'OK').length,
  };

  if (loading) return <div className="px-6 py-6 flex items-center justify-center"><div className="text-gray-500">Loading leads...</div></div>;

  return (
    <div className="px-6 py-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">All Leads</h2>

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

      {filteredLeads.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500 text-sm">No leads found</p>
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
                {filteredLeads.map((lead, index) => {
                  const vs = getVerificationStatus(lead);
                  const rowBg = vs === 'OVERDUE' ? 'bg-red-50 hover:bg-red-100' : vs === 'DUE_SOON' ? 'bg-yellow-50 hover:bg-yellow-100' : vs === 'NEVER' ? 'bg-gray-50 hover:bg-gray-100' : 'bg-green-50 hover:bg-green-100';
                  return (
                  <tr key={lead.id} className={`${rowBg} transition`}>
                    <td className="px-4 py-4"><p className="text-sm font-semibold text-gray-900">{index + 1}</p></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                          {lead.name ? lead.name[0] : 'L'}
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4"><p className="text-sm text-gray-900">{lead.phone}</p></td>
                    <td className="px-4 py-4"><p className="text-sm text-gray-900">{lead.licenseNo}</p></td>
                    <td className="px-4 py-4">
                      <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
                        {lead.activeSubscription?.plan?.name || 'No Active Package'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <VerificationBadge lead={lead} onClick={() => openVerifyModal(lead)} />
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleActiveStatus(lead.id, lead.isActive)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition ${lead.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      >
                        {lead.isActive ? 'Active' : 'Deactive'}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setSelectedLead(lead)}
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
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedLead.name}</h2>
                <p className="text-xs text-gray-500">{selectedLead.phone} · {selectedLead.licenseNo}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Personal Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedLead.name}</div>
                    <div><span className="font-medium">Email:</span> {selectedLead.email}</div>
                    <div><span className="font-medium">Phone:</span> {selectedLead.phone}</div>
                    <div><span className="font-medium">Aadhar No:</span> {selectedLead.aadharNo}</div>
                    <div><span className="font-medium">License No:</span> {selectedLead.licenseNo}</div>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mt-4 mb-3">Documents</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Photo', path: selectedLead.photo },
                      { label: 'DL Photo', path: selectedLead.dlPhoto },
                      { label: 'PAN Photo', path: selectedLead.panPhoto },
                      { label: 'Aadhar Photo', path: selectedLead.aadharPhoto },
                      { label: 'MSME', path: selectedLead.msmePhoto },
                      { label: 'Ration Card', path: selectedLead.rationCardPhoto },
                      { label: 'Police Verification', path: selectedLead.policeVerificationPhoto },
                      { label: 'Electricity Bill', path: selectedLead.electricityBillPhoto },
                      { label: 'Rental Agreement', path: selectedLead.rentalAgreementPhoto },
                      { label: 'Credit Card', path: selectedLead.creditCardPhoto },
                      { label: 'Debit Card', path: selectedLead.debitCardPhoto },
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
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Contact & Package</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Alt Mobile 1:</span> {selectedLead.alternateMobile1 || 'N/A'}</div>
                    <div><span className="font-medium">Alt Mobile 2:</span> {selectedLead.alternateMobile2 || 'N/A'}</div>
                    <div><span className="font-medium">Alt Mobile 3:</span> {selectedLead.alternateMobile3 || 'N/A'}</div>
                    <div><span className="font-medium">Alt Mobile 4:</span> {selectedLead.alternateMobile4 || 'N/A'}</div>
                    <div><span className="font-medium">GPay:</span> {selectedLead.gpayNo || 'N/A'}</div>
                    <div><span className="font-medium">PhonePe:</span> {selectedLead.phonepeNo || 'N/A'}</div>
                    <div><span className="font-medium">Package:</span> {selectedLead.activeSubscription?.plan?.name || 'No Active Package'}</div>
                    <div><span className="font-medium">Total Rides:</span> {selectedLead.totalRides}</div>
                  </div>
                </div>
              </div>
            </div>
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
