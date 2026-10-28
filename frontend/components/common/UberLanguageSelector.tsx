import React, { useState } from 'react';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../../context/LanguageContext';

interface UberLanguageSelectorProps {
  variant?: 'navbar' | 'light' | 'inline';
  className?: string;
}

export const UberLanguageSelector: React.FC<UberLanguageSelectorProps> = ({ 
  variant = 'navbar', 
  className = '' 
}) => {
  const { 
    language, 
    setLanguage, 
    currentLanguage, 
    t, 
    isLanguageModalOpen, 
    openLanguageModal, 
    closeLanguageModal 
  } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(lang => 
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    closeLanguageModal();
  };

  return (
    <>
      {/* Trigger Button based on Variant */}
      {variant === 'navbar' && (
        <button
          type="button"
          onClick={openLanguageModal}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold border border-neutral-700/80 shadow-xs transition active:scale-95 ${className}`}
          title="Select Language"
        >
          {/* Globe Icon */}
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <span className="font-bold tracking-tight">{currentLanguage.nativeName}</span>
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {variant === 'light' && (
        <button
          type="button"
          onClick={openLanguageModal}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white hover:bg-gray-100 text-gray-900 text-xs font-semibold border border-gray-300 shadow-xs transition active:scale-95 ${className}`}
          title="Select Language"
        >
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <span className="font-bold">{currentLanguage.nativeName}</span>
          <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {variant === 'inline' && (
        <div 
          onClick={openLanguageModal}
          className={`flex items-center justify-between p-3.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 cursor-pointer transition active:scale-[0.99] ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shadow-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">{t('profile.app_language', 'App Language')}</p>
              <p className="text-[11px] text-gray-500">{currentLanguage.nativeName} ({currentLanguage.englishName})</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs">
            <span>Change</span>
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Uber-style Language Modal */}
      {isLanguageModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-150"
          onClick={closeLanguageModal}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 leading-tight">
                    {t('lang.title', 'Select your preferred language')}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t('lang.subtitle', 'Choose the language you would like to use across DriveMate')}
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={closeLanguageModal}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black flex items-center justify-center transition"
                title="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search Input */}
            <div className="px-5 pt-4 pb-2">
              <div className="relative">
                <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('lang.search', 'Search language...')}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black focus:border-black outline-none transition"
                />
              </div>
            </div>

            {/* Languages List */}
            <div className="flex-1 overflow-y-auto p-5 pt-2 space-y-2">
              {filteredLanguages.map((lang) => {
                const isSelected = language === lang.code;

                return (
                  <div
                    key={lang.code}
                    onClick={() => handleSelect(lang.code)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected 
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm' 
                        : 'bg-white hover:bg-gray-50/90 text-gray-900 border-gray-200'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <p className={`text-base font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {lang.nativeName}
                      </p>
                      <p className={`text-xs ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                        {lang.englishName}
                      </p>
                    </div>

                    {/* Uber Radio Checkmark Indicator */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'bg-white text-black' 
                        : 'border-2 border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredLanguages.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No languages found matching "{searchQuery}"
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                {currentLanguage.nativeName} ({currentLanguage.englishName})
              </span>
              <button 
                type="button" 
                onClick={closeLanguageModal}
                className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition shadow-sm active:scale-95"
              >
                {t('lang.done', 'Done')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UberLanguageSelector;
