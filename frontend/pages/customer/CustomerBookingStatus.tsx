import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig.js';
import { API_BASE_URL } from '../../api/config.js';

export default function CustomerBookingStatus() {
  const [bookings, setBookings] = useState([]);
  const [cancelModalBookingId, setCancelModalBookingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await apiClient.get('/bookings/my-bookings');
      setBookings(res.data.bookings || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const confirmCancel = async () => {
    if (!cancelModalBookingId) return;
    try {
      await apiClient.post(`/bookings/${cancelModalBookingId}/cancel`);
      alert('Cancellation request submitted to Admin for approval');
      setCancelModalBookingId(null);
      fetchBookings();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to cancel booking');
      setCancelModalBookingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">Your Bookings</h1>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center border">
          <p className="text-gray-500">No bookings yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => {
            const startDate = new Date(booking.startDateTime);
            const time = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const date = startDate.toLocaleDateString('en-GB').replace(/\//g, '-');
            const assignedPerson = booking.driver || booking.lead;
            const isLead = !!booking.lead;
            
            return (
              <div key={booking.id} className="bg-white border rounded-lg p-4 sm:p-5">
                {/* Header */}
                <div className="flex flex-row justify-between items-start gap-3 mb-4 flex-wrap sm:flex-nowrap">
                  <div>
                    <p className="text-sm sm:text-xs text-gray-600">{time}, {date}</p>
                    <p className="text-2xl font-bold text-gray-900">₹{booking.estimateAmount}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold whitespace-nowrap ${
                      booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      booking.cancellationRequested ? 'bg-orange-100 text-orange-700' :
                      assignedPerson ? 'bg-green-100 text-green-700' :
                      booking.selectedLeadPackageId ? 'bg-purple-100 text-purple-700' :
                      booking.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {booking.status === 'CANCELLED' ? 'CANCELLED' :
                       booking.cancellationRequested ? 'CANCELLATION PENDING' :
                       assignedPerson ? (isLead ? 'LEAD ALLOCATED' : 'DRIVER ALLOCATED') : 
                       booking.selectedLeadPackageId ? 'REQUEST SENT TO LEADS' :
                       booking.status === 'CONFIRMED' ? 'REQUEST SENT TO DRIVERS' : booking.status}
                    </span>
                    {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && !booking.cancellationRequested && (
                      <button
                        onClick={() => setCancelModalBookingId(booking.id)}
                        className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 font-bold transition shadow-sm border border-red-100"
                      >
                        Cancel Trip
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="inline-block bg-gray-100 px-3 py-1 rounded text-xs font-medium text-gray-700">
                    {booking.bookingType}
                  </p>
                </div>

                {/* Route */}
                <div className="mb-4 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">From:</p>
                    <p className="text-sm text-gray-900">{booking.pickupLocation}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">To:</p>
                    <p className="text-sm text-gray-900">{booking.dropLocation}</p>
                  </div>
                </div>

                {/* Driver/Lead or Status */}
                {assignedPerson ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2 pt-2 border-t">
                    <p className="text-[10px] font-semibold text-green-700 mb-2">✓ Your {isLead ? 'Lead' : 'Driver'}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {assignedPerson.name?.[0] || (isLead ? 'L' : 'D')}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{assignedPerson.name || (isLead ? 'Lead' : 'Driver')}</p>
                        <p className="text-xs text-gray-600">{assignedPerson.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ) : booking.selectedLeadPackageId ? (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                    <p className="text-sm text-purple-700">Request sent to leads...</p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <p className="text-sm text-blue-700">Request sent to drivers...</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Cancel Confirmation Modal */}
      {cancelModalBookingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Booking?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to cancel this trip? This action cannot be undone. This request will be sent to the Admin for approval.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelModalBookingId(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-200 transition"
              >
                Keep It
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 py-2.5 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 transition"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
