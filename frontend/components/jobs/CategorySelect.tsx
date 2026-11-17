import React, { useEffect, useMemo, useRef, useState } from 'react';
import { JOB_CATEGORIES } from '../../constants/jobRoles';

interface CategorySelectProps {
  value: string;
  onChange: (category: string) => void;
  placeholder?: string;
}

/**
 * Searchable dropdown for filtering by job category.
 * Supports typing to narrow down categories and resetting back to "All Categories".
 */
const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  placeholder = 'All Categories',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Show full list when input equals the currently selected category so user can switch easily
    if (!q || q === value.toLowerCase()) return JOB_CATEGORIES;
    return JOB_CATEGORIES.filter(c => c.toLowerCase().includes(q));
  }, [query, value]);

  const handleSelect = (category: string) => {
    onChange(category);
    setQuery(category);
    setOpen(false);
  };

  return (
    <div className="relative w-52" ref={wrapperRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={e => {
          const next = e.target.value;
          setQuery(next);
          setOpen(true);
          if (!next.trim()) onChange('');
        }}
        className="w-full px-3 py-2 pr-14 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0B192C]"
      />
      {value && (
        <button
          type="button"
          onClick={() => handleSelect('')}
          title="Clear category"
          className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0B192C] text-xs font-bold px-1"
        >
          ×
        </button>
      )}
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>

      {open && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          <button
            type="button"
            onClick={() => handleSelect('')}
            className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 hover:bg-gray-50 ${
              value === '' ? 'font-bold text-black bg-gray-50' : 'font-medium text-gray-600'
            }`}
          >
            All Categories
          </button>
          {matches.length === 0 ? (
            <p className="px-3 py-3 text-xs text-gray-400">No matching categories</p>
          ) : (
            matches.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelect(cat)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                  value === cat ? 'font-bold text-black bg-gray-50' : 'text-gray-700'
                }`}
              >
                {cat}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CategorySelect;

