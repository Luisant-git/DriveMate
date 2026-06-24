import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig.js';
import { API_BASE_URL } from '../../api/config.js';

export default function Customer() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

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

                <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">ID Proof</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-3 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
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
                  <td className="px-3 py-3 text-center">
                    <button 
                      onClick={() => setSelectedCustomer(customer)}
                      className="text-gray-400 hover:text-black transition"
                      title="View Details"
                    >
                      <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Customer Details</h2>
                <p className="text-xs text-gray-500 mt-1">CUS-{selectedCustomer.customerNo ? selectedCustomer.customerNo.toString().padStart(4, '0') : 'XXXX'}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-2xl">
                  {selectedCustomer.name ? selectedCustomer.name[0] : 'U'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedCustomer.name || 'Unnamed Customer'}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedCustomer.email || 'No email provided'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-semibold text-gray-900">{selectedCustomer.phone}</span>
                    </div>
                    {selectedCustomer.alternatePhone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Alt Phone:</span>
                        <span className="font-semibold text-gray-900">{selectedCustomer.alternatePhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Address & Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600 block mb-1">Full Address:</span>
                      <span className="font-semibold text-gray-900 block">{selectedCustomer.address || 'No address provided'}</span>
                    </div>
                    <div className="flex justify-between mt-3 pt-3 border-t border-gray-200">
                      <span className="text-gray-600">Joined Date:</span>
                      <span className="font-semibold text-gray-900">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {selectedCustomer.idProof && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-blue-900">ID Proof Document</h4>
                      <p className="text-xs text-blue-700 mt-0.5">Customer verification document</p>
                    </div>
                    <button 
                      onClick={() => window.open(selectedCustomer.idProof, '_blank')}
                      className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition shadow-sm"
                    >
                      View Doc
                    </button>
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