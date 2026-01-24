
import React, { useState, useEffect } from 'react';
import { Customer, BookingType, Trip } from '../../types';
import { getRecommendedPackage } from '../../services/geminiService';
import { updateCustomerProfile } from '../../api/customer';
import { uploadFile } from '../../api/upload';
import { createBooking, getFareEstimate, getCustomerBookings } from '../../api/booking';
import { API_BASE_URL } from '../../api/config.js';
import { checkAuth } from '../../api/auth';
import { toast } from 'react-toastify';
import LocationAutocomplete from '../../components/LocationAutocomplete';
import RouteMap from '../../components/RouteMap';
import CustomerBookingStatus from './CustomerBookingStatus';
import { calculateFare, parseDurationToHours, FareBreakdown } from '../../utils/fareCalculator';

interface CustomerPortalProps {
  customer: Customer;
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({ customer: initialCustomer }) => {
  const [activeTab, setActiveTab] = useState<'BOOK' | 'TRIPS' | 'PROFILE'>('BOOK');
  const [customer, setCustomer] = useState<Customer>(initialCustomer);
  const [myTrips, setMyTrips] = useState<any[]>([]);
  const [bookingType, setBookingType] = useState<BookingType>(BookingType.ACTING);
  const [serviceType, setServiceType] = useState<BookingType>(BookingType.LOCAL_HOURLY);
  const [showDriverProfile, setShowDriverProfile] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  
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
    whenNeeded: 'Immediately',
    carType: 'Manual',
    vehicleType: 'Hatchback',
    tripType: 'One Way',
    estimatedUsage: '1 Hr',
  });
  const [estimate, setEstimate] = useState<number | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [fareBreakdown, setFareBreakdown] = useState<FareBreakdown | null>(null);

  // Get minimum time (15 minutes from now)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    return {
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5)
    };
  };

  // Generate time slots starting from 15 minutes from now
  const getTimeSlots = () => {
    const slots = [];
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    
    // Round to next 15-minute interval
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    now.setMinutes(roundedMinutes);
    now.setSeconds(0);
    
    // Generate slots for next 12 hours (48 slots of 15 min each)
    for (let i = 0; i < 48; i++) {
      const time = new Date(now.getTime() + i * 15 * 60000);
      const hours = time.getHours();
      const mins = time.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMins = mins.toString().padStart(2, '0');
      const timeValue = `${hours.toString().padStart(2, '0')}:${displayMins}`;
      
      slots.push({
        value: timeValue,
        label: `${displayHours}:${displayMins} ${ampm}`
      });
    }
    
    return slots;
  };

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
     if(!formData.estimatedUsage) return;
     
     setEstimateLoading(true);
     try {
       const hours = parseDurationToHours(formData.estimatedUsage);
       const isOutstation = serviceType === BookingType.OUTSTATION;
       const breakdown = calculateFare(hours, 0, isOutstation);
       
       setFareBreakdown(breakdown);
       setEstimate(breakdown.totalFare);
     } catch (error) {
       console.error('Error calculating fare:', error);
       setEstimate(null);
       setFareBreakdown(null);
     } finally {
       setEstimateLoading(false);
     }
  };

  const handleEstimateWithValues = async (estimatedUsage: string) => {
     if(!estimatedUsage) return;
     
     setEstimateLoading(true);
     try {
       const hours = parseDurationToHours(estimatedUsage);
       const isOutstation = serviceType === BookingType.OUTSTATION;
       const breakdown = calculateFare(hours, 0, isOutstation);
       
       setFareBreakdown(breakdown);
       setEstimate(breakdown.totalFare);
     } catch (error) {
       console.error('Error calculating fare:', error);
       setEstimate(null);
       setFareBreakdown(null);
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
      toast.error('Please select complete loaction from the suggestions');
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
          whenNeeded: 'Immediately',
          carType: 'Manual',
          vehicleType: 'Hatchback',
          tripType: 'One Way',
          estimatedUsage: '1 Hr',
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
      // Rating functionality removed - using real API
      console.log('Rating:', tripId, rating);
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
      {showDriverProfile && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-black to-gray-800 p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl">
              <button onClick={() => setShowDriverProfile(false)} className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white hover:bg-white/20 rounded-full p-1.5 sm:p-2 transition">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="flex flex-col items-center text-white">
                {selectedDriver.documents?.photo ? (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-lg mb-2 sm:mb-3 overflow-hidden bg-white flex items-center justify-center p-1">
                    <img 
                      src={selectedDriver.documents.photo.startsWith('http') ? selectedDriver.documents.photo : `${API_BASE_URL}${selectedDriver.documents.photo}`} 
                      alt="Driver Photo" 
                      className="w-full h-full object-contain rounded-full" 
                      onError={(e) => {
                        e.currentTarget.parentElement.style.display = 'none';
                        e.currentTarget.parentElement.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  </div>
                ) : null}
                <div className={`w-20 h-20 sm:w-24 sm:h-24 bg-white text-gray-900 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-lg mb-2 sm:mb-3 ${selectedDriver.documents?.photo ? 'hidden' : ''}`}>
                  {selectedDriver.name?.[0] || 'D'}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold">{selectedDriver.name || 'Driver'}</h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {/* Contact Info */}
              <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Phone Number</p>
                    <a href={`tel:${selectedDriver.phone}`} className="text-sm sm:text-base font-bold text-gray-900 hover:text-blue-600 truncate block">{selectedDriver.phone || 'N/A'}</a>
                  </div>
                  <a href={`tel:${selectedDriver.phone}`} className="w-9 h-9 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition shadow-lg flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                  </a>
                </div>
                {selectedDriver.alternateMobile1 && (
                  <div className="flex items-center gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-gray-200">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Alternate Number</p>
                      <a href={`tel:${selectedDriver.alternateMobile1}`} className="text-sm sm:text-base font-bold text-gray-900 hover:text-blue-600 truncate block">{selectedDriver.alternateMobile1}</a>
                    </div>
                  </div>
                )}
              </div>

              {/* License Info */}
              {selectedDriver.licenseNo && (
                <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500 font-medium">License Number</p>
                      <p className="text-sm sm:text-base font-bold text-gray-900 truncate">{selectedDriver.licenseNo}</p>
                    </div>
                  </div>
                  {selectedDriver.documents?.dl && (
                    <img 
                      src={selectedDriver.documents.dl.startsWith('http') ? selectedDriver.documents.dl : `${API_BASE_URL}${selectedDriver.documents.dl}`} 
                      alt="Driver License" 
                      className="w-full h-32 sm:h-40 rounded-lg sm:rounded-xl object-contain bg-white border border-gray-200" 
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Background Map Image or Route Map */}
      {formData.pickup && formData.drop ? (
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleRegistrationSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="text-center mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-bold">Complete Your Profile</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Help us serve you better</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 sm:mb-2 uppercase">Full Name</label>
                <input 
                  type="text"
                  className="w-full bg-gray-100 border-none rounded-lg p-2.5 sm:p-3 text-sm font-medium focus:ring-2 focus:ring-black"
                  value={registrationData.name}
                  onChange={(e) => setRegistrationData({...registrationData, name: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 sm:mb-2 uppercase">Email Address</label>
                <input 
                  type="email"
                  className="w-full bg-gray-100 border-none rounded-lg p-2.5 sm:p-3 text-sm font-medium focus:ring-2 focus:ring-black"
                  value={registrationData.email}
                  onChange={(e) => setRegistrationData({...registrationData, email: e.target.value})}
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 sm:mb-2 uppercase">Address</label>
                <textarea 
                  className="w-full bg-gray-100 border-none rounded-lg p-2.5 sm:p-3 text-sm font-medium focus:ring-2 focus:ring-black resize-none"
                  rows={3}
                  value={registrationData.address}
                  onChange={(e) => setRegistrationData({...registrationData, address: e.target.value})}
                  placeholder="#123, Street Name, City"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 sm:mb-2 uppercase">ID Proof</label>
                <input 
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  className="w-full bg-gray-100 border-none rounded-lg p-2 sm:p-3 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-black file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
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
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Aadhar / Voter ID / Passport (Max 5MB)</p>
              </div>

              <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                <button 
                  type="button" 
                  onClick={handleSkipRegistration}
                  className="flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  Skip
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-black text-white py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-bold hover:bg-gray-800"
                >
                  Complete Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Floating Panel */}
      <div className={`absolute md:relative md:top-4 md:left-4 md:w-[380px] md:h-auto md:max-h-[calc(100vh-120px)] bg-white md:rounded-2xl shadow-floating flex flex-col z-10 overflow-hidden ${
        formData.pickup && formData.drop ? 'inset-x-0 bottom-0 h-auto max-h-[60vh] rounded-t-3xl' : 'inset-0'
      }`}>
          
          {/* Header & Tabs */}
          <div className="bg-white px-4 sm:px-6 pt-3 pb-2 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-bold">SNP</h2>
              <div className="flex gap-1.5 sm:gap-2 text-xs font-bold">
                  <button onClick={() => setActiveTab('BOOK')} className={`px-2.5 sm:px-3 py-1.5 rounded-full ${activeTab === 'BOOK' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>Book</button>
                  <button onClick={() => setActiveTab('TRIPS')} className={`px-2.5 sm:px-3 py-1.5 rounded-full ${activeTab === 'TRIPS' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>Trips</button>
                  <button onClick={() => setActiveTab('PROFILE')} className={`px-2.5 sm:px-3 py-1.5 rounded-full ${activeTab === 'PROFILE' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>Profile</button>
              </div>
          </div>

          {activeTab === 'BOOK' && (
              <>
                <div className="p-3 sm:p-4 pb-0">
                    {/* Location Inputs */}
                    <div className="relative mb-4">
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
                                                }}
                                                placeholder="Pickup location"
                                                className="w-full bg-gray-100 border-none rounded-lg py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-black placeholder-gray-500"
                                                showMyLocation={true}
                                                readOnly={true}
                                            />
                            <LocationAutocomplete
                                value={formData.drop}
                                onChange={(value) => {
                                    setFormData({...formData, drop: value});
                                }}
                                placeholder="Drop location"
                                className="w-full bg-gray-100 border-none rounded-lg py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-black placeholder-gray-500"
                                readOnly={true}
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

                <div className="flex-grow overflow-y-auto px-3 sm:px-4 pb-2 custom-scrollbar">
                    {/* Choose Service Dropdown */}
                    <div className="relative mb-3">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Choose Service</label>
                        <div 
                            onClick={() => setOpenDropdown(openDropdown === 'service' ? null : 'service')}
                            className="w-full bg-gray-100 rounded-lg p-2.5 text-sm font-bold cursor-pointer flex justify-between items-center"
                        >
                            <span>{bookingType}</span>
                            <svg className={`w-4 h-4 transition-transform ${openDropdown === 'service' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                        {openDropdown === 'service' && (
                            <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden max-h-64 overflow-y-auto">
                                {[
                                    BookingType.ACTING,
                                    BookingType.SPARE,
                                    BookingType.TEMPORARY,
                                    BookingType.VALET,
                                    BookingType.DAILY,
                                    BookingType.WEEKLY,
                                    BookingType.MONTHLY
                                ].map((type) => (
                                    <div 
                                        key={type}
                                        onClick={() => { setBookingType(type); setOpenDropdown(null); }}
                                        className={`flex items-center p-2.5 cursor-pointer hover:bg-gray-50 ${bookingType === type ? 'bg-gray-100' : ''}`}
                                    >
                                        <div className="w-8 h-8 bg-gray-200 rounded-md mr-2.5 flex items-center justify-center shrink-0">
                                            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a.75.75 0 01.75.75v.5a.75.75 0 01-.75.75H5a2 2 0 01-2-2V5a1 1 0 00-1-1z" /><path d="M11 16.5c0 .414.336.75.75.75h4.5a2 2 0 002-2V9.5a1 1 0 00-1-1h-2.5A2.5 2.5 0 0112.25 6H9.75a.75.75 0 00-.75.75v9c0 .414.336.75.75.75z" /></svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xs">{type}</h4>
                                            <p className="text-[10px] text-gray-500">Reliable & Verified</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Choose Type of Service Dropdown - Show for all services */}
                    <div className="relative mb-3">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Choose type of service</label>
                        <div 
                            onClick={() => setOpenDropdown(openDropdown === 'serviceType' ? null : 'serviceType')}
                            className="w-full bg-gray-100 rounded-lg p-2.5 text-sm font-bold cursor-pointer flex justify-between items-center"
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
                                        onClick={() => { 
                                            setServiceType(type); 
                                            setFormData({...formData, estimatedUsage: type === BookingType.LOCAL_HOURLY ? '1 Hr' : '4 Hrs'});
                                            setOpenDropdown(null); 
                                        }}
                                        className={`flex items-center p-2.5 cursor-pointer hover:bg-gray-50 ${serviceType === type ? 'bg-gray-100' : ''}`}
                                    >
                                        <div className="w-8 h-8 bg-gray-200 rounded-md mr-2.5 flex items-center justify-center shrink-0">
                                            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a.75.75 0 01.75.75v.5a.75.75 0 01-.75.75H5a2 2 0 01-2-2V5a1 1 0 00-1-1z" /><path d="M11 16.5c0 .414.336.75.75.75h4.5a2 2 0 002-2V9.5a1 1 0 00-1-1h-2.5A2.5 2.5 0 0112.25 6H9.75a.75.75 0 00-.75.75v9c0 .414.336.75.75.75z" /></svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xs">{type}</h4>
                                            <p className="text-[10px] text-gray-500">Reliable & Verified</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* When Needed Dropdown - Show for LOCAL_HOURLY */}
                    {serviceType === BookingType.LOCAL_HOURLY && (
                        <div className="relative mb-3">
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">When do you need?</label>
                            <div 
                                onClick={() => setOpenDropdown(openDropdown === 'whenNeeded' ? null : 'whenNeeded')}
                                className="w-full bg-gray-100 rounded-lg p-2.5 text-sm font-bold cursor-pointer flex justify-between items-center"
                            >
                                <span>{formData.whenNeeded}</span>
                                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'whenNeeded' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                            {openDropdown === 'whenNeeded' && (
                                <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                    {['Immediately', 'Schedule'].map((option) => (
                                        <div 
                                            key={option}
                                            onClick={() => { setFormData({...formData, whenNeeded: option}); setOpenDropdown(null); }}
                                            className={`p-2.5 cursor-pointer hover:bg-gray-50 ${formData.whenNeeded === option ? 'bg-gray-100' : ''}`}
                                        >
                                            <h4 className="font-bold text-xs">{option}</h4>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-3 sm:mt-4 space-y-3 pb-4">
                        <h3 className="font-bold text-sm mb-2">Schedule Details</h3>
                        {serviceType === BookingType.LOCAL_HOURLY && formData.whenNeeded === 'Immediately' && (
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
                                                    {['One Way', 'Round Trip'].map(option => (
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
                                                <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden max-h-48 overflow-y-auto">
                                                    {['1 Hr', '2 Hrs', '3 Hrs', '4 Hrs', '5 Hrs', '6 Hrs', '7 Hrs', '8 Hrs'].map(option => (
                                                        <div 
                                                            key={option}
                                                            onClick={() => { setFormData({...formData, estimatedUsage: option}); setOpenDropdown(null); setTimeout(() => handleEstimateWithValues(option), 100); }}
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
                                                    {['Manual', 'Automatic', 'Both'].map(option => (
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
                                                    {['Hatchback', 'Sedan', 'SUV', 'MPV'].map(option => (
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
                                                    {['One Way', 'Round Trip'].map(option => (
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
                                                <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden max-h-48 overflow-y-auto">
                                                    {['4 Hrs', '5 Hrs', '6 Hrs', '7 Hrs', '8 Hrs', '9 Hrs', '10 Hrs', '11 Hrs', '12 Hrs', '13 Hrs', '14 Hrs', '15 Hrs', '16 Hrs', '17 Hrs', '18 Hrs', '19 Hrs', '20 Hrs', '21 Hrs', '22 Hrs', '23 Hrs', '24 Hrs', '1 Day', '2 Days', '3 Days', '4 Days', '5 Days', '6 Days', '7 Days', '8 Days', '9 Days', '10 Days', '11 Days', '12 Days', '13 Days', '14 Days', '15 Days', '16 Days', '17 Days', '18 Days', '19 Days', '20 Days', '21 Days', '22 Days', '23 Days', '24 Days', '25 Days', '26 Days', '27 Days', '28 Days', '29 Days', '30 Days'].map(option => (
                                                        <div 
                                                            key={option}
                                                            onClick={() => { setFormData({...formData, estimatedUsage: option}); setOpenDropdown(null); setTimeout(() => handleEstimateWithValues(option), 100); }}
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
                                        <div className="relative flex-1">
                                            <div 
                                                onClick={() => setOpenDropdown(openDropdown === 'timeSlot' ? null : 'timeSlot')}
                                                className="w-full bg-gray-100 rounded-lg p-2 sm:p-3 text-xs font-bold cursor-pointer flex justify-between items-center"
                                            >
                                                <span>{formData.time ? getTimeSlots().find(s => s.value === formData.time)?.label || formData.time : 'Select time'}</span>
                                                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'timeSlot' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                            {openDropdown === 'timeSlot' && (
                                                <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden max-h-48 overflow-y-auto">
                                                    {getTimeSlots().map(slot => (
                                                        <div 
                                                            key={slot.value}
                                                            onClick={() => { setFormData({...formData, time: slot.value}); setOpenDropdown(null); }}
                                                            className={`p-3 text-xs font-bold cursor-pointer hover:bg-gray-50 ${formData.time === slot.value ? 'bg-gray-100' : ''}`}
                                                        >
                                                            {slot.label}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
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
                                                    {['Manual', 'Automatic', 'Both'].map(option => (
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
                                                    {['Hatchback', 'Sedan', 'SUV', 'MPV'].map(option => (
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
                        {serviceType === BookingType.LOCAL_HOURLY && formData.whenNeeded === 'Schedule' && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2">Date & Time</label>
                                    <div className="flex gap-2 sm:gap-3">
                                        <input 
                                            type="date" 
                                            className="flex-1 bg-gray-100 border-none rounded-lg p-2 sm:p-3 text-xs sm:text-xs font-bold [&::-webkit-datetime-edit]:text-xs sm:[&::-webkit-datetime-edit]:text-xs"
                                            value={formData.date}
                                            onChange={e => setFormData({...formData, date: e.target.value})}
                                        />
                                        <div className="relative flex-1">
                                            <div 
                                                onClick={() => setOpenDropdown(openDropdown === 'timeSlot2' ? null : 'timeSlot2')}
                                                className="w-full bg-gray-100 rounded-lg p-2 sm:p-3 text-xs font-bold cursor-pointer flex justify-between items-center"
                                            >
                                                <span>{formData.time ? getTimeSlots().find(s => s.value === formData.time)?.label || formData.time : 'Select time'}</span>
                                                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'timeSlot2' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                            {openDropdown === 'timeSlot2' && (
                                                <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden max-h-48 overflow-y-auto">
                                                    {getTimeSlots().map(slot => (
                                                        <div 
                                                            key={slot.value}
                                                            onClick={() => { setFormData({...formData, time: slot.value}); setOpenDropdown(null); }}
                                                            className={`p-3 text-xs font-bold cursor-pointer hover:bg-gray-50 ${formData.time === slot.value ? 'bg-gray-100' : ''}`}
                                                        >
                                                            {slot.label}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
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
                                                    {['One Way', 'Round Trip'].map(option => (
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
                                                <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden max-h-48 overflow-y-auto">
                                                    {['1 Hr', '2 Hrs', '3 Hrs', '4 Hrs', '5 Hrs', '6 Hrs', '7 Hrs', '8 Hrs'].map(option => (
                                                        <div 
                                                            key={option}
                                                            onClick={() => { setFormData({...formData, estimatedUsage: option}); setOpenDropdown(null); setTimeout(() => handleEstimateWithValues(option), 100); }}
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
                                                    {['Manual', 'Automatic', 'Both'].map(option => (
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
                                                    {['Hatchback', 'Sedan', 'SUV', 'MPV'].map(option => (
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
                                                    {['Manual', 'Automatic', 'Both'].map(option => (
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
                                                    {['Hatchback', 'Sedan', 'SUV', 'MPV'].map(option => (
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
                        <div className="mx-4 mb-4 bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-4 shadow-sm">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Fare Estimate</p>
                            {estimateLoading ? (
                                <p className="text-lg font-bold text-gray-500 mb-1">Calculating...</p>
                            ) : (
                                <>
                                    <p className="text-3xl font-bold text-black mb-1">₹{estimate}</p>
                                    {fareBreakdown && (
                                        <div className="text-xs text-gray-600 mt-2 space-y-1">
                                            <p className="font-medium">{fareBreakdown.description}</p>
                                            {fareBreakdown.extraHours > 0 && (
                                                <p className="text-[10px]">Base: ₹{fareBreakdown.baseFare} + Extra: ₹{fareBreakdown.extraHourCharge}</p>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500 mt-2">This is just an estimate</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-3 border-t border-gray-100 bg-white sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
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
                        className={`w-full py-3 rounded-lg font-bold text-base transition shadow-lg ${
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
                 <h3 className="text-lg font-bold">Your Bookings</h3>
                 {!isAuthenticated ? (
                    <div className="text-center py-8">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                            <svg className="w-12 h-12 text-yellow-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <h4 className="text-lg font-bold text-yellow-800 mb-2">Login Required</h4>
                            <p className="text-yellow-700">Please log in to view your bookings</p>
                        </div>
                    </div>
                 ) : myTrips.length === 0 ? (
                    <p className="text-gray-500">No bookings yet.</p>
                 ) : (
                    myTrips
                    .sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime())
                    .map(booking => {
                        const startDate = new Date(booking.startDateTime);
                        const formattedDate = startDate.toLocaleDateString('en-GB').replace(/\//g, '-');
                        const formattedTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        
                        return (
                        <div key={booking.id} className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm">
                             <div className="flex justify-between items-center gap-2 mb-3">
                                <span className="text-sm font-bold">{formattedTime}, {formattedDate}</span>
                                <span className={`text-xs px-2.5 sm:px-3 py-1 rounded-full font-bold whitespace-nowrap ${
                                    booking.status === 'CONFIRMED' && booking.driverId ? 'bg-green-100 text-green-800' : 
                                    booking.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                                    booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100'
                                }`}>
                                    {booking.status === 'CONFIRMED' && booking.driverId ? 'DRIVER ALLOCATED' : booking.status}
                                </span>
                             </div>
                             
                             {booking.estimateAmount && (
                                <p className="text-sm font-bold text-green-600 mb-2">₹{booking.estimateAmount}</p>
                             )}
                             <p className="text-xs sm:text-sm font-medium mb-2">{booking.bookingType}</p>
                             <div className="text-xs text-gray-500 space-y-1 mb-3">
                                <div className="flex items-start gap-2">
                                    <span className="font-bold shrink-0">From:</span>
                                    <span className="flex-1 break-words">{booking.pickupLocation}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="font-bold shrink-0">To:</span>
                                    <span className="flex-1 break-words">{booking.dropLocation}</span>
                                </div>
                             </div>
                             
                             {/* Status Messages */}
                             {booking.status === 'PENDING' && !booking.selectedPackageType && (
                                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3 mt-3">
                                     <p className="text-xs font-bold text-blue-800">🔍 Finding available drivers...</p>
                                 </div>
                             )}
                             
                             {booking.status === 'CONFIRMED' && !booking.driverId && (
                                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3 mt-3">
                                     <p className="text-xs font-bold text-blue-800">🔍 Finding available drivers...</p>
                                     <p className="text-xs text-blue-600 mt-1">Request sent to {booking.selectedPackageType} drivers</p>
                                 </div>
                             )}
                             
                             {/* Driver Details - Show when driver is allocated */}
                             {booking.driver && booking.driverId && (
                                 <div className="mt-3 pt-3 border-t border-gray-200">
                                     <p className="text-xs font-bold text-gray-500 mb-2 uppercase">✓ Your Driver</p>
                                     <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg border border-green-200 space-y-2.5">
                                         <div className="flex items-center gap-2.5">
                                             <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-base shrink-0">
                                                 {booking.driver.name?.[0] || 'D'}
                                             </div>
                                             <div className="flex-grow min-w-0">
                                                 <p className="font-bold text-sm truncate">{booking.driver.name || 'Driver'}</p>
                                                 <p className="text-xs text-gray-600">{booking.driver.phone || 'N/A'}</p>
                                             </div>
                                             <a 
                                                 href={`tel:${booking.driver.phone}`}
                                                 className="bg-green-500 text-white p-2.5 rounded-full hover:bg-green-600 transition shadow-lg shrink-0"
                                             >
                                                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                             </a>
                                         </div>
                                         <button
                                             onClick={() => {
                                               setSelectedDriver(booking.driver);
                                               setShowDriverProfile(true);
                                             }}
                                             className="w-full bg-white hover:bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 flex items-center justify-center gap-2 transition shadow-sm"
                                         >
                                             <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                             </svg>
                                             <span className="text-xs font-bold text-gray-700">Show Driver Profile</span>
                                         </button>
                                     </div>
                                 </div>
                             )}
                        </div>
                        );
                    })
                 )}
              </div>
          )}

          {false && activeTab === 'TRIPS' && (
              <CustomerBookingStatus />
          )}

          {false && activeTab === 'TRIPS' && (
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
                                             {trip.driver.name?.[0] || 'D'}
                                         </div>
                                         <div className="flex-grow">
                                             <p className="font-bold text-sm">{trip.driver.name || 'Driver'}</p>
                                             <p className="text-xs text-gray-500">{trip.driver.phone || 'N/A'}</p>
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
                             {/* Rating UI for Completed Trips - COMMENTED OUT */}
                             {/* {trip.status === 'COMPLETED' && (
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
                             )} */}
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
                                     {customer.name?.[0] || 'C'}
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
                                             onClick={() => window.open(`${import.meta.env.VITE_APP_API_URL}/uploads/${customer.idProof}`, '_blank')}
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




