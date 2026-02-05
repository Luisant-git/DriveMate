import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';

export default function PricingManagement() {
  const [packages, setPackages] = useState([]);
  const [monthlyPricing, setMonthlyPricing] = useState([]);
  const [activeTab, setActiveTab] = useState('LOCAL');
  const [showModal, setShowModal] = useState(false);
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [editingMonthly, setEditingMonthly] = useState(null);
  const [formData, setFormData] = useState({
    packageType: 'LOCAL_HOURLY',
    hours: '',
    minimumCharge: '',
    minimumKm: '',
    extraPerHour: '100'
  });
  const [monthlyFormData, setMonthlyFormData] = useState({
    vehicleType: 'Mini',
    hoursPerDay: '8',
    daysPerWeek: '5',
    charge5Days: '',
    charge6Days: '',
    extraPerHour: '90'
  });

  useEffect(() => {
    fetchPackages();
    fetchMonthlyPricing();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/pricing-packages`);
      setPackages(data.pricing);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchMonthlyPricing = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/monthly-pricing`);
      setMonthlyPricing(data.pricing);
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

  const handleMonthlySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMonthly) {
        await axios.put(`${API_URL}/api/monthly-pricing/${editingMonthly.id}`, monthlyFormData);
      } else {
        await axios.post(`${API_URL}/api/monthly-pricing`, monthlyFormData);
      }
      fetchMonthlyPricing();
      closeMonthlyModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Error');
    }
  };

  const handleMonthlyDelete = async (id) => {
    if (confirm('Delete this pricing?')) {
      await axios.delete(`${API_URL}/api/monthly-pricing/${id}`);
      fetchMonthlyPricing();
    }
  };

  const openMonthlyModal = (pricing = null) => {
    if (pricing) {
      setEditingMonthly(pricing);
      setMonthlyFormData({
        vehicleType: pricing.vehicleType,
        hoursPerDay: pricing.hoursPerDay,
        daysPerWeek: pricing.daysPerWeek,
        charge5Days: pricing.charge5Days || '',
        charge6Days: pricing.charge6Days || '',
        extraPerHour: pricing.extraPerHour
      });
    } else {
      setEditingMonthly(null);
      setMonthlyFormData({ vehicleType: 'Mini', hoursPerDay: '8', daysPerWeek: '5', charge5Days: '', charge6Days: '', extraPerHour: '90' });
    }
    setShowMonthlyModal(true);
  };

  const closeMonthlyModal = () => {
    setShowMonthlyModal(false);
    setEditingMonthly(null);
  };

  const local = packages.filter(p => p.packageType === 'LOCAL_HOURLY').sort((a, b) => a.hours - b.hours);
  const outstation = packages.filter(p => p.packageType === 'OUTSTATION').sort((a, b) => a.hours - b.hours);

  return (
    <div className="px-6 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Pricing Charges</h2>
        <button 
          onClick={() => activeTab === 'MONTHLY' ? openMonthlyModal() : openModal()} 
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition"
        >
          {activeTab === 'MONTHLY' ? 'Add Monthly Pricing' : 'Add Pricing'}
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('LOCAL')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'LOCAL' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Local Hourly Pricing
        </button>
        <button onClick={() => setActiveTab('OUTSTATION')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'OUTSTATION' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Outstation Pricing
        </button>
        <button onClick={() => setActiveTab('MONTHLY')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'MONTHLY' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Monthly Driver Pricing
        </button>
      </div>

      {activeTab === 'MONTHLY' && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <h3 className="text-sm font-bold text-blue-900 uppercase">Monthly Driver Pricing</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vehicle Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hours/Day</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Days/Week</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">5 Days Charge</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">6 Days Charge</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Extra/Hour</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {monthlyPricing.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No monthly pricing added yet</p>
                </td>
              </tr>
            ) : (
              monthlyPricing.map((pricing, index) => (
                <tr key={pricing.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">{index + 1}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">{pricing.vehicleType}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">{pricing.hoursPerDay}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">{pricing.daysPerWeek === '12' ? '12 Hours' : `${pricing.daysPerWeek} Days`}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">{pricing.charge5Days ? `₹${pricing.charge5Days}` : '-'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">{pricing.charge6Days ? `₹${pricing.charge6Days}` : '-'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">₹{pricing.extraPerHour}/hr</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openMonthlyModal(pricing)}
                        className="w-8 h-8 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleMonthlyDelete(pricing.id)}
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
      )}

      {activeTab === 'LOCAL' && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
      )}

      {activeTab === 'OUTSTATION' && (
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
      )}

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

      {/* MONTHLY PRICING MODAL */}
      {showMonthlyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">{editingMonthly ? 'Edit Monthly Pricing' : 'Add Monthly Pricing'}</h2>
                <button 
                  onClick={closeMonthlyModal}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleMonthlySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Vehicle Type</label>
                  <select value={monthlyFormData.vehicleType} onChange={(e) => setMonthlyFormData({...monthlyFormData, vehicleType: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5" required>
                    <option value="Mini">Mini</option>
                    <option value="Sedan">Sedan</option>
                    <option value="SUV/MPV">SUV/MPV</option>
                    <option value="Luxury Car">Luxury Car</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Hours Per Day</label>
                  <select value={monthlyFormData.hoursPerDay} onChange={(e) => setMonthlyFormData({...monthlyFormData, hoursPerDay: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5" required>
                    <option value="8">8 Hours</option>
                    <option value="10">10 Hours</option>
                    <option value="12">12 Hours</option>
                    <option value="1 day">1 Day</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Days Per Week</label>
                  <select value={monthlyFormData.daysPerWeek} onChange={(e) => setMonthlyFormData({...monthlyFormData, daysPerWeek: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5" required>
                    {monthlyFormData.hoursPerDay === '1 day' ? (
                      <option value="12">12 Hours</option>
                    ) : (
                      <>
                        <option value="5">5 Days</option>
                        <option value="6">6 Days</option>
                      </>
                    )}
                  </select>
                </div>
                {monthlyFormData.hoursPerDay !== '1 day' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Charge for 5 Days (₹)</label>
                      <input type="number" value={monthlyFormData.charge5Days} onChange={(e) => setMonthlyFormData({...monthlyFormData, charge5Days: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5" placeholder="e.g. 18000" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Charge for 6 Days (₹)</label>
                      <input type="number" value={monthlyFormData.charge6Days} onChange={(e) => setMonthlyFormData({...monthlyFormData, charge6Days: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5" placeholder="e.g. 20000" />
                    </div>
                  </>
                )}
                {monthlyFormData.hoursPerDay === '1 day' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Charge (₹)</label>
                    <input type="number" value={monthlyFormData.charge5Days} onChange={(e) => setMonthlyFormData({...monthlyFormData, charge5Days: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5" placeholder="e.g. 850" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Extra Per Hour (₹)</label>
                  <input type="number" value={monthlyFormData.extraPerHour} onChange={(e) => setMonthlyFormData({...monthlyFormData, extraPerHour: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5" required placeholder="e.g. 90" />
                </div>
                <div className="flex gap-2 pt-4">
                  <button type="button" onClick={closeMonthlyModal} className="flex-1 px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 text-xs font-bold text-white bg-black rounded-lg hover:bg-gray-800">
                    {editingMonthly ? 'Update' : 'Add'}
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
