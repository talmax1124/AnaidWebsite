import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Check, X } from 'lucide-react';
import { shippingService } from '../services/shippingService';

interface AddressAutocompleteSuggestion {
  description: string;
  placeId: string;
  structured: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: any) => void;
  placeholder?: string;
  required?: boolean;
  label?: string;
  value?: string;
  error?: string;
  className?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onAddressSelect,
  placeholder = 'Enter your address',
  required = false,
  label = 'Address',
  value = '',
  error,
  className = '',
}) => {
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressAutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInput(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await shippingService.getAddressSuggestions(query);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInput(newValue);
    
    // Debounce API calls
    const timeoutId = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleSuggestionSelect = async (suggestion: AddressAutocompleteSuggestion) => {
    setInput(suggestion.structured.street || suggestion.description.split(',')[0]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    try {
      const addressDetails = await shippingService.getAddressFromPlaceId(suggestion.placeId);
      if (addressDetails) {
        onAddressSelect(addressDetails);
      } else {
        // Fallback to structured data from suggestion
        onAddressSelect({
          street: suggestion.structured.street || '',
          city: suggestion.structured.city || '',
          state: suggestion.structured.state || '',
          zipCode: suggestion.structured.zipCode || '',
          country: suggestion.structured.country || 'US',
        });
      }
    } catch (error) {
      console.error('Error fetching address details:', error);
      // Use structured data as fallback
      onAddressSelect({
        street: suggestion.structured.street || '',
        city: suggestion.structured.city || '',
        state: suggestion.structured.state || '',
        zipCode: suggestion.structured.zipCode || '',
        country: suggestion.structured.country || 'US',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div className={`relative ${className}`} autoComplete="off">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          autoComplete="new-password"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          data-form-type="other"
          data-lpignore="true"
          className={`
            w-full px-4 py-3 pl-11 pr-4
            bg-white border-2 rounded-xl
            focus:ring-2 focus:ring-primary-200 focus:border-primary-500
            transition-all duration-200
            ${error ? 'border-red-300' : 'border-gray-200'}
          `}
        />
        
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <MapPin className="w-5 h-5 text-gray-400" />
        </div>
        
        {isLoading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <X className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.placeId}
              onClick={() => handleSuggestionSelect(suggestion)}
              className={`
                w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors
                flex items-center space-x-3
                ${index === selectedIndex ? 'bg-primary-50 border-l-4 border-primary-500' : ''}
                ${index === 0 ? 'rounded-t-xl' : ''}
                ${index === suggestions.length - 1 ? 'rounded-b-xl' : 'border-b border-gray-100'}
              `}
            >
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {suggestion.description}
                </div>
                {suggestion.structured.city && suggestion.structured.state && (
                  <div className="text-xs text-gray-500 truncate">
                    {suggestion.structured.city}, {suggestion.structured.state} {suggestion.structured.zipCode}
                  </div>
                )}
              </div>
              {index === selectedIndex && (
                <Check className="w-4 h-4 text-primary-500 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;