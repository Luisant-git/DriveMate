import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../api/config.js';
import BookingWorkflow from './BookingWorkflow';
import PendingDriverApproval from './PendingDriverApproval';
import Customer from './Customer';

const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DRIVERS' | 'CUSTOMERS' | 'PACKAGES' | 'PAYMENTS' | 'BOOKINGS' | 'APPROVALS'>('BOOKINGS');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [drivers, setDrivers] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    if (activeTab === 'DRIVERS') {
      fetchDrivers();
    }
  }, [activeTab]);

  const fetchDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setDrivers(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch drivers:', response.status);
        setDrivers([]);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
      setActiveTab(tab);
      setCurrentPage(1);
  };

  const packages = [
    { id: 'p1', name: 'Local Driver Pass', type: 'LOCAL', price: 499, durationDays: 30, description: 'Accept unlimited local hourly rides for 30 days' },
    { id: 'p2', name: 'Outstation Pro', type: 'OUTSTATION', price: 999, durationDays: 30, description: 'Accept outstation and long-distance trips' },
    { id: 'p3', name: 'All Access Premium', type: 'ALL', price: 1299, durationDays: 30, description: 'Access to all trip types + Priority support' },
  ];

  // Pagination Helper
  const getPaginatedData = <T,>(data: T[]) => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      return {
          data: data.slice(startIndex, endIndex),
          total: data.length,
          totalPages: Math.ceil(data.length / ITEMS_PER_PAGE)
      };
  };

  const driverData = getPaginatedData(drivers);
  const paymentData = getPaginatedData(payments);

  const PaginationControls = ({ total, totalPages }: { total: number, totalPages: number }) => {
      if (total === 0) return null;
      
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, total);

      return (
        <div className="flex flex-col md:flex-row justify-between items-center p-4 border-t border-gray-100 gap-4 bg-white">
            <span className="text-xs text-gray-500 font-medium">
                Showing {startIndex + 1}-{endIndex} of {total} entries
            </span>
            <div className="flex gap-2">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border border-gray-200 text-xs font-bold disabled:opacity-50 disabled:bg-gray-50 hover:bg-gray-50 transition text-gray-700"
                >
                    Previous
                </button>
                {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
                    <button 
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded text-xs font-bold flex items-center justify-center transition ${currentPage === page ? 'bg-black text-white' : 'hover:bg-gray-50 text-gray-600'}`}
                    >
                        {page}
                    </button>
                ))}
                <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border border-gray-200 text-xs font-bold disabled:opacity-50 disabled:bg-gray-50 hover:bg-gray-50 transition text-gray-700"
                >
                    Next
                </button>
            </div>
        </div>
      );
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-20 md:pb-10">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-gray-200 pb-4">
             <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
             <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <div className="flex space-x-6">
                    {['BOOKINGS', 'APPROVALS', 'DRIVERS', 'CUSTOMERS', 'PACKAGES', 'PAYMENTS'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => handleTabChange(tab as any)}
                            className={`text-sm font-bold transition-colors whitespace-nowrap ${
                                activeTab === tab ? 'text-black underline underline-offset-8' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="bg-white rounded-3xl shadow-card overflow-hidden border border-gray-100">
            <div>
                {activeTab === 'BOOKINGS' && (
                    <BookingWorkflow />
                )}

                {activeTab === 'APPROVALS' && (
                    <PendingDriverApproval />
                )}

                {activeTab === 'CUSTOMERS' && (
                    <Customer />
                )}

                {activeTab === 'DRIVERS' && (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase">Driver</th>
                                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase">Package</th>
                                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase">Rating</th>
                                        <th className="px-8 py-4 text-right text-xs font-bold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {driverData.data.map((driver: any) => (
                                        <tr key={driver._id} className="hover:bg-gray-50 transition">
                                            <td className="px-8 py-5">
                                                <div className="font-bold text-gray-900">{driver.name || 'N/A'}</div>
                                                <div className="text-xs text-gray-500">{driver.phone || 'N/A'}</div>
                                            </td>
                                            <td className="px-8 py-5 text-sm">{driver.packageType || 'None'}</td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${driver.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {driver.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-sm">⭐ {driver.rating?.toFixed(1) || 'N/A'}</td>
                                            <td className="px-8 py-5 text-right">
                                                <button className="text-sm font-bold text-gray-400 hover:text-black">View</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <PaginationControls total={driverData.total} totalPages={driverData.totalPages} />
                    </>
                )}

                {activeTab === 'PACKAGES' && (
                     <div className="p-4 md:p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <h3 className="font-bold text-lg">Manage Subscription Packages</h3>
                            <button className="w-full md:w-auto bg-black text-white px-4 py-3 md:py-2 rounded-lg text-sm font-bold">Add Package</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {packages.map(pkg => (
                                <div key={pkg.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition bg-white">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-lg">{pkg.name}</h4>
                                        <span className="bg-gray-100 text-xs font-bold px-2 py-1 rounded">{pkg.type}</span>
                                    </div>
                                    <p className="text-2xl font-bold mb-2">₹{pkg.price}</p>
                                    <p className="text-sm text-gray-500 mb-4">{pkg.description}</p>
                                    <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                                        <button className="px-3 py-1 text-xs font-bold text-red-500 bg-red-50 rounded">Delete</button>
                                        <button className="px-3 py-1 text-xs font-bold text-black bg-gray-100 rounded">Edit</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                )}

                {activeTab === 'PAYMENTS' && (
                    <>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">User ID</th>
                                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                                        <th className="px-8 py-5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paymentData.data.map((pay: any) => (
                                        <tr key={pay.id} className="hover:bg-gray-50/50">
                                            <td className="px-8 py-5 text-sm font-medium">{pay.date}</td>
                                            <td className="px-8 py-5 text-sm text-gray-500">{pay.userId}</td>
                                            <td className="px-8 py-5 text-sm font-bold">{pay.type}</td>
                                            <td className="px-8 py-5 text-sm">₹{pay.amount}</td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">{pay.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <PaginationControls total={paymentData.total} totalPages={paymentData.totalPages} />
                    </>
                )}
            </div>
        </div>
    </div>
  );
};

export default AdminPortal;