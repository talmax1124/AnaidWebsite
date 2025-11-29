export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ShippingRate {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
  carrier: 'USPS' | 'UPS' | 'FedEx' | 'DHL';
  serviceType: 'standard' | 'expedited' | 'overnight' | 'priority';
}

export interface ShippingCalculationRequest {
  items: Array<{
    id: string;
    weight: number; // in ounces
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    value: number;
    quantity: number;
  }>;
  fromAddress: {
    zipCode: string;
    state: string;
    country: string;
  };
  toAddress: {
    zipCode: string;
    state: string;
    country: string;
  };
}

class ShippingService {
  private readonly baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Calculate shipping rates based on items and addresses
  async calculateShippingRates(request: ShippingCalculationRequest): Promise<ShippingRate[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/shipping/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate shipping rates');
      }

      return await response.json();
    } catch (error) {
      console.error('Error calculating shipping rates:', error);
      // Return fallback rates
      return this.getFallbackShippingRates();
    }
  }

  // Validate shipping address
  async validateAddress(address: Partial<ShippingAddress>): Promise<{
    valid: boolean;
    suggestions?: ShippingAddress[];
    errors?: string[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/shipping/validate-address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(address),
      });

      if (!response.ok) {
        throw new Error('Failed to validate address');
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating address:', error);
      return { valid: false, errors: ['Address validation service unavailable'] };
    }
  }

  // Get shipping zones and rates
  async getShippingZones(): Promise<Array<{
    id: string;
    name: string;
    countries: string[];
    states?: string[];
    baseRate: number;
    ratePerPound: number;
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/shipping/zones`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch shipping zones');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching shipping zones:', error);
      return this.getFallbackShippingZones();
    }
  }

  // Get address autocomplete suggestions
  async getAddressSuggestions(input: string): Promise<Array<{
    description: string;
    placeId: string;
    structured: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/shipping/address-autocomplete?input=${encodeURIComponent(input)}`);
      
      if (!response.ok) {
        throw new Error('Failed to get address suggestions');
      }

      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error getting address suggestions:', error);
      return [];
    }
  }

  // Get full address details from place ID
  async getAddressFromPlaceId(placeId: string): Promise<ShippingAddress | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/shipping/place-details?placeId=${placeId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get place details');
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }

  // Calculate package dimensions and weight
  calculatePackageDimensions(items: Array<{ weight: number; dimensions?: any; quantity: number }>) {
    let totalWeight = 0;
    let totalVolume = 0;

    items.forEach(item => {
      totalWeight += (item.weight || 4) * item.quantity; // default 4 oz per item

      if (item.dimensions) {
        const volume = item.dimensions.length * item.dimensions.width * item.dimensions.height;
        totalVolume += volume * item.quantity;
      } else {
        // Default dimensions for beauty products (4x4x2 inches)
        totalVolume += (4 * 4 * 2) * item.quantity;
      }
    });

    // Calculate estimated package dimensions based on total volume
    const cubeRoot = Math.cbrt(totalVolume);
    const estimatedDimensions = {
      length: Math.max(6, Math.round(cubeRoot * 1.2)),
      width: Math.max(4, Math.round(cubeRoot)),
      height: Math.max(2, Math.round(cubeRoot * 0.8)),
    };

    return {
      totalWeight,
      totalVolume,
      estimatedDimensions,
    };
  }

  // Fallback shipping rates when API is unavailable
  private getFallbackShippingRates(): ShippingRate[] {
    return [
      {
        id: 'usps-standard',
        name: 'USPS Ground Advantage',
        description: 'Standard shipping',
        price: 8.99,
        estimatedDays: '3-5 business days',
        carrier: 'USPS',
        serviceType: 'standard',
      },
      {
        id: 'usps-priority',
        name: 'USPS Priority Mail',
        description: 'Faster delivery with tracking',
        price: 15.99,
        estimatedDays: '1-3 business days',
        carrier: 'USPS',
        serviceType: 'priority',
      },
      {
        id: 'ups-ground',
        name: 'UPS Ground',
        description: 'Reliable ground shipping',
        price: 12.99,
        estimatedDays: '2-5 business days',
        carrier: 'UPS',
        serviceType: 'standard',
      },
      {
        id: 'fedex-2day',
        name: 'FedEx 2Day',
        description: 'Fast 2-day delivery',
        price: 24.99,
        estimatedDays: '2 business days',
        carrier: 'FedEx',
        serviceType: 'expedited',
      },
    ];
  }

  // Fallback shipping zones
  private getFallbackShippingZones() {
    return [
      {
        id: 'domestic-us',
        name: 'United States',
        countries: ['US'],
        baseRate: 8.99,
        ratePerPound: 2.50,
      },
      {
        id: 'canada',
        name: 'Canada',
        countries: ['CA'],
        baseRate: 15.99,
        ratePerPound: 4.00,
      },
      {
        id: 'international',
        name: 'International',
        countries: ['*'],
        baseRate: 25.99,
        ratePerPound: 8.00,
      },
    ];
  }

  // Utility to format address for display
  formatAddress(address: ShippingAddress): string {
    const parts = [
      address.street,
      address.apartment ? `Apt ${address.apartment}` : '',
      `${address.city}, ${address.state} ${address.zipCode}`,
      address.country !== 'US' ? address.country : '',
    ].filter(Boolean);

    return parts.join(', ');
  }

  // Validate required shipping fields
  validateShippingFields(address: Partial<ShippingAddress>): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};
    const required = [
      'firstName',
      'lastName', 
      'email',
      'phone',
      'street',
      'city',
      'state',
      'zipCode',
      'country'
    ];

    required.forEach(field => {
      if (!address[field as keyof ShippingAddress]?.trim()) {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });

    // Email validation
    if (address.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (address.phone && !/^\+?[\d\s\-\(\)]{10,}$/.test(address.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    // ZIP code validation for US
    if (address.country === 'US' && address.zipCode && !/^\d{5}(-\d{4})?$/.test(address.zipCode)) {
      errors.zipCode = 'Please enter a valid ZIP code (12345 or 12345-6789)';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

export const shippingService = new ShippingService();
export default shippingService;