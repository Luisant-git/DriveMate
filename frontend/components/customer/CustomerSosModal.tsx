import React from 'react';
import { Customer } from '../../types';

interface CustomerSosModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  activeTrip?: any;
  allTrips?: any[];
}

export const EMERGENCY_NUMBERS = {
  NATIONAL_POLICE: '112',
  POLICE_LOCAL: '100',
  EMERGENCY_CONTACTS: [
    { number: '+918884557768', display: '8884557768' },
    { number: '+918884555775', display: '8884555775' },
    { number: '+919986977768', display: '9986977768' }
  ]
};

const CustomerSosModal: React.FC<CustomerSosModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-red-500/30 flex flex-col animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Emergency Banner */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-700 p-5 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-inner">
                <svg className="w-6 h-6 text-white animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm2 10h-4v-2h4v2zm0-4h-4V9h4v4z"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black tracking-wider uppercase bg-white text-red-700 px-2 py-0.5 rounded-full shadow-sm">
                    Emergency SOS
                  </span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                </div>
                <h2 className="text-xl font-black tracking-tight text-white mt-0.5">Emergency Assistance</h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center transition"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-xs text-red-100 font-medium mt-2 leading-relaxed">
            If you are in immediate danger or need urgent help, tap a number below to connect instantly.
          </p>
        </div>

        {/* Modal Body: Only Emergency Helplines */}
        <div className="p-5 space-y-4">

          {/* 1. Official 24x7 Helpline • Police 112 / 100 */}
          <div className="bg-red-50/80 border-2 border-red-500 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                    Official 24x7 Helpline
                  </span>
                  <span className="text-[11px] font-bold text-red-700">All India Coverage</span>
                </div>
                <h3 className="text-lg font-black text-gray-900 mt-1">Call 112 • National Emergency</h3>
                <p className="text-xs text-gray-600 mt-0.5 leading-snug">
                  Direct connection to Police, Ambulance, and Fire Control Room.
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={`tel:${EMERGENCY_NUMBERS.NATIONAL_POLICE}`}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 text-center text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                </svg>
                <span>Call 112</span>
              </a>

              <a
                href={`tel:${EMERGENCY_NUMBERS.POLICE_LOCAL}`}
                className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95 text-center text-sm"
              >
                <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                </svg>
                <span>Call 100</span>
              </a>
            </div>
          </div>

          {/* 2. DriveMate Emergency Helpline */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg border border-slate-800">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-800/40">
                  DriveMate Emergency Team
                </span>
                <h3 className="text-base font-bold text-white mt-1">Emergency 🚨</h3>
                <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                  Speak directly with our dedicated emergency support line.
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              {EMERGENCY_NUMBERS.EMERGENCY_CONTACTS.map((contact, idx) => (
                <a
                  key={idx}
                  href={`tel:${contact.number}`}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                  </svg>
                  <span>Emergency 🚨 {contact.display}</span>
                </a>
              ))}
            </div>
          </div>

          {/* 
            ==================================================================
            OTHER SECTIONS COMMENTED OUT AS PER USER REQUEST:
            - Call Family / Alternate Contact
            - Read This To Emergency Operator Card (Passenger, Driver, GPS)
            - WhatsApp Trip Sharing
            - Emergency Audio Siren
            - Safety Tip
            ==================================================================
          */}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center text-xs">
          <span className="text-gray-400 font-medium">DriveMate 24x7 Safety Protocol</span>
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-4 py-1.5 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerSosModal;
