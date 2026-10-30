import React, { useState, useEffect } from 'react';
import { Driver, Trip } from '../../types';

interface SubscriptionPackage {
  id: string;
  category: string;
  name: string;
  type: string;
  duration: number;
  price: number;
  maxDuties?: number;
  excessAmountPerRide?: number;
  description?: string;
  isActive?: boolean;
}
import { tripAPI } from '../../api/trip';
import DriverBookingRequests from './DriverBookingRequests';
import { API_BASE_URL } from '../../api/config.js';
import { uploadFile } from '../../api/upload.js';
import ConfirmModal from '../../components/common/ConfirmModal';
import DocumentViewerModal from '../../components/admin/DocumentViewerModal';
import ImageCropperModal from '../../components/common/ImageCropperModal';
import UberLanguageSelector from '../../components/common/UberLanguageSelector';
import { useLanguage } from '../../context/LanguageContext';

const TripTimer = ({ startTime }: { startTime: string }) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!startTime) return;
    const updateTimer = () => {
      const now = new Date();
      const start = new Date(startTime);
      const diff = now.getTime() - start.getTime();

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setElapsed(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <span className="font-mono bg-green-900 px-2 py-0.5 rounded text-sm">{elapsed}</span>;
};

const formatTimeAMPM = (dateStr: string) => {
  if (!dateStr) return '';
  // Check if it's a full date string or just a time string (fallback)
  if (dateStr.includes('T') || dateStr.includes(' ')) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  const parts = dateStr.split(':');
  if (parts.length < 2) return dateStr;
  const hour = parseInt(parts[0], 10);
  const minute = parts[1];
  const ampm = hour >= 12 ? 'pm' : 'am';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minute} ${ampm}`;
};

const formatDateLocal = (dateStr: string) => {
  if (!dateStr) return '';
  if (dateStr.includes('T') || dateStr.includes(' ')) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-CA'); // YYYY-MM-DD
  }
  return dateStr;
};

interface DriverPortalProps {
  driver: Driver;
}

const DriverPortal: React.FC<DriverPortalProps> = ({ driver: initialDriver }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'HOME' | 'TRIPS' | 'PROFILE' | 'PACKAGES' | 'REQUESTS'>('REQUESTS');
  const [requestsSubTab, setRequestsSubTab] = useState<'PENDING' | 'HISTORY' | 'ALLOCATED'>('PENDING');
  const [driver, setDriver] = useState<Driver>(initialDriver);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [activeSubscriptions, setActiveSubscriptions] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackage | null>(null);
  const [paymentMode, setPaymentMode] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [partialAmount, setPartialAmount] = useState<string>('');
  const [showPayRemainingModal, setShowPayRemainingModal] = useState<boolean>(false);
  const [payRemainingTarget, setPayRemainingTarget] = useState<any>(null);
  const [payRemainingAmount, setPayRemainingAmount] = useState<string>('');
  // End-trip OTP state
  const [endingTripId, setEndingTripId] = useState<string | null>(null);
  const [endOtp, setEndOtp] = useState('');
  const [isEndOtpSent, setIsEndOtpSent] = useState(false);
  const [isSendingEndOtp, setIsSendingEndOtp] = useState(false);
  const [isCompletingTrip, setIsCompletingTrip] = useState(false);
  const [endTripFinalAmount, setEndTripFinalAmount] = useState<number>(0);
  const [startingTripId, setStartingTripId] = useState<string | null>(null);
  const [tripPhotos, setTripPhotos] = useState<{ front: File | null, back: File | null }>({ front: null, back: null });
  const [isStartingTrip, setIsStartingTrip] = useState(false);
  const [startOtp, setStartOtp] = useState('');
  const [isStartOtpSent, setIsStartOtpSent] = useState(false);
  const [isSendingStartOtp, setIsSendingStartOtp] = useState(false);
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

  // Document Viewer State
  const [viewingDoc, setViewingDoc] = useState<{ title: string; url: string } | null>(null);

  const getDocUrl = (path?: string | null) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  };

  // Image Cropper State
  const [croppingConfig, setCroppingConfig] = useState<{
    isOpen: boolean;
    imageSrc: string;
    originalFile?: File;
    documentTitle: string;
    field: 'photo' | 'dlPhoto' | 'panPhoto' | 'aadharPhoto' | 'policeVerificationPhoto';
    defaultAspectRatio: '1:1' | '4:3' | '3:2' | 'free';
  } | null>(null);

  const handleUploadFileDirect = async (
    fileOrBlob: File | Blob,
    field: 'photo' | 'dlPhoto' | 'panPhoto' | 'aadharPhoto' | 'policeVerificationPhoto',
    filename = 'document.jpg'
  ) => {
    try {
      const formData = new FormData();
      formData.append('file', fileOrBlob, filename);
      const response = await fetch(`${API_BASE_URL}/api/upload/file`, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (result.success) {
        setProfileData(prev => ({ ...prev, [field]: result.fileId }));
        if (field === 'policeVerificationPhoto') {
          alert('Police verification document uploaded successfully! Admin will verify it shortly.');
        }
        return result.fileId;
      } else {
        alert(result.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload document. Please try again.');
    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'photo' | 'dlPhoto' | 'panPhoto' | 'aadharPhoto' | 'policeVerificationPhoto',
    documentTitle: string,
    defaultAspectRatio: '1:1' | '4:3' | '3:2' | 'free' = '4:3'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setImagePreviews(prev => ({ ...prev, [field]: previewUrl }));
    setCroppingConfig({
      isOpen: true,
      imageSrc: previewUrl,
      originalFile: file,
      documentTitle,
      field,
      defaultAspectRatio
    });
    e.target.value = '';
  };

  // Profile Edit States
  const [profileData, setProfileData] = useState({
    ...driver,
    altPhone: driver.altPhone || [],
    upiId: driver.upiId || driver.gpayNo || '',
    photo: driver.photo || '',
    dlPhoto: driver.dlPhoto || '',
    panPhoto: driver.panPhoto || '',
    aadharPhoto: driver.aadharPhoto || '',
    policeVerificationPhoto: driver.policeVerificationPhoto || '',
    policeVerificationNo: driver.policeVerificationNo || '',
    languagesKnown: (driver as any).languagesKnown || [] as string[]
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [password, setPassword] = useState('');
  const [imagePreviews, setImagePreviews] = useState<{ [key: string]: string }>({});

  // Update local driver state when prop changes
  useEffect(() => {
    setDriver(initialDriver);
    setProfileData({
      ...initialDriver,
      altPhone: initialDriver.altPhone || [],
      upiId: initialDriver.upiId || initialDriver.gpayNo || '',
      photo: initialDriver.photo || '',
      dlPhoto: initialDriver.dlPhoto || '',
      panPhoto: initialDriver.panPhoto || '',
      aadharPhoto: initialDriver.aadharPhoto || '',
      policeVerificationPhoto: initialDriver.policeVerificationPhoto || '',
      policeVerificationNo: initialDriver.policeVerificationNo || '',
      languagesKnown: (initialDriver as any).languagesKnown || []
    });
  }, [initialDriver]);

  const fetchCurrentSubscription = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/driver`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok && data) {
        setCurrentSubscription(data);
        if (data.activeSubscriptions && Array.isArray(data.activeSubscriptions)) {
          setActiveSubscriptions(data.activeSubscriptions);
        } else {
          setActiveSubscriptions([data]);
        }
      } else {
        setCurrentSubscription(null);
        setActiveSubscriptions([]);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  useEffect(() => {
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

    const fetchTrips = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          console.error('No auth token found');
          return;
        }

        const driverRes = await tripAPI.getDriverTrips();

        if (driverRes.success) {
          setTrips(driverRes.trips || []);
        } else {
          console.error('Failed to fetch driver trips:', driverRes.error);
        }
      } catch (error) {
        console.error('Error fetching trips:', error);
      }
    };

    fetchPackages();
    fetchCurrentSubscription();
    fetchTrips();
  }, [activeTab, driver.id]);

  const calculateFinalAmount = (trip: any) => {
    const baseAmount = parseFloat(trip.estimatedCost || trip.estimateAmount || 0);
    if (!trip.actualStartTime || !trip.duration) return baseAmount;

    const actualStart = new Date(trip.actualStartTime).getTime();
    const actualEnd = new Date().getTime();
    const actualHours = Math.floor((actualEnd - actualStart) / (1000 * 60 * 60));

    let baseHours = 0;
    const durationStr = trip.duration.toLowerCase();
    const durationMatch = durationStr.match(/\d+/);
    const num = durationMatch ? parseInt(durationMatch[0]) : 0;

    if (durationStr.includes('hour') || durationStr.includes('hr')) {
      baseHours = num;
    } else if (durationStr.includes('day')) {
      baseHours = num * 12; // 1 day = 12 hrs
    } else if (durationStr.includes('month')) {
      baseHours = num * 30 * 12; // Assuming 30 days, 12 hrs/day
    }

    if (baseHours > 0 && actualHours > baseHours) {
      const extraHours = actualHours - baseHours;

      // Determine if it was an immediate or scheduled booking
      let extraPerHour = 90; // Default scheduled
      if (trip.createdAt && trip.startDateTime) {
        const created = new Date(trip.createdAt).getTime();
        const start = new Date(trip.startDateTime).getTime();
        // If start time is within 15 minutes of creation, it's considered Immediate
        if (Math.abs(start - created) <= 15 * 60 * 1000) {
          extraPerHour = 100;
        }
      }

      return baseAmount + (extraHours * extraPerHour);
    }

    return baseAmount;
  };

  const handleAcceptTrip = async (tripId: string) => {
    // This function is no longer used - admin assigns bookings
    alert('Bookings are assigned by admin. Please wait for assignment.');
  };


  const handleSubscriptionBuy = async (pkg: SubscriptionPackage) => {
    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  const renderPackageCard = (pkg: SubscriptionPackage) => {
    const activeSub = activeSubscriptions.find(s => s.plan && s.plan.id === pkg.id && s.status === 'ACTIVE');
    const daysLeft = activeSub ? Math.max(0, Math.ceil((new Date(activeSub.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;
    const isActive = Boolean(activeSub && daysLeft > 0);

    return (
      <div key={pkg.id} className={`border-2 rounded-2xl p-4 sm:p-6 relative transition-all duration-300 ${isActive ? 'border-emerald-500 bg-emerald-50/20 shadow-md ring-2 ring-emerald-500/20' : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'}`}>
        {isActive && (
          <div className="absolute -top-3 left-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            ACTIVE SUBSCRIBED
          </div>
        )}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-black">{pkg.category || 'Silver'} ₹{pkg.price}</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">{pkg.name} <span className="text-gray-400">· {pkg.duration} days</span></p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-2">
            {pkg.type && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide ${pkg.type === 'LOCAL' ? 'bg-blue-100 text-blue-800' :
                pkg.type === 'OUTSTATION' ? 'bg-purple-100 text-purple-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                {pkg.type === 'BOTH' ? 'LOCAL + OUTSTATION' : pkg.type}
              </span>
            )}
            {isActive && (
              <>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                  {daysLeft} days left
                </span>
                {activeSub?.maxDuties > 0 && (
                  <p className="text-[10px] font-semibold text-gray-500">
                    {Math.max(0, activeSub.maxDuties - (activeSub.dutiesCompleted || 0))} duties left
                  </p>
                )}
              </>
            )}
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3">{pkg.description}</p>
        {pkg.excessAmountPerRide > 0 && (
          <div className="mt-2 inline-flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-700 px-3 py-1 rounded-lg">
            <span className="text-[11px] font-black">Commission / Ride:</span>
            <span className="text-[11px] font-extrabold">₹{pkg.excessAmountPerRide}</span>
          </div>
        )}
        <p className="text-[10px] text-gray-400 font-bold mt-1.5 uppercase tracking-wide">One time payment • Non-Refundable</p>

        <button
          onClick={() => handleSubscriptionBuy(pkg)}
          className={`w-full mt-4 sm:mt-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 ${isActive
            ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer'
            : 'bg-black text-white hover:bg-gray-800 cursor-pointer shadow-sm'
            }`}
        >
          {isActive ? '✓ Subscribed (Click to Extend / Renew)' : '+ Choose Package & Pay'}
        </button>
      </div>
    );
  };

  const handlePaymentMethodSelect = async (method: string) => {
    if (!selectedPackage) return;

    setShowPaymentModal(false);
    try {
      const isPartial = paymentMode === 'PARTIAL';
      const paid = isPartial ? parseFloat(partialAmount) : selectedPackage.price;
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          planId: selectedPackage.id,
          paymentMethod: method,
          paidAmount: paid,
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Package subscribed successfully!");
        // Refresh subscription data
        const subResponse = await fetch(`${API_BASE_URL}/api/subscriptions/driver`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
          },
          credentials: 'include'
        });
        const subData = await subResponse.json();
        if (subResponse.ok && subData) {
          setCurrentSubscription(subData);
        }
      } else {
        alert(data.error || 'Failed to subscribe');
      }
    } catch (error) {
      alert('Error subscribing to package');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include',
        body: JSON.stringify({
          name: profileData.name,
          currentAddress: profileData.currentAddress,
          permanentAddress: profileData.permanentAddress,
          phone: profileData.phone,
          alternateMobile1: driver.alternateMobile1,
          alternateMobile2: driver.alternateMobile2,
          alternateMobile3: driver.alternateMobile3,
          alternateMobile4: driver.alternateMobile4,
          upiId: profileData.upiId,
          photo: profileData.photo,
          dlPhoto: profileData.dlPhoto,
          panPhoto: profileData.panPhoto,
          aadharPhoto: profileData.aadharPhoto,
          policeVerificationPhoto: profileData.policeVerificationPhoto,
          policeVerificationNo: profileData.policeVerificationNo,
          languagesKnown: (profileData as any).languagesKnown || [],
          password: password // New password
        })
      });

      const data = await response.json();

      if (data.success) {
        const updatedUser = data.user || {};
        const newDriver = {
          ...driver,
          ...updatedUser,
          altPhone: [
            updatedUser.alternateMobile1,
            updatedUser.alternateMobile2,
            updatedUser.alternateMobile3,
            updatedUser.alternateMobile4
          ].filter(phone => phone && phone.trim() !== ''),
          upiId: updatedUser.gpayNo || updatedUser.upiId,
          policeVerificationPhoto: updatedUser.policeVerificationPhoto,
          policeVerificationNo: updatedUser.policeVerificationNo || profileData.policeVerificationNo,
          languagesKnown: updatedUser.languagesKnown ?? (profileData as any).languagesKnown ?? []
        };
        setDriver(newDriver);
        setProfileData({
          ...newDriver,
          altPhone: newDriver.altPhone || [],
          upiId: newDriver.upiId || newDriver.gpayNo || '',
          photo: newDriver.photo || '',
          dlPhoto: newDriver.dlPhoto || '',
          panPhoto: newDriver.panPhoto || '',
          aadharPhoto: newDriver.aadharPhoto || '',
          policeVerificationPhoto: newDriver.policeVerificationPhoto || '',
          policeVerificationNo: newDriver.policeVerificationNo || '',
          languagesKnown: (newDriver as any).languagesKnown || (profileData as any).languagesKnown || []
        });

        setIsEditingProfile(false);
        const message = password ? "Profile and Password Updated Successfully" : "Profile Updated Successfully";
        setPassword(''); // Clear password field after success
        alert(message);
      } else {
        alert(data.error || "Profile update failed");
      }
    } catch (error) {
      alert("Profile update failed. Please try again.");
    }
  };

  // Filter for "My Active Jobs" - includes ONGOING trips with null driverId (temporary fix)
  const activeTrips = trips.filter(t => {
    const isMyTrip = t.driverId === driver.id || (t.status === 'ONGOING' && t.driverId === null);
    const hasValidStatus = ['ONGOING', 'CONFIRMED', 'ACCEPTED'].includes(t.status);
    return isMyTrip && hasValidStatus;
  }).sort((a, b) => `${a.startDate}T${a.startTime}`.localeCompare(`${b.startDate}T${b.startTime}`));


  // Sort Descending (Newest first) for history
  const pastTrips = trips.filter(t => t.status === 'COMPLETED' || t.status === 'CANCELLED')
    .sort((a, b) => `${b.startDate}T${b.startTime}`.localeCompare(`${a.startDate}T${a.startTime}`));

  return (
    <div className="max-w-3xl mx-auto h-screen flex flex-col">
      {/* Top Header Bar - Fixed */}
      <div className="bg-black text-white p-3 sm:p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <p className="font-bold text-sm leading-none">SNP Driver</p>
        </div>
        <div className="flex items-center gap-2">
          <UberLanguageSelector variant="navbar" />
          <p className="text-xs text-gray-400">Welcome, {driver.name}</p>
        </div>
      </div>

      {/* Tabs - Fixed */}
      <div className="bg-white border-b border-gray-200 flex overflow-x-auto scrollbar-hide">
        {[
          { id: 'HOME', label: t('nav.home', 'HOME') },
          { id: 'REQUESTS', label: t('nav.requests', 'REQUESTS') },
          { id: 'TRIPS', label: t('nav.trips', 'TRIPS') },
          { id: 'PACKAGES', label: t('nav.packages', 'PACKAGES') },
          { id: 'PROFILE', label: t('nav.profile', 'PROFILE') }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[70px] sm:min-w-[80px] py-3 sm:py-4 text-[10px] sm:text-xs font-bold border-b-2 transition ${activeTab === tab.id ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* REQUESTS TAB: Booking Requests */}
        {activeTab === 'REQUESTS' && (
          <div className="space-y-4 animate-fade-in">
            {/* Sub-tabs for Requests */}
            <div className="bg-white border border-gray-200 rounded-lg p-1 flex">
              {['PENDING', 'HISTORY'].map(subTab => (
                <button
                  key={subTab}
                  onClick={() => setRequestsSubTab(subTab as any)}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded transition ${requestsSubTab === subTab
                    ? 'bg-black text-white'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {subTab === 'PENDING' ? 'New Requests' : 'History'}
                </button>
              ))}
            </div>

            <DriverBookingRequests
              onNavigateToPackages={() => setActiveTab('PACKAGES')}
              activeSubTab={requestsSubTab}
            />
          </div>
        )}

        {/* HOME TAB: Active Trips Only */}
        {activeTab === 'HOME' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            {/* Active Trips */}
            {activeTrips.length > 0 ? (
              <div>
                <h3 className="text-base sm:text-lg font-bold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Ongoing Trips
                </h3>
                {activeTrips.map(trip => (
                  <div key={trip.id} className="bg-black text-white rounded-xl p-4 sm:p-5 mb-3 shadow-lg">
                    <div className="flex justify-between items-center mb-3 sm:mb-4 border-b border-gray-800 pb-2">
                      <span className="font-bold text-base sm:text-lg flex items-center gap-2">
                        {trip.status === 'ONGOING' ? 'On Trip' : 'Upcoming'}
                        {trip.status === 'ONGOING' && trip.actualStartTime && (
                          <TripTimer startTime={trip.actualStartTime} />
                        )}
                      </span>
                      <span className="bg-white text-black text-[10px] sm:text-xs font-bold px-2 py-1 rounded">{trip.serviceType || trip.type}</span>
                    </div>
                    <div className="mb-5 mt-2">
                      <div className="flex gap-3 sm:gap-4 items-stretch">
                        <div className="flex flex-col items-center mt-1.5 mb-1.5">
                          <div className="w-2.5 h-2.5 bg-white rounded-full flex-shrink-0"></div>
                          <div className="w-0.5 flex-grow bg-gray-600 my-1"></div>
                          <div className="w-2.5 h-2.5 bg-white flex-shrink-0"></div>
                        </div>
                        <div className="flex-1 space-y-4 sm:space-y-5">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2.5 sm:gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Pickup</p>
                              <p className="font-bold text-sm text-white leading-tight break-words">{trip.pickupLocation}</p>
                            </div>
                            <div className="flex-shrink-0 self-start">
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trip.pickupLocation || '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 flex items-center gap-1.5 bg-[#4285F4]/20 text-[#4285F4] rounded-full hover:bg-[#4285F4]/30 transition shadow-sm text-xs font-bold border border-[#4285F4]/10"
                                title="Navigate to Pickup"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                                To Pickup
                              </a>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2.5 sm:gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Drop-off</p>
                              <p className="font-bold text-sm text-white leading-tight break-words">{trip.dropLocation}</p>
                            </div>
                            <div className="flex-shrink-0 self-start">
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(trip.pickupLocation || '')}&destination=${encodeURIComponent(trip.dropLocation || '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 flex items-center gap-1.5 bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition shadow-sm text-xs font-bold border border-gray-700"
                                title="Navigate to Drop-off"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                                To Drop-off
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3 mb-4 border border-gray-700 flex flex-col gap-2">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-700/50">
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          Schedule
                        </span>
                        <span className="text-white font-bold text-[10px] sm:text-xs text-right leading-snug">
                          {/* <span className="block sm:inline">{formatDateLocal(trip.startDateTime || trip.startDate)} at {formatTimeAMPM(trip.startDateTime || trip.startTime)}</span> */}
                          {trip.duration && <span className="text-blue-400 block sm:inline mt-0.5 sm:mt-0">Estimate ({trip.duration})</span>}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">Base Amount</span>
                        <span className="text-green-400 font-bold text-lg">₹{trip.estimatedCost || trip.estimateAmount || 0}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {trip.status === 'ONGOING' ? (
                        (() => {
                          const lastActivityTime = (trip as any).updatedAt || trip.actualStartTime;
                          const hoursSinceLastActivity = lastActivityTime ? Math.ceil((new Date().getTime() - new Date(lastActivityTime).getTime()) / (1000 * 60 * 60)) : 0;
                          if (hoursSinceLastActivity > 12 && startingTripId !== trip.id) {
                            return (
                              <div className="bg-yellow-50 p-4 rounded-xl space-y-4 border border-yellow-200">
                                <div className="flex items-start gap-3">
                                  <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                                  <div>
                                    <p className="font-bold text-yellow-900 text-sm">Trip exceeded 12 hours</p>
                                    <p className="text-xs text-yellow-700 mt-1">You must re-verify your vehicle photos and OTP to continue the ride.</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setStartingTripId(trip.id)}
                                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-bold transition-all duration-200 shadow-md"
                                >
                                  Re-verify & Continue Ride
                                </button>
                              </div>
                            );
                          } else if (hoursSinceLastActivity > 12 && startingTripId === trip.id) {
                            return (
                              <div className="bg-gray-800 p-4 rounded-xl space-y-4">
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-xs text-gray-400 uppercase mb-1">Car Front View</label>
                                    <div className="relative">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        id={`carFront-${trip.id}`}
                                        className="hidden"
                                        onChange={(e) => setTripPhotos(prev => ({ ...prev, front: e.target.files?.[0] || null }))}
                                      />
                                      <label
                                        htmlFor={`carFront-${trip.id}`}
                                        className={`flex items-center justify-center w-full py-3 rounded-lg font-bold text-sm cursor-pointer transition shadow-sm ${tripPhotos.front ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'}`}
                                      >
                                        {tripPhotos.front ? (
                                          <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            Photo Captured
                                          </>
                                        ) : (
                                          <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                                            Take Photo
                                          </>
                                        )}
                                      </label>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-xs text-gray-400 uppercase mb-1">Car Back View</label>
                                    <div className="relative">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        id={`carBack-${trip.id}`}
                                        className="hidden"
                                        onChange={(e) => setTripPhotos(prev => ({ ...prev, back: e.target.files?.[0] || null }))}
                                      />
                                      <label
                                        htmlFor={`carBack-${trip.id}`}
                                        className={`flex items-center justify-center w-full py-3 rounded-lg font-bold text-sm cursor-pointer transition shadow-sm ${tripPhotos.back ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'}`}
                                      >
                                        {tripPhotos.back ? (
                                          <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            Photo Captured
                                          </>
                                        ) : (
                                          <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                                            Take Photo
                                          </>
                                        )}
                                      </label>
                                    </div>
                                  </div>
                                </div>

                                {isStartOtpSent ? (
                                  <div className="space-y-3 mt-4">
                                    <p className="text-green-400 text-sm font-bold text-center">OTP Sent successfully!</p>
                                    <input
                                      type="text"
                                      placeholder="Enter OTP from Customer"
                                      className="w-full bg-gray-700 text-white rounded-lg p-3 text-center tracking-widest font-sans text-lg border border-gray-600 focus:border-green-500 focus:outline-none"
                                      value={startOtp}
                                      onChange={(e) => setStartOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        disabled={isStartingTrip}
                                        onClick={() => { setStartingTripId(null); setIsStartOtpSent(false); setStartOtp(''); }}
                                        className="flex-1 bg-gray-700 py-3 rounded-lg font-bold text-sm"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        disabled={startOtp.length < 6 || isStartingTrip}
                                        onClick={async () => {
                                          setIsStartingTrip(true);
                                          try {
                                            const formData = new FormData();
                                            if (tripPhotos.front) formData.append('carFrontPhoto', tripPhotos.front);
                                            if (tripPhotos.back) formData.append('carBackPhoto', tripPhotos.back);

                                            let frontUrl = null;
                                            let backUrl = null;

                                            // Upload front photo
                                            if (tripPhotos.front) {
                                              const frontUpload = new FormData();
                                              frontUpload.append('file', tripPhotos.front);
                                              const fRes = await uploadFile(frontUpload);
                                              if (fRes.success) frontUrl = fRes.fileId;
                                            }

                                            // Upload back photo
                                            if (tripPhotos.back) {
                                              const backUpload = new FormData();
                                              backUpload.append('file', tripPhotos.back);
                                              const bRes = await uploadFile(backUpload);
                                              if (bRes.success) backUrl = bRes.fileId;
                                            }

                                            const result = await tripAPI.startTrip(trip.id, {
                                              otp: startOtp,
                                              ...(frontUrl && { carFrontPhoto: frontUrl }),
                                              ...(backUrl && { carBackPhoto: backUrl })
                                            });

                                            if (result.success) {
                                              setStartingTripId(null);
                                              setIsStartOtpSent(false);
                                              setStartOtp('');
                                              const driverRes = await tripAPI.getDriverTrips();
                                              if (driverRes.success) setTrips(driverRes.trips || []);

                                              setConfirmConfig({
                                                isOpen: true,
                                                title: 'Verification Successful',
                                                message: 'Your vehicle photos and OTP have been verified successfully. You can now continue the ride.',
                                                type: 'success',
                                                confirmText: 'Continue Ride',
                                                onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
                                              });
                                            } else {
                                              alert('Failed to re-verify trip: ' + (result.error || 'Invalid OTP'));
                                            }
                                          } catch (error) {
                                            console.error('Error re-verifying trip:', error);
                                            alert('Error re-verifying trip');
                                          } finally {
                                            setIsStartingTrip(false);
                                          }
                                        }}
                                        className="flex-2 bg-green-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-green-500 disabled:opacity-50"
                                      >
                                        {isStartingTrip ? 'Verifying...' : 'Verify & Continue'}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex gap-2 mt-3 w-full">
                                    <button
                                      disabled={isSendingStartOtp}
                                      onClick={() => { setStartingTripId(null); setTripPhotos({ front: null, back: null }); }}
                                      className="flex-1 bg-gray-700 py-2 rounded-lg font-bold text-sm"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      disabled={!tripPhotos.front || !tripPhotos.back || isSendingStartOtp}
                                      onClick={async () => {
                                        setIsSendingStartOtp(true);
                                        try {
                                          const res = await fetch(`${API_BASE_URL}/api/trips/${trip.id}/send-start-otp`, {
                                            method: 'POST',
                                            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
                                          });
                                          const data = await res.json();
                                          if (data.success) {
                                            setIsStartOtpSent(true);
                                          } else {
                                            alert(data.error || 'Failed to send OTP');
                                          }
                                        } catch (error) {
                                          console.error('Send OTP error:', error);
                                          alert('Failed to send OTP');
                                        } finally {
                                          setIsSendingStartOtp(false);
                                        }
                                      }}
                                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-blue-500 disabled:opacity-50"
                                    >
                                      {isSendingStartOtp ? 'Sending...' : 'Send OTP'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          }

                          return (
                            <>
                              {endingTripId === trip.id ? (
                                <div className="bg-gray-800 p-4 rounded-xl space-y-3">
                                  <p className="text-white text-sm font-bold text-center">Complete Trip</p>
                                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                                    <p className="text-gray-400 text-[10px] uppercase font-bold">Final Amount</p>
                                    <p className="text-white text-2xl font-black">₹{endTripFinalAmount}</p>
                                  </div>
                                  {isEndOtpSent ? (
                                    <div className="space-y-3">
                                      <p className="text-green-400 text-sm font-bold text-center">OTP sent to customer!</p>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Enter OTP from Customer"
                                        className="w-full bg-gray-700 text-white rounded-lg p-3 text-center tracking-widest font-sans text-lg border border-gray-600 focus:border-green-500 focus:outline-none"
                                        value={endOtp}
                                        onChange={(e) => setEndOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                      />
                                      <div className="flex gap-2">
                                        <button disabled={isCompletingTrip}
                                          onClick={() => { setEndingTripId(null); setIsEndOtpSent(false); setEndOtp(''); }}
                                          className="flex-1 bg-gray-700 py-3 rounded-lg font-bold text-sm">Cancel</button>
                                        <button
                                          disabled={endOtp.length < 6 || isCompletingTrip}
                                          onClick={async () => {
                                            setIsCompletingTrip(true);
                                            try {
                                              const result = await tripAPI.completeTrip(trip.id, { finalAmount: endTripFinalAmount, otp: endOtp });
                                              if (result.success) {
                                                setEndingTripId(null); setIsEndOtpSent(false); setEndOtp('');
                                                setConfirmConfig({ isOpen: true, title: 'Trip Completed', message: '✓ Trip completed successfully!', type: 'success', confirmText: 'OK', onConfirm: () => setConfirmConfig(p => ({ ...p, isOpen: false })) });
                                                const driverRes = await tripAPI.getDriverTrips();
                                                if (driverRes.success) setTrips(driverRes.trips);
                                                fetchCurrentSubscription();
                                              } else { alert('Failed: ' + (result.error || 'Invalid OTP')); }
                                            } catch { alert('Error completing trip. Try again.'); }
                                            finally { setIsCompletingTrip(false); }
                                          }}
                                          className="flex-2 bg-green-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-green-500 disabled:opacity-50">
                                          {isCompletingTrip ? 'Completing...' : 'Verify & Complete'}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex gap-2">
                                      <button onClick={() => { setEndingTripId(null); setEndOtp(''); }}
                                        className="flex-1 bg-gray-700 py-2 rounded-lg font-bold text-sm">Cancel</button>
                                      <button disabled={isSendingEndOtp}
                                        onClick={async () => {
                                          setIsSendingEndOtp(true);
                                          try {
                                            const res = await fetch(`${API_BASE_URL}/api/trips/${trip.id}/send-end-otp`, {
                                              method: 'POST',
                                              headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
                                            });
                                            const data = await res.json();
                                            if (data.success) { setIsEndOtpSent(true); }
                                            else { alert(data.error || 'Failed to send OTP'); }
                                          } catch { alert('Failed to send OTP'); }
                                          finally { setIsSendingEndOtp(false); }
                                        }}
                                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-blue-500 disabled:opacity-50">
                                        {isSendingEndOtp ? 'Sending...' : 'Send OTP to Customer'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    const autoCalculatedAmount = calculateFinalAmount(trip);
                                    setEndTripFinalAmount(autoCalculatedAmount);
                                    setEndingTripId(trip.id);
                                    setIsEndOtpSent(false);
                                    setEndOtp('');
                                  }}
                                  className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Complete Trip
                                </button>
                              )}
                            </>
                          );
                        })()
                      ) : startingTripId === trip.id ? (
                        <div className="bg-gray-800 p-4 rounded-xl space-y-4">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs text-gray-400 uppercase mb-1">Car Front View</label>
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  id={`carFront-${trip.id}`}
                                  className="hidden"
                                  onChange={(e) => setTripPhotos(prev => ({ ...prev, front: e.target.files?.[0] || null }))}
                                />
                                <label
                                  htmlFor={`carFront-${trip.id}`}
                                  className={`flex items-center justify-center w-full py-3 rounded-lg font-bold text-sm cursor-pointer transition shadow-sm ${tripPhotos.front ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'}`}
                                >
                                  {tripPhotos.front ? (
                                    <>
                                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                      Photo Captured
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                                      Take Photo
                                    </>
                                  )}
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs text-gray-400 uppercase mb-1">Car Back View</label>
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  id={`carBack-${trip.id}`}
                                  className="hidden"
                                  onChange={(e) => setTripPhotos(prev => ({ ...prev, back: e.target.files?.[0] || null }))}
                                />
                                <label
                                  htmlFor={`carBack-${trip.id}`}
                                  className={`flex items-center justify-center w-full py-3 rounded-lg font-bold text-sm cursor-pointer transition shadow-sm ${tripPhotos.back ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'}`}
                                >
                                  {tripPhotos.back ? (
                                    <>
                                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                      Photo Captured
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                                      Take Photo
                                    </>
                                  )}
                                </label>
                              </div>
                            </div>
                          </div>

                          {isStartOtpSent ? (
                            <div className="space-y-3 mt-4">
                              <p className="text-green-400 text-sm font-bold text-center">OTP Sent successfully!</p>
                              <input
                                type="text"
                                placeholder="Enter OTP from Customer"
                                className="w-full bg-gray-700 text-white rounded-lg p-3 text-center tracking-widest font-sans text-lg border border-gray-600 focus:border-green-500 focus:outline-none"
                                value={startOtp}
                                onChange={(e) => setStartOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              />
                              <div className="flex gap-2">
                                <button
                                  disabled={isStartingTrip}
                                  onClick={() => { setStartingTripId(null); setIsStartOtpSent(false); setStartOtp(''); }}
                                  className="flex-1 bg-gray-700 py-3 rounded-lg font-bold text-sm"
                                >
                                  Cancel
                                </button>
                                <button
                                  disabled={startOtp.length < 6 || isStartingTrip}
                                  onClick={async () => {
                                    setIsStartingTrip(true);
                                    try {
                                      const formData = new FormData();
                                      if (tripPhotos.front) formData.append('carFrontPhoto', tripPhotos.front);
                                      if (tripPhotos.back) formData.append('carBackPhoto', tripPhotos.back);

                                      let frontUrl = null;
                                      let backUrl = null;

                                      // Upload front photo
                                      if (tripPhotos.front) {
                                        const frontUpload = new FormData();
                                        frontUpload.append('file', tripPhotos.front);
                                        const fRes = await uploadFile(frontUpload);
                                        if (fRes.success) frontUrl = fRes.fileId;
                                      }

                                      // Upload back photo
                                      if (tripPhotos.back) {
                                        const backUpload = new FormData();
                                        backUpload.append('file', tripPhotos.back);
                                        const bRes = await uploadFile(backUpload);
                                        if (bRes.success) backUrl = bRes.fileId;
                                      }

                                      const result = await tripAPI.startTrip(trip.id, {
                                        otp: startOtp,
                                        ...(frontUrl && { carFrontPhoto: frontUrl }),
                                        ...(backUrl && { carBackPhoto: backUrl })
                                      });

                                      if (result.success) {
                                        alert('✓ Trip Started successfully!');
                                        setStartingTripId(null);
                                        setIsStartOtpSent(false);
                                        setStartOtp('');
                                        const driverRes = await tripAPI.getDriverTrips();
                                        if (driverRes.success) setTrips(driverRes.trips || []);
                                      } else {
                                        alert('Failed to start trip: ' + (result.error || 'Invalid OTP'));
                                      }
                                    } catch (error) {
                                      console.error('Error starting trip:', error);
                                      alert('Error starting trip');
                                    } finally {
                                      setIsStartingTrip(false);
                                    }
                                  }}
                                  className="flex-2 bg-green-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-green-500 disabled:opacity-50"
                                >
                                  {isStartingTrip ? 'Starting...' : 'Verify & Start'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2 mt-3 w-full">
                              <button
                                disabled={isSendingStartOtp}
                                onClick={() => { setStartingTripId(null); setTripPhotos({ front: null, back: null }); }}
                                className="flex-1 bg-gray-700 py-2 rounded-lg font-bold text-sm"
                              >
                                Cancel
                              </button>
                              <button
                                disabled={!tripPhotos.front || !tripPhotos.back || isSendingStartOtp}
                                onClick={async () => {
                                  setIsSendingStartOtp(true);
                                  try {
                                    const res = await fetch(`${API_BASE_URL}/api/trips/${trip.id}/send-start-otp`, {
                                      method: 'POST',
                                      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setIsStartOtpSent(true);
                                    } else {
                                      alert(data.error || 'Failed to send OTP');
                                    }
                                  } catch (error) {
                                    console.error('Send OTP error:', error);
                                    alert('Failed to send OTP');
                                  } finally {
                                    setIsSendingStartOtp(false);
                                  }
                                }}
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-blue-500 disabled:opacity-50"
                              >
                                {isSendingStartOtp ? 'Sending...' : 'Send OTP'}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          {(trip as any).cancellationRequested ? (
                            <div className="w-full bg-yellow-50 border border-yellow-200 text-yellow-700 py-3 rounded-lg font-bold text-center flex items-center justify-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              Cancellation Pending
                            </div>
                          ) : (
                            <button
                              onClick={() => setStartingTripId(trip.id)}
                              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Start Trip
                            </button>
                          )}
                        </div>
                      )}

                      {/* Trip Details Summary */}
                      {/* <div className="bg-gray-800 rounded-lg p-3 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Customer:</span>
                                            <span className="font-semibold">{trip.customer?.name || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Earnings:</span>
                                            <span className="font-bold text-green-400">₹{trip.estimatedCost || trip.estimateAmount || 0}</span>
                                        </div>
                                    </div> */}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-400 font-medium">No active trips</p>
                <p className="text-gray-400 text-sm mt-1">Wait for admin to assign bookings</p>
              </div>
            )}
          </div>
        )}

        {/* TRIPS TAB: History & Upcoming */}
        {activeTab === 'TRIPS' && (
          <div className="space-y-6 sm:space-y-8 animate-fade-in">
            {/* Upcoming / Active Trips Section */}
            <div>
              <h3 className="text-base sm:text-lg font-bold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Upcoming & Ongoing Trips
              </h3>
              {activeTrips.length === 0 ? (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-center">
                  <p className="text-gray-500 italic text-sm">No upcoming trips scheduled.</p>
                </div>
              ) : (
                activeTrips.map(trip => (
                  <div key={trip.id} className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4 sm:p-5 mb-3 shadow-md flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="bg-black text-white text-xs font-bold px-2 py-1 rounded">{trip.serviceType}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${(trip as any).cancellationRequested ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50'}`}>{(trip as any).cancellationRequested ? 'Cancellation Pending' : trip.status}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-2">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Pickup</p>
                        <p className="font-bold text-sm text-gray-900">{trip.pickupLocation}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Drop</p>
                        <p className="font-bold text-sm text-gray-900">{trip.dropLocation}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Date & Time</p>
                        <p className="font-bold text-sm text-gray-900">{trip.startDate} at {trip.startTime}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Est. Earnings</p>
                        <p className="font-bold text-sm text-gray-900">₹{trip.estimatedCost}</p>
                      </div>
                    </div>
                    {/* Cancel Action */}

                  </div>
                ))
              )}
            </div>

            {/* Trip Commission Ledger in Completed Trips History */}
            {(activeSubscriptions.length > 0 ? activeSubscriptions : (currentSubscription ? [currentSubscription] : [])).some(sub => sub.plan?.excessAmountPerRide > 0) && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900">Trip Commission Ledger</h3>
                      <p className="text-xs text-gray-500">Per-ride commission summary for your active packages</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {(activeSubscriptions.length > 0 ? activeSubscriptions : [currentSubscription]).filter(sub => sub?.plan?.excessAmountPerRide > 0).map((sub, idx) => {
                    const rate = sub.plan.excessAmountPerRide;
                    const rides = sub.dutiesCompleted || 0;
                    const total = rides * rate;
                    const paid = sub.commissionPaid || 0;
                    const due = Math.max(0, total - paid);

                    return (
                      <div key={sub.id || idx} className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-gray-200/80">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-gray-900">{sub.plan.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-700 uppercase">{sub.plan.category || 'Package'}</span>
                          </div>
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                            due > 0 ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {due > 0 ? `₹${due} Due` : '✓ All Settled'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white rounded-lg p-2 border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Rate</p>
                            <p className="font-bold text-xs sm:text-sm text-gray-800">₹{rate}/ride</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Total ({rides} rides)</p>
                            <p className="font-bold text-xs sm:text-sm text-gray-800">₹{total}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Paid to Admin</p>
                            <p className="font-bold text-xs sm:text-sm text-emerald-600">₹{paid}</p>
                          </div>
                        </div>

                        {due > 0 && (
                          <p className="text-[11px] text-orange-700 font-semibold mt-2.5 text-center bg-orange-50 py-1.5 px-2 rounded-lg border border-orange-200">
                            Outstanding ₹{due} commission to be settled at Admin office
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed Trips Section */}
            <div>
              <h3 className="text-base sm:text-lg font-bold mb-3 text-gray-400">Completed Trips</h3>
              {pastTrips.length === 0 ? (
                <p className="text-gray-500 italic text-sm">No completed trips yet.</p>
              ) : (
                pastTrips.map(trip => (
                  <div key={trip.id} className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-sm mb-4 hover:border-gray-300 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-500 mb-0.5">
                          Start: {(trip as any).actualStartTime ? new Date((trip as any).actualStartTime).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : `${trip.startDate} • ${trip.startTime}`}
                        </span>
                        {trip.status === 'COMPLETED' && (trip as any).completedAt && (
                          <span className="text-[10px] font-bold text-green-600">
                            Ended: {new Date((trip as any).completedAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${trip.status === 'CANCELLED' ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                        {trip.status === 'CANCELLED' ? ((trip as any).cancellationReason === 'Requested by Customer' ? 'Cancelled by Customer' : ((trip as any).cancellationReason === 'Requested by Driver' ? 'Cancelled by Driver' : 'Cancelled')) : 'Completed'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 mb-2">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">From</p>
                        <p className="font-bold text-sm">{trip.pickupLocation}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">To</p>
                        <p className="font-bold text-sm">{trip.dropLocation}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-end border-t border-gray-100 pt-2 mt-2">
                      <div>
                        <div className="flex gap-2 items-center">
                          <p className="text-xs text-gray-500">{trip.serviceType}</p>
                          {trip.duration && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 rounded-full font-bold">⏱ {trip.duration}</span>}
                        </div>
                        {(trip as any).rating && (
                          <div className="mt-1">
                            <p className="text-xs font-bold text-yellow-500">
                              {'★'.repeat((trip as any).rating)}
                            </p>
                            {(trip as any).feedback && (
                              <p className="text-xs text-gray-600 italic mt-0.5">"{(trip as any).feedback}"</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Final Amount</p>
                        <p className="font-bold text-lg text-green-600">₹{(trip as any).finalAmount || trip.estimatedCost || 0}</p>
                        {(trip as any).finalAmount > (trip.estimatedCost || 0) && (
                          <p className="text-[10px] text-red-500 font-bold mt-1">Includes ₹{(trip as any).finalAmount - (trip.estimatedCost || 0)} Extra</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* PACKAGES TAB: Subscription */}
        {activeTab === 'PACKAGES' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold">Driver Packages</h2>
              <p className="text-sm text-gray-500">Subscribe to multiple packages (e.g. Silver + Diamond) to receive all matching customer trips.</p>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-4 sm:mb-6">
              {['All', 'Silver', 'Gold', 'Platinum', 'Diamond'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition ${selectedCategory === cat
                    ? 'bg-black text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-3 sm:space-y-4">
              {packages.filter(pkg => selectedCategory === 'All' || (pkg.category || 'Silver') === selectedCategory).map(pkg => renderPackageCard(pkg))}
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'PROFILE' && (
          <div className="animate-fade-in pb-6 sm:pb-10">
            {!isEditingProfile ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-black h-20 sm:h-24 relative">
                  <div className="absolute -bottom-8 sm:-bottom-10 left-4 sm:left-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white bg-white flex items-center justify-center overflow-hidden p-1">
                      {driver.photo && driver.photo !== '' ? (
                        <img
                          src={driver.photo.startsWith('http') ? driver.photo : `${API_BASE_URL}${driver.photo}`}
                          alt="Profile Photo"
                          className="w-full h-full object-contain rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full ${driver.photo && driver.photo !== '' ? 'hidden' : 'flex'} items-center justify-center bg-gray-300 rounded-full`}>
                        <span className="text-gray-600 text-lg font-bold">{driver?.name?.charAt(0) || 'D'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-10 sm:pt-12 px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="flex justify-between items-start mb-4 sm:mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-bold">{driver.name || profileData.name}</h2>
                      </div>
                      <p className="text-gray-500 text-xs sm:text-sm mt-1">{driver.phone || profileData.phone}</p>
                    </div>
                    <button onClick={() => setIsEditingProfile(true)} className="text-sm font-bold text-accent hover:underline">Edit Profile</button>
                  </div>

                  {/* Uber-style Stats */}
                  <div className="mb-6 grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center text-left gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0 mt-1 sm:mt-0">
                          <p className="text-[10px] sm:text-sm text-gray-500 font-bold uppercase sm:font-normal sm:normal-case truncate">Total trips</p>
                          <p className="text-lg sm:text-2xl font-bold text-black leading-none mt-1">{trips.length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center text-left gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.05 10.101c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0 mt-1 sm:mt-0">
                          <p className="text-[10px] sm:text-sm text-gray-500 font-bold uppercase sm:font-normal sm:normal-case truncate">Avg Rating</p>
                          <div className="flex items-baseline gap-1 mt-1">
                            <p className="text-lg sm:text-2xl font-bold text-black leading-none">{(driver as any).rating?.toFixed(1) || '0.0'}</p>
                            <span className="text-[9px] sm:text-xs text-gray-500 truncate">({trips.filter(t => (t as any).rating).length} ratings)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Current Subscriptions (Supports Multiple Packages) */}
                  {activeSubscriptions.length > 0 ? (
                    <div className="mb-6">
                      {/* Pending Payment Banners */}
                      {activeSubscriptions.filter(s => s.paymentStatus === 'PARTIAL' && s.remainingAmount > 0).map(sub => {
                        const dueDate = sub.paymentDueDate ? new Date(sub.paymentDueDate) : null;
                        const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                        const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
                        const isUrgent = daysUntilDue !== null && daysUntilDue <= 2;
                        return (
                          <div key={`pending-${sub.id}`} className={`mb-3 rounded-xl p-3 border ${isOverdue ? 'bg-red-50 border-red-300' : isUrgent ? 'bg-orange-50 border-orange-300' : 'bg-yellow-50 border-yellow-300'}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className={`text-xs font-black uppercase ${isOverdue ? 'text-red-700' : 'text-orange-700'}`}>
                                    {isOverdue ? '⚠ Payment Overdue!' : `⚠ Payment Due${daysUntilDue !== null ? ` in ${daysUntilDue}d` : ''}`}
                                  </p>
                                  {!isOverdue && daysUntilDue !== null && (
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isUrgent ? 'bg-orange-500 text-white' : 'bg-yellow-400 text-yellow-900'}`}>
                                      {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''} left to pay
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm font-bold text-gray-900 mt-0.5">{sub.plan?.name}</p>
                                <p className="text-xs text-gray-600">Remaining: <span className="font-black text-orange-700">₹{sub.remainingAmount}</span></p>
                                {dueDate && <p className="text-[10px] text-gray-500 mt-0.5">Due by {dueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>}
                              </div>
                              <button
                                onClick={() => { setPayRemainingTarget(sub); setPayRemainingAmount(String(sub.remainingAmount)); setShowPayRemainingModal(true); }}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-black text-white transition ${isOverdue ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
                                Pay Now
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex items-center justify-between mb-3 px-1">
                        <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-gray-700">
                          Active Packages ({activeSubscriptions.length})
                        </p>
                        <button
                          onClick={() => setActiveTab('PACKAGES')}
                          className="text-xs font-bold text-black hover:underline"
                        >
                          + Add Package
                        </button>
                      </div>
                      <div className="space-y-3">
                        {activeSubscriptions.map((sub, idx) => {
                          const daysLeft = Math.max(0, Math.ceil((new Date(sub.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                          const dutiesLeft = sub.maxDuties > 0 ? Math.max(0, sub.maxDuties - (sub.dutiesCompleted || 0)) : null;
                          const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                          return (
                            <div key={sub.id || idx} className="bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm hover:border-gray-300 transition">
                              {/* Top row: icon + category/payment + plan name */}
                              <div className="flex items-start gap-2.5 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  {/* Category + Payment badge row */}
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-black bg-white px-2 py-0.5 rounded border border-gray-200">
                                      {sub.plan?.category || 'Package'}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded border text-blue-600 border-blue-200 bg-blue-50 font-bold">
                                      {sub.paymentMethod || 'N/A'}
                                    </span>
                                  </div>
                                  {/* Plan name */}
                                  <p className="text-sm sm:text-base font-bold text-black truncate mt-1">{sub.plan?.name}</p>
                                  {/* Days + Duties + Commission pills */}
                                  <div className="flex flex-wrap gap-2 mt-1.5">
                                    <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border text-emerald-700 border-emerald-300 bg-emerald-50 font-bold">
                                      {daysLeft} days left
                                    </span>
                                    {dutiesLeft !== null && (
                                      <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border text-purple-700 border-purple-300 bg-purple-50 font-bold">
                                        {dutiesLeft} duties left
                                      </span>
                                    )}
                                    {sub.plan?.excessAmountPerRide > 0 && (
                                      <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border text-orange-700 border-orange-300 bg-orange-50 font-bold">
                                        ₹{sub.plan.excessAmountPerRide} commission/ride
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {/* Start / End date row */}
                              {(sub.startDate || sub.endDate) && (
                                <div className="mt-2.5 pt-2.5 border-t border-gray-200 grid grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Start</p>
                                    <p className="text-[11px] font-bold text-gray-700 mt-0.5">
                                      {sub.startDate ? fmtDate(sub.startDate) : '—'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">End</p>
                                    <p className="text-[11px] font-bold text-gray-700 mt-0.5">
                                      {sub.endDate ? fmtDate(sub.endDate) : '—'}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 sm:p-4 shadow-sm">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm text-gray-500">No Active Plan</p>
                            <p className="text-lg sm:text-xl font-bold text-black">You don't have any current plan</p>
                            <button
                              onClick={() => setActiveTab('PACKAGES')}
                              className="text-xs px-3 py-1 mt-2 bg-black text-white rounded hover:bg-gray-800"
                            >
                              Make Plan
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-2">Documents & Details</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">License:</span>
                          <span className="font-medium text-right break-all">{driver.licenseNo || profileData.licenseNo}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Aadhar:</span>
                          <span className="font-medium text-right break-all">{driver.aadharNo || profileData.aadharNo}</span>
                        </div>
                        <div className="flex flex-col border-t border-gray-200 pt-2 mt-2">
                          <span className="text-gray-500 text-xs mb-1">Current Address:</span>
                          <span className="font-medium">{driver.currentAddress || 'Not set'}</span>
                        </div>
                        <div className="flex flex-col border-t border-gray-200 pt-2 mt-2">
                          <span className="text-gray-500 text-xs mb-1">Permanent Address:</span>
                          <span className="font-medium">{driver.permanentAddress || 'Not set'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Languages Known Card */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-2">🗣️ Languages Known</p>
                      {((driver as any).languagesKnown || (profileData as any).languagesKnown || []).length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {((driver as any).languagesKnown || (profileData as any).languagesKnown || []).map((lang: string) => (
                            <span key={lang} className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full">{lang}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No languages added — tap Edit Profile to add</p>
                      )}
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-2">Payment & Contact</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-200 pb-2">
                          <span className="text-gray-500 mb-1 sm:mb-0">Gpay/PhonePe number:</span>
                          <span className="font-medium break-all">{driver.upiId || driver.gpayNo || 'Not set'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 mb-2 block">Alt Phones:</span>
                          <div className="space-y-1">
                            {[
                              driver.alternateMobile1,
                              driver.alternateMobile2,
                              driver.alternateMobile3,
                              driver.alternateMobile4
                            ].filter(phone => phone && phone.trim() !== '').length ?
                              [
                                driver.alternateMobile1,
                                driver.alternateMobile2,
                                driver.alternateMobile3,
                                driver.alternateMobile4
                              ].filter(phone => phone && phone.trim() !== '').map((phone, index) => (
                                <div key={index} className="flex justify-between items-center py-1">
                                  <span className="text-gray-400 text-xs">Phone {index + 1}:</span>
                                  <span className="font-medium">{phone}</span>
                                </div>
                              )) :
                              <div className="font-medium text-sm text-gray-400">None</div>
                            }
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-2">Document Uploads</p>
                      <div className="space-y-2 text-sm">
                        {/* Photo */}
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-500 font-medium">Photo:</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={!driver.photo}
                              onClick={() => driver.photo && setViewingDoc({ title: 'Photo', url: getDocUrl(driver.photo)! })}
                              className={`font-medium text-xs px-2 py-1 rounded transition flex items-center gap-1 ${driver.photo
                                ? 'bg-green-100 hover:bg-green-200 text-green-700 cursor-pointer active:scale-95'
                                : 'bg-gray-100 text-gray-500 cursor-default'
                                }`}
                            >
                              <span>{driver.photo ? '✓ Uploaded' : 'Not uploaded'}</span>
                            </button>
                            {driver.photo && (
                              <button
                                type="button"
                                onClick={() => setViewingDoc({ title: 'Photo', url: getDocUrl(driver.photo)! })}
                                className="p-1.5 text-gray-700 hover:text-black hover:bg-gray-200/80 rounded-lg transition active:scale-95 flex items-center justify-center border border-gray-200/70 bg-white shadow-2xs"
                                title="View Photo"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Driving License */}
                        <div className="flex flex-col py-1 border-b border-gray-100 pb-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium">Driving License:</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={!driver.dlPhoto}
                                onClick={() => driver.dlPhoto && setViewingDoc({ title: 'Driving License', url: getDocUrl(driver.dlPhoto)! })}
                                className={`font-medium text-xs px-2 py-1 rounded transition flex items-center gap-1 ${driver.dlPhoto
                                  ? 'bg-green-100 hover:bg-green-200 text-green-700 cursor-pointer active:scale-95'
                                  : 'bg-gray-100 text-gray-500 cursor-default'
                                  }`}
                              >
                                <span>{driver.dlPhoto ? '✓ Uploaded' : 'Not uploaded'}</span>
                              </button>
                              {driver.dlPhoto && (
                                <button
                                  type="button"
                                  onClick={() => setViewingDoc({ title: 'Driving License', url: getDocUrl(driver.dlPhoto)! })}
                                  className="p-1.5 text-gray-700 hover:text-black hover:bg-gray-200/80 rounded-lg transition active:scale-95 flex items-center justify-center border border-gray-200/70 bg-white shadow-2xs"
                                  title="View Driving License"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center mt-1.5 gap-1.5 text-[10px] bg-white border border-gray-100 px-2 py-1.5 rounded-md shadow-sm">
                            <span className="text-gray-400 uppercase font-bold tracking-wide flex-shrink-0">Expiry:</span>
                            {(() => {
                              if (!driver.licenseExpiryDate) return <span className="font-medium text-gray-700 break-words">Not set</span>;
                              const expiry = new Date(driver.licenseExpiryDate);
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const thirtyDaysFromNow = new Date();
                              thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

                              const isExpired = expiry < today;
                              const isExpiringSoon = !isExpired && expiry <= thirtyDaysFromNow;

                              return (
                                <span className={`font-medium break-words ${isExpired || isExpiringSoon ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                                  {expiry.toLocaleDateString('en-GB')} {isExpired ? '(Expired)' : isExpiringSoon ? '(Expiring soon)' : ''}
                                </span>
                              );
                            })()}
                          </div>
                          <div className="flex items-center mt-1.5 gap-1.5 text-[10px] bg-white border border-gray-100 px-2 py-1.5 rounded-md shadow-sm">
                            <span className="text-gray-400 uppercase font-bold tracking-wide flex-shrink-0">Certificate No:</span>
                            <span className="font-mono font-bold text-gray-800 break-words">{driver.policeVerificationNo || 'Not set'}</span>
                          </div>
                        </div>

                        {/* PAN Card */}
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-500 font-medium">PAN Card:</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={!driver.panPhoto}
                              onClick={() => driver.panPhoto && setViewingDoc({ title: 'PAN Card', url: getDocUrl(driver.panPhoto)! })}
                              className={`font-medium text-xs px-2 py-1 rounded transition flex items-center gap-1 ${driver.panPhoto
                                ? 'bg-green-100 hover:bg-green-200 text-green-700 cursor-pointer active:scale-95'
                                : 'bg-gray-100 text-gray-500 cursor-default'
                                }`}
                            >
                              <span>{driver.panPhoto ? '✓ Uploaded' : 'Not uploaded'}</span>
                            </button>
                            {driver.panPhoto && (
                              <button
                                type="button"
                                onClick={() => setViewingDoc({ title: 'PAN Card', url: getDocUrl(driver.panPhoto)! })}
                                className="p-1.5 text-gray-700 hover:text-black hover:bg-gray-200/80 rounded-lg transition active:scale-95 flex items-center justify-center border border-gray-200/70 bg-white shadow-2xs"
                                title="View PAN Card"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Aadhar Card */}
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-500 font-medium">Aadhar Card:</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={!driver.aadharPhoto}
                              onClick={() => driver.aadharPhoto && setViewingDoc({ title: 'Aadhar Card', url: getDocUrl(driver.aadharPhoto)! })}
                              className={`font-medium text-xs px-2 py-1 rounded transition flex items-center gap-1 ${driver.aadharPhoto
                                ? 'bg-green-100 hover:bg-green-200 text-green-700 cursor-pointer active:scale-95'
                                : 'bg-gray-100 text-gray-500 cursor-default'
                                }`}
                            >
                              <span>{driver.aadharPhoto ? '✓ Uploaded' : 'Not uploaded'}</span>
                            </button>
                            {driver.aadharPhoto && (
                              <button
                                type="button"
                                onClick={() => setViewingDoc({ title: 'Aadhar Card', url: getDocUrl(driver.aadharPhoto)! })}
                                className="p-1.5 text-gray-700 hover:text-black hover:bg-gray-200/80 rounded-lg transition active:scale-95 flex items-center justify-center border border-gray-200/70 bg-white shadow-2xs"
                                title="View Aadhar Card"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Police Verification - Updated to show both upload and verification status */}
                        <div className="flex flex-col border-t border-gray-200 pt-2 mt-1 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium">Police Verification:</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={!driver.policeVerificationPhoto}
                                onClick={() => driver.policeVerificationPhoto && setViewingDoc({ title: 'Police Verification', url: getDocUrl(driver.policeVerificationPhoto)! })}
                                className={`font-medium text-xs px-2 py-1 rounded transition flex items-center gap-1 ${driver.policeVerificationPhoto
                                  ? 'bg-green-100 hover:bg-green-200 text-green-700 cursor-pointer active:scale-95'
                                  : 'bg-gray-100 text-gray-500 cursor-default'
                                  }`}
                              >
                                <span>{driver.policeVerificationPhoto ? '✓ Uploaded' : ' Not Uploaded'}</span>
                              </button>
                              {driver.policeVerificationPhoto && (
                                <button
                                  type="button"
                                  onClick={() => setViewingDoc({ title: 'Police Verification', url: getDocUrl(driver.policeVerificationPhoto)! })}
                                  className="p-1.5 text-gray-700 hover:text-black hover:bg-gray-200/80 rounded-lg transition active:scale-95 flex items-center justify-center border border-gray-200/70 bg-white shadow-2xs"
                                  title="View Police Verification"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center mt-1.5 gap-1.5 text-[10px] bg-white border border-gray-100 px-2 py-1.5 rounded-md shadow-sm">
                            <span className="text-gray-400 uppercase font-bold tracking-wide flex-shrink-0">Expiry:</span>
                            {(() => {
                              if (!driver.policeVerificationExpiryDate) return <span className="font-medium text-gray-700 break-words">Not set</span>;
                              const expiry = new Date(driver.policeVerificationExpiryDate);
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const thirtyDaysFromNow = new Date();
                              thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

                              const isExpired = expiry < today;
                              const isExpiringSoon = !isExpired && expiry <= thirtyDaysFromNow;

                              return (
                                <span className={`font-medium break-words ${isExpired || isExpiringSoon ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                                  {expiry.toLocaleDateString('en-GB')} {isExpired ? '(Expired)' : isExpiringSoon ? '(Expiring soon)' : ''}
                                </span>
                              );
                            })()}
                          </div>

                          <div className="text-[10px] text-gray-400 mt-1">
                            Note: Document uploaded successfully. Admin will verify it shortly.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Language Preferences Card */}
                  <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-2">Settings & Language</p>
                    <UberLanguageSelector variant="inline" />
                  </div>

                  <div className="pt-4 space-y-3">
                    <button
                      onClick={() => {
                        setConfirmConfig({
                          isOpen: true,
                          title: 'Logout',
                          message: 'Are you sure you want to logout?',
                          type: 'info',
                          confirmText: 'Logout',
                          onConfirm: () => {
                            localStorage.removeItem('auth-token');
                            window.location.href = '/';
                          }
                        });
                      }}
                      className="w-full bg-white border border-gray-200 text-black py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition shadow-sm flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Logout
                    </button>

                    {/* 
                                 <button
                                     onClick={() => {
                                         setConfirmConfig({
                                             isOpen: true,
                                             title: 'Delete Account',
                                             message: 'Are you sure you want to delete your account? This action cannot be undone and will delete your personal data.',
                                             type: 'danger',
                                             confirmText: 'Delete',
                                             onConfirm: async () => {
                                                 try {
                                                     const token = localStorage.getItem('auth-token');
                                                     const res = await fetch(`${API_BASE_URL}/api/auth/delete`, {
                                                         method: 'DELETE',
                                                         headers: { 'Authorization': `Bearer ${token}` }
                                                     });
                                                     const data = await res.json();
                                                     if(data.success) {
                                                         alert('Account deleted successfully');
                                                         localStorage.removeItem('auth-token');
                                                         window.location.href = '/';
                                                     } else {
                                                         alert(data.error || 'Failed to delete account');
                                                     }
                                                 } catch(e) {
                                                     alert('Error deleting account');
                                                 }
                                             }
                                         });
                                     }}
                                     className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold text-sm hover:bg-red-100 transition flex items-center justify-center gap-2"
                                 >
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                     Delete Account
                                 </button>
*/}
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProfileUpdate} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-bold text-base sm:text-lg mb-4">Edit Profile Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 rounded-lg p-3 text-sm"
                      value={profileData.name}
                      onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 rounded-lg p-3 text-sm"
                      value={profileData.phone}
                      onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Current Address</label>
                    <textarea
                      className="w-full bg-gray-50 rounded-lg p-3 text-sm resize-none"
                      rows={2}
                      value={profileData.currentAddress || ''}
                      onChange={e => setProfileData({ ...profileData, currentAddress: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Permanent Address</label>
                    <textarea
                      className="w-full bg-gray-50 rounded-lg p-3 text-sm resize-none"
                      rows={2}
                      value={profileData.permanentAddress || ''}
                      onChange={e => setProfileData({ ...profileData, permanentAddress: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Alternate Phone 1</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 rounded-lg p-3 text-sm"
                      value={driver.alternateMobile1 || ''}
                      onChange={e => {
                        setDriver({ ...driver, alternateMobile1: e.target.value });
                        setProfileData({ ...profileData, alternateMobile1: e.target.value });
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Alternate Phone 2</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 rounded-lg p-3 text-sm"
                      value={driver.alternateMobile2 || ''}
                      onChange={e => {
                        setDriver({ ...driver, alternateMobile2: e.target.value });
                        setProfileData({ ...profileData, alternateMobile2: e.target.value });
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Alternate Phone 3</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 rounded-lg p-3 text-sm"
                      value={driver.alternateMobile3 || ''}
                      onChange={e => {
                        setDriver({ ...driver, alternateMobile3: e.target.value });
                        setProfileData({ ...profileData, alternateMobile3: e.target.value });
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Alternate Phone 4</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 rounded-lg p-3 text-sm"
                      value={driver.alternateMobile4 || ''}
                      onChange={e => {
                        setDriver({ ...driver, alternateMobile4: e.target.value });
                        setProfileData({ ...profileData, alternateMobile4: e.target.value });
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Gpay/PhonePe number</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 rounded-lg p-3 text-sm"
                      placeholder="Enter mobile number"
                      value={profileData.upiId || ''}
                      onChange={e => setProfileData({ ...profileData, upiId: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Police Verification Certificate No</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 rounded-lg p-3 text-sm font-mono"
                      placeholder="e.g. POL-VER-2026-XXXX"
                      value={profileData.policeVerificationNo || ''}
                      onChange={e => setProfileData({ ...profileData, policeVerificationNo: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">🗣️ Languages Known</label>
                    <p className="text-[11px] text-gray-400 mb-2">Select all languages you can speak (e.g. Tamil, English, Hindi) to connect easily with customers.</p>
                    <div className="flex flex-wrap gap-2">
                      {['Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Hindi', 'English', 'Marathi', 'Bengali', 'Gujarati', 'Odia', 'Punjabi', 'Urdu'].map(lang => {
                        const currentLangs = (profileData as any).languagesKnown || [];
                        const selected = currentLangs.includes(lang);
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => {
                              setProfileData({
                                ...profileData,
                                languagesKnown: selected
                                  ? currentLangs.filter((l: string) => l !== lang)
                                  : [...currentLangs, lang]
                              } as any);
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${selected ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'}`}
                          >
                            {lang}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">Document Uploads</p>
                      <p className="text-[11px] text-gray-400 font-medium">Clear document titles with interactive crop to upload</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {[
                      { field: 'photo' as const, title: 'Profile Photo', ratio: '1:1' as const, span: 'col-span-1' },
                      { field: 'dlPhoto' as const, title: 'Driving License (DL)', ratio: '4:3' as const, span: 'col-span-1' },
                      { field: 'panPhoto' as const, title: 'PAN Card', ratio: '3:2' as const, span: 'col-span-1' },
                      { field: 'aadharPhoto' as const, title: 'Aadhar Card', ratio: '4:3' as const, span: 'col-span-1' },
                      { field: 'policeVerificationPhoto' as const, title: 'Police Verification', ratio: '4:3' as const, span: 'col-span-1 sm:col-span-2' },
                    ].map((item) => {
                      const rawVal = profileData[item.field];
                      const previewVal = imagePreviews[item.field];
                      const hasImage = Boolean(previewVal || rawVal);
                      const currentImgUrl = previewVal || (rawVal ? (rawVal.startsWith('http') ? rawVal : `${API_BASE_URL}${rawVal}`) : '');

                      return (
                        <div key={item.field} className={`p-3 bg-gray-50/80 border border-gray-200/90 rounded-xl space-y-2 ${item.span}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs font-bold text-gray-900 truncate">
                                {item.title}
                              </span>
                              {hasImage && (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full inline-flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                  Uploaded
                                </span>
                              )}
                            </div>

                            {hasImage && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!currentImgUrl) return;
                                    setCroppingConfig({
                                      isOpen: true,
                                      imageSrc: currentImgUrl,
                                      documentTitle: item.title,
                                      field: item.field,
                                      defaultAspectRatio: item.ratio
                                    });
                                  }}
                                  className="px-2 py-0.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-[10px] font-bold rounded-md shadow-2xs transition active:scale-95 flex items-center gap-1"
                                  title={`Crop / Adjust ${item.title}`}
                                >
                                  <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span>Crop</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!currentImgUrl) return;
                                    setViewingDoc({ title: item.title, url: currentImgUrl });
                                  }}
                                  className="p-1 text-gray-600 hover:text-black hover:bg-gray-200/80 rounded-md transition"
                                  title={`View ${item.title}`}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>

                          <label
                            htmlFor={`edit_${item.field}`}
                            className="block w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition overflow-hidden relative group"
                          >
                            {hasImage ? (
                              <>
                                <img
                                  src={currentImgUrl}
                                  alt={item.title}
                                  className="w-full h-full object-contain block"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                  </svg>
                                  <span>Change {item.title}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full text-center p-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mb-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                </div>
                                <p className="text-xs text-gray-700 font-bold">{item.title}</p>
                                <p className="text-[10px] text-gray-400">Click to upload & crop</p>
                              </div>
                            )}
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            id={`edit_${item.field}`}
                            className="hidden"
                            onChange={(e) => handleFileSelect(e, item.field, item.title, item.ratio)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Change Password</label>
                  <input
                    type="password"
                    placeholder="New Password"
                    className="w-full bg-gray-50 rounded-lg p-3 text-sm"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 py-3 font-bold text-sm">Cancel</button>
                  <button type="submit" className="flex-1 bg-black text-white py-3 rounded-lg font-bold text-sm">Save Changes</button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Payment Method Modal */}
      {
        showPaymentModal && selectedPackage && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-black text-white px-5 py-4">
                <h2 className="text-sm font-bold text-gray-300">Subscribe Package</h2>
                <p className="text-xl font-black mt-0.5">{selectedPackage.name}</p>
                <p className="text-2xl font-black mt-1">₹{selectedPackage.price}</p>
                <p className="text-xs text-gray-400 mt-0.5">{selectedPackage.duration} days · {selectedPackage.category}</p>
                {selectedPackage.excessAmountPerRide && selectedPackage.excessAmountPerRide > 0 ? (
                  <p className="text-xs text-orange-400 font-semibold mt-1">Platform Commission: ₹{selectedPackage.excessAmountPerRide}/ride</p>
                ) : null}
              </div>
              <div className="p-5 space-y-4">
                {/* Pay Full / Pay Partial toggle */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Payment Option</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setPaymentMode('FULL')}
                      className={`py-2.5 rounded-xl text-sm font-bold border-2 transition ${paymentMode === 'FULL' ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                      Pay Full
                    </button>
                    <button onClick={() => setPaymentMode('PARTIAL')}
                      className={`py-2.5 rounded-xl text-sm font-bold border-2 transition ${paymentMode === 'PARTIAL' ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                      Pay Later
                    </button>
                  </div>
                </div>

                {/* Partial amount input */}
                {paymentMode === 'PARTIAL' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-2">
                    <p className="text-xs text-orange-700 font-semibold">⚠ Pay part now — remaining due within <span className="font-black">5 days</span> or account deactivates</p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                      <input type="number" min={1} max={selectedPackage.price - 1}
                        placeholder={`Enter amount (max ₹${selectedPackage.price - 1})`}
                        value={partialAmount}
                        onChange={e => setPartialAmount(e.target.value)}
                        className="w-full pl-7 pr-3 py-2.5 border border-orange-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                      />
                    </div>
                    {partialAmount && !isNaN(parseFloat(partialAmount)) && parseFloat(partialAmount) > 0 && parseFloat(partialAmount) < selectedPackage.price && (
                      <p className="text-[11px] text-orange-600 font-semibold">Remaining ₹{(selectedPackage.price - parseFloat(partialAmount)).toFixed(0)} due in 5 days</p>
                    )}
                  </div>
                )}

                {/* Payment method buttons */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Pay Via</p>
                  <div className="space-y-2">
                    {(['CASH', 'UPI'] as const).map(method => (
                      <button key={method} onClick={() => {
                        if (paymentMode === 'PARTIAL') {
                          const p = parseFloat(partialAmount);
                          if (isNaN(p) || p <= 0 || p >= selectedPackage.price) { alert(`Enter amount between ₹1 and ₹${selectedPackage.price - 1}`); return; }
                        }
                        handlePaymentMethodSelect(method);
                      }}
                        className={`w-full p-3.5 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 text-white ${method === 'CASH' ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'}`}>
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={() => { setShowPaymentModal(false); setPartialAmount(''); setPaymentMode('FULL'); }}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 font-medium">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Pay Remaining Modal */}
      {
        showPayRemainingModal && payRemainingTarget && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
              <div className="bg-orange-500 text-white px-5 py-4">
                <p className="text-xs font-bold text-orange-100 uppercase">Pay Remaining Amount</p>
                <p className="text-lg font-black mt-1">{payRemainingTarget.plan?.name}</p>
                <p className="text-2xl font-black">₹{payRemainingTarget.remainingAmount}</p>
                {payRemainingTarget.paymentDueDate && (
                  <p className="text-xs text-orange-100 mt-1">Due by {new Date(payRemainingTarget.paymentDueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                )}
              </div>
              <div className="p-5 space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                  <input type="number" min={1} max={payRemainingTarget.remainingAmount}
                    placeholder={`Max ₹${payRemainingTarget.remainingAmount}`}
                    value={payRemainingAmount}
                    onChange={e => setPayRemainingAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div className="space-y-2">
                  {(['CASH', 'UPI'] as const).map(method => (
                    <button key={method} onClick={async () => {
                      const amt = parseFloat(payRemainingAmount);
                      if (isNaN(amt) || amt <= 0 || amt > payRemainingTarget.remainingAmount) {
                        alert(`Enter amount between ₹1 and ₹${payRemainingTarget.remainingAmount}`); return;
                      }
                      try {
                        const res = await fetch(`${API_BASE_URL}/api/subscriptions/pay-remaining/${payRemainingTarget.id}`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` },
                          credentials: 'include',
                          body: JSON.stringify({ paidAmount: amt, paymentMethod: method })
                        });
                        const data = await res.json();
                        if (data.success) {
                          setShowPayRemainingModal(false); setPayRemainingTarget(null); setPayRemainingAmount('');
                          fetchCurrentSubscription();
                          setConfirmConfig({ isOpen: true, title: 'Payment Successful', message: `₹${amt} paid successfully!`, type: 'success', confirmText: 'OK', onConfirm: () => setConfirmConfig(p => ({ ...p, isOpen: false })) });
                        } else { alert(data.error || 'Payment failed'); }
                      } catch { alert('Payment failed. Try again.'); }
                    }}
                      className={`w-full p-3 rounded-xl font-bold text-sm transition text-white flex items-center justify-center gap-2 ${method === 'CASH' ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                      Pay via {method}
                    </button>
                  ))}
                </div>
                <button onClick={() => { setShowPayRemainingModal(false); setPayRemainingTarget(null); setPayRemainingAmount(''); }}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Start Trip OTP Modal */}
      {
        isStartOtpSent && startingTripId && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[70] backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all animate-fade-in-up">
              <div className="p-6 bg-gray-50 border-b border-gray-100 flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Verify OTP</h3>
                <p className="text-sm text-gray-500 text-center">Enter the 6-digit code sent to the customer's phone to start the trip.</p>
              </div>
              <div className="p-6">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="0 0 0 0 0 0"
                  value={startOtp}
                  onChange={(e) => setStartOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-gray-100 border border-gray-300 rounded-xl p-4 text-center tracking-[0.5em] text-gray-900 font-bold text-2xl placeholder:tracking-normal placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner mb-4"
                />

                <button
                  disabled={isSendingStartOtp}
                  onClick={async () => {
                    setIsSendingStartOtp(true);
                    try {
                      const res = await fetch(`${API_BASE_URL}/api/trips/${startingTripId}/send-start-otp`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
                      });
                      const data = await res.json();
                      if (data.success) {
                        alert('OTP resent to customer successfully!');
                      } else {
                        alert(data.error || 'Failed to resend OTP');
                      }
                    } catch (error) {
                      console.error('Resend OTP error:', error);
                      alert('Failed to resend OTP');
                    } finally {
                      setIsSendingStartOtp(false);
                    }
                  }}
                  className="w-full text-blue-600 font-bold text-sm hover:text-blue-800 transition mb-6"
                >
                  {isSendingStartOtp ? 'Resending...' : 'Resend OTP'}
                </button>

                <div className="flex gap-3">
                  <button
                    disabled={isStartingTrip}
                    onClick={() => { setIsStartOtpSent(false); setStartOtp(''); }}
                    className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isStartingTrip || startOtp.length !== 6 || !tripPhotos.front || !tripPhotos.back}
                    onClick={async () => {
                      try {
                        setIsStartingTrip(true);
                        let frontUrl = null, backUrl = null;

                        if (tripPhotos.front) {
                          const frontRes = await uploadFile(tripPhotos.front);
                          if (frontRes.success && frontRes.path) frontUrl = frontRes.path.split('/').pop();
                        }
                        if (tripPhotos.back) {
                          const backRes = await uploadFile(tripPhotos.back);
                          if (backRes.success && backRes.path) backUrl = backRes.path.split('/').pop();
                        }

                        const result = await tripAPI.startTrip(startingTripId, {
                          carFrontPhoto: frontUrl,
                          carBackPhoto: backUrl,
                          otp: startOtp
                        });

                        if (result.success) {
                          setStartingTripId(null);
                          setTripPhotos({ front: null, back: null });
                          setIsStartOtpSent(false);
                          setStartOtp('');
                          const driverRes = await tripAPI.getDriverTrips();
                          if (driverRes.success) setTrips(driverRes.trips);
                        } else {
                          alert('Failed to start trip: ' + result.error);
                        }
                      } catch (error) {
                        console.error('Start trip error:', error);
                        alert('Failed to start trip');
                      } finally {
                        setIsStartingTrip(false);
                      }
                    }}
                    className={`flex-1 text-white py-3.5 rounded-xl font-bold transition active:scale-95 shadow-md ${isStartingTrip || startOtp.length !== 6 || !tripPhotos.front || !tripPhotos.back
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                  >
                    {isStartingTrip ? 'Starting...' : 'Confirm Start'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Document Viewer Modal for Driver Portal */}
      {
        viewingDoc && (
          <DocumentViewerModal
            isOpen={Boolean(viewingDoc)}
            onClose={() => setViewingDoc(null)}
            title={viewingDoc.title}
            url={viewingDoc.url}
            entityName={driver.name}
            onDownload={() => {
              if (!viewingDoc?.url) return;
              const link = document.createElement('a');
              link.href = viewingDoc.url;
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              link.download = `${driver.name || 'driver'}_${viewingDoc.title}`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          />
        )
      }

      {/* Image Cropper Modal */}
      {
        croppingConfig && (
          <ImageCropperModal
            isOpen={croppingConfig.isOpen}
            imageSrc={croppingConfig.imageSrc}
            documentTitle={croppingConfig.documentTitle}
            defaultAspectRatio={croppingConfig.defaultAspectRatio}
            onClose={() => setCroppingConfig(null)}
            onCropComplete={async (croppedBlob, croppedPreviewUrl) => {
              if (!croppingConfig) return;
              setImagePreviews(prev => ({ ...prev, [croppingConfig.field]: croppedPreviewUrl }));
              await handleUploadFileDirect(
                croppedBlob,
                croppingConfig.field,
                `${croppingConfig.field}_cropped.jpg`
              );
              setCroppingConfig(null);
            }}
            onUploadOriginal={croppingConfig.originalFile ? async () => {
              if (!croppingConfig || !croppingConfig.originalFile) return;
              await handleUploadFileDirect(
                croppingConfig.originalFile,
                croppingConfig.field,
                croppingConfig.originalFile.name
              );
              setCroppingConfig(null);
            } : undefined}
          />
        )
      }

      <ConfirmModal {...confirmConfig} onCancel={closeConfirm} />
    </div >
  );
};

export default DriverPortal;
