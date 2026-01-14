import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/config.js';

const API_URL = API_BASE_URL + '/api';

export default function BookingWorkflow() {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingDrivers, setBookingDrivers] = useState({});
  const [driverCounts, setDriverCounts] = useState({ LOCAL: 0, OUTSTATION: 0, ALL_PREMIUM: 0 });

  useEffect(() => {
    fetchPendingBookings();
    fetchDriverCounts();
  }, []);

  const fetchDriverCounts = async () => {
    try {
      const [localRes, outstationRes, allRes] = await Promise.all([
        axios.get(`${API_URL}/drivers/available/LOCAL`, { withCredentials: true }),
        axios.get(`${API_URL}/drivers/available/OUTSTATION`, { withCredentials: true }),
        axios.get(`${API_URL}/drivers/available/ALL_PREMIUM`, { withCredentials: true })
      ]);
      setDriverCounts({
        LOCAL: localRes.data.count || 0,
        OUTSTATION: outstationRes.data.count || 0,
        ALL_PREMIUM: allRes.data.count || 0
      });
    } catch (error) {
      console.error('Error fetching driver counts:', error);
    }
  };

  const fetchPendingBookings = async () => {
    try {
      const res = await axios.get(`${API_URL}/booking-workflow/admin/pending`, { withCredentials: true });
      setPendingBookings(res.data.bookings);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchAvailableDrivers = async (bookingId, packageType) => {
    try {
      console.log('Fetching drivers for:', { bookingId, packageType });
      const res = await axios.get(`${API_URL}/drivers/available/${packageType}`, { withCredentials: true });
      console.log('Drivers response:', res.data);
      setBookingDrivers({
        ...bookingDrivers,
        [bookingId]: {
          packageType,
          drivers: res.data.drivers || []
        }
      });
      console.log('Updated bookingDrivers state');
    } catch (error) {
      console.error('Error fetching drivers:', error);
      console.error('Error response:', error.response?.data);
      setBookingDrivers({
        ...bookingDrivers,
        [bookingId]: {
          packageType,
          drivers: []
        }
      });
    }
  };

  const reviewBooking = async (bookingId, packageType) => {
    try {
      setLoading(true);
      await axios.put(`${API_URL}/booking-workflow/admin/${bookingId}/review`, 
        { selectedPackageType: packageType }, 
        { withCredentials: true }
      );
      const sendResponse = await axios.post(`${API_URL}/booking-workflow/admin/${bookingId}/send-to-drivers`, {}, { withCredentials: true });
      
      if (sendResponse.data.success) {
        alert(`✓ Booking sent to ${sendResponse.data.driversCount} drivers!`);
        setBookingDrivers({});
        fetchPendingBookings();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error sending booking';
      alert(`⚠️ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const viewResponses = async (bookingId) => {
    try {
      const res = await axios.get(`${API_URL}/booking-workflow/admin/${bookingId}/responses`, { withCredentials: true });
      setResponses(res.data.acceptedDrivers);
      setSelectedBooking(bookingId);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const allocateDriver = async (driverId) => {
    try {
      await axios.post(`${API_URL}/booking-workflow/admin/${selectedBooking}/allocate-driver`, 
        { driverId }, 
        { withCredentials: true }
      );
      alert('Driver allocated!');
      setSelectedBooking(null);
      fetchPendingBookings();
    } catch (error) {
      alert(error.response?.data?.error || 'Error');
    }
  };

  return (
    <div className="px-3 sm:px-6 py-4 sm:py-6">
      {!selectedBooking ? (
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Pending Bookings</h2>
          
          {/* Driver Availability Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  <p className="text-xs text-gray-500 font-medium mb-1">ALL PREMIUM Drivers</p>
                  <p className="text-2xl font-bold text-gray-900">{driverCounts.ALL_PREMIUM}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          {pendingBookings.length === 0 ? (
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date & Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Route</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingBookings.map(booking => {
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
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-gray-700 font-semibold text-xs">{booking.customer.name.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{booking.customer.name}</p>
                                <p className="text-xs text-gray-600">{booking.customer.phone}</p>
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
                            <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium">{booking.bookingType}</span>
                          </td>
                          <td className="px-4 py-4">
                            {!booking.selectedPackageType ? (
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500 font-medium mb-2">Select Package Type:</p>
                                <button 
                                  onClick={() => fetchAvailableDrivers(booking.id, 'LOCAL')} 
                                  disabled={loading}
                                  className="w-full bg-black text-white px-3 py-2 rounded-lg font-semibold text-xs hover:bg-gray-800 disabled:opacity-50 transition"
                                >
                                  Local Driver Pass
                                </button>
                                <button 
                                  onClick={() => fetchAvailableDrivers(booking.id, 'OUTSTATION')} 
                                  disabled={loading}
                                  className="w-full bg-black text-white px-3 py-2 rounded-lg font-semibold text-xs hover:bg-gray-800 disabled:opacity-50 transition"
                                >
                                  Outstation Driver Pass
                                </button>
                                
                                {bookingDrivers[booking.id] && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-xs font-semibold text-gray-700 mb-2">
                                      Available {bookingDrivers[booking.id].packageType} Drivers: {bookingDrivers[booking.id].drivers.length}
                                    </p>
                                    {bookingDrivers[booking.id].drivers.length > 0 ? (
                                      <button 
                                        onClick={() => reviewBooking(booking.id, bookingDrivers[booking.id].packageType)} 
                                        disabled={loading}
                                        className="w-full bg-green-600 text-white px-3 py-2 rounded-lg font-semibold text-xs hover:bg-green-700 disabled:opacity-50 transition"
                                      >
                                        Send to {bookingDrivers[booking.id].drivers.length} Driver{bookingDrivers[booking.id].drivers.length !== 1 ? 's' : ''}
                                      </button>
                                    ) : (
                                      <p className="text-xs text-red-600">No drivers available</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="bg-green-50 rounded-lg p-2">
                                  <p className="text-xs font-medium text-green-800">✓ Sent to {booking.selectedPackageType}</p>
                                </div>
                                <button 
                                  onClick={() => viewResponses(booking.id)} 
                                  className="w-full bg-black text-white px-3 py-2 rounded-lg font-semibold text-xs hover:bg-gray-800 transition"
                                >
                                  View ({booking.driverResponses?.filter(r => r.status === 'ACCEPTED').length || 0})
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
          
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Drivers Who Accepted</h2>
          
          {responses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No drivers have accepted yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {responses.map(response => (
                <div key={response.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                        {response.driver.name[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-gray-900">{response.driver.name}</p>
                        <p className="text-sm text-gray-600">{response.driver.phone}</p>
                      </div>
                      {response.driver.rating && (
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
                        <p className="text-sm font-semibold text-gray-900">{response.driver.vehicleType} • {response.driver.vehicleNo}</p>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => allocateDriver(response.driver.id)} 
                      className="w-full bg-black text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 transition active:scale-95"
                    >
                      Allocate This Driver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
