import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig.js';
import { API_BASE_URL } from '../../api/config.js';

export default function PendingDriverApproval() {
  const [bookingsWithAcceptedDrivers, setBookingsWithAcceptedDrivers] = useState([]);
  const [allocatedBookings, setAllocatedBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING or ALLOCATED
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [acceptedDrivers, setAcceptedDrivers] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [driverBusyStatus, setDriverBusyStatus] = useState({});
  const [showChooseDriver, setShowChooseDriver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [cancellationHistory, setCancellationHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const refreshData = () => {
      fetchBookingsWithAcceptedDrivers();
      fetchAllocatedBookings();
      fetchCancellationRequests();
      fetchCancellationHistory();
    };
    
    refreshData(); // Initial load
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(refreshData, 15000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchBookingsWithAcceptedDrivers = async () => {
    try {
      const res = await apiClient.get('/booking-workflow/admin/pending');
      const bookings = res.data.bookings || [];
      
      // Show ALL bookings that are not allocated yet
      const sentBookings = bookings.filter(b => !b.allocatedDriverId);
      setBookingsWithAcceptedDrivers(sentBookings);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchAllocatedBookings = async () => {
    try {
      const res = await apiClient.get('/booking-workflow/admin/allocated');
      setAllocatedBookings(res.data.bookings || []);
    } catch (error) {
      console.error('Error fetching allocated bookings:', error);
    }
  };

  const fetchCancellationRequests = async () => {
    try {
      const res = await apiClient.get('/booking-workflow/admin/cancellation-requests');
      setCancellationRequests(res.data.bookings || []);
    } catch (error) {
      console.error('Error fetching cancellation requests:', error);
    }
  };

  const fetchCancellationHistory = async () => {
    try {
      const res = await apiClient.get('/booking-workflow/admin/cancellation-history');
      setCancellationHistory(res.data.bookings || []);
    } catch (error) {
      console.error('Error fetching cancellation history:', error);
    }
  };

  const viewAcceptedDrivers = async (booking) => {
    try {
      setLoading(true);
      const isLeadBooking = !!booking.selectedLeadPackageId;
      const endpoint = isLeadBooking 
        ? `/booking-workflow/admin/${booking.id}/lead-responses`
        : `/booking-workflow/admin/${booking.id}/responses`;
      const res = await apiClient.get(endpoint);
      setAcceptedDrivers(res.data.acceptedDrivers || res.data.acceptedLeads || []);
      setSelectedBooking(booking);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkDriverTimeConflict = async (driverId) => {
    try {
      const tripsRes = await apiClient.get(`/reports/drivers/${driverId}/trips`);
      const trips = tripsRes.data?.trips || [];
      
      // Check if driver has any active or upcoming trips that might conflict
      const conflictingTrip = trips.find(trip => 
        trip.status && ['STARTED', 'ASSIGNED', 'ACCEPTED', 'PENDING', 'ONGOING'].includes(trip.status)
      );
      
      return !!conflictingTrip;
    } catch (error) {
      console.error('Error checking driver conflicts:', error);
      return false;
    }
  };

  const deallocateCurrentDriver = async () => {
    try {
      const currentDriverId = selectedBooking.allocatedDriverId || selectedBooking.driverId;
      if (currentDriverId) {
        await apiClient.post(
          `/booking-workflow/admin/${selectedBooking.id}/deallocate-driver`,
          { driverId: currentDriverId }
        );
        console.log('Current driver deallocated');
      }
    } catch (error) {
      console.error('Error deallocating current driver:', error);
    }
  };

  const approveDriver = async (personId, isLead = false, forceAllocate = false) => {
    try {
      // Check for time conflicts on available drivers
      if (forceAllocate) {
        const hasConflict = await checkDriverTimeConflict(personId);
        if (hasConflict) {
          alert('⚠️ This driver is busy with another booking at the same time');
          return;
        }

        // If replacing an existing driver normally, deallocate them first
        if (selectedBooking.allocatedDriverId || selectedBooking.driverId) {
          await deallocateCurrentDriver();
        }
      }
      
      let endpoint;
      let payload;
      
      if (isLead) {
        endpoint = `/booking-workflow/admin/${selectedBooking.id}/allocate-lead`;
        payload = { leadId: personId };
      } else if (forceAllocate) {
        // For available drivers - send as new request instead of direct allocation
        endpoint = `/booking-workflow/admin/${selectedBooking.id}/offer-driver`;
        payload = { driverId: personId };
      } else {
        // For drivers who accepted
        endpoint = `/booking-workflow/admin/${selectedBooking.id}/allocate-driver`;
        payload = { driverId: personId };
      }
      
      await apiClient.post(endpoint, payload);
      
      if (forceAllocate) {
        alert(`✓ Previous driver cancelled and new booking request sent!`);
      } else {
        alert(`✓ ${isLead ? 'Lead' : 'Driver'} approved and allocated!`);
      }
      
      setSelectedBooking(null);
      setShowChooseDriver(false);
      fetchBookingsWithAcceptedDrivers();
    } catch (error) {
      alert(error.response?.data?.error || 'Error approving');
    }
  };

  const fetchAllDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const res = await apiClient.get('/admin/drivers');
      // res.data is the array of drivers from admin controller
      setAllDrivers(Array.isArray(res.data) ? res.data : (res.data?.drivers || []));
      
      const busyStatus = {};
      // We are skipping the N+1 API calls to avoid overwhelming the server
      setDriverBusyStatus(busyStatus);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleChooseAnotherDriver = async () => {
    setShowChooseDriver(true);
    await fetchAllDrivers();
  };

  if (selectedBooking) {
    return (
      <div className="px-3 sm:px-6 py-4 sm:py-6">
        <button 
          onClick={() => {
            setSelectedBooking(null);
            setShowChooseDriver(false);
          }} 
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black transition mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Booking Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-sm text-gray-500">Customer: {selectedBooking.customer?.name}</p>
              <p className="text-xs text-gray-500">{selectedBooking.customer?.phone}</p>
            </div>
            <p className="text-xl font-bold text-gray-900">₹{selectedBooking.estimateAmount}</p>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-gray-900 rounded-full mt-1"></div>
              <p className="text-sm">{selectedBooking.pickupLocation}</p>
            </div>
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-gray-900 rounded-full mt-1"></div>
              <p className="text-sm">{selectedBooking.dropLocation}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => setShowChooseDriver(false)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
              !showChooseDriver 
                ? 'bg-black text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approve & Allocate
          </button>
          <button 
            onClick={handleChooseAnotherDriver}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
              showChooseDriver 
                ? 'bg-black text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Choose Another Driver
          </button>
        </div>

        {/* Accepted Drivers List */}
        {!showChooseDriver && (
          <>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">{selectedBooking.selectedLeadPackageId ? 'Leads' : 'Drivers'} Who Accepted</h2>
            {acceptedDrivers.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <p className="text-gray-500 text-sm">No {selectedBooking.selectedLeadPackageId ? 'leads' : 'drivers'} have accepted yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {acceptedDrivers.map(response => {
                  const person = response.driver || response.lead;
                  const isLead = !!response.lead;
                  return (
                    <div key={response.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1">
                          <p className="text-base font-semibold text-gray-900">{person?.name || (isLead ? 'Lead' : 'Driver')}</p>
                          <p className="text-sm text-gray-600">{person?.phone || 'N/A'}</p>
                        </div>
                        {person?.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-sm font-semibold text-gray-900">{Number(person.rating).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      
                      {(person?.vehicleType || person?.vehicleNo) && (
                        <div className="bg-gray-50 rounded-xl p-3 mb-4">
                          <p className="text-xs text-gray-500 mb-1 font-medium">Vehicle</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {person.vehicleType || 'N/A'} • {person.vehicleNo || 'N/A'}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={async () => {
                            try {
                              const endpoint = isLead 
                                ? `/booking-workflow/admin/${selectedBooking.id}/reject-driver-response`
                                : `/booking-workflow/admin/${selectedBooking.id}/reject-driver-response`;
                              const payload = isLead ? { leadId: person.id } : { driverId: person.id };
                              await apiClient.put(endpoint, payload);
                              viewAcceptedDrivers(selectedBooking); // refresh list
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="w-1/3 bg-red-50 text-red-600 px-4 py-3 rounded-xl font-semibold text-sm hover:bg-red-100 transition"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => approveDriver(person.id, isLead)} 
                          className="w-2/3 bg-green-600 text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition"
                        >
                          Approve & Allocate {isLead ? 'Lead' : 'Driver'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Choose Another Driver */}
        {showChooseDriver && (
          <>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Available Drivers</h2>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search name or phone..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition w-full sm:w-64 shadow-sm"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            {loadingDrivers ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <p className="text-gray-500 text-sm">Loading drivers...</p>
              </div>
            ) : allDrivers.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <p className="text-gray-500 text-sm">No drivers available</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Driver</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allDrivers.filter(driver => {
                        const allocatedDriverIds = acceptedDrivers.map(r => r.driver?.id).filter(Boolean);
                        const isNotAllocated = !allocatedDriverIds.includes(driver.id) && driver.id !== selectedBooking.allocatedDriverId;
                        
                        if (!isNotAllocated) return false;
                        
                        if (searchQuery.trim() === '') return true;
                        const q = searchQuery.toLowerCase();
                        return (driver.name?.toLowerCase().includes(q) || driver.phone?.includes(q) || driver.vehicleNo?.toLowerCase().includes(q));
                      }).map((driver, index) => {
                        const isBusy = driverBusyStatus[driver.id];
                        return (
                          <tr key={driver.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-4">
                              <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{driver?.name || 'Driver'}</p>
                                    {driver?.rating > 0 && (
                                      <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-100 flex-shrink-0">
                                        <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span className="text-[10px] font-bold text-yellow-700">{driver.rating}</span>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 truncate">{driver?.phone || 'N/A'}</p>
                                </div>
                              </td>
                            <td className="px-4 py-4">
                              {isBusy ? (
                                <span className="inline-block bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-red-200">
                                  Busy
                                </span>
                              ) : (
                                <span className="inline-block bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-green-200">
                                  Available
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <button 
                                onClick={() => approveDriver(driver.id, false, true)} 
                                disabled={isBusy}
                                className={`px-4 py-2 rounded-lg font-semibold text-xs transition ${
                                  isBusy 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                                    : 'bg-black text-white hover:bg-gray-800'
                                }`}
                              >
                                Allocate
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
          </>
        )}
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-6 py-4 sm:py-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Driver Approvals</h2>
          <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-full border border-green-200" title="Data updates automatically every 15 seconds">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider hidden sm:inline-block">Live Refresh</span>
          </div>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'PENDING' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Pending Approvals
            {bookingsWithAcceptedDrivers.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                {bookingsWithAcceptedDrivers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('ALLOCATED')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'ALLOCATED' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Allocated Records
          </button>
          <button
            onClick={() => setActiveTab('CANCELLATIONS')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'CANCELLATIONS' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Cancellation Requests
            {cancellationRequests.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                {cancellationRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'HISTORY' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            History
          </button>
        </div>
      </div>
      
      {activeTab === 'PENDING' ? (
        bookingsWithAcceptedDrivers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No bookings waiting for driver approval</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Route</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Package</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Approval</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookingsWithAcceptedDrivers.map((booking, index) => {
                  const acceptedCount = (booking.driverResponses?.filter(r => r.status === 'ACCEPTED').length || 0) + 
                                       (booking.leadResponses?.filter(r => r.status === 'ACCEPTED').length || 0);
                  
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-gray-900">{index + 1}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-xs">{booking.customer?.name?.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{booking.customer?.name}</p>
                            <p className="text-xs text-gray-600">{booking.customer?.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-900 font-medium">{booking.pickupLocation}</p>
                          <p className="text-xs text-gray-500">→ {booking.dropLocation}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-base font-bold text-gray-900">₹{booking.estimateAmount}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
                          {booking.selectedLeadPackageId ? 'LEAD' : booking.selectedPackageType}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                             const acceptedDrivers = booking.driverResponses?.filter(r => r.status === 'ACCEPTED').map(r => r.driver?.name) || [];
                             const acceptedLeads = booking.leadResponses?.filter(r => r.status === 'ACCEPTED').map(r => r.lead?.name) || [];
                             const allNames = [...acceptedDrivers, ...acceptedLeads].filter(Boolean);
                             
                             if (allNames.length === 0) {
                               return <span className="text-xs text-gray-400">None yet</span>;
                             }
                             return allNames.map((name, i) => (
                               <span key={i} className="inline-block bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                                 {name}
                               </span>
                             ));
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button 
                          onClick={() => viewAcceptedDrivers(booking)}
                          disabled={loading}
                          className="bg-black text-white px-3 py-2 rounded-lg font-semibold text-xs hover:bg-gray-800 disabled:opacity-50 transition"
                        >
                          Review & Allocate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )
      ) : activeTab === 'CANCELLATIONS' ? (
        cancellationRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500 text-sm">No cancellation requests pending</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Route</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Driver</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cancellationRequests.map((booking, index) => {
                  const driverName = booking.driver?.name || booking.lead?.name || 'N/A';
                  const driverPhone = booking.driver?.phone || booking.lead?.phone || 'N/A';
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4"><p className="text-sm font-semibold text-gray-900">{index + 1}</p></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{booking.customer?.name}</p>
                            <p className="text-xs text-gray-600">{booking.customer?.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-900 font-medium">{booking.pickupLocation}</p>
                          <p className="text-xs text-gray-500">→ {booking.dropLocation}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                            <p className="text-sm font-bold text-gray-900">{driverName}</p>
                            <p className="text-xs text-gray-600">{driverPhone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {booking.cancellationReason ? (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 inline-block px-2 py-1 rounded border border-red-100">
                            {booking.cancellationReason.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 inline-block px-2 py-1 rounded border border-orange-100">
                            REQUESTED BY DRIVER
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4"><p className="text-base font-bold text-gray-900">₹{booking.estimateAmount}</p></td>
                      <td className="px-4 py-4 flex gap-2">
                        <button
                          onClick={async () => {
                            const isCustomer = booking.cancellationReason === 'Requested by Customer';
                            
                            if (isCustomer) {
                              if(window.confirm('Approve customer cancellation?')) {
                                try {
                                  await apiClient.post(`/booking-workflow/admin/${booking.id}/approve-cancellation`);
                                  fetchCancellationRequests();
                                  fetchAllocatedBookings();
                                } catch (e) {
                                  alert(e.response?.data?.error || 'Failed to approve cancellation');
                                }
                              }
                            } else {
                              if(window.confirm('Approve driver cancellation? This will deduct 1 duty and remove the driver immediately.')) {
                                try {
                                  await apiClient.post(`/booking-workflow/admin/${booking.id}/reallocate-cancellation`);
                                  fetchCancellationRequests();
                                  fetchAllocatedBookings();
                                  setSelectedBooking({ ...booking, driverId: null, allocatedDriverId: null, cancellationRequested: false });
                                  handleChooseAnotherDriver();
                                } catch (e) {
                                  alert(e.response?.data?.error || 'Failed to re-allocate');
                                }
                              }
                            }
                          }}
                          className="bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold text-xs hover:bg-green-700 transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={async () => {
                            if(window.confirm('Reject cancellation? The trip will remain with the driver.')) {
                              try {
                                await apiClient.post(`/booking-workflow/admin/${booking.id}/reject-cancellation`);
                                fetchCancellationRequests();
                              } catch (e) {
                                alert(e.response?.data?.error || 'Failed to reject cancellation');
                              }
                            }
                          }}
                          className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-semibold text-xs hover:bg-red-100 transition"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )
      ) : activeTab === 'ALLOCATED' ? (
        allocatedBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500 text-sm">No allocated drivers yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Route</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Allocated Driver</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allocatedBookings.map((booking, index) => {
                  const driverName = booking.driver?.name || booking.lead?.name || 'N/A';
                  const driverPhone = booking.driver?.phone || booking.lead?.phone || 'N/A';
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4"><p className="text-sm font-semibold text-gray-900">{index + 1}</p></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{booking.customer?.name}</p>
                            <p className="text-xs text-gray-600">{booking.customer?.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-900 font-medium">{booking.pickupLocation}</p>
                          <p className="text-xs text-gray-500">→ {booking.dropLocation}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                            <p className="text-sm font-bold text-gray-900">{driverName}</p>
                            <p className="text-xs text-gray-600">{driverPhone}</p>
                          </div>
                      </td>
                      <td className="px-4 py-4">
                        {booking.status === 'CANCELLED' ? (
                          <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-[10px] font-bold border border-red-200 whitespace-nowrap">
                            CANCELLED
                          </span>
                        ) : booking.cancellationRequested ? (
                          <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded text-[10px] font-bold border border-orange-200 whitespace-nowrap">
                            Cancel Pending
                          </span>
                        ) : (
                          <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-[10px] font-bold border border-green-400 whitespace-nowrap shadow-sm">
                            ACCEPTED
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4"><p className="text-base font-bold text-gray-900">₹{booking.estimateAmount}</p></td>
                      <td className="px-4 py-4">
                        <p className="text-xs text-gray-500">{new Date(booking.allocatedAt || booking.createdAt).toLocaleDateString()}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )
      ) : activeTab === 'HISTORY' ? (
        cancellationHistory.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500 text-sm">No cancellation history available</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Route</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Driver (If Any)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cancellationHistory.map((booking, index) => {
                  const driverName = booking.driver?.name || booking.lead?.name || 'N/A';
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4"><p className="text-sm font-semibold text-gray-900">{index + 1}</p></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{booking.customer?.name}</p>
                            <p className="text-xs text-gray-600">{booking.customer?.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-900 font-medium">{booking.pickupLocation}</p>
                          <p className="text-xs text-gray-500">→ {booking.dropLocation}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                            <p className="text-sm font-bold text-gray-900">{driverName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {booking.cancellationReason ? (
                          <span className="text-[10px] font-bold text-gray-600 bg-gray-100 inline-block px-2 py-1 rounded border border-gray-200">
                            {booking.cancellationReason.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-600 bg-gray-100 inline-block px-2 py-1 rounded border border-gray-200">
                            CANCELLED
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4"><p className="text-base font-bold text-gray-900">₹{booking.estimateAmount}</p></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}
