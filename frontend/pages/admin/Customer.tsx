import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig.js';
import { API_BASE_URL } from '../../api/config.js';

export default function Customer() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/customers');
      setCustomers(res.data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading customers...</div>
        </div>
      </div>
    );
  }

  const filteredCustomers = customers.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const customerIdFormatted = `cus-${c.customerNo ? c.customerNo.toString().padStart(4, '0') : 'xxxx'}`;
    return (
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.id && c.id.toLowerCase().includes(q)) ||
      customerIdFormatted.includes(q) ||
      (c.customerNo && c.customerNo.toString().includes(q))
    );
  });

  return (
    <div className="px-6 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-xl font-bold text-gray-900">All Customers</h2>
        <div className="w-full sm:w-64">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
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
      
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No customers found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">S.No</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Customer ID</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">ID Proof</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer, index) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition">
                  <td className="px-3 py-3">
                    <p className="text-xs font-bold text-gray-900">{index + 1}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-xs font-medium text-gray-900">
                      CUS-{customer.customerNo ? customer.customerNo.toString().padStart(4, '0') : 'XXXX'}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-[10px]">
                        {customer.name ? customer.name[0] : 'U'}
                      </div>
                      <p className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{customer.name || 'Unnamed'}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-xs text-gray-700">{customer.email || 'N/A'}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-xs text-gray-700">{customer.phone}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-xs text-gray-600 truncate max-w-[120px]">{customer.address || 'N/A'}</p>
                  </td>
                  <td className="px-3 py-3">
                    {customer.idProof ? (
                      <button 
                        onClick={() => window.open(customer.idProof, '_blank')}
                        className="text-blue-600 hover:text-blue-800 text-xs font-bold underline"
                      >
                        Download
                      </button>
                    ) : (
                      <span className="text-gray-400 text-[10px] font-bold">Not uploaded</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-[10px] text-gray-500 font-medium">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}