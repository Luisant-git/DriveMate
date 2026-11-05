import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../api/config.js';
import apiClient from '../../api/axiosConfig.js';

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
  // Excess amount (admin cut per completed ride) returned by the API
  excessPerRide?: number;
  totalExcess?: number;
  excessPaid?: number;
  excessDue?: number;
  dutiesCompleted?: number;
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

// Shared status colours so the package cards and table never drift apart.
const statusStyle = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return { pill: 'text-green-700 bg-green-50 border-green-200', dot: 'bg-green-500' };
    case 'REJECTED':
      return { pill: 'text-red-700 bg-red-50 border-red-200', dot: 'bg-red-500' };
    case 'CANCELLED':
      return { pill: 'text-orange-700 bg-orange-50 border-orange-200', dot: 'bg-orange-500' };
    case 'EXPIRED':
      return { pill: 'text-gray-600 bg-gray-100 border-gray-200', dot: 'bg-gray-400' };
    default:
      return { pill: 'text-gray-600 bg-gray-50 border-gray-200', dot: 'bg-gray-400' };
  }
};

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
  const [viewTab, setViewTab] = useState<'PACKAGES' | 'EXCESS'>('PACKAGES');
  const [excessSearch, setExcessSearch] = useState('');
  const [packageSearch, setPackageSearch] = useState('');
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleTargetSub, setSettleTargetSub] = useState<any>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [isSettling, setIsSettling] = useState(false);

  const handleSettleExcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleTargetSub) return;
    const amountNum = parseFloat(settleAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    const due = settleTargetSub.excessDue || 0;
    if (amountNum > due) {
      alert(`Amount cannot exceed current excess due (₹${Math.round(due)})`);
      return;
    }

    try {
      setIsSettling(true);
      // The admin JWT lives in 'auth-token'; apiClient always sends that one.
      await apiClient.post(`/subscriptions/admin/settle-commission/${settleTargetSub.id}`, {
        amount: Number(amountNum.toFixed(2)),
      });
      alert('Excess amount collected successfully!');
      setShowSettleModal(false);
      setSettleTargetSub(null);
      setSettleAmount('');
      fetchSubscriptions();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Error collecting excess amount');
      fetchSubscriptions();
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
    const q = packageSearch.trim().toLowerCase();
    if (q) {
      const hay = [sub.driver?.name, sub.driver?.phone, sub.plan?.name, (sub.plan as any)?.category, (sub.plan as any)?.type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filterPlan && sub.plan.id !== filterPlan) return false;
    if (filterStatus && sub.status !== filterStatus) return false;
    if (filterPayment === 'PENDING' && (!sub.remainingAmount || sub.remainingAmount <= 0)) return false;
    if (filterPayment === 'PAID' && sub.remainingAmount && sub.remainingAmount > 0) return false;
    return true;
  });

  // Activate / deactivate / reject a subscription from the admin panel
  const updateSubscriptionStatus = async (subscriptionId: string, nextStatus: 'ACTIVE' | 'CANCELLED' | 'REJECTED') => {
    const copy = {
      ACTIVE: {
        verb: 'activate',
        note: 'The driver will be able to receive duties on this plan again.',
      },
      CANCELLED: {
        verb: 'deactivate',
        note: 'The driver stops receiving duties on this plan. You can activate it again later.',
      },
      REJECTED: {
        verb: 'reject',
        note: 'A rejected plan is closed for good: it is never dispatched, it drops out of the excess ledger and the driver has to buy a package again. This can be undone with Activate.',
      },
    }[nextStatus];

    if (!window.confirm(`Are you sure you want to ${copy.verb} this subscription?\n\n${copy.note}`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/admin/status/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        credentials: 'include',
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await response.json();
      if (data.success) {
        if (data.warning) alert(data.warning);
        fetchSubscriptions();
      } else {
        alert(data.error || `Failed to ${copy.verb} subscription`);
      }
    } catch (error) {
      console.error(`Error trying to ${copy.verb} subscription:`, error);
      alert(`Could not ${copy.verb} the subscription. Please try again.`);
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

  // Show the excess ledger for active/expired subscriptions that either
  // have an excess rate on their package or have a recorded pending amount.
  // REJECTED and CANCELLED subscriptions never owe anything.
  const excessRows = subscriptions.filter((s: any) =>
    s.status !== 'REJECTED' && s.status !== 'CANCELLED' &&
    (
      (s.excessPerRide || 0) > 0 ||
      (s.excessDue || 0) > 0
    )
  );

  // Each package keeps its own line in the ledger; the search box narrows the
  // list down by driver, phone, package name or category.
  const excessSearchTerm = excessSearch.trim().toLowerCase();
  const filteredExcessRows = excessRows.filter((s: any) => {
    if (!excessSearchTerm) return true;
    const haystack = [s.driver?.name, s.driver?.phone, s.plan?.name, s.plan?.category, s.plan?.type]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(excessSearchTerm);
  });

  const excessDriverCount = new Set(
    excessRows.map((s: any) => s.driverId || s.driver?.id).filter(Boolean)
  ).size;
  const pendingDriverCount = new Set(
    excessRows
      .filter((s: any) => (s.excessDue || 0) > 0)
      .map((s: any) => s.driverId || s.driver?.id)
      .filter(Boolean)
  ).size;
  if (loading) {
    return <p className="text-sm text-gray-500 mb-4">Loading subscriptions...</p>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-lg">Driver Subscriptions</h3>
          <p className="text-xs text-gray-500">Manage package plans and track the excess amount collected per ride</p>
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
              onClick={() => setViewTab('EXCESS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${viewTab === 'EXCESS' ? 'bg-black text-white shadow-xs' : 'text-gray-500 hover:text-black'}`}
            >
              <span>Excess Amount</span>
              {pendingDriverCount > 0 && (
                <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {pendingDriverCount}
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
          {/* Filters + search */}
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={packageSearch}
              onChange={(e) => setPackageSearch(e.target.value)}
              placeholder="Search driver, phone or plan..."
              className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />

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
          <div className="md:hidden space-y-3">
            {filteredSubscriptions.map((sub) => {
              const tone = statusStyle(sub.status);
              return (
                <div
                  key={sub.id}
                  className="border border-gray-200 rounded-xl p-3 shadow-sm bg-white"
                >
                  {/* Driver + amount */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{sub.driver.name}</p>
                      <p className="text-[11px] text-gray-500">{sub.driver.phone}</p>
                    </div>
                    <p className="text-base font-black text-gray-900 shrink-0">₹{sub.amount}</p>
                  </div>

                  {/* Package + type + pending amount */}
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 truncate max-w-[160px]">
                      {sub.plan.name}
                    </span>
                    {sub.plan.type && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-gray-50 text-sky-700 border border-sky-100">
                        {sub.plan.type}
                      </span>
                    )}
                    {sub.remainingAmount !== undefined && sub.remainingAmount !== null && sub.remainingAmount > 0 && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                        Due ₹{sub.remainingAmount}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-[10px] text-gray-500">
                    {new Date(sub.startDate).toLocaleDateString()} – {new Date(sub.endDate).toLocaleDateString()}
                    {sub.paymentDueDate && sub.paymentStatus === 'PARTIAL' && (
                      <> · payment due {new Date(sub.paymentDueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</>
                    )}
                  </p>

                  {/* Status on the left, actions on the right — kept apart on purpose */}
                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full border ${tone.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                      {sub.status}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {sub.status === 'ACTIVE' ? (
                        <button
                          onClick={() => updateSubscriptionStatus(sub.id, 'CANCELLED')}
                          className="text-[10px] font-bold px-2 py-1 rounded text-orange-600 bg-orange-50 hover:bg-orange-100"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => updateSubscriptionStatus(sub.id, 'ACTIVE')}
                          className="text-[10px] font-bold px-2 py-1 rounded text-green-600 bg-green-50 hover:bg-green-100"
                        >
                          Activate
                        </button>
                      )}
                      {sub.status !== 'REJECTED' && (
                        <button
                          onClick={() => updateSubscriptionStatus(sub.id, 'REJECTED')}
                          className="text-[10px] font-bold px-2 py-1 rounded text-red-600 bg-red-50 hover:bg-red-100"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop View: fixed-grid table so every column lines up */}
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
            <table className="w-full min-w-[1200px] table-fixed text-left">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="w-[250px] px-4 py-3">Driver</th>
                  <th className="w-[220px] px-4 py-3">Plan</th>
                  <th className="w-[130px] px-4 py-3 text-right">Amount</th>
                  <th className="w-[190px] px-4 py-3">Period</th>
                  <th className="w-[125px] px-4 py-3 text-right">Status</th>
                  <th className="w-[285px] px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className={`transition hover:bg-gray-50/70 ${sub.paymentStatus === 'OVERDUE' ? 'bg-red-50/40' : sub.paymentStatus === 'PARTIAL' ? 'bg-orange-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold uppercase text-gray-600">
                          {sub.driver.name?.charAt(0)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold leading-tight text-gray-900">{sub.driver.name}</p>
                          <p className="text-xs leading-tight text-gray-500">{sub.driver.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="truncate text-sm font-semibold leading-tight text-gray-900">{sub.plan.name}</p>
                      <p className="truncate text-[11px] font-bold uppercase leading-tight tracking-wide text-gray-400">{sub.plan.type}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-bold leading-tight tabular-nums text-gray-900">₹{sub.amount}</p>
                      {sub.remainingAmount !== undefined && sub.remainingAmount !== null && sub.remainingAmount > 0 ? (
                        <p className="text-[11px] font-bold leading-tight tabular-nums text-orange-600">₹{sub.remainingAmount} due</p>
                      ) : (
                        <p className="text-[11px] leading-tight text-gray-300">—</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="whitespace-nowrap text-[13px] leading-tight tabular-nums text-gray-600">
                        {new Date(sub.startDate).toLocaleDateString()} → {new Date(sub.endDate).toLocaleDateString()}
                      </p>
                      <p className={`text-[11px] leading-tight ${sub.paymentStatus === 'OVERDUE' ? 'font-bold text-red-600' : 'text-gray-400'}`}>
                        {sub.paymentDueDate && sub.paymentStatus === 'PARTIAL'
                          ? `Pay by ${new Date(sub.paymentDueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
                          : sub.paymentStatus === 'OVERDUE' ? 'Payment overdue' : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusStyle(sub.status).pill}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusStyle(sub.status).dot}`} />
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {sub.remainingAmount !== undefined && sub.remainingAmount !== null && sub.remainingAmount > 0 && sub.status === 'ACTIVE' && (
                          <button
                            onClick={() => {
                              setSelectedSubscription(sub);
                              setShowPaymentModal(true);
                            }}
                            className="rounded-md bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-600 transition hover:bg-blue-100"
                          >
                            Update Payment
                          </button>
                        )}
                        {sub.status === 'ACTIVE' ? (
                          <button
                            onClick={() => updateSubscriptionStatus(sub.id, 'CANCELLED')}
                            className="rounded-md bg-orange-50 px-2.5 py-1.5 text-[11px] font-bold text-orange-600 transition hover:bg-orange-100"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => updateSubscriptionStatus(sub.id, 'ACTIVE')}
                            className="rounded-md bg-green-50 px-2.5 py-1.5 text-[11px] font-bold text-green-600 transition hover:bg-green-100"
                          >
                            Activate
                          </button>
                        )}
                        {sub.status !== 'REJECTED' && (
                          <button
                            onClick={() => updateSubscriptionStatus(sub.id, 'REJECTED')}
                            className="rounded-md bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-600 transition hover:bg-red-100"
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

      {/* VIEW: EXCESS AMOUNT LEDGER */}
      {viewTab === 'EXCESS' && (
        <div className="space-y-3">
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0">
              <p className="font-extrabold text-orange-950 text-sm">Excess Amount Ledger</p>
              <p className="text-[11px] text-orange-700">Excess owed per completed ride.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-white border border-orange-200 rounded-lg px-2.5 py-1 text-center">
                <p className="text-[9px] uppercase font-bold text-gray-400">Drivers</p>
                <p className="text-xs font-black text-gray-900">{excessDriverCount}</p>
              </div>
              <div className="bg-white border border-orange-200 rounded-lg px-2.5 py-1 text-center">
                <p className="text-[9px] uppercase font-bold text-gray-400">Pending Excess</p>
                <p className="text-xs font-black text-orange-600">
                  ₹{Math.round(excessRows.reduce((sum, s: any) => sum + (s.excessDue || 0), 0))}
                </p>
              </div>
            </div>
          </div>

          {/* Search: driver, phone, package or category */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              value={excessSearch}
              onChange={(e) => setExcessSearch(e.target.value)}
              placeholder="Search driver, phone or package..."
              className="w-full pl-9 pr-9 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black"
            />
            {excessSearch && (
              <button
                type="button"
                onClick={() => setExcessSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {filteredExcessRows.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-500">
              {excessRows.length === 0
                ? 'No excess amount pending. It is recorded automatically each time a driver completes a ride on a package that has an excess amount set.'
                : 'No package matches your search.'}
            </div>
          ) : (
            <>
            {/* Mobile View: one compact card per package */}
            <div className="md:hidden bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
              {filteredExcessRows.map((sub: any) => {
                const rides = sub.dutiesCompleted || 0;
                const rate = sub.excessPerRide || 0;
                const paid = sub.excessPaid || 0;
                const due = sub.excessDue || 0;
                return (
                  <div key={sub.id} className="px-3 py-2 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{sub.driver?.name}</p>
                        <p className="text-[10px] text-gray-500">{sub.driver?.phone}</p>
                      </div>
                      {due > 0 ? (
                        <div className="text-right shrink-0">
                          <p className="text-[9px] uppercase font-bold text-gray-400">Due</p>
                          <p className="text-xs font-black text-red-600">₹{Math.round(due)}</p>
                        </div>
                      ) : (
                        <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          ✓ Settled
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 truncate max-w-[150px]">
                        {sub.plan?.name}
                      </span>
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-200">
                        {sub.plan?.category}
                      </span>
                      {sub.plan?.type && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-gray-50 text-sky-700 border border-sky-100">
                          {sub.plan.type}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] text-gray-500 font-semibold truncate">
                        {rides} rides · ₹{rate}/ride · paid ₹{Math.round(paid)}
                      </p>
                      {due > 0 && (
                        <button
                          onClick={() => {
                            setSettleTargetSub(sub);
                            setSettleAmount(String(Math.round(due)));
                            setShowSettleModal(true);
                          }}
                          className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black text-white bg-black hover:bg-gray-800 transition"
                        >
                          + Collect
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: fixed-grid table, one row per package */}
            <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs md:block">
              <table className="w-full min-w-[1160px] table-fixed text-left">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="w-[240px] px-4 py-3">Driver</th>
                    <th className="w-[250px] px-4 py-3">Package</th>
                    <th className="w-[85px] px-4 py-3 text-center">Rides</th>
                    <th className="w-[125px] px-4 py-3 text-right">Excess / Ride</th>
                    <th className="w-[105px] px-4 py-3 text-right">Total</th>
                    <th className="w-[115px] px-4 py-3 text-right">Collected</th>
                    <th className="w-[140px] px-4 py-3 text-right">Balance Due</th>
                    <th className="w-[120px] px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredExcessRows.map((sub: any) => {
                    const rides = sub.dutiesCompleted || 0;
                    const rate = sub.excessPerRide || 0;
                    const total = sub.totalExcess || 0;
                    const paid = sub.excessPaid || 0;
                    const due = sub.excessDue || 0;
                    return (
                      <tr key={sub.id} className="transition hover:bg-gray-50/70">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold uppercase text-gray-600">
                              {sub.driver?.name?.charAt(0)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold leading-tight text-gray-900">{sub.driver?.name}</p>
                              <p className="text-xs leading-tight text-gray-500">{sub.driver?.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="truncate text-sm font-semibold leading-tight text-gray-900">{sub.plan?.name}</p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className="whitespace-nowrap rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">
                              {sub.plan?.category}
                            </span>
                            {sub.plan?.type && (
                              <span className="whitespace-nowrap text-[10px] font-bold text-sky-600">{sub.plan.type}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-bold tabular-nums text-gray-900">{rides}</td>
                        <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-gray-900">₹{rate}</td>
                        <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-gray-900">₹{Math.round(total)}</td>
                        <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-emerald-600">₹{Math.round(paid)}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {due > 0 ? (
                            <span className="text-sm font-black tabular-nums text-red-600">₹{Math.round(due)}</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                              ✓ Settled
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {due > 0 ? (
                            <button
                              onClick={() => {
                                setSettleTargetSub(sub);
                                setSettleAmount(String(Math.round(due)));
                                setShowSettleModal(true);
                              }}
                              className="whitespace-nowrap rounded-md bg-black px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-gray-800"
                            >
                              + Collect
                            </button>
                          ) : (
                            <span className="text-[11px] font-semibold text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
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
      {/* Collect Excess Amount Modal */}
      {showSettleModal && settleTargetSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100">
            <div className="bg-black text-white px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Collect Excess Amount</p>
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

            <form onSubmit={handleSettleExcess} className="p-5 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500 shrink-0">Package:</span>
                  <span className="font-bold text-gray-900 text-right break-words">
                    {settleTargetSub.plan?.name}
                    {settleTargetSub.plan?.category ? ` · ${settleTargetSub.plan.category}` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Excess / Ride:</span>
                  <span className="font-bold text-gray-900">₹{settleTargetSub.excessPerRide || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed Rides:</span>
                  <span className="font-bold text-gray-900">{settleTargetSub.dutiesCompleted || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Already Collected:</span>
                  <span className="font-bold text-emerald-700">₹{Math.round(settleTargetSub.excessPaid || 0)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-200 font-bold">
                  <span className="text-orange-800">Total Due:</span>
                  <span className="text-orange-700 text-sm font-black">₹{Math.round(settleTargetSub.excessDue || 0)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Amount Collected (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  max={settleTargetSub.excessDue || 999999}
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
