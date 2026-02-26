import React, { useState, useEffect } from 'react';
import { getAllLeadSubscriptions, rejectLeadSubscription } from '../../api/leadAdmin';
import { API_BASE_URL } from '../../api/config.js';

interface LeadSubscription {
  id: string;
  leadId: string;
  planId: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod?: string;
  status: string;
  startDate: string;
  endDate: string;
  lead: {
    name: string;
    phone: string;
    email: string;
  };
  plan: {
    id: string;
    name: string;
    type: string;
    price: number;
    duration: number;
  };
}

interface Lead {
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

const LeadSubscriptionList: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<LeadSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<LeadSubscription | null>(null);
  const [additionalPayment, setAdditionalPayment] = useState('');

  useEffect(() => {
    fetchSubscriptions();
    fetchLeads();
    fetchPackages();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` },
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setLeads(data.leads || []);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lead-packages`, {
        credentials: 'include'
      });
      const data = await response.json();
      setPackages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    const result = await getAllLeadSubscriptions();
    if (result.success) {
      setSubscriptions(result.data?.subscriptions || []);
    }
    setLoading(false);
  };

  const createSubscription = async () => {
    if (!selectedLead || !selectedPackage || !paidAmount) {
      alert('Please fill all fields');
      return;
    }

    const paid = parseFloat(paidAmount);
    if (paid <= 0 || paid > selectedPackage.price) {
      alert(`Paid amount must be between 1 and ${selectedPackage.price}`);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/lead-subscriptions/admin/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          leadId: selectedLead.id,
          planId: selectedPackage.id,
          paidAmount: paid,
          paymentMethod
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('Subscription created successfully!');
        setShowCreateModal(false);
        setSelectedLead(null);
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

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.phone.includes(searchTerm)
  );

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
      const response = await fetch(`${API_BASE_URL}/api/lead-subscriptions/admin/update-payment/${selectedSubscription.id}`, {
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

  const filteredSubscriptions = subscriptions;

  const handleReject = async (subscriptionId: string) => {
    if (!window.confirm('Are you sure you want to reject this subscription?')) return;
    
    const result = await rejectLeadSubscription(subscriptionId);
    if (result.success) {
      fetchSubscriptions();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'EXPIRED': return 'bg-red-100 text-red-700';
      case 'CANCELLED': return 'bg-gray-100 text-gray-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className="p-6">Loading subscriptions...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h3 className="font-bold text-lg">Lead Subscriptions</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-black text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-800 transition"
        >
          + Create Lead Subscription
        </button>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {filteredSubscriptions.map((sub) => (
          <div key={sub.id} className="border border-gray-200 rounded-xl p-4 bg-white">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold">{sub.lead.name}</h4>
                <p className="text-xs text-gray-500">{sub.lead.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-1 rounded ${getStatusColor(sub.status)}`}>
                  {sub.status}
                </span>
                {sub.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleReject(sub.id)}
                    className="text-xs font-bold px-2 py-1 rounded text-red-600 bg-red-50 hover:bg-red-100"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-bold">{sub.plan.name} ({sub.plan.type})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold">₹{sub.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paid:</span>
                <span className="text-green-600 font-bold">₹{sub.paidAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining:</span>
                <span className="text-red-600 font-bold">₹{sub.remainingAmount}</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t">
                <span className="text-gray-500">{formatDate(sub.startDate)}</span>
                <span className="text-gray-500">to {formatDate(sub.endDate)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Lead</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Paid</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Remaining</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Period</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSubscriptions.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-bold text-sm">{sub.lead.name}</div>
                  <div className="text-xs text-gray-500">{sub.lead.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-sm">{sub.plan.name}</div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{sub.plan.type}</span>
                </td>
                <td className="px-6 py-4 font-bold">₹{sub.amount}</td>
                <td className="px-6 py-4 text-green-600 font-bold">₹{sub.paidAmount}</td>
                <td className="px-6 py-4 text-red-600 font-bold">₹{sub.remainingAmount}</td>
                <td className="px-6 py-4 text-xs text-gray-600">
                  <div>{formatDate(sub.startDate)}</div>
                  <div>to {formatDate(sub.endDate)}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${getStatusColor(sub.status)}`}>
                    {sub.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {sub.remainingAmount > 0 && sub.status === 'ACTIVE' && (
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
                        onClick={() => handleReject(sub.id)}
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

      {/* Create Subscription Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Subscription</h2>
            
            <div className="mb-4 relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Lead</label>
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={selectedLead ? `${selectedLead.name} (${selectedLead.phone})` : searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedLead(null);
                  setShowLeadDropdown(true);
                }}
                onFocus={() => setShowLeadDropdown(true)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
              {showLeadDropdown && !selectedLead && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredLeads.length > 0 ? (
                    filteredLeads.map(lead => (
                      <div
                        key={lead.id}
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowLeadDropdown(false);
                        }}
                        className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0"
                      >
                        <p className="font-semibold text-sm">{lead.name}</p>
                        <p className="text-xs text-gray-600">{lead.phone}</p>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">No leads found</div>
                  )}
                </div>
              )}
            </div>

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
              {packages.length === 0 && (
                <p className="text-xs text-red-600 mt-1">No packages available. Please create packages first in Manage Packages.</p>
              )}
            </div>

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

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedLead(null);
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
              <p className="text-sm text-gray-600 mb-2">Lead: <span className="font-semibold">{selectedSubscription.lead.name}</span></p>
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

export default LeadSubscriptionList;
