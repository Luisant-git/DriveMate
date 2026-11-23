import React, { useState, useRef, useEffect } from 'react';

interface CityMultiSelectProps {
  selectedCities: string[];
  onChange: (cities: string[]) => void;
  availableCities: string[];
  placeholder?: string;
}

export default function CityMultiSelect({
  selectedCities = [],
  onChange,
  availableCities = [],
  placeholder = 'Select cities (or leave empty for All Cities)'
}: CityMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Merge available cities with any previously selected cities that might not be in the list
  const allUniqueCities = Array.from(
    new Set([...availableCities, ...selectedCities].filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const filteredCities = allUniqueCities.filter(c =>
    c.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const toggleCity = (city: string) => {
    if (selectedCities.includes(city)) {
      onChange(selectedCities.filter(c => c !== city));
    } else {
      onChange([...selectedCities, city]);
    }
  };

  const removeCity = (city: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedCities.filter(c => c !== city));
  };

  const handleSelectAll = () => {
    onChange([...allUniqueCities]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleAddCustomCity = () => {
    const trimmed = searchTerm.trim();
    if (trimmed && !allUniqueCities.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      onChange([...selectedCities, trimmed]);
      setSearchTerm('');
    }
  };

  const isAllSelected = allUniqueCities.length > 0 && selectedCities.length === allUniqueCities.length;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[42px] w-full border border-gray-300 rounded-xl px-3 py-1.5 bg-white cursor-pointer hover:border-[#0B192C] focus-within:ring-2 focus-within:ring-[#0B192C] transition flex flex-wrap items-center gap-1.5"
      >
        {selectedCities.length === 0 ? (
          <span className="text-xs sm:text-sm text-gray-400 flex items-center gap-1.5">
            <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-md border border-blue-200">
              All Cities (Default)
            </span>
            <span className="text-gray-400 hidden sm:inline text-xs">— Click to select specific cities</span>
          </span>
        ) : (
          selectedCities.map(city => (
            <span
              key={city}
              className="inline-flex items-center gap-1 bg-[#0B192C] text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-xs"
            >
              <span>{city}</span>
              <button
                type="button"
                onClick={(e) => removeCity(city, e)}
                className="hover:text-red-300 p-0.5 rounded-full transition cursor-pointer"
                title={`Remove ${city}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))
        )}

        {/* Dropdown Chevron */}
        <div className="ml-auto pl-2 text-gray-400">
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in duration-150">
          {/* Search Bar */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <input
                type="text"
                placeholder="Search city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomCity();
                  }
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B192C] focus:border-[#0B192C]"
                autoFocus
              />
              <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between text-[11px] bg-white">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={isAllSelected}
              className="font-bold text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer"
            >
              Select All ({allUniqueCities.length})
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={selectedCities.length === 0}
              className="font-bold text-red-600 hover:text-red-800 disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer"
            >
              Clear All (Default: All Cities)
            </button>
          </div>

          {/* City Options List */}
          <div className="max-h-52 overflow-y-auto divide-y divide-gray-50 p-1">
            {filteredCities.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-gray-500 mb-2">No matching city found.</p>
                {searchTerm.trim() && (
                  <button
                    type="button"
                    onClick={handleAddCustomCity}
                    className="text-xs bg-[#0B192C] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-[#1E3E62] transition"
                  >
                    + Add "{searchTerm.trim()}"
                  </button>
                )}
              </div>
            ) : (
              filteredCities.map(city => {
                const isSelected = selectedCities.includes(city);
                return (
                  <div
                    key={city}
                    onClick={() => toggleCity(city)}
                    className={`flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition ${
                      isSelected
                        ? 'bg-[#0B192C]/5 text-[#0B192C]'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by div
                        className="rounded border-gray-300 text-[#0B192C] focus:ring-[#0B192C] h-3.5 w-3.5 cursor-pointer pointer-events-none"
                      />
                      <span>{city}</span>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] bg-[#0B192C] text-white px-1.5 py-0.5 rounded font-bold">
                        Selected
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="bg-gray-50 px-3 py-1.5 text-[10px] text-gray-500 border-t border-gray-100 flex items-center justify-between">
            <span>
              {selectedCities.length === 0
                ? 'Applies to: All Cities'
                : `Selected ${selectedCities.length} of ${allUniqueCities.length} cities`}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#0B192C] font-bold hover:underline"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

