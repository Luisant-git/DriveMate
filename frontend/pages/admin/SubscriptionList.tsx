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
  const [viewTab, setViewTab] = useState<'PACKAGES' | 'COMMISSIONS'>('PACKAGES');
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleTargetSub, setSettleTargetSub] = useState<any>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [isSettling, setIsSettling] = useState(false);

  const handleSettleCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleTargetSub) return;
    const amountNum = parseFloat(settleAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    const due = settleTargetSub.commissionDue || 0;
    if (amountNum > due) {
      alert(`Amount cannot exceed current commission due (₹${due})`);
      return;
    }

    try {
      setIsSettling(true);
      const token = localStorage.getItem('token') || localStorage.getItem('auth-token');
      const res = await fetch(`${API_BASE_URL}/api/subscriptions/admin/settle-commission/${settleTargetSub.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ amount: amountNum })
      });
      const data = await res.json();
      if (data.success) {
        alert('Commission settlement recorded successfully!');
        setShowSettleModal(false);
        setSettleTargetSub(null);
        setSettleAmount('');
        fetchSubscriptions();
      } else {
        alert(data.error || 'Failed to settle commission');
      }
    } catch (err: any) {
      alert(err.message || 'Error settling commission');
    } finally {
      setIsSettling(false);
    }
  };

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

  const commissionRows = subscriptions.filter(s => ((s.plan as any)?.excessAmountPerRide || 0) > 0);
  const pendingCommissionsCount = commissionRows.filter(s => ((s as any).commissionDue || 0) > 0).length;
  if (loading) {
    return <p className="text-sm text-gray-500 mb-4">Loading subscriptions...</p>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-lg">Driver Subscriptions</h3>
          <p className="text-xs text-gray-500">Manage package plans and track per-ride commissions</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewTab('PACKAGES')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${viewTab === 'PACKAGES' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'}`}
            >
              Package Subscriptions
            </button>
            <button
              onClick={() => setViewTab('COMMISSIONS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${viewTab === 'COMMISSIONS' ? 'bg-black text-white shadow-xs' : 'text-gray-500 hover:text-black'}`}
            >
              <span>Per-Ride Commission</span>
              {pendingCommissionsCount > 0 && (
                <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {pendingCommissionsCount}
                </span>
              )}
            </button>
          </div>
          {viewTab === 'PACKAGES' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-black text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-800 transition"
            >
              + Create Subscription
            </button>
          )}
        </div>
      </div>

      {viewTab === 'PACKAGES' && (
        <>
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
                <span className={`text-[10px] font-bold px-2 py-1 rounded ${sub.status === 'ACTIVE' ? 'text-green-600 bg-green-50' :
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
              {sub.paidAmount !== undefined && sub.paidAmount !== null && (
                <p className="text-xs text-gray-500">Paid: ₹{sub.paidAmount}</p>
              )}
              {sub.remainingAmount !== undefined && sub.remainingAmount !== null && sub.remainingAmount > 0 && (
                <p className="text-xs font-bold text-orange-600">Remaining: ₹{sub.remainingAmount}</p>
              )}
              {sub.paymentStatus && (
                <span className={`inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${sub.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                  sub.paymentStatus === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>{sub.paymentStatus}</span>
              )}
              {sub.paymentDueDate && sub.paymentStatus === 'PARTIAL' && (
                <p className="text-[10px] text-gray-500">Due: {new Date(sub.paymentDueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              )}
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
              <tr key={sub.id} className={`hover:bg-gray-50/50 ${sub.paymentStatus === 'OVERDUE' ? 'bg-red-50/40' : sub.paymentStatus === 'PARTIAL' ? 'bg-orange-50/30' : ''}`}>
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
                  <span className={`text-xs font-bold px-2 py-1 rounded ${sub.status === 'ACTIVE' ? 'text-green-600 bg-green-50' :
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
                    {(sub as any).plan?.excessAmountPerRide > 0 && (sub as any).commissionDue > 0 && (
                      <button
                        onClick={() => {
                          setSettleTargetSub(sub);
                          setSettleAmount(String((sub as any).commissionDue || ''));
                          setShowSettleModal(true);
                        }}
                        className="text-xs font-bold px-3 py-1 rounded text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200"
                      >
                        Collect Commission
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
        </>
      )}

      {/* VIEW: SEPARATE DRIVER PER-RIDE COMMISSION LEDGER */}
      {viewTab === 'COMMISSIONS' && (
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-extrabold text-orange-950 text-sm sm:text-base">Per-Ride Commission Ledger</p>
              <p className="text-xs text-orange-700">Track and collect commission owed by drivers for completed rides under their package.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white border border-orange-200 rounded-lg px-3 py-1.5 text-center">
                <p className="text-[10px] uppercase font-bold text-gray-400">Total Drivers</p>
                <p className="text-sm font-black text-gray-900">{commissionRows.length}</p>
              </div>
              <div className="bg-white border border-orange-200 rounded-lg px-3 py-1.5 text-center">
                <p className="text-[10px] uppercase font-bold text-gray-400">Pending Dues</p>
                <p className="text-sm font-black text-orange-600">
                  ₹{commissionRows.reduce((sum, s: any) => sum + (s.commissionDue || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          {commissionRows.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-500">
              No packages with per-ride commission configured yet. Set an Excess Amount / Ride in Manage Packages.
            </div>
          ) : (
            <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-xs">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Driver</th>
                    <th className="px-6 py-4">Package</th>
                    <th className="px-6 py-4">Completed Rides</th>
                    <th className="px-6 py-4">Rate / Ride</th>
                    <th className="px-6 py-4">Total Commission</th>
                    <th className="px-6 py-4">Paid</th>
                    <th className="px-6 py-4">Balance Due</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {commissionRows.map((sub: any) => {
                    const rate = sub.plan?.excessAmountPerRide || 0;
                    const rides = sub.dutiesCompleted || 0;
                    const total = rides * rate;
                    const paid = sub.commissionPaid || 0;
                    const due = sub.commissionDue !== undefined ? sub.commissionDue : Math.max(0, total - paid);
                    return (
                      <tr key={sub.id} className="hover:bg-gray-50/60 transition">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{sub.driver?.name}</p>
                          <p className="text-xs text-gray-500">{sub.driver?.phone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-800">{sub.plan?.name}</span>
                          <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                            {sub.plan?.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900">{rides}</span> rides
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          ₹{rate}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          ₹{total}
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-600">
                          ₹{paid}
                        </td>
                        <td className="px-6 py-4">
                          {due > 0 ? (
                            <span className="font-black text-red-600 text-sm">₹{due}</span>
                          ) : (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              ✓ All Settled
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {due > 0 ? (
                            <button
                              onClick={() => {
                                setSettleTargetSub(sub);
                                setSettleAmount(String(due));
                                setShowSettleModal(true);
                              }}
                              className="px-3 py-1.5 text-xs font-black text-white bg-black hover:bg-gray-800 rounded-lg shadow-xs transition"
                            >
                              + Collect Commission
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 font-semibold">Settled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
                  className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${paymentMethod === 'CASH' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Cash
                </button>
                <button
                  onClick={() => setPaymentMethod('UPI')}
                  className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${paymentMethod === 'UPI' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          {/* Collect Commission Modal */}
      {showSettleModal && settleTargetSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100">
            <div className="bg-black text-white px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Collect Commission</p>
                <h3 className="text-base font-black text-white mt-0.5">{settleTargetSub.driver?.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettleModal(false)}
                className="text-gray-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSettleCommission} className="p-5 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Package:</span>
                  <span className="font-bold text-gray-900">{settleTargetSub.plan?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed Rides:</span>
                  <span className="font-bold text-gray-900">{settleTargetSub.dutiesCompleted || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Commission Rate:</span>
                  <span className="font-bold text-gray-900">₹{settleTargetSub.plan?.excessAmountPerRide} / ride</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-200 font-bold">
                  <span className="text-orange-800">Total Due:</span>
                  <span className="text-orange-700 text-sm font-black">₹{settleTargetSub.commissionDue || 0}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Amount Collected (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  max={settleTargetSub.commissionDue || 999999}
                  step="0.01"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Enter collected amount"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSettling}
                  className="flex-1 px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
                >
                  {isSettling ? 'Recording...' : 'Confirm Collected'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionList;
