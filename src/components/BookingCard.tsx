import React from 'react';
import { Calendar, Clock, DollarSign, Phone, Mail, User } from 'lucide-react';
import { Booking } from '../types';

interface BookingCardProps {
  booking: Booking;
  onUpdateStatus: (bookingId: string, status: Booking['status']) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onUpdateStatus }) => {
  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{booking.clientName}</h3>
            <p className="text-sm text-gray-600">{booking.serviceName}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(booking.date)}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{formatTime(booking.time)} ({booking.duration} min)</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span>${booking.price}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span className="truncate">{booking.clientEmail}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{booking.clientPhone}</span>
          </div>
          {booking.notes && (
            <div className="text-sm text-gray-600">
              <strong>Notes:</strong> {booking.notes}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-4 border-t">
        {booking.status === 'pending' && (
          <>
            <button
              onClick={() => onUpdateStatus(booking.id, 'confirmed')}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => onUpdateStatus(booking.id, 'cancelled')}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              Cancel
            </button>
          </>
        )}
        
        {booking.status === 'confirmed' && (
          <>
            <button
              onClick={() => onUpdateStatus(booking.id, 'completed')}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Mark Complete
            </button>
            <button
              onClick={() => onUpdateStatus(booking.id, 'cancelled')}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              Cancel
            </button>
          </>
        )}

        <a
          href={`tel:${booking.clientPhone}`}
          className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
        >
          Call Client
        </a>
        
        <a
          href={`mailto:${booking.clientEmail}`}
          className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
        >
          Email Client
        </a>
      </div>
    </div>
  );
};

export default BookingCard;