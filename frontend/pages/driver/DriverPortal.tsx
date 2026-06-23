import React, { useState, useEffect } from 'react';
import { Driver, Trip, Package } from '../../types';
import { tripAPI } from '../../api/trip';
import DriverBookingRequests from './DriverBookingRequests';
import { API_BASE_URL } from '../../api/config.js';
import { uploadFile } from '../../api/upload.js';
import ConfirmModal from '../../components/common/ConfirmModal';

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

interface DriverPortalProps {
  driver: Driver;
}

const DriverPortal: React.FC<DriverPortalProps> = ({ driver: initialDriver }) => {
  const [activeTab, setActiveTab] = useState<'HOME' | 'TRIPS' | 'PROFILE' | 'PACKAGES' | 'REQUESTS'>('REQUESTS');
  const [requestsSubTab, setRequestsSubTab] = useState<'PENDING' | 'HISTORY' | 'ALLOCATED'>('PENDING');
  const [driver, setDriver] = useState<Driver>(initialDriver);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [startingTripId, setStartingTripId] = useState<string | null>(null);
  const [tripPhotos, setTripPhotos] = useState<{ front: File | null, back: File | null }>({ front: null, back: null });
  const [isStartingTrip, setIsStartingTrip] = useState(false);
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
    onConfirm: () => {}
  });

  const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }));

  // Profile Edit States
  const [profileData, setProfileData] = useState({
    ...driver,
    altPhone: driver.altPhone || [],
    upiId: driver.upiId || driver.gpayNo || '',
    photo: driver.photo || '',
    dlPhoto: driver.dlPhoto || '',
    panPhoto: driver.panPhoto || '',
    aadharPhoto: driver.aadharPhoto || '',
    policeVerificationPhoto: driver.policeVerificationPhoto || '' // New field
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [password, setPassword] = useState('');
  const [imagePreviews, setImagePreviews] = useState<{[key: string]: string}>({});

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
      policeVerificationPhoto: initialDriver.policeVerificationPhoto || '' // New field
    });
  }, [initialDriver]);

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
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
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
    const actualHours = Math.ceil((actualEnd - actualStart) / (1000 * 60 * 60)); 
    
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
      return baseAmount + (extraHours * 100);
    }
    
    return baseAmount;
  };

  const handleAcceptTrip = async (tripId: string) => {
    // This function is no longer used - admin assigns bookings
    alert('Bookings are assigned by admin. Please wait for assignment.');
  };

  const handleCancelTrip = (tripId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Cancel Trip',
      message: 'Are you sure you want to cancel this trip? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Cancel Trip',
      onConfirm: async () => {
        closeConfirm();
        try {
          const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/cancel`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
            },
            credentials: 'include'
          });
          
          if (response.ok) {
            const driverRes = await tripAPI.getDriverTrips();
            if (driverRes.success) setTrips(driverRes.trips || []);
          }
        } catch (error) {
          console.error('Error cancelling trip:', error);
        }
      }
    });
  };

  const handleSubscriptionBuy = async (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  const handlePaymentMethodSelect = async (method: string) => {
    if (!selectedPackage) return;
    
    setShowPaymentModal(false);
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        credentials: 'include',
        body: JSON.stringify({ 
          planId: selectedPackage.id,
          paymentMethod: method
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
                  policeVerificationPhoto: profileData.policeVerificationPhoto, // New field
                  password: password // New password
              })
          });
          
          const data = await response.json();
          
          if (data.success) {
              // Update local driver state with new data
              setDriver({
                  ...driver,
                  ...data.user,
                  altPhone: [
                      data.user.alternateMobile1,
                      data.user.alternateMobile2,
                      data.user.alternateMobile3,
                      data.user.alternateMobile4
                  ].filter(phone => phone && phone.trim() !== ''),
                  upiId: data.user.gpayNo,
                  policeVerificationPhoto: data.user.policeVerificationPhoto // New field
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
          <p className="font-bold text-sm leading-none">SNP Driver</p>
          <p className="text-xs text-gray-400">Welcome, {driver.name}</p>
      </div>

      {/* Tabs - Fixed */}
      <div className="bg-white border-b border-gray-200 flex overflow-x-auto scrollbar-hide">
          {['HOME', 'REQUESTS', 'TRIPS', 'PACKAGES', 'PROFILE'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 min-w-[70px] sm:min-w-[80px] py-3 sm:py-4 text-[10px] sm:text-xs font-bold border-b-2 transition ${activeTab === tab ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
              >
                  {tab}
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
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded transition ${
                    requestsSubTab === subTab 
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
                                <div className="flex justify-between items-center bg-gray-800 rounded-lg p-3 mb-4 border border-gray-700">
                                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">Base Amount</span>
                                    <span className="text-green-400 font-bold text-lg">₹{trip.estimatedCost || trip.estimateAmount || 0}</span>
                                </div>
                                <div className="space-y-3">
                                    {trip.status === 'ONGOING' ? (
                                      <>
                                        <button 
                                            onClick={() => {
                                              const autoCalculatedAmount = calculateFinalAmount(trip);
                                              setConfirmConfig({
                                                isOpen: true,
                                                title: 'Complete Trip',
                                                message: (
                                                  <div className="flex flex-col items-center text-center mt-2">
                                                    {/* Price Section */}
                                                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 w-full rounded-2xl p-6 mb-5 shadow-sm relative overflow-hidden">
                                                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-green-200 rounded-full opacity-50 blur-xl"></div>
                                                      <p className="text-green-800 font-semibold text-xs uppercase tracking-widest mb-1">Final Amount</p>
                                                      <p className="text-4xl font-black text-green-700 tracking-tight">₹{autoCalculatedAmount}</p>
                                                      <p className="text-green-600/80 text-[10px] mt-2 font-medium bg-green-200/50 inline-block px-2 py-0.5 rounded-full">*Includes ₹100/hr extra charge if applicable</p>
                                                    </div>
                                                    
                                                    {/* Route Section */}
                                                    <div className="w-full text-left bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4">
                                                      <div className="flex gap-4">
                                                        <div className="flex flex-col items-center pt-1.5">
                                                          <div className="w-2.5 h-2.5 bg-black rounded-full shadow-sm"></div>
                                                          <div className="w-0.5 h-10 bg-gray-300 rounded-full my-1"></div>
                                                          <div className="w-2.5 h-2.5 border-2 border-black rounded-full shadow-sm"></div>
                                                        </div>
                                                        <div className="flex-1 space-y-4">
                                                          <div>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Pickup</p>
                                                            <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 mt-0.5">{trip.pickupLocation}</p>
                                                          </div>
                                                          <div>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Drop-off</p>
                                                            <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 mt-0.5">{trip.dropLocation}</p>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>

                                                    {/* Customer Section */}
                                                    <div className="flex items-center gap-3 w-full bg-white border border-gray-100 rounded-xl p-3">
                                                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                                                        {(trip.customer?.name || 'C')[0].toUpperCase()}
                                                      </div>
                                                      <div className="text-left">
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Customer</p>
                                                        <p className="font-bold text-sm text-gray-900">{trip.customer?.name || 'N/A'}</p>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ),
                                                type: 'success',
                                                confirmText: 'Complete Trip',
                                                onConfirm: async () => {
                                                  closeConfirm();
                                                  const finalAmount = autoCalculatedAmount;
                                                  try {
                                                    const result = await tripAPI.completeTrip(trip.id, { finalAmount });
                                                    if (result.success) {
                                                      alert('✓ Trip completed successfully!');
                                                      const driverRes = await tripAPI.getDriverTrips();
                                                      if (driverRes.success) setTrips(driverRes.trips);
                                                    } else {
                                                      alert('Failed to complete trip: ' + (result.error || 'Unknown error'));
                                                    }
                                                  } catch (error) {
                                                    console.error('Error completing trip:', error);
                                                    alert('Error completing trip. Please try again.');
                                                  }
                                                }
                                              });
                                            }}
                                            className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Complete Trip
                                        </button>
                                      </>
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
                                        <div className="flex gap-2">
                                          <button 
                                            disabled={isStartingTrip}
                                            onClick={() => { setStartingTripId(null); setTripPhotos({ front: null, back: null }); }}
                                            className="flex-1 bg-gray-700 py-2 rounded-lg font-bold text-sm"
                                          >
                                            Cancel
                                          </button>
                                          <button 
                                            disabled={isStartingTrip || !tripPhotos.front || !tripPhotos.back}
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
                                                
                                                const result = await tripAPI.startTrip(trip.id, {
                                                  carFrontPhoto: frontUrl,
                                                  carBackPhoto: backUrl
                                                });
                                                
                                                if (result.success) {
                                                  setStartingTripId(null);
                                                  setTripPhotos({ front: null, back: null });
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
                                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-blue-500 disabled:opacity-50"
                                          >
                                            {isStartingTrip ? 'Starting...' : 'Confirm Start'}
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex gap-3">
                                        <button 
                                            onClick={() => setStartingTripId(trip.id)}
                                            className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Start Trip
                                        </button>
                                        <button 
                                            onClick={() => handleCancelTrip(trip.id)}
                                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-3 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-1 shadow-sm"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Cancel
                                        </button>
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
                                     <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded uppercase">{trip.status}</span>
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
                                 {(trip.status === 'PENDING' || trip.status === 'ACCEPTED' || trip.status === 'ONGOING') && (
                                     <button 
                                         onClick={() => handleCancelTrip(trip.id)}
                                         className="mt-3 w-full border border-red-500 text-red-500 py-2 rounded-lg font-bold text-sm hover:bg-red-50 transition"
                                     >
                                         Cancel Trip
                                     </button>
                                 )}
                             </div>
                         ))
                     )}
                 </div>

                 {/* Completed Trips Section */}
                 <div>
                     <h3 className="text-base sm:text-lg font-bold mb-3 text-gray-400">Completed Trips</h3>
                     {pastTrips.length === 0 ? (
                         <p className="text-gray-500 italic text-sm">No completed trips yet.</p>
                     ) : (
                         pastTrips.map(trip => (
                             <div key={trip.id} className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-sm mb-4 hover:border-gray-300 transition-colors">
                                 <div className="flex justify-between items-center mb-2">
                                     <span className="text-xs font-bold text-gray-500">{trip.startDate} • {trip.startTime}</span>
                                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${trip.status === 'CANCELLED' ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                                         {trip.status === 'CANCELLED' ? 'Cancelled' : 'Completed'}
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
                    <p className="text-sm text-gray-500">Choose a plan to start accepting rides.</p>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                    {packages.map(pkg => {
                        const daysLeft = currentSubscription && currentSubscription.plan ? Math.max(0, Math.ceil((new Date(currentSubscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;
                        const isActive = currentSubscription && currentSubscription.plan && currentSubscription.plan.id === pkg.id && currentSubscription.status === 'ACTIVE' && daysLeft > 0;
                        const hasActivePlan = currentSubscription && currentSubscription.plan && currentSubscription.status === 'ACTIVE' && daysLeft > 0;
                        const isDisabled = hasActivePlan && !isActive;
                        return (
                        <div key={pkg.id} className={`border-2 rounded-xl p-4 sm:p-6 relative ${isActive ? 'border-black bg-gray-50' : isDisabled ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-100 bg-white'}`}>
                            {isActive && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black text-white px-3 py-1 rounded-full text-xs font-bold">
                                    CURRENT PLAN
                                </div>
                            )}
                            <h3 className="font-bold text-base sm:text-lg">{pkg.name}</h3>
                            <p className="text-2xl sm:text-3xl font-extrabold mt-2">₹{pkg.price}<span className="text-xs sm:text-sm font-normal text-gray-500">/{pkg.duration} days</span></p>
                            <p className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3">{pkg.description}</p>
                            <p className="text-[10px] text-black font-extrabold mt-1.5 uppercase tracking-wide">One time payment • Non-Refundable</p>
                            
                            <button 
                                onClick={() => handleSubscriptionBuy(pkg)}
                                disabled={isActive || isDisabled}
                                className={`w-full mt-4 sm:mt-6 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm ${isActive || isDisabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}
                            >
                                {isActive ? 'Active' : 'Choose Package & Pay'}
                            </button>
                        </div>
                        );
                    })}
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
                                        <h2 className="text-xl sm:text-2xl font-bold">{profileData.name}</h2>
                                     </div>
                                     <p className="text-gray-500 text-xs sm:text-sm mt-1">{profileData.phone}</p>
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
                                             <p className="text-lg sm:text-2xl font-bold text-black leading-none mt-1">{(driver as any).totalRides || 0}</p>
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
                                                 <span className="text-[9px] sm:text-xs text-gray-500 truncate">({(driver as any).totalRides || 0} rides)</span>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             {/* Current Subscription */}
                             {currentSubscription && currentSubscription.plan ? (() => {
                                 const daysLeft = Math.max(0, Math.ceil((new Date(currentSubscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                                 const isExpired = daysLeft === 0;
                                 
                                 if (isExpired) {
                                     return (
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
                                     );
                                 }
                                 
                                 return (
                                 <div className="mb-6">
                                     <div className="bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm">
                                         <div className="flex items-center gap-2.5 sm:gap-3">
                                             <div className="w-8 h-8 sm:w-12 sm:h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                                                 <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                 </svg>
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                 <div className="flex items-center justify-between gap-2">
                                                     <p className="text-[10px] sm:text-sm text-gray-500 uppercase font-bold tracking-wide">Current Plan</p>
                                                     <p className="text-[10px] sm:text-xs px-2 py-0.5 rounded border text-blue-600 border-blue-200 bg-blue-50 font-bold">
                                                         {currentSubscription.paymentMethod || 'N/A'}
                                                     </p>
                                                 </div>
                                                 <p className="text-xs sm:text-lg md:text-xl font-bold text-black truncate mt-0.5">{currentSubscription.plan.name}</p>
                                                 <div className="flex flex-wrap gap-2">
                                                   <p className="text-[10px] sm:text-xs px-2 py-0.5 rounded border text-green-600 border-green-200 bg-green-50 inline-block mt-1 font-bold">
                                                       {daysLeft} days left
                                                   </p>
                                                   {(currentSubscription.maxDuties > 0 || (currentSubscription.plan && currentSubscription.plan.maxDuties > 0)) && (() => {
                                                     const maxLimit = currentSubscription.maxDuties > 0 ? currentSubscription.maxDuties : currentSubscription.plan.maxDuties;
                                                     return (
                                                       <p className="text-[10px] sm:text-xs px-2 py-0.5 rounded border text-purple-600 border-purple-200 bg-purple-50 inline-block mt-1 font-bold">
                                                           {Math.max(0, maxLimit - (currentSubscription.dutiesCompleted || 0))} duties left
                                                       </p>
                                                     );
                                                   })()}
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                                 );
                             })() : (
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
                                         <div className="flex justify-between items-center py-1">
                                             <span className="text-gray-500">Photo:</span>
                                             <span className={`font-medium text-xs px-2 py-1 rounded ${driver.photo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                 {driver.photo ? '✓ Uploaded' : 'Not uploaded'}
                                             </span>
                                         </div>
                                         <div className="flex flex-col py-1 border-b border-gray-100 pb-2">
                                             <div className="flex justify-between items-center">
                                                 <span className="text-gray-500 font-medium">Driving License:</span>
                                                 <span className={`font-medium text-xs px-2 py-1 rounded ${driver.dlPhoto ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                     {driver.dlPhoto ? '✓ Uploaded' : 'Not uploaded'}
                                                 </span>
                                             </div>
                                             <div className="flex items-center mt-1.5 gap-1.5 text-[10px] bg-white border border-gray-100 px-2 py-1.5 rounded-md shadow-sm">
                                                 <span className="text-gray-400 uppercase font-bold tracking-wide flex-shrink-0">Expiry:</span>
                                                 {(() => {
                                                     if (!driver.licenseExpiryDate) return <span className="font-medium text-gray-700 break-words">Not set</span>;
                                                     const expiry = new Date(driver.licenseExpiryDate);
                                                     const today = new Date();
                                                     today.setHours(0,0,0,0);
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
                                         </div>
                                         <div className="flex justify-between items-center py-1">
                                             <span className="text-gray-500">PAN Card:</span>
                                             <span className={`font-medium text-xs px-2 py-1 rounded ${driver.panPhoto ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                 {driver.panPhoto ? '✓ Uploaded' : 'Not uploaded'}
                                             </span>
                                         </div>
                                         <div className="flex justify-between items-center py-1">
                                             <span className="text-gray-500">Aadhar Card:</span>
                                             <span className={`font-medium text-xs px-2 py-1 rounded ${driver.aadharPhoto ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                 {driver.aadharPhoto ? '✓ Uploaded' : 'Not uploaded'}
                                             </span>
                                         </div>
                                         
                                         {/* Police Verification - Updated to show both upload and verification status */}
                                         <div className="flex flex-col border-t border-gray-200 pt-2 mt-1 space-y-1">
                                             <div className="flex justify-between items-center">
                                                 <span className="text-gray-500 font-medium">Police Verification:</span>
                                                 <div className="flex items-center gap-2">
                                                     {/* Upload Status */}
                                                     <span className={`font-medium text-xs px-2 py-1 rounded ${driver.policeVerificationPhoto ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                         {driver.policeVerificationPhoto ? '✓ Uploaded' : ' Not Uploaded'}
                                                     </span>
                                                 </div>
                                             </div>
                                             
                                             <div className="flex items-center mt-1.5 gap-1.5 text-[10px] bg-white border border-gray-100 px-2 py-1.5 rounded-md shadow-sm">
                                                 <span className="text-gray-400 uppercase font-bold tracking-wide flex-shrink-0">Expiry:</span>
                                                 {(() => {
                                                     if (!driver.policeVerificationExpiryDate) return <span className="font-medium text-gray-700 break-words">Not set</span>;
                                                     const expiry = new Date(driver.policeVerificationExpiryDate);
                                                     const today = new Date();
                                                     today.setHours(0,0,0,0);
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
                                    onChange={e => setProfileData({...profileData, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-gray-50 rounded-lg p-3 text-sm"
                                    value={profileData.phone}
                                    onChange={e => setProfileData({...profileData, phone: e.target.value})}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Current Address</label>
                                <textarea 
                                    className="w-full bg-gray-50 rounded-lg p-3 text-sm resize-none"
                                    rows={2}
                                    value={profileData.currentAddress || ''}
                                    onChange={e => setProfileData({...profileData, currentAddress: e.target.value})}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Permanent Address</label>
                                <textarea 
                                    className="w-full bg-gray-50 rounded-lg p-3 text-sm resize-none"
                                    rows={2}
                                    value={profileData.permanentAddress || ''}
                                    onChange={e => setProfileData({...profileData, permanentAddress: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Alternate Phone 1</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-gray-50 rounded-lg p-3 text-sm"
                                    value={driver.alternateMobile1 || ''}
                                    onChange={e => {
                                        setDriver({...driver, alternateMobile1: e.target.value});
                                        setProfileData({...profileData, alternateMobile1: e.target.value});
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
                                        setDriver({...driver, alternateMobile2: e.target.value});
                                        setProfileData({...profileData, alternateMobile2: e.target.value});
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
                                        setDriver({...driver, alternateMobile3: e.target.value});
                                        setProfileData({...profileData, alternateMobile3: e.target.value});
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
                                        setDriver({...driver, alternateMobile4: e.target.value});
                                        setProfileData({...profileData, alternateMobile4: e.target.value});
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
                                    onChange={e => setProfileData({...profileData, upiId: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                             <p className="text-xs font-bold text-gray-500 mb-3 uppercase">Document Uploads</p>
                             <div className="grid grid-cols-2 gap-3">
                                 <div className="relative">
                                     <input 
                                         type="file"
                                         accept="image/*"
                                         id="editPhoto"
                                         className="hidden"
                                         onChange={async (e) => {
                                             const file = e.target.files?.[0];
                                             if (file) {
                                                 const previewUrl = URL.createObjectURL(file);
                                                 setImagePreviews({...imagePreviews, photo: previewUrl});
                                                 try {
                                                     const formData = new FormData();
                                                     formData.append('file', file);
                                                     const response = await fetch(`${API_BASE_URL}/api/upload/file`, {
                                                         method: 'POST',
                                                         body: formData
                                                     });
                                                     const result = await response.json();
                                                     if (result.success) {
                                                         setProfileData({...profileData, photo: result.fileId});
                                                     }
                                                 } catch (error) {
                                                     console.error('Upload failed:', error);
                                                 }
                                             }
                                         }}
                                     />
                                     <label 
                                         htmlFor="editPhoto"
                                         className="block w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition overflow-hidden"
                                     >
                                         {imagePreviews.photo || profileData.photo ? (
                                             <img 
                                                 src={imagePreviews.photo || (profileData.photo.startsWith('http') ? profileData.photo : `${API_BASE_URL}${profileData.photo}`)} 
                                                 alt="Photo" 
                                                 className="w-full h-full object-contain block"
                                             />
                                         ) : (
                                             <div className="flex flex-col items-center justify-center h-full">
                                                 <svg className="w-4 h-4 mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                 </svg>
                                                 <p className="text-xs text-gray-500 font-medium">Photo</p>
                                             </div>
                                         )}
                                     </label>
                                 </div>
                                 
                                 <div className="relative">
                                     <input 
                                         type="file"
                                         accept="image/*"
                                         id="editDlPhoto"
                                         className="hidden"
                                         onChange={async (e) => {
                                             const file = e.target.files?.[0];
                                             if (file) {
                                                 const previewUrl = URL.createObjectURL(file);
                                                 setImagePreviews({...imagePreviews, dlPhoto: previewUrl});
                                                 try {
                                                     const formData = new FormData();
                                                     formData.append('file', file);
                                                     const response = await fetch(`${API_BASE_URL}/api/upload/file`, {
                                                         method: 'POST',
                                                         body: formData
                                                     });
                                                     const result = await response.json();
                                                     if (result.success) {
                                                         setProfileData({...profileData, dlPhoto: result.fileId});
                                                     }
                                                 } catch (error) {
                                                     console.error('Upload failed:', error);
                                                 }
                                             }
                                         }}
                                     />
                                     <label 
                                         htmlFor="editDlPhoto"
                                         className="block w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition overflow-hidden"
                                     >
                                         {imagePreviews.dlPhoto || profileData.dlPhoto ? (
                                             <img 
                                                 src={imagePreviews.dlPhoto || (profileData.dlPhoto.startsWith('http') ? profileData.dlPhoto : `${API_BASE_URL}${profileData.dlPhoto}`)} 
                                                 alt="Driving License" 
                                                 className="w-full h-full object-contain block"
                                             />
                                         ) : (
                                             <div className="flex flex-col items-center justify-center h-full">
                                                 <svg className="w-4 h-4 mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                 </svg>
                                                 <p className="text-xs text-gray-500 font-medium">Driving License</p>
                                             </div>
                                         )}
                                     </label>
                                 </div>
                                 
                                 <div className="relative">
                                     <input 
                                         type="file"
                                         accept="image/*"
                                         id="editPanPhoto"
                                         className="hidden"
                                         onChange={async (e) => {
                                             const file = e.target.files?.[0];
                                             if (file) {
                                                 const previewUrl = URL.createObjectURL(file);
                                                 setImagePreviews({...imagePreviews, panPhoto: previewUrl});
                                                 try {
                                                     const formData = new FormData();
                                                     formData.append('file', file);
                                                     const response = await fetch(`${API_BASE_URL}/api/upload/file`, {
                                                         method: 'POST',
                                                         body: formData
                                                     });
                                                     const result = await response.json();
                                                     if (result.success) {
                                                         setProfileData({...profileData, panPhoto: result.fileId});
                                                     }
                                                 } catch (error) {
                                                     console.error('Upload failed:', error);
                                                 }
                                             }
                                         }}
                                     />
                                     <label 
                                         htmlFor="editPanPhoto"
                                         className="block w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition overflow-hidden"
                                     >
                                         {imagePreviews.panPhoto || profileData.panPhoto ? (
                                             <img 
                                                 src={imagePreviews.panPhoto || (profileData.panPhoto.startsWith('http') ? profileData.panPhoto : `${API_BASE_URL}${profileData.panPhoto}`)} 
                                                 alt="PAN Card" 
                                                 className="w-full h-full object-contain block"
                                             />
                                         ) : (
                                             <div className="flex flex-col items-center justify-center h-full">
                                                 <svg className="w-4 h-4 mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                                 </svg>
                                                 <p className="text-xs text-gray-500 font-medium">PAN Card</p>
                                             </div>
                                         )}
                                     </label>
                                 </div>
                                 
                                 <div className="relative">
                                     <input 
                                         type="file"
                                         accept="image/*"
                                         id="editAadharPhoto"
                                         className="hidden"
                                         onChange={async (e) => {
                                             const file = e.target.files?.[0];
                                             if (file) {
                                                 const previewUrl = URL.createObjectURL(file);
                                                 setImagePreviews({...imagePreviews, aadharPhoto: previewUrl});
                                                 try {
                                                     const formData = new FormData();
                                                     formData.append('file', file);
                                                     const response = await fetch(`${API_BASE_URL}/api/upload/file`, {
                                                         method: 'POST',
                                                         body: formData
                                                     });
                                                     const result = await response.json();
                                                     if (result.success) {
                                                         setProfileData({...profileData, aadharPhoto: result.fileId});
                                                     }
                                                 } catch (error) {
                                                     console.error('Upload failed:', error);
                                                 }
                                             }
                                         }}
                                     />
                                     <label 
                                         htmlFor="editAadharPhoto"
                                         className="block w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition overflow-hidden"
                                     >
                                         {imagePreviews.aadharPhoto || profileData.aadharPhoto ? (
                                             <img 
                                                 src={imagePreviews.aadharPhoto || (profileData.aadharPhoto.startsWith('http') ? profileData.aadharPhoto : `${API_BASE_URL}${profileData.aadharPhoto}`)} 
                                                 alt="Aadhar Card" 
                                                 className="w-full h-full object-contain block"
                                             />
                                         ) : (
                                             <div className="flex flex-col items-center justify-center h-full">
                                                 <svg className="w-4 h-4 mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                 </svg>
                                                 <p className="text-xs text-gray-500 font-medium">Aadhar Card</p>
                                             </div>
                                         )}
                                     </label>
                                 </div>

                                 {/* Police Verification Upload - New Field */}
                                 <div className="relative col-span-2">
                                     <input 
                                         type="file"
                                         accept="image/*"
                                         id="editPoliceVerificationPhoto"
                                         className="hidden"
                                         onChange={async (e) => {
                                             const file = e.target.files?.[0];
                                             if (file) {
                                                 const previewUrl = URL.createObjectURL(file);
                                                 setImagePreviews({...imagePreviews, policeVerificationPhoto: previewUrl});
                                                 try {
                                                     const formData = new FormData();
                                                     formData.append('file', file);
                                                     const response = await fetch(`${API_BASE_URL}/api/upload/file`, {
                                                         method: 'POST',
                                                         body: formData
                                                     });
                                                     const result = await response.json();
                                                     if (result.success) {
                                                         setProfileData({...profileData, policeVerificationPhoto: result.fileId});
                                                         // Show immediate feedback
                                                         alert('Police verification document uploaded successfully! Admin will verify it shortly.');
                                                     }
                                                 } catch (error) {
                                                     console.error('Upload failed:', error);
                                                     alert('Failed to upload document. Please try again.');
                                                 }
                                             }
                                         }}
                                     />
                                     <label 
                                         htmlFor="editPoliceVerificationPhoto"
                                         className="block w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition overflow-hidden"
                                     >
                                         {imagePreviews.policeVerificationPhoto || profileData.policeVerificationPhoto ? (
                                             <img 
                                                 src={imagePreviews.policeVerificationPhoto || (profileData.policeVerificationPhoto.startsWith('http') ? profileData.policeVerificationPhoto : `${API_BASE_URL}${profileData.policeVerificationPhoto}`)} 
                                                 alt="Police Verification" 
                                                 className="w-full h-full object-contain block"
                                             />
                                         ) : (
                                             <div className="flex flex-col items-center justify-center h-full">
                                                 <svg className="w-6 h-6 mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                 </svg>
                                                 <p className="text-xs text-gray-500 font-medium">Police Verification</p>
                                                 <p className="text-[10px] text-gray-400 mt-1">Click to upload verification document</p>
                                                 {profileData.policeVerificationPhoto && (
                                                     <p className="text-[10px] text-green-600 mt-1">✓ Document uploaded</p>
                                                 )}
                                             </div>
                                         )}
                                     </label>
                                     {profileData.policeVerificationPhoto && (
                                         <div className="absolute bottom-2 right-2 bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full">
                                             Uploaded
                                         </div>
                                     )}
                                 </div>
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
      {showPaymentModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-2">Select Payment Method</h2>
            <p className="text-sm text-gray-600 mb-2">{selectedPackage.name} - ₹{selectedPackage.price}</p>
            <p className="text-xs text-gray-500 mb-6">Choose how you want to pay</p>
            
            <div className="space-y-3">
              <button
                onClick={() => handlePaymentMethodSelect('CASH')}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-700 transition shadow-lg flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
                Cash
              </button>
              
              <button
                onClick={() => handlePaymentMethodSelect('UPI')}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-blue-700 transition shadow-lg flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
                UPI
              </button>
            </div>
            
            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ConfirmModal {...confirmConfig} onCancel={closeConfirm} />
    </div>
  );
};

export default DriverPortal;