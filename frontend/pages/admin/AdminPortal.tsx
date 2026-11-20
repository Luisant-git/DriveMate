import React, { useState, useEffect, useMemo } from 'react';
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
import OverdueReport from './OverdueReport';
import BookingRoutingConfig from './BookingRoutingConfig';
import AdminDeletedAccounts from './AdminDeletedAccounts';
import AdminJobRequirements from './AdminJobRequirements';
import { createSubscriptionPlan, deleteSubscriptionPlan, getSubscriptionPlans, updateSubscriptionPlan, getSubscriptionCategories } from '@/api/subscription.js';
import { FaClipboardList, FaCheckCircle, FaCar, FaUsers, FaBullseye, FaBox, FaFileAlt, FaMoneyBillWave, FaMapMarkerAlt, FaCreditCard, FaChartBar, FaChartArea, FaTrashAlt } from 'react-icons/fa';
import { BiAnalyse, BiError } from 'react-icons/bi';
import ConfirmModal from '../../components/common/ConfirmModal';


type SubscriptionType = 'LOCAL' | 'OUTSTATION' | 'BOTH';

interface SubscriptionPlan {
  id: string;
  category?: string;
  name: string;
  duration: number;
  maxDuties?: number;
  price: number;
  description?: string;
  type?: SubscriptionType;
  isActive?: boolean;
  excessAmountPerRide?: number;
  minHours?: number;
  baseFare?: number;
  extraPerHourRate?: number;
}

interface PackageFormState {
  category: string;
  name: string;
  type: SubscriptionType;
  price: number;
  durationDays: number;
  maxDuties: number;
  minHours: number;
  baseFare: number;
  extraPerHourRate: number;
  description: string;
}

