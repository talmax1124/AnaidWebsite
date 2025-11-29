// Temporarily disable SHIPPO to allow backend to start
// const shippo = require('shippo');
// const shippoClient = new shippo(process.env.SHIPPO_API_KEY || 'test');

// Mock SHIPPO object for now
const shippo = {
  address: { create: () => Promise.resolve({ validation_results: { is_valid: true } }) },
  shipment: { create: () => Promise.resolve({ rates: [] }) },
  transaction: { create: () => Promise.resolve({}) },
  track: { create: () => Promise.resolve({}) }
};

class ShippoService {
  // Validate and format address using SHIPPO
  static async validateAddress(address) {
    try {
      const shippoAddress = {
        name: `${address.firstName} ${address.lastName}`,
        street1: address.street,
        street2: address.street2 || '',
        city: address.city,
        state: address.state,
        zip: address.zipCode,
        country: address.country || 'US',
        phone: address.phone || '',
        email: address.email || ''
      };

      // Use SHIPPO address validation
      const validatedAddress = await shippo.address.create(shippoAddress);
      
      return {
        success: true,
        valid: validatedAddress.validation_results?.is_valid !== false,
        formatted: {
          firstName: address.firstName,
          lastName: address.lastName,
          street: validatedAddress.street1,
          street2: validatedAddress.street2 || '',
          city: validatedAddress.city,
          state: validatedAddress.state,
          zipCode: validatedAddress.zip,
          country: validatedAddress.country,
          phone: address.phone || '',
          email: address.email || ''
        },
        messages: validatedAddress.validation_results?.messages || []
      };
    } catch (error) {
      console.error('SHIPPO address validation error:', error);
      
      // Fallback to basic validation
      return {
        success: true,
        valid: true,
        formatted: address,
        messages: ['Using fallback validation']
      };
    }
  }

  // Get shipping rates from SHIPPO
  static async getShippingRates(fromAddress, toAddress, parcels) {
    try {
      // Create shipment object
      const shipment = await shippo.shipment.create({
        address_from: fromAddress,
        address_to: toAddress,
        parcels: parcels,
        async: false
      });

      if (!shipment.rates || shipment.rates.length === 0) {
        throw new Error('No shipping rates available');
      }

      // Transform SHIPPO rates to our format
      const rates = shipment.rates.map(rate => ({
        id: rate.object_id,
        name: `${rate.provider} ${rate.servicelevel.name}`,
        description: rate.servicelevel.name,
        price: parseFloat(rate.amount),
        estimatedDays: rate.estimated_days ? `${rate.estimated_days} business days` : 'Unknown',
        carrier: rate.provider,
        serviceType: rate.servicelevel.token,
        shippoRateId: rate.object_id,
        currency: rate.currency
      }));

      // Sort by price (cheapest first)
      rates.sort((a, b) => a.price - b.price);

      return {
        success: true,
        rates: rates,
        shipmentId: shipment.object_id
      };

    } catch (error) {
      console.error('SHIPPO shipping rates error:', error);
      
      // Fallback to basic rates
      const fallbackRates = [
        {
          id: 'fallback-standard',
          name: 'Standard Shipping',
          description: 'Standard ground shipping',
          price: 8.99,
          estimatedDays: '5-7 business days',
          carrier: 'USPS',
          serviceType: 'standard'
        },
        {
          id: 'fallback-expedited',
          name: 'Expedited Shipping',
          description: 'Faster delivery',
          price: 15.99,
          estimatedDays: '2-3 business days',
          carrier: 'USPS',
          serviceType: 'expedited'
        }
      ];

      return {
        success: true,
        rates: fallbackRates,
        fallback: true
      };
    }
  }

  // Create shipping label
  static async createShippingLabel(rateId, orderData) {
    try {
      const transaction = await shippo.transaction.create({
        rate: rateId,
        label_file_type: 'PDF',
        async: false
      });

      return {
        success: true,
        labelUrl: transaction.label_url,
        trackingNumber: transaction.tracking_number,
        transactionId: transaction.object_id
      };

    } catch (error) {
      console.error('SHIPPO label creation error:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get address autocomplete suggestions using SHIPPO
  static async getAddressSuggestions(input) {
    try {
      // For now, we'll use a simple approach since SHIPPO doesn't have autocomplete
      // In a real implementation, you might combine SHIPPO validation with a geocoding service
      
      if (!input || input.length < 3) {
        return { success: true, suggestions: [] };
      }

      // Use basic logic to generate suggestions, then validate with SHIPPO
      const suggestions = await this.generateAddressSuggestions(input);
      
      // Validate the first few suggestions with SHIPPO
      const validatedSuggestions = [];
      for (let i = 0; i < Math.min(suggestions.length, 3); i++) {
        const suggestion = suggestions[i];
        try {
          const validation = await this.validateAddress(suggestion.structured);
          if (validation.valid) {
            validatedSuggestions.push({
              ...suggestion,
              structured: validation.formatted
            });
          }
        } catch (error) {
          // If validation fails, keep original suggestion
          validatedSuggestions.push(suggestion);
        }
      }

      return {
        success: true,
        suggestions: validatedSuggestions
      };

    } catch (error) {
      console.error('SHIPPO address suggestions error:', error);
      
      // Fallback to basic suggestions
      const fallbackSuggestions = await this.generateAddressSuggestions(input);
      return {
        success: true,
        suggestions: fallbackSuggestions
      };
    }
  }

  // Generate basic address suggestions (helper method)
  static async generateAddressSuggestions(input) {
    const uspsData = [
      { city: 'New York', state: 'NY', zip: '10001' },
      { city: 'Los Angeles', state: 'CA', zip: '90210' },
      { city: 'Chicago', state: 'IL', zip: '60601' },
      { city: 'Houston', state: 'TX', zip: '77001' },
      { city: 'Phoenix', state: 'AZ', zip: '85001' },
      { city: 'Philadelphia', state: 'PA', zip: '19101' },
      { city: 'San Antonio', state: 'TX', zip: '78201' },
      { city: 'San Diego', state: 'CA', zip: '92101' },
      { city: 'Dallas', state: 'TX', zip: '75201' },
      { city: 'San Jose', state: 'CA', zip: '95101' }
    ];

    const realStreetNames = ['Main', 'First', 'Second', 'Park', 'Washington', 'Elm', 'Lincoln', 'Maple', 'Oak', 'Pine'];
    const streetTypes = ['St', 'Ave', 'Dr', 'Ln', 'Blvd'];
    
    const suggestions = [];
    const inputLower = input.toLowerCase();
    
    // Check if input starts with a number (house number)
    const numberMatch = input.match(/^(\d+)\s*(.*)$/);
    if (numberMatch) {
      const houseNumber = numberMatch[1];
      const streetPortion = numberMatch[2].toLowerCase().trim();
      
      // Find matching cities
      const matchingCities = uspsData.filter(city => 
        !streetPortion || 
        city.city.toLowerCase().includes(streetPortion) || 
        city.state.toLowerCase().includes(streetPortion)
      );
      
      const citiesToUse = matchingCities.length > 0 ? matchingCities.slice(0, 3) : uspsData.slice(0, 3);
      
      citiesToUse.forEach((city, index) => {
        const street = realStreetNames[index % realStreetNames.length];
        const type = streetTypes[index % streetTypes.length];
        
        suggestions.push({
          description: `${houseNumber} ${street} ${type}, ${city.city}, ${city.state} ${city.zip}, USA`,
          placeId: `shippo-${houseNumber}-${index + 1}`,
          structured: {
            firstName: '',
            lastName: '',
            street: `${houseNumber} ${street} ${type}`,
            city: city.city,
            state: city.state,
            zipCode: city.zip,
            country: 'US',
            phone: '',
            email: ''
          }
        });
      });
    } else {
      // City or street name search
      const matchingCities = uspsData.filter(city =>
        city.city.toLowerCase().includes(inputLower) ||
        city.state.toLowerCase().includes(inputLower)
      );
      
      const citiesToUse = matchingCities.length > 0 ? matchingCities.slice(0, 3) : uspsData.slice(0, 3);
      
      citiesToUse.forEach((city, index) => {
        const houseNumber = 100 + index * 25;
        const street = realStreetNames[index % realStreetNames.length];
        const type = streetTypes[index % streetTypes.length];
        
        suggestions.push({
          description: `${houseNumber} ${street} ${type}, ${city.city}, ${city.state} ${city.zip}, USA`,
          placeId: `shippo-city-${index + 1}`,
          structured: {
            firstName: '',
            lastName: '',
            street: `${houseNumber} ${street} ${type}`,
            city: city.city,
            state: city.state,
            zipCode: city.zip,
            country: 'US',
            phone: '',
            email: ''
          }
        });
      });
    }

    return suggestions;
  }

  // Get tracking information
  static async getTrackingInfo(trackingNumber, carrier) {
    try {
      const track = await shippo.track.create({
        tracking_number: trackingNumber,
        carrier: carrier
      });

      return {
        success: true,
        status: track.tracking_status,
        history: track.tracking_history,
        estimatedDelivery: track.eta
      };

    } catch (error) {
      console.error('SHIPPO tracking error:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = ShippoService;