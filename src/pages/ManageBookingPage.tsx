import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Booking } from '../types';
import { getUserBookings, updateBooking } from '../services/firebaseService';
import { useUserRole } from '../hooks/useUserRole';
import CalendarButtons from '../components/CalendarButtons';

const ManageBookingPage: React.FC = () => {
  const { clerkUser } = useUserRole();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadUserBookings = async () => {
      if (!clerkUser) return;
      
      setLoading(true);
      setError('');
      
      try {
        const userBookings = await getUserBookings(clerkUser.id);
        setBookings(userBookings);
      } catch (err) {
        setError('Error loading your bookings. Please try again.');
        console.error('Error loading bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserBookings();
  }, [clerkUser]);

  const cancelBooking = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    // Check if within 48 hours
    const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
    const now = new Date();
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isWithin48Hours = hoursUntilBooking < 48;

    let confirmMessage = 'Are you sure you want to cancel this booking?';
    if (isWithin48Hours) {
      confirmMessage = `WARNING: This booking is within 48 hours. A $35 cancellation fee will be charged.\n\nAre you sure you want to cancel this booking?`;
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const updates: any = { status: 'cancelled' };
      
      if (isWithin48Hours) {
        updates.cancellationFee = 35;
        updates.cancellationReason = 'Late cancellation (less than 48 hours)';
      }

      await updateBooking(bookingId, updates);
      
      // Update the booking in the local state
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, ...updates } : b
      ));
      
      if (isWithin48Hours) {
        setSuccess('Your booking has been cancelled. A $35 late cancellation fee has been applied.');
      } else {
        setSuccess('Your booking has been cancelled successfully.');
      }
    } catch (err) {
      setError('Error cancelling booking. Please try again or contact us.');
      console.error('Error cancelling booking:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Appointments</h1>
              <p className="text-gray-600">
                Manage your bookings and appointments
              </p>
            </div>
            <Link to="/booking" className="btn-primary flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Book New Appointment</span>
            </Link>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {/* Bookings List */}
          {bookings.length > 0 ? (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div key={booking.id} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">💅</div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{booking.serviceName}</h3>
                        <p className="text-sm text-gray-600">Booking ID: {booking.id.slice(-8)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{formatDate(booking.date)}</p>
                        <p className="text-sm text-gray-600">Date</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{formatTime(booking.time)}</p>
                        <p className="text-sm text-gray-600">{booking.duration} minutes</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">${booking.price}</p>
                        <p className="text-sm text-gray-600">Total cost</p>
                      </div>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <strong>Notes:</strong> {booking.notes}
                      </p>
                    </div>
                  )}

                  {/* Calendar Integration */}
                  {booking.status === 'confirmed' && (
                    <div className="mb-4">
                      <CalendarButtons booking={booking} />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="border-t pt-4">
                    {booking.status === 'pending' || booking.status === 'confirmed' ? (
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <button
                          onClick={() => cancelBooking(booking.id)}
                          className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Cancel Booking
                        </button>
                        
                        <div className="text-sm text-gray-500 text-right">
                          <p>Need to reschedule?</p>
                          <p>Call us at <a href="tel:3213169898" className="text-primary-600 hover:underline">321 316 9898</a></p>
                        </div>
                      </div>
                    ) : booking.status === 'cancelled' ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-800 text-sm">
                          This booking has been cancelled.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-800 text-sm">
                          This appointment has been completed. Thank you!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments yet</h3>
              <p className="text-gray-600 mb-6">Book your first appointment to get started!</p>
              <Link to="/booking" className="btn-primary inline-flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Book Appointment</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageBookingPage;