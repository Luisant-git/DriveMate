import React, { useState, useEffect, useRef } from 'react';
import { getPlaceAutocomplete } from '../api/maps.js';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  showMyLocation?: boolean;
}

interface Suggestion {
  description: string;
  place_id: string;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  showMyLocation = false
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (input: string) => {
    if (input.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const response = await getPlaceAutocomplete(input);
      if (response.success && response.suggestions) {
        setSuggestions(response.suggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    console.log('Suggestion clicked:', suggestion.description);
    onChange(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleMyLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyAfUP27GUuOL0cBm_ROdjE2n6EyVKesIu8`
            );
            const data = await response.json();
            if (data.results && data.results[0]) {
              onChange(data.results[0].formatted_address);
              setShowSuggestions(false);
            }
          } catch (error) {
            console.error('Error getting location:', error);
            alert('Failed to get your location');
          } finally {
            setGettingLocation(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Please enable location access');
          setGettingLocation(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
      setGettingLocation(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`w-full ${className}`}
        onFocus={() => {
          if (showMyLocation || (value.length >= 1 && suggestions.length > 0)) {
            setShowSuggestions(true);
          }
        }}
      />
      
      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {showMyLocation && (
            <button
              onClick={handleMyLocation}
              disabled={gettingLocation}
              className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-200 text-sm transition-colors bg-blue-50/50"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                </svg>
                <span className="font-bold text-blue-600">
                  {gettingLocation ? 'Getting location...' : 'My Location'}
                </span>
              </div>
            </button>
          )}
          {value.length === 0 && !loading && (
            <div className="p-3 text-center text-gray-400 text-xs">
              Start typing to search locations
            </div>
          )}
          {loading ? (
            <div className="p-3 text-center text-gray-500 text-sm">
              <div className="animate-spin inline-block w-4 h-4 border-2 border-gray-300 border-t-black rounded-full mr-2"></div>
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <button
                key={suggestion.place_id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-sm transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate font-medium">{suggestion.description}</span>
                </div>
              </button>
            ))
          ) : value.length >= 1 ? (
            <div className="p-3 text-center text-gray-500 text-sm">
              No locations found for "{value}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;