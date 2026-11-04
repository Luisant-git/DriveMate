import React, { useEffect, useMemo, useRef, useState } from 'react';
import { INDIA_CITIES } from '../../constants/cities';

interface CitySelectProps {
  value: string;
  onChange: (city: string) => void;
  required?: boolean;
  placeholder?: string;
  inputClassName?: string;
}

/**
 * Searchable city picker. Typing filters the city list, and free text is
 * accepted so towns that are not in the list can still be entered.
 */
const CitySelect: React.FC<CitySelectProps> = ({
  value,
  onChange,
  required = false,
  placeholder = 'Type or select a city',
  inputClassName = 'w-full bg-gray-100 border-none rounded-lg px-3 py-3 text-base font-semibold text-gray-900 placeholder:text-sm placeholder:font-medium placeholder:text-gray-500 focus:ring-2 focus:ring-black',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Keep the visible text in sync when the city is set from outside (e.g. form reset)
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INDIA_CITIES.slice(0, 40);
    return INDIA_CITIES.filter(c => c.toLowerCase().includes(q)).slice(0, 40);
  }, [query]);

  const handleSelect = (city: string) => {
    onChange(city);
    setQuery(city);
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        required={required}
        placeholder={placeholder}
        className={inputClassName}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={e => {
          const typed = e.target.value;
          setQuery(typed);
          setOpen(true);
          onChange(typed);
        }}
      />
      {open && matches.length > 0 && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {matches.map(city => (
            <button
              key={city}
              type="button"
              onClick={() => handleSelect(city)}
              className={`w-full text-left px-3 py-2 text-sm font-semibold hover:bg-gray-50 ${
                value === city ? 'font-bold text-black' : 'text-gray-700'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CitySelect;
