import React, { useState } from 'react';
import DocumentViewerModal from './DocumentViewerModal';
import { API_BASE_URL } from '../../api/config.js';

export interface DriverDocumentItem {
  label: string;
  path?: string | null;
  category?: string;
}

export interface DriverEntity {
  id: string;
  name: string;
  phone: string;
  aadharNo?: string;
  licenseNo?: string;
  licenseExpiryDate?: string | Date;
  policeVerificationExpiryDate?: string | Date;
  policeVerificationNo?: string;
  currentAddress?: string;
  permanentAddress?: string;
  alternateMobile1?: string;
  alternateMobile2?: string;
  alternateMobile3?: string;
  alternateMobile4?: string;
  gpayNo?: string;
  phonepeNo?: string;
  totalRides?: number;
  driverNo?: number;
  leadNo?: number;
  photo?: string | null;
  dlPhoto?: string | null;
  panPhoto?: string | null;
  aadharPhoto?: string | null;
  policeVerificationPhoto?: string | null;
  msmePhoto?: string | null;
  rationCardPhoto?: string | null;
  electricityBillPhoto?: string | null;
  rentalAgreementPhoto?: string | null;
  creditCardPhoto?: string | null;
  debitCardPhoto?: string | null;
  activeSubscription?: any;
  subscriptions?: any[];
  isActive?: boolean;
  isBlocked?: boolean;
  lastVerifiedAt?: string | Date;
  nextVerificationDue?: string | Date;
}

interface UberDriverDetailsModalProps {
  driver: DriverEntity | null;
  onClose: () => void;
  onOpenUpdatePackage: () => void;
  onOpenChangePassword?: () => void;
  docUrl: (path?: string | null) => string | null;
  extraDocs?: DriverDocumentItem[];
  isLead?: boolean;
}

