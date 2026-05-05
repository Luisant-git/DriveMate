import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig.js';
import { API_BASE_URL } from '../../api/config.js';

type EntityType = 'DRIVER' | 'LEAD';

interface Entity {
  id: string;
  name: string;
  phone: string;
  licenseNo: string;
  photo?: string;
  dlPhoto?: string;
  panPhoto?: string;
  aadharPhoto?: string;
  msmePhoto?: string;
  policeVerificationPhoto?: string;
  isActive: boolean;
  lastVerifiedAt?: string;
  nextVerificationDue?: string;
}

interface VerificationRecord {
  id: string;
  status: string;
  notes?: string;
  verifiedAt: string;
}

const getVerificationStatus = (entity: Entity) => {
  if (!entity.lastVerifiedAt) return 'NEVER';
  const due = entity.nextVerificationDue ? new Date(entity.nextVerificationDue) : null;
  if (!due) return 'NEVER';
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'OVERDUE';
  if (diffDays <= 30) return 'DUE_SOON';
  return 'OK';
};

const statusBadge = (entity: Entity) => {
  const s = getVerificationStatus(entity);
  if (s === 'NEVER') return <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-bold">Never Verified</span>;
  if (s === 'OVERDUE') return <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-bold">Overdue</span>;
  if (s === 'DUE_SOON') return <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-bold">Due Soon</span>;
  return <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-bold">Verified</span>;
};

export default function QuarterlyVerification() {
  const [tab, setTab] = useState<EntityType>('DRIVER');
  const [filter, setFilter] = useState<'ALL' | 'OVERDUE' | 'DUE_SOON' | 'NEVER'>('ALL');
  const [drivers, setDrivers] = useState<Entity[]>([]);
  const [leads, setLeads] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [history, setHistory] = useState<VerificationRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showVerifyForm, setShowVerifyForm] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dRes, lRes] = await Promise.all([
        apiClient.get('/admin/drivers'),
        apiClient.get('/admin/leads'),
      ]);
      setDrivers(dRes.data || []);
      setLeads(lRes.data?.leads || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openEntity = async (entity: Entity) => {
    setSelectedEntity(entity);
    setShowVerifyForm(false);
    setVerifyNotes('');
    setHistoryLoading(true);
    try {
      const res = await apiClient.get(`/admin/verification/${entity.id}/history`);
      setHistory(res.data?.records || []);
    } catch (e) {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const submitVerification = async (status: 'PASSED' | 'FAILED') => {
    if (!selectedEntity) return;
    setSubmitting(true);
    try {
      await apiClient.post('/admin/verification', {
        entityId: selectedEntity.id,
        entityType: tab,
        status,
        notes: verifyNotes,
      });
      await fetchAll();
      // refresh history
      const res = await apiClient.get(`/admin/verification/${selectedEntity.id}/history`);
      setHistory(res.data?.records || []);
      // update selected entity with fresh data
      const updated = tab === 'DRIVER'
        ? (await apiClient.get('/admin/drivers')).data?.find((d: Entity) => d.id === selectedEntity.id)
        : (await apiClient.get('/admin/leads')).data?.leads?.find((l: Entity) => l.id === selectedEntity.id);
      if (updated) setSelectedEntity(updated);
      setShowVerifyForm(false);
      setVerifyNotes('');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const entities = tab === 'DRIVER' ? drivers : leads;

  const filtered = entities.filter(e => {
    if (filter === 'ALL') return true;
    return getVerificationStatus(e) === filter;
  });

  const docUrl = (path?: string) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  };

  const counts = {
    ALL: entities.length,
    OVERDUE: entities.filter(e => getVerificationStatus(e) === 'OVERDUE').length,
    DUE_SOON: entities.filter(e => getVerificationStatus(e) === 'DUE_SOON').length,
    NEVER: entities.filter(e => getVerificationStatus(e) === 'NEVER').length,
  };

  if (loading) return <div className="p-6 text-gray-500 text-sm">Loading...</div>;

  return (
    <div className="px-6 py-6">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Quarterly Verification</h2>
      <p className="text-xs text-gray-500 mb-5">Manually verify drivers and leads every 3 months</p>

      {/* Tab: Driver / Lead */}
      <div className="flex gap-2 mb-4">
        {(['DRIVER', 'LEAD'] as EntityType[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setFilter('ALL'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${tab === t ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t === 'DRIVER' ? 'Drivers' : 'Leads'}
          </button>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(['ALL', 'OVERDUE', 'DUE_SOON', 'NEVER'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition border ${
              filter === f ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f === 'ALL' ? 'All' : f === 'OVERDUE' ? 'Overdue' : f === 'DUE_SOON' ? 'Due Soon' : 'Never Verified'}
            <span className="ml-1.5 bg-white/20 text-inherit px-1.5 py-0.5 rounded-full text-[10px]">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-500">No records found</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">License</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Last Verified</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Next Due</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(entity => (
                <tr key={entity.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-gray-700 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {entity.name?.[0] || '?'}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{entity.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{entity.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{entity.licenseNo}</td>
                  <td className="px-4 py-3">{statusBadge(entity)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {entity.lastVerifiedAt ? new Date(entity.lastVerifiedAt).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {entity.nextVerificationDue ? new Date(entity.nextVerificationDue).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEntity(entity)}
                      className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition"
                    >
                      Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail / Verify Modal */}
      {selectedEntity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-900">{selectedEntity.name}</h3>
                <p className="text-xs text-gray-500">{selectedEntity.phone} · {selectedEntity.licenseNo}</p>
              </div>
              <button onClick={() => setSelectedEntity(null)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Documents */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Documents</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Photo', url: docUrl(selectedEntity.photo) },
                    { label: 'DL Photo', url: docUrl(selectedEntity.dlPhoto) },
                    { label: 'PAN Photo', url: docUrl(selectedEntity.panPhoto) },
                    { label: 'Aadhar Photo', url: docUrl(selectedEntity.aadharPhoto) },
                    { label: 'MSME', url: docUrl((selectedEntity as any).msmePhoto) },
                    { label: 'Police Verification', url: docUrl((selectedEntity as any).policeVerificationPhoto) },
                  ].filter(d => d.url).map(doc => (
                    <button
                      key={doc.label}
                      onClick={() => window.open(doc.url!, '_blank')}
                      className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left"
                    >
                      <span className="text-xs font-medium text-gray-700">{doc.label}</span>
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                    </button>
                  ))}
                </div>
                {![selectedEntity.photo, selectedEntity.dlPhoto, selectedEntity.panPhoto, selectedEntity.aadharPhoto].some(Boolean) && (
                  <p className="text-xs text-gray-400">No documents uploaded</p>
                )}
              </div>

              {/* Verification status */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Last Verified</p>
                  <p className="text-sm font-bold">{selectedEntity.lastVerifiedAt ? new Date(selectedEntity.lastVerifiedAt).toLocaleDateString('en-GB') : 'Never'}</p>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div>
                  <p className="text-xs text-gray-500">Next Due</p>
                  <p className="text-sm font-bold">{selectedEntity.nextVerificationDue ? new Date(selectedEntity.nextVerificationDue).toLocaleDateString('en-GB') : '—'}</p>
                </div>
                <div className="ml-auto">{statusBadge(selectedEntity)}</div>
              </div>

              {/* Verify form */}
              {showVerifyForm ? (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-gray-700 uppercase">Mark Verification</p>
                  <textarea
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-black focus:outline-none"
                    rows={3}
                    placeholder="Notes (optional)"
                    value={verifyNotes}
                    onChange={e => setVerifyNotes(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitVerification('PASSED')}
                      disabled={submitting}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      {submitting ? 'Saving...' : '✓ Mark as Passed'}
                    </button>
                    <button
                      onClick={() => submitVerification('FAILED')}
                      disabled={submitting}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-50 transition"
                    >
                      {submitting ? 'Saving...' : '✗ Mark as Failed'}
                    </button>
                    <button
                      onClick={() => setShowVerifyForm(false)}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowVerifyForm(true)}
                  className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition"
                >
                  Start Verification
                </button>
              )}

              {/* History */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Verification History</p>
                {historyLoading ? (
                  <p className="text-xs text-gray-400">Loading...</p>
                ) : history.length === 0 ? (
                  <p className="text-xs text-gray-400">No verification history</p>
                ) : (
                  <div className="space-y-2">
                    {history.map(r => (
                      <div key={r.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${r.status === 'PASSED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {r.status}
                        </span>
                        <div className="flex-1 min-w-0">
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
