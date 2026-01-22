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
}

const SubscriptionList: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

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

  if (loading) {
    return <p className="text-sm text-gray-500 mb-4">Loading subscriptions...</p>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="font-bold text-lg">Driver Subscriptions</h3>
      </div>

      {/* Mobile View: Cards */}
      <div className="md:hidden space-y-4">
        {subscriptions.map((sub) => (
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
            {subscriptions.map((sub) => (
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
                <td className="px-8 py-5 text-sm font-medium">₹{sub.amount}</td>
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
                  {sub.status === 'ACTIVE' && (
                    <button
                      onClick={() => rejectSubscription(sub.id)}
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

      {subscriptions.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500">No subscriptions found.</p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionList;