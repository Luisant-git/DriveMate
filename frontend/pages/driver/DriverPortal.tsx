
import React, { useState, useEffect } from 'react';
import { Driver, Trip, Package } from '../../types';
import { store } from '../../services/mockStore';

interface DriverPortalProps {
  driver: Driver;
}

const DriverPortal: React.FC<DriverPortalProps> = ({ driver: initialDriver }) => {
  const [activeTab, setActiveTab] = useState<'HOME' | 'TRIPS' | 'PROFILE' | 'PACKAGES'>('HOME');
  const [driver, setDriver] = useState<Driver>(initialDriver);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [availableTrips, setAvailableTrips] = useState<Trip[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [packages] = useState<Package[]>(store.packages);

  // Profile Edit States
  const [profileData, setProfileData] = useState(driver);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [password, setPassword] = useState('');

  // Update local driver state when prop changes or on mount/tab change
  useEffect(() => {
    const updatedDriver = store.getDriver(initialDriver.id);
    if (updatedDriver) {
        setDriver(updatedDriver);
        setProfileData(updatedDriver); // Sync profile edit form
    }
  }, [initialDriver.id, activeTab]);

  useEffect(() => {
    const allTrips = store.getTripsForDriver(driver.id);
    setTrips(allTrips);
    
    // Get available trips and sort Ascending (Soonest first)
    const available = store.trips.filter(t => t.status === 'PENDING' && !t.driverId);
    available.sort((a, b) => `${a.startDate}T${a.startTime}`.localeCompare(`${b.startDate}T${b.startTime}`));
    setAvailableTrips(available);
  }, [driver.id, activeTab]);

  const handleAcceptTrip = (tripId: string) => {
    if (!driver.packageSubscription) {
        alert("Please subscribe to a package to accept trips.");
        setActiveTab('PACKAGES');
        return;
    }
    store.updateTripStatus(tripId, 'ACCEPTED', driver.id);
    // Refresh
    setTrips(store.getTripsForDriver(driver.id));
    
    // Refresh available and sort
    const available = store.trips.filter(t => t.status === 'PENDING' && !t.driverId);
    available.sort((a, b) => `${a.startDate}T${a.startTime}`.localeCompare(`${b.startDate}T${b.startTime}`));
    setAvailableTrips(available);
  };

  const handleCancelTrip = (tripId: string) => {
    if (window.confirm("Are you sure you want to cancel this trip? This action cannot be undone.")) {
        store.updateTripStatus(tripId, 'CANCELLED');
        // Refresh
        setTrips(store.getTripsForDriver(driver.id));
        
        // Refresh available and sort
        const available = store.trips.filter(t => t.status === 'PENDING' && !t.driverId);
        available.sort((a, b) => `${a.startDate}T${a.startTime}`.localeCompare(`${b.startDate}T${b.startTime}`));
        setAvailableTrips(available);
    }
  };

  const handleSubscriptionBuy = (pkg: Package) => {
      // Mock Payment Gateway
      const confirmed = window.confirm(`Proceed to pay ₹${pkg.price} for ${pkg.name} via Payment Gateway?`);
      if (confirmed) {
          store.addPayment({
              id: store.generateId(),
              userId: driver.id,
              amount: pkg.price,
              date: new Date().toISOString().split('T')[0],
              type: 'SUBSCRIPTION',
              status: 'SUCCESS'
          });
          store.updateDriverSubscription(driver.id, pkg.type);
          alert("Payment Successful! Subscription Active.");
          // Force re-render or update local state logic would go here
          window.location.reload(); 
      }
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
      e.preventDefault();
      // In a real app, call store.updateDriver(profileData)
      setIsEditingProfile(false);
      alert("Profile Updated Successfully");
  };

  // Filter for "My Active Jobs" - excludes unassigned opportunities
  // Sort Ascending (Soonest first) for schedule
  const activeTrips = trips.filter(t => 
      t.driverId === driver.id && 
      (t.status === 'ACCEPTED' || t.status === 'ONGOING' || t.status === 'PENDING')
  ).sort((a, b) => `${a.startDate}T${a.startTime}`.localeCompare(`${b.startDate}T${b.startTime}`));
  
  // Sort Descending (Newest first) for history
  const pastTrips = trips.filter(t => t.status === 'COMPLETED' || t.status === 'CANCELLED')
    .sort((a, b) => `${b.startDate}T${b.startTime}`.localeCompare(`${a.startDate}T${a.startTime}`));

  return (
    <div className="max-w-3xl mx-auto pb-20 px-4 sm:px-0">
      {/* Top Status Bar */}
      <div className="bg-black text-white p-3 sm:p-4 flex justify-between items-center sticky top-16 z-40 shadow-md -mx-4 sm:mx-0 sm:rounded-lg">
          <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`}></div>
              <div>
                  <p className="font-bold text-sm leading-none">{isOnline ? 'Online' : 'Offline'}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{driver.packageSubscription ? `${driver.packageSubscription} Plan Active` : 'No Active Plan'}</p>
              </div>
          </div>
          <button 
            onClick={() => setIsOnline(!isOnline)} 
            className="text-[10px] sm:text-xs bg-gray-800 hover:bg-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold border border-gray-700 transition"
          >
              {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
          </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[88px] sm:top-[104px] z-30 flex overflow-x-auto scrollbar-hide -mx-4 sm:mx-0">
          {['HOME', 'TRIPS', 'PACKAGES', 'PROFILE'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 min-w-[70px] sm:min-w-[80px] py-3 sm:py-4 text-[10px] sm:text-xs font-bold border-b-2 transition ${activeTab === tab ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
              >
                  {tab}
              </button>
          ))}
      </div>

      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
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
                                    <span className="bg-white text-black text-[10px] sm:text-xs font-bold px-2 py-1 rounded">{trip.type}</span>
                                </div>
                                <div className="space-y-2 mb-3 sm:mb-4">
                                    <p className="text-gray-400 text-xs uppercase">From</p>
                                    <p className="font-bold">{trip.pickupLocation}</p>
                                    <p className="text-gray-400 text-xs uppercase mt-2">To</p>
                                    <p className="font-bold">{trip.dropLocation}</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        store.updateTripStatus(trip.id, 'COMPLETED');
                                        setTrips([...store.getTripsForDriver(driver.id)]);
                                    }}
                                    className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold"
                                >
                                    Complete Trip
                                </button>
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
                                <div key={trip.id} className="bg-white rounded-xl p-4 sm:p-5 shadow-floating border border-gray-100 mb-4 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-2 h-full bg-black"></div>
                                    <div className="flex justify-between items-start mb-3 sm:mb-4 pr-4">
                                         <div>
                                             <h4 className="text-xl sm:text-2xl font-bold">₹{trip.estimatedCost}</h4>
                                             <p className="text-gray-500 text-[10px] sm:text-xs font-medium">{trip.duration} • {trip.type}</p>
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
                             <div key={trip.id} className="bg-white border-l-4 border-black rounded-xl p-4 sm:p-5 mb-3 shadow-sm flex flex-col gap-2">
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
                                 {(trip.status === 'PENDING' || trip.status === 'ACCEPTED') && (
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
                    {packages.map(pkg => (
                        <div key={pkg.id} className={`border-2 rounded-xl p-4 sm:p-6 relative ${driver.packageSubscription === pkg.type ? 'border-black bg-gray-50' : 'border-gray-100 bg-white'}`}>
                            {driver.packageSubscription === pkg.type && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black text-white px-3 py-1 rounded-full text-xs font-bold">
                                    CURRENT PLAN
                                </div>
                            )}
                            <h3 className="font-bold text-base sm:text-lg">{pkg.name}</h3>
                            <p className="text-2xl sm:text-3xl font-extrabold mt-2">₹{pkg.price}<span className="text-xs sm:text-sm font-normal text-gray-500">/{pkg.durationDays} days</span></p>
                            <p className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3">{pkg.description}</p>
                            
                            <button 
                                onClick={() => handleSubscriptionBuy(pkg)}
                                disabled={driver.packageSubscription === pkg.type}
                                className={`w-full mt-4 sm:mt-6 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm ${driver.packageSubscription === pkg.type ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}
                            >
                                {driver.packageSubscription === pkg.type ? 'Active' : 'Choose Package & Pay'}
                            </button>
                        </div>
                    ))}
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
                                 <img src={profileData.avatarUrl} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white object-cover bg-gray-200" />
                             </div>
                         </div>
                         <div className="pt-10 sm:pt-12 px-4 sm:px-6 pb-4 sm:pb-6">
                             <div className="flex justify-between items-start mb-4 sm:mb-6">
                                 <div>
                                     <div className="flex items-center gap-2">
                                        <h2 className="text-xl sm:text-2xl font-bold">{profileData.name}</h2>
                                        <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                            ★ {driver.rating}
                                        </span>
                                     </div>
                                     <p className="text-gray-500 text-xs sm:text-sm mt-1">{profileData.phone}</p>
                                 </div>
                                 <button onClick={() => setIsEditingProfile(true)} className="text-sm font-bold text-accent hover:underline">Edit Profile</button>
                             </div>
                             
                             {/* Stats Row */}
                             <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                                 <div className="bg-gray-50 p-2.5 sm:p-3 rounded-xl text-center">
                                     <p className="text-xs text-gray-500 uppercase font-bold">Trips</p>
                                     <p className="text-lg sm:text-xl font-bold">{driver.completedTrips}</p>
                                 </div>
                                 <div className="bg-gray-50 p-2.5 sm:p-3 rounded-xl text-center">
                                     <p className="text-xs text-gray-500 uppercase font-bold">Rating</p>
                                     <p className="text-lg sm:text-xl font-bold flex items-center justify-center gap-1">
                                         {driver.rating} <span className="text-yellow-500 text-sm">★</span>
                                     </p>
                                 </div>
                             </div>

                             <div className="space-y-4">
                                 <div className="p-4 bg-gray-50 rounded-xl">
                                     <p className="text-xs text-gray-400 font-bold uppercase mb-2">Documents</p>
                                     <div className="grid grid-cols-2 gap-4 text-sm">
                                         <div><span className="text-gray-500">License:</span> <br/> <span className="font-medium">{profileData.licenseNo}</span></div>
                                         <div><span className="text-gray-500">Aadhar:</span> <br/> <span className="font-medium">{profileData.aadharNo}</span></div>
                                     </div>
                                 </div>

                                 <div className="p-4 bg-gray-50 rounded-xl">
                                     <p className="text-xs text-gray-400 font-bold uppercase mb-2">Payment & Contact</p>
                                     <div className="space-y-2 text-sm">
                                         <div className="flex justify-between border-b border-gray-200 pb-2">
                                             <span className="text-gray-500">UPI ID:</span>
                                             <span className="font-medium">{profileData.upiId || 'Not set'}</span>
                                         </div>
                                         <div className="flex justify-between">
                                             <span className="text-gray-500">Alt Phones:</span>
                                             <span className="font-medium text-right">{profileData.altPhone.length ? profileData.altPhone.join(', ') : 'None'}</span>
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
                                    value={profileData.altPhone[0] || ''}
                                    onChange={e => {
                                        const newAlts = [...profileData.altPhone];
                                        newAlts[0] = e.target.value;
                                        setProfileData({...profileData, altPhone: newAlts});
                                    }}
                                />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Alternate Phone 2</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-gray-50 rounded-lg p-3 text-sm"
                                    value={profileData.altPhone[1] || ''}
                                    onChange={e => {
                                        const newAlts = [...profileData.altPhone];
                                        newAlts[1] = e.target.value;
                                        setProfileData({...profileData, altPhone: newAlts});
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
                             <p className="text-xs font-bold text-gray-500 mb-3 uppercase">Document Uploads (Mock)</p>
                             <div className="grid grid-cols-2 gap-4">
                                 <button type="button" className="border border-dashed border-gray-300 rounded-lg p-4 text-xs text-gray-500 hover:bg-gray-50">Upload Photo</button>
                                 <button type="button" className="border border-dashed border-gray-300 rounded-lg p-4 text-xs text-gray-500 hover:bg-gray-50">Upload DL</button>
                                 <button type="button" className="border border-dashed border-gray-300 rounded-lg p-4 text-xs text-gray-500 hover:bg-gray-50">Upload PAN</button>
                                 <button type="button" className="border border-dashed border-gray-300 rounded-lg p-4 text-xs text-gray-500 hover:bg-gray-50">Upload Aadhar</button>
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
