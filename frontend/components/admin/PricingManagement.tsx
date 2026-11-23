import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CityMultiSelect from './CityMultiSelect';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';

export default function PricingManagement() {
  const [packages, setPackages] = useState([]);
  const [monthlyPricing, setMonthlyPricing] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [selectedCityFilter, setSelectedCityFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('LOCAL');
  const [showModal, setShowModal] = useState(false);
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [editingMonthly, setEditingMonthly] = useState(null);
  const [formData, setFormData] = useState({
    packageType: 'LOCAL_HOURLY',
    hours: '',
    minimumCharge: '',
    immediateCharge: '',
    minimumKm: '',
    extraPerHour: '100',
    extraPerHourImm: '',
    cities: []
  });
  const [monthlyFormData, setMonthlyFormData] = useState({
    vehicleType: 'Mini',
    hoursPerDay: '8',
    daysPerWeek: '5',
    charge5Days: '',
    charge6Days: '',
    extraPerHour: '90',
    cities: []
  });

  useEffect(() => {
    fetchPackages();
    fetchMonthlyPricing();
    fetchAvailableCities();
  }, []);

  const fetchAvailableCities = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/service-areas`);
      if (data && data.areas) {
        const uniqueCities = Array.from(new Set(data.areas.map(a => a.city).filter(Boolean)));
        setAvailableCities(uniqueCities);
      }
    } catch (error) {
      console.error('Error fetching service area cities:', error);
    }
  };

  const fetchPackages = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/pricing-packages`);
      setPackages(data.pricing || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchMonthlyPricing = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/monthly-pricing`);
      setMonthlyPricing(data.pricing || []);
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
      alert(error.response?.data?.error || 'Error saving pricing package');
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
        immediateCharge: pkg.immediateCharge || '',
        minimumKm: pkg.minimumKm || '',
        extraPerHour: pkg.extraPerHour,
        extraPerHourImm: pkg.extraPerHourImm || '',
        cities: pkg.cities || []
      });
    } else {
      setEditingPkg(null);
      setFormData({
        packageType: activeTab === 'OUTSTATION' ? 'OUTSTATION' : 'LOCAL_HOURLY',
        hours: '',
        minimumCharge: '',
        immediateCharge: '',
        minimumKm: '',
        extraPerHour: '100',
        extraPerHourImm: '',
        cities: selectedCityFilter !== 'ALL' && selectedCityFilter !== 'DEFAULT_ALL' ? [selectedCityFilter] : []
      });
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
      alert(error.response?.data?.error || 'Error saving monthly pricing');
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
        extraPerHour: pricing.extraPerHour,
        cities: pricing.cities || []
      });
    } else {
      setEditingMonthly(null);
      setMonthlyFormData({
        vehicleType: 'Mini',
        hoursPerDay: '8',
        daysPerWeek: '5',
        charge5Days: '',
        charge6Days: '',
        extraPerHour: '90',
        cities: selectedCityFilter !== 'ALL' && selectedCityFilter !== 'DEFAULT_ALL' ? [selectedCityFilter] : []
      });
    }
    setShowMonthlyModal(true);
  };

  const closeMonthlyModal = () => {
    setShowMonthlyModal(false);
    setEditingMonthly(null);
  };

  const DEFAULT_CITIES = [
    'Ahmedabad',
    'Bengaluru',
    'Chennai',
    'Delhi',
    'Hyderabad',
    'Jaipur',
    'Kolkata',
    'Mumbai',
    'Pune',
    'Surat',
    'Vijayawada'
  ];

  // Collect all known cities from default major cities, service areas, packages, and monthly pricing
  const allKnownCities = Array.from(
    new Set([
      ...DEFAULT_CITIES,
      ...availableCities,
      ...packages.flatMap(p => p.cities || []),
      ...monthlyPricing.flatMap(m => m.cities || [])
    ].filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const matchesCity = (item) => {
    if (selectedCityFilter === 'ALL') return true;
    if (selectedCityFilter === 'DEFAULT_ALL') {
      return !item.cities || item.cities.length === 0;
    }
    return Array.isArray(item.cities) && item.cities.includes(selectedCityFilter);
  };

  const local = packages.filter(p => p.packageType === 'LOCAL_HOURLY').sort((a, b) => a.hours - b.hours);
  const outstation = packages.filter(p => p.packageType === 'OUTSTATION').sort((a, b) => a.hours - b.hours);

  const filteredLocal = local.filter(matchesCity);
  const filteredOutstation = outstation.filter(matchesCity);
  const filteredMonthly = monthlyPricing.filter(matchesCity);

  return (
    <div className="px-4 md:px-6 py-4 md:py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Pricing Charges</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure hourly, outstation, and monthly driver charges city-wise
          </p>
        </div>
        <button 
          onClick={() => activeTab === 'MONTHLY' ? openMonthlyModal() : openModal()} 
          className="bg-[#0B192C] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#1E3E62] transition w-full md:w-auto shadow-sm cursor-pointer"
        >
          {activeTab === 'MONTHLY' ? '+ Add Monthly Pricing' : '+ Add Pricing'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button onClick={() => setActiveTab('LOCAL')} className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition whitespace-nowrap cursor-pointer ${activeTab === 'LOCAL' ? 'bg-[#0B192C] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Local Hourly Pricing ({local.length})
        </button>
        <button onClick={() => setActiveTab('OUTSTATION')} className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition whitespace-nowrap cursor-pointer ${activeTab === 'OUTSTATION' ? 'bg-[#0B192C] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Outstation Pricing ({outstation.length})
        </button>
        <button onClick={() => setActiveTab('MONTHLY')} className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition whitespace-nowrap cursor-pointer ${activeTab === 'MONTHLY' ? 'bg-[#0B192C] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Monthly Driver Pricing ({monthlyPricing.length})
        </button>
      </div>

      {/* City Filter Toolbar (Responsive with Mobile Dropdown & Horizontal Pills) */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 sm:p-4 mb-4 md:mb-6 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0B192C]/5 text-[#0B192C] flex items-center justify-center">
              <svg className="w-4 h-4 text-[#0B192C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">City Filter:</span>
              <span className="text-[11px] text-gray-500">
                {selectedCityFilter === 'ALL'
                  ? 'Showing all packages across all cities'
                  : selectedCityFilter === 'DEFAULT_ALL'
                  ? 'Showing universal packages without city restriction'
                  : `Filtered for: ${selectedCityFilter}`}
              </span>
            </div>
          </div>

          {/* Quick Select for Mobile Screen */}
          <div className="sm:hidden">
            <select
              value={selectedCityFilter}
              onChange={(e) => setSelectedCityFilter(e.target.value)}
              aria-label="City Filter"
              className="text-xs font-bold bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-[#0B192C] outline-none"
            >
              <option value="ALL">All Cities</option>
              <option value="DEFAULT_ALL">Universal (All Cities)</option>
              {allKnownCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable / Wrap Responsive Pills for All Screens */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCityFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedCityFilter === 'ALL'
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Cities
          </button>

          <button
            type="button"
            onClick={() => setSelectedCityFilter('DEFAULT_ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedCityFilter === 'DEFAULT_ALL'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
            }`}
            title="Applies to all cities without restriction"
          >
            Universal (All Cities)
          </button>

          {allKnownCities.map(city => (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCityFilter(city)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCityFilter === city
                  ? 'bg-[#0B192C] text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'MONTHLY' && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex justify-between items-center">
          <h3 className="text-sm font-bold text-blue-900 uppercase">Monthly Driver Pricing</h3>
          <span className="text-xs font-semibold text-blue-800">
            Showing {filteredMonthly.length} of {monthlyPricing.length} items
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">City / Coverage</th>
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
            {filteredMonthly.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">
                    {selectedCityFilter !== 'ALL'
                      ? `No monthly pricing configured for "${selectedCityFilter}"`
                      : 'No monthly pricing added yet'}
                  </p>
                  {selectedCityFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCityFilter('ALL')}
                      className="mt-2 text-xs text-blue-600 hover:underline font-bold"
                    >
                      Show All Cities
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredMonthly.map((pricing, index) => (
                <tr key={pricing.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">{index + 1}</p>
                  </td>
                  <td className="px-4 py-4">
                    {pricing.cities && pricing.cities.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {pricing.cities.map(c => (
                          <span key={c} className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        All Cities
                      </span>
                    )}
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
                        className="w-8 h-8 bg-[#0B192C] text-white rounded-lg hover:bg-[#1E3E62] transition flex items-center justify-center"
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
      </div>
      )}

      {activeTab === 'LOCAL' && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-900 uppercase">Local Hourly Pricing</h3>
          <span className="text-xs font-semibold text-gray-600">
            Showing {filteredLocal.length} of {local.length} packages
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">City / Coverage</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hours</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Min KM</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Min Charge (Sch)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Imm Charge</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Extra/Hour (Sch)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Extra/Hour (Imm)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredLocal.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">
                    {selectedCityFilter !== 'ALL'
                      ? `No local pricing configured for "${selectedCityFilter}"`
                      : 'No pricing added yet'}
                  </p>
                  {selectedCityFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCityFilter('ALL')}
                      className="mt-2 text-xs text-blue-600 hover:underline font-bold"
                    >
                      Show All Cities
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredLocal.map((pkg, index) => (
                <tr key={pkg.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">{index + 1}</p>
                  </td>
                  <td className="px-4 py-4">
                    {pkg.cities && pkg.cities.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {pkg.cities.map(c => (
                          <span key={c} className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        All Cities
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#0B192C] text-white rounded-lg flex items-center justify-center font-semibold text-sm">
                        {pkg.hours}
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{pkg.hours} Hour{pkg.hours > 1 ? 's' : ''}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">{pkg.minimumKm ? `${pkg.minimumKm} KM` : '-'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">₹{pkg.minimumCharge}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">{pkg.immediateCharge ? `₹${pkg.immediateCharge}` : '-'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">₹{pkg.extraPerHour}/hr</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">{pkg.extraPerHourImm ? `₹${pkg.extraPerHourImm}/hr` : '-'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openModal(pkg)}
                        className="w-8 h-8 bg-[#0B192C] text-white rounded-lg hover:bg-[#1E3E62] transition flex items-center justify-center"
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
      </div>
      )}

      {activeTab === 'OUTSTATION' && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-900 uppercase">Outstation Pricing</h3>
          <span className="text-xs font-semibold text-gray-600">
            Showing {filteredOutstation.length} of {outstation.length} packages
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">City / Coverage</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hours</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Min KM</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Charge (Sch)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Imm Charge</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Extra/Hour (Sch)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Extra/Hour (Imm)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOutstation.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">
                    {selectedCityFilter !== 'ALL'
                      ? `No outstation pricing configured for "${selectedCityFilter}"`
                      : 'No pricing added yet'}
                  </p>
                  {selectedCityFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCityFilter('ALL')}
                      className="mt-2 text-xs text-blue-600 hover:underline font-bold"
                    >
                      Show All Cities
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredOutstation.map((pkg, index) => (
                <tr key={pkg.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">{index + 1}</p>
                  </td>
                  <td className="px-4 py-4">
                    {pkg.cities && pkg.cities.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {pkg.cities.map(c => (
                          <span key={c} className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        All Cities
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#0B192C] text-white rounded-lg flex items-center justify-center font-semibold text-sm">
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
                    <p className="text-sm font-semibold text-gray-900">{pkg.immediateCharge ? `₹${pkg.immediateCharge}` : '-'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">₹{pkg.extraPerHour}/hr</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">{pkg.extraPerHourImm ? `₹${pkg.extraPerHourImm}/hr` : '-'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openModal(pkg)}
                        className="w-8 h-8 bg-[#0B192C] text-white rounded-lg hover:bg-[#1E3E62] transition flex items-center justify-center"
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
      </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl sm:max-w-3xl lg:max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0B192C]"></span>
                  {editingPkg ? 'Edit Pricing' : 'Add Pricing'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure city-specific or universal hourly and outstation driver charges
                </p>
              </div>
              <button 
                onClick={closeModal}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg flex items-center justify-center transition flex-shrink-0 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Body */}
            <div className="p-4 sm:p-6 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Multi-Select City Selector (Full Width) */}
                <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Applicable Cities
                    </label>
                    <span className="text-[11px] text-gray-500 font-medium">Leave empty for All Cities</span>
                  </div>
                  <CityMultiSelect
                    selectedCities={formData.cities}
                    onChange={(cities) => setFormData({ ...formData, cities })}
                    availableCities={allKnownCities}
                  />
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    Leave empty to apply to all service cities, or choose one or more specific cities.
                  </p>
                </div>

                {/* 2-Column Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Service Type *</label>
                    <select 
                      value={formData.packageType} 
                      onChange={(e) => setFormData({...formData, packageType: e.target.value})} 
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C] bg-white font-medium shadow-xs" 
                      required 
                      disabled={editingPkg}
                    >
                      <option value="LOCAL_HOURLY">Local Hourly</option>
                      <option value="OUTSTATION">Outstation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Hours *</label>
                    <input 
                      type="number" 
                      value={formData.hours} 
                      onChange={(e) => setFormData({...formData, hours: e.target.value})} 
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C] bg-white font-medium shadow-xs" 
                      required 
                      placeholder="e.g. 4" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Minimum Charge (Scheduled) (₹) *</label>
                    <input 
                      type="number" 
                      value={formData.minimumCharge} 
                      onChange={(e) => setFormData({...formData, minimumCharge: e.target.value})} 
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C] bg-white font-medium shadow-xs" 
                      required 
                      placeholder="e.g. 500" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Immediate Charge (₹)</label>
                    <input 
                      type="number" 
                      value={formData.immediateCharge} 
                      onChange={(e) => setFormData({...formData, immediateCharge: e.target.value})} 
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C] bg-white font-medium shadow-xs" 
                      placeholder="e.g. 550 (Optional)" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Minimum KM</label>
                    <input 
                      type="number" 
                      value={formData.minimumKm} 
                      onChange={(e) => setFormData({...formData, minimumKm: e.target.value})} 
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C] bg-white font-medium shadow-xs" 
                      placeholder="e.g. 40" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Extra Per Hour (Scheduled) (₹) *</label>
                    <input 
                      type="number" 
                      value={formData.extraPerHour} 
                      onChange={(e) => setFormData({...formData, extraPerHour: e.target.value})} 
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C] bg-white font-medium shadow-xs" 
                      required 
                      placeholder="e.g. 100" 
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Extra Per Hour (Immediate) (₹)</label>
                    <input 
                      type="number" 
                      value={formData.extraPerHourImm} 
                      onChange={(e) => setFormData({...formData, extraPerHourImm: e.target.value})} 
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C] bg-white font-medium shadow-xs" 
                      placeholder="e.g. 110 (Optional)" 
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={closeModal} 
                    className="flex-1 py-2.5 text-xs sm:text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#0B192C] rounded-xl hover:bg-[#1E3E62] transition shadow-sm cursor-pointer"
                  >
                    {editingPkg ? 'Update Pricing' : 'Add Pricing'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MONTHLY PRICING MODAL */}
      {showMonthlyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl sm:max-w-3xl lg:max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  {editingMonthly ? 'Edit Monthly Pricing' : 'Add Monthly Pricing'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure city-specific monthly driver pricing packages
                </p>
              </div>
              <button 
                onClick={closeMonthlyModal}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg flex items-center justify-center transition flex-shrink-0 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Body */}
            <div className="p-4 sm:p-6 overflow-y-auto">
              <form onSubmit={handleMonthlySubmit} className="space-y-4">
                {/* Multi-Select City Selector (Full Width) */}
                <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Applicable Cities
                    </label>
                    <span className="text-[11px] text-gray-500 font-medium">Leave empty for All Cities</span>
                  </div>
                  <CityMultiSelect
                    selectedCities={monthlyFormData.cities}
                    onChange={(cities) => setMonthlyFormData({ ...monthlyFormData, cities })}
                    availableCities={allKnownCities}
                  />
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    Leave empty to apply to all service cities, or choose one or more specific cities.
                  </p>
                </div>

                {/* 2-Column Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Vehicle Type *</label>
                    <select 
                      value={monthlyFormData.vehicleType} 
                      onChange={(e) => setMonthlyFormData({...monthlyFormData, vehicleType: e.target.value})} 
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C] bg-white font-medium shadow-xs" 
                      required
                    >
                      <option value="Mini">Mini</option>
                      <option value="Sedan">Sedan</option>
                      <option value="SUV/MPV">SUV/MPV</option>
                      <option value="Luxury Car">Luxury Car</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Hours Per Day *</label>
                    <select 
                      value={monthlyFormData.hoursPerDay} 
                      onChange={(e) => setMonthlyFormData({...monthlyFormData, hoursPerDay: e.target.value})} 
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C] bg-white font-medium shadow-xs" 
                      required
                    >
                      <option value="8">8 Hours</option>
                      <option value="10">10 Hours</option>
                      <option value="12">12 Hours</option>
                      <option value="1 day">1 Day</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Days Per Week *</label>
                    <select 
                      value={monthlyFormData.daysPerWeek} 
                      onChange={(e) => setMonthlyFormData({...monthlyFormData, daysPerWeek: e.target.value})} 
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C] bg-white font-medium shadow-xs" 
                      required
                    >
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

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Extra Per Hour (₹) *</label>
                    <input 
                      type="number" 
                      value={monthlyFormData.extraPerHour} 
                      onChange={(e) => setMonthlyFormData({...monthlyFormData, extraPerHour: e.target.value})} 
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C] bg-white font-medium shadow-xs" 
                      required 
                      placeholder="e.g. 90" 
                    />
                  </div>

                  {monthlyFormData.hoursPerDay !== '1 day' ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Charge for 5 Days (₹)</label>
                        <input 
                          type="number" 
                          value={monthlyFormData.charge5Days} 
                          onChange={(e) => setMonthlyFormData({...monthlyFormData, charge5Days: e.target.value})} 
                          className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C] bg-white font-medium shadow-xs" 
                          placeholder="e.g. 18000" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Charge for 6 Days (₹)</label>
                        <input 
                          type="number" 
                          value={monthlyFormData.charge6Days} 
                          onChange={(e) => setMonthlyFormData({...monthlyFormData, charge6Days: e.target.value})} 
                          className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C] bg-white font-medium shadow-xs" 
                          placeholder="e.g. 20000" 
                        />
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Charge (₹) *</label>
                      <input 
                        type="number" 
                        value={monthlyFormData.charge5Days} 
                        onChange={(e) => setMonthlyFormData({...monthlyFormData, charge5Days: e.target.value})} 
                        className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C] bg-white font-medium shadow-xs" 
                        placeholder="e.g. 850" 
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={closeMonthlyModal} 
                    className="flex-1 py-2.5 text-xs sm:text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#0B192C] rounded-xl hover:bg-[#1E3E62] transition shadow-sm cursor-pointer"
                  >
                    {editingMonthly ? 'Update Pricing' : 'Add Monthly Pricing'}
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
