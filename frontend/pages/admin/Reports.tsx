import React, { useState, useEffect } from 'react';
import { getDriverReports, getCustomerReports, getRevenueReport, getDriverTrips, getCustomerTrips } from '../../api/reports';

const Reports: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'DRIVERS' | 'CUSTOMERS' | 'REVENUE'>('DRIVERS');
  const [driverReports, setDriverReports] = useState<any[]>([]);
  const [customerReports, setCustomerReports] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', status: '' });
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [tripDetails, setTripDetails] = useState<any>(null);

  useEffect(() => {
    fetchReports();
  }, [activeReport, filters]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      if (activeReport === 'DRIVERS') {
        const res = await getDriverReports(filters);
        if (res.success) setDriverReports(res.data);
      } else if (activeReport === 'CUSTOMERS') {
        const res = await getCustomerReports(filters);
        if (res.success) setCustomerReports(res.data);
      } else if (activeReport === 'REVENUE') {
        const res = await getRevenueReport(filters);
        if (res.success) setRevenueData(res.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
  };

  const viewTrips = async (entity: any, type: 'driver' | 'customer') => {
    setSelectedEntity({ ...entity, type });
    setLoading(true);
    try {
      const res = type === 'driver' 
        ? await getDriverTrips(entity.id, filters)
        : await getCustomerTrips(entity.id, filters);
      if (res.success) setTripDetails(res.data);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedEntity(null);
    setTripDetails(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Reports</h2>
        <div className="flex gap-2">
          {['DRIVERS', 'CUSTOMERS', 'REVENUE'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveReport(tab as any)}
              className={`px-4 py-2 text-sm font-bold rounded-lg ${
                activeReport === tab ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="date"
            placeholder="Start Date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="date"
            placeholder="End Date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={() =>
              exportToCSV(
                activeReport === 'DRIVERS' ? driverReports : customerReports,
                `${activeReport.toLowerCase()}-report`
              )
            }
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold"
          >
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <>
          {activeReport === 'DRIVERS' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Package</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Rides</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Bookings</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {driverReports.map((driver) => (
                      <tr key={driver.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium">{driver.name}</td>
                        <td className="px-6 py-4 text-sm">{driver.phone}</td>
                        <td className="px-6 py-4 text-sm">{driver.packageType}</td>
                        <td className="px-6 py-4 text-sm">{driver.totalRides}</td>
                        <td className="px-6 py-4 text-sm">{driver.completedBookings}</td>
                        <td className="px-6 py-4 text-sm font-bold">₹{driver.totalRevenue.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => viewTrips(driver, 'driver')}
                            className="text-xs font-bold text-blue-600 hover:underline"
                          >
                            View Trips
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeReport === 'CUSTOMERS' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Bookings</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Completed</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Total Spent</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Advance</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customerReports.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium">{customer.name}</td>
                        <td className="px-6 py-4 text-sm">{customer.phone}</td>
                        <td className="px-6 py-4 text-sm">{customer.email}</td>
                        <td className="px-6 py-4 text-sm">{customer.totalBookings}</td>
                        <td className="px-6 py-4 text-sm">{customer.completedBookings}</td>
                        <td className="px-6 py-4 text-sm font-bold">₹{customer.totalSpent.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm">₹{customer.advancePayment.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm">{new Date(customer.joinedDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => viewTrips(customer, 'customer')}
                            className="text-xs font-bold text-blue-600 hover:underline"
                          >
                            View Trips
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeReport === 'REVENUE' && revenueData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-2">Total Bookings</p>
                <p className="text-3xl font-bold">{revenueData.totalBookings}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-2">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">₹{revenueData.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-2">Total Advance</p>
                <p className="text-3xl font-bold text-blue-600">₹{revenueData.totalAdvance.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-2">Avg Booking Value</p>
                <p className="text-3xl font-bold">₹{revenueData.averageBookingValue.toFixed(2)}</p>
              </div>
            </div>
          )}
        </>
      )}

      {selectedEntity && tripDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">
                {selectedEntity.type === 'driver' ? 'Driver' : 'Customer'} Report - {selectedEntity.name}
              </h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {selectedEntity.type === 'driver' ? (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Rides</p>
                    <p className="text-3xl font-bold text-blue-600">{selectedEntity.totalRides || 0}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Completed Rides</p>
                    <p className="text-3xl font-bold text-green-600">{selectedEntity.completedBookings || 0}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-purple-600">₹{selectedEntity.totalRevenue?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Bookings</p>
                    <p className="text-3xl font-bold text-blue-600">{selectedEntity.totalBookings || 0}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Completed Bookings</p>
                    <p className="text-3xl font-bold text-green-600">{selectedEntity.completedBookings || 0}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="text-3xl font-bold text-purple-600">₹{selectedEntity.totalSpent?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h4 className="font-bold mb-3">Bookings ({tripDetails.bookings?.length || 0})</h4>
                  {tripDetails.bookings?.length > 0 ? (
                    <div className="space-y-2">
                      {tripDetails.bookings?.map((booking: any) => (
                        <div key={booking.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <p><span className="font-bold">From:</span> {booking.pickupLocation}</p>
                            <p><span className="font-bold">To:</span> {booking.dropLocation}</p>
                            <p><span className="font-bold">Type:</span> {booking.bookingType}</p>
                            <p><span className="font-bold">Status:</span> <span className={`px-2 py-1 rounded text-xs ${booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{booking.status}</span></p>
                            <p><span className="font-bold">Amount:</span> ₹{booking.finalAmount || booking.estimateAmount || 0}</p>
                            <p><span className="font-bold">Date:</span> {new Date(booking.startDateTime).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No bookings found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
