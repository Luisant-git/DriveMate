import React from 'react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: { role: UserRole; name: string } | null;
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser, onLogout, onSwitchRole }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-black">
      {/* Uber-style Minimal Navbar */}
      <nav className="bg-black text-white h-16 sticky top-0 z-50">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-1 cursor-pointer">
              <span className="text-2xl font-bold tracking-tight">SNP</span>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6">
              {currentUser && (
                <>
                  <div className="flex items-center gap-3">
                     <span className="hidden md:block text-sm font-medium">{currentUser.name || 'User'}</span>
                     <div className="h-8 w-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-sm">
                       {currentUser.name?.[0] || 'U'}
                     </div>
                  </div>
                  <button 
                    onClick={onLogout}
                    className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full transition-colors"
                  >
                     Logout
                  </button>
                </>
              )}
            </div>
        </div>
      </nav>

      {/* Main Content Area */}
      {/* For Customer, we want full width to show map background. For others, constrained. */}
      <main className={`flex-grow w-full ${currentUser?.role === UserRole.CUSTOMER ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'}`}>
        {children}
      </main>

      {/* Dev Controls */}
       <div className="bg-gray-100 text-gray-500 py-2 text-center text-[9px] sm:text-[10px] uppercase tracking-wider">
         <span className="opacity-50 mr-2">Dev Switch:</span>
         <button onClick={() => onSwitchRole(UserRole.CUSTOMER)} className="mx-1 sm:mx-2 hover:text-black font-bold">Customer</button>
         <button onClick={() => onSwitchRole(UserRole.DRIVER)} className="mx-1 sm:mx-2 hover:text-black font-bold">Driver</button>
         <button onClick={() => onSwitchRole(UserRole.ADMIN)} className="mx-1 sm:mx-2 hover:text-black font-bold">Admin</button>
      </div>
    </div>
  );
};

export default Layout;