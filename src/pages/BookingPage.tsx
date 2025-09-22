import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { Service } from '../types';
import { getActiveServices, createBooking, getBookingsByDate } from '../services/firebaseService';
import { useUserRole } from '../hooks/useUserRole';

interface BookingStep {
  step: number;
  title: string;
  icon: React.ReactNode;
}

const BookingPage: React.FC = () => {
  const { user, clerkUser } = useUserRole();
  const [currentStep, setCurrentStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingId, setBookingId] = useState('');

  // Booking form state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
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
    if (user && clerkUser) {
      setClientInfo({
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phone: user.phone || '',
        notes: ''
      });
    }
  }, [user, clerkUser]);

  const steps: BookingStep[] = [
    { step: 1, title: 'Select Service', icon: <Calendar className="w-5 h-5" /> },
    { step: 2, title: 'Choose Date', icon: <Calendar className="w-5 h-5" /> },
    { step: 3, title: 'Pick Time', icon: <Clock className="w-5 h-5" /> },
    { step: 4, title: 'Your Details', icon: <User className="w-5 h-5" /> },
    { step: 5, title: 'Confirm', icon: <Check className="w-5 h-5" /> }
  ];

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const activeServices = await getActiveServices();
        setServices(activeServices);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching services:', error);
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Generate available time slots
  useEffect(() => {
    if (selectedDate && selectedService) {
      generateTimeSlots();
    }
  }, [selectedDate, selectedService]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateTimeSlots = async () => {
    if (!selectedDate || !selectedService) return;

    try {
      // Get existing bookings for the selected date
      const existingBookings = await getBookingsByDate(selectedDate);
      const bookedTimes = existingBookings.map(booking => booking.time);

      // Generate time slots based on business hours and service duration
      const dayOfWeek = new Date(selectedDate).getDay();
      const workingHours = getWorkingHoursForDay(dayOfWeek);
      
      if (!workingHours.isOpen) {
        setAvailableSlots([]);
        return;
      }

      const slots: string[] = [];
      const startTime = timeToMinutes(workingHours.startTime);
      const endTime = timeToMinutes(workingHours.endTime);
      const serviceDuration = selectedService.duration;
      const slotDuration = 30; // 30-minute slots

      for (let time = startTime; time + serviceDuration <= endTime; time += slotDuration) {
        const timeString = minutesToTime(time);
        if (!bookedTimes.includes(timeString)) {
          slots.push(timeString);
        }
      }

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error generating time slots:', error);
      setAvailableSlots([]);
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

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!selectedService;
      case 2:
        return !!selectedDate;
      case 3:
        return !!selectedTime;
      case 4:
        return !!(clientInfo.name && clientInfo.email && clientInfo.phone);
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 5) {
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
        clientId: clerkUser?.id, // Link booking to authenticated user
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        date: selectedDate,
        time: selectedTime,
        duration: selectedService.duration,
        price: selectedService.price,
        status: 'pending' as const,
        notes: clientInfo.notes || undefined,
        paymentStatus: 'unpaid' as const
      };

      const newBookingId = await createBooking(bookingData);
      setBookingId(newBookingId);
      setBookingComplete(true);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error creating booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center section-padding">
        <div className="max-w-md w-full">
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
              onClick={() => window.location.href = '/'}
              className="w-full btn-primary"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom section-padding">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Book Your Appointment</h1>
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
                        <div className="text-3xl">{service.icon}</div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{service.name}</h3>
                          <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {service.duration}min
                              </span>
                              <span className="text-lg font-bold text-primary-600">
                                ${service.price}
                              </span>
                            </div>
                            {selectedService?.id === service.id && (
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

          {/* Step 2: Date Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Choose a Date</h2>
              
              {selectedService && (
                <div className="card mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{selectedService.icon}</div>
                    <div>
                      <h3 className="font-bold text-gray-900">{selectedService.name}</h3>
                      <p className="text-sm text-gray-600">
                        {selectedService.duration} minutes • ${selectedService.price}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="max-w-md mx-auto">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="form-input w-full text-center text-lg"
                />
                
                {selectedDate && (
                  <div className="mt-4 p-4 bg-primary-50 rounded-lg text-center">
                    <p className="text-primary-800 font-medium">
                      {formatDate(selectedDate)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Time Selection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Pick a Time</h2>
              
              {selectedDate && (
                <div className="text-center mb-6">
                  <p className="text-lg text-gray-700">
                    Available times for <span className="font-medium">{formatDate(selectedDate)}</span>
                  </p>
                </div>
              )}

              {availableSlots.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  {availableSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        selectedTime === time
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                      }`}
                    >
                      {formatTime(time)}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No available times</h3>
                  <p className="text-gray-600">Please select a different date.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Client Information */}
          {currentStep === 4 && (
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

          {/* Step 5: Confirmation */}
          {currentStep === 5 && (
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
                        <span className="font-medium">{selectedService.duration} minutes</span>
                      </div>
                      <div className="flex justify-between border-t pt-3">
                        <span className="text-gray-900 font-bold">Total:</span>
                        <span className="text-xl font-bold text-primary-600">${selectedService.price}</span>
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

            {currentStep < 5 ? (
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
      </div>
    </div>
  );
};

export default BookingPage;