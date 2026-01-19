import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/config.js';

const API_URL = API_BASE_URL + '/api';

export default function PendingDriverApproval() {
  const [bookingsWithAcceptedDrivers, setBookingsWithAcceptedDrivers] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [acceptedDrivers, setAcceptedDrivers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBookingsWithAcceptedDrivers();
  }, []);

  const fetchBookingsWithAcceptedDrivers = async () => {
    try {
      const res = await axios.get(`${API_URL}/booking-workflow/admin/pending`, { withCredentials: true });
      const bookings = res.data.bookings || [];
      
      // Show ALL bookings that are not allocated yet
      const sentBookings = bookings.filter(b => !b.allocatedDriverId);
      console.log('All bookings:', sentBookings);
      setBookingsWithAcceptedDrivers(sentBookings);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const viewAcceptedDrivers = async (booking) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/booking-workflow/admin/${booking.id}/responses`, { withCredentials: true });
      setAcceptedDrivers(res.data.acceptedDrivers || []);
      setSelectedBooking(booking);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveDriver = async (driverId) => {
    try {
      await axios.post(`${API_URL}/booking-workflow/admin/${selectedBooking.id}/allocate-driver`, 
        { driverId }, 
        { withCredentials: true }
      );
      alert('✓ Driver approved and allocated!');
      setSelectedBooking(null);
      fetchBookingsWithAcceptedDrivers();
    } catch (error) {
      alert(error.response?.data?.error || 'Error approving driver');
    }
  };

  if (selectedBooking) {
    return (
      <div className="px-3 sm:px-6 py-4 sm:py-6">
        <button 
          onClick={() => setSelectedBooking(null)} 
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black transition mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Drivers Who Accepted</h2>

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

        {/* Accepted Drivers List */}
        {acceptedDrivers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500 text-sm">No drivers have accepted yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {acceptedDrivers.map(response => (
              <div key={response.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                    {response.driver.name?.[0] || 'D'}
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-gray-900">{response.driver.name || 'Driver'}</p>
                    <p className="text-sm text-gray-600">{response.driver.phone || 'N/A'}</p>
                  </div>
                  {response.driver.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-900">{response.driver.rating}</span>
                    </div>
                  )}
                </div>
                
                {(response.driver.vehicleType || response.driver.vehicleNo) && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-4">
                    <p className="text-xs text-gray-500 mb-1 font-medium">Vehicle</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {response.driver.vehicleType || 'N/A'} • {response.driver.vehicleNo || 'N/A'}
                    </p>
                  </div>
                )}
                
                <button 
                  onClick={() => approveDriver(response.driver.id)} 
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition"
                >
                  Approve & Allocate Driver
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-6 py-4 sm:py-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Pending Driver Approval</h2>
      
      {bookingsWithAcceptedDrivers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No bookings waiting for driver approval</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Booking ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Route</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Package</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Accepted</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookingsWithAcceptedDrivers.map(booking => {
                const acceptedCount = booking.driverResponses?.filter(r => r.status === 'ACCEPTED').length || 0;
                
                return (
                  <tr key={booking.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-4">
                      <p className="text-xs text-gray-500 font-mono">#{booking.id.slice(-8)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-700 font-semibold text-xs">{booking.customer?.name?.charAt(0)}</span>
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
                        {booking.selectedPackageType}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-block bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-bold">
                        {acceptedCount} Driver{acceptedCount !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button 
                        onClick={() => viewAcceptedDrivers(booking)}
                        disabled={loading || acceptedCount === 0}
                        className="bg-black text-white px-3 py-2 rounded-lg font-semibold text-xs hover:bg-gray-800 disabled:opacity-50 transition"
                      >
                        View & Approve
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
