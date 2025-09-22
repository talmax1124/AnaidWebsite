import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Phone, 
  Mail, 
  User, 
  Edit3, 
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { Booking } from '../types';

interface EnhancedBookingCardProps {
  booking: Booking;
  onUpdateBooking: (bookingId: string, updates: Partial<Booking>) => void;
  onViewHistory?: (clientId: string) => void;
}

const EnhancedBookingCard: React.FC<EnhancedBookingCardProps> = ({ 
  booking, 
  onUpdateBooking,
  onViewHistory 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [serviceNotes, setServiceNotes] = useState(booking.serviceNotes || '');
  const [selectedStatus, setSelectedStatus] = useState(booking.status);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(booking.paymentStatus);
  const [paymentMethod, setPaymentMethod] = useState(booking.paymentMethod || '');

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'no-show': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'in-progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'rescheduled': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600';
      case 'unpaid': return 'text-red-600';
      case 'partial': return 'text-yellow-600';
      case 'refunded': return 'text-gray-600';
      default: return 'text-gray-600';
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

  const canCancelWithoutFee = () => {
    const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
    const now = new Date();
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilBooking >= 48;
  };

  const handleSaveChanges = () => {
    const updates: Partial<Booking> = {
      status: selectedStatus,
      serviceNotes,
      paymentStatus: selectedPaymentStatus,
      paymentMethod: paymentMethod || undefined
    };

    // Add cancellation fee if cancelling within 48 hours
    if (selectedStatus === 'cancelled' && booking.status !== 'cancelled' && !canCancelWithoutFee()) {
      updates.cancellationFee = 35;
      updates.cancellationReason = 'Late cancellation (less than 48 hours)';
    }

    onUpdateBooking(booking.id, updates);
    setIsEditing(false);
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
            <p className="text-xs text-gray-500">ID: {booking.id.slice(-8)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
            {booking.status.replace('-', ' ')}
          </span>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Appointment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-sm font-medium">{formatDate(booking.date)}</p>
            <p className="text-xs text-gray-500">Date</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-sm font-medium">{formatTime(booking.time)}</p>
            <p className="text-xs text-gray-500">{booking.duration} min</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-sm font-medium">${booking.price}</p>
            {booking.cancellationFee && (
              <p className="text-xs text-red-600">+${booking.cancellationFee} fee</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <CreditCard className="w-4 h-4 text-gray-400" />
          <div>
            <p className={`text-sm font-medium ${getPaymentColor(booking.paymentStatus)}`}>
              {booking.paymentStatus}
            </p>
            {booking.paymentMethod && (
              <p className="text-xs text-gray-500">{booking.paymentMethod}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{booking.clientEmail}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{booking.clientPhone}</span>
        </div>
      </div>

      {/* Notes */}
      {(booking.notes || booking.serviceNotes) && (
        <div className="mb-4 space-y-2">
          {booking.notes && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Customer Notes:</p>
              <p className="text-sm text-blue-800">{booking.notes}</p>
            </div>
          )}
          {booking.serviceNotes && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-green-900">Service Notes:</p>
              <p className="text-sm text-green-800">{booking.serviceNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Cancellation Warning */}
      {booking.status === 'confirmed' && !canCancelWithoutFee() && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-amber-800">
              Cancelling this booking will incur a $35 late cancellation fee (less than 48 hours notice)
            </p>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as Booking['status'])}
                className="form-input"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="no-show">No Show</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>

            <div>
              <label className="form-label">Payment Status</label>
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value as any)}
                className="form-input"
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Payment Method</label>
            <input
              type="text"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              placeholder="e.g., Cash, Venmo, Zelle, Card"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Service Notes</label>
            <textarea
              value={serviceNotes}
              onChange={(e) => setServiceNotes(e.target.value)}
              placeholder="Add notes about the service performed..."
              rows={3}
              className="form-input"
            />
          </div>

          <div className="flex space-x-3">
            <button onClick={handleSaveChanges} className="btn-primary">
              Save Changes
            </button>
            <button 
              onClick={() => setIsEditing(false)} 
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {!isEditing && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              {booking.clientId && onViewHistory && (
                <button
                  onClick={() => onViewHistory(booking.clientId!)}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  View History
                </button>
              )}
            </div>
            
            <div className="text-xs text-gray-500">
              Created: {booking.createdAt.toLocaleDateString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedBookingCard;