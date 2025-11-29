import React, { useState, useEffect } from 'react';
import { Truck, Package, Clock, MapPin, User, Mail, Phone, CreditCard } from 'lucide-react';
import AddressAutocomplete from './AddressAutocomplete';
import { shippingService, ShippingAddress, ShippingRate } from '../services/shippingService';

interface ShippingFormProps {
  cartItems: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    weight?: number;
    value?: number;
  }>;
  onShippingChange: (address: ShippingAddress, rate: ShippingRate | null) => void;
  initialAddress?: Partial<ShippingAddress>;
  showRates?: boolean;
  className?: string;
}

interface FormErrors {
  [key: string]: string;
}

const ShippingForm: React.FC<ShippingFormProps> = ({
  cartItems,
  onShippingChange,
  initialAddress = {},
  showRates = true,
  className = '',
}) => {
  const [address, setAddress] = useState<ShippingAddress>({
    firstName: initialAddress.firstName || '',
    lastName: initialAddress.lastName || '',
    email: initialAddress.email || '',
    phone: initialAddress.phone || '',
    street: initialAddress.street || '',
    apartment: initialAddress.apartment || '',
    city: initialAddress.city || '',
    state: initialAddress.state || '',
    zipCode: initialAddress.zipCode || '',
    country: initialAddress.country || 'US',
  });

  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);

  // Update parent when address or rate changes
  useEffect(() => {
    onShippingChange(address, selectedRate);
  }, [address, selectedRate, onShippingChange]);

  // Fetch shipping rates when address is complete
  useEffect(() => {
    const fetchShippingRates = async () => {
      if (!address.zipCode || !address.state || !address.country || !showRates) {
        setShippingRates([]);
        setSelectedRate(null);
        return;
      }

      setIsLoadingRates(true);
      try {
        const request = {
          items: cartItems.map(item => ({
            id: item.id,
            weight: item.weight || 4, // Default 4 oz for beauty products
            value: item.price,
            quantity: item.quantity,
          })),
          fromAddress: {
            zipCode: '90210', // Business address
            state: 'CA',
            country: 'US',
          },
          toAddress: {
            zipCode: address.zipCode,
            state: address.state,
            country: address.country,
          },
        };

        const rates = await shippingService.calculateShippingRates(request);
        setShippingRates(rates);

        // Auto-select the cheapest option
        if (rates.length > 0 && !selectedRate) {
          setSelectedRate(rates[0]);
        }
      } catch (error) {
        console.error('Error fetching shipping rates:', error);
        setShippingRates([]);
      } finally {
        setIsLoadingRates(false);
      }
    };

    const timeoutId = setTimeout(fetchShippingRates, 500);
    return () => clearTimeout(timeoutId);
  }, [address.zipCode, address.state, address.country, cartItems, showRates]);

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddressAutocomplete = (addressData: any) => {
    setAddress(prev => ({
      ...prev,
      street: addressData.street || '',
      city: addressData.city || '',
      state: addressData.state || '',
      zipCode: addressData.zipCode || '',
      country: addressData.country || 'US',
    }));
  };

  const validateAddress = async () => {
    setIsValidatingAddress(true);
    try {
      const validation = shippingService.validateShippingFields(address);
      setErrors(validation.errors);
      
      if (validation.isValid) {
        const addressValidation = await shippingService.validateAddress(address);
        if (!addressValidation.valid && addressValidation.errors) {
          setErrors(prev => ({ ...prev, general: addressValidation.errors!.join(', ') }));
        }
      }
      
      return validation.isValid;
    } catch (error) {
      console.error('Error validating address:', error);
      setErrors(prev => ({ ...prev, general: 'Address validation failed' }));
      return false;
    } finally {
      setIsValidatingAddress(false);
    }
  };

  const handleRateSelection = (rate: ShippingRate) => {
    setSelectedRate(rate);
  };

  const getCarrierIcon = (carrier: string) => {
    switch (carrier) {
      case 'USPS': return '🇺🇸';
      case 'UPS': return '📦';
      case 'FedEx': return '✈️';
      case 'DHL': return '🌍';
      default: return '🚛';
    }
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'FREE' : `$${price.toFixed(2)}`;
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-primary-100 p-2 rounded-lg">
          <Truck className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Shipping Information</h2>
          <p className="text-gray-600">Enter your delivery address for shipping calculations</p>
        </div>
      </div>

      {/* General error */}
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{errors.general}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={address.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className={`w-full px-4 py-3 pl-11 border-2 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 ${
                errors.firstName ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="John"
              required
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={address.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className={`w-full px-4 py-3 pl-11 border-2 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 ${
                errors.lastName ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="Doe"
              required
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              value={address.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-4 py-3 pl-11 border-2 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 ${
                errors.email ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="john.doe@example.com"
              required
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              value={address.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full px-4 py-3 pl-11 border-2 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 ${
                errors.phone ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="(555) 123-4567"
              required
            />
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>
      </div>

      {/* Address Autocomplete */}
      <div className="mb-4">
        <AddressAutocomplete
          label="Street Address"
          placeholder="Start typing your address..."
          value={address.street}
          onAddressSelect={handleAddressAutocomplete}
          required
          error={errors.street}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Apartment/Unit */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apartment/Unit
          </label>
          <input
            type="text"
            value={address.apartment}
            onChange={(e) => handleInputChange('apartment', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200"
            placeholder="Apt 4B"
          />
        </div>

        {/* City */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={address.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 ${
              errors.city ? 'border-red-300' : 'border-gray-200'
            }`}
            placeholder="New York"
            required
          />
          {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
        </div>

        {/* State */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={address.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 ${
              errors.state ? 'border-red-300' : 'border-gray-200'
            }`}
            placeholder="NY"
            maxLength={2}
            required
          />
          {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* ZIP Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ZIP Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={address.zipCode}
            onChange={(e) => handleInputChange('zipCode', e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 ${
              errors.zipCode ? 'border-red-300' : 'border-gray-200'
            }`}
            placeholder="10001"
            required
          />
          {errors.zipCode && <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>}
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country <span className="text-red-500">*</span>
          </label>
          <select
            value={address.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200"
            required
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
          </select>
        </div>
      </div>

      {/* Validate Address Button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={validateAddress}
          disabled={isValidatingAddress}
          className="btn-secondary flex items-center space-x-2"
        >
          {isValidatingAddress ? (
            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
          <span>{isValidatingAddress ? 'Validating...' : 'Validate Address'}</span>
        </button>
      </div>

      {/* Shipping Rates */}
      {showRates && address.zipCode && address.state && (
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center space-x-3 mb-4">
            <Package className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Shipping Options</h3>
          </div>

          {isLoadingRates ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-3" />
              <span className="text-gray-600">Calculating shipping rates...</span>
            </div>
          ) : shippingRates.length > 0 ? (
            <div className="space-y-3">
              {shippingRates.map((rate) => (
                <label
                  key={rate.id}
                  className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    selectedRate?.id === rate.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="shippingRate"
                    value={rate.id}
                    checked={selectedRate?.id === rate.id}
                    onChange={() => handleRateSelection(rate)}
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  
                  <div className="flex-1 ml-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getCarrierIcon(rate.carrier)}</span>
                        <div>
                          <div className="font-semibold text-gray-900">{rate.name}</div>
                          <div className="text-sm text-gray-600">{rate.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-gray-900">
                          {formatPrice(rate.price)}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {rate.estimatedDays}
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No shipping rates available for this address</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShippingForm;