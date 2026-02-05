import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/config.js';

const API_URL = API_BASE_URL + '/api';

export default function DriverBookingRequests({ onNavigateToPackages }: { onNavigateToPackages?: () => void }) {
  const [requests, setRequests] = useState([]);
  const [allocatedBookings, setAllocatedBookings] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentSubscription();
    fetchRequests();
    fetchAllocatedBookings();
  }, []);

  const fetchCurrentSubscription = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const res = await axios.get(`${API_URL}/subscriptions/driver`, { 
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true 
      });
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

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API_URL}/booking-workflow/driver/pending-requests`, { withCredentials: true });
      setRequests(res.data.requests);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchAllocatedBookings = async () => {
    try {
      const res = await axios.get(`${API_URL}/bookings/driver-bookings`, { withCredentials: true });
      setAllocatedBookings(res.data.bookings || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const respondToRequest = async (responseId, action) => {
    try {
      await axios.put(`${API_URL}/booking-workflow/driver/respond/${responseId}`, 
        { action }, 
        { withCredentials: true }
      );
      alert(`Booking ${action.toLowerCase()}!`);
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
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-medium">Active Package</p>
            <p className="text-sm sm:text-base font-semibold text-gray-900">{currentSubscription.plan.name}</p>
          </div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Pending Requests */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Pending Requests</h2>
        {requests.length === 0 ? (
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
            {requests.map(request => {
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
                        <span className="inline-block mt-2 bg-blue-100 text-blue-700 text-xs px-2.5 sm:px-3 py-1 rounded-full font-medium">{request.booking.bookingType}</span>
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
                    
                    {/* Customer Info */}
                    <div className="bg-gray-50 rounded-xl p-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-700 font-semibold text-sm">{request.booking.customer.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{request.booking.customer.name}</p>
                          <p className="text-xs text-gray-600">{request.booking.customer.phone}</p>
                        </div>
                      </div>
                    </div>
                    
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

      {/* My Bookings */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">My Allocated Bookings</h2>
        {allocatedBookings.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No allocated bookings</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allocatedBookings.map(booking => {
              const startDate = new Date(booking.startDateTime);
              const formattedDate = startDate.toLocaleDateString('en-GB').replace(/\//g, '-');
              const formattedTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              const statusColors = {
                COMPLETED: 'bg-green-100 text-green-700',
                CANCELLED: 'bg-red-100 text-red-700',
                CONFIRMED: 'bg-blue-100 text-blue-700',
                ONGOING: 'bg-yellow-100 text-yellow-700'
              };
              
              return (
                <div key={booking.id} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 sm:p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">{formattedTime}, {formattedDate}</p>
                        {booking.estimateAmount && (
                          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">₹{booking.estimateAmount}</p>
                        )}
                        <span className={`inline-block mt-2 text-xs px-2.5 sm:px-3 py-1 rounded-full font-medium ${statusColors[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                    
                    <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2.5 sm:px-3 py-1 rounded-full font-medium mb-4">{booking.bookingType}</span>
                    
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
                            <p className="text-xs text-gray-500 mb-1">From</p>
                            <p className="text-sm font-medium text-gray-900">{booking.pickupLocation}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">To</p>
                            <p className="text-sm font-medium text-gray-900">{booking.dropLocation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Customer Details */}
                    {booking.customer && (
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-2 font-medium">Customer Details</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-gray-700 font-semibold text-sm">{booking.customer.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{booking.customer.name}</p>
                            <p className="text-xs text-gray-600">{booking.customer.phone}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