interface AdminPortalProps {
  onLogout?: () => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<
    'DRIVERS' | 'CUSTOMERS' | 'LEADS' | 'LEAD_PACKAGES' | 'LEAD_SUBSCRIPTIONS' | 'PACKAGES' | 'PAYMENTS' | 'BOOKINGS' | 'APPROVALS' | 'SUBSCRIPTIONS' | 'PRICING' | 'SERVICE_AREAS' | 'REPORTS' | 'ROUTING_CONFIG' | 'OVERDUE_REPORT' | 'DELETED_ACCOUNTS' | 'JOBS'
  >('BOOKINGS');
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const ITEMS_PER_PAGE = 10;

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string | React.ReactNode;
    type: 'danger' | 'success' | 'info';
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => { }
  });

  const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }));

  const [drivers, setDrivers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  // Subscription packages (dynamic)
  const [packages, setPackages] = useState<SubscriptionPlan[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packageCategoryFilter, setPackageCategoryFilter] = useState<string>('All');

  // Category Master state
  const DEFAULT_PACKAGE_CATEGORIES = ['Silver', 'Silver Plus', 'Gold', 'Platinum', 'Diamond'];
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('admin_subscription_categories');
      return saved ? JSON.parse(saved) : DEFAULT_PACKAGE_CATEGORIES;
    } catch {
      return DEFAULT_PACKAGE_CATEGORIES;
    }
  });
  const [showCategoryMaster, setShowCategoryMaster] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [categoryMasterError, setCategoryMasterError] = useState('');

  // Combined unique list of categories from defaults + custom + existing packages
  const allCategories = useMemo(() => {
    const pkgCats = packages.map((p) => p.category).filter(Boolean) as string[];
    return Array.from(new Set([...DEFAULT_PACKAGE_CATEGORIES, ...customCategories, ...pkgCats]));
  }, [packages, customCategories]);

  const handleAddCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setCategoryMasterError('Category name cannot be empty');
      return;
    }
    if (allCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCategoryMasterError(`Category "${trimmed}" already exists`);
      return;
    }
    const updated = Array.from(new Set([...customCategories, trimmed]));
    setCustomCategories(updated);
    try {
      localStorage.setItem('admin_subscription_categories', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save categories to localStorage:', err);
    }
    setPackageForm((prev) => ({
      ...prev,
      category: trimmed,
      type: trimmed === 'Silver' || trimmed === 'Silver Plus' ? 'LOCAL' : prev.type,
    }));
    setNewCategoryInput('');
    setCategoryMasterError('');
  };

  const handleDeleteCategory = (catToDelete: string) => {
    const inUseCount = packages.filter((p) => (p.category || 'Silver') === catToDelete).length;
    if (inUseCount > 0) {
      if (!window.confirm(`Category "${catToDelete}" is currently assigned to ${inUseCount} package(s). Removing it from the master list will keep existing packages but remove it from the dropdown. Continue?`)) {
        return;
      }
    }
    const updated = customCategories.filter((c) => c !== catToDelete);
    setCustomCategories(updated);
    try {
      localStorage.setItem('admin_subscription_categories', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save categories to localStorage:', err);
    }
    if (packageForm.category === catToDelete) {
      setPackageForm((prev) => ({ ...prev, category: 'Silver' }));
    }
  };

  // Modal and form state for Add/Edit package
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<SubscriptionPlan | null>(null);
  const [packageForm, setPackageForm] = useState<PackageFormState>({
    category: 'Silver',
    name: '',
    type: 'LOCAL',
    price: 0,
    durationDays: 0,
    maxDuties: 0,
    minHours: 0,
    baseFare: 0,
    extraPerHourRate: 0,
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
      const [res, catsRes] = await Promise.all([
        getSubscriptionPlans(),
        getSubscriptionCategories(),
      ]);

      console.log('getSubscriptionPlans response:', res);

      if (!res.success) {
        console.error('Failed to fetch packages:', res.message || res.error);
        setPackages([]);
      } else if (Array.isArray(res.data)) {
        setPackages(res.data as SubscriptionPlan[]);
      } else if (res.data && typeof res.data === 'object') {
        setPackages([res.data as SubscriptionPlan]);
      } else {
        setPackages([]);
      }

      if (catsRes && catsRes.success && Array.isArray(catsRes.data)) {
        setCustomCategories((prev) => {
          const merged = Array.from(new Set([...prev, ...(catsRes.data as string[])]));
          try {
            localStorage.setItem('admin_subscription_categories', JSON.stringify(merged));
          } catch {}
          return merged;
        });
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
    setSidebarOpen(false);
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
              className={`w-8 h-8 rounded text-xs font-bold flex items-center justify-center transition ${currentPage === page
                ? 'bg-[#0B192C] text-white'
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

  // The excess amount is never entered here — it is worked out per ride from the
  // package, so the form only carries Min Hours and Extra/Hr Rate.
  const openAddPackageModal = () => {
    setEditingPackage(null);
    setPackageForm({
      category: 'Silver',
      name: '',
      type: 'LOCAL',
      price: 0,
      durationDays: 0,
      maxDuties: 0,
      minHours: 0,
      baseFare: 0,
      extraPerHourRate: 0,
      description: '',
    });
    setPackageModalError(null);
    setIsPackageModalOpen(true);
  };

  const openEditPackageModal = (pkg: SubscriptionPlan) => {
    const planType: SubscriptionType = ['Silver', 'Silver Plus'].includes(pkg.category || 'Silver')
      ? 'LOCAL'
      : ((pkg.type as SubscriptionType) || 'LOCAL');

    setEditingPackage(pkg);
    setPackageForm({
      category: pkg.category || 'Silver',
      name: pkg.name || '',
      type: planType,
      price: pkg.price || 0,
      durationDays: pkg.duration || 30,
      maxDuties: pkg.maxDuties || 0,
      minHours: pkg.minHours || 0,
      baseFare: pkg.baseFare || 0,
      extraPerHourRate: pkg.extraPerHourRate || 0,
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
        category: packageForm.category,
        name: packageForm.name,
        duration: packageForm.durationDays === 0 ? 30 : packageForm.durationDays,
        maxDuties: packageForm.maxDuties,
        price: packageForm.price,
        description: packageForm.description,
        // The excess amount is not sent — the server works it out from the plan.
        minHours: packageForm.minHours,
        baseFare: packageForm.baseFare,
        extraPerHourRate: packageForm.extraPerHourRate,
      };

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

  const menuItems = [
    { id: 'BOOKINGS', label: 'Bookings', icon: FaClipboardList },
    { id: 'ROUTING_CONFIG', label: 'Routing Config', icon: FaClipboardList },
    { id: 'APPROVALS', label: 'Approvals', icon: FaCheckCircle },
    { id: 'CUSTOMERS', label: 'Customers', icon: FaUsers },
    { id: 'JOBS', label: 'Hiring', icon: FaClipboardList },
    { id: 'DRIVERS', label: 'Drivers', icon: FaCar },
    { id: 'LEADS', label: 'Leads', icon: FaBullseye },
    { id: 'OVERDUE_REPORT', label: 'Verification Report', icon: BiError },
    { id: 'LEAD_PACKAGES', label: 'Lead Packages', icon: FaBox },
    { id: 'LEAD_SUBSCRIPTIONS', label: 'Lead Subscriptions', icon: FaFileAlt },
    { id: 'PACKAGES', label: 'Packages', icon: FaBox },
    { id: 'SUBSCRIPTIONS', label: 'Driver Subscriptions', icon: FaFileAlt },
    { id: 'PRICING', label: 'Pricing', icon: FaMoneyBillWave },
    { id: 'SERVICE_AREAS', label: 'Service Areas', icon: FaMapMarkerAlt },
    { id: 'PAYMENTS', label: 'Payments', icon: FaCreditCard },
    { id: 'REPORTS', label: 'Reports', icon: FaChartBar },
    { id: 'DELETED_ACCOUNTS', label: 'Deleted Accounts', icon: FaTrashAlt }
  ];

  // --------------- RENDER ---------------

  return (
    <div className="flex flex-col h-screen bg-gray-50 w-full">
      {/* Top Header with SNP and Logout */}
      <div className="bg-[#0B192C] text-white h-16 flex items-center justify-between px-4 z-50 flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">SNP</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Admin User</span>
            <div className="h-8 w-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-sm">
              A
            </div>
          </div>
          <button
            onClick={() => {
              setConfirmConfig({
                isOpen: true,
                title: 'Logout',
                message: 'Are you sure you want to logout?',
                type: 'info',
                confirmText: 'Logout',
                onConfirm: () => {
                  closeConfirm();
                  if (onLogout) onLogout();
                }
              });
            }}
            className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 top-16 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto lg:flex-shrink-0 lg:top-0`}>
          <div className="flex flex-col h-full">
            {/* Logo/Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900">Admin Portal</h1>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === item.id
                      ? 'bg-[#0B192C] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <IconComponent className="text-lg" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden top-16"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          {/* Top Bar */}
          <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-lg font-bold text-gray-900">
              {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <div className="w-6"></div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            <div className="h-full">
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
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">Manage Subscription Packages</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Configure driver subscription plans and custom category groupings</p>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button
                        type="button"
                        className="flex-1 md:flex-initial bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                        onClick={() => setShowCategoryMaster(true)}
                      >
                        <span>⚙</span> Category Master
                      </button>
                      <button
                        className="flex-1 md:flex-initial bg-[#0B192C] hover:bg-[#142942] text-white px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold transition shadow-sm"
                        onClick={openAddPackageModal}
                      >
                        + Add Package
                      </button>
                    </div>
                  </div>

                  {packagesLoading && (
                    <p className="text-sm text-gray-500 mb-4">Loading packages...</p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-6">
                    {['All', ...allCategories].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setPackageCategoryFilter(cat)}
                        className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition ${packageCategoryFilter === cat
                          ? 'bg-[#0B192C] text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {allCategories.map((category) => {
                    if (packageCategoryFilter !== 'All' && category !== packageCategoryFilter) return null;
                    const categoryPackages = packages
                      .filter((pkg) => (pkg.category || 'Silver') === category)
                      .sort((a, b) => a.price - b.price);

                    if (categoryPackages.length === 0) return null;

                    return (
                      <div key={category} className="mb-8">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-3">
                          {category}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                          {categoryPackages.map((pkg) => (
                            <div
                              key={pkg.id}
                              className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition bg-white"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-bold text-lg">{pkg.category || 'Silver'} ₹{pkg.price}</h4>
                                </div>
                                <span className="bg-gray-100 text-xs font-bold px-2 py-1 rounded">
                                  {pkg.type === 'BOTH' ? 'LOCAL + OUTSTATION' : pkg.type || 'N/A'}
                                </span>
                              </div>

                              <p className="text-sm font-semibold text-gray-700 mb-2">{pkg.name}</p>
                              <p className="text-sm text-gray-500 mb-4">{pkg.description}</p>
                              <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                                <p className="text-xs text-gray-500">
                                  Duration: {pkg.duration === 36500 ? 'Unlimited' : `${pkg.duration} days`}
                                  {pkg.maxDuties ? ` | Max Duty: ${pkg.maxDuties}` : ''}
                                  {(pkg as any).minHours > 0 && (
                                    <span> | Min: {(pkg as any).minHours}hr ₹{(pkg as any).extraPerHourRate}/hr</span>
                                  )}
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    className={`px-3 py-1 text-xs font-bold rounded cursor-pointer ${pkg.isActive
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
                    );
                  })}
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
              {activeTab === 'ROUTING_CONFIG' && <BookingRoutingConfig />}
              {activeTab === 'OVERDUE_REPORT' && <OverdueReport />}
              {activeTab === 'DELETED_ACCOUNTS' && <AdminDeletedAccounts />}
              {activeTab === 'JOBS' && <AdminJobRequirements />}

              {activeTab === 'PAYMENTS' && (
                <>
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

                  <div className="hidden md:block overflow-x-auto">
                    <div className="min-w-full inline-block align-middle">
                      <div className="overflow-x-auto">
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
                    </div>
                  </div>
                  <PaginationControls
                    total={paymentData.total}
                    totalPages={paymentData.totalPages}
                  />
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* ADD / EDIT PACKAGE MODAL */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4">
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

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Category
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryMaster(true)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                  >
                    <span>⚙</span> Category Master
                  </button>
                </div>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C]/5 bg-white"
                  value={packageForm.category}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    if (newCat === '__MANAGE__') {
                      setShowCategoryMaster(true);
                      return;
                    }
                    setPackageForm((prev) => ({
                      ...prev,
                      category: newCat,
                      // Silver tiers are always LOCAL — reset type if switching to Silver
                      type: newCat === 'Silver' || newCat === 'Silver Plus' ? 'LOCAL' : prev.type,
                    }));
                  }}
                  required
                >
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__MANAGE__" className="font-semibold text-blue-600">
                    + Add / Manage Categories...
                  </option>
                </select>
              </div>

              <label className="block text-xs font-bold text-gray-500 uppercase">
                Name
                <input
                  type="text"
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C]/5"
                  value={packageForm.name}
                  onChange={(e) =>
                    setPackageForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </label>

              <label className="block text-xs font-bold text-gray-500 uppercase">
                Type
                {packageForm.category === 'Silver' || packageForm.category === 'Silver Plus' ? (
                  <div className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 flex items-center gap-2">
                    <span className="font-bold text-gray-700">LOCAL</span>
                    <span className="text-[10px] text-gray-400">(Silver plans are Local only)</span>
                  </div>
                ) : (
                  <select
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C]/5 bg-white"
                    value={packageForm.type}
                    onChange={(e) => {
                      const nextType = e.target.value as SubscriptionType;
                      setPackageForm((prev) => ({ ...prev, type: nextType }));
                    }}
                    required
                  >
                    <option value="LOCAL">LOCAL</option>
                    <option value="OUTSTATION">OUTSTATION</option>
                    <option value="BOTH">BOTH (Local + Outstation)</option>
                  </select>
                )}
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block text-xs font-bold text-gray-500 uppercase">
                  Price (₹)
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C]/5"
                    value={packageForm.price || ''}
                    placeholder="0"
                    onChange={(e) =>
                      setPackageForm((prev) => ({
                        ...prev,
                        price: Number(e.target.value),
                      }))
                    }
                    required
                  />
                </label>

                <div className="block text-xs font-bold text-gray-500 uppercase">
                  <div className="flex justify-between items-center mb-1">
                    <span>Duration (days)</span>
                    <label className="flex items-center gap-1 text-[10px] text-gray-500 font-normal cursor-pointer">
                      <input
                        type="checkbox"
                        checked={packageForm.durationDays === 36500}
                        onChange={(e) =>
                          setPackageForm((prev) => ({
                            ...prev,
                            durationDays: e.target.checked ? 36500 : 30,
                          }))
                        }
                      />
                      Unlimited
                    </label>
                  </div>
                  <input
                    type="number"
                    min={1}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C]/5 disabled:bg-gray-100 disabled:text-gray-400"
                    value={packageForm.durationDays === 36500 ? '' : (packageForm.durationDays || '')}
                    placeholder={packageForm.durationDays === 36500 ? 'Unlimited' : '30'}
                    disabled={packageForm.durationDays === 36500}
                    onChange={(e) =>
                      setPackageForm((prev) => ({
                        ...prev,
                        durationDays: e.target.value === '' ? 0 : Number(e.target.value),
                      }))
                    }
                    required={packageForm.durationDays !== 36500}
                  />
                </div>
                <label className="block text-xs font-bold text-gray-500 uppercase">
                  Max Duties
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C]/5"
                    value={packageForm.maxDuties || ''}
                    placeholder="0"
                    onChange={(e) =>
                      setPackageForm((prev) => ({
                        ...prev,
                        maxDuties: Number(e.target.value),
                      }))
                    }
                  />
                </label>
              </div>

              <label className="block text-xs font-bold text-gray-500 uppercase">
                Description
                <textarea
                  rows={3}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C]/5 resize-none"
                  value={packageForm.description}
                  placeholder="LOCAL : MINI 4 HOUR 450 EXTRA PER HOUR 90/-"
                  onChange={(e) => {
                    const description = e.target.value;
                    setPackageForm((prev) => ({ ...prev, description }));
                  }}
                />
              </label>

              {/* The excess amount has no field — it is worked out per ride.
                  Min Rate is the fare for the min hours: "MINI 4 HOUR 450". */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="block text-xs font-bold text-gray-500 uppercase">
                  Min Hours
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C]/5"
                    value={packageForm.minHours || ''}
                    onChange={(e) => {
                      const minHours = Number(e.target.value) || 0;
                      setPackageForm((prev) => ({ ...prev, minHours }));
                    }}
                  />
                </label>

                <label className="block text-xs font-bold text-gray-500 uppercase">
                  Min Rate (₹)
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C]/5"
                    value={packageForm.baseFare || ''}
                    onChange={(e) => {
                      const baseFare = Number(e.target.value) || 0;
                      setPackageForm((prev) => ({ ...prev, baseFare }));
                    }}
                  />
                </label>

                <label className="block text-xs font-bold text-gray-500 uppercase">
                  Extra/Hr Rate (₹)
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C]/5"
                    value={packageForm.extraPerHourRate || ''}
                    onChange={(e) => {
                      const extraPerHourRate = Number(e.target.value) || 0;
                      setPackageForm((prev) => ({ ...prev, extraPerHourRate }));
                    }}
                  />
                </label>
              </div>

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
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0B192C] rounded-lg disabled:opacity-60"
                >
                  {isSavingPackage ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MASTER MODAL */}
      {showCategoryMaster && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0B192C] text-white">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏷️</span>
                <div>
                  <h3 className="text-base font-bold text-white">Subscription Category Master</h3>
                  <p className="text-xs text-gray-300">Manage package categories for driver subscription plans</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCategoryMaster(false);
                  setCategoryMasterError('');
                  setNewCategoryInput('');
                }}
                className="text-gray-300 hover:text-white text-lg font-bold p-1 rounded hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Add New Category form */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Add New Category
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => {
                      setNewCategoryInput(e.target.value);
                      if (categoryMasterError) setCategoryMasterError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory(newCategoryInput);
                      }
                    }}
                    placeholder="e.g. Bronze, Executive, VIP, Night Owl..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C] bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCategory(newCategoryInput)}
                    className="bg-[#0B192C] hover:bg-[#142942] text-white px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap"
                  >
                    + Add
                  </button>
                </div>
                {categoryMasterError && (
                  <p className="text-xs text-red-500 font-medium mt-2">{categoryMasterError}</p>
                )}
              </div>

              {/* Existing Categories list */}
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    All Categories ({allCategories.length})
                  </h4>
                  <span className="text-[11px] text-gray-400">Click Select to apply to package</span>
                </div>

                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
                  {allCategories.map((cat) => {
                    const isDefault = DEFAULT_PACKAGE_CATEGORIES.includes(cat);
                    const isSelected = packageForm.category === cat;
                    const pkgCount = packages.filter((p) => (p.category || 'Silver') === cat).length;

                    return (
                      <div
                        key={cat}
                        className={`p-3.5 flex items-center justify-between gap-3 transition ${
                          isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              isSelected ? 'bg-[#0B192C]' : 'bg-gray-300'
                            }`}
                          />
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-gray-900 truncate">{cat}</span>
                              {isDefault ? (
                                <span className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                                  Default
                                </span>
                              ) : (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                                  Custom
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {pkgCount} {pkgCount === 1 ? 'package' : 'packages'} assigned
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isPackageModalOpen && (
                            <button
                              type="button"
                              onClick={() => {
                                setPackageForm((prev) => ({
                                  ...prev,
                                  category: cat,
                                  type: cat === 'Silver' || cat === 'Silver Plus' ? 'LOCAL' : prev.type,
                                }));
                                setShowCategoryMaster(false);
                              }}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                                isSelected
                                  ? 'bg-[#0B192C] text-white'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                              }`}
                            >
                              {isSelected ? '✓ Selected' : 'Select'}
                            </button>
                          )}
                          {!isDefault && (
                            <button
                              type="button"
                              title="Delete category"
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition"
                            >
                              <FaTrashAlt className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCategoryMaster(false);
                  setCategoryMasterError('');
                  setNewCategoryInput('');
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-[#0B192C] hover:bg-[#142942] rounded-lg transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal {...confirmConfig} onCancel={closeConfirm} />
    </div >
  );
};

export default AdminPortal;
