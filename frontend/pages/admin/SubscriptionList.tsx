import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../api/config.js';

interface Subscription {
  id: string;
  driverId: string;
  driver: {
    name: string;
    phone: string;
  };
  plan: {
    name: string;
    type: string;
    price: number;
    duration: number;
  };
  status: string;
  startDate: string;
  endDate: string;
  amount: number;
  paidAmount?: number;
  remainingAmount?: number;
  isAdminCreated?: boolean;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface Package {
  id: string;
  name: string;
  type: string;
  price: number;
  duration: number;
}

const SubscriptionList: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [additionalPayment, setAdditionalPayment] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');

  useEffect(() => {
    fetchSubscriptions();
    fetchDrivers();
    fetchPackages();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` },
        credentials: 'include'
      });
      const data = await response.json();
      setDrivers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/active-packages`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setPackages(data.packages);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/all`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setSubscriptions(data.subscriptions);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async () => {
    if (!selectedDriver || !selectedPackage || !paidAmount) {
      alert('Please fill all fields');
      return;
    }

    const paid = parseFloat(paidAmount);
    if (paid <= 0 || paid > selectedPackage.price) {
      alert(`Paid amount must be between 1 and ${selectedPackage.price}`);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/admin/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          driverId: selectedDriver.id,
          planId: selectedPackage.id,
          paidAmount: paid,
          paymentMethod
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('Subscription created successfully!');
        setShowCreateModal(false);
        setSelectedDriver(null);
        setSelectedPackage(null);
        setPaidAmount('');
        setSearchTerm('');
        fetchSubscriptions();
      } else {
        alert(data.error || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Error creating subscription');
    }
  };

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.phone.includes(searchTerm)
  );

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (filterPlan && sub.plan.id !== filterPlan) return false;
    if (filterStatus && sub.status !== filterStatus) return false;
    if (filterPayment === 'PENDING' && (!sub.remainingAmount || sub.remainingAmount <= 0)) return false;
    if (filterPayment === 'PAID' && sub.remainingAmount && sub.remainingAmount > 0) return false;
    return true;
  });

  const rejectSubscription = async (subscriptionId: string) => {
    if (!window.confirm('Are you sure you want to reject this subscription?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/reject/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        fetchSubscriptions();
      }
    } catch (error) {
      console.error('Error rejecting subscription:', error);
    }
  };

  const updatePayment = async () => {
    if (!selectedSubscription || !additionalPayment) {
      alert('Please enter payment amount');
      return;
    }

    const payment = parseFloat(additionalPayment);
    if (payment <= 0 || payment > (selectedSubscription.remainingAmount || 0)) {
      alert(`Payment must be between 1 and ${selectedSubscription.remainingAmount}`);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/admin/update-payment/${selectedSubscription.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        credentials: 'include',
        body: JSON.stringify({ additionalPayment: payment })
      });
      const data = await response.json();
      if (data.success) {
        alert('Payment updated successfully!');
        setShowPaymentModal(false);
        setSelectedSubscription(null);
        setAdditionalPayment('');
        fetchSubscriptions();
      } else {
        alert(data.error || 'Failed to update payment');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Error updating payment');
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500 mb-4">Loading subscriptions...</p>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="font-bold text-lg">Driver Subscriptions</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-black text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-800 transition"
        >
          + Create Subscription
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">All Plans</option>
          {packages.map(pkg => (
            <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <select
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">All Payments</option>
          <option value="PENDING">Pending Payment</option>
          <option value="PAID">Fully Paid</option>
        </select>
      </div>

      {/* Mobile View: Cards */}
      <div className="md:hidden space-y-4">
        {filteredSubscriptions.map((sub) => (
          <div
            key={sub.id}
            className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-gray-900">{sub.driver.name}</span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                  sub.status === 'ACTIVE' ? 'text-green-600 bg-green-50' : 
                  sub.status === 'REJECTED' ? 'text-red-600 bg-red-50' :
                  sub.status === 'CANCELLED' ? 'text-orange-600 bg-orange-50' :
                  sub.status === 'EXPIRED' ? 'text-gray-600 bg-gray-50' :
                  'text-gray-600 bg-gray-50'
                }`}>
                  {sub.status}
                </span>
                {sub.status === 'ACTIVE' && (
                  <button
                    onClick={() => rejectSubscription(sub.id)}
                    className="text-[10px] font-bold px-2 py-1 rounded text-red-600 bg-red-50 hover:bg-red-100"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Plan: {sub.plan.name}</p>
              <p className="text-xs text-gray-500">Phone: {sub.driver.phone}</p>
              <p className="text-xs text-gray-500">
                Period: {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
              </p>
              <p className="font-bold text-lg">₹{sub.amount}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Driver
              </th>
              <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Period
              </th>
              <th className="px-8 py-5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-8 py-5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredSubscriptions.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50/50">
                <td className="px-8 py-5 text-sm">
                  <div>
                    <p className="font-medium">{sub.driver.name}</p>
                    <p className="text-gray-500">{sub.driver.phone}</p>
                  </div>
                </td>
                <td className="px-8 py-5 text-sm">
                  <div>
                    <p className="font-medium">{sub.plan.name}</p>
                    <p className="text-gray-500">{sub.plan.type}</p>
                  </div>
                </td>
                <td className="px-8 py-5 text-sm">
                  <div>
                    <p className="font-medium">₹{sub.amount}</p>
                    {sub.remainingAmount !== undefined && sub.remainingAmount !== null && (
                      <p className={`text-xs ${sub.remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        Remaining: ₹{sub.remainingAmount}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-8 py-5 text-sm text-gray-500">
                  {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                </td>
                <td className="px-8 py-5 text-right">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    sub.status === 'ACTIVE' ? 'text-green-600 bg-green-50' : 
                    sub.status === 'REJECTED' ? 'text-red-600 bg-red-50' :
                    sub.status === 'CANCELLED' ? 'text-orange-600 bg-orange-50' :
                    sub.status === 'EXPIRED' ? 'text-gray-600 bg-gray-50' :
                    'text-gray-600 bg-gray-50'
                  }`}>
                    {sub.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    {sub.remainingAmount !== undefined && sub.remainingAmount !== null && sub.remainingAmount > 0 && sub.status === 'ACTIVE' && (
                      <button
                        onClick={() => {
                          setSelectedSubscription(sub);
                          setShowPaymentModal(true);
                        }}
                        className="text-xs font-bold px-3 py-1 rounded text-blue-600 bg-blue-50 hover:bg-blue-100"
                      >
                        Update Payment
                      </button>
                    )}
                    {sub.status === 'ACTIVE' && (
                      <button
                        onClick={() => rejectSubscription(sub.id)}
                        className="text-xs font-bold px-3 py-1 rounded text-red-600 bg-red-50 hover:bg-red-100"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSubscriptions.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500">No subscriptions found.</p>
        </div>
      )}

      {/* Create Subscription Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Subscription</h2>
            
            {/* Driver Search */}
            <div className="mb-4 relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Driver</label>
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={selectedDriver ? `${selectedDriver.name} (${selectedDriver.phone})` : searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedDriver(null);
                  setShowDriverDropdown(true);
                }}
                onFocus={() => setShowDriverDropdown(true)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
              {showDriverDropdown && !selectedDriver && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredDrivers.length > 0 ? (
                    filteredDrivers.map(driver => (
                      <div
                        key={driver.id}
                        onClick={() => {
                          setSelectedDriver(driver);
                          setShowDriverDropdown(false);
                        }}
                        className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0"
                      >
                        <p className="font-semibold text-sm">{driver.name}</p>
                        <p className="text-xs text-gray-600">{driver.phone}</p>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">No drivers found</div>
                  )}
                </div>
              )}
            </div>

            {/* Package Selection */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Package</label>
              <select
                value={selectedPackage?.id || ''}
                onChange={(e) => {
                  const pkg = packages.find(p => p.id === e.target.value);
                  setSelectedPackage(pkg || null);
                  if (pkg) setPaidAmount(pkg.price.toString());
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Choose a package</option>
                {packages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} - ₹{pkg.price} ({pkg.duration} days)
                  </option>
                ))}
              </select>
            </div>

            {/* Paid Amount */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Paid Amount {selectedPackage && `(Max: ₹${selectedPackage.price})`}
              </label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="Enter paid amount"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
              {selectedPackage && paidAmount && (
                <p className="text-xs text-gray-600 mt-1">
                  Remaining: ₹{selectedPackage.price - parseFloat(paidAmount || '0')}
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setPaymentMethod('CASH')}
                  className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${
                    paymentMethod === 'CASH' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cash
                </button>
                <button
                  onClick={() => setPaymentMethod('UPI')}
                  className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${
                    paymentMethod === 'UPI' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  UPI
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedDriver(null);
                  setSelectedPackage(null);
                  setPaidAmount('');
                  setSearchTerm('');
                }}
                className="flex-1 py-2 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={createSubscription}
                className="flex-1 bg-black text-white py-2 rounded-lg font-semibold text-sm hover:bg-gray-800 transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Payment Modal */}
      {showPaymentModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Update Payment</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Driver: <span className="font-semibold">{selectedSubscription.driver.name}</span></p>
              <p className="text-sm text-gray-600 mb-2">Plan: <span className="font-semibold">{selectedSubscription.plan.name}</span></p>
              <p className="text-sm text-gray-600 mb-2">Total Amount: <span className="font-semibold">₹{selectedSubscription.amount}</span></p>
              <p className="text-sm text-gray-600 mb-2">Paid: <span className="font-semibold">₹{selectedSubscription.paidAmount || 0}</span></p>
              <p className="text-sm font-bold text-orange-600">Remaining: ₹{selectedSubscription.remainingAmount}</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Payment (Max: ₹{selectedSubscription.remainingAmount})
              </label>
              <input
                type="number"
                value={additionalPayment}
                onChange={(e) => setAdditionalPayment(e.target.value)}
                placeholder="Enter payment amount"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedSubscription(null);
                  setAdditionalPayment('');
                }}
                className="flex-1 py-2 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={updatePayment}
                className="flex-1 bg-black text-white py-2 rounded-lg font-semibold text-sm hover:bg-gray-800 transition"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionList;