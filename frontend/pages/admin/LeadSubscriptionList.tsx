import React, { useState, useEffect } from 'react';
import { getAllLeadSubscriptions, rejectLeadSubscription } from '../../api/leadAdmin';

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
    name: string;
    type: string;
  };
}

const LeadSubscriptionList: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<LeadSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    const result = await getAllLeadSubscriptions();
    if (result.success) {
      setSubscriptions(result.data?.subscriptions || []);
    }
    setLoading(false);
  };

  const filteredSubscriptions = filter === 'ALL' 
    ? subscriptions 
    : subscriptions.filter(s => s.status === filter);

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
        <div className="flex gap-2">
          {['ALL', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 text-xs font-bold rounded ${
                filter === status ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
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
                  {sub.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleReject(sub.id)}
                      className="text-xs font-bold px-3 py-1 rounded text-red-600 bg-red-50 hover:bg-red-100"
                    >
                      Reject
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadSubscriptionList;
