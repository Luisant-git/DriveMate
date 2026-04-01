import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { User, UserRole } from './types';
import DriverPortal from './pages/driver/DriverPortal';
import CustomerPortal from './pages/customer/CustomerPortal';
import AdminPortal from './pages/admin/AdminPortal';
import LeadPortal from './pages/lead/LeadPortal';
import CustomerLogin from './components/auth/CustomerLogin';
import DriverLogin from './components/auth/DriverLogin';
import DriverRegister from './components/auth/DriverRegister';
import AdminLogin from './components/auth/AdminLogin';
import LeadLogin from './components/auth/LeadLogin';
import LeadRegister from './components/auth/LeadRegister';
import Toast from './components/Toast';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { logout, getProfile } from './api/auth';
import LandingPage from './pages/LandingPage';
import PrivacyPage from './pages/privacy';
import TermsPage from './pages/terms';

const AuthLayout: React.FC<{ children: React.ReactNode, wide?: boolean }> = ({ children, wide }) => (
  <div
    className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-cover bg-center"
    style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1920&auto=format&fit=crop")' }}
  >
    {/* Dark Overlay for readability */}
    <div className="absolute inset-0 "></div>

    <div className={`w-full ${wide ? 'max-w-lg' : 'max-w-md'} relative z-10 transition-all duration-300`}>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-6 sm:mb-8 tracking-tight text-center">SNP</h1>
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden min-h-[400px] flex flex-col">
        {children}
      </div>
    </div>
    <Toast />
  </div>
);


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    navigate('/app'); // Navigate to the app after successful login
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
      navigate('/customer/login'); // Navigate to login page after logout
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

  return (
    <Routes>
      <Route path="/" element={<LandingPage onGetStarted={() => navigate('/customer/login')} />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={<Navigate to="/customer/login" replace />} />
      <Route path="/customer/login" element={!currentUser ? <AuthLayout><CustomerLogin onLogin={handleLogin} /></AuthLayout> : <Navigate to="/app" />} />
      <Route path="/driver/login" element={!currentUser ? <AuthLayout><DriverLogin onLogin={handleLogin} /></AuthLayout> : <Navigate to="/app" />} />
      <Route path="/driver/register" element={!currentUser ? <AuthLayout wide><DriverRegister /></AuthLayout> : <Navigate to="/app" />} />
      <Route path="/lead/login" element={!currentUser ? <AuthLayout><LeadLogin onLogin={handleLogin} /></AuthLayout> : <Navigate to="/app" />} />
      <Route path="/lead/register" element={!currentUser ? <AuthLayout wide><LeadRegister /></AuthLayout> : <Navigate to="/app" />} />
      <Route path="/admin/login" element={!currentUser ? <AuthLayout><AdminLogin onLogin={handleLogin} /></AuthLayout> : <Navigate to="/app" />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />

      <Route path="/app/*" element={
        currentUser ? (
          <Layout currentUser={currentUser} onLogout={handleLogout} onSwitchRole={handleDevSwitch}>
            {currentUser.role === UserRole.CUSTOMER && <CustomerPortal customer={currentUser as any} />}
            {currentUser.role === UserRole.DRIVER && <DriverPortal driver={currentUser as any} />}
            {currentUser.role === UserRole.LEAD && <LeadPortal onLogout={handleLogout} />}
            {currentUser.role === UserRole.ADMIN && <AdminPortal onLogout={handleLogout} />}
            <Toast />
          </Layout>
        ) : (
          <Navigate to="/customer/login" />
        )
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const AppWrapper: React.FC = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
