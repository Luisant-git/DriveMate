
import React, { useState } from 'react';
import Layout from './components/Layout';
import { User, UserRole } from './types';
import { store } from './services/mockStore';
import DriverPortal from './pages/driver/DriverPortal';
import CustomerPortal from './pages/customer/CustomerPortal';
import AdminPortal from './pages/admin/AdminPortal';

type LoginStep = 'SELECT_ROLE' | 'PHONE_INPUT' | 'OTP_INPUT' | 'PASSWORD_LOGIN' | 'DRIVER_REGISTER';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Login State
  const [loginStep, setLoginStep] = useState<LoginStep>('SELECT_ROLE');
  const [targetRole, setTargetRole] = useState<UserRole | null>(null);
  
  // Form Inputs
  const [phoneNumber, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Driver Registration State
  const [driverRegData, setDriverRegData] = useState({
    name: '',
    email: '',
    phone: '',
    aadharNo: '',
    licenseNo: '',
    altPhone: '',
    upiId: '',
    photo: null as File | null,
    dl: null as File | null,
    pan: null as File | null
  });

  const handleRoleSelect = (role: UserRole) => {
    setTargetRole(role);
    if (role === UserRole.CUSTOMER) {
      setLoginStep('PHONE_INPUT');
    } else {
      setLoginStep('PASSWORD_LOGIN');
    }
  };

  // --- Customer OTP Flow ---
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLoginStep('OTP_INPUT');
      alert(`OTP sent to ${phoneNumber}. Use 1234 to login.`);
    }, 1000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 4) {
      alert("Please enter a valid 4-digit OTP");
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (otp === '1234') {
        const existingCustomer = store.customers.find(c => c.phone === phoneNumber);
        if (existingCustomer) {
          setCurrentUser(existingCustomer);
        } else {
          const demoUser = {...store.customers[0], phone: phoneNumber};
          setCurrentUser(demoUser);
        }
        resetLogin();
      } else {
        alert("Invalid OTP. Please try again.");
      }
    }, 800);
  };

  // --- Driver & Admin Password Flow ---
  const handlePasswordLogin = (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      setTimeout(() => {
          setIsLoading(false);
          
          if (targetRole === UserRole.ADMIN) {
              if (username === 'admin' && password === 'admin123') {
                  setCurrentUser({
                    id: 'admin1',
                    name: 'Super Admin',
                    role: UserRole.ADMIN,
                    email: 'admin@drivemate.com',
                    phone: '0000000000'
                  });
                  resetLogin();
              } else {
                  alert("Invalid Admin Credentials. Try 'admin' / 'admin123'");
              }
          } else if (targetRole === UserRole.DRIVER) {
              // For demo, we check if the phone number (username) exists in our mock store
              // Password check is mocked to '1234'
              const driver = store.drivers.find(d => d.phone === username || d.email === username);
              
              if (driver && password === '1234') {
                  setCurrentUser(driver);
                  resetLogin();
              } else {
                  // Fallback for demo if they type a random number
                  if (username.length >= 10 && password === '1234') {
                       // Login as first driver for demo if specific one not found but format correct
                       setCurrentUser(store.drivers[0]);
                       resetLogin();
                  } else {
                      alert("Invalid Driver Credentials. Use a valid Phone Number and Password '1234'");
                  }
              }
          }
      }, 800);
  };

  const resetLogin = () => {
    setLoginStep('SELECT_ROLE');
    setPhoneNumber('');
    setOtp('');
    setUsername('');
    setPassword('');
    setTargetRole(null);
  };

  const handleBack = () => {
    if (loginStep === 'OTP_INPUT') setLoginStep('PHONE_INPUT');
    else if (loginStep === 'DRIVER_REGISTER') setLoginStep('PASSWORD_LOGIN');
    else setLoginStep('SELECT_ROLE');
  };

  const handleDriverRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      const newDriver = {
        id: store.generateId(),
        name: driverRegData.name,
        role: UserRole.DRIVER,
        email: driverRegData.email,
        phone: driverRegData.phone,
        aadharNo: driverRegData.aadharNo,
        licenseNo: driverRegData.licenseNo,
        altPhone: driverRegData.altPhone ? [driverRegData.altPhone] : [],
        upiId: driverRegData.upiId,
        isVerified: false,
        rating: 0,
        completedTrips: 0,
        packageSubscription: null,
        documents: {},
        avatarUrl: ''
      };
      
      store.drivers.push(newDriver as any);
      store.save();
      
      setIsLoading(false);
      alert('Registration successful! Please login with your phone number and password.');
      setLoginStep('PASSWORD_LOGIN');
      setDriverRegData({
        name: '',
        email: '',
        phone: '',
        aadharNo: '',
        licenseNo: '',
        altPhone: '',
        upiId: '',
        photo: null,
        dl: null,
        pan: null
      });
    }, 1000);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    resetLogin();
  };

  // --- Dev Switch Helper ---
  const handleDevSwitch = (role: UserRole) => {
     if (role === UserRole.ADMIN) {
         setCurrentUser({
            id: 'admin1',
            name: 'Super Admin',
            role: UserRole.ADMIN,
            email: 'admin@drivemate.com',
            phone: '0000000000'
          });
     } else if (role === UserRole.DRIVER) {
         setCurrentUser(store.drivers[0]);
     } else {
         setCurrentUser(store.customers[0]);
     }
  };

  if (!currentUser) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1920&auto=format&fit=crop")' }}
      >
        {/* Dark Overlay for readability */}
        <div className="absolute inset-0 "></div>

        <div className="w-full max-w-md relative z-10">
           <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-6 sm:mb-8 tracking-tight text-center">DriveMate</h1>
           
           <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden min-h-[400px] flex flex-col">
              
              {/* Login Step: Select Role */}
              {loginStep === 'SELECT_ROLE' && (
                <div className="animate-fade-in flex-grow flex flex-col justify-center">
                  <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-black">Get started</h2>
                  <div className="space-y-3 sm:space-y-4">
                    <button 
                      onClick={() => handleRoleSelect(UserRole.CUSTOMER)}
                      className="w-full flex items-center justify-between p-3 sm:p-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <div className="text-left">
                          <span className="block font-bold text-base sm:text-lg">Customer</span>
                          <span className="text-xs text-gray-500">Book a ride</span>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-black transform group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>

                    <button 
                      onClick={() => handleRoleSelect(UserRole.DRIVER)}
                      className="w-full flex items-center justify-between p-3 sm:p-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        </div>
                        <div className="text-left">
                          <span className="block font-bold text-base sm:text-lg">Driver</span>
                          <span className="text-xs text-gray-500">Drive & Earn</span>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-black transform group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>

                  <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100 flex justify-between items-center">
                    <button onClick={() => handleRoleSelect(UserRole.ADMIN)} className="text-xs font-bold text-gray-400 hover:text-black">Login as Admin</button>
                    {/* <span className="text-xs text-gray-300">v1.0.0</span> */}
                  </div>
                </div>
              )}

              {/* Login Step: Password Login (Driver/Admin) */}
              {loginStep === 'PASSWORD_LOGIN' && (
                  <form onSubmit={handlePasswordLogin} className="animate-fade-in flex-grow flex flex-col">
                    <button type="button" onClick={handleBack} className="mb-4 text-gray-400 hover:text-black flex items-center gap-1 text-sm font-bold">
                        ← Back
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold mb-2 text-black">
                        {targetRole === UserRole.ADMIN ? 'Admin Portal' : 'Driver Login'}
                    </h2>
                    <p className="text-gray-500 text-sm mb-4 sm:mb-6">Enter your credentials to continue.</p>
                    
                    <div className="space-y-4 flex-grow">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">
                                {targetRole === UserRole.ADMIN ? 'Username' : 'Phone Number'}
                            </label>
                            <input 
                                type={targetRole === UserRole.ADMIN ? "text" : "tel"}
                                className="w-full bg-gray-100 border-none rounded-lg p-3 font-medium text-lg focus:ring-2 focus:ring-black outline-none"
                                placeholder={targetRole === UserRole.ADMIN ? "admin" : "9876543210"}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Password</label>
                            <input 
                                type="password" 
                                className="w-full bg-gray-100 border-none rounded-lg p-3 font-medium text-lg focus:ring-2 focus:ring-black outline-none"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={!username || !password || isLoading}
                        className="w-full mt-6 bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : 'Login'}
                    </button>
                    
                    {targetRole === UserRole.DRIVER && (
                        <p className="text-center text-xs text-gray-400 mt-4">
                            First time? <span onClick={() => setLoginStep('DRIVER_REGISTER')} className="font-bold text-black cursor-pointer hover:underline">Register here</span>
                        </p>
                    )}
                 </form>
              )}

              {/* Driver Registration */}
              {loginStep === 'DRIVER_REGISTER' && (
                <form onSubmit={handleDriverRegister} className="animate-fade-in flex-grow flex flex-col overflow-y-auto">
                  <button type="button" onClick={handleBack} className="mb-4 text-gray-400 hover:text-black flex items-center gap-1 text-sm font-bold">
                    ← Back to Login
                  </button>
                  <h2 className="text-xl font-bold mb-4 text-black">Driver Registration</h2>
                  
                  <div className="space-y-3 flex-grow overflow-y-auto pr-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Full Name</label>
                      <input 
                        type="text"
                        className="w-full bg-gray-100 border-none rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-black"
                        value={driverRegData.name}
                        onChange={(e) => setDriverRegData({...driverRegData, name: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Email</label>
                      <input 
                        type="email"
                        className="w-full bg-gray-100 border-none rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-black"
                        value={driverRegData.email}
                        onChange={(e) => setDriverRegData({...driverRegData, email: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Phone Number</label>
                      <input 
                        type="tel"
                        className="w-full bg-gray-100 border-none rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-black"
                        value={driverRegData.phone}
                        onChange={(e) => setDriverRegData({...driverRegData, phone: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Aadhar Number</label>
                      <input 
                        type="text"
                        className="w-full bg-gray-100 border-none rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-black"
                        value={driverRegData.aadharNo}
                        onChange={(e) => setDriverRegData({...driverRegData, aadharNo: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">License Number</label>
                      <input 
                        type="text"
                        className="w-full bg-gray-100 border-none rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-black"
                        value={driverRegData.licenseNo}
                        onChange={(e) => setDriverRegData({...driverRegData, licenseNo: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Alternate Phone (Optional)</label>
                      <input 
                        type="tel"
                        className="w-full bg-gray-100 border-none rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-black"
                        value={driverRegData.altPhone}
                        onChange={(e) => setDriverRegData({...driverRegData, altPhone: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">UPI ID</label>
                      <input 
                        type="text"
                        className="w-full bg-gray-100 border-none rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-black"
                        placeholder="yourname@upi"
                        value={driverRegData.upiId}
                        onChange={(e) => setDriverRegData({...driverRegData, upiId: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Photo</label>
                      <input 
                        type="file"
                        accept="image/*"
                        className="w-full bg-gray-100 border-none rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-black file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
                        onChange={(e) => setDriverRegData({...driverRegData, photo: e.target.files?.[0] || null})}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Driving License</label>
                      <input 
                        type="file"
                        accept="image/*,.pdf"
                        className="w-full bg-gray-100 border-none rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-black file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
                        onChange={(e) => setDriverRegData({...driverRegData, dl: e.target.files?.[0] || null})}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">PAN Card</label>
                      <input 
                        type="file"
                        accept="image/*,.pdf"
                        className="w-full bg-gray-100 border-none rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-black file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
                        onChange={(e) => setDriverRegData({...driverRegData, pan: e.target.files?.[0] || null})}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full mt-4 bg-black text-white py-3 rounded-xl font-bold text-base hover:bg-gray-800 transition disabled:opacity-50 flex justify-center"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : 'Register'}
                  </button>
                </form>
              )}

              {/* Login Step: Phone Input (Customer) */}
              {loginStep === 'PHONE_INPUT' && (
                 <form onSubmit={handleSendOtp} className="animate-fade-in flex-grow flex flex-col">
                    <button type="button" onClick={handleBack} className="mb-4 text-gray-400 hover:text-black flex items-center gap-1 text-sm font-bold">
                        ← Back
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold mb-2 text-black">What's your number?</h2>
                    <p className="text-gray-500 text-sm mb-6 sm:mb-8">We'll send you a code to verify your account.</p>
                    
                    <div className="flex-grow">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Mobile Number</label>
                        <div className="flex gap-3">
                            <div className="bg-gray-100 rounded-lg px-3 py-3 flex items-center justify-center font-bold text-gray-500 text-sm">
                                +91
                            </div>
                            <input 
                                type="tel" 
                                autoFocus
                                className="flex-1 bg-gray-100 border-none rounded-lg p-3 font-bold text-lg focus:ring-2 focus:ring-black outline-none"
                                placeholder="98765 43210"
                                value={phoneNumber}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if(val.length <= 10) setPhoneNumber(val);
                                }}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={phoneNumber.length < 10 || isLoading}
                        className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : 'Send Code'}
                    </button>
                 </form>
              )}

              {/* Login Step: OTP Input (Customer) */}
              {loginStep === 'OTP_INPUT' && (
                 <form onSubmit={handleVerifyOtp} className="animate-fade-in flex-grow flex flex-col">
                    <button type="button" onClick={handleBack} className="mb-4 text-gray-400 hover:text-black flex items-center gap-1 text-sm font-bold">
                        ← Edit Number
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold mb-2 text-black">Verify account</h2>
                    <p className="text-gray-500 text-sm mb-6 sm:mb-8">Enter the 4-digit code sent to <span className="font-bold text-black">+91 {phoneNumber}</span></p>
                    
                    <div className="flex-grow">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">One Time Password</label>
                        <input 
                            type="text" 
                            autoFocus
                            maxLength={4}
                            className="w-full bg-gray-100 border-none rounded-lg p-4 font-bold text-2xl tracking-[0.5em] text-center focus:ring-2 focus:ring-black outline-none"
                            placeholder="••••"
                            value={otp}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setOtp(val);
                            }}
                        />
                         <div className="mt-4 text-center">
                            <button type="button" onClick={() => alert(`OTP Resent: 1234`)} className="text-xs font-bold text-gray-400 hover:text-black">
                                Resend Code
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={otp.length < 4 || isLoading}
                        className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
                    >
                         {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : 'Verify & Login'}
                    </button>
                 </form>
              )}

           </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      currentUser={currentUser} 
      onLogout={handleLogout}
      onSwitchRole={handleDevSwitch}
    >
      {currentUser.role === UserRole.CUSTOMER && (
        <CustomerPortal customer={currentUser as any} />
      )}
      {currentUser.role === UserRole.DRIVER && (
        <DriverPortal driver={currentUser as any} />
      )}
      {currentUser.role === UserRole.ADMIN && (
        <AdminPortal />
      )}
    </Layout>
  );
};

export default App;
