import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig.js';
import { API_BASE_URL } from '../../api/config.js';
import DocumentViewerModal from '../../components/admin/DocumentViewerModal';

export default function Customer() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [activeViewerDoc, setActiveViewerDoc] = useState<{ title: string; url: string; entityName?: string } | null>(null);

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

  const docUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const clean = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${clean}`;
  };

  const handleDownloadDoc = async (path: string | null | undefined, label: string, customerName: string) => {
    if (!path) return;
    const url = docUrl(path);
    if (!url) return;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      let ext = 'jpg';
      const cType = response.headers.get('content-type');
      if (cType?.includes('pdf')) ext = 'pdf';
      else if (cType?.includes('png')) ext = 'png';
      else if (cType?.includes('webp')) ext = 'webp';
      else if (path.includes('.')) {
        ext = path.split('.').pop()?.split('?')[0] || 'jpg';
      }

      const cleanName = (customerName || 'customer').replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanLabel = label.replace(/[^a-zA-Z0-9_-]/g, '_');
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${cleanName}_${cleanLabel}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  const formatCustomerId = (no?: number) => {
    return `CUS-${no ? no.toString().padStart(4, '0') : 'XXXX'}`;
  };

  const filteredCustomers = customers.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const customerIdFormatted = formatCustomerId(c.customerNo).toLowerCase();
    return (
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      customerIdFormatted.includes(q) ||
      (c.alternateMobile && c.alternateMobile.toLowerCase().includes(q)) ||
      (c.whatsappNumber && c.whatsappNumber.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="px-6 py-6">
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-gray-500 font-medium">
            <svg className="w-5 h-5 animate-spin text-black" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>Loading customers...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-5">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Customer Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Total {customers.length} registered customers
          </p>
        </div>

        <div className="w-full sm:w-72">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search by name, phone or ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black transition shadow-sm font-medium"
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
          <h3 className="text-sm font-bold text-gray-900">No customers found</h3>
          <p className="text-gray-500 text-xs mt-1">Try another search keyword.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3.5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">S.No</th>
                  <th className="px-3.5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Customer ID</th>
                  <th className="px-3.5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-3.5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Primary Phone</th>
                  <th className="px-3.5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Alt Mobile</th>
                  <th className="px-3.5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">WhatsApp</th>
                  <th className="px-3.5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">ID Proof</th>
                  <th className="px-3.5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-3.5 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((customer, index) => {
                  const altPhone = customer.alternateMobile || customer.alternatePhone;
                  const idUrl = docUrl(customer.idProof);

                  return (
                    <tr key={customer.id} className="hover:bg-gray-50/70 transition">
                      <td className="px-3.5 py-3 text-xs font-bold text-gray-400">
                        {index + 1}
                      </td>
                      <td className="px-3.5 py-3">
                        <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          {formatCustomerId(customer.customerNo)}
                        </span>
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {customer.name ? customer.name[0].toUpperCase() : 'C'}
                          </div>
                          <span className="text-xs font-bold text-gray-900 truncate max-w-[140px]">
                            {customer.name || 'Unnamed Customer'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3.5 py-3">
                        <a href={`tel:${customer.phone}`} className="text-xs font-medium text-gray-900 hover:text-blue-600">
                          {customer.phone}
                        </a>
                      </td>
                      <td className="px-3.5 py-3 text-xs text-gray-600 font-medium">
                        {altPhone || '—'}
                      </td>
                      <td className="px-3.5 py-3 text-xs text-gray-600 font-medium">
                        {customer.whatsappNumber || '—'}
                      </td>
                      <td className="px-3.5 py-3">
                        {idUrl ? (
                          <button
                            type="button"
                            onClick={() => setActiveViewerDoc({
                              title: `ID Proof - ${formatCustomerId(customer.customerNo)}`,
                              url: idUrl,
                              entityName: customer.name || 'Customer'
                            })}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold rounded border border-emerald-200 transition"
                          >
                            View Doc
                          </button>
                        ) : (
                          <span className="text-[10px] font-medium text-gray-400">Not uploaded</span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-xs text-gray-500 font-medium">
                        {new Date(customer.createdAt).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        <button 
                          onClick={() => setSelectedCustomer(customer)}
                          className="px-2.5 py-1 bg-black hover:bg-gray-800 text-white rounded text-xs font-bold transition flex items-center gap-1 mx-auto"
                          title="View Details"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>View</span>
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

      {/* SIMPLE, CLEAN CUSTOMER DETAIL MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-base font-bold text-gray-900">Customer Details</h3>
                <p className="text-xs font-mono font-bold text-blue-600">
                  {formatCustomerId(selectedCustomer.customerNo)}
                </p>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Profile Card */}
              <div className="flex items-center gap-3.5 pb-3 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg shrink-0">
                  {selectedCustomer.name ? selectedCustomer.name[0].toUpperCase() : 'C'}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 leading-snug">
                    {selectedCustomer.name || 'Unnamed Customer'}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">
                    Joined Date: {new Date(selectedCustomer.createdAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
              </div>

              {/* Simple Details List */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-semibold">Primary Phone:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{selectedCustomer.phone}</span>
                    <a 
                      href={`tel:${selectedCustomer.phone}`} 
                      className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded"
                    >
                      Call
                    </a>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-semibold">Alternate Mobile:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">
                      {selectedCustomer.alternateMobile || selectedCustomer.alternatePhone || 'Not provided'}
                    </span>
                    {(selectedCustomer.alternateMobile || selectedCustomer.alternatePhone) && (
                      <a 
                        href={`tel:${selectedCustomer.alternateMobile || selectedCustomer.alternatePhone}`} 
                        className="px-2 py-0.5 bg-gray-100 text-gray-800 hover:bg-gray-200 font-bold rounded"
                      >
                        Call
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-semibold">WhatsApp Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">
                      {selectedCustomer.whatsappNumber || selectedCustomer.phone || 'Not provided'}
                    </span>
                    <a 
                      href={`https://wa.me/${(selectedCustomer.whatsappNumber || selectedCustomer.phone).replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>

                <div className="flex justify-between items-start py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-semibold pt-0.5 shrink-0">Full Address:</span>
                  <span className="font-medium text-gray-900 text-right max-w-[240px] leading-relaxed">
                    {selectedCustomer.address || 'No address provided'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-semibold">Total Bookings:</span>
                  <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                    {selectedCustomer.totalBookings || selectedCustomer.bookings?.length || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-semibold">Advance Payment:</span>
                  <span className="font-bold text-gray-900">
                    ₹{Number(selectedCustomer.advancePayment || 0).toFixed(2)}
                  </span>
                </div>

                {/* ID Proof Preview & Action */}
                <div className="pt-2">
                  <span className="text-gray-500 font-semibold block mb-2">ID Proof:</span>
                  {selectedCustomer.idProof ? (() => {
                    const idUrl = docUrl(selectedCustomer.idProof);
                    const isPdf = selectedCustomer.idProof.toLowerCase().endsWith('.pdf');
                    return (
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isPdf ? (
                            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                              PDF
                            </div>
                          ) : (
                            <img src={idUrl!} alt="ID" className="w-10 h-10 rounded-lg object-cover border border-gray-300 shrink-0" />
                          )}
                          <div className="truncate">
                            <p className="text-xs font-bold text-gray-900 truncate">ID Proof Document</p>
                            <span className="text-[10px] text-emerald-600 font-semibold">✓ Uploaded</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setActiveViewerDoc({
                              title: `ID Proof - ${formatCustomerId(selectedCustomer.customerNo)}`,
                              url: idUrl!,
                              entityName: selectedCustomer.name || 'Customer'
                            })}
                            className="px-2.5 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadDoc(selectedCustomer.idProof, 'ID_Proof', selectedCustomer.name)}
                            className="px-2.5 py-1.5 bg-gray-200 text-gray-800 text-xs font-bold rounded-lg hover:bg-gray-300 transition"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-center">
                      <p className="text-xs text-gray-400 font-medium">No ID proof uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="w-full py-2 bg-black hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT VIEWER MODAL (For full size preview) */}
      {activeViewerDoc && (
        <DocumentViewerModal
          isOpen={true}
          onClose={() => setActiveViewerDoc(null)}
          title={activeViewerDoc.title}
          url={activeViewerDoc.url}
          entityName={activeViewerDoc.entityName}
          onDownload={() => handleDownloadDoc(activeViewerDoc.url, 'Customer_IDProof', activeViewerDoc.entityName || 'Customer')}
        />
      )}
    </div>
  );
}