
import React, { useState, useEffect } from 'react';
import { Customer, BookingType, Trip } from '../../types';
import { store } from '../../services/mockStore';
import { getRecommendedPackage } from '../../services/geminiService';
import { updateCustomerProfile } from '../../api/customer';
import { uploadFile } from '../../api/upload';
import { createBooking, getFareEstimate, getCustomerBookings } from '../../api/booking';
import { checkAuth } from '../../api/auth';
import { toast } from 'react-toastify';
import LocationAutocomplete from '../../components/LocationAutocomplete';
import RouteMap from '../../components/RouteMap';

interface CustomerPortalProps {
  customer: Customer;
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({ customer: initialCustomer }) => {
  const [activeTab, setActiveTab] = useState<'BOOK' | 'TRIPS' | 'PROFILE'>('BOOK');
  const [customer, setCustomer] = useState<Customer>(initialCustomer);
  const [myTrips, setMyTrips] = useState<any[]>([]);
  const [bookingType, setBookingType] = useState<BookingType>(BookingType.ONEWAY);
  const [serviceType, setServiceType] = useState<BookingType>(BookingType.LOCAL_HOURLY);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [authChecking, setAuthChecking] = useState<boolean>(false);
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
  const [estimate, setEstimate] = useState<number | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);

  // Profile Edit States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    name: initialCustomer.name,
    email: initialCustomer.email,
    phone: initialCustomer.phone,
    address: initialCustomer.address || '',
    idProof: initialCustomer.idProof || null
  });

  // Registration Modal State
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    address: '',
    idProof: null as string | null
  });

  const checkAuthStatus = async () => {
    setAuthChecking(true);
    try {
      const authStatus = await checkAuth();
      setIsAuthenticated(authStatus.authenticated);
      if (!authStatus.authenticated) {
        toast.warning('Please log in to access all features');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setAuthChecking(false);
    }
  };

  const fetchBookings = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await getCustomerBookings();
      if (response.success) {
        setMyTrips(response.bookings);
      } else if (response.error === 'User not logged in') {
        setIsAuthenticated(false);
        toast.warning('Please log in to view your trips');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  useEffect(() => {
      console.log('Customer data:', initialCustomer); // Debug log
      setCustomer(initialCustomer);
      setEditProfileData({
        name: initialCustomer.name,
        email: initialCustomer.email,
        phone: initialCustomer.phone,
        address: initialCustomer.address || ''
      });
      
      // Check authentication status
      checkAuthStatus();
      
      // Fetch real bookings
      fetchBookings();
      
      // Show registration modal if customer has incomplete profile
      const hasEmail = initialCustomer.email && initialCustomer.email.trim() !== '';
      const hasAddress = initialCustomer.address && initialCustomer.address.trim() !== '';
      const hasIdProof = initialCustomer.idProof && initialCustomer.idProof.trim() !== '';
      
      console.log('Profile check:', { hasEmail, hasAddress, hasIdProof }); // Debug log
      
      if (!hasEmail || !hasAddress || !hasIdProof) {
        setShowRegistrationModal(true);
        setRegistrationData({
          name: initialCustomer.name,
          email: initialCustomer.email || '',
          address: initialCustomer.address || '',
          idProof: initialCustomer.idProof || null
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
     if(!formData.pickup || !formData.drop || !formData.vehicleType) return;

     // Check authentication before making API call
     if (!isAuthenticated) {
       toast.warning('Please log in to get fare estimates');
       return;
     }

     console.log('Triggering estimate with:', { pickup: formData.pickup, drop: formData.drop, vehicleType: formData.vehicleType });
     
     setEstimateLoading(true);
     try {
       const response = await getFareEstimate(
         formData.pickup, 
         formData.drop, 
         formData.vehicleType
       );
       
       if (response.success) {
         setEstimate(response.estimate);
       } else {
         console.error('Estimate error:', response.error);
         if (response.error === 'User not logged in') {
           setIsAuthenticated(false);
           toast.error('Please log in to get fare estimates');
         } else {
          //  toast.error(response.error || 'Failed to calculate estimate');
         }
         setEstimate(null);
       }
     } catch (error) {
       console.error('Error getting estimate:', error);
       toast.error('Failed to calculate estimate');
       setEstimate(null);
     } finally {
       setEstimateLoading(false);
     }
  };

  const handleEstimateWithValues = async (pickup: string, drop: string, vehicleType: string) => {
     if(!pickup || !drop || !vehicleType) return;

     // Check authentication before making API call
     if (!isAuthenticated) {
       toast.warning('Please log in to get fare estimates');
       return;
     }

     console.log('Triggering estimate with values:', { pickup, drop, vehicleType });
     
     setEstimateLoading(true);
     try {
       const response = await getFareEstimate(pickup, drop, vehicleType);
       
       if (response.success) {
         setEstimate(response.estimate);
       } else {
         console.error('Estimate error:', response.error);
         if (response.error === 'User not logged in') {
           setIsAuthenticated(false);
           toast.error('Please log in to get fare estimates');
         } else {
          //  toast.error(response.error || 'Failed to calculate estimate');
         }
         setEstimate(null);
       }
     } catch (error) {
       console.error('Error getting estimate:', error);
      //  toast.error('Failed to calculate estimate');
       setEstimate(null);
     } finally {
       setEstimateLoading(false);
     }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authentication first
    if (!isAuthenticated) {
      toast.error('Please log in to book a ride');
      return;
    }
    
    if (!formData.pickup || !formData.drop) {
      toast.error('Please enter pickup and drop locations');
      return;
    }

    // Validate that locations are filled
    if (!formData.pickup.includes(',') || !formData.drop.includes(',')) {
      toast.error('Please select complete addresses from the suggestions');
      return;
    }

    try {
      const bookingData = {
        pickupLocation: formData.pickup,
        dropLocation: formData.drop,
        bookingType: bookingType,
        serviceType: serviceType,
        startDateTime: formData.date && formData.time ? 
          `${formData.date}T${formData.time}` : new Date().toISOString(),
        duration: formData.duration || formData.estimatedUsage,
        carType: formData.carType,
        vehicleType: formData.vehicleType,
        estimateAmount: estimate
      };

      const response = await createBooking(bookingData);
      
      if (response.success) {
        toast.success(response.message || 'Request sent to drivers!');
        // Reset form
        setFormData({
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
        setEstimate(null);
        // Refresh bookings
        fetchBookings();
        setActiveTab('TRIPS');
      } else {
        if (response.error === 'User not logged in') {
          setIsAuthenticated(false);
          toast.error('Please log in to book a ride');
        } else {
          // toast.error(response.error || 'Failed to send request');
        }
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Error sending request. Please try again.');
    }
  };

  const handleRating = (tripId: string, rating: number) => {
      store.rateTrip(tripId, rating);
      setMyTrips(store.getTripsForCustomer(customer.id)); // Refresh
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const response = await updateCustomerProfile({
          name: editProfileData.name,
          email: editProfileData.email,
          address: editProfileData.address,
          idProof: editProfileData.idProof
        });
        
        if (response.success) {
          const updatedCustomer = { 
            ...customer, 
            name: editProfileData.name, 
            email: editProfileData.email,
            phone: editProfileData.phone,
            address: editProfileData.address,
            idProof: editProfileData.idProof
          };
          setCustomer(updatedCustomer);
          setIsEditingProfile(false);
          toast.success("Profile updated successfully!");
        } else {
          alert(response.error || 'Failed to update profile');
        }
      } catch (error) {
        alert('Error updating profile. Please try again.');
      }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const response = await updateCustomerProfile({
          name: registrationData.name,
          email: registrationData.email,
          address: registrationData.address,
          idProof: registrationData.idProof
        });
        
        if (response.success) {
          const updatedCustomer = { 
            ...customer, 
            name: registrationData.name,
            email: registrationData.email,
            address: registrationData.address,
            idProof: registrationData.idProof
          };
          setCustomer(updatedCustomer);
          setShowRegistrationModal(false);
          toast.success("Registration completed successfully!");
        } else {
          alert(response.error || 'Failed to update profile');
        }
      } catch (error) {
        alert('Error updating profile. Please try again.');
      }
  };

  const handleSkipRegistration = () => {
      setShowRegistrationModal(false);
  };

  return (
    <div className="relative h-[calc(100vh-64px)] overflow-hidden bg-gray-100">
      {/* Background Map Image or Route Map */}
      {formData.pickup && formData.drop && formData.pickup.includes(',') && formData.drop.includes(',') ? (
        <RouteMap 
          pickup={formData.pickup}
          drop={formData.drop}
          apiKey="AIzaSyAfUP27GUuOL0cBm_ROdjE2n6EyVKesIu8"
        />
      ) : (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-80"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop")' }}
        ></div>
      )}
      
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
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  className="w-full bg-gray-100 border-none rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const uploadResponse = await uploadFile(file);
                      if (uploadResponse.success) {
                        setRegistrationData({...registrationData, idProof: uploadResponse.fileId});
                        toast.success('File uploaded successfully!');
                      } else {
                        toast.error(uploadResponse.error || 'Failed to upload file');
                      }
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Aadhar / Voter ID / Passport (Max 5MB)</p>
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
              <h2 className="text-lg sm:text-xl font-bold">SNP</h2>
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
                                            <LocationAutocomplete
                                                value={formData.pickup}
                                                onChange={(value) => {
                                                    setFormData({...formData, pickup: value});
                                                    // Trigger estimate when both locations are filled
                                                    if (value && formData.drop && formData.vehicleType) {
                                                        setTimeout(handleEstimate, 500);
                                                    }
                                                }}
                                                placeholder="Pickup location"
                                                className="w-full bg-gray-100 border-none rounded-lg py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-black placeholder-gray-500"
                                            />
                            <LocationAutocomplete
                                value={formData.drop}
                                onChange={(value) => {
                                    console.log('Drop location selected:', value);
                                    setFormData({...formData, drop: value});
                                    // Trigger estimate when both locations are filled
                                    if (value && formData.pickup && formData.vehicleType) {
                                        setTimeout(() => {
                                            // Call estimate with updated values directly
                                            handleEstimateWithValues(formData.pickup, value, formData.vehicleType);
                                        }, 500);
                                    }
                                }}
                                placeholder="Drop location"
                                className="w-full bg-gray-100 border-none rounded-lg py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-black placeholder-gray-500"
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
                    {/* Choose Service Dropdown */}
                    <div className="relative mb-4">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Choose Service</label>
                        <div 
                            onClick={() => setOpenDropdown(openDropdown === 'service' ? null : 'service')}
                            className="w-full bg-gray-100 rounded-lg p-3 text-sm font-bold cursor-pointer flex justify-between items-center"
                        >
                            <span>{bookingType}</span>
                            <svg className={`w-4 h-4 transition-transform ${openDropdown === 'service' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                        {openDropdown === 'service' && (
                            <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden max-h-64 overflow-y-auto">
                                {[
                                    BookingType.ONEWAY,
                                    BookingType.TWOWAY,
                                    BookingType.VALET,
                                    BookingType.DAILY,
                                    BookingType.WEEKLY,
                                    BookingType.TEMPORARY,
                                    BookingType.SPARE,
                                    BookingType.MONTHLY
                                ].map((type) => (
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

                    {/* Choose Type of Service Dropdown - Only show for One-way and Two-way trips */}
                    {(bookingType === BookingType.ONEWAY || bookingType === BookingType.TWOWAY) && (
                        <div className="relative">
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Choose type of service</label>
                            <div 
                                onClick={() => setOpenDropdown(openDropdown === 'serviceType' ? null : 'serviceType')}
                                className="w-full bg-gray-100 rounded-lg p-3 text-sm font-bold cursor-pointer flex justify-between items-center"
                            >
                                <span>{serviceType}</span>
                                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'serviceType' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                            {openDropdown === 'serviceType' && (
                                <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                    {[
                                        BookingType.LOCAL_HOURLY,
                                        BookingType.OUTSTATION
                                    ].map((type) => (
                                        <div 
                                            key={type}
                                            onClick={() => { setServiceType(type); setOpenDropdown(null); }}
                                            className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 ${serviceType === type ? 'bg-gray-100' : ''}`}
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
                    )}

                    <div className="mt-4 sm:mt-6 space-y-3 pb-24 sm:pb-6">
                        <h3 className="font-bold text-sm mb-2">Schedule Details</h3>
                        {serviceType === BookingType.OUTSTATION && (
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
                        {serviceType === BookingType.LOCAL_HOURLY && (
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
                        {(serviceType !== BookingType.LOCAL_HOURLY && serviceType !== BookingType.OUTSTATION) && (
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
                        {false && (
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

                    {/* Fare Estimate - Only show when estimate is available */}
                    {(estimate || estimateLoading) && (
                        <div className="mx-4 mb-4 text-center py-3 bg-gray-50 rounded-lg">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Fare Estimate</p>
                            {estimateLoading ? (
                                <p className="text-lg font-bold text-gray-500 mb-1">Calculating...</p>
                            ) : (
                                <p className="text-2xl font-bold text-black mb-1">₹{estimate}</p>
                            )}
                            <p className="text-xs text-gray-500">This is just an estimate</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-white">
                    {!isAuthenticated && (
                        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 text-yellow-800 text-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span className="font-medium">Please log in to book rides and get estimates</span>
                            </div>
                        </div>
                    )}
                    <button 
                        onClick={handleBookingSubmit}
                        disabled={!isAuthenticated || authChecking}
                        className={`w-full py-4 rounded-lg font-bold text-lg transition shadow-lg ${
                            !isAuthenticated || authChecking 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-black text-white hover:bg-gray-900'
                        }`}
                    >
                        {authChecking ? 'Checking...' : 'Request Driver'}
                    </button>
                </div>
              </>
          )}

          {activeTab === 'TRIPS' && (
              <div className="flex-grow overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar space-y-4">
                 <h3 className="text-lg font-bold">Your Trips</h3>
                 {!isAuthenticated ? (
                    <div className="text-center py-8">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                            <svg className="w-12 h-12 text-yellow-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <h4 className="text-lg font-bold text-yellow-800 mb-2">Login Required</h4>
                            <p className="text-yellow-700">Please log in to view your trip history</p>
                        </div>
                    </div>
                 ) : myTrips.length === 0 ? (
                    <p className="text-gray-500">No trips booked yet.</p>
                 ) : (
                    myTrips
                    .sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime())
                    .map(trip => {
                        const startDate = new Date(trip.startDateTime);
                        const formattedDate = startDate.toLocaleDateString('en-GB').replace(/\//g, '-');
                        const formattedTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        
                        return (
                        <div key={trip.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="font-bold text-lg">{formattedTime}, {formattedDate}</span>
                                    {trip.estimateAmount && (
                                        <p className="text-sm font-bold text-green-600 mt-1">₹{trip.estimateAmount}</p>
                                    )}
                                </div>
                                <span className={`text-xs px-2 py-1 rounded font-bold ${
                                    trip.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                                    trip.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                                    trip.status === 'ONGOING' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100'
                                }`}>{trip.status}</span>
                             </div>
                             <p className="text-sm font-medium mb-1">{trip.bookingType}</p>
                             <div className="text-xs text-gray-500 flex flex-col gap-1">
                                <span>From: {trip.pickupLocation}</span>
                                <span>To: {trip.dropLocation}</span>
                             </div>
                             
                             {/* Driver Details - Show when trip is confirmed/ongoing/completed */}
                             {trip.driver && (trip.status === 'CONFIRMED' || trip.status === 'ONGOING' || trip.status === 'COMPLETED') && (
                                 <div className="mt-3 pt-3 border-t border-gray-100">
                                     <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Driver Details</p>
                                     <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                                         <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold">
                                             {trip.driver.name[0]}
                                         </div>
                                         <div className="flex-grow">
                                             <p className="font-bold text-sm">{trip.driver.name}</p>
                                             <p className="text-xs text-gray-500">{trip.driver.phone}</p>
                                         </div>
                                         <a 
                                             href={`tel:${trip.driver.phone}`}
                                             className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition"
                                         >
                                             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                         </a>
                                     </div>
                                 </div>
                             )}
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
                        );
                    })
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
                                 {customer.idProof ? (
                                     <div className="text-green-600 font-bold text-sm flex flex-col items-center gap-2">
                                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                         <span>ID Proof Uploaded</span>
                                         <button 
                                             onClick={() => window.open(`http://localhost:5000/uploads/${customer.idProof}`, '_blank')}
                                             className="mt-2 px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700"
                                         >
                                             View Document
                                         </button>
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
                             {customer.idProof ? (
                                 <div className="space-y-2">
                                     <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                         <div className="flex items-center gap-2">
                                             <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                             <span className="text-sm font-medium text-green-800">ID Proof Uploaded</span>
                                         </div>
                                         <button 
                                             type="button"
                                             onClick={() => {
                                                 if (confirm('Replace existing ID proof?')) {
                                                     document.getElementById('idProofInput')?.click();
                                                 }
                                             }}
                                             className="text-xs font-bold text-green-600 hover:text-green-800"
                                         >
                                             Replace
                                         </button>
                                     </div>
                                     <input 
                                         id="idProofInput"
                                         type="file"
                                         accept="image/*,.pdf,.doc,.docx,.txt"
                                         className="hidden"
                                         onChange={async (e) => {
                                             const file = e.target.files?.[0];
                                             if (file) {
                                                 const uploadResponse = await uploadFile(file);
                                                 if (uploadResponse.success) {
                                                     setEditProfileData({...editProfileData, idProof: uploadResponse.fileId});
                                                     toast.success('New ID proof uploaded successfully!');
                                                 } else {
                                                     toast.error(uploadResponse.error || 'Failed to upload file');
                                                 }
                                             }
                                         }}
                                     />
                                 </div>
                             ) : (
                                 <input 
                                     type="file"
                                     accept="image/*,.pdf,.doc,.docx,.txt"
                                     className="w-full bg-gray-100 border-none rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
                                     onChange={async (e) => {
                                         const file = e.target.files?.[0];
                                         if (file) {
                                             const uploadResponse = await uploadFile(file);
                                             if (uploadResponse.success) {
                                                 setEditProfileData({...editProfileData, idProof: uploadResponse.fileId});
                                                 toast.success('ID proof uploaded successfully!');
                                             } else {
                                                 toast.error(uploadResponse.error || 'Failed to upload file');
                                             }
                                         }
                                     }}
                                 />
                             )}
                             <p className="text-xs text-gray-500 mt-1">Aadhar / Voter ID / Passport (Max 5MB)</p>
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
