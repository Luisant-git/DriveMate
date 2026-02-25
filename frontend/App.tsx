import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { User, UserRole } from './types';
import DriverPortal from './pages/driver/DriverPortal';
import CustomerPortal from './pages/customer/CustomerPortal';
import AdminPortal from './pages/admin/AdminPortal';
import LeadPortal from './pages/lead/LeadPortal';
import CustomerLogin from './components/auth/CustomerLogin';
import DriverLogin from './components/auth/DriverLogin';
import AdminLogin from './components/auth/AdminLogin';
import LeadLogin from './components/auth/LeadLogin';
import LeadRegister from './components/auth/LeadRegister';
import Toast from './components/Toast';
import { logout, getProfile } from './api/auth';

type LoginStep = 'SELECT_ROLE' | 'CUSTOMER_LOGIN' | 'DRIVER_LOGIN' | 'LEAD_LOGIN' | 'LEAD_REGISTER' | 'ADMIN_LOGIN';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginStep, setLoginStep] = useState<LoginStep>('SELECT_ROLE');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await getProfile();
        if (response.success && response.user) {
          setCurrentUser(response.user);
        }
      } catch (error) {
        console.log('No active session');
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const handleRoleSelect = (role: UserRole) => {
    if (role === UserRole.CUSTOMER) {
      setLoginStep('CUSTOMER_LOGIN');
    } else if (role === UserRole.DRIVER) {
      setLoginStep('DRIVER_LOGIN');
    } else if (role === UserRole.LEAD) {
      setLoginStep('LEAD_LOGIN');
    } else {
      setLoginStep('ADMIN_LOGIN');
    }
  };

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    setLoginStep('SELECT_ROLE');
  };

  const handleBack = () => {
    setLoginStep('SELECT_ROLE');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
      setLoginStep('SELECT_ROLE');
    }
  };

  // Dev Switch Helper - removed mock store usage
  const handleDevSwitch = (role: UserRole) => {
    console.log('Dev switch not available - please login properly');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1920&auto=format&fit=crop")' }}
      >
        {/* Dark Overlay for readability */}
        <div className="absolute inset-0 "></div>

        <div className="w-full max-w-md relative z-10">
           <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-6 sm:mb-8 tracking-tight text-center">SNP</h1>
           
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

                    <button 
                      onClick={() => handleRoleSelect(UserRole.LEAD)}
                      className="w-full flex items-center justify-between p-3 sm:p-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <div className="text-left">
                          <span className="block font-bold text-base sm:text-lg">Lead</span>
                          <span className="text-xs text-gray-500">Lead Driver</span>
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

              {/* Customer Login */}
              {loginStep === 'CUSTOMER_LOGIN' && (
                <CustomerLogin onLogin={handleLogin} onBack={handleBack} />
              )}

              {/* Driver Login */}
              {loginStep === 'DRIVER_LOGIN' && (
                <DriverLogin onLogin={handleLogin} onBack={handleBack} />
              )}

              {/* Lead Login */}
              {loginStep === 'LEAD_LOGIN' && (
                <LeadLogin 
                  onLogin={handleLogin} 
                  onBack={handleBack}
                  onRegister={() => setLoginStep('LEAD_REGISTER')}
                />
              )}

              {/* Lead Register */}
              {loginStep === 'LEAD_REGISTER' && (
                <LeadRegister onBack={() => setLoginStep('LEAD_LOGIN')} />
              )}

              {/* Admin Login */}
              {loginStep === 'ADMIN_LOGIN' && (
                <AdminLogin onLogin={handleLogin} onBack={handleBack} />
              )}

           </div>
        </div>
        <Toast />
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
      {currentUser.role === UserRole.LEAD && (
        <LeadPortal onLogout={handleLogout} />
      )}
      {currentUser.role === UserRole.ADMIN && (
        <AdminPortal />
      )}
      <Toast />
    </Layout>
  );
};

export default App;
