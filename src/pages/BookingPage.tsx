import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, User, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { AddOn } from '../types';
import { createBooking, getBookingsByDate } from '../services/bookingService';
import { sanityService, SanityService } from '../services/sanityService';
import { useUserRole } from '../hooks/useUserRole';
import SpamAlert from '../components/SpamAlert';
import DatePicker from '../components/DatePicker';

interface BookingStep {
  step: number;
  title: string;
  icon: React.ReactNode;
}

interface BookingSectionProps {
  embedded?: boolean;
  onBookingSuccess?: () => void;
  preSelectedServiceId?: string;
}

export const BookingSection: React.FC<BookingSectionProps> = ({
  embedded = false,
  onBookingSuccess,
  preSelectedServiceId
}) => {
  const { user } = useUserRole();
  const [currentStep, setCurrentStep] = useState(1);
  const [services, setServices] = useState<any[]>([]);
  const [compatibleAddOns, setCompatibleAddOns] = useState<AddOn[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingId, setBookingId] = useState('');

  // Booking form state
  const [selectedService, setSelectedService] = useState<SanityService | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  // Pre-fill user info when user data is available
  useEffect(() => {
    if (user) {
      setClientInfo(prev => ({
        ...prev,
        name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
        email: user.email,
        phone: user.phone || ''
      }));
    }
  }, [user]);

  const steps: BookingStep[] = [
    { step: 1, title: 'Select Service', icon: <Calendar className="w-5 h-5" /> },
    { step: 2, title: 'Add-Ons', icon: <Check className="w-5 h-5" /> },
    { step: 3, title: 'Choose Date', icon: <Calendar className="w-5 h-5" /> },
    { step: 4, title: 'Pick Time', icon: <Clock className="w-5 h-5" /> },
    { step: 5, title: 'Your Details', icon: <User className="w-5 h-5" /> },
    { step: 6, title: 'Confirm', icon: <Check className="w-5 h-5" /> }
  ];

  useEffect(() => {
    const fetchServices = async () => {
      try {
        // Fetch services from Sanity CMS
        const sanityServices = await sanityService.getServices();
        // Filter for active services and ensure duration is set
        const activeServices = sanityServices
          .filter(service => service.active !== false)
          .map(service => ({
            ...service,
            duration: service.duration || 60,
            // Map Sanity fields to match expected structure
            id: service._id,
            name: service.name,
            price: service.price,
            description: service.description,
            icon: service.category === 'Classic' ? '✨' : 
                  service.category === 'Volume' ? '💫' : 
                  service.category === 'Hybrid' ? '🌟' : '💅',
            active: service.active !== false
          }));
        
        console.log('Fetched Sanity services:', activeServices);
        setServices(activeServices as any);
        
        // Pre-select service if ID is provided
        if (preSelectedServiceId) {
          const preSelected = activeServices.find(s => s.id === preSelectedServiceId);
          if (preSelected) {
            setSelectedService(preSelected as any);
            // If we have a pre-selected service, start at step 2 (add-ons)
            setCurrentStep(2);
          }
        }
        
        // Check for pre-selected date and time from sessionStorage
        const preSelectedDate = sessionStorage.getItem('preSelectedDate');
        const preSelectedTime = sessionStorage.getItem('preSelectedTime');
        
        if (preSelectedDate) {
          setSelectedDate(preSelectedDate);
          sessionStorage.removeItem('preSelectedDate');
        }
        
        if (preSelectedTime) {
          setSelectedTime(preSelectedTime);
          sessionStorage.removeItem('preSelectedTime');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching services:', error);
        setLoading(false);
      }
    };

    fetchServices();
  }, [preSelectedServiceId]);

  // Load compatible add-ons when service is selected
  useEffect(() => {
    if (selectedService) {
      try {
        // Get add-ons from the selected Sanity service
        const sanityAddOns = (selectedService as any).addOns || [];
        
        // Map Sanity add-ons to match the expected AddOn structure
        const mappedAddOns: AddOn[] = sanityAddOns.map((addOn: any) => ({
          id: addOn._id || addOn.id || Math.random().toString(36).substr(2, 9),
          name: addOn.name || 'Unnamed Add-on',
          description: addOn.description || '',
          price: addOn.price || 0,
          duration: addOn.duration || 15, // Default 15 minutes for add-ons
          icon: '✨',
          category: 'enhancement' as any,
          active: addOn.active !== false,
          compatibleServices: [(selectedService as any)._id || (selectedService as any).id],
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        
        console.log('Mapped add-ons:', mappedAddOns);
        setCompatibleAddOns(mappedAddOns);
      } catch (error) {
        console.error('Error loading compatible add-ons:', error);
        setCompatibleAddOns([]);
      }
    } else {
      setCompatibleAddOns([]);
      setSelectedAddOns([]);
    }
  }, [selectedService]);

  // Generate available time slots
  useEffect(() => {
    const loadTimeSlots = async () => {
      if (selectedDate && selectedService) {
        await generateTimeSlots();
      } else {
        setAvailableSlots([]);
      }
    };
    
    loadTimeSlots();
  }, [selectedDate, selectedService]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateTimeSlots = async () => {
    if (!selectedDate || !selectedService) {
      console.log('Cannot generate slots - missing date or service');
      setAvailableSlots([]);
      return;
    }

    try {
      console.log('Starting time slot generation for:', {
        date: selectedDate,
        service: selectedService.name,
        duration: selectedService.duration
      });
      
      // Get existing bookings for the selected date
      let bookedTimes: string[] = [];
      try {
        const existingBookings = await getBookingsByDate(selectedDate);
        bookedTimes = existingBookings.map(booking => booking.time);
        console.log('Existing bookings:', bookedTimes);
      } catch (bookingError) {
        console.warn('Could not fetch existing bookings, assuming no bookings:', bookingError);
        bookedTimes = [];
      }

      // Parse the date correctly (add time to avoid timezone issues)
      const dateObj = new Date(selectedDate + 'T12:00:00');
      const dayOfWeek = dateObj.getDay();
      const workingHours = getWorkingHoursForDay(dayOfWeek);
      
      if (!workingHours.isOpen) {
        setAvailableSlots([]);
        return;
      }

      const slots: string[] = [];
      const startTime = timeToMinutes(workingHours.startTime);
      const endTime = timeToMinutes(workingHours.endTime);
      const serviceDuration = selectedService.duration || 60; // Default to 60 minutes if not set
      const slotDuration = 30; // 30-minute slots
      
      console.log('Generating slots:', {
        date: selectedDate,
        dayOfWeek,
        workingHours,
        startTime,
        endTime,
        serviceDuration,
        serviceName: selectedService.name
      });

      for (let time = startTime; time + serviceDuration <= endTime; time += slotDuration) {
        const timeString = minutesToTime(time);
        if (!bookedTimes.includes(timeString)) {
          slots.push(timeString);
        }
      }

      console.log('Generated slots:', slots);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error generating time slots:', error);
      // Set some default slots as fallback for testing
      const fallbackSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00'];
      console.log('Using fallback slots due to error');
      setAvailableSlots(fallbackSlots);
    }
  };

  const getWorkingHoursForDay = (dayOfWeek: number) => {
    // Default working hours - in production, this would come from business settings
    const workingHours = {
      0: { isOpen: true, startTime: '14:00', endTime: '22:00' }, // Sunday
      1: { isOpen: true, startTime: '09:00', endTime: '21:00' }, // Monday
      2: { isOpen: true, startTime: '14:00', endTime: '18:00' }, // Tuesday
      3: { isOpen: true, startTime: '09:00', endTime: '21:00' }, // Wednesday
      4: { isOpen: false, startTime: '09:00', endTime: '17:00' }, // Thursday
      5: { isOpen: true, startTime: '14:00', endTime: '22:00' }, // Friday
      6: { isOpen: true, startTime: '14:00', endTime: '22:00' }  // Saturday
    };

    return workingHours[dayOfWeek as keyof typeof workingHours];
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMinDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = (): string => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 60); // 60 days from now
    return maxDate.toISOString().split('T')[0];
  };

  const toggleAddOn = (addOn: AddOn) => {
    setSelectedAddOns(prev => {
      const isSelected = prev.some(selected => selected.id === addOn.id);
      if (isSelected) {
        return prev.filter(selected => selected.id !== addOn.id);
      } else {
        return [...prev, addOn];
      }
    });
  };

  const getTotalDuration = (): number => {
    if (!selectedService) return 0;
    const serviceDuration = (selectedService as any).duration || 60;
    const addOnDuration = selectedAddOns.reduce((total, addOn) => total + (addOn.duration || 0), 0);
    return serviceDuration + addOnDuration;
  };

  const getTotalPrice = (): number => {
    if (!selectedService) return 0;
    const servicePrice = (selectedService as any).price || 0;
    const addOnPrice = selectedAddOns.reduce((total, addOn) => total + (addOn.price || 0), 0);
    return servicePrice + addOnPrice;
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!selectedService;
      case 2:
        return true; // Add-ons are optional
      case 3:
        return !!selectedDate;
      case 4:
        return !!selectedTime;
      case 5:
        return !!(clientInfo.name && clientInfo.email && clientInfo.phone);
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (canProceed() && currentStep < 6) {
      // If moving from date selection to time selection, ensure time slots are generated
      if (currentStep === 3 && selectedDate && selectedService) {
        await generateTimeSlots();
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !clientInfo.name) {
      return;
    }

    setSubmitting(true);

    try {
      const bookingData = {
        clientName: clientInfo.name,
        clientEmail: clientInfo.email,
        clientPhone: clientInfo.phone,
        clientId: user?.id,
        serviceId: selectedService._id || selectedService.id,
        serviceName: selectedService.name,
        date: selectedDate,
        time: selectedTime,
        addOns: selectedAddOns.length > 0 ? selectedAddOns.map(addOn => ({
          id: addOn.id,
          name: addOn.name,
          price: addOn.price,
          duration: addOn.duration
        })) : undefined,
        duration: getTotalDuration(),
        price: getTotalPrice(),
        status: 'pending' as const,
        notes: clientInfo.notes || undefined,
        paymentStatus: 'unpaid' as const
      };

      const newBookingId = await createBooking(bookingData);
      setBookingId(newBookingId);
      setBookingComplete(true);
      onBookingSuccess?.();
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error creating booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedService(null);
    setSelectedAddOns([]);
    setSelectedDate('');
    setSelectedTime('');
    setAvailableSlots([]);
    setClientInfo({
      name: user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '',
      email: user?.email || '',
      phone: user?.phone || '',
      notes: ''
    });
    setBookingComplete(false);
    setBookingId('');
  };

  if (bookingComplete) {
    const content = (
      <div className="max-w-2xl w-full">
        <SpamAlert context="booking" />
        <div className="card text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Submitted! 🎉</h2>
          <p className="text-gray-600 mb-6">
            Your appointment has been successfully submitted. You will receive a confirmation email shortly.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Booking ID:</strong> {bookingId}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Status:</strong> Pending approval
            </p>
          </div>
          <button
            onClick={() => {
              if (embedded) {
                resetForm();
              } else {
                window.location.href = '/';
              }
            }}
            className="w-full btn-primary"
          >
            {embedded ? 'Book Another Appointment' : 'Return to Home'}
          </button>
        </div>
      </div>
    );

    return embedded ? (
      <div className="space-y-6">{content}</div>
    ) : (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center section-padding">
        {content}
      </div>
    );
  }

  const bookingContent = (
    <>
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {embedded ? 'Book an Appointment' : 'Book Your Appointment'}
        </h1>
        <p className="text-lg text-gray-600">
          Select your preferred service, date, and time for your lash transformation
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center mb-12">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <React.Fragment key={step.step}>
              <div className={`flex items-center space-x-2 ${
                currentStep >= step.step ? 'text-primary-600' : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step.step 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step.step ? <Check className="w-4 h-4" /> : step.step}
                </div>
                <span className="hidden sm:block text-sm font-medium">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${
                  currentStep > step.step ? 'bg-primary-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Booking Form */}
      <div className="max-w-4xl mx-auto">
          {/* Step 1: Service Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Select a Service</h2>
              
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="card animate-pulse">
                      <div className="h-6 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`card cursor-pointer transition-all duration-200 ${
                        selectedService?.id === service.id
                          ? 'ring-2 ring-primary-500 bg-primary-50'
                          : 'hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="text-3xl">{service.icon || '💅'}</div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{service.name}</h3>
                          <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {service.duration || 60}min
                              </span>
                              <span className="text-lg font-bold text-primary-600">
                                ${service.price || 0}
                              </span>
                            </div>
                            {(selectedService?._id === service._id || selectedService?.id === service.id) && (
                              <Check className="w-5 h-5 text-primary-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {services.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No services available</h3>
                  <p className="text-gray-600">Please check back later or contact us directly.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Add-On Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Select Add-Ons (Optional)</h2>
              

              {selectedService && (
                <div className="card mb-6 bg-gradient-to-r from-primary-50 to-purple-50 border-primary-200">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{selectedService.icon || '💅'}</div>
                    <div>
                      <h3 className="font-bold text-gray-900">{selectedService.name}</h3>
                      <p className="text-sm text-gray-600">
                        {selectedService.duration || 60} minutes • ${selectedService.price || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {compatibleAddOns.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-center text-gray-600 mb-6">
                    Enhance your {selectedService?.name.toLowerCase()} with these premium add-ons:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {compatibleAddOns.map((addOn) => {
                      const isSelected = selectedAddOns.some(selected => selected.id === addOn.id);
                      return (
                        <div
                          key={addOn.id}
                          onClick={() => toggleAddOn(addOn)}
                          className={`card cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'ring-2 ring-primary-500 bg-primary-50'
                              : 'hover:shadow-lg hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            <div className="text-2xl">{addOn.icon}</div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-gray-900">{addOn.name}</h3>
                                {isSelected && (
                                  <Check className="w-5 h-5 text-primary-600" />
                                )}
                              </div>
                              <p className="text-gray-600 text-sm mb-3">{addOn.description}</p>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    +{addOn.duration}min
                                  </span>
                                  <span className="text-lg font-bold text-primary-600">
                                    +${addOn.price}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedAddOns.length > 0 && (
                    <div className="card bg-primary-50 border-primary-200">
                      <h3 className="font-bold text-gray-900 mb-3">Selected Add-Ons Summary:</h3>
                      <div className="space-y-2">
                        {selectedAddOns.map((addOn) => (
                          <div key={addOn.id} className="flex justify-between text-sm">
                            <span>{addOn.name}</span>
                            <span>+${addOn.price} • +{addOn.duration}min</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2 font-bold">
                          <div className="flex justify-between">
                            <span>Total Extra:</span>
                            <span>+${selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0)} • +{selectedAddOns.reduce((sum, addOn) => sum + addOn.duration, 0)}min</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Check className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No add-ons available</h3>
                  <p className="text-gray-600">No compatible add-ons found for this service.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Date Selection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Choose Your Date</h2>
              
              {selectedService && (
                <div className="card bg-gradient-to-r from-primary-50 to-purple-50 border-primary-200 mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{selectedService.icon || '💅'}</div>
                    <div>
                      <h3 className="font-bold text-gray-900">{selectedService.name}</h3>
                      <p className="text-sm text-gray-600">
                        {selectedService.duration || 60} minutes • ${selectedService.price || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="max-w-2xl mx-auto">
                {/* Calendar Grid */}
                <div className="card shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Select an available date</h3>
                    <Calendar className="w-5 h-5 text-primary-600" />
                  </div>
                  
                  <div className="relative">
                    <DatePicker
                      value={selectedDate}
                      onChange={(date) => {
                        if (date) {
                          const newDate = date.toISOString().split('T')[0];
                          setSelectedDate(newDate);
                          setSelectedTime(''); // Reset time when date changes
                          // The useEffect will handle generating time slots
                        }
                      }}
                      minDate={new Date(getMinDate())}
                      maxDate={new Date(getMaxDate())}
                      placeholder="Select your appointment date"
                      className="w-full"
                    />
                  </div>
                  
                  {selectedDate && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-primary-100 to-purple-100 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Selected Date:</p>
                          <p className="text-lg font-bold text-gray-900">
                            {formatDate(selectedDate)}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                          <Check className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Business Hours Info */}
                <div className="mt-6 card bg-blue-50 border-blue-200">
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-blue-900 mb-1">Business Hours</p>
                      <p className="text-blue-700">
                        Available times will be shown after selecting a date.
                        We're open most days with flexible scheduling.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Time Selection */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Select Your Time</h2>
              
              <div className="max-w-4xl mx-auto">
                {/* Date and Service Summary */}
                <div className="card bg-gradient-to-r from-primary-50 to-purple-50 border-primary-200 mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <Calendar className="w-8 h-8 text-primary-600" />
                      <div>
                        <p className="text-sm text-gray-600">Appointment Date</p>
                        <p className="text-lg font-bold text-gray-900">{formatDate(selectedDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{selectedService?.icon || '💅'}</div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedService?.name}</p>
                        <p className="text-sm text-gray-600">{getTotalDuration()} minutes total</p>
                      </div>
                    </div>
                  </div>
                </div>

                {availableSlots.length > 0 ? (
                  <>
                    {/* Morning/Afternoon/Evening Sections */}
                    <div className="space-y-6">
                      {(() => {
                        const morningSlots = availableSlots.filter(time => {
                          const hour = parseInt(time.split(':')[0]);
                          return hour < 12;
                        });
                        const afternoonSlots = availableSlots.filter(time => {
                          const hour = parseInt(time.split(':')[0]);
                          return hour >= 12 && hour < 17;
                        });
                        const eveningSlots = availableSlots.filter(time => {
                          const hour = parseInt(time.split(':')[0]);
                          return hour >= 17;
                        });

                        return (
                          <>
                            {morningSlots.length > 0 && (
                              <div className="card">
                                <h3 className="text-sm font-semibold text-gray-600 mb-4 flex items-center">
                                  <span className="mr-2">🌅</span> Morning
                                </h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                  {morningSlots.map((time) => (
                                    <button
                                      key={time}
                                      onClick={() => setSelectedTime(time)}
                                      className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                                        selectedTime === time
                                          ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg'
                                          : 'bg-white border-2 border-gray-200 hover:border-primary-300 hover:shadow-md'
                                      }`}
                                    >
                                      {formatTime(time)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {afternoonSlots.length > 0 && (
                              <div className="card">
                                <h3 className="text-sm font-semibold text-gray-600 mb-4 flex items-center">
                                  <span className="mr-2">☀️</span> Afternoon
                                </h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                  {afternoonSlots.map((time) => (
                                    <button
                                      key={time}
                                      onClick={() => setSelectedTime(time)}
                                      className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                                        selectedTime === time
                                          ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg'
                                          : 'bg-white border-2 border-gray-200 hover:border-primary-300 hover:shadow-md'
                                      }`}
                                    >
                                      {formatTime(time)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {eveningSlots.length > 0 && (
                              <div className="card">
                                <h3 className="text-sm font-semibold text-gray-600 mb-4 flex items-center">
                                  <span className="mr-2">🌙</span> Evening
                                </h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                  {eveningSlots.map((time) => (
                                    <button
                                      key={time}
                                      onClick={() => setSelectedTime(time)}
                                      className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                                        selectedTime === time
                                          ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg'
                                          : 'bg-white border-2 border-gray-200 hover:border-primary-300 hover:shadow-md'
                                      }`}
                                    >
                                      {formatTime(time)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {selectedTime && (
                      <div className="mt-6 card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Clock className="w-6 h-6 text-green-600" />
                            <div>
                              <p className="text-sm text-gray-600">Selected Time</p>
                              <p className="text-lg font-bold text-gray-900">{formatTime(selectedTime)}</p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            Duration: {getTotalDuration()} minutes
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="card text-center py-12">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No available times</h3>
                    <p className="text-gray-600 mb-4">
                      This day appears to be fully booked or closed.
                    </p>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="btn-secondary inline-flex items-center space-x-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Select Different Date</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Client Information */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Your Details</h2>
              
              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    value={clientInfo.name}
                    onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})}
                    className="form-input"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    value={clientInfo.email}
                    onChange={(e) => setClientInfo({...clientInfo, email: e.target.value})}
                    className="form-input"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    value={clientInfo.phone}
                    onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})}
                    className="form-input"
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Special Requests or Notes (Optional)</label>
                  <textarea
                    value={clientInfo.notes}
                    onChange={(e) => setClientInfo({...clientInfo, notes: e.target.value})}
                    className="form-input"
                    rows={3}
                    placeholder="Any allergies, preferences, or special requests..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Confirmation */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Confirm Your Booking</h2>
              
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Service Summary */}
                <div className="card">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Service Details</h3>
                  {selectedService && (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service:</span>
                        <span className="font-medium">{selectedService.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{formatDate(selectedDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">{formatTime(selectedTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{getTotalDuration()} minutes</span>
                      </div>
                      {selectedAddOns.length > 0 && (
                        <>
                          <div className="border-t pt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Add-ons:</p>
                            {selectedAddOns.map((addOn) => (
                              <div key={addOn.id} className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>{addOn.name}</span>
                                <span>+${addOn.price}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      <div className="flex justify-between border-t pt-3">
                        <span className="text-gray-900 font-bold">Total:</span>
                        <span className="text-xl font-bold text-primary-600">${getTotalPrice()}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Client Information */}
                <div className="card">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Your Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{clientInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{clientInfo.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{clientInfo.phone}</span>
                    </div>
                    {clientInfo.notes && (
                      <div>
                        <span className="text-gray-600">Notes:</span>
                        <p className="text-gray-900 mt-1">{clientInfo.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Please note:</strong> Your booking will be pending approval. 
                    We'll confirm your appointment within 24 hours and send you a confirmation email.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-12">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className={`flex items-center space-x-2 ${
                currentStep === 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentStep < 6 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`flex items-center space-x-2 ${
                  canProceed() 
                    ? 'btn-primary' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed px-6 py-3 rounded-lg'
                }`}
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitBooking}
                disabled={submitting || !canProceed()}
                className={`${
                  canProceed() && !submitting
                    ? 'btn-primary' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed px-6 py-3 rounded-lg'
                }`}
              >
                {submitting ? 'Submitting...' : 'Confirm Booking'}
              </button>
            )}
          </div>
      </div>
    </>
  );

  if (embedded) {
    return <div className="space-y-10">{bookingContent}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom section-padding">
        {bookingContent}
      </div>
    </div>
  );
};

const BookingPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId?: string }>();
  
  return <BookingSection preSelectedServiceId={serviceId} />;
};

export default BookingPage;
