import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig.js';

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
    </div>
  );
}
