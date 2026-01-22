import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/config.js';

const API_URL = API_BASE_URL + '/api';

export default function Customer() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/customers`, { withCredentials: true });
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

  return (
    <div className="px-6 py-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">All Customers</h2>
      
      {customers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No customers found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Address</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID Proof</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map((customer, index) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">{index + 1}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                        {customer.name ? customer.name[0] : 'U'}
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{customer.name || 'Unnamed'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">{customer.email || 'N/A'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">{customer.phone}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-600">{customer.address || 'N/A'}</p>
                  </td>
                  <td className="px-4 py-4">
                    {customer.idProof ? (
                      <button 
                        onClick={() => window.open(`${API_BASE_URL}/uploads/${customer.idProof}`, '_blank')}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                      >
                        Download
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">Not uploaded</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-xs text-gray-500">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}