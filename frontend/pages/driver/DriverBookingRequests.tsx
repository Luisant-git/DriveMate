import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig.js';
import { API_BASE_URL } from '../../api/config.js';

export default function DriverBookingRequests({ onNavigateToPackages, activeSubTab }: { onNavigateToPackages?: () => void; activeSubTab?: string }) {
  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [allocatedBookings, setAllocatedBookings] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchCurrentSubscription();
    fetchRequests(activeSubTab || 'PENDING');
    fetchAllocatedBookings();
  }, [activeSubTab]);

  const fetchCurrentSubscription = async () => {
    try {
      const res = await apiClient.get('/subscriptions/driver');
      console.log('Subscription response:', res.data);
      if (res.data && res.data.plan) {
        setCurrentSubscription(res.data);
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

  if (!currentSubscription || !currentSubscription.plan) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-md mx-auto">
          <svg className="w-12 h-12 text-yellow-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-bold text-yellow-800 mb-2">Package Required</h3>
          <p className="text-yellow-700 mb-4">Please choose a driver package from the PACKAGES tab to start receiving booking requests.</p>
          <button 
            onClick={() => onNavigateToPackages ? onNavigateToPackages() : window.location.reload()}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-yellow-700 transition"
          >
            Go to Packages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Active Package Card */}
      <div className="bg-white rounded-lg sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-5">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wide mb-0.5">Active Package</p>
            <p className="text-xs sm:text-base font-bold text-gray-900 truncate">{currentSubscription.plan.name}</p>
          </div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
        </div>
      </div>

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
                
                return (
                  <div key={request.id} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                    <div className="p-4 sm:p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">{formattedTime}, {formattedDate}</p>
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
                          className="flex-1 bg-black text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm hover:bg-gray-800 transition active:scale-95 shadow-md"
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

      {activeSubTab === 'HISTORY' && (
      <div>
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
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          request.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : 
                          request.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
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
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 shadow-inner ${
                successModal.title.includes('Accepted') ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600'
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
                className="w-full bg-black text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition active:scale-95 shadow-md text-base"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
