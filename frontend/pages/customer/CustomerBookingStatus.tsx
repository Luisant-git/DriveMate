import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/config.js';

const API_URL = API_BASE_URL + '/api';

export default function CustomerBookingStatus() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_URL}/bookings/my-bookings`, { withCredentials: true });
      setBookings(res.data.bookings || []);
    } catch (error) {
      console.error('Error:', error);
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
            
            return (
              <div key={booking.id} className="bg-white border rounded-lg p-4 sm:p-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">{time}, {date}</p>
                    <p className="text-2xl font-bold text-gray-900">₹{booking.estimateAmount}</p>
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold whitespace-nowrap ${
                    booking.driver ? 'bg-green-100 text-green-700' :
                    booking.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {booking.driver ? 'DRIVER ALLOCATED' : booking.status}
                  </span>
                </div>

                <p className="inline-block bg-gray-100 px-3 py-1 rounded text-xs font-medium text-gray-700 mb-4">
                  {booking.bookingType}
                </p>

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

                {/* Driver or Status */}
                {booking.driver ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2 pt-2 border-t">
                    <p className="text-[10px] font-semibold text-green-700 mb-2">✓ Your Driver</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {booking.driver.name?.[0] || 'D'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{booking.driver.name}</p>
                        <p className="text-xs text-gray-600">{booking.driver.phone}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <p className="text-sm text-blue-700">Finding available drivers...</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
