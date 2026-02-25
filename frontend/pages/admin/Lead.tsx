import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/config.js';

const API_URL = API_BASE_URL + '/api';

export default function Lead() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/leads`, { withCredentials: true });
      const leadsWithActiveSubscription = (res.data?.leads || []).map(lead => {
        const activeSubscription = lead.leadSubscriptions?.find(sub => sub.status === 'ACTIVE');
        return { ...lead, activeSubscription };
      });
      setLeads(leadsWithActiveSubscription);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const viewLeadDetails = (lead) => {
    setSelectedLead(lead);
  };

  if (loading) {
    return (
      <div className="px-6 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading leads...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">All Leads</h2>
      
      {leads.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No leads found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">License No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Package</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leads.map((lead, index) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">{index + 1}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                        {lead.name ? lead.name[0] : 'L'}
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">{lead.phone}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">{lead.licenseNo}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
                      {lead.activeSubscription?.plan?.name || 'No Active Package'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button 
                      onClick={() => viewLeadDetails(lead)}
                      className="w-8 h-8 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center"
                      title="View Details"
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
      )}

      {/* Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Lead Details</h2>
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div><span className="font-medium">Name:</span> {selectedLead.name}</div>
                    <div><span className="font-medium">Email:</span> {selectedLead.email}</div>
                    <div><span className="font-medium">Phone:</span> {selectedLead.phone}</div>
                    <div><span className="font-medium">Aadhar No:</span> {selectedLead.aadharNo}</div>
                    <div><span className="font-medium">License No:</span> {selectedLead.licenseNo}</div>
                    
                    <div className="mt-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">Documents</h4>
                      <div className="space-y-2">
                        {selectedLead.photo && (
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">Photo</span>
                            <button 
                              onClick={() => window.open(`${API_BASE_URL}/uploads/${selectedLead.photo}`, '_blank')}
                              className="w-8 h-8 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center"
                              title="Download Photo"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                              </svg>
                            </button>
                          </div>
                        )}
                        {selectedLead.dlPhoto && (
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">DL Photo</span>
                            <button 
                              onClick={() => window.open(`${API_BASE_URL}/uploads/${selectedLead.dlPhoto}`, '_blank')}
                              className="w-8 h-8 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center"
                              title="Download DL Photo"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                              </svg>
                            </button>
                          </div>
                        )}
                        {selectedLead.panPhoto && (
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">PAN Photo</span>
                            <button 
                              onClick={() => window.open(`${API_BASE_URL}/uploads/${selectedLead.panPhoto}`, '_blank')}
                              className="w-8 h-8 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center"
                              title="Download PAN Photo"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                              </svg>
                            </button>
                          </div>
                        )}
                        {selectedLead.aadharPhoto && (
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">Aadhar Photo</span>
                            <button 
                              onClick={() => window.open(`${API_BASE_URL}/uploads/${selectedLead.aadharPhoto}`, '_blank')}
                              className="w-8 h-8 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center"
                              title="Download Aadhar Photo"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact & Package</h3>
                  <div className="space-y-3">
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
    </div>
  );
}
