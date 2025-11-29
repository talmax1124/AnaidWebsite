import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Plus, Check } from 'lucide-react';
import { PortableText } from '@portabletext/react';
import { sanityService, SanityService } from '../services/sanityService';
import { discountService, Discount } from '../services/discountService';
import { appointmentsAPI } from '../services/apiService';
import DatePicker from '../components/DatePicker';

// Use SanityService type from sanityService

interface AvailabilitySlot {
  time: string;
  available: boolean;
  booked?: boolean;
}

const ServicePreview: React.FC = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [service, setService] = useState<SanityService | null>(null);
  const [activeDiscounts, setActiveDiscounts] = useState<Discount[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [businessHours, setBusinessHours] = useState<any>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPreview = searchParams.get('preview') === 'true';

  // Calculate discounted price for the service
  // Fetch availability for a specific date
  const fetchAvailability = useCallback(async (date: string) => {
    try {
      setAvailabilityLoading(true);
      const response = await appointmentsAPI.getAvailability(date);
      
      if (response.success && response.availability) {
        setAvailability(response.availability);
        setBusinessHours(response.businessHours);
        setAvailabilityMessage(response.message || '');
      } else {
        setAvailability([]);
        setAvailabilityMessage(response.message || 'No availability data');
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailability([]);
      setAvailabilityMessage('Unable to load availability. Please try again later.');
    } finally {
      setAvailabilityLoading(false);
    }
  }, []);

  // Handle date change for availability
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    fetchAvailability(date);
  };

  // Portable text components for rich content rendering
  const portableTextComponents = {
    block: {
      normal: ({ children }: any) => <p className="mb-4">{children}</p>,
      h2: ({ children }: any) => <h2 className="text-xl font-semibold mb-3">{children}</h2>,
      h3: ({ children }: any) => <h3 className="text-lg font-semibold mb-2">{children}</h3>,
    },
    list: {
      bullet: ({ children }: any) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
      number: ({ children }: any) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
    },
    listItem: {
      bullet: ({ children }: any) => <li>{children}</li>,
      number: ({ children }: any) => <li>{children}</li>,
    },
    marks: {
      strong: ({ children }: any) => <strong className="font-semibold">{children}</strong>,
      em: ({ children }: any) => <em>{children}</em>,
    },
  };

  const calculateDiscountedPrice = (service: SanityService): { originalPrice: number; discountedPrice?: number; savings?: number } => {
    const applicableDiscounts = activeDiscounts.filter(discount => {
      if (!discountService.isDiscountValid(discount)) return false;
      if (discount.applicableTo === 'services' || discount.applicableTo === 'all') return true;
      return false;
    });

    if (applicableDiscounts.length === 0) {
      return { originalPrice: service.price };
    }

    const bestDiscount = discountService.getBestDiscount(
      applicableDiscounts, 
      [{ id: service._id, productId: service._id, name: service.name, price: service.price, quantity: 1, type: 'service' }], 
      service.price
    );

    if (!bestDiscount) {
      return { originalPrice: service.price };
    }

    const discountAmount = discountService.calculateDiscountAmount(
      bestDiscount, 
      [{ id: service._id, productId: service._id, name: service.name, price: service.price, quantity: 1, type: 'service' }], 
      service.price
    );

    return {
      originalPrice: service.price,
      discountedPrice: service.price - discountAmount,
      savings: discountAmount
    };
  };

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        
        const [allServices, discounts] = await Promise.all([
          sanityService.getServices(),
          discountService.getActiveDiscounts()
        ]);
        
        const foundService = allServices.find(s => s.slug?.current === slug);
        
        if (foundService) {
          setService(foundService);
        } else {
          setError('Service not found');
        }
        
        setActiveDiscounts(discounts);
      } catch (err: any) {
        console.error('Error fetching service:', err);
        setError('Failed to load service');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchService();
    }
  }, [slug, isPreview]);

  useEffect(() => {
    if (service) {
      fetchAvailability(selectedDate);
    }
  }, [service, selectedDate, fetchAvailability]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Service Not Found</h1>
          <p className="text-gray-500">The requested service could not be found.</p>
        </div>
      </div>
    );
  }

  if (!service) return null;

  const pricing = calculateDiscountedPrice(service);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Preview Banner */}
      {isPreview && (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center font-medium">
          🔍 PREVIEW MODE - This is how your service will look when published
        </div>
      )}

      {/* Back Button */}
      <div className="container-custom pt-8">
        <Link 
          to="/services" 
          className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Services
        </Link>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Service Images */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
              {service.image?.asset?.url ? (
                <img 
                  src={service.image.asset.url}
                  alt={service.image.alt || service.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <span className="text-6xl">💅</span>
                </div>
              )}
            </div>
            
            {/* Before/After Gallery */}
            {service.beforeAfterImages && service.beforeAfterImages.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Before & After Results</h3>
                <div className="grid grid-cols-2 gap-3">
                  {service.beforeAfterImages.map((image: any, index: number) => (
                    <div key={index} className="aspect-square rounded-xl overflow-hidden">
                      <img 
                        src={image.asset?.url || image.url}
                        alt={`${service.name} result ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trust Indicators */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Professional Service</h4>
                  <p className="text-gray-600 text-sm">Licensed and certified lash specialist</p>
                </div>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                {service.category && (
                  <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                    {service.category}
                  </span>
                )}
                {service.featured && (
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                    <Check className="w-3 h-3 mr-1" />
                    Featured
                  </span>
                )}
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{service.name}</h1>
              
              {/* Pricing */}
              <div className="flex items-baseline space-x-4 mb-4">
                {pricing.discountedPrice && pricing.discountedPrice < pricing.originalPrice ? (
                  <>
                    <div className="text-4xl font-bold text-primary-600">
                      ${pricing.discountedPrice.toFixed(2)}
                    </div>
                    <div className="text-xl text-gray-500 line-through">
                      ${pricing.originalPrice.toFixed(2)}
                    </div>
                    <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                      Save ${pricing.savings?.toFixed(2)}
                    </div>
                  </>
                ) : (
                  <div className="text-4xl font-bold text-primary-600">
                    ${pricing.originalPrice.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Duration and Availability */}
              <div className="flex items-center space-x-6 text-gray-600">
                {service.duration && (
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    <span>{service.duration} minutes</span>
                  </div>
                )}
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${service.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={service.active ? 'text-green-600' : 'text-red-600'}>
                    {service.active ? 'Available' : 'Currently Unavailable'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">About This Service</h3>
              <div className="prose prose-gray max-w-none text-gray-600">
                <p>{service.description}</p>
              </div>
            </div>

            {/* Add-ons */}
            {service.addOns && service.addOns.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Available Add-ons
                </h3>
                <div className="space-y-3">
                  {service.addOns.map((addOn: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{addOn.name}</div>
                        {addOn.description && (
                          <div className="text-sm text-gray-600">{addOn.description}</div>
                        )}
                      </div>
                      <div className="text-lg font-semibold text-primary-600">
                        +${addOn.price}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Service Details */}
            <div className="space-y-6">
              {/* Benefits - Use portable text if fullDescription exists, otherwise array */}
              {(service.fullDescription || service.benefits) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What You'll Get</h3>
                  <div className="text-gray-600">
                    {service.fullDescription && Array.isArray(service.fullDescription) ? (
                      <PortableText 
                        value={service.fullDescription} 
                        components={portableTextComponents}
                      />
                    ) : service.benefits && Array.isArray(service.benefits) ? (
                      <ul className="list-disc list-inside space-y-1">
                        {service.benefits.map((benefit, index) => (
                          <li key={index}>{benefit}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>This service offers professional treatment with lasting results.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Availability Section */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Check Availability
                </h3>
                
                {/* Date Picker */}
                <div className="mb-4">
                  <DatePicker
                    label="Select Date"
                    value={selectedDate}
                    onChange={(date) => {
                      if (date) {
                        handleDateChange(date.toISOString().split('T')[0]);
                      }
                    }}
                    minDate={new Date()}
                    maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                    placeholder="Choose your appointment date"
                  />
                </div>

                {/* Business Hours Info */}
                {businessHours && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <strong className="capitalize">{businessHours.day}</strong> hours: {' '}
                      {businessHours.isOpen 
                        ? `${businessHours.startTime12 || businessHours.startTime} - ${businessHours.endTime12 || businessHours.endTime}`
                        : 'Closed'
                      }
                    </div>
                  </div>
                )}

                {/* Available Time Slots */}
                {availabilityLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    <span className="ml-2 text-gray-600">Loading availability...</span>
                  </div>
                ) : availability.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Available Times</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {availability.map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => slot.available && setSelectedTime(slot.time)}
                          className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                            selectedTime === slot.time
                              ? 'bg-primary-600 text-white'
                              : slot.available
                              ? 'bg-primary-100 text-primary-800 hover:bg-primary-200'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                          disabled={!slot.available}
                        >
                          <div className="flex items-center justify-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {slot.time12 || slot.time}
                          </div>
                          {slot.booked && (
                            <div className="text-xs mt-1">Booked</div>
                          )}
                        </button>
                      ))}
                    </div>
                    {availability.filter(s => s.available).length === 0 && (
                      <div className="text-center py-4 text-orange-600 bg-orange-50 rounded-lg">
                        <p className="font-medium">Fully booked</p>
                        <p className="text-sm">All time slots are taken for this date</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <Calendar className="w-8 h-8 mx-auto" />
                    </div>
                    <p className="text-gray-600 font-medium">
                      {availabilityMessage || 'No availability for this date'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Please select a different date
                    </p>
                  </div>
                )}
                
                {/* Selected Time Display */}
                {selectedTime && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-800">
                          Selected: {selectedTime} on {new Date(selectedDate).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedTime('')}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Book Service Button */}
            <div className="space-y-4">
              <button
                onClick={() => {
                  // Navigate to booking with service and optionally date/time
                  const bookingUrl = `/booking/${service._id}`;
                  // Store selected date and time in sessionStorage to pass to booking page
                  if (selectedDate || selectedTime) {
                    sessionStorage.setItem('preSelectedDate', selectedDate);
                    sessionStorage.setItem('preSelectedTime', selectedTime);
                  }
                  navigate(bookingUrl);
                }}
                disabled={!service.active}
                className={`w-full flex items-center justify-center py-4 px-6 rounded-xl font-semibold transition duration-300 ${
                  service.active
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Calendar className="w-5 h-5 mr-2" />
                {service.active 
                  ? selectedTime 
                    ? `Book for ${selectedTime}` 
                    : 'Book This Service' 
                  : 'Currently Unavailable'
                }
              </button>
              
              <div className="text-center text-sm text-gray-500">
                💬 Have questions? Contact us for a free consultation
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicePreview;
