import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';

export default function PricingManagement() {
  const [packages, setPackages] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [formData, setFormData] = useState({
    packageType: 'LOCAL_HOURLY',
    hours: '',
    minimumCharge: '',
    minimumKm: '',
    extraPerHour: '100'
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/pricing-packages`);
      setPackages(data.pricing);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPkg) {
        await axios.put(`${API_URL}/api/pricing-packages/${editingPkg.id}`, formData);
      } else {
        await axios.post(`${API_URL}/api/pricing-packages`, formData);
      }
      fetchPackages();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this pricing?')) {
      await axios.delete(`${API_URL}/api/pricing-packages/${id}`);
      fetchPackages();
    }
  };

  const openModal = (pkg = null) => {
    if (pkg) {
      setEditingPkg(pkg);
      setFormData({
        packageType: pkg.packageType,
        hours: pkg.hours,
        minimumCharge: pkg.minimumCharge,
        minimumKm: pkg.minimumKm || '',
        extraPerHour: pkg.extraPerHour
      });
    } else {
      setEditingPkg(null);
      setFormData({ packageType: 'LOCAL_HOURLY', hours: '', minimumCharge: '', minimumKm: '', extraPerHour: '100' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPkg(null);
  };

  const local = packages.filter(p => p.packageType === 'LOCAL_HOURLY').sort((a, b) => a.hours - b.hours);
  const outstation = packages.filter(p => p.packageType === 'OUTSTATION').sort((a, b) => a.hours - b.hours);

  return (
    <div className="px-6 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Pricing Charges</h2>
        <button onClick={() => openModal()} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition">
          Add Pricing
        </button>
      </div>

      {/* LOCAL HOURLY */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-bold text-gray-900 uppercase">Local Hourly Pricing</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hours</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Minimum Charge</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Extra/Hour</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {local.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No pricing added yet</p>
                </td>
              </tr>
            ) : (
              local.map((pkg, index) => (
                <tr key={pkg.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">{index + 1}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-semibold text-sm">
                        {pkg.hours}
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{pkg.hours} Hour{pkg.hours > 1 ? 's' : ''}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">₹{pkg.minimumCharge}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">₹{pkg.extraPerHour}/hr</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openModal(pkg)}
                        className="w-8 h-8 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(pkg.id)}
                        className="w-8 h-8 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition flex items-center justify-center"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* OUTSTATION */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-bold text-gray-900 uppercase">Outstation Pricing</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hours</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Min KM</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Charge</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Extra/Hour</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {outstation.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No pricing added yet</p>
                </td>
              </tr>
            ) : (
              outstation.map((pkg, index) => (
                <tr key={pkg.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">{index + 1}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-semibold text-sm">
                        {pkg.hours}
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{pkg.hours} Hour{pkg.hours > 1 ? 's' : ''}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">{pkg.minimumKm ? `${pkg.minimumKm} KM` : 'Full Day'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">₹{pkg.minimumCharge}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">₹{pkg.extraPerHour}/hr</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openModal(pkg)}
                        className="w-8 h-8 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(pkg.id)}
                        className="w-8 h-8 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition flex items-center justify-center"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">{editingPkg ? 'Edit Pricing' : 'Add Pricing'}</h2>
                <button 
                  onClick={closeModal}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Service Type</label>
                  <select value={formData.packageType} onChange={(e) => setFormData({...formData, packageType: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5" required disabled={editingPkg}>
                    <option value="LOCAL_HOURLY">Local Hourly</option>
                    <option value="OUTSTATION">Outstation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Hours</label>
                  <input type="number" value={formData.hours} onChange={(e) => setFormData({...formData, hours: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5" required disabled={editingPkg} placeholder="e.g. 4" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Minimum Charge (₹)</label>
                  <input type="number" value={formData.minimumCharge} onChange={(e) => setFormData({...formData, minimumCharge: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5" required placeholder="e.g. 500" />
                </div>
                {formData.packageType === 'OUTSTATION' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Minimum KM</label>
                    <input type="number" value={formData.minimumKm} onChange={(e) => setFormData({...formData, minimumKm: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5" placeholder="e.g. 40" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Extra Per Hour (₹)</label>
                  <input type="number" value={formData.extraPerHour} onChange={(e) => setFormData({...formData, extraPerHour: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5" required placeholder="e.g. 100" />
                </div>
                <div className="flex gap-2 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 text-xs font-bold text-white bg-black rounded-lg hover:bg-gray-800">
                    {editingPkg ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