export const UberDriverDetailsModal: React.FC<UberDriverDetailsModalProps> = ({
  driver,
  onClose,
  onOpenUpdatePackage,
  onOpenChangePassword,
  docUrl,
  extraDocs = [],
  isLead = false,
}) => {
  const [activePreviewDoc, setActivePreviewDoc] = useState<{ title: string; url: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleAmount, setSettleAmount] = useState('');
  const [isSettling, setIsSettling] = useState(false);
  const [settleSuccessMsg, setSettleSuccessMsg] = useState<string | null>(null);

  const activeSub = driver?.activeSubscription;
  const excessPerRide = activeSub?.plan?.excessAmountPerRide || 0;
  const dutiesDone = activeSub?.dutiesCompleted || 0;
  const totalComm = dutiesDone * excessPerRide;
  const commPaid = activeSub?.commissionPaid || 0;
  const commDue = Math.max(0, totalComm - commPaid);

  const handleSettleCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSub) return;
    const amountNum = parseFloat(settleAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (amountNum > commDue) {
      alert(`Amount cannot exceed current commission due (₹${commDue})`);
      return;
    }

    try {
      setIsSettling(true);
      const token = localStorage.getItem('token') || localStorage.getItem('auth-token');
      const res = await fetch(`${API_BASE_URL}/api/subscriptions/admin/settle-commission/${activeSub.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ amount: amountNum })
      });
      const data = await res.json();
      if (data.success) {
        activeSub.commissionPaid = (activeSub.commissionPaid || 0) + amountNum;
        activeSub.commissionDue = Math.max(0, (activeSub.totalCommission || totalComm) - activeSub.commissionPaid);
        setSettleSuccessMsg(`Successfully collected ₹${amountNum} commission!`);
        setTimeout(() => {
          setSettleSuccessMsg(null);
          setShowSettleModal(false);
          setSettleAmount('');
        }, 1500);
      } else {
        alert(data.error || 'Failed to settle commission');
      }
    } catch (err: any) {
      alert(err.message || 'Error settling commission');
    } finally {
      setIsSettling(false);
    }
  };

  if (!driver) return null;

  const handleCopy = (text: string, key: string) => {
    if (!text || text === 'N/A') return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadDoc = async (path: string | null | undefined, label: string) => {
    if (!path) return;
    const url = docUrl(path);
    if (!url) return;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      let ext = 'jpg';
      const cType = response.headers.get('content-type');
      if (cType?.includes('pdf')) ext = 'pdf';
      else if (cType?.includes('png')) ext = 'png';
      else if (cType?.includes('webp')) ext = 'webp';
      else if (path.includes('.')) {
        ext = path.split('.').pop()?.split('?')[0] || 'jpg';
      }

      const cleanName = (driver.name || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanDoc = label.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanName}_${cleanDoc}.${ext}`;

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.warn('Direct blob download failed, falling back to direct anchor:', e);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = `${driver.name || 'document'}_${label}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleViewDoc = (path: string | null | undefined, label: string) => {
    if (!path) return;
    const url = docUrl(path);
    if (url) {
      setActivePreviewDoc({ title: `${label} - ${driver.name}`, url });
    }
  };

  // Base list of mandatory documents
  const standardDocs: DriverDocumentItem[] = [
    { label: 'Photo', path: driver.photo },
    { label: 'DL Photo', path: driver.dlPhoto },
    { label: 'PAN Photo', path: driver.panPhoto },
    { label: 'Aadhar Photo', path: driver.aadharPhoto },
    { label: 'Police Verification', path: driver.policeVerificationPhoto },
  ];

  // Merge extra documents if provided (e.g. for Leads: MSME, Ration Card, etc.)
  const allDocs: DriverDocumentItem[] = [...standardDocs, ...extraDocs];

  // Verification Expiry Status helper
  const getExpiryStatus = (dateStr?: string | Date) => {
    if (!dateStr) return { text: 'Not Set', color: 'bg-gray-100 text-gray-600' };
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Expired', color: 'bg-red-50 text-red-700 border-red-200' };
    if (diffDays <= 30) return { text: `Expiring in ${diffDays}d`, color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { text: 'Valid', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const dlStatus = getExpiryStatus(driver.licenseExpiryDate);
  const policeStatus = getExpiryStatus(driver.policeVerificationExpiryDate);

  const identifier = isLead
    ? `LED-${driver.leadNo ? driver.leadNo.toString().padStart(4, '0') : driver.id.slice(-6).toUpperCase()}`
    : `DRV-${driver.driverNo ? driver.driverNo.toString().padStart(4, '0') : driver.id.slice(-6).toUpperCase()}`;

  const avatarUrl = docUrl(driver.photo);

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-5 transition-all overflow-y-auto"
        onClick={onClose}
      >
        <div 
          className="bg-[#f8f9fa] rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Paper Banner / Header */}
          <div className="bg-white px-6 py-5 border-b border-gray-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar circle */}
              <div className="relative">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={driver.name} 
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-black/10 shadow-md bg-gray-100"
                    onError={(e) => {
                      // Fallback to initial
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-md">
                    {driver.name ? driver.name.charAt(0).toUpperCase() : 'D'}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                    {driver.name || 'Unnamed Driver'}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-neutral-100 text-neutral-800 border border-neutral-300">
                    {identifier}
                  </span>
                  {driver.isBlocked && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                      Blocked
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500 font-medium mt-1">
                  <a href={`tel:${driver.phone}`} className="flex items-center gap-1 text-gray-700 hover:text-black font-semibold">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{driver.phone}</span>
                  </a>
                  {driver.licenseNo && (
                    <>
                      <span>·</span>
                      <span className="text-gray-500 font-mono">DL: {driver.licenseNo}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {onOpenChangePassword && (
                <button 
                  onClick={onOpenChangePassword} 
                  className="px-3.5 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-sm active:scale-95 flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span>Change Password</span>
                </button>
              )}
              <button 
                onClick={onClose} 
                className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition active:scale-95 text-gray-500 hover:text-black"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Modal Content - Paper Containers Grid */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Upper Grid: Personal Information + Contact & Vehicle */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              
              {/* Paper Container 1: Personal Information */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center shadow-xs">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                      Personal Information
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    Profile Data
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-500 font-semibold uppercase text-[11px] tracking-wide">Name:</span>
                    <span className="font-bold text-gray-900 text-sm">{driver.name || 'N/A'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-500 font-semibold uppercase text-[11px] tracking-wide">Phone:</span>
                    <div className="flex items-center gap-1.5">
                      <a href={`tel:${driver.phone}`} className="font-bold text-gray-900 hover:text-blue-600">
                        {driver.phone || 'N/A'}
                      </a>
                      {driver.phone && (
                        <button
                          onClick={() => handleCopy(driver.phone, 'phone')}
                          className="text-gray-400 hover:text-black transition"
                          title="Copy phone"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                      {copiedKey === 'phone' && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-500 font-semibold uppercase text-[11px] tracking-wide">Aadhar No:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-gray-900">{driver.aadharNo || 'N/A'}</span>
                      {driver.aadharNo && (
                        <button
                          onClick={() => handleCopy(driver.aadharNo!, 'aadhar')}
                          className="text-gray-400 hover:text-black transition"
                          title="Copy Aadhar"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                      {copiedKey === 'aadhar' && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-500 font-semibold uppercase text-[11px] tracking-wide">Driving License:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-gray-900">{driver.licenseNo || 'N/A'}</span>
                      {driver.licenseNo && (
                        <button
                          onClick={() => handleCopy(driver.licenseNo!, 'license')}
                          className="text-gray-400 hover:text-black transition"
                          title="Copy DL"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                      {copiedKey === 'license' && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-500 font-semibold uppercase text-[11px] tracking-wide">DL Expiry:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">
                        {driver.licenseExpiryDate ? new Date(driver.licenseExpiryDate).toLocaleDateString('en-GB') : 'N/A'}
                      </span>
                      {driver.licenseExpiryDate && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${dlStatus.color}`}>
                          {dlStatus.text}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-500 font-semibold uppercase text-[11px] tracking-wide">Police Verif. Expiry:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">
                        {driver.policeVerificationExpiryDate ? new Date(driver.policeVerificationExpiryDate).toLocaleDateString('en-GB') : 'N/A'}
                      </span>
                      {driver.policeVerificationExpiryDate && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${policeStatus.color}`}>
                          {policeStatus.text}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-500 font-semibold uppercase text-[11px] tracking-wide">Police Verif. No:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-gray-900">{driver.policeVerificationNo || 'N/A'}</span>
                      {driver.policeVerificationNo && (
                        <button
                          onClick={() => handleCopy(driver.policeVerificationNo!, 'policeNo')}
                          className="text-gray-400 hover:text-black transition"
                          title="Copy Police Verification No"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                      {copiedKey === 'policeNo' && (
                        <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                      )}
                    </div>
                  </div>

                  <div className="py-1 border-b border-gray-50 space-y-1">
                    <span className="text-gray-500 font-semibold uppercase text-[11px] tracking-wide block">Current Address:</span>
                    <p className="font-medium text-gray-800 bg-gray-50 p-2 rounded-lg text-xs">
                      {driver.currentAddress || 'NA'}
                    </p>
                  </div>

                  <div className="py-1 space-y-1">
                    <span className="text-gray-500 font-semibold uppercase text-[11px] tracking-wide block">Permanent Address:</span>
                    <p className="font-medium text-gray-800 bg-gray-50 p-2 rounded-lg text-xs">
                      {driver.permanentAddress || 'NA'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Paper Container 2: Contact, Vehicle & Package Info */}
              <div className="space-y-5">
                
                {/* Contact & Vehicle Info Card */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center shadow-xs">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                        Contact & Vehicle
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      Emergency & UPI
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="text-gray-500 font-semibold uppercase text-[11px] tracking-wide">Alt Mobile 1:</span>
                      <span className="font-bold text-gray-900">{driver.alternateMobile1 || 'NA'}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="text-gray-500 font-semibold uppercase text-[11px] tracking-wide">Alt Mobile 2:</span>
                      <span className="font-bold text-gray-900">{driver.alternateMobile2 || 'NA'}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="text-gray-500 font-semibold uppercase text-[11px] tracking-wide">Alt Mobile 3:</span>
                      <span className="font-bold text-gray-900">{driver.alternateMobile3 || 'NA'}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="text-gray-500 font-semibold uppercase text-[11px] tracking-wide">Alt Mobile 4:</span>
                      <span className="font-bold text-gray-900">{driver.alternateMobile4 || 'NA'}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="text-gray-500 font-semibold uppercase text-[11px] tracking-wide">Gpay / PhonePe:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-gray-900">
                          {driver.gpayNo || driver.phonepeNo || 'NA'}
                        </span>
                        {(driver.gpayNo || driver.phonepeNo) && (
                          <button
                            onClick={() => handleCopy(driver.gpayNo || driver.phonepeNo!, 'upi')}
                            className="text-gray-400 hover:text-black transition"
                            title="Copy UPI number"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                        {copiedKey === 'upi' && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
                      </div>
                    </div>
                  </div>

                  {/* Total Rides Stat Card */}
                  <div className="p-3.5 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 border border-blue-100 rounded-xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Total Rides</span>
                        <span className="text-xs text-gray-500 font-medium">Lifetime completed</span>
                      </div>
                    </div>
                    <div className="text-2xl font-black tracking-tight text-gray-900">
                      {driver.totalRides ?? 0}
                    </div>
                  </div>
                </div>

                {/* Paper Container 3: Active Package / Subscription */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                        Package Subscription
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {driver.activeSubscription?.status || 'Active Plan'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Package:</span>
                        <p className="text-sm font-black text-gray-900">
                          {driver.activeSubscription?.plan?.name || 'No Active Package'}
                        </p>
                        {driver.activeSubscription && (
                          <p className="text-[11px] text-gray-500 font-medium">
                            Duties: <span className="font-bold text-gray-900">{dutiesDone}</span> / {driver.activeSubscription.maxDuties || 'Unlimited'}
                          </p>
                        )}
                      </div>

                      <button 
                        onClick={onOpenUpdatePackage}
                        className="px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition shadow-sm active:scale-95 flex items-center gap-1.5 flex-shrink-0"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Update</span>
                      </button>
                    </div>

                    {/* Per-Ride Commission Details (Driver Commission Ledger) */}
                    {activeSub && excessPerRide > 0 && (
                      <div className="pt-2.5 border-t border-gray-200 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white p-2 rounded-lg border border-gray-200/70">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Commission Rate</span>
                            <span className="text-xs font-black text-gray-900">₹{excessPerRide} / ride</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-gray-200/70">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Commission Settled</span>
                            <span className="text-xs font-black text-emerald-600">₹{commPaid}</span>
                          </div>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 p-2.5 rounded-xl flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[9px] font-black text-orange-800 uppercase tracking-wider block">Commission Owed</span>
                            <p className="text-base font-black text-orange-700 leading-tight">₹{commDue}</p>
                            <p className="text-[10px] text-orange-600 font-semibold mt-0.5">({dutiesDone} completed rides × ₹{excessPerRide})</p>
                          </div>
                          {commDue > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSettleAmount(String(commDue));
                                setShowSettleModal(true);
                              }}
                              className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black rounded-lg transition shadow-xs active:scale-95 flex-shrink-0"
                            >
                              Collect ₹{commDue}
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                              ✓ All Settled
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Paper Container 4: Required Documents (Full Width Paper Surface - Compact) */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 sm:p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center shadow-xs">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                      Documents
                    </h3>
                    <p className="text-[10px] text-gray-400 font-medium">
                      Verification records with independent view & download
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                    {allDocs.filter(d => Boolean(d.path)).length} / {allDocs.length} Uploaded
                  </span>
                </div>
              </div>

              {/* Documents List - Single Column Compact */}
              <div className="flex flex-col space-y-1.5">
                {allDocs.map((doc) => {
                  const hasPath = Boolean(doc.path);
                  const fullUrl = docUrl(doc.path);

                  return (
                    <div 
                      key={doc.label} 
                      className={`py-1.5 px-2.5 sm:px-3 rounded-lg border transition-all flex items-center justify-between gap-2.5 ${
                        hasPath 
                          ? 'bg-gray-50/70 hover:bg-gray-50 border-gray-200 shadow-2xs' 
                          : 'bg-neutral-50/40 border-dashed border-gray-200 opacity-60'
                      }`}
                    >
                      {/* Left: Thumbnail / Document Icon + Name & Status */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        {hasPath && fullUrl ? (
                          <div 
                            onClick={() => handleViewDoc(doc.path, doc.label)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-md overflow-hidden bg-gray-200 border border-gray-300 flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                            title="Click to view"
                          >
                            <img 
                              src={fullUrl} 
                              alt="" 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 flex-shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}

                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <h4 className="text-xs font-bold text-gray-900 truncate">
                            {doc.label}
                          </h4>
                          {doc.label === 'Police Verification' && driver.policeVerificationNo && (
                            <span className="text-[10px] font-mono font-bold text-gray-700 bg-gray-100 border border-gray-300 px-1.5 py-0.5 rounded">
                              No: {driver.policeVerificationNo}
                            </span>
                          )}
                          {hasPath ? (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.2 rounded-full inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Uploaded
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium text-gray-400 bg-gray-100 border border-gray-200 px-1.5 py-0.2 rounded-full inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                              Not Uploaded
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Separate View Button & Download Button */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* View Button */}
                        <button
                          type="button"
                          disabled={!hasPath}
                          onClick={() => handleViewDoc(doc.path, doc.label)}
                          className={`px-2 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                            hasPath 
                              ? 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 shadow-2xs active:scale-95' 
                              : 'bg-gray-100 text-gray-300 border border-gray-200 cursor-not-allowed'
                          }`}
                          title={hasPath ? `View ${doc.label}` : 'Document not uploaded'}
                        >
                          <svg className="w-3 h-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>View</span>
                        </button>

                        {/* Download Button */}
                        <button
                          type="button"
                          disabled={!hasPath}
                          onClick={() => handleDownloadDoc(doc.path, doc.label)}
                          className={`px-2 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                            hasPath 
                              ? 'bg-black hover:bg-neutral-800 text-white shadow-2xs active:scale-95' 
                              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          }`}
                          title={hasPath ? `Download ${doc.label}` : 'Document not uploaded'}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Inline Document Viewer Modal */}
      {activePreviewDoc && (
        <DocumentViewerModal
          isOpen={true}
          onClose={() => setActivePreviewDoc(null)}
          title={activePreviewDoc.title}
          url={activePreviewDoc.url}
          entityName={driver.name}
          onDownload={() => {
            const docObj = allDocs.find(d => docUrl(d.path) === activePreviewDoc.url);
            handleDownloadDoc(docObj?.path, docObj?.label || 'document');
          }}
        />
      )}

      {/* Settle Commission Modal */}
      {showSettleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100">
            <div className="bg-black text-white px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Collect Commission</p>
                <h3 className="text-base font-black text-white mt-0.5">{driver.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettleModal(false)}
                className="text-gray-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSettleCommission} className="p-5 space-y-4">
              {settleSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center">
                  ✓ {settleSuccessMsg}
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Package:</span>
                  <span className="font-bold text-gray-900">{activeSub?.plan?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed Rides:</span>
                  <span className="font-bold text-gray-900">{dutiesDone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Commission Rate:</span>
                  <span className="font-bold text-gray-900">₹{excessPerRide} / ride</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-200 font-bold">
                  <span className="text-orange-800">Total Due:</span>
                  <span className="text-orange-700 text-sm font-black">₹{commDue}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Amount Collected (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  max={commDue}
                  step="0.01"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Enter collected amount"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSettling}
                  className="flex-1 px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
                >
                  {isSettling ? 'Recording...' : 'Confirm Collected'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default UberDriverDetailsModal;