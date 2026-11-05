import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ROLE_OPTIONS } from '../../constants/jobRoles';

interface JobRoleSelectProps {
  category: string;
  role: string;
  onChange: (category: string, role: string) => void;
  required?: boolean;
  placeholder?: string;
  inputClassName?: string;
}

/**
 * Searchable role picker. Roles are grouped under their job category —
 * typing filters both categories and roles, and free text is accepted.
 */
const JobRoleSelect: React.FC<JobRoleSelectProps> = ({
  category,
  role,
  onChange,
  required = false,
  placeholder = 'Type or select a role',
  inputClassName = 'w-full bg-gray-100 border-none rounded-lg pl-3 pr-9 py-2.5 text-sm font-semibold text-gray-900 placeholder:text-sm placeholder:font-medium placeholder:text-gray-500 focus:ring-2 focus:ring-black',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(role);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Keep the visible text in sync when the role is set from outside (e.g. form reset)
  useEffect(() => {
    setQuery(role);
  }, [role]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? ROLE_OPTIONS.filter(o => o.role.toLowerCase().includes(q) || o.category.toLowerCase().includes(q))
      : ROLE_OPTIONS;

    const map = new Map<string, string[]>();
    matches.forEach(o => {
      const list = map.get(o.category) || [];
      list.push(o.role);
      map.set(o.category, list);
    });
    return Array.from(map.entries()).slice(0, 40);
  }, [query]);

  const totalMatches = grouped.reduce((sum, [, roles]) => sum + roles.length, 0);

  const handleSelect = (roleCategory: string, selectedRole: string) => {
    onChange(roleCategory, selectedRole);
    setQuery(selectedRole);
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
          // Typing keeps the category only while it still matches the text
          const exact = ROLE_OPTIONS.find(o => o.role.toLowerCase() === typed.trim().toLowerCase());
          onChange(exact ? exact.category : '', typed);
        }}
      />
      {/* Anchored to the input centre; the category caption below shifts top-1/2 */}
      <svg
        className="pointer-events-none absolute right-3 top-5 -translate-y-1/2 w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
      {open && totalMatches > 0 && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {grouped.map(([groupName, roles]) => (
            <div key={groupName}>
              <p className="px-3 pt-2 pb-1 text-[11px] font-black text-gray-400 uppercase tracking-wide bg-gray-50 sticky top-0">
                {groupName}
              </p>
              {roles.map(r => (
                <button
                  key={`${groupName}-${r}`}
                  type="button"
                  onClick={() => handleSelect(groupName, r)}
                  className={`w-full text-left px-3 py-2 text-sm font-semibold hover:bg-gray-50 ${
                    role === r && category === groupName ? 'font-bold text-black' : 'text-gray-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
      {category && (
        <p className="text-[11px] font-semibold text-gray-500 mt-1">Category: <span className="font-bold text-gray-700">{category}</span></p>
      )}
    </div>
  );
};

export default JobRoleSelect;
