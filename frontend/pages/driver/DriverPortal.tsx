import React, { useState, useEffect } from 'react';
import { Driver, Trip, Package } from '../../types';
import { tripAPI } from '../../api/trip';
import DriverBookingRequests from './DriverBookingRequests';
import { API_BASE_URL } from '../../api/config.js';

interface DriverPortalProps {
  driver: Driver;
}

const DriverPortal: React.FC<DriverPortalProps> = ({ driver: initialDriver }) => {
  const [activeTab, setActiveTab] = useState<'HOME' | 'TRIPS' | 'PROFILE' | 'PACKAGES' | 'REQUESTS'>('REQUESTS');
  const [driver, setDriver] = useState<Driver>(initialDriver);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [availableTrips, setAvailableTrips] = useState<Trip[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [packages] = useState<Package[]>([
    { id: 'p1', name: 'Local Driver Pass', type: 'LOCAL', price: 499, durationDays: 30, description: 'Accept unlimited local hourly rides for 30 days' },
    { id: 'p2', name: 'Outstation Pro', type: 'OUTSTATION', price: 999, durationDays: 30, description: 'Accept outstation and long-distance trips' },
    { id: 'p3', name: 'All Access Premium', type: 'ALL_PREMIUM', price: 1299, durationDays: 30, description: 'Access to all trip types + Priority support' },
  ]);

  // Profile Edit States
  const [profileData, setProfileData] = useState({
    ...driver,
    altPhone: driver.altPhone || [],
    upiId: driver.upiId || driver.gpayNo || '',
    photo: driver.photo || '',
    dlPhoto: driver.dlPhoto || '',
    panPhoto: driver.panPhoto || '',
    aadharPhoto: driver.aadharPhoto || ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [password, setPassword] = useState('');

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
      aadharPhoto: initialDriver.aadharPhoto || ''
    });
  }, [initialDriver]);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          console.error('No auth token found');
          return;
        }
        
        const [availableRes, driverRes] = await Promise.all([
          tripAPI.getAvailableTrips(),
          tripAPI.getDriverTrips()
        ]);
        
        if (availableRes.success) {
          setAvailableTrips(availableRes.trips || []);
        } else {
          console.error('Failed to fetch available trips:', availableRes.error);
        }
        
        if (driverRes.success) {
          setTrips(driverRes.trips || []);
        } else {
          console.error('Failed to fetch driver trips:', driverRes.error);
        }
      } catch (error) {
        console.error('Error fetching trips:', error);
      }
    };
    
    fetchTrips();
  }, [activeTab, driver.id]);

  const handleAcceptTrip = async (tripId: string) => {
    try {
      const result = await tripAPI.acceptTrip(tripId);
      
      if (result.success) {
        alert('✓ Trip accepted successfully!');
        
        // Refresh both available and driver trips
        const [availableRes, driverRes] = await Promise.all([
          tripAPI.getAvailableTrips(),
          tripAPI.getDriverTrips()
        ]);
        
        if (availableRes.success) setAvailableTrips(availableRes.trips || []);
        if (driverRes.success) setTrips(driverRes.trips || []);
      } else {
        alert('Failed to accept trip: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error accepting trip:', error);
      alert('Failed to accept trip');
    }
  };

  const handleCancelTrip = async (tripId: string) => {
    if (window.confirm("Are you sure you want to cancel this trip? This action cannot be undone.")) {
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
            const [availableRes, driverRes] = await Promise.all([
              tripAPI.getAvailableTrips(),
              tripAPI.getDriverTrips()
            ]);
            
            if (availableRes.success) setAvailableTrips(availableRes.trips || []);
            if (driverRes.success) setTrips(driverRes.trips || []);
          }
        } catch (error) {
          console.error('Error cancelling trip:', error);
        }
    }
  };

  const handleSubscriptionBuy = async (pkg: Package) => {
      const confirmed = window.confirm(`Subscribe to ${pkg.name} for ₹${pkg.price}?`);
      if (confirmed) {
          try {
              const response = await fetch(`${API_BASE_URL}/api/drivers/package`, {
                  method: 'PUT',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
                  },
                  credentials: 'include',
                  body: JSON.stringify({ packageType: pkg.type })
              });
              
              const data = await response.json();
              
              if (data.success) {
                  alert("Package subscribed successfully!");
                  window.location.reload();
              } else {
                  alert(data.error || 'Failed to subscribe');
              }
          } catch (error) {
              alert('Error subscribing to package');
          }
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
                  email: profileData.email,
                  phone: profileData.phone,
                  alternateMobile1: driver.alternateMobile1,
                  alternateMobile2: driver.alternateMobile2,
                  alternateMobile3: driver.alternateMobile3,
                  alternateMobile4: driver.alternateMobile4,
                  upiId: profileData.upiId,
                  photo: profileData.photo,
                  dlPhoto: profileData.dlPhoto,
                  panPhoto: profileData.panPhoto,
                  aadharPhoto: profileData.aadharPhoto
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
                  ].filter(Boolean),
                  upiId: data.user.gpayNo
              });
              
              setIsEditingProfile(false);
              alert("Profile Updated Successfully");
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
            <DriverBookingRequests />
        )}

        {/* HOME TAB: New Requests & Active Trips */}
        {activeTab === 'HOME' && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
                {/* Active Trips First */}
                {activeTrips.length > 0 && (
                    <div>
                        <h3 className="text-base sm:text-lg font-bold mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Ongoing Trips
                        </h3>
                        {activeTrips.map(trip => (
                            <div key={trip.id} className="bg-black text-white rounded-xl p-4 sm:p-5 mb-3 shadow-lg">
                                <div className="flex justify-between items-center mb-3 sm:mb-4 border-b border-gray-800 pb-2">
                                    <span className="font-bold text-base sm:text-lg">On Trip</span>
                                    <span className="bg-white text-black text-[10px] sm:text-xs font-bold px-2 py-1 rounded">{trip.serviceType || trip.type}</span>
                                </div>
                                <div className="space-y-2 mb-3 sm:mb-4">
                                    <p className="text-gray-400 text-xs uppercase">From</p>
                                    <p className="font-bold">{trip.pickupLocation}</p>
                                    <p className="text-gray-400 text-xs uppercase mt-2">To</p>
                                    <p className="font-bold">{trip.dropLocation}</p>
                                </div>
                                <div className="space-y-3">
                                    <button 
                                        onClick={async () => {
                                            if (window.confirm('Mark this trip as completed?\n\nCustomer: ' + (trip.customer?.name || 'N/A') + '\nFrom: ' + trip.pickupLocation + '\nTo: ' + trip.dropLocation)) {
                                                try {
                                                  const result = await tripAPI.completeTrip(trip.id);
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
                                        }}
                                        className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Complete Trip
                                    </button>
                                    
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
                )}

                {/* Available Requests */}
                {isOnline ? (
                    <div>
                        <h3 className="text-base sm:text-lg font-bold mb-3">New Opportunities</h3>
                        {availableTrips.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-400">Searching for rides...</p>
                            </div>
                        ) : (
                            availableTrips.map(trip => (
                                <div key={trip.id} className="bg-white rounded-xl p-4 sm:p-5 shadow-floating border border-gray-100 mb-4">
                                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                                         <div>
                                             <h4 className="text-xl sm:text-2xl font-bold">₹{trip.estimateAmount || trip.estimatedCost || 0}</h4>
                                             <p className="text-gray-500 text-[10px] sm:text-xs font-medium">{trip.duration} • {trip.serviceType || trip.type}</p>
                                         </div>
                                    </div>
                                    
                                    <div className="relative pl-5 sm:pl-6 space-y-3 sm:space-y-4 mb-4 sm:mb-5">
                                        <div className="absolute left-1.5 top-1 bottom-1 w-0.5 bg-gray-200"></div>
                                        <div className="relative">
                                            <div className="absolute -left-5 sm:-left-6 top-1 w-3 h-3 bg-black rounded-full"></div>
                                            <p className="text-xs sm:text-sm font-semibold">{trip.pickupLocation}</p>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute -left-5 sm:-left-6 top-1 w-3 h-3 bg-white border-2 border-black"></div>
                                            <p className="text-xs sm:text-sm font-semibold">{trip.dropLocation}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button className="flex-1 bg-gray-100 text-black font-bold py-3 rounded-lg text-sm">Ignore</button>
                                        <button 
                                            onClick={() => handleAcceptTrip(trip.id)}
                                            className="flex-[2] bg-black text-white font-bold py-3 rounded-lg text-sm hover:bg-gray-800"
                                        >
                                            Accept
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-400">You are offline. Go online to see requests.</p>
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
                                     <span className="bg-black text-white text-xs font-bold px-2 py-1 rounded">{trip.type}</span>
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
                             <div key={trip.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm mb-3">
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
                                          <p className="text-xs text-gray-500">{trip.type}</p>
                                          {trip.rating && (
                                              <p className="text-xs font-bold text-yellow-500 mt-1">
                                                  {'★'.repeat(trip.rating)}
                                              </p>
                                          )}
                                      </div>
                                      <p className="font-bold text-lg">₹{trip.estimatedCost}</p>
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
                        const isActive = driver.packageSubscription === pkg.type || driver.packageType === pkg.type;
                        return (
                        <div key={pkg.id} className={`border-2 rounded-xl p-4 sm:p-6 relative ${isActive ? 'border-black bg-gray-50' : 'border-gray-100 bg-white'}`}>
                            {isActive && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black text-white px-3 py-1 rounded-full text-xs font-bold">
                                    CURRENT PLAN
                                </div>
                            )}
                            <h3 className="font-bold text-base sm:text-lg">{pkg.name}</h3>
                            <p className="text-2xl sm:text-3xl font-extrabold mt-2">₹{pkg.price}<span className="text-xs sm:text-sm font-normal text-gray-500">/{pkg.durationDays} days</span></p>
                            <p className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3">{pkg.description}</p>
                            
                            <button 
                                onClick={() => handleSubscriptionBuy(pkg)}
                                disabled={isActive}
                                className={`w-full mt-4 sm:mt-6 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm ${isActive ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}
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
                                 <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                                     {driver.photo && driver.photo !== '' ? (
                                         <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                                             <span className="text-blue-600 text-lg font-bold">{driver.name?.charAt(0) || 'D'}</span>
                                         </div>
                                     ) : (
                                         <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                             <span className="text-gray-600 text-lg font-bold">{driver.name?.charAt(0) || 'D'}</span>
                                         </div>
                                     )}
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
                             <div className="mb-6">
                                 <div className="bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 shadow-sm">
                                     <div className="flex items-center gap-2 sm:gap-3">
                                         <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                                             <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                             </svg>
                                         </div>
                                         <div className="flex-1 min-w-0">
                                             <p className="text-xs sm:text-sm text-gray-500">Total trips completed</p>
                                             <p className="text-xl sm:text-2xl font-bold text-black">{driver.completedTrips || 0}</p>
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             <div className="space-y-4">
                                 <div className="p-4 bg-gray-50 rounded-xl">
                                     <p className="text-xs text-gray-400 font-bold uppercase mb-2">Documents</p>
                                     <div className="space-y-2 text-sm">
                                         <div className="flex justify-between items-center">
                                             <span className="text-gray-500">License:</span>
                                             <span className="font-medium text-right break-all">{driver.licenseNo || profileData.licenseNo}</span>
                                         </div>
                                         <div className="flex justify-between items-center">
                                             <span className="text-gray-500">Aadhar:</span>
                                             <span className="font-medium text-right break-all">{driver.aadharNo || profileData.aadharNo}</span>
                                         </div>
                                     </div>
                                 </div>

                                 <div className="p-4 bg-gray-50 rounded-xl">
                                     <p className="text-xs text-gray-400 font-bold uppercase mb-2">Payment & Contact</p>
                                     <div className="space-y-2 text-sm">
                                         <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-200 pb-2">
                                             <span className="text-gray-500 mb-1 sm:mb-0">UPI ID:</span>
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
                                                 ].filter(Boolean).length ? 
                                                     [
                                                         driver.alternateMobile1,
                                                         driver.alternateMobile2,
                                                         driver.alternateMobile3,
                                                         driver.alternateMobile4
                                                     ].filter(Boolean).map((phone, index) => (
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
                                         <div className="flex justify-between items-center py-1">
                                             <span className="text-gray-500">Driving License:</span>
                                             <span className={`font-medium text-xs px-2 py-1 rounded ${driver.dlPhoto ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                 {driver.dlPhoto ? '✓ Uploaded' : 'Not uploaded'}
                                             </span>
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
                                <label className="block text-xs font-bold text-gray-500 mb-1">UPI ID (GPay/PhonePe)</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-gray-50 rounded-lg p-3 text-sm"
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
                                         onChange={(e) => {
                                             const file = e.target.files?.[0];
                                             if (file) {
                                                 setProfileData({...profileData, photo: file.name});
                                             }
                                         }}
                                     />
                                     <label 
                                         htmlFor="editPhoto"
                                         className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                                     >
                                         <div className="flex flex-col items-center justify-center pt-2 pb-2">
                                             <svg className="w-4 h-4 mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                             </svg>
                                             <p className="text-xs text-gray-500 font-medium">Photo</p>
                                             {profileData.photo && <p className="text-xs text-green-600 font-bold">✓ Selected</p>}
                                         </div>
                                     </label>
                                 </div>
                                 
                                 <div className="relative">
                                     <input 
                                         type="file"
                                         accept="image/*"
                                         id="editDlPhoto"
                                         className="hidden"
                                         onChange={(e) => {
                                             const file = e.target.files?.[0];
                                             if (file) {
                                                 setProfileData({...profileData, dlPhoto: file.name});
                                             }
                                         }}
                                     />
                                     <label 
                                         htmlFor="editDlPhoto"
                                         className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                                     >
                                         <div className="flex flex-col items-center justify-center pt-2 pb-2">
                                             <svg className="w-4 h-4 mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                             </svg>
                                             <p className="text-xs text-gray-500 font-medium">Driving License</p>
                                             {profileData.dlPhoto && <p className="text-xs text-green-600 font-bold">✓ Selected</p>}
                                         </div>
                                     </label>
                                 </div>
                                 
                                 <div className="relative">
                                     <input 
                                         type="file"
                                         accept="image/*"
                                         id="editPanPhoto"
                                         className="hidden"
                                         onChange={(e) => {
                                             const file = e.target.files?.[0];
                                             if (file) {
                                                 setProfileData({...profileData, panPhoto: file.name});
                                             }
                                         }}
                                     />
                                     <label 
                                         htmlFor="editPanPhoto"
                                         className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                                     >
                                         <div className="flex flex-col items-center justify-center pt-2 pb-2">
                                             <svg className="w-4 h-4 mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                             </svg>
                                             <p className="text-xs text-gray-500 font-medium">PAN Card</p>
                                             {profileData.panPhoto && <p className="text-xs text-green-600 font-bold">✓ Selected</p>}
                                         </div>
                                     </label>
                                 </div>
                                 
                                 <div className="relative">
                                     <input 
                                         type="file"
                                         accept="image/*"
                                         id="editAadharPhoto"
                                         className="hidden"
                                         onChange={(e) => {
                                             const file = e.target.files?.[0];
                                             if (file) {
                                                 setProfileData({...profileData, aadharPhoto: file.name});
                                             }
                                         }}
                                     />
                                     <label 
                                         htmlFor="editAadharPhoto"
                                         className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                                     >
                                         <div className="flex flex-col items-center justify-center pt-2 pb-2">
                                             <svg className="w-4 h-4 mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                             </svg>
                                             <p className="text-xs text-gray-500 font-medium">Aadhar Card</p>
                                             {profileData.aadharPhoto && <p className="text-xs text-green-600 font-bold">✓ Selected</p>}
                                         </div>
                                     </label>
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
    </div>
  );
};

export default DriverPortal;
