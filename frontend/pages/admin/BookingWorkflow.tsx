import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/config.js';

const API_URL = API_BASE_URL + '/api';

export default function BookingWorkflow() {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingDrivers, setBookingDrivers] = useState({});
  const [driverCounts, setDriverCounts] = useState({ LOCAL: 0, OUTSTATION: 0, ALL_PREMIUM: 0 });
  const [leadCounts, setLeadCounts] = useState({ LOCAL: 0, OUTSTATION: 0 });
  const [filters, setFilters] = useState({ bookingType: '', serviceType: '', paymentStatus: '' });
  const [packages, setPackages] = useState([]);
  const [leadPackages, setLeadPackages] = useState([]);

  useEffect(() => {
    fetchPendingBookings();
    fetchDriverCounts();
    fetchLeadCounts();
    fetchPackages();
    fetchLeadPackages();
  }, [filters]);

  const fetchPackages = async () => {
    try {
      const res = await axios.get(`${API_URL}/subscriptions/plans`, { withCredentials: true });
      setPackages(Array.isArray(res.data) ? res.data.filter(p => p.isActive) : []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchLeadPackages = async () => {
    try {
      const res = await axios.get(`${API_URL}/lead-subscriptions/plans`, { withCredentials: true });
      setLeadPackages(res.data?.plans ? res.data.plans.filter(p => p.isActive) : []);
    } catch (error) {
      console.error('Error fetching lead packages:', error);
    }
  };

  const fetchDriverCounts = async () => {
    try {
      const localDrivers = await axios.get(`${API_URL}/drivers/count-by-type/LOCAL`, { withCredentials: true });
      const outstationDrivers = await axios.get(`${API_URL}/drivers/count-by-type/OUTSTATION`, { withCredentials: true });
      
      setDriverCounts({
        LOCAL: localDrivers.data.count || 0,
        OUTSTATION: outstationDrivers.data.count || 0,
        ALL_PREMIUM: 0
      });
    } catch (error) {
      console.error('Error fetching driver counts:', error);
    }
  };

  const fetchLeadCounts = async () => {
    try {
      const localLeads = await axios.get(`${API_URL}/leads/count-by-type/LOCAL`, { withCredentials: true });
      const outstationLeads = await axios.get(`${API_URL}/leads/count-by-type/OUTSTATION`, { withCredentials: true });
      
      setLeadCounts({
        LOCAL: localLeads.data.count || 0,
        OUTSTATION: outstationLeads.data.count || 0
      });
    } catch (error) {
      console.error('Error fetching lead counts:', error);
    }
  };

  const fetchPendingBookings = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.bookingType) params.append('bookingType', filters.bookingType);
      if (filters.serviceType) params.append('serviceType', filters.serviceType);
      
      const res = await axios.get(`${API_URL}/booking-workflow/admin/pending?${params}`, { withCredentials: true });
      setPendingBookings(res.data.bookings);
      setFilteredBookings(res.data.bookings);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const fetchAvailableDrivers = async (bookingId, packageId) => {
    try {
      const isLeadPackage = packageId.startsWith('lead-');
      const actualPackageId = isLeadPackage ? packageId.replace('lead-', '') : packageId;
      
      if (isLeadPackage) {
        const selectedPackage = leadPackages.find(p => p.id === actualPackageId);
        if (!selectedPackage) return;
        
        const res = await axios.get(`${API_URL}/leads/count-by-type/${selectedPackage.type}`, { withCredentials: true });
        setBookingDrivers({
          ...bookingDrivers,
          [bookingId]: {
            packageId: actualPackageId,
            packageType: selectedPackage.type,
            packageName: selectedPackage.name,
            drivers: [],
            leads: res.data.count || 0,
            isLeadPackage: true
          }
        });
      } else {
        const selectedPackage = packages.find(p => p.id === packageId);
        if (!selectedPackage) return;
        
        const res = await axios.get(`${API_URL}/drivers/available/${packageId}`, { withCredentials: true });
        setBookingDrivers({
          ...bookingDrivers,
          [bookingId]: {
            packageId,
            packageType: selectedPackage.type,
            packageName: selectedPackage.name,
            drivers: res.data.drivers || [],
            isLeadPackage: false
          }
        });
      }
    } catch (error) {
      console.error('Error fetching drivers/leads:', error);
      setBookingDrivers({
        ...bookingDrivers,
        [bookingId]: {
          packageId: '',
          packageType: '',
          packageName: '',
          drivers: [],
          isLeadPackage: false
        }
      });
    }
  };

  const reviewBooking = async (bookingId, packageType, packageId, isLeadPackage) => {
    try {
      setLoading(true);
      
      if (isLeadPackage) {
        const sendResponse = await axios.post(`${API_URL}/booking-workflow/admin/${bookingId}/send-to-leads`, 
          { leadPackageId: packageId }, 
          { withCredentials: true }
        );
        
        if (sendResponse.data.success) {
          alert(`✓ Booking sent to ${sendResponse.data.leadsCount} leads!`);
          setBookingDrivers({});
          fetchPendingBookings();
        }
      } else {
        await axios.put(`${API_URL}/booking-workflow/admin/${bookingId}/review`, 
          { selectedPackageType: packageType, selectedPackageId: packageId }, 
          { withCredentials: true }
        );
        const sendResponse = await axios.post(`${API_URL}/booking-workflow/admin/${bookingId}/send-to-drivers`, {}, { withCredentials: true });
        
        if (sendResponse.data.success) {
          alert(`✓ Booking sent to ${sendResponse.data.driversCount} drivers!`);
          setBookingDrivers({});
          fetchPendingBookings();
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error sending booking';
      alert(`⚠️ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const viewResponses = async (bookingId, isLeadBooking = false) => {
    try {
      const endpoint = isLeadBooking 
        ? `${API_URL}/booking-workflow/admin/${bookingId}/lead-responses`
        : `${API_URL}/booking-workflow/admin/${bookingId}/responses`;
      const res = await axios.get(endpoint, { withCredentials: true });
      setResponses(isLeadBooking ? res.data.responses : res.data.responses);
      setSelectedBooking(bookingId);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const allocateDriver = async (personId, isLead = false) => {
    try {
      const endpoint = isLead 
        ? `${API_URL}/booking-workflow/admin/${selectedBooking}/allocate-lead`
        : `${API_URL}/booking-workflow/admin/${selectedBooking}/allocate-driver`;
      const payload = isLead ? { leadId: personId } : { driverId: personId };
      
      await axios.post(endpoint, payload, { withCredentials: true });
      alert(`${isLead ? 'Lead' : 'Driver'} allocated!`);
      setSelectedBooking(null);
      fetchPendingBookings();
    } catch (error) {
      alert(error.response?.data?.error || 'Error');
    }
  };

  return (
    <div className="w-full py-4">
      {!selectedBooking ? (
        <div className="space-y-4 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Pending Bookings</h2>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <select 
                value={filters.paymentStatus} 
                onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Payments</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
              </select>
              
              <select 
                value={filters.bookingType} 
                onChange={(e) => handleFilterChange('bookingType', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Booking Types</option>
                <option value="One-way Trip">One-way Trip</option>
                <option value="Round Trip">Round Trip</option>
                <option value="Hourly">Hourly</option>
              </select>
              
              <select 
                value={filters.serviceType} 
                onChange={(e) => handleFilterChange('serviceType', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Service Types</option>
                <option value="Local - Hourly">Local - Hourly</option>
                <option value="Outstation">Outstation</option>
              </select>
            </div>
          </div>
          
          {/* Driver Availability Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">LOCAL Drivers</p>
                  <p className="text-2xl font-bold text-gray-900">{driverCounts.LOCAL}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">OUTSTATION Drivers</p>
                  <p className="text-2xl font-bold text-gray-900">{driverCounts.OUTSTATION}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">LOCAL Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{leadCounts.LOCAL}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">OUTSTATION Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{leadCounts.OUTSTATION}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No pending bookings</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date & Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Route</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredBookings.map(booking => {
                      const startDate = new Date(booking.startDateTime);
                      const formattedDate = startDate.toLocaleDateString('en-GB').replace(/\//g, '-');
                      const formattedTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      
                      return (
                        <tr key={booking.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-4">
                            <p className="text-sm text-gray-500">{formattedTime}</p>
                            <p className="text-xs text-gray-400">{formattedDate}</p>
                          </td>
                          <td className="px-4 py-4">
                            {booking.estimateAmount && (
                              <p className="text-base font-bold text-gray-900">₹{booking.estimateAmount}</p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-block bg-yellow-100 text-yellow-700 text-xs px-2.5 py-1 rounded-full font-medium">PENDING</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${
                                booking.advancePayment > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {booking.advancePayment > 0 ? 'PAID' : 'UNPAID'}
                              </span>
                              {booking.paymentMethod && (
                                <div>
                                  <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium">{booking.paymentMethod}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-gray-700 font-semibold text-xs">{booking.customer?.name?.charAt(0) || 'C'}</span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{booking.customer?.name || 'N/A'}</p>
                                <p className="text-xs text-gray-600">{booking.customer?.phone || 'N/A'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <div className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-gray-900 rounded-full mt-1 flex-shrink-0"></div>
                                <p className="text-xs text-gray-900 font-medium">{booking.pickupLocation}</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-gray-900 rounded-full mt-1 flex-shrink-0"></div>
                                <p className="text-xs text-gray-900 font-medium">{booking.dropLocation}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium">{booking.bookingType}</span>
                              {booking.serviceType && (
                                <div>
                                  <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">{booking.serviceType}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {!booking.selectedPackageType && !booking.selectedLeadPackageId ? (
                              <div className="space-y-2">
                                <select
                                  onChange={(e) => e.target.value && fetchAvailableDrivers(booking.id, e.target.value)}
                                  disabled={loading}
                                  className="w-full bg-black text-white px-3 py-2 rounded-lg font-semibold text-xs hover:bg-gray-800 disabled:opacity-50 transition cursor-pointer"
                                  defaultValue=""
                                >
                                  <option value="" disabled className="bg-white text-black">Select Package</option>
                                  <optgroup label="Driver Packages" className="bg-white text-black">
                                    {packages.map(pkg => (
                                      <option key={pkg.id} value={pkg.id} className="bg-white text-black">
                                        {pkg.name} - ₹{pkg.price}
                                      </option>
                                    ))}
                                  </optgroup>
                                  <optgroup label="Lead Packages" className="bg-white text-black">
                                    {leadPackages.map(pkg => (
                                      <option key={`lead-${pkg.id}`} value={`lead-${pkg.id}`} className="bg-white text-black">
                                        {pkg.name} - ₹{pkg.price} (Lead)
                                      </option>
                                    ))}
                                  </optgroup>
                                </select>
                                
                                {bookingDrivers[booking.id] && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-xs font-semibold text-gray-700 mb-2">
                                      {bookingDrivers[booking.id].packageName}: {bookingDrivers[booking.id].isLeadPackage ? bookingDrivers[booking.id].leads : bookingDrivers[booking.id].drivers.length} Available
                                    </p>
                                    {(bookingDrivers[booking.id].isLeadPackage ? bookingDrivers[booking.id].leads > 0 : bookingDrivers[booking.id].drivers.length > 0) ? (
                                      <button 
                                        onClick={() => reviewBooking(booking.id, bookingDrivers[booking.id].packageType, bookingDrivers[booking.id].packageId, bookingDrivers[booking.id].isLeadPackage)} 
                                        disabled={loading}
                                        className="w-full bg-green-600 text-white px-3 py-2 rounded-lg font-semibold text-xs hover:bg-green-700 disabled:opacity-50 transition"
                                      >
                                        Send to {bookingDrivers[booking.id].isLeadPackage ? bookingDrivers[booking.id].leads : bookingDrivers[booking.id].drivers.length} {bookingDrivers[booking.id].isLeadPackage ? 'Lead' : 'Driver'}{(bookingDrivers[booking.id].isLeadPackage ? bookingDrivers[booking.id].leads : bookingDrivers[booking.id].drivers.length) !== 1 ? 's' : ''}
                                      </button>
                                    ) : (
                                      <p className="text-xs text-red-600">No {bookingDrivers[booking.id].isLeadPackage ? 'leads' : 'drivers'} available</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="bg-green-50 rounded-lg p-2">
                                  <p className="text-xs font-medium text-green-800">
                                    ✓ Sent to {booking.selectedLeadPackageId ? `${booking.selectedPackageType || 'LOCAL'} Leads` : `${booking.selectedPackageType} Drivers`}
                                  </p>
                                </div>
                                <button 
                                  onClick={() => viewResponses(booking.id, !!booking.selectedLeadPackageId)} 
                                  className="w-full bg-black text-white px-3 py-2 rounded-lg font-semibold text-xs hover:bg-gray-800 transition"
                                >
                                  View ({booking.selectedLeadPackageId ? (booking.leadResponses?.length || 0) : (booking.driverResponses?.length || 0)})
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <button 
            onClick={() => setSelectedBooking(null)} 
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Driver/Lead Responses</h2>
          
          {responses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No responses yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {responses.map(response => {
                const person = response.driver || response.lead;
                const isAccepted = response.status === 'ACCEPTED';
                return (
                  <div key={response.id} className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden ${isAccepted ? 'border-green-200' : response.status === 'REJECTED' ? 'border-red-200' : 'border-gray-200'}`}>
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg ${isAccepted ? 'bg-green-600 text-white' : response.status === 'REJECTED' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'}`}>
                          {person?.name?.[0] || 'D'}
                        </div>
                        <div className="flex-1">
                          <p className="text-base font-semibold text-gray-900">{person?.name || 'Driver'}</p>
                          <p className="text-sm text-gray-600">{person?.phone || 'N/A'}</p>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${isAccepted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {response.status}
                        </span>
                        {person?.rating && (
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-sm font-semibold text-gray-900">{person.rating}</span>
                          </div>
                        )}
                      </div>
                      
                      {(person?.vehicleType || person?.vehicleNo) && (
                        <div className="bg-gray-50 rounded-xl p-3 mb-4">
                          <p className="text-xs text-gray-500 mb-1 font-medium">Vehicle</p>
                          <p className="text-sm font-semibold text-gray-900">{person.vehicleType} • {person.vehicleNo}</p>
                        </div>
                      )}
                      
                      {isAccepted && (
                        <button 
                          onClick={() => allocateDriver(person.id, !!response.lead)} 
                          className="w-full bg-black text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 transition active:scale-95"
                        >
                          Allocate This {response.driver ? 'Driver' : 'Lead'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
