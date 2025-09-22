import React, { useState, useEffect, useCallback } from 'react';
import { X, Calendar, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { Booking, User } from '../types';
import { getUserBookings, getUserByClerkId } from '../services/firebaseService';

interface CustomerHistoryProps {
  clientId: string;
  onClose: () => void;
}

const CustomerHistory: React.FC<CustomerHistoryProps> = ({ clientId, onClose }) => {
  const [customer, setCustomer] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCustomerData = useCallback(async () => {
    try {
      const [customerData, bookingsData] = await Promise.all([
        getUserByClerkId(clientId),
        getUserBookings(clientId)
      ]);
      
      setCustomer(customerData);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);

  const getStats = () => {
    const completed = bookings.filter(b => b.status === 'completed');
    const totalSpent = completed.reduce((sum, b) => sum + b.price, 0);
    const averageSpent = completed.length > 0 ? totalSpent / completed.length : 0;
    const noShows = bookings.filter(b => b.status === 'no-show').length;
    const cancellations = bookings.filter(b => b.status === 'cancelled').length;
    
    return {
      totalBookings: bookings.length,
      completedBookings: completed.length,
      totalSpent,
      averageSpent,
      noShows,
      cancellations,
      mostRecentVisit: completed.length > 0 ? completed[0].date : null
    };
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'cancelled': return 'text-red-600';
      case 'no-show': return 'text-orange-600';
      case 'confirmed': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-bold mb-2">Customer Not Found</h3>
          <p className="text-gray-600 mb-4">Unable to load customer information.</p>
          <button onClick={onClose} className="btn-primary">Close</button>
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {customer.firstName} {customer.lastName}
            </h2>
            <p className="text-gray-600">{customer.email}</p>
            {customer.phone && (
              <p className="text-gray-600">{customer.phone}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats Overview */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-4">Customer Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalBookings}</p>
                  <p className="text-sm text-blue-600">Total Bookings</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-900">${stats.totalSpent}</p>
                  <p className="text-sm text-green-600">Total Spent</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-900">${stats.averageSpent.toFixed(0)}</p>
                  <p className="text-sm text-purple-600">Avg per Visit</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedBookings}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
                <Clock className="w-8 h-8 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">No-shows:</span>
              <span className="ml-2 text-orange-600">{stats.noShows}</span>
            </div>
            <div>
              <span className="font-medium">Cancellations:</span>
              <span className="ml-2 text-red-600">{stats.cancellations}</span>
            </div>
            <div>
              <span className="font-medium">Last Visit:</span>
              <span className="ml-2">{stats.mostRecentVisit || 'Never'}</span>
            </div>
          </div>
        </div>

        {/* Booking History */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Booking History</h3>
          
          {bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{booking.serviceName}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(booking.date).toLocaleDateString()} at {booking.time}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                      <p className="text-sm text-gray-600">${booking.price}</p>
                    </div>
                  </div>
                  
                  {booking.serviceNotes && (
                    <div className="mt-2 bg-green-50 p-2 rounded text-sm">
                      <strong>Service Notes:</strong> {booking.serviceNotes}
                    </div>
                  )}
                  
                  {booking.notes && (
                    <div className="mt-2 bg-blue-50 p-2 rounded text-sm">
                      <strong>Customer Notes:</strong> {booking.notes}
                    </div>
                  )}

                  {booking.cancellationFee && (
                    <div className="mt-2 bg-red-50 p-2 rounded text-sm text-red-800">
                      <strong>Cancellation Fee:</strong> ${booking.cancellationFee}
                      {booking.cancellationReason && ` - ${booking.cancellationReason}`}
                    </div>
                  )}

                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>Payment: {booking.paymentStatus}</span>
                    <span>Booked: {booking.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No booking history found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerHistory;