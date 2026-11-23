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
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  const [showFreeListingModal, setShowFreeListingModal] = useState(false);
  const [freeListingTarget, setFreeListingTarget] = useState(null);
  const [freeListingFee, setFreeListingFee] = useState('50');
  const [publishingFreeListing, setPublishingFreeListing] = useState(false);

  const openFreeListingModal = (booking) => {
    setFreeListingTarget(booking);
    setFreeListingFee(booking.freeListingFee ? String(booking.freeListingFee) : '50');
    setShowFreeListingModal(true);
  };

  const handlePublishFreeListing = async () => {
    if (!freeListingTarget) return;
    const feeNum = parseFloat(freeListingFee);
    if (isNaN(feeNum) || feeNum < 0) {
      alert('Please enter a valid unlock fee');
      return;
    }
    try {
      setPublishingFreeListing(true);
      await apiClient.post(`/booking-workflow/admin/${freeListingTarget.id}/publish-free-listing`, {
        fee: feeNum
      });
      alert('✓ Ride published to Free Listing! All drivers can now view and claim this ride.');
      setShowFreeListingModal(false);
      setFreeListingTarget(null);
      fetchBookingsWithAcceptedDrivers();
      if (selectedBooking && selectedBooking.id === freeListingTarget.id) {
        setSelectedBooking(prev => ({ ...prev, isFreeListing: true, freeListingFee: feeNum }));
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to publish to Free Listing');
    } finally {
      setPublishingFreeListing(false);
    }
  };

  const handleUnpublishFreeListing = async (bookingId) => {
    if (!window.confirm('Are you sure you want to remove this ride from Free Listing?')) return;
    try {
      await apiClient.post(`/booking-workflow/admin/${bookingId}/unpublish-free-listing`);
      alert('✓ Ride removed from Free Listing');
      fetchBookingsWithAcceptedDrivers();
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking(prev => ({ ...prev, isFreeListing: false }));
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to remove from Free Listing');
    }
  };

  const matchesDriverSearch = (booking, query) => {
    if (!query || !query.trim()) return true;
    const q = query.toLowerCase().trim();

    // Check direct driver/lead fields
    const dName = (booking.driver?.name || '').toLowerCase();
    const dPhone = (booking.driver?.phone || '').toLowerCase();
    const lName = (booking.lead?.name || '').toLowerCase();
    const lPhone = (booking.lead?.phone || '').toLowerCase();
    if (dName.includes(q) || dPhone.includes(q) || lName.includes(q) || lPhone.includes(q)) {
      return true;
    }

    // Check customer fields (name, phone, pickup/drop)
    const cName = (booking.customer?.name || '').toLowerCase();
    const cPhone = (booking.customer?.phone || '').toLowerCase();
    const pickup = (booking.pickupLocation || '').toLowerCase();
    const drop = (booking.dropLocation || '').toLowerCase();
    if (cName.includes(q) || cPhone.includes(q) || pickup.includes(q) || drop.includes(q)) {
      return true;
    }

    // Check driver responses
    if (Array.isArray(booking.driverResponses)) {
      for (const r of booking.driverResponses) {
        const name = (r.driver?.name || '').toLowerCase();
        const phone = (r.driver?.phone || '').toLowerCase();
        if (name.includes(q) || phone.includes(q)) return true;
      }
    }

    // Check lead responses
    if (Array.isArray(booking.leadResponses)) {
      for (const r of booking.leadResponses) {
        const name = (r.lead?.name || '').toLowerCase();
        const phone = (r.lead?.phone || '').toLowerCase();
        if (name.includes(q) || phone.includes(q)) return true;
      }
    }

    // Check acceptedDrivers if present in booking
    if (Array.isArray(booking.acceptedDrivers)) {
      for (const d of booking.acceptedDrivers) {
        const name = (typeof d === 'string' ? d : d.name || '').toLowerCase();
        const phone = (d.phone || '').toLowerCase();
        if (name.includes(q) || phone.includes(q)) return true;
      }
    }

    return false;
  };

  const filteredPendingBookings = bookingsWithAcceptedDrivers.filter(b => matchesDriverSearch(b, driverSearchQuery));
  const freeListingBookings = bookingsWithAcceptedDrivers.filter(b => b.isFreeListing);
  const filteredFreeListingBookings = freeListingBookings.filter(b => matchesDriverSearch(b, driverSearchQuery));
  const filteredAllocatedBookings = allocatedBookings.filter(b => matchesDriverSearch(b, driverSearchQuery));
  const filteredCancellationRequests = cancellationRequests.filter(b => matchesDriverSearch(b, driverSearchQuery));
  const filteredCancellationHistory = cancellationHistory.filter(b => matchesDriverSearch(b, driverSearchQuery));

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
      } else {
        // Use allocate-driver for both accepted drivers and forced allocations
        // This will automatically assign the driver and mark them as ACCEPTED
        endpoint = `/booking-workflow/admin/${selectedBooking.id}/allocate-driver`;
        payload = { driverId: personId };
      }
      
      await apiClient.post(endpoint, payload);
      
      if (forceAllocate) {
        alert(`✓ Driver automatically assigned to the trip!`);
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
      const [driversRes, busyRes] = await Promise.all([
        apiClient.get('/admin/drivers'),
        apiClient.get('/admin/busy-drivers')
      ]);
      
      setAllDrivers(Array.isArray(driversRes.data) ? driversRes.data : (driversRes.data?.drivers || []));
      
      const busyIds = busyRes.data?.busyDriverIds || [];
      const busyStatus = {};
      busyIds.forEach(id => busyStatus[id] = true);
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
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#0B192C] transition mb-4"
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
                ? 'bg-[#0B192C] text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approve & Allocate
          </button>
          <button 
            onClick={handleChooseAnotherDriver}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
              showChooseDriver 
                ? 'bg-[#0B192C] text-white' 
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
                <p className="text-gray-500 text-sm">No {selectedBooking.selectedLeadPackageId ? 'leads' : 'drivers'} have accepted yet</p>
                <div className="max-w-md mx-auto p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-amber-900 text-xs sm:text-sm">No drivers with active packages accepted?</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">Open this ride to ALL registered drivers via Free Listing with an unlock fee.</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {selectedBooking.isFreeListing ? (
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-200 text-amber-900 px-3 py-1 rounded-lg text-xs font-black">
                          📢 Listed in Free Listing (₹{selectedBooking.freeListingFee})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUnpublishFreeListing(selectedBooking.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-bold underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openFreeListingModal(selectedBooking)}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded-lg text-xs shadow transition cursor-pointer"
                      >
                        📢 Publish to Free Listing
                      </button>
                    )}
                  </div>
                </div>
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
                  className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C] transition w-full sm:w-64 shadow-sm"
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

                        // Only show drivers with an active subscription plan package
                        const activeSubscription = driver.subscriptions?.find(sub => sub.status === 'ACTIVE');
                        if (!activeSubscription) return false;
                        
                        if (searchQuery.trim() === '') return true;
                        const q = searchQuery.toLowerCase();
                        return (driver.name?.toLowerCase().includes(q) || driver.phone?.includes(q) || driver.vehicleNo?.toLowerCase().includes(q));
                      }).map((driver, index) => {
                        const isBusy = driverBusyStatus[driver.id];
                        const activeSubscription = driver.subscriptions?.find(sub => sub.status === 'ACTIVE');
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
                                        <span className="text-[10px] font-bold text-yellow-700">{Number(driver.rating).toFixed(1)}</span>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 truncate">{driver?.phone || 'N/A'}</p>
                                  {activeSubscription?.plan?.name && (
                                    <span className="mt-1 inline-block bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-blue-200">
                                      {activeSubscription.plan.name} Package
                                    </span>
                                  )}
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
                                    : 'bg-[#0B192C] text-white hover:bg-[#1E3E62]'
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
      {/* Responsive Top Bar: Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 mb-4">
        {/* Title & Live Status */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Driver Approvals</h2>
          <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-full border border-green-200" title="Data updates automatically every 15 seconds">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[11px] font-bold text-green-700 uppercase tracking-wider">
              Live Refresh
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="Search driver, customer, or phone..." 
            value={driverSearchQuery}
            onChange={(e) => setDriverSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C] focus:border-[#0B192C] transition shadow-xs"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {driverSearchQuery && (
            <button
              type="button"
              onClick={() => setDriverSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
              title="Clear search"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Responsive Navigation Tabs */}
      <div className="mb-5 sm:mb-6">
        {/* Mobile Quick Dropdown */}
        <div className="sm:hidden mb-2.5">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Select View</label>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
            className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#0B192C] outline-none shadow-xs"
          >
            <option value="PENDING">Pending Trips ({bookingsWithAcceptedDrivers.length})</option>
            <option value="FREE_LISTING">📢 Free Listing ({freeListingBookings.length})</option>
            <option value="ALLOCATED">Accepted Trips ({allocatedBookings.length})</option>
            <option value="CANCELLATIONS">Cancellation Requests ({cancellationRequests.length})</option>
            <option value="HISTORY">Cancel History ({cancellationHistory.length})</option>
          </select>
        </div>

        {/* Tab Buttons Bar (Smooth Horizontal Scroll on Mobile, Full Width Row on Tablet/Desktop) */}
        <div className="bg-gray-100/90 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar border border-gray-200/70 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center cursor-pointer ${
              activeTab === 'PENDING'
                ? 'bg-[#0B192C] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            Pending Trips
            {bookingsWithAcceptedDrivers.length > 0 && (
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === 'PENDING' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'
              }`}>
                {bookingsWithAcceptedDrivers.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FREE_LISTING')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center cursor-pointer ${
              activeTab === 'FREE_LISTING'
                ? 'bg-amber-500 text-black shadow-sm ring-1 ring-amber-600 font-black'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/80 font-bold'
            }`}
          >
            <span>📢 Free Listing</span>
            {freeListingBookings.length > 0 && (
              <span className="ml-1.5 bg-black text-amber-400 font-black px-2 py-0.5 rounded-full text-[11px]">
                {freeListingBookings.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ALLOCATED')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center cursor-pointer ${
              activeTab === 'ALLOCATED'
                ? 'bg-[#0B192C] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            Accepted Trips
            {allocatedBookings.length > 0 && (
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === 'ALLOCATED' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {allocatedBookings.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CANCELLATIONS')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center cursor-pointer ${
              activeTab === 'CANCELLATIONS'
                ? 'bg-[#0B192C] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            Cancellation Requests
            {cancellationRequests.length > 0 && (
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === 'CANCELLATIONS' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700 animate-pulse'
              }`}>
                {cancellationRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-[#0B192C] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            Cancel History
            {cancellationHistory.length > 0 && (
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === 'HISTORY' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {cancellationHistory.length}
              </span>
            )}
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
            <p className="text-gray-500 text-sm">No pending trips waiting for drivers</p>
          </div>
        ) : filteredPendingBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-gray-700 font-bold text-sm">No pending trips match driver "{driverSearchQuery}"</p>
            <button
              type="button"
              onClick={() => setDriverSearchQuery('')}
              className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
            >
              Clear Search
            </button>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Responses</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPendingBookings.map((booking, index) => {
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
                        <div className="space-y-1 max-w-[200px] sm:max-w-[300px]">
                          <p className="text-xs text-gray-900 font-medium truncate" title={booking.pickupLocation}>{booking.pickupLocation}</p>
                          <p className="text-xs text-gray-500 truncate" title={booking.dropLocation}>→ {booking.dropLocation}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-base font-bold text-gray-900">₹{booking.estimateAmount}</p>
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
                        <div className="flex flex-col gap-1.5 min-w-[130px]">
                          <button 
                            onClick={() => viewAcceptedDrivers(booking)}
                            disabled={loading}
                            className="bg-[#0B192C] text-white px-3 py-1.5 rounded-lg font-semibold text-xs hover:bg-[#1E3E62] disabled:opacity-50 transition"
                          >
                            Review & Allocate
                          </button>
                          {booking.isFreeListing ? (
                            <div className="flex items-center justify-between gap-1 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">
                              <span className="text-[10px] font-black text-amber-900">
                                📢 ₹{booking.freeListingFee}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUnpublishFreeListing(booking.id)}
                                className="text-[10px] text-red-600 hover:text-red-800 font-bold underline cursor-pointer"
                                title="Remove from Free Listing"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openFreeListingModal(booking)}
                              className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[11px] font-bold px-2 py-1 rounded-lg transition text-center cursor-pointer"
                            >
                              📢 Free Listing
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )
      ) : activeTab === 'FREE_LISTING' ? (
        filteredFreeListingBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📢</span>
            </div>
            <p className="text-gray-700 font-bold text-sm">No rides currently in Free Listing</p>
            <p className="text-gray-500 text-xs mt-1">When drivers don't accept rides under active packages, publish them to Free Listing from Pending Trips.</p>
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Trip Fare</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Unlock Fee</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredFreeListingBookings.map((booking, index) => (
                    <tr key={booking.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4"><p className="text-sm font-semibold text-gray-900">{index + 1}</p></td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-gray-900">{booking.customer?.name}</p>
                        <p className="text-xs text-gray-600">{booking.customer?.phone}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1 max-w-[250px]">
                          <p className="text-xs text-gray-900 font-medium truncate">{booking.pickupLocation}</p>
                          <p className="text-xs text-gray-500 truncate">→ {booking.dropLocation}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-base font-bold text-gray-900">₹{booking.estimateAmount}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-block bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg text-xs font-black">
                          ₹{booking.freeListingFee}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {booking.freeListingPaidBy ? (
                          <span className="inline-block bg-green-100 text-green-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                            Claimed & Paid
                          </span>
                        ) : (
                          <span className="inline-block bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                            Open for All Drivers
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openFreeListingModal(booking)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-2.5 py-1.5 rounded-lg transition"
                          >
                            Edit Fee
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUnpublishFreeListing(booking.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-bold underline"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
        ) : filteredCancellationRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-gray-700 font-bold text-sm">No cancellation requests match driver "{driverSearchQuery}"</p>
            <button
              type="button"
              onClick={() => setDriverSearchQuery('')}
              className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
            >
              Clear Search
            </button>
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
                {filteredCancellationRequests.map((booking, index) => {
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
        ) : filteredAllocatedBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-gray-700 font-bold text-sm">No allocated trips match driver "{driverSearchQuery}"</p>
            <button
              type="button"
              onClick={() => setDriverSearchQuery('')}
              className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
            >
              Clear Search
            </button>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAllocatedBookings.map((booking, index) => {
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
                      <td className="px-4 py-4">
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            handleChooseAnotherDriver();
                          }}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold text-xs hover:bg-blue-700 transition whitespace-nowrap"
                        >
                          Change Driver
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
      ) : activeTab === 'HISTORY' ? (
        cancellationHistory.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500 text-sm">No cancellation history available</p>
          </div>
        ) : filteredCancellationHistory.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-gray-700 font-bold text-sm">No cancellation history matches driver "{driverSearchQuery}"</p>
            <button
              type="button"
              onClick={() => setDriverSearchQuery('')}
              className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
            >
              Clear Search
            </button>
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
                {filteredCancellationHistory.map((booking, index) => {
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

      {/* Free Listing Modal */}
      {showFreeListingModal && freeListingTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold">📢</div>
                <h3 className="font-bold text-lg text-gray-900">Publish to Free Listing</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFreeListingModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
              This ride will be visible to <strong>ALL drivers</strong> (even without active package subscriptions).
              Customer phone and contact details remain hidden until a driver pays your unlock fee.
            </p>

            <div className="space-y-1.5 mb-4 text-xs bg-amber-50/60 p-3 rounded-xl border border-amber-200">
              <p className="font-bold text-gray-800 truncate">Trip: {freeListingTarget.pickupLocation} → {freeListingTarget.dropLocation}</p>
              <p className="text-gray-600">Customer: {freeListingTarget.customer?.name || 'Customer'}</p>
              <p className="text-emerald-700 font-bold text-sm">Trip Fare: ₹{freeListingTarget.estimateAmount}</p>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-700 mb-1">Driver Unlock Fee (₹)</label>
              <p className="text-[11px] text-gray-500 mb-2">Amount the driver pays to unlock customer details and claim this ride:</p>
              <div className="flex gap-2 mb-2">
                {['30', '50', '80', '100'].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setFreeListingFee(amt)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${freeListingFee === amt ? 'bg-[#0B192C] text-white border-[#0B192C]' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  value={freeListingFee}
                  onChange={(e) => setFreeListingFee(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B192C]"
                  placeholder="e.g. 50"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowFreeListingModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold text-xs text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={publishingFreeListing}
                onClick={handlePublishFreeListing}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {publishingFreeListing ? 'Publishing...' : '📢 Publish to All Drivers'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
