import React, { useState, useEffect } from 'react';
import { getDriverReports, getCustomerReports, getRevenueReport, getDriverTrips, getCustomerTrips } from '../../api/reports';
import { API_BASE_URL } from '../../api/config.js';

const Reports: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'DRIVERS' | 'CUSTOMERS' | 'REVENUE' | 'OVERDUE VERIFICATION'>('DRIVERS');
  const [driverReports, setDriverReports] = useState<any[]>([]);
  const [customerReports, setCustomerReports] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', status: '' });
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [tripDetails, setTripDetails] = useState<any>(null);
  const [originalTripDetails, setOriginalTripDetails] = useState<any>(null);
  const [modalFilters, setModalFilters] = useState({ search: '', status: '' });

  useEffect(() => {
    fetchReports();
  }, [activeReport, filters]);

  useEffect(() => {
    applyModalFilters();
  }, [modalFilters]);

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
      if (res.success) {
        setTripDetails(res.data);
        setOriginalTripDetails(res.data);
        setModalFilters({ search: '', status: '' });
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyModalFilters = () => {
    if (!originalTripDetails) return;
    
    let filtered = [...originalTripDetails.bookings];
    
    if (modalFilters.search) {
      const search = modalFilters.search.toLowerCase();
      filtered = filtered.filter((b: any) => 
        b.pickupLocation?.toLowerCase().includes(search) ||
        b.dropLocation?.toLowerCase().includes(search) ||
        b.customer?.name?.toLowerCase().includes(search) ||
        b.customer?.phone?.includes(search) ||
        b.driver?.name?.toLowerCase().includes(search) ||
        b.driver?.phone?.includes(search)
      );
    }
    
    if (modalFilters.status) {
      filtered = filtered.filter((b: any) => b.status === modalFilters.status);
    }
    
    setTripDetails({ ...originalTripDetails, bookings: filtered });
  };

  const closeModal = () => {
    setSelectedEntity(null);
    setTripDetails(null);
    setOriginalTripDetails(null);
    setModalFilters({ search: '', status: '' });
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
        <h2 className="text-xl md:text-2xl font-bold">Reports</h2>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1">
          {['DRIVERS', 'CUSTOMERS', 'REVENUE', 'OVERDUE VERIFICATION'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveReport(tab as any)}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm font-bold rounded-lg whitespace-nowrap ${
                activeReport === tab ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-4 mb-4 md:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
          <input
            type="date"
            placeholder="Start Date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full"
          />
          <input
            type="date"
            placeholder="End Date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full"
          />
          <button
            onClick={() =>
              exportToCSV(
                activeReport === 'DRIVERS' ? driverReports : customerReports,
                `${activeReport.toLowerCase()}-report`
              )
            }
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold w-full md:w-auto"
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
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Total Rides</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Completed</th>
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
                        <td className="px-6 py-4 text-sm font-bold">₹{Number(driver.totalRevenue || 0).toFixed(2)}</td>
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
                        <td className="px-6 py-4 text-sm font-bold">₹{Number(customer.totalSpent || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm">₹{Number(customer.advancePayment || 0).toFixed(2)}</td>
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
                  <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200">
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-right text-sm">Grand Total:</td>
                      <td className="px-6 py-4 text-sm text-green-700">₹{customerReports.reduce((acc, curr) => acc + Number(curr.totalSpent || 0), 0).toFixed(2)}</td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {activeReport === 'OVERDUE VERIFICATION' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Driving License Expiry</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Police Verif. Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(() => {
                      const thirtyDaysFromNow = new Date();
                      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                      const today = new Date();
                      today.setHours(0,0,0,0);

                      const overdueDrivers = driverReports.filter(d => {
                        let isOverdue = false;
                        if (!d.licenseExpiryDate || new Date(d.licenseExpiryDate) <= thirtyDaysFromNow) isOverdue = true;
                        if (!d.policeVerificationExpiryDate || new Date(d.policeVerificationExpiryDate) <= thirtyDaysFromNow) isOverdue = true;
                        return isOverdue;
                      });

                      if (overdueDrivers.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">No drivers with overdue or missing documents.</td>
                          </tr>
                        );
                      }

                      return overdueDrivers.map((driver) => {
                        const isDLExpired = !driver.licenseExpiryDate || new Date(driver.licenseExpiryDate) < today;
                        const isDLExpiring = !isDLExpired && new Date(driver.licenseExpiryDate) <= thirtyDaysFromNow;
                        
                        const isPVExpired = !driver.policeVerificationExpiryDate || new Date(driver.policeVerificationExpiryDate) < today;
                        const isPVExpiring = !isPVExpired && new Date(driver.policeVerificationExpiryDate) <= thirtyDaysFromNow;

                        return (
                          <tr key={driver.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium">{driver.name}</td>
                            <td className="px-6 py-4 text-sm">{driver.phone}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${driver.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {driver.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {!driver.licenseExpiryDate ? (
                                <span className="text-red-600 font-bold">Missing</span>
                              ) : (
                                <span className={isDLExpired ? 'text-red-600 font-bold' : isDLExpiring ? 'text-orange-600 font-bold' : 'text-gray-900'}>
                                  {new Date(driver.licenseExpiryDate).toLocaleDateString('en-GB')} {isDLExpired ? '(Expired)' : isDLExpiring ? '(Expiring Soon)' : ''}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {!driver.policeVerificationExpiryDate ? (
                                <span className="text-red-600 font-bold">Missing</span>
                              ) : (
                                <span className={isPVExpired ? 'text-red-600 font-bold' : isPVExpiring ? 'text-orange-600 font-bold' : 'text-gray-900'}>
                                  {new Date(driver.policeVerificationExpiryDate).toLocaleDateString('en-GB')} {isPVExpired ? '(Expired)' : isPVExpiring ? '(Expiring Soon)' : ''}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
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
                <p className="text-3xl font-bold text-green-600">₹{Number(revenueData.totalRevenue || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-2">Total Advance</p>
                <p className="text-3xl font-bold text-blue-600">₹{Number(revenueData.totalAdvance || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-2">Avg Booking Value</p>
                <p className="text-3xl font-bold">₹{Number(revenueData.averageBookingValue || 0).toFixed(2)}</p>
              </div>
            </div>
          )}
        </>
      )}

      {selectedEntity && tripDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-4 md:p-6 border-b flex-shrink-0">
              <h3 className="text-lg md:text-xl font-bold truncate pr-4">
                {selectedEntity.type === 'driver' ? 'Driver' : 'Customer'} Report - {selectedEntity.name}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-900 text-3xl leading-none flex-shrink-0">&times;</button>
            </div>
            <div className="p-4 md:p-6 border-b bg-gray-50 flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Search Bookings</label>
                  <input
                    type="text"
                    placeholder="Location, name, phone..."
                    value={modalFilters.search}
                    onChange={(e) => setModalFilters({ ...modalFilters, search: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Filter Status</label>
                  <select
                    value={modalFilters.status}
                    onChange={(e) => setModalFilters({ ...modalFilters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto flex-1">
              {selectedEntity.type === 'driver' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="bg-blue-50 rounded-lg p-3 md:p-4">
                    <p className="text-xs md:text-sm text-gray-600">Total Rides</p>
                    <p className="text-2xl md:text-3xl font-bold text-blue-600">{selectedEntity.totalRides || 0}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 md:p-4">
                    <p className="text-xs md:text-sm text-gray-600">Completed Rides</p>
                    <p className="text-2xl md:text-3xl font-bold text-green-600">{selectedEntity.completedBookings || 0}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 md:p-4">
                    <p className="text-xs md:text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl md:text-3xl font-bold text-purple-600">₹{Number(tripDetails.bookings?.filter((b: any) => b.status === 'COMPLETED').reduce((acc: number, curr: any) => acc + Number(curr.finalAmount || curr.estimateAmount || 0), 0) || 0).toFixed(2)}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="bg-blue-50 rounded-lg p-3 md:p-4">
                    <p className="text-xs md:text-sm text-gray-600">Total Bookings</p>
                    <p className="text-2xl md:text-3xl font-bold text-blue-600">{selectedEntity.totalBookings || 0}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 md:p-4">
                    <p className="text-xs md:text-sm text-gray-600">Completed Bookings</p>
                    <p className="text-2xl md:text-3xl font-bold text-green-600">{selectedEntity.completedBookings || 0}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 md:p-4">
                    <p className="text-xs md:text-sm text-gray-600">Total Spent</p>
                    <p className="text-2xl md:text-3xl font-bold text-purple-600">₹{Number(tripDetails.bookings?.filter((b: any) => b.status === 'COMPLETED').reduce((acc: number, curr: any) => acc + Number(curr.finalAmount || curr.estimateAmount || 0), 0) || 0).toFixed(2)}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4 md:space-y-6">
                <div>
                  <h4 className="font-bold mb-3 text-sm md:text-base">Bookings ({tripDetails.bookings?.length || 0})</h4>
                  {tripDetails.bookings?.length > 0 ? (
                    <div className="space-y-2 md:space-y-3">
                      {tripDetails.bookings?.map((booking: any) => (
                        <div key={booking.id} className="border rounded-lg p-3 md:p-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm">
                            {selectedEntity.type === 'driver' && booking.customer && (
                              <>
                                <p><span className="font-bold">Customer:</span> {booking.customer.name}</p>
                                <p><span className="font-bold">Customer Phone:</span> {booking.customer.phone}</p>
                              </>
                            )}
                            {selectedEntity.type === 'customer' && booking.driver && (
                              <>
                                <p><span className="font-bold">Driver:</span> {booking.driver.name}</p>
                                <p><span className="font-bold">Driver Phone:</span> {booking.driver.phone}</p>
                              </>
                            )}
                            <p><span className="font-bold">From:</span> {booking.pickupLocation}</p>
                            <p><span className="font-bold">To:</span> {booking.dropLocation}</p>
                            <p><span className="font-bold">Type:</span> {booking.serviceType}</p>
                            <p><span className="font-bold">Status:</span> <span className={`px-2 py-1 rounded text-xs ${booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{booking.status}</span></p>
                            <p><span className="font-bold">Base Amount:</span> ₹{booking.estimateAmount || 0}</p>
                            <p><span className="font-bold">Final Amount:</span> ₹{booking.finalAmount || booking.estimateAmount || 0}</p>
                            {booking.finalAmount > booking.estimateAmount && (
                              <p><span className="font-bold text-red-600">Extra Time Charge:</span> ₹{booking.finalAmount - booking.estimateAmount}</p>
                            )}
                            <p><span className="font-bold">Date:</span> {new Date(booking.startDateTime).toLocaleDateString()}</p>
                            <p><span className="font-bold">Duration:</span> {booking.duration || 'N/A'}</p>
                          </div>
                          
                          {(booking.carFrontPhoto || booking.carBackPhoto) && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="font-bold text-xs mb-2">Trip Photos</p>
                              <div className="flex gap-4">
                                {booking.carFrontPhoto && (
                                  <div>
                                    <p className="text-[10px] text-gray-500 uppercase mb-1">Front</p>
                                    <a href={`${API_BASE_URL}/uploads/${booking.carFrontPhoto}`} target="_blank" rel="noreferrer">
                                      <img src={`${API_BASE_URL}/uploads/${booking.carFrontPhoto}`} alt="Car Front" className="w-24 h-24 object-cover rounded-lg border shadow-sm hover:opacity-80 transition" />
                                    </a>
                                  </div>
                                )}
                                {booking.carBackPhoto && (
                                  <div>
                                    <p className="text-[10px] text-gray-500 uppercase mb-1">Back</p>
                                    <a href={`${API_BASE_URL}/uploads/${booking.carBackPhoto}`} target="_blank" rel="noreferrer">
                                      <img src={`${API_BASE_URL}/uploads/${booking.carBackPhoto}`} alt="Car Back" className="w-24 h-24 object-cover rounded-lg border shadow-sm hover:opacity-80 transition" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
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
