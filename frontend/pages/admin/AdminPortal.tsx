import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../api/config.js';
import BookingWorkflow from './BookingWorkflow';
import PendingDriverApproval from './PendingDriverApproval';
import Customer from './Customer';
import Driver from './Driver';
import Lead from './Lead';
import LeadPackage from './LeadPackage';
import LeadSubscriptionList from './LeadSubscriptionList';
import SubscriptionList from './SubscriptionList';
import PricingManagement from '../../components/admin/PricingManagement';
import ServiceAreaManagement from '../../components/admin/ServiceAreaManagement';
import Reports from './Reports';
import { createSubscriptionPlan, deleteSubscriptionPlan, getSubscriptionPlans, updateSubscriptionPlan } from '@/api/subscription.js';


type SubscriptionType = 'LOCAL' | 'OUTSTATION' | 'ALL';

interface SubscriptionPlan {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
  type?: SubscriptionType;
  isActive?: boolean;
}

interface PackageFormState {
  name: string;
  type: SubscriptionType;
  price: number;
  durationDays: number;
  description: string;
}

const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'DRIVERS' | 'CUSTOMERS' | 'LEADS' | 'LEAD_PACKAGES' | 'LEAD_SUBSCRIPTIONS' | 'PACKAGES' | 'PAYMENTS' | 'BOOKINGS' | 'APPROVALS' | 'SUBSCRIPTIONS' | 'PRICING' | 'SERVICE_AREAS' | 'REPORTS'
  >('BOOKINGS');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [drivers, setDrivers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  // Subscription packages (dynamic)
  const [packages, setPackages] = useState<SubscriptionPlan[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);

  // Modal and form state for Add/Edit package
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<SubscriptionPlan | null>(null);
  const [packageForm, setPackageForm] = useState<PackageFormState>({
    name: '',
    type: 'LOCAL',
    price: 0,
    durationDays: 30,
    description: '',
  });
  const [isSavingPackage, setIsSavingPackage] = useState(false);
  const [packageModalError, setPackageModalError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'DRIVERS') {
      fetchDrivers();
    } else if (activeTab === 'PACKAGES') {
      fetchPackages();
    }
  }, [activeTab]);

  const fetchDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers`, {
        credentials: 'include',
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

  const fetchPackages = async () => {
    try {
      setPackagesLoading(true);
      const res = await getSubscriptionPlans();

      console.log('getSubscriptionPlans response:', res); // debug

      if (!res.success) {
        console.error('Failed to fetch packages:', res.message || res.error);
        setPackages([]);
        return;
      }

      // Handle both: array response and single-object response
      if (Array.isArray(res.data)) {
        setPackages(res.data as SubscriptionPlan[]);
      } else if (res.data && typeof res.data === 'object') {
        setPackages([res.data as SubscriptionPlan]);
      } else {
        setPackages([]);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages([]);
    } finally {
      setPackagesLoading(false);
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Pagination Helper
  const getPaginatedData = <T,>(data: T[]) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return {
      data: data.slice(startIndex, endIndex),
      total: data.length,
      totalPages: Math.ceil(data.length / ITEMS_PER_PAGE),
    };
  };

  const driverData = getPaginatedData(drivers);
  const paymentData = getPaginatedData(payments);

  const PaginationControls = ({
    total,
    totalPages,
  }: {
    total: number;
    totalPages: number;
  }) => {
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
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border border-gray-200 text-xs font-bold disabled:opacity-50 disabled:bg-gray-50 hover:bg-gray-50 transition text-gray-700"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded text-xs font-bold flex items-center justify-center transition ${
                currentPage === page
                  ? 'bg-black text-white'
                  : 'hover:bg-gray-50 text-gray-600'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border border-gray-200 text-xs font-bold disabled:opacity-50 disabled:bg-gray-50 hover:bg-gray-50 transition text-gray-700"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // --------------- PACKAGE MODAL HANDLERS ---------------

  const openAddPackageModal = () => {
    setEditingPackage(null);
    setPackageForm({
      name: '',
      type: 'LOCAL',
      price: 0,
      durationDays: 30,
      description: '',
    });
    setPackageModalError(null);
    setIsPackageModalOpen(true);
  };

  const openEditPackageModal = (pkg: SubscriptionPlan) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name || '',
      type: (pkg.type as SubscriptionType) || 'LOCAL',
      price: pkg.price || 0,
      durationDays: pkg.duration || 30,
      description: pkg.description || '',
    });
    setPackageModalError(null);
    setIsPackageModalOpen(true);
  };

  const closePackageModal = () => {
    setIsPackageModalOpen(false);
    setEditingPackage(null);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPackage(true);
    setPackageModalError(null);

    try {
      const payload: any = {
        name: packageForm.name,
        duration: packageForm.durationDays,
        price: packageForm.price,
        description: packageForm.description,
      };

      // Only include type if your backend supports it
      payload.type = packageForm.type;

      let res;
      if (editingPackage) {
        res = await updateSubscriptionPlan(editingPackage.id, payload);
      } else {
        res = await createSubscriptionPlan(payload);
      }

      if (!res.success) {
        setPackageModalError(res.message || res.error || 'Failed to save package');
        return;
      }

      closePackageModal();
      await fetchPackages();
    } catch (error) {
      console.error('Error saving package:', error);
      setPackageModalError('Something went wrong. Please try again.');
    } finally {
      setIsSavingPackage(false);
    }
  };

  const handleTogglePackageStatus = async (pkg: SubscriptionPlan) => {
    const newStatus = pkg.isActive ? false : true;
    const action = newStatus ? 'activate' : 'deactivate';
    
    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${pkg.name}"?`,
    );
    if (!confirmed) return;

    try {
      const res = await updateSubscriptionPlan(pkg.id, { isActive: newStatus });
      if (!res.success) {
        alert(res.message || res.error || `Failed to ${action} package`);
        return;
      }
      await fetchPackages();
    } catch (error) {
      console.error(`Error ${action}ing package:`, error);
      alert('Something went wrong. Please try again.');
    }
  };

  // --------------- RENDER ---------------

  return (
    <div className="space-y-6 md:space-y-8 pb-20 md:pb-10">
      {/* Responsive Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-gray-200 pb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="flex space-x-6">
            {['BOOKINGS', 'APPROVALS', 'DRIVERS', 'CUSTOMERS', 'LEADS', 'LEAD_PACKAGES', 'LEAD_SUBSCRIPTIONS', 'PACKAGES', 'SUBSCRIPTIONS', 'PRICING', 'SERVICE_AREAS', 'PAYMENTS', 'REPORTS'].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab as any)}
                  className={`text-sm font-bold transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? 'text-black underline underline-offset-8'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.replace('_', ' ')}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-card overflow-visible border border-gray-100 w-full">
        <div>
          {activeTab === 'BOOKINGS' && <BookingWorkflow />}

          {activeTab === 'APPROVALS' && <PendingDriverApproval />}

          {activeTab === 'CUSTOMERS' && <Customer />}

          {activeTab === 'DRIVERS' && <Driver />}

          {activeTab === 'LEADS' && <Lead />}

          {activeTab === 'LEAD_PACKAGES' && <LeadPackage />}

          {activeTab === 'LEAD_SUBSCRIPTIONS' && <LeadSubscriptionList />}

{activeTab === 'PACKAGES' && (
  <div className="p-4 md:p-6">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <h3 className="font-bold text-lg">Manage Subscription Packages</h3>
      <button
        className="w-full md:w-auto bg-black text-white px-4 py-3 md:py-2 rounded-lg text-sm font-bold"
        onClick={openAddPackageModal}
      >
        Add Package
      </button>
    </div>

    {packagesLoading && (
      <p className="text-sm text-gray-500 mb-4">Loading packages...</p>
    )}

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {packages.map((pkg) => (
        <div
          key={pkg.id}
          className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition bg-white"
        >
          <div className="flex justify-between items-start mb-2">
            {/* LEFT: name + duration */}
            <div>
              <h4 className="font-bold text-lg">{pkg.name}</h4>
              
            </div>

            {/* RIGHT: type badge */}
            <span className="bg-gray-100 text-xs font-bold px-2 py-1 rounded">
              {pkg.type || 'N/A'}
            </span>
          </div>

          <p className="text-2xl font-bold mb-2">₹{pkg.price}</p>
          <p className="text-sm text-gray-500 mb-4">{pkg.description}</p>
          <div className="flex justify-between items-center border-t border-gray-100 pt-3">
  {/* Left: duration */}
  <p className="text-xs text-gray-500">
    Duration: {pkg.duration} days
  </p>

  {/* Right: action buttons */}
  <div className="flex gap-2">
    <button
      className={`px-3 py-1 text-xs font-bold rounded cursor-pointer ${
        pkg.isActive 
          ? 'text-green-600 bg-green-50 hover:bg-green-100' 
          : 'text-red-600 bg-red-50 hover:bg-red-100'
      }`}
      onClick={() => handleTogglePackageStatus(pkg)}
    >
      {pkg.isActive ? 'Active' : 'Inactive'}
    </button>
    <button
      className="px-3 py-1 text-xs font-bold text-black bg-gray-100 rounded hover:bg-gray-200"
      onClick={() => openEditPackageModal(pkg)}
    >
      Edit
    </button>
  </div>
</div>
        </div>
      ))}
    </div>
  </div>
)}

          {activeTab === 'SUBSCRIPTIONS' && (
            <div className="p-4 md:p-6">
              <SubscriptionList />
            </div>
          )}

          {activeTab === 'PRICING' && <PricingManagement />}

          {activeTab === 'SERVICE_AREAS' && <ServiceAreaManagement />}

          {activeTab === 'REPORTS' && <Reports />}

          {activeTab === 'PAYMENTS' && (
            <>
              {/* Mobile View: Cards */}
              <div className="md:hidden p-4 space-y-4">
                {paymentData.data.map((pay: any) => (
                  <div
                    key={pay.id}
                    className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-gray-900">{pay.type}</span>
                      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                        {pay.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="text-xs text-gray-500 space-y-1">
                        <p className="font-medium text-gray-900">{pay.date}</p>
                        <p>
                          User: <span className="font-mono">{pay.userId}</span>
                        </p>
                      </div>
                      <p className="font-bold text-xl">₹{pay.amount}</p>
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
                        Date
                      </th>
                      <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        User ID
                      </th>
                      <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-8 py-5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
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
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                            {pay.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                total={paymentData.total}
                totalPages={paymentData.totalPages}
              />
            </>
          )}

        
        </div>
      </div>

      {/* ADD / EDIT PACKAGE MODAL */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingPackage ? 'Edit Package' : 'Add Package'}
              </h3>
              <button
                onClick={closePackageModal}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="px-6 py-4 space-y-4">
              {packageModalError && (
                <p className="text-xs text-red-500">{packageModalError}</p>
              )}

              <label className="block text-xs font-bold text-gray-500 uppercase">
                Name
                <input
                  type="text"
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={packageForm.name}
                  onChange={(e) =>
                    setPackageForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </label>

              <label className="block text-xs font-bold text-gray-500 uppercase">
                Type
                <select
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 bg-white"
                  value={packageForm.type}
                  onChange={(e) =>
                    setPackageForm((prev) => ({
                      ...prev,
                      type: e.target.value as SubscriptionType,
                    }))
                  }
                  required
                >
                  <option value="LOCAL">LOCAL</option>
                  <option value="OUTSTATION">OUTSTATION</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block text-xs font-bold text-gray-500 uppercase">
                  Price (₹)
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    value={packageForm.price}
                    onChange={(e) =>
                      setPackageForm((prev) => ({
                        ...prev,
                        price: Number(e.target.value),
                      }))
                    }
                    required
                  />
                </label>

                <label className="block text-xs font-bold text-gray-500 uppercase">
                  Duration (days)
                  <input
                    type="number"
                    min={1}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    value={packageForm.durationDays}
                    onChange={(e) =>
                      setPackageForm((prev) => ({
                        ...prev,
                        durationDays: Number(e.target.value),
                      }))
                    }
                    required
                  />
                </label>
              </div>

              <label className="block text-xs font-bold text-gray-500 uppercase">
                Description
                <textarea
                  rows={3}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
                  value={packageForm.description}
                  onChange={(e) =>
                    setPackageForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={closePackageModal}
                  className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPackage}
                  className="px-4 py-2 text-xs font-bold text-white bg-black rounded-lg disabled:opacity-60"
                >
                  {isSavingPackage ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;