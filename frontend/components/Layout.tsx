import React, { useState } from 'react';
import { UserRole } from '../types';
import ConfirmModal from './common/ConfirmModal';
import UberLanguageSelector from './common/UberLanguageSelector';
import { useLanguage } from '../context/LanguageContext';
import logo from '../assets/logo-final.png';
import carlogo from '../assets/carlogo.png';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: { role: UserRole; name: string } | null;
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser, onLogout, onSwitchRole }) => {
  const { t } = useLanguage();
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
    onConfirm: () => { }
  });

  const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }));
  const isCustomer = currentUser?.role === UserRole.CUSTOMER;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-black">
      {/* Top Navbar */}
      <nav className={`h-16 sticky top-0 z-50 transition-colors ${
        currentUser?.role === UserRole.ADMIN ? 'hidden' : ''
      } ${
        isCustomer
          ? 'bg-[#FFFFFF] border-b border-[#E2E8F0] shadow-xs'
          : 'bg-[#0B192C] text-white'
      }`}>
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center cursor-pointer">
            {/* Mobile: small car logo */}
            <img src={carlogo} alt="" className="h-7 w-auto object-contain sm:hidden" />
            {/* Desktop: full SNP brand logo */}
            <img src={logo} alt="SNP Consultant and Services" className="hidden sm:block w-80 h-auto object-contain" />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            <UberLanguageSelector variant={isCustomer ? 'customer' : 'navbar'} />
            {currentUser && (
              <>
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className={`hidden md:block text-sm font-bold ${
                    isCustomer ? 'text-[#0F172A]' : 'text-white font-medium'
                  }`}>
                    {currentUser.name || 'User'}
                  </span>
                  <div className="relative">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      isCustomer 
                        ? 'bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] ring-2 ring-[#009EFF]/20' 
                        : 'bg-white text-black'
                    }`}>
                      {currentUser.name?.[0] || 'U'}
                    </div>
                    {isCustomer && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#009EFF] rounded-full border-2 border-white" title="Active"></span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setConfirmConfig({
                      isOpen: true,
                      title: t('nav.logout', 'Logout'),
                      message: 'Are you sure you want to logout?',
                      type: 'info',
                      confirmText: t('nav.logout', 'Logout'),
                      onConfirm: () => {
                        closeConfirm();
                        onLogout();
                      }
                    });
                  }}
                  className={`text-xs sm:text-sm px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full transition font-bold shadow-xs cursor-pointer ${
                    isCustomer
                      ? 'bg-[#0F172A] hover:bg-[#1E293B] text-white active:scale-95'
                      : 'bg-gray-800 hover:bg-gray-700 text-white font-medium'
                  }`}
                >
                  {t('nav.logout', 'Logout')}
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      {/* For Customer, we want full width to show map background. For others, constrained. */}
      <main className={`flex-grow w-full ${currentUser?.role === UserRole.CUSTOMER || currentUser?.role === UserRole.ADMIN ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'}`}>
        {children}
      </main>

      <ConfirmModal {...confirmConfig} onCancel={closeConfirm} />
    </div>
  );
};

export default Layout;