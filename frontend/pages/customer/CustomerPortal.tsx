
import React, { useState, useEffect } from 'react';
import { Customer, BookingType, Trip } from '../../types';
import { store } from '../../services/mockStore';
import { getRecommendedPackage, getTripEstimate } from '../../services/geminiService';

interface CustomerPortalProps {
  customer: Customer;
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({ customer: initialCustomer }) => {
  const [activeTab, setActiveTab] = useState<'BOOK' | 'TRIPS' | 'PROFILE'>('BOOK');
  const [customer, setCustomer] = useState<Customer>(initialCustomer);
  const [myTrips, setMyTrips] = useState<Trip[]>(store.getTripsForCustomer(customer.id));
  const [bookingType, setBookingType] = useState<BookingType>(BookingType.LOCAL_HOURLY);
  
  // AI & Booking States
  const [aiQuery, setAiQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<{ recommendedType: BookingType, reason: string } | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    pickup: '',
    drop: '',
    date: '',
    time: '',
    duration: '',
    whenNeeded: 'Now',
    carType: 'Manual',
    vehicleType: 'Hatchback',
    tripType: 'Round Trip',
    estimatedUsage: '12 Hrs',
  });
  const [estimate, setEstimate] = useState<string | null>(null);

  // Profile Edit States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    name: initialCustomer.name,
    email: initialCustomer.email,
    phone: initialCustomer.phone,
    address: initialCustomer.address || ''
  });

  // Registration Modal State
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    address: '',
    idProof: null as File | null
  });

  useEffect(() => {
      setCustomer(initialCustomer);
      setEditProfileData({
        name: initialCustomer.name,
        email: initialCustomer.email,
        phone: initialCustomer.phone,
        address: initialCustomer.address || ''
      });
      // Show registration modal if customer has incomplete profile
      if (!initialCustomer.email || !initialCustomer.address) {
        setShowRegistrationModal(true);
        setRegistrationData({
          name: initialCustomer.name,
          email: initialCustomer.email || '',
          address: initialCustomer.address || '',
          idProof: null
        });
      }
  }, [initialCustomer]);

  const handleAiAssist = async () => {
    if (!aiQuery) return;
    setIsAiLoading(true);
    const result = await getRecommendedPackage(aiQuery);
    if (result) {
      setAiRecommendation(result);
      setBookingType(result.recommendedType);
    }
    setIsAiLoading(false);
  };

  const handleEstimate = async () => {
     if(!formData.pickup || !formData.drop) return;
     const est = await getTripEstimate(`${bookingType} from ${formData.pickup} to ${formData.drop}`);
     setEstimate(est);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTrip: Trip = {
      id: store.generateId(),
      customerId: customer.id,
      type: bookingType,
      pickupLocation: formData.pickup,
      dropLocation: formData.drop,
      startDate: formData.date,
      startTime: formData.time,
      duration: formData.duration,
      status: 'PENDING',
      estimatedCost: 0
    };
    store.addTrip(newTrip);
    setMyTrips(store.getTripsForCustomer(customer.id));
    setActiveTab('TRIPS');
    alert("Request Sent to Drivers!");
  };

  const handleRating = (tripId: string, rating: number) => {
      store.rateTrip(tripId, rating);
      setMyTrips(store.getTripsForCustomer(customer.id)); // Refresh
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
      e.preventDefault();
      // Update local state to reflect changes immediately
      const updatedCustomer = { 
          ...customer, 
          name: editProfileData.name, 
          email: editProfileData.email,
          phone: editProfileData.phone,
          address: editProfileData.address
      };
      setCustomer(updatedCustomer);
      
      // Update store (mock)
      const storeCustomer = store.customers.find(c => c.id === customer.id);
      if (storeCustomer) {
          storeCustomer.name = editProfileData.name;
          storeCustomer.email = editProfileData.email;
          storeCustomer.phone = editProfileData.phone;
          storeCustomer.address = editProfileData.address;
          store.save();
      }

      setIsEditingProfile(false);
      alert("Profile updated successfully!");
  };

  const handleRegistrationSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const updatedCustomer = { 
          ...customer, 
          name: registrationData.name,
          email: registrationData.email,
          address: registrationData.address
      };
      setCustomer(updatedCustomer);
      
      const storeCustomer = store.customers.find(c => c.id === customer.id);
      if (storeCustomer) {
          storeCustomer.name = registrationData.name;
          storeCustomer.email = registrationData.email;
          storeCustomer.address = registrationData.address;
          store.save();
      }

      setShowRegistrationModal(false);
      alert("Registration completed successfully!");
  };

  const handleSkipRegistration = () => {
      setShowRegistrationModal(false);
  };

  return (
    <div className="relative h-[calc(100vh-64px)] overflow-hidden bg-gray-100">
      {/* Background Map Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-80"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop")' }}
      ></div>
      
      {/* Registration Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleRegistrationSubmit} className="p-6 space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold">Complete Your Profile</h2>
                <p className="text-sm text-gray-500 mt-1">Help us serve you better</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Full Name</label>
                <input 
                  type="text"
                  className="w-full bg-gray-100 border-none rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-black"
                  value={registrationData.name}
                  onChange={(e) => setRegistrationData({...registrationData, name: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Email Address</label>
                <input 
                  type="email"
                  className="w-full bg-gray-100 border-none rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-black"
                  value={registrationData.email}
                  onChange={(e) => setRegistrationData({...registrationData, email: e.target.value})}
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Address</label>
                <textarea 
                  className="w-full bg-gray-100 border-none rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-black resize-none"
                  rows={3}
                  value={registrationData.address}
                  onChange={(e) => setRegistrationData({...registrationData, address: e.target.value})}
                  placeholder="#123, Street Name, City"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">ID Proof</label>
                <input 
                  type="file"
                  accept="image/*,.pdf"
                  className="w-full bg-gray-100 border-none rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
                  onChange={(e) => setRegistrationData({...registrationData, idProof: e.target.files?.[0] || null})}
                />
                <p className="text-xs text-gray-500 mt-1">Aadhar / Voter ID / Passport</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={handleSkipRegistration}
                  className="flex-1 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  Skip
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-black text-white py-3 rounded-lg text-sm font-bold hover:bg-gray-800"
                >
                  Complete Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Floating Panel */}
      <div className="absolute inset-0 md:relative md:top-4 md:left-4 md:w-[420px] md:h-auto md:max-h-[calc(100vh-32px)] bg-white md:rounded-2xl shadow-floating flex flex-col z-10 overflow-hidden">
          
          {/* Header & Tabs */}
          <div className="bg-white px-4 sm:px-6 pt-4 pb-2 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-bold">DriveMate</h2>
              <div className="flex gap-1.5 sm:gap-2 text-xs font-bold">
                  <button onClick={() => setActiveTab('BOOK')} className={`px-2.5 sm:px-3 py-1.5 rounded-full ${activeTab === 'BOOK' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>Book</button>
                  <button onClick={() => setActiveTab('TRIPS')} className={`px-2.5 sm:px-3 py-1.5 rounded-full ${activeTab === 'TRIPS' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>Trips</button>
                  <button onClick={() => setActiveTab('PROFILE')} className={`px-2.5 sm:px-3 py-1.5 rounded-full ${activeTab === 'PROFILE' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>Profile</button>
              </div>
          </div>

          {activeTab === 'BOOK' && (
              <>
                <div className="p-4 sm:p-6 pb-0">
                    {/* Location Inputs */}
                    <div className="relative mb-6">
                        <div className="absolute left-4 top-4 bottom-4 w-4 flex flex-col items-center">
                            <div className="w-2 h-2 bg-black rounded-full"></div>
                            <div className="w-0.5 flex-grow bg-gray-300 my-1"></div>
                            <div className="w-2 h-2 bg-black border border-black"></div>
                        </div>
                        <div className="pl-10 space-y-3">
                            <input 
                                type="text" 
                                className="w-full bg-gray-100 border-none rounded-lg py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-black placeholder-gray-500"
                                placeholder="Pickup location"
                                value={formData.pickup}
                                onChange={e => setFormData({...formData, pickup: e.target.value})}
                            />
                            <input 
                                type="text" 
                                className="w-full bg-gray-100 border-none rounded-lg py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-black placeholder-gray-500"
                                placeholder="Drop location"
                                value={formData.drop}
                                onChange={e => setFormData({...formData, drop: e.target.value})}
                                onBlur={handleEstimate}
                            />
                        </div>
                    </div>

                    {/* AI Helper */}
                    {/* <div className="flex gap-2 mb-4">
                        <input 
                            className="flex-grow bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs"
                            placeholder="Describe your trip (e.g. Need driver for 2 days outstation)"
                            value={aiQuery}
                            onChange={(e) => setAiQuery(e.target.value)}
                        />
                        <button onClick={handleAiAssist} className="bg-black text-white rounded-lg w-8 flex items-center justify-center">
                            {isAiLoading ? '...' : '→'}
                        </button>
                    </div> */}
                </div>

                <div className="flex-grow overflow-y-auto px-4 sm:px-6 pb-2 custom-scrollbar">
                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-500 mb-2">Choose Service</label>
                        <div 
                            onClick={() => setOpenDropdown(openDropdown === 'service' ? null : 'service')}
                            className="w-full bg-gray-100 rounded-lg p-3 text-sm font-bold cursor-pointer flex justify-between items-center"
                        >
                            <span>{bookingType}</span>
                            <svg className={`w-4 h-4 transition-transform ${openDropdown === 'service' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                        {openDropdown === 'service' && (
                            <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden max-h-64 overflow-y-auto">
                                {Object.values(BookingType).map((type) => (
                                    <div 
                                        key={type}
                                        onClick={() => { setBookingType(type); setOpenDropdown(null); }}
                                        className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 ${bookingType === type ? 'bg-gray-100' : ''}`}
                                    >
                                        <div className="w-10 h-10 bg-gray-200 rounded-md mr-3 flex items-center justify-center shrink-0">
                                            <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a.75.75 0 01.75.75v.5a.75.75 0 01-.75.75H5a2 2 0 01-2-2V5a1 1 0 00-1-1z" /><path d="M11 16.5c0 .414.336.75.75.75h4.5a2 2 0 002-2V9.5a1 1 0 00-1-1h-2.5A2.5 2.5 0 0112.25 6H9.75a.75.75 0 00-.75.75v9c0 .414.336.75.75.75z" /></svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xs sm:text-sm">{type}</h4>
                                            <p className="text-[10px] text-gray-500">Reliable & Verified</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-4 sm:mt-6 space-y-3 pb-24 sm:pb-6">
                        <h3 className="font-bold text-sm mb-2">Schedule Details</h3>
                        {bookingType === BookingType.ONEWAY && (
                            <>
                                <div className="relative">
                                    <label className="block text-xs font-bold text-gray-500 mb-2">When is driver needed?</label>
                                    <div 
                                        onClick={() => setOpenDropdown(openDropdown === 'when' ? null : 'when')}
                                        className="w-full bg-gray-100 rounded-lg p-3 text-xs font-bold cursor-pointer flex justify-between items-center"
                                    >
                                        <span>{formData.whenNeeded}</span>
                                        <svg className={`w-4 h-4 transition-transform ${openDropdown === 'when' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                    {openDropdown === 'when' && (
                                        <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                            {['Now', 'Schedule Later'].map(option => (
                                                <div 
                                                    key={option}
                                                    onClick={() => { setFormData({...formData, whenNeeded: option}); setOpenDropdown(null); }}
                                                    className={`p-3 text-xs font-bold cursor-pointer hover:bg-gray-50 ${formData.whenNeeded === option ? 'bg-gray-100' : ''}`}
                                                >
                                                    {option}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {formData.whenNeeded === 'Schedule Later' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2">Date & Time</label>
                                        <div className="flex gap-2 sm:gap-3">
                                            <input 
                                                type="date" 
                                                className="flex-1 bg-gray-100 border-none rounded-lg p-2 sm:p-3 text-xs sm:text-xs font-bold [&::-webkit-datetime-edit]:text-xs sm:[&::-webkit-datetime-edit]:text-xs"
                                                value={formData.date}
                                                onChange={e => setFormData({...formData, date: e.target.value})}
                                            />
                                            <input 
                                                type="time" 
                                                className="flex-1 bg-gray-100 border-none rounded-lg p-2 sm:p-3 text-xs sm:text-xs font-bold [&::-webkit-datetime-edit]:text-xs sm:[&::-webkit-datetime-edit]:text-xs"
                                                value={formData.time}
                                                onChange={e => setFormData({...formData, time: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2">Car Type</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <div 
                                                onClick={() => setOpenDropdown(openDropdown === 'car' ? null : 'car')}
                                                className="w-full bg-gray-100 rounded-lg p-3 text-xs font-bold cursor-pointer flex justify-between items-center"
                                            >
                                                <span>{formData.carType}</span>
                                                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'car' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                            {openDropdown === 'car' && (
                                                <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                                    {['Manual', 'Automatic'].map(option => (
                                                        <div 
                                                            key={option}
                                                            onClick={() => { setFormData({...formData, carType: option}); setOpenDropdown(null); }}
                                                            className={`p-3 text-xs font-bold cursor-pointer hover:bg-gray-50 ${formData.carType === option ? 'bg-gray-100' : ''}`}
                                                        >
                                                            {option}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="relative flex-1">
                                            <div 
                                                onClick={() => setOpenDropdown(openDropdown === 'vehicle' ? null : 'vehicle')}
                                                className="w-full bg-gray-100 rounded-lg p-3 text-xs font-bold cursor-pointer flex justify-between items-center"
                                            >
                                                <span>{formData.vehicleType}</span>
                                                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'vehicle' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                            {openDropdown === 'vehicle' && (
                                                <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                                    {['Hatchback', 'Sedan', 'SUV'].map(option => (
                                                        <div 
                                                            key={option}
                                                            onClick={() => { setFormData({...formData, vehicleType: option}); setOpenDropdown(null); }}
                                                            className={`p-3 text-xs font-bold cursor-pointer hover:bg-gray-50 ${formData.vehicleType === option ? 'bg-gray-100' : ''}`}
                                                        >
                                                            {option}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        {bookingType === BookingType.OUTSTATION && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2">Select Trip Type and Estimated Usage</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <div 
                                                onClick={() => setOpenDropdown(openDropdown === 'tripType' ? null : 'tripType')}
                                                className="w-full bg-gray-100 rounded-lg p-3 text-xs font-bold cursor-pointer flex justify-between items-center"
                                            >
                                                <span>{formData.tripType}</span>
                                                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'tripType' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                            {openDropdown === 'tripType' && (
                                                <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                                    {['Round Trip', 'One Way'].map(option => (
                                                        <div 
                                                            key={option}
                                                            onClick={() => { setFormData({...formData, tripType: option}); setOpenDropdown(null); }}
                                                            className={`p-3 text-xs font-bold cursor-pointer hover:bg-gray-50 ${formData.tripType === option ? 'bg-gray-100' : ''}`}
                                                        >
                                                            {option}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="relative flex-1">
                                            <div 
                                                onClick={() => setOpenDropdown(openDropdown === 'usage' ? null : 'usage')}
                                                className="w-full bg-gray-100 rounded-lg p-3 text-xs font-bold cursor-pointer flex justify-between items-center"
                                            >
                                                <span>{formData.estimatedUsage}</span>
                                                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'usage' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                            {openDropdown === 'usage' && (
                                                <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                                    {['12 Hrs', '24 Hrs', '2 Days', '3 Days'].map(option => (
                                                        <div 
                                                            key={option}
                                                            onClick={() => { setFormData({...formData, estimatedUsage: option}); setOpenDropdown(null); }}
                                                            className={`p-3 text-xs font-bold cursor-pointer hover:bg-gray-50 ${formData.estimatedUsage === option ? 'bg-gray-100' : ''}`}
                                                        >
                                                            {option}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2">Date & Time</label>
                                    <div className="flex gap-2 sm:gap-3">
                                        <input 
                                            type="date" 
                                            className="flex-1 bg-gray-100 border-none rounded-lg p-2 sm:p-3 text-xs sm:text-xs font-bold [&::-webkit-datetime-edit]:text-xs sm:[&::-webkit-datetime-edit]:text-xs"
                                            value={formData.date}
                                            onChange={e => setFormData({...formData, date: e.target.value})}
                                        />
                                        <input 
                                            type="time" 
                                            className="flex-1 bg-gray-100 border-none rounded-lg p-2 sm:p-3 text-xs sm:text-xs font-bold [&::-webkit-datetime-edit]:text-xs sm:[&::-webkit-datetime-edit]:text-xs"
                                            value={formData.time}
                                            onChange={e => setFormData({...formData, time: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2">Car Type</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <div 
                                                onClick={() => setOpenDropdown(openDropdown === 'car' ? null : 'car')}
                                                className="w-full bg-gray-100 rounded-lg p-3 text-xs font-bold cursor-pointer flex justify-between items-center"
                                            >
                                                <span>{formData.carType}</span>
                                                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'car' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                            {openDropdown === 'car' && (
                                                <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                                    {['Manual', 'Automatic'].map(option => (
                                                        <div 
                                                            key={option}
                                                            onClick={() => { setFormData({...formData, carType: option}); setOpenDropdown(null); }}
                                                            className={`p-3 text-xs font-bold cursor-pointer hover:bg-gray-50 ${formData.carType === option ? 'bg-gray-100' : ''}`}
                                                        >
                                                            {option}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="relative flex-1">
                                            <div 
                                                onClick={() => setOpenDropdown(openDropdown === 'vehicle' ? null : 'vehicle')}
                                                className="w-full bg-gray-100 rounded-lg p-3 text-xs font-bold cursor-pointer flex justify-between items-center"
                                            >
                                                <span>{formData.vehicleType}</span>
                                                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'vehicle' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                            {openDropdown === 'vehicle' && (
                                                <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                                    {['Hatchback', 'Sedan', 'SUV'].map(option => (
                                                        <div 
                                                            key={option}
                                                            onClick={() => { setFormData({...formData, vehicleType: option}); setOpenDropdown(null); }}
                                                            className={`p-3 text-xs font-bold cursor-pointer hover:bg-gray-50 ${formData.vehicleType === option ? 'bg-gray-100' : ''}`}
                                                        >
                                                            {option}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        {bookingType === BookingType.LOCAL_HOURLY && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2">Select Trip Type and Estimated Usage</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <div 
                                                onClick={() => setOpenDropdown(openDropdown === 'tripType' ? null : 'tripType')}
                                                className="w-full bg-gray-100 rounded-lg p-3 text-xs font-bold cursor-pointer flex justify-between items-center"
                                            >
                                                <span>{formData.tripType}</span>
                                                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'tripType' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                            {openDropdown === 'tripType' && (
                                                <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                                    {['Round Trip', 'One Way'].map(option => (
                                                        <div 
                                                            key={option}
                                                            onClick={() => { setFormData({...formData, tripType: option}); setOpenDropdown(null); }}
                                                            className={`p-3 text-xs font-bold cursor-pointer hover:bg-gray-50 ${formData.tripType === option ? 'bg-gray-100' : ''}`}
                                                        >
                                                            {option}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="relative flex-1">
                                            <div 
                                                onClick={() => setOpenDropdown(openDropdown === 'usage' ? null : 'usage')}
                                                className="w-full bg-gray-100 rounded-lg p-3 text-xs font-bold cursor-pointer flex justify-between items-center"
                                            >
                                                <span>{formData.estimatedUsage}</span>
                                                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'usage' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                            {openDropdown === 'usage' && (
                                                <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                                    {['12 Hrs', '24 Hrs', '2 Days', '3 Days'].map(option => (
                                                        <div 
                                                            key={option}
                                                            onClick={() => { setFormData({...formData, estimatedUsage: option}); setOpenDropdown(null); }}
                                                            className={`p-3 text-xs font-bold cursor-pointer hover:bg-gray-50 ${formData.estimatedUsage === option ? 'bg-gray-100' : ''}`}
                                                        >
                                                            {option}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2">Date & Time</label>
                                    <div className="flex gap-2 sm:gap-3">
                                        <input 
                                            type="date" 
                                            className="flex-1 bg-gray-100 border-none rounded-lg p-2 sm:p-3 text-xs sm:text-xs font-bold [&::-webkit-datetime-edit]:text-xs sm:[&::-webkit-datetime-edit]:text-xs"
                                            value={formData.date}
                                            onChange={e => setFormData({...formData, date: e.target.value})}
                                        />
                                        <input 
                                            type="time" 
                                            className="flex-1 bg-gray-100 border-none rounded-lg p-2 sm:p-3 text-xs sm:text-xs font-bold [&::-webkit-datetime-edit]:text-xs sm:[&::-webkit-datetime-edit]:text-xs"
                                            value={formData.time}
                                            onChange={e => setFormData({...formData, time: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2">Car Type</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <div 
                                                onClick={() => setOpenDropdown(openDropdown === 'car' ? null : 'car')}
                                                className="w-full bg-gray-100 rounded-lg p-3 text-xs font-bold cursor-pointer flex justify-between items-center"
                                            >
                                                <span>{formData.carType}</span>
                                                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'car' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                            {openDropdown === 'car' && (
                                                <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                                    {['Manual', 'Automatic'].map(option => (
                                                        <div 
                                                            key={option}
                                                            onClick={() => { setFormData({...formData, carType: option}); setOpenDropdown(null); }}
                                                            className={`p-3 text-xs font-bold cursor-pointer hover:bg-gray-50 ${formData.carType === option ? 'bg-gray-100' : ''}`}
                                                        >
                                                            {option}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="relative flex-1">
                                            <div 
                                                onClick={() => setOpenDropdown(openDropdown === 'vehicle' ? null : 'vehicle')}
                                                className="w-full bg-gray-100 rounded-lg p-3 text-xs font-bold cursor-pointer flex justify-between items-center"
                                            >
                                                <span>{formData.vehicleType}</span>
                                                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'vehicle' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                            {openDropdown === 'vehicle' && (
                                                <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                                    {['Hatchback', 'Sedan', 'SUV'].map(option => (
                                                        <div 
                                                            key={option}
                                                            onClick={() => { setFormData({...formData, vehicleType: option}); setOpenDropdown(null); }}
                                                            className={`p-3 text-xs font-bold cursor-pointer hover:bg-gray-50 ${formData.vehicleType === option ? 'bg-gray-100' : ''}`}
                                                        >
                                                            {option}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        {bookingType !== BookingType.ONEWAY && bookingType !== BookingType.OUTSTATION && bookingType !== BookingType.LOCAL_HOURLY && (
                            <>
                                <div className="relative">
                                    <label className="block text-xs font-bold text-gray-500 mb-2">When is driver needed?</label>
                                    <div 
                                        onClick={() => setOpenDropdown(openDropdown === 'when' ? null : 'when')}
                                        className="w-full bg-gray-100 rounded-lg p-3 text-xs font-bold cursor-pointer flex justify-between items-center"
                                    >
                                        <span>{formData.whenNeeded}</span>
                                        <svg className={`w-4 h-4 transition-transform ${openDropdown === 'when' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                    {openDropdown === 'when' && (
                                        <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                            {['Now', 'Schedule Later'].map(option => (
                                                <div 
                                                    key={option}
                                                    onClick={() => { setFormData({...formData, whenNeeded: option}); setOpenDropdown(null); }}
                                                    className={`p-3 text-xs font-bold cursor-pointer hover:bg-gray-50 ${formData.whenNeeded === option ? 'bg-gray-100' : ''}`}
                                                >
                                                    {option}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {formData.whenNeeded === 'Schedule Later' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2">Date & Time</label>
                                        <div className="flex gap-2 sm:gap-3">
                                            <input 
                                                type="date" 
                                                className="flex-1 bg-gray-100 border-none rounded-lg p-2 sm:p-3 text-xs sm:text-xs font-bold [&::-webkit-datetime-edit]:text-xs sm:[&::-webkit-datetime-edit]:text-xs"
                                                value={formData.date}
                                                onChange={e => setFormData({...formData, date: e.target.value})}
                                            />
                                            <input 
                                                type="time" 
                                                className="flex-1 bg-gray-100 border-none rounded-lg p-2 sm:p-3 text-xs sm:text-xs font-bold [&::-webkit-datetime-edit]:text-xs sm:[&::-webkit-datetime-edit]:text-xs"
                                                value={formData.time}
                                                onChange={e => setFormData({...formData, time: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2">Car Type</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <div 
                                                onClick={() => setOpenDropdown(openDropdown === 'car' ? null : 'car')}
                                                className="w-full bg-gray-100 rounded-lg p-3 text-xs font-bold cursor-pointer flex justify-between items-center"
                                            >
                                                <span>{formData.carType}</span>
                                                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'car' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                            {openDropdown === 'car' && (
                                                <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                                    {['Manual', 'Automatic'].map(option => (
                                                        <div 
                                                            key={option}
                                                            onClick={() => { setFormData({...formData, carType: option}); setOpenDropdown(null); }}
                                                            className={`p-3 text-xs font-bold cursor-pointer hover:bg-gray-50 ${formData.carType === option ? 'bg-gray-100' : ''}`}
                                                        >
                                                            {option}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="relative flex-1">
                                            <div 
                                                onClick={() => setOpenDropdown(openDropdown === 'vehicle' ? null : 'vehicle')}
                                                className="w-full bg-gray-100 rounded-lg p-3 text-xs font-bold cursor-pointer flex justify-between items-center"
                                            >
                                                <span>{formData.vehicleType}</span>
                                                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'vehicle' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                            {openDropdown === 'vehicle' && (
                                                <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                                    {['Hatchback', 'Sedan', 'SUV'].map(option => (
                                                        <div 
                                                            key={option}
                                                            onClick={() => { setFormData({...formData, vehicleType: option}); setOpenDropdown(null); }}
                                                            className={`p-3 text-xs font-bold cursor-pointer hover:bg-gray-50 ${formData.vehicleType === option ? 'bg-gray-100' : ''}`}
                                                        >
                                                            {option}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Fare Estimate - Only show when both locations are filled */}
                    {formData.pickup && formData.drop && (
                        <div className="mx-4 mb-4 text-center py-3 bg-gray-50 rounded-lg">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Fare Estimate</p>
                            <p className="text-2xl font-bold text-black mb-1">₹349</p>
                            <p className="text-xs text-gray-500">This is just an estimate</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-white">
                    <button 
                        onClick={handleBookingSubmit}
                        className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-900 transition shadow-lg"
                    >
                        Request Driver
                    </button>
                </div>
              </>
          )}

          {activeTab === 'TRIPS' && (
              <div className="flex-grow overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar space-y-4">
                 <h3 className="text-lg font-bold">Your Trips</h3>
                 {myTrips.length === 0 ? (
                    <p className="text-gray-500">No trips booked yet.</p>
                 ) : (
                    myTrips
                    .sort((a, b) => `${b.startDate}T${b.startTime}`.localeCompare(`${a.startDate}T${a.startTime}`))
                    .map(trip => (
                        <div key={trip.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="font-bold text-lg">{trip.startTime}, {trip.startDate}</span>
                                    {trip.estimatedCost > 0 && (
                                        <p className="text-sm font-bold text-green-600 mt-1">₹{trip.estimatedCost}</p>
                                    )}
                                </div>
                                <span className={`text-xs px-2 py-1 rounded font-bold ${trip.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{trip.status}</span>
                             </div>
                             <p className="text-sm font-medium mb-1">{trip.type}</p>
                             <div className="text-xs text-gray-500 flex flex-col gap-1">
                                <span>From: {trip.pickupLocation}</span>
                                <span>To: {trip.dropLocation}</span>
                             </div>
                             {/* Rating UI for Completed Trips */}
                             {trip.status === 'COMPLETED' && (
                                 <div className="mt-3 pt-3 border-t border-gray-100">
                                     {trip.rating ? (
                                         <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                                             <span>Your Rating:</span>
                                             <span>{'★'.repeat(trip.rating)}</span>
                                         </div>
                                     ) : (
                                         <div>
                                             <p className="text-xs font-bold mb-2">Rate your driver:</p>
                                             <div className="flex gap-2">
                                                 {[1, 2, 3, 4, 5].map(star => (
                                                     <button 
                                                        key={star}
                                                        onClick={() => handleRating(trip.id, star)}
                                                        className="w-8 h-8 rounded-full bg-gray-50 hover:bg-yellow-50 text-gray-300 hover:text-yellow-500 font-bold border border-gray-200 flex items-center justify-center transition"
                                                     >
                                                         ★
                                                     </button>
                                                 ))}
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             )}
                        </div>
                    ))
                 )}
              </div>
          )}

          {activeTab === 'PROFILE' && (
              <div className="flex-grow overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar">
                 {!isEditingProfile ? (
                     <div className="space-y-6">
                        <div className="flex justify-between items-start">
                             <div className="flex items-center gap-3 sm:gap-4">
                                 <div className="w-14 h-14 sm:w-16 sm:h-16 bg-black text-white rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold">
                                     {customer.name[0]}
                                 </div>
                                 <div>
                                     <h3 className="text-lg sm:text-xl font-bold">{customer.name}</h3>
                                     <p className="text-xs sm:text-sm text-gray-500">{customer.phone}</p>
                                     {customer.email && <p className="text-xs text-gray-400">{customer.email}</p>}
                                 </div>
                             </div>
                             <button 
                                onClick={() => setIsEditingProfile(true)}
                                className="text-xs font-bold text-black border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                             >
                                 Edit
                             </button>
                        </div>

                        {/* Address Section */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="text-xs text-gray-400 font-bold uppercase mb-2">Address</h4>
                            <p className="text-sm font-medium">{customer.address || 'No address added'}</p>
                        </div>

                         {/* <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                             <div className="flex justify-between items-center mb-4">
                                 <span className="text-sm font-bold text-gray-600">Advance Payment</span>
                                 <span className="text-2xl font-bold">₹{customer.advancePaymentBalance}</span>
                             </div>
                             <button className="w-full bg-black text-white py-2 rounded-lg text-sm font-bold">Add Money</button>
                         </div> */}

                         <div className="space-y-2">
                             <h4 className="font-bold text-sm">ID Proof</h4>
                             <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 cursor-pointer">
                                 {customer.addressProofUrl ? (
                                     <div className="text-green-600 font-bold text-sm flex flex-col items-center gap-2">
                                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                         ID Proof Uploaded
                                     </div>
                                 ) : (
                                     <div className="text-gray-500 text-sm">
                                         <p className="font-bold mb-1">Upload ID Proof</p>
                                         <p className="text-xs">Aadhar / Voter ID / Passport</p>
                                     </div>
                                 )}
                             </div>
                         </div>
                     </div>
                 ) : (
                     <form onSubmit={handleProfileUpdate} className="space-y-4">
                         <h3 className="text-lg font-bold mb-4">Edit Profile</h3>
                         
                         <div>
                             <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Full Name</label>
                             <input 
                                 type="text"
                                 className="w-full bg-gray-100 border-none rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-black"
                                 value={editProfileData.name}
                                 onChange={(e) => setEditProfileData({...editProfileData, name: e.target.value})}
                                 required
                             />
                         </div>

                         <div>
                             <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Email Address</label>
                             <input 
                                 type="email"
                                 className="w-full bg-gray-100 border-none rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-black"
                                 value={editProfileData.email}
                                 onChange={(e) => setEditProfileData({...editProfileData, email: e.target.value})}
                                 placeholder="name@example.com"
                             />
                         </div>

                         <div>
                             <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Mobile Number</label>
                             <input 
                                 type="tel"
                                 className="w-full bg-gray-100 border-none rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-black"
                                 value={editProfileData.phone}
                                 onChange={(e) => setEditProfileData({...editProfileData, phone: e.target.value})}
                                 required
                             />
                         </div>

                         <div>
                             <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Address</label>
                             <textarea 
                                 className="w-full bg-gray-100 border-none rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-black resize-none"
                                 rows={3}
                                 value={editProfileData.address}
                                 onChange={(e) => setEditProfileData({...editProfileData, address: e.target.value})}
                                 placeholder="#123, Street Name, City"
                             />
                         </div>

                         <div>
                             <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">ID Proof</label>
                             <button 
                                 type="button"
                                 className="w-full bg-gray-100 border-none rounded-lg p-3 text-sm font-medium hover:bg-gray-200 transition"
                             >
                                 Upload ID Proof
                             </button>
                         </div>

                         <div className="flex gap-3 pt-4">
                             <button 
                                type="button" 
                                onClick={() => setIsEditingProfile(false)}
                                className="flex-1 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg"
                             >
                                 Cancel
                             </button>
                             <button 
                                type="submit" 
                                className="flex-1 bg-black text-white py-3 rounded-lg text-sm font-bold hover:bg-gray-800"
                             >
                                 Save Changes
                             </button>
                         </div>
                     </form>
                 )}
              </div>
          )}
      </div>
    </div>
  );
};

export default CustomerPortal;
