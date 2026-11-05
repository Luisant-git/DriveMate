import React, { useState } from 'react';

interface LocalitySelectProps {
  /** Localities of the city chosen above the field */
  options: string[];
  /** Localities already picked */
  selected: string[];
  onAdd: (locality: string) => void;
  disabled?: boolean;
  max?: number;
  placeholder?: string;
}

const ChevronDown = () => (
  <svg
    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

/**
 * Locality picker. A plain dropdown that lists every area of the chosen city as
 * soon as it is opened — nothing to search for. A city with no built-in list
 * falls back to typing the area, so no locality is ever blocked.
 */
const LocalitySelect: React.FC<LocalitySelectProps> = ({
  options,
  selected,
  onAdd,
  disabled = false,
  max = 5,
  placeholder = 'Select a locality',
}) => {
  const [typed, setTyped] = useState('');
  const isFull = selected.length >= max;

  // City chosen but it has no built-in list — accept a typed area instead
  if (!disabled && options.length === 0) {
    return (
      <input
        type="text"
        disabled={isFull}
        placeholder={isFull ? `${max} localities selected` : 'Type a locality and press Enter'}
        className="w-full bg-gray-100 border-none rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-900 placeholder:text-sm placeholder:font-medium placeholder:text-gray-500 focus:ring-2 focus:ring-black disabled:opacity-60"
        value={typed}
        onChange={e => setTyped(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const value = typed.trim();
            if (!value) return;
            onAdd(value);
            setTyped('');
          }
        }}
      />
    );
  }

  const available = options.filter(o => !selected.includes(o));

  return (
    <div className="relative">
      <select
        value=""
        disabled={disabled || isFull || available.length === 0}
        onChange={e => {
          if (e.target.value) onAdd(e.target.value);
        }}
        className="w-full appearance-none bg-gray-100 border-none rounded-lg pl-3 pr-9 py-2.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-black disabled:opacity-60 cursor-pointer"
      >
        <option value="">
          {isFull
            ? `${max} localities selected`
            : disabled
              ? 'Select a city first'
              : available.length === 0
                ? 'All localities selected'
                : placeholder}
        </option>
        {available.map(loc => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </select>
      <ChevronDown />
    </div>
  );
};

export default LocalitySelect;
