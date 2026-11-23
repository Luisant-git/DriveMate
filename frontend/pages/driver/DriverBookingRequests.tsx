import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig.js';
import { API_BASE_URL } from '../../api/config.js';

export default function DriverBookingRequests({
  onNavigateToPackages,
  activeSubTab,
  onChangeSubTab
}: {
  onNavigateToPackages?: () => void;
  activeSubTab?: string;
  onChangeSubTab?: (tab: string) => void;
}) {
  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [allocatedBookings, setAllocatedBookings] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [activeSubscriptions, setActiveSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' });

  // Free Listing State
  const [freeListingRides, setFreeListingRides] = useState<any[]>([]);
  const [loadingFreeListing, setLoadingFreeListing] = useState(false);
  const [claimingRide, setClaimingRide] = useState<any>(null);
  const [claimPaymentMethod, setClaimPaymentMethod] = useState<'UPI' | 'ONLINE' | 'CASH'>('UPI');
  const [claimPaymentRef, setClaimPaymentRef] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [unlockedRideDetails, setUnlockedRideDetails] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchCurrentSubscription();
    if (activeSubTab === 'FREE_LISTING') {
      fetchFreeListingRides();
    } else {
      fetchRequests(activeSubTab || 'PENDING');
    }
    fetchAllocatedBookings();
  }, [activeSubTab]);

  useEffect(() => {
    if (activeSubTab === 'FREE_LISTING') {
      const interval = setInterval(fetchFreeListingRides, 15000);
      return () => clearInterval(interval);
    }
  }, [activeSubTab]);

  const fetchFreeListingRides = async () => {
    try {
      setLoadingFreeListing(true);
      const res = await apiClient.get('/booking-workflow/driver/free-listing');
      setFreeListingRides(res.data.rides || []);
    } catch (error) {
      console.error('Error fetching free listing rides:', error);
    } finally {
      setLoadingFreeListing(false);
    }
  };

  const handleClaimRide = async () => {
    if (!claimingRide) return;
    try {
      setIsClaiming(true);
      const res = await apiClient.post(`/booking-workflow/driver/claim-free-listing/${claimingRide.id}`, {
        paymentMethod: claimPaymentMethod,
        paymentReference: claimPaymentRef || `FL_PAY_${Date.now()}`
      });

      const updatedRide = res.data.booking;
      setUnlockedRideDetails(updatedRide);
      setClaimingRide(null);
      fetchFreeListingRides();
      fetchAllocatedBookings();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to claim ride');
    } finally {
      setIsClaiming(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const res = await apiClient.get('/subscriptions/driver');
      console.log('Subscription response:', res.data);
      if (res.data && res.data.plan) {
        setCurrentSubscription(res.data);
        if (res.data.activeSubscriptions && Array.isArray(res.data.activeSubscriptions)) {
          setActiveSubscriptions(res.data.activeSubscriptions);
        } else {
          setActiveSubscriptions([res.data]);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async (type = 'PENDING') => {
    try {
      const res = await apiClient.get(`/booking-workflow/driver/pending-requests?type=${type}`);
      const reqs = res.data.requests || [];
      if (type === 'PENDING') {
        setRequests(reqs);
      } else {
        setAllRequests(reqs);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchAllocatedBookings = async () => {
    try {
      const res = await apiClient.get('/bookings/driver-bookings');
      setAllocatedBookings(res.data.bookings || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const respondToRequest = async (responseId, action) => {
    try {
      await apiClient.put(`/booking-workflow/driver/respond/${responseId}`,
        { action }
      );
      setSuccessModal({
        isOpen: true,
        title: action === 'ACCEPTED' ? 'Booking Accepted!' : 'Booking Declined',
        message: action === 'ACCEPTED'
          ? 'You have successfully accepted this booking. Please wait for the admin to allocate it to you.'
          : 'You have declined this booking request. We will assign it to another driver.'
      });
      fetchRequests();
      if (action === 'ACCEPTED') {
        fetchAllocatedBookings();
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if ((!currentSubscription || !currentSubscription.plan) && activeSubTab !== 'FREE_LISTING') {
    return (
      <div className="text-center py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 max-w-md mx-auto shadow-sm">
          <svg className="w-12 h-12 text-yellow-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-bold text-yellow-800 mb-2">Package Required for Direct Requests</h3>
          <p className="text-yellow-700 text-xs mb-4">Please choose a driver package from the PACKAGES tab to automatically receive booking requests, or browse open marketplace rides in <strong>Free Listing</strong>.</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => onNavigateToPackages ? onNavigateToPackages() : window.location.reload()}
              className="bg-[#0B192C] text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-[#1E3E62] transition cursor-pointer"
            >
              Go to Packages
            </button>
            {onChangeSubTab && (
              <button
                onClick={() => onChangeSubTab('FREE_LISTING')}
                className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-lg font-bold text-xs transition shadow-sm cursor-pointer"
              >
                📢 View Free Listing
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Active Package Card(s) - Supports Multiple Packages */}
      {currentSubscription && currentSubscription.plan && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-9 sm:h-9 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-emerald-600 font-extrabold uppercase tracking-wider">
                Active Subscriptions ({activeSubscriptions.length > 0 ? activeSubscriptions.length : 1})
              </p>
              <p className="text-xs text-gray-500">Receiving trips matching your active packages</p>
            </div>
          </div>
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse flex-shrink-0"></span>
        </div>

        <div className="space-y-2.5 pt-1 border-t border-gray-100">
          {(activeSubscriptions.length > 0 ? activeSubscriptions : [currentSubscription]).map((sub, idx) => {
            const daysLeft = Math.max(0, Math.ceil((new Date(sub.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
            const dutiesLeft = sub.maxDuties > 0 ? Math.max(0, sub.maxDuties - (sub.dutiesCompleted || 0)) : null;
            const type = sub.plan?.type;
            return (
              <div key={sub.id || idx} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col gap-1.5">
                {/* Top row: category badge + type badge */}
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-black bg-white px-2 py-0.5 rounded border border-gray-200">
                    {sub.plan?.category || 'Package'}
                  </span>
                  {type && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${type === 'LOCAL' ? 'bg-blue-100 text-blue-800' :
                        type === 'OUTSTATION' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                      }`}>
                      {type === 'BOTH' ? 'LOCAL + OUTSTATION' : type}
                    </span>
                  )}
                </div>
                {/* Plan name */}
                <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{sub.plan?.name}</p>
                {/* Days + duties */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    {daysLeft}d left
                  </span>
                  {dutiesLeft !== null && (
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                      {dutiesLeft} duties left
                    </span>
                  )}
                </div>


              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Pending Requests */}
      {(!activeSubTab || activeSubTab === 'PENDING') && (
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Pending Requests</h2>
          {(() => {
            const visibleRequests = requests.filter(req => !req.availableAt || new Date(req.availableAt).getTime() <= currentTime.getTime());

            if (visibleRequests.length === 0) {
              return (
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No pending requests</p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {visibleRequests.map(request => {
                  const startDate = new Date(request.booking.startDateTime);
                  const formattedDate = startDate.toLocaleDateString('en-GB').replace(/\//g, '-');
                  const formattedTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const endDate = request.booking.endDateTime ? new Date(request.booking.endDateTime) : null;
                  const formattedReturnDate = endDate ? endDate.toLocaleDateString('en-GB').replace(/\//g, '-') : '';
                  const formattedReturnTime = endDate ? endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                  return (
                    <div key={request.id} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                      <div className="p-4 sm:p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-xs sm:text-sm text-gray-500">🚗 Going — {formattedDate}, {formattedTime}</p>
                            {request.booking.endDateTime && (
                              <p className="text-xs sm:text-sm text-gray-500">🏠 Return — {formattedReturnDate}, {formattedReturnTime}</p>
                            )}
                            {request.booking.estimateAmount && (
                              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">₹{request.booking.estimateAmount}</p>
                            )}
                            {request.booking.paymentMethod && (
                              <p className="text-xs text-gray-600 mt-1">Payment: <span className="font-semibold">{request.booking.paymentMethod}</span></p>
                            )}
                            <span className="inline-block mt-2 bg-blue-100 text-blue-700 text-xs px-2.5 sm:px-3 py-1 rounded-full font-medium">{request.booking.serviceType}</span>
                          </div>
                        </div>

                        {/* Route */}
                        <div className="space-y-3 mb-4">
                          <div className="flex gap-3">
                            <div className="flex flex-col items-center pt-1">
                              <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                              <div className="w-0.5 h-8 bg-gray-300"></div>
                              <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                            </div>
                            <div className="flex-1 space-y-3">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Pickup</p>
                                <p className="text-sm font-medium text-gray-900">{request.booking.pickupLocation}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Drop-off</p>
                                <p className="text-sm font-medium text-gray-900">{request.booking.dropLocation}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Customer Info hidden for pending requests */}

                        {/* Action Buttons */}
                        <div className="flex gap-2 sm:gap-3">
                          <button
                            onClick={() => respondToRequest(request.id, 'REJECTED')}
                            className="flex-1 bg-gray-100 text-gray-900 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm hover:bg-gray-200 transition active:scale-95"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => respondToRequest(request.id, 'ACCEPTED')}
                            className="flex-1 bg-[#0B192C] text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm hover:bg-[#1E3E62] transition active:scale-95 shadow-md"
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Free Listing Rides */}
      {activeSubTab === 'FREE_LISTING' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>📢 Free Listing Rides</span>
                <span className="text-[10px] sm:text-xs bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full">
                  Open Marketplace
                </span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Open rides available to all registered drivers. Pay the listing fee to unlock customer details and take the ride.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchFreeListingRides}
              className="text-xs text-[#0B192C] font-bold bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              ↻ Refresh
            </button>
          </div>

          {loadingFreeListing ? (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <p className="text-gray-500 text-sm">Loading available rides...</p>
            </div>
          ) : freeListingRides.length === 0 ? (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📢</span>
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">No Free Listing Rides Right Now</h3>
              <p className="text-gray-500 text-xs max-w-sm mx-auto">
                When new trips become available for open claim, they will appear here. Check back soon or click Refresh.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {freeListingRides.map(ride => {
                const startDate = new Date(ride.startDateTime);
                const formattedDate = startDate.toLocaleDateString('en-GB').replace(/\//g, '-');
                const formattedTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isClaimedByMe = ride.isUnlocked;

                return (
                  <div key={ride.id} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                    <div className="p-4 sm:p-5">
                      {/* Top Badges */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full">
                            📢 FREE LISTING
                          </span>
                          <span className="bg-blue-50 text-blue-800 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full">
                            {ride.serviceType}
                          </span>
                          {ride.tripType && (
                            <span className="bg-gray-100 text-gray-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                              {ride.tripType}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Unlock Fee</span>
                          <span className="text-sm sm:text-base font-black text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg inline-block">
                            ₹{ride.freeListingFee || 0}
                          </span>
                        </div>
                      </div>

                      {/* Date & Fare */}
                      <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500">📅 {formattedDate} at {formattedTime}</p>
                          {ride.duration && <p className="text-[11px] text-gray-400">Duration: {ride.duration}</p>}
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Trip Earnings</span>
                          <p className="text-xl sm:text-2xl font-black text-emerald-600">₹{ride.estimateAmount}</p>
                        </div>
                      </div>

                      {/* Route */}
                      <div className="space-y-3 mb-4">
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center pt-1">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                            <div className="w-0.5 h-7 bg-gray-300"></div>
                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase font-bold">Pickup</p>
                              <p className="text-xs sm:text-sm font-semibold text-gray-900">{ride.pickupLocation}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase font-bold">Drop-off</p>
                              <p className="text-xs sm:text-sm font-semibold text-gray-900">{ride.dropLocation}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Customer Info Box */}
                      {isClaimedByMe ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                              <span>✓ Unlocked & Claimed by You</span>
                            </span>
                            <span className="text-[10px] bg-emerald-200 text-emerald-900 font-black px-2 py-0.5 rounded">
                              ACTIVE
                            </span>
                          </div>
                          <div className="space-y-1 mb-3">
                            <p className="text-sm font-bold text-gray-900">Customer: {ride.customer?.name}</p>
                            <p className="text-xs text-gray-700 font-mono">Phone: {ride.customer?.phone}</p>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={`tel:${ride.customer?.phone}`}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-lg text-center shadow transition flex items-center justify-center gap-1"
                            >
                              📞 Call Customer
                            </a>
                            <a
                              href={`https://wa.me/91${(ride.customer?.phone || '').replace(/[^0-9]/g, '').slice(-10)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 bg-[#25D366] hover:bg-[#1ebd5a] text-white font-bold text-xs py-2.5 px-3 rounded-lg text-center shadow transition flex items-center justify-center gap-1"
                            >
                              💬 WhatsApp
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3">
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <div>
                              <p className="font-semibold text-gray-800">Customer: {ride.customer?.name || 'Customer'}</p>
                              <p className="font-mono text-gray-500 mt-0.5 flex items-center gap-1">
                                <span>🔒</span>
                                <span>{ride.customer?.phone || '••••••••••'} (Hidden)</span>
                              </p>
                            </div>
                            <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-1 rounded">
                              Locked
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-2 italic">
                            Full contact number, pickup address and direct chat unlock immediately after paying the ₹{ride.freeListingFee || 0} unlock fee.
                          </p>
                        </div>
                      )}

                      {/* Claim Button */}
                      {!isClaimedByMe && (
                        <button
                          type="button"
                          onClick={() => {
                            setClaimingRide(ride);
                            setClaimPaymentRef(`FL_PAY_${Date.now()}`);
                          }}
                          className="w-full bg-[#0B192C] hover:bg-[#1E3E62] text-white py-3 rounded-xl font-black text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                          <span>🔓 Pay ₹{ride.freeListingFee || 0} & Unlock Ride</span>
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

      {activeSubTab === 'HISTORY' && (
        <div className="space-y-4">
          {/* Excess Amount Ledger (History) */}
          {(activeSubscriptions.length > 0 ? activeSubscriptions : (currentSubscription ? [currentSubscription] : [])).some(sub => (sub.excessPerRide || sub.plan?.excessAmountPerRide || 0) > 0 || (sub.excessDue || 0) > 0) && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900">Excess Amount Ledger</h3>
                    <p className="text-xs text-gray-500">Per-ride excess amount summary for your active packages</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {(activeSubscriptions.length > 0 ? activeSubscriptions : [currentSubscription]).filter(sub => (sub?.excessPerRide || sub?.plan?.excessAmountPerRide || 0) > 0 || (sub?.excessDue || 0) > 0).map((sub, idx) => {
                  const rate = sub.excessPerRide ?? sub.plan?.excessAmountPerRide ?? 0;
                  const rides = sub.dutiesCompleted || 0;
                  const total = sub.totalExcess ?? rides * rate;
                  const paid = sub.excessPaid ?? sub.commissionPaid ?? 0;
                  const due = sub.excessDue ?? Math.max(0, total - paid);

                  return (
                    <div key={sub.id || idx} className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-gray-200/80">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-gray-900">{sub.plan.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-700 uppercase">{sub.plan.category || 'Package'}</span>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                          due > 0 ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {due > 0 ? `₹${Math.round(due)} Due` : '✓ All Settled'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white rounded-lg p-2 border border-gray-100">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Excess / Ride</p>
                          <p className="font-bold text-xs sm:text-sm text-gray-800">
                            {rate > 0
                              ? `₹${rate}`
                              : (total > 0 ? <span className="text-[10px] text-gray-500">As recorded</span> : '—')}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-gray-100">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Total ({rides} rides)</p>
                          <p className="font-bold text-xs sm:text-sm text-gray-800">₹{Math.round(total)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-gray-100">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Paid to Admin</p>
                          <p className="font-bold text-xs sm:text-sm text-emerald-600">₹{Math.round(paid)}</p>
                        </div>
                      </div>

                      {due > 0 && (
                        <p className="text-[11px] text-orange-700 font-semibold mt-2.5 text-center bg-orange-50 py-1.5 px-2 rounded-lg border border-orange-200">
                          Outstanding ₹{Math.round(due)} excess amount to be settled at Admin office
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Request History</h2>
          {allRequests.length === 0 ? (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
              <p className="text-gray-500 text-sm">No request history</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allRequests.map(request => {
                const startDate = new Date(request.booking.startDateTime);
                const formattedDate = startDate.toLocaleDateString('en-GB').replace(/\//g, '-');
                const formattedTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={request.id} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 sm:p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">{formattedTime}, {formattedDate}</p>
                          {request.booking.estimateAmount && (
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">₹{request.booking.estimateAmount}</p>
                          )}
                          <span className="inline-block mt-2 bg-blue-100 text-blue-700 text-xs px-2.5 sm:px-3 py-1 rounded-full font-medium">{request.booking.serviceType}</span>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${request.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                            (request.status === 'REJECTED' || request.status === 'CANCELLED') ? 'bg-red-100 text-red-700' :
                              request.status === 'EXPIRED' ? 'bg-orange-100 text-orange-700' :
                                request.status === 'ALLOCATED TO ANOTHER' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                          }`}>
                          {request.status}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center pt-1">
                            <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                            <div className="w-0.5 h-8 bg-gray-300"></div>
                            <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                          </div>
                          <div className="flex-1 space-y-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Pickup</p>
                              <p className="text-sm font-medium text-gray-900">{request.booking.pickupLocation}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Drop-off</p>
                              <p className="text-sm font-medium text-gray-900">{request.booking.dropLocation}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Success Modal */}
      {successModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all animate-fade-in-up scale-100">
            <div className={`p-8 text-center ${successModal.title.includes('Accepted') ? 'bg-green-50' : 'bg-gray-50'}`}>
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 shadow-inner ${successModal.title.includes('Accepted') ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600'
                }`}>
                {successModal.title.includes('Accepted') ? (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">{successModal.title}</h3>
              <p className="text-sm text-gray-600 font-medium">{successModal.message}</p>
            </div>
            <div className="p-5 bg-white border-t border-gray-100">
              <button
                onClick={() => setSuccessModal({ isOpen: false, title: '', message: '' })}
                className="w-full bg-[#0B192C] text-white font-bold py-3.5 rounded-xl hover:bg-[#1E3E62] transition active:scale-95 shadow-md text-base"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Claim / Unlock Ride Modal */}
      {claimingRide && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold">🔓</div>
                <h3 className="font-bold text-lg text-gray-900">Unlock & Claim Ride</h3>
              </div>
              <button
                type="button"
                onClick={() => setClaimingRide(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4 text-xs space-y-1">
              <p className="font-bold text-gray-800 truncate">
                {claimingRide.pickupLocation} → {claimingRide.dropLocation}
              </p>
              <p className="text-gray-500">Trip Fare: <strong className="text-emerald-700 font-bold">₹{claimingRide.estimateAmount}</strong></p>
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                <span className="font-bold text-gray-700">Unlock Fee to Pay:</span>
                <span className="font-black text-base text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-lg">
                  ₹{claimingRide.freeListingFee || 0}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-2">Select Payment Method</label>
              <div className="space-y-2">
                {[
                  { id: 'UPI', label: 'UPI / GPay / PhonePe / Paytm', desc: 'Instant Unlock via UPI' },
                  { id: 'ONLINE', label: 'Online Card / NetBanking', desc: 'Instant Gateway payment' },
                  { id: 'CASH', label: 'Office Settlement / Post-Trip', desc: 'Settle at office' }
                ].map(opt => (
                  <label
                    key={opt.id}
                    onClick={() => setClaimPaymentMethod(opt.id as any)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
                      claimPaymentMethod === opt.id
                        ? 'border-[#0B192C] bg-blue-50/50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="claimPaymentMethod"
                      checked={claimPaymentMethod === opt.id}
                      onChange={() => setClaimPaymentMethod(opt.id as any)}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-900">{opt.label}</p>
                      <p className="text-[10px] text-gray-500">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* UPI QR Demo / Pay info */}
            {claimPaymentMethod === 'UPI' && (
              <div className="mb-4 p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-center">
                <p className="text-[11px] font-bold text-blue-900 mb-1">Company UPI ID</p>
                <p className="text-xs font-mono font-black text-gray-800 bg-white py-1 px-2 rounded border border-blue-100 inline-block mb-1">
                  drivemate@upi
                </p>
                <p className="text-[10px] text-gray-500">Scan or send ₹{claimingRide.freeListingFee} to this UPI ID</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setClaimingRide(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold text-xs text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClaiming}
                onClick={handleClaimRide}
                className="flex-1 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white font-black text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isClaiming ? 'Unlocking...' : `Confirm & Pay ₹${claimingRide.freeListingFee || 0}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlocked Ride Success Modal with Call / WhatsApp */}
      {unlockedRideDetails && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-1">Ride Unlocked!</h3>
            <p className="text-xs text-gray-600 mb-4">
              You have claimed this ride. Customer contact details are now revealed below.
            </p>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-left space-y-2 mb-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">Customer Name</p>
                <p className="text-sm font-bold text-gray-900">{unlockedRideDetails.customer?.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">Contact Number</p>
                <p className="text-base font-black text-gray-900 font-mono">{unlockedRideDetails.customer?.phone}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">Pickup Location</p>
                <p className="text-xs text-gray-700">{unlockedRideDetails.pickupLocation}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <a
                  href={`tel:${unlockedRideDetails.customer?.phone}`}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow transition flex items-center justify-center gap-1"
                >
                  📞 Call Customer
                </a>
                <a
                  href={`https://wa.me/91${(unlockedRideDetails.customer?.phone || '').replace(/[^0-9]/g, '').slice(-10)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-[#25D366] hover:bg-[#1ebd5a] text-white font-bold text-xs py-2.5 rounded-xl shadow transition flex items-center justify-center gap-1"
                >
                  💬 WhatsApp
                </a>
              </div>
              <button
                type="button"
                onClick={() => setUnlockedRideDetails(null)}
                className="w-full bg-[#0B192C] text-white font-bold text-xs py-2.5 rounded-xl hover:bg-[#1E3E62] transition cursor-pointer"
              >
                Done / View Trip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
