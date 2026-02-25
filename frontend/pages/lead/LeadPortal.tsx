import React, { useState, useEffect } from 'react';
import { getLeadData, updateLeadProfile } from '../../api/lead';
import { getLeadSubscriptions, getAllLeadPlans, purchaseLeadSubscription } from '../../api/leadSubscription';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../api/config.js';

interface LeadPortalProps {
  onLogout?: () => void;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  rating: number;
  totalRides: number;
  photo?: string;
  licenseNo?: string;
  aadharNo?: string;
  dlPhoto?: string;
  panPhoto?: string;
  aadharPhoto?: string;
  alternateMobile1?: string;
  alternateMobile2?: string;
  alternateMobile3?: string;
  alternateMobile4?: string;
  gpayNo?: string;
  phonepeNo?: string;
}

const LeadPortal: React.FC<LeadPortalProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'HOME' | 'REQUESTS' | 'TRIPS' | 'PACKAGES' | 'PROFILE'>('HOME');
  const [lead, setLead] = useState<Lead | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<any>({});
  const [imagePreviews, setImagePreviews] = useState<{[key: string]: string}>({});
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [allocatedBookings, setAllocatedBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [completedTrips, setCompletedTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  useEffect(() => {
    const leadData = getLeadData();
    if (leadData) {
      setLead(leadData);
      setProfileData({
        ...leadData,
        upiId: leadData.gpayNo || leadData.phonepeNo || '',
      });
      loadSubscriptions();
      loadAllocatedBookings();
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'PACKAGES') {
      loadPackages();
    } else if (activeTab === 'REQUESTS') {
      loadPendingRequests();
    } else if (activeTab === 'TRIPS') {
      loadCompletedTrips();
    }
  }, [activeTab]);

  const loadSubscriptions = async () => {
    const result = await getLeadSubscriptions();
    if (result.success) {
      const subs = result.data?.subscriptions || [];
      setSubscriptions(subs);
      if (subs.length > 0) {
        setCurrentSubscription(subs[0]);
      }
    }
  };

  const loadPackages = async () => {
    setLoadingPackages(true);
    const result = await getAllLeadPlans();
    if (result.success) {
      setPackages(result.data?.plans || []);
    }
    setLoadingPackages(false);
  };

  const loadPendingRequests = async () => {
    setLoadingRequests(true);
    try {
      const token = localStorage.getItem('leadToken');
      const response = await fetch(`${API_BASE_URL}/api/booking-workflow/lead/pending-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const allReqs = data.requests || [];
        setAllRequests(allReqs);
        setPendingRequests(allReqs.filter(r => r.status === 'PENDING'));
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    }
    setLoadingRequests(false);
  };

  const loadAllocatedBookings = async () => {
    setLoadingBookings(true);
    try {
      const token = localStorage.getItem('leadToken');
      const response = await fetch(`${API_BASE_URL}/api/bookings/lead/allocated`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAllocatedBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
    setLoadingBookings(false);
  };

  const loadCompletedTrips = async () => {
    setLoadingTrips(true);
    try {
      const token = localStorage.getItem('leadToken');
      const response = await fetch(`${API_BASE_URL}/api/bookings/lead/completed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCompletedTrips(data.bookings || []);
      }
    } catch (error) {
      console.error('Error loading trips:', error);
    }
    setLoadingTrips(false);
  };

  const handleRequestResponse = async (responseId: string, action: 'ACCEPTED' | 'REJECTED') => {
    try {
      const token = localStorage.getItem('leadToken');
      const response = await fetch(`${API_BASE_URL}/api/booking-workflow/lead/respond/${responseId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Request ${action.toLowerCase()}!`);
        loadPendingRequests();
      } else {
        toast.error(data.message || 'Failed to respond');
      }
    } catch (error) {
      console.error('Error responding:', error);
      toast.error('Failed to respond to request');
    }
  };

  const handleSubscriptionBuy = async (pkg: any) => {
    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  const handlePaymentMethodSelect = async (method: string) => {
    if (!selectedPackage || !lead) return;
    setShowPaymentModal(false);
    
    const result = await purchaseLeadSubscription(selectedPackage.id, method);
    if (result.success) {
      toast.success('Package subscribed successfully!');
      await loadSubscriptions();
    } else {
      toast.error(result.message || 'Failed to subscribe');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await updateLeadProfile({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        alternateMobile1: profileData.alternateMobile1,
        alternateMobile2: profileData.alternateMobile2,
        alternateMobile3: profileData.alternateMobile3,
        alternateMobile4: profileData.alternateMobile4,
        gpayNo: profileData.upiId,
        photo: profileData.photo,
        dlPhoto: profileData.dlPhoto,
        panPhoto: profileData.panPhoto,
        aadharPhoto: profileData.aadharPhoto
      });
      
      console.log('Profile update result:', result);
      
      if (result.success && result.data) {
        // Backend returns { success: true, lead: {...} }
        // handleResponse wraps it as { success: true, data: { success: true, lead: {...} } }
        const updatedLeadData = result.data.lead || result.data;
        const updatedLead = { 
          ...lead, 
          ...updatedLeadData,
          // Ensure we keep the fields we just updated
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          alternateMobile1: profileData.alternateMobile1,
          alternateMobile2: profileData.alternateMobile2,
          alternateMobile3: profileData.alternateMobile3,
          alternateMobile4: profileData.alternateMobile4,
          gpayNo: profileData.upiId,
          photo: profileData.photo,
          dlPhoto: profileData.dlPhoto,
          panPhoto: profileData.panPhoto,
          aadharPhoto: profileData.aadharPhoto
        };
        
        setLead(updatedLead);
        localStorage.setItem('leadData', JSON.stringify(updatedLead));
        setIsEditingProfile(false);
        toast.success('Profile updated successfully');
      } else {
        toast.error(result.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Profile update failed. Please try again.');
    }
  };

  if (!lead) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto h-screen flex flex-col">
      {/* Top Header Bar - Fixed */}
      <div className="bg-black text-white p-3 sm:p-4 flex justify-between items-center shadow-md">
        <p className="font-bold text-sm leading-none">SNP Lead</p>
        <p className="text-xs text-gray-400">Welcome, {lead.name}</p>
      </div>

      {/* Tabs - Fixed */}
      <div className="bg-white border-b border-gray-200 flex overflow-x-auto scrollbar-hide">
        {['HOME', 'REQUESTS', 'TRIPS', 'PACKAGES', 'PROFILE'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 min-w-[70px] sm:min-w-[80px] py-3 sm:py-4 text-[10px] sm:text-xs font-bold border-b-2 transition ${activeTab === tab ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* HOME TAB */}
        {activeTab === 'HOME' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            {allocatedBookings.length > 0 ? (
              <div>
                <h3 className="text-base sm:text-lg font-bold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Ongoing Trips
                </h3>
                {allocatedBookings.map((booking) => {
                  const startDate = new Date(booking.startDateTime);
                  return (
                    <div key={booking.id} className="bg-black text-white rounded-xl p-4 sm:p-5 mb-3 shadow-lg">
                      <div className="flex justify-between items-center mb-3 sm:mb-4 border-b border-gray-800 pb-2">
                        <span className="font-bold text-base sm:text-lg">On Trip</span>
                        <span className="bg-white text-black text-[10px] sm:text-xs font-bold px-2 py-1 rounded">{booking.serviceType || booking.bookingType}</span>
                      </div>
                      <div className="space-y-2 mb-3 sm:mb-4">
                        <p className="text-gray-400 text-xs uppercase">From</p>
                        <p className="font-bold">{booking.pickupLocation}</p>
                        <p className="text-gray-400 text-xs uppercase mt-2">To</p>
                        <p className="font-bold">{booking.dropLocation}</p>
                      </div>
                      <div className="space-y-3">
                        <button 
                          onClick={async () => {
                            if (window.confirm('Mark this trip as completed?\n\nCustomer: ' + (booking.customer?.name || 'N/A') + '\nFrom: ' + booking.pickupLocation + '\nTo: ' + booking.dropLocation)) {
                              try {
                                const token = localStorage.getItem('leadToken');
                                const response = await fetch(`${API_BASE_URL}/api/trips/${booking.id}/complete`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                  }
                                });
                                const data = await response.json();
                                if (data.success) {
                                  toast.success('✓ Trip completed successfully!');
                                  loadAllocatedBookings();
                                } else {
                                  toast.error('Failed to complete trip: ' + (data.error || 'Unknown error'));
                                }
                              } catch (error) {
                                console.error('Error completing trip:', error);
                                toast.error('Error completing trip. Please try again.');
                              }
                            }
                          }}
                          className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Complete Trip
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-400 font-medium">No active trips</p>
                <p className="text-gray-400 text-sm mt-1">Wait for admin to assign bookings</p>
              </div>
            )}
          </div>
        )}

        {/* REQUESTS TAB */}
        {activeTab === 'REQUESTS' && (
          <div className="space-y-6 animate-fade-in">
            {/* Pending Requests */}
            <div>
              <h3 className="text-lg font-bold mb-3">Pending Requests</h3>
              {pendingRequests.length === 0 ? (
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No pending requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((request) => {
                    const booking = request.booking;
                    const startDate = new Date(booking.startDateTime);
                    const formattedDate = startDate.toLocaleDateString('en-GB').replace(/\//g, '-');
                    const formattedTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <div key={request.id} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                        <div className="p-4 sm:p-5">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-xs sm:text-sm text-gray-500">{formattedTime}, {formattedDate}</p>
                              {booking.estimateAmount && (
                                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">₹{booking.estimateAmount}</p>
                              )}
                              {booking.paymentMethod && (
                                <p className="text-xs text-gray-600 mt-1">Payment: <span className="font-semibold">{booking.paymentMethod}</span></p>
                              )}
                              <span className="inline-block mt-2 bg-blue-100 text-blue-700 text-xs px-2.5 sm:px-3 py-1 rounded-full font-medium">{booking.bookingType}</span>
                            </div>
                          </div>
                          
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
                                  <p className="text-sm font-medium text-gray-900">{booking.pickupLocation}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Drop-off</p>
                                  <p className="text-sm font-medium text-gray-900">{booking.dropLocation}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {booking.customer && (
                            <div className="bg-gray-50 rounded-xl p-3 mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                  <span className="text-gray-700 font-semibold text-sm">{booking.customer?.name?.charAt(0) || 'C'}</span>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{booking.customer?.name || 'N/A'}</p>
                                  <p className="text-xs text-gray-600">{booking.customer?.phone || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex gap-2 sm:gap-3">
                            <button 
                              onClick={() => handleRequestResponse(request.id, 'REJECTED')} 
                              className="flex-1 bg-gray-100 text-gray-900 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm hover:bg-gray-200 transition active:scale-95"
                            >
                              Decline
                            </button>
                            <button 
                              onClick={() => handleRequestResponse(request.id, 'ACCEPTED')} 
                              className="flex-1 bg-black text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm hover:bg-gray-800 transition active:scale-95"
                            >
                              Accept
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Request History */}
            <div>
              <h3 className="text-lg font-bold mb-3">Request History</h3>
              {allRequests.filter(r => r.status !== 'PENDING').length === 0 ? (
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                  <p className="text-gray-500 text-sm">No request history</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allRequests.filter(r => r.status !== 'PENDING').map((request) => {
                    const booking = request.booking;
                    const startDate = new Date(booking.startDateTime);
                    const formattedDate = startDate.toLocaleDateString('en-GB').replace(/\//g, '-');
                    const formattedTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <div key={request.id} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 sm:p-5">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-xs sm:text-sm text-gray-500">{formattedTime}, {formattedDate}</p>
                              {booking.estimateAmount && (
                                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">₹{booking.estimateAmount}</p>
                              )}
                              <span className="inline-block mt-2 bg-blue-100 text-blue-700 text-xs px-2.5 sm:px-3 py-1 rounded-full font-medium">{booking.bookingType}</span>
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              request.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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
                                  <p className="text-sm font-medium text-gray-900">{booking.pickupLocation}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Drop-off</p>
                                  <p className="text-sm font-medium text-gray-900">{booking.dropLocation}</p>
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
          </div>
        )}

        {/* TRIPS TAB */}
        {activeTab === 'TRIPS' && (
          <div className="space-y-6 sm:space-y-8 animate-fade-in">
            {/* Upcoming / Active Trips Section */}
            <div>
              <h3 className="text-base sm:text-lg font-bold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Upcoming & Ongoing Trips
              </h3>
              {allocatedBookings.length === 0 ? (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-center">
                  <p className="text-gray-500 italic text-sm">No upcoming trips scheduled.</p>
                </div>
              ) : (
                allocatedBookings.map(booking => {
                  const startDate = new Date(booking.startDateTime);
                  return (
                    <div key={booking.id} className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4 sm:p-5 mb-3 shadow-md flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <span className="bg-black text-white text-xs font-bold px-2 py-1 rounded">{booking.bookingType}</span>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded uppercase">ALLOCATED</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-2">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Pickup</p>
                          <p className="font-bold text-sm text-gray-900">{booking.pickupLocation}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Drop</p>
                          <p className="font-bold text-sm text-gray-900">{booking.dropLocation}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Date & Time</p>
                          <p className="font-bold text-sm text-gray-900">{startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Est. Earnings</p>
                          <p className="font-bold text-sm text-gray-900">₹{booking.estimateAmount}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Completed Trips Section */}
            <div>
              <h3 className="text-base sm:text-lg font-bold mb-3 text-gray-400">Completed Trips</h3>
              {completedTrips.length === 0 ? (
                <p className="text-gray-500 italic text-sm">No completed trips yet.</p>
              ) : (
                completedTrips.map(trip => {
                  const startDate = new Date(trip.startDateTime);
                  return (
                    <div key={trip.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-500">{startDate.toLocaleDateString()} • {startDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded text-green-600 bg-green-50">Completed</span>
                      </div>
                      
                      <div className="flex flex-col gap-2 mb-2">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">From</p>
                          <p className="font-bold text-sm">{trip.pickupLocation}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">To</p>
                          <p className="font-bold text-sm">{trip.dropLocation}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-end border-t border-gray-100 pt-2 mt-2">
                        <div>
                          <p className="text-xs text-gray-500">{trip.bookingType}</p>
                        </div>
                        <p className="font-bold text-lg">₹{trip.finalAmount || trip.estimateAmount}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* PACKAGES TAB */}
        {activeTab === 'PACKAGES' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold">Lead Packages</h2>
              <p className="text-sm text-gray-500">Choose a plan to start accepting rides.</p>
            </div>
            {loadingPackages ? (
              <div className="text-center py-8 text-gray-500">
                <p>Loading packages...</p>
              </div>
            ) : packages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No packages available</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {packages.map(pkg => {
                  const daysLeft = currentSubscription && currentSubscription.plan ? Math.max(0, Math.ceil((new Date(currentSubscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;
                  const isActive = currentSubscription && currentSubscription.plan && currentSubscription.plan.id === pkg.id && currentSubscription.status === 'ACTIVE' && daysLeft > 0;
                  const hasActivePlan = currentSubscription && currentSubscription.plan && currentSubscription.status === 'ACTIVE' && daysLeft > 0;
                  const isDisabled = hasActivePlan && !isActive;
                  return (
                    <div key={pkg.id} className={`border-2 rounded-xl p-4 sm:p-6 relative ${isActive ? 'border-black bg-gray-50' : isDisabled ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-100 bg-white'}`}>
                      {isActive && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black text-white px-3 py-1 rounded-full text-xs font-bold">
                          CURRENT PLAN
                        </div>
                      )}
                      <h3 className="font-bold text-base sm:text-lg">{pkg.name}</h3>
                      <p className="text-2xl sm:text-3xl font-extrabold mt-2">₹{pkg.price}<span className="text-xs sm:text-sm font-normal text-gray-500">/{pkg.duration} days</span></p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3">{pkg.description}</p>
                      <button 
                        onClick={() => handleSubscriptionBuy(pkg)}
                        disabled={isActive || isDisabled}
                        className={`w-full mt-4 sm:mt-6 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm ${isActive || isDisabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}
                      >
                        {isActive ? 'Active' : 'Choose Package & Pay'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'PROFILE' && (
          <div className="animate-fade-in pb-6 sm:pb-10">
            {!isEditingProfile ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-black h-20 sm:h-24 relative">
                <div className="absolute -bottom-8 sm:-bottom-10 left-4 sm:left-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white bg-white flex items-center justify-center overflow-hidden p-1">
                    {lead.photo ? (
                      <img 
                        src={lead.photo.startsWith('http') ? lead.photo : `${API_BASE_URL}${lead.photo}`} 
                        alt="Profile Photo" 
                        className="w-full h-full object-contain rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300 rounded-full">
                        <span className="text-gray-600 text-lg font-bold">{lead.name?.charAt(0) || 'L'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-10 sm:pt-12 px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">{lead.name}</h2>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1">{lead.phone}</p>
                  </div>
                  <button onClick={() => setIsEditingProfile(true)} className="text-sm font-bold text-accent hover:underline">Edit Profile</button>
                </div>
                
                {/* Stats */}
                <div className="mb-6">
                  <div className="bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500">Total trips completed</p>
                        <p className="text-xl sm:text-2xl font-bold text-black">{lead.totalRides || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subscription Status */}
                <div className="mb-6">
                  {currentSubscription && currentSubscription.plan ? (() => {
                    const daysLeft = Math.max(0, Math.ceil((new Date(currentSubscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                    const isExpired = daysLeft === 0;
                    
                    if (isExpired) {
                      return (
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 sm:p-4 shadow-sm">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm text-gray-500">No Active Plan</p>
                              <p className="text-lg sm:text-xl font-bold text-black">You don't have any current plan</p>
                              <button 
                                onClick={() => setActiveTab('PACKAGES')}
                                className="text-xs px-3 py-1 mt-2 bg-black text-white rounded hover:bg-gray-800"
                              >
                                Make Plan
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 sm:p-4 shadow-sm">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs sm:text-sm text-gray-500">Current Plan</p>
                              <p className="text-xs px-2 py-1 rounded border text-blue-600 border-blue-200 bg-blue-50">
                                {currentSubscription.paymentMethod || 'N/A'}
                              </p>
                            </div>
                            <p className="text-base sm:text-lg md:text-xl font-bold text-black truncate">{currentSubscription.plan.name}</p>
                            <p className="text-xs px-2 py-1 rounded border text-green-600 border-green-200 bg-green-50 inline-block mt-1">
                              {daysLeft} days left
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 sm:p-4 shadow-sm">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-gray-500">No Active Plan</p>
                          <p className="text-lg sm:text-xl font-bold text-black">You don't have any current plan</p>
                          <button 
                            onClick={() => setActiveTab('PACKAGES')}
                            className="text-xs px-3 py-1 mt-2 bg-black text-white rounded hover:bg-gray-800"
                          >
                            Make Plan
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-2">Documents</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">License:</span>
                        <span className="font-medium text-right break-all">{lead.licenseNo || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Aadhar:</span>
                        <span className="font-medium text-right break-all">{lead.aadharNo || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-2">Payment & Contact</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-500 mb-1 sm:mb-0">UPI ID:</span>
                        <span className="font-medium break-all">{lead.gpayNo || lead.phonepeNo || 'Not set'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 mb-2 block">Alt Phones:</span>
                        <div className="space-y-1">
                          {[
                            lead.alternateMobile1,
                            lead.alternateMobile2,
                            lead.alternateMobile3,
                            lead.alternateMobile4
                          ].filter(phone => phone && phone.trim() !== '').length ? 
                            [
                              lead.alternateMobile1,
                              lead.alternateMobile2,
                              lead.alternateMobile3,
                              lead.alternateMobile4
                            ].filter(phone => phone && phone.trim() !== '').map((phone, index) => (
                              <div key={index} className="flex justify-between items-center py-1">
                                <span className="text-gray-400 text-xs">Phone {index + 1}:</span>
                                <span className="font-medium">{phone}</span>
                              </div>
                            )) : 
                            <div className="font-medium text-sm text-gray-400">None</div>
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-2">Document Uploads</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-500">Photo:</span>
                        <span className={`font-medium text-xs px-2 py-1 rounded ${lead.photo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {lead.photo ? '✓ Uploaded' : 'Not uploaded'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-500">Driving License:</span>
                        <span className={`font-medium text-xs px-2 py-1 rounded ${lead.dlPhoto ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {lead.dlPhoto ? '✓ Uploaded' : 'Not uploaded'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-500">PAN Card:</span>
                        <span className={`font-medium text-xs px-2 py-1 rounded ${lead.panPhoto ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {lead.panPhoto ? '✓ Uploaded' : 'Not uploaded'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-500">Aadhar Card:</span>
                        <span className={`font-medium text-xs px-2 py-1 rounded ${lead.aadharPhoto ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {lead.aadharPhoto ? '✓ Uploaded' : 'Not uploaded'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            ) : (
              <form onSubmit={handleProfileUpdate} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-bold text-base sm:text-lg mb-4">Edit Profile Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 rounded-lg p-3 text-sm"
                      value={profileData.name || ''}
                      onChange={e => setProfileData({...profileData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 rounded-lg p-3 text-sm"
                      value={profileData.phone || ''}
                      onChange={e => setProfileData({...profileData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Alternate Phone 1</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 rounded-lg p-3 text-sm"
                      value={profileData.alternateMobile1 || ''}
                      onChange={e => setProfileData({...profileData, alternateMobile1: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Alternate Phone 2</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 rounded-lg p-3 text-sm"
                      value={profileData.alternateMobile2 || ''}
                      onChange={e => setProfileData({...profileData, alternateMobile2: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Alternate Phone 3</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 rounded-lg p-3 text-sm"
                      value={profileData.alternateMobile3 || ''}
                      onChange={e => setProfileData({...profileData, alternateMobile3: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Alternate Phone 4</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 rounded-lg p-3 text-sm"
                      value={profileData.alternateMobile4 || ''}
                      onChange={e => setProfileData({...profileData, alternateMobile4: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">UPI ID (GPay/PhonePe)</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 rounded-lg p-3 text-sm"
                      value={profileData.upiId || ''}
                      onChange={e => setProfileData({...profileData, upiId: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-500 mb-3 uppercase">Document Uploads</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['photo', 'dlPhoto', 'panPhoto', 'aadharPhoto'].map((field) => (
                      <div key={field} className="relative">
                        <input 
                          type="file"
                          accept="image/*"
                          id={`edit${field}`}
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const previewUrl = URL.createObjectURL(file);
                              setImagePreviews({...imagePreviews, [field]: previewUrl});
                              try {
                                const formData = new FormData();
                                formData.append('file', file);
                                const response = await fetch(`${API_BASE_URL}/api/upload/file`, {
                                  method: 'POST',
                                  body: formData
                                });
                                const result = await response.json();
                                if (result.success) {
                                  setProfileData({...profileData, [field]: result.fileId});
                                }
                              } catch (error) {
                                console.error('Upload failed:', error);
                              }
                            }
                          }}
                        />
                        <label 
                          htmlFor={`edit${field}`}
                          className="block w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition overflow-hidden"
                        >
                          {imagePreviews[field] || profileData[field] ? (
                            <img 
                              src={imagePreviews[field] || (profileData[field]?.startsWith('http') ? profileData[field] : `${API_BASE_URL}${profileData[field]}`)} 
                              alt={field} 
                              className="w-full h-full object-contain block"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                              <svg className="w-4 h-4 mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <p className="text-xs text-gray-500 font-medium">
                                {field === 'photo' ? 'Photo' : field === 'dlPhoto' ? 'Driving License' : field === 'panPhoto' ? 'PAN Card' : 'Aadhar Card'}
                              </p>
                            </div>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 py-3 font-bold text-sm">Cancel</button>
                  <button type="submit" className="flex-1 bg-black text-white py-3 rounded-lg font-bold text-sm">Save Changes</button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Payment Method Modal */}
      {showPaymentModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-2">Select Payment Method</h2>
            <p className="text-sm text-gray-600 mb-2">{selectedPackage.name} - ₹{selectedPackage.price}</p>
            <p className="text-xs text-gray-500 mb-6">Choose how you want to pay</p>
            
            <div className="space-y-3">
              <button
                onClick={() => handlePaymentMethodSelect('CASH')}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-700 transition shadow-lg flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
                Cash
              </button>
              
              <button
                onClick={() => handlePaymentMethodSelect('UPI')}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-blue-700 transition shadow-lg flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
                UPI
              </button>
            </div>
            
            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadPortal;
