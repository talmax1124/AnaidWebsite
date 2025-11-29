import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  Users,
  MessageSquare,
  BarChart3,
  ExternalLink,
  TrendingUp,
  Activity,
  Eye
} from 'lucide-react';
import { Booking } from '../types';
import { 
  subscribeToBookings,
  updateBooking
} from '../services/bookingService';
import EnhancedBookingCard from '../components/EnhancedBookingCard';
import CustomerHistory from '../components/CustomerHistory';
import ScheduleManager from '../components/ScheduleManager';
import UserManagement from '../components/UserManagement';
import SMSSettings from '../components/SMSSettings';
import OrderManagement from '../components/OrderManagement';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'orders' | 'schedule' | 'users' | 'sms' | 'content'>('overview');
  const [loading, setLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to real-time bookings
    const unsubscribeBookings = subscribeToBookings((bookingsData) => {
      setBookings(bookingsData);
      setLoading(false);
    });

    return () => {
      unsubscribeBookings();
    };
  }, []);

  const handleUpdateBooking = async (bookingId: string, updates: Partial<Booking>) => {
    try {
      await updateBooking(bookingId, updates);
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const handleViewCustomerHistory = (clientId: string) => {
    setSelectedCustomerId(clientId);
  };

  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    completedBookings: bookings.filter(b => b.status === 'completed').length,
    totalRevenue: bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + b.price, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom section-padding">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.first_name || 'Admin'}!
          </h1>
          <p className="text-gray-600">Manage your bookings, users, and business operations</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                <p className="text-xs text-blue-600">{stats.pendingBookings} pending</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Confirmed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.confirmedBookings}</p>
                <p className="text-xs text-green-600">Ready to serve</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedBookings}</p>
                <p className="text-xs text-purple-600">Successfully served</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue}</p>
                <p className="text-xs text-primary-600">From completed bookings</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'bookings', label: 'Bookings', icon: Calendar },
              { id: 'orders', label: 'Orders', icon: DollarSign },
              { id: 'schedule', label: 'Schedule', icon: Clock },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'sms', label: 'SMS Settings', icon: MessageSquare },
              { id: 'content', label: 'Content Management', icon: ExternalLink },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
                >
                  <Calendar className="w-8 h-8 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">View Bookings</h4>
                    <p className="text-sm text-gray-600">Manage upcoming appointments</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('orders')}
                  className="flex items-center space-x-3 p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors text-left"
                >
                  <DollarSign className="w-8 h-8 text-emerald-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Manage Orders</h4>
                    <p className="text-sm text-gray-600">Track and fulfill orders</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('users')}
                  className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
                >
                  <Users className="w-8 h-8 text-green-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Manage Users</h4>
                    <p className="text-sm text-gray-600">User roles and permissions</p>
                  </div>
                </button>

                <a
                  href="http://localhost:3334"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
                >
                  <ExternalLink className="w-8 h-8 text-purple-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Content Management</h4>
                    <p className="text-sm text-gray-600">Edit services & products</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                >
                  View All
                  <Eye className="w-4 h-4 ml-1" />
                </button>
              </div>
              
              {bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.slice(0, 3).map((booking) => (
                    <EnhancedBookingCard
                      key={booking.id}
                      booking={booking}
                      onUpdateBooking={handleUpdateBooking}
                      onViewHistory={handleViewCustomerHistory}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h4>
                  <p className="text-gray-600">Bookings will appear here once customers start booking your services.</p>
                </div>
              )}
            </div>

            {/* Business Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Bookings</span>
                    <span className="font-semibold">{stats.totalBookings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Revenue</span>
                    <span className="font-semibold">${stats.totalRevenue}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-semibold">
                      {stats.totalBookings > 0 
                        ? Math.round((stats.completedBookings / stats.totalBookings) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="font-semibold">{stats.pendingBookings} bookings</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Confirmed</p>
                      <p className="font-semibold">{stats.confirmedBookings} bookings</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="font-semibold">{stats.completedBookings} bookings</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Manage Bookings</h2>
              <div className="flex space-x-2">
                <select className="form-input">
                  <option>All Bookings</option>
                  <option>Pending</option>
                  <option>Confirmed</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {bookings.map((booking) => (
                <EnhancedBookingCard
                  key={booking.id}
                  booking={booking}
                  onUpdateBooking={handleUpdateBooking}
                  onViewHistory={handleViewCustomerHistory}
                />
              ))}
              
              {bookings.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                  <p className="text-gray-600">Bookings will appear here once customers start booking your services.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Management</h2>
              <p className="text-gray-600">Manage customer orders, track fulfillment, and update order status</p>
            </div>
            <OrderManagement />
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Management</h2>
              <p className="text-gray-600">Manage your availability, working hours, and block out unavailable dates</p>
            </div>
            <ScheduleManager />
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">User Management</h2>
              <p className="text-gray-600">Manage user roles and permissions</p>
            </div>
            <UserManagement />
          </div>
        )}

        {/* SMS Settings Tab */}
        {activeTab === 'sms' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">SMS Reminder Settings</h2>
              <p className="text-gray-600">Configure automated SMS reminders for appointments</p>
            </div>
            <SMSSettings />
          </div>
        )}

        {/* Content Management Tab */}
        {activeTab === 'content' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Management</h2>
              <p className="text-gray-600">Manage your services, products, and content through Sanity CMS</p>
            </div>
            
            <div className="space-y-6">
              {/* Sanity CMS Card */}
              <div className="card">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                    <ExternalLink className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Sanity CMS</h3>
                    <p className="text-gray-600">Professional content management system</p>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-6">
                  Manage all your content including services, products, categories, and media through our 
                  professional CMS interface. Sanity provides a powerful and intuitive way to update your 
                  website content without needing technical knowledge.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Services Management</h4>
                    <p className="text-sm text-gray-600">Add, edit, and organize your service offerings</p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Products Catalog</h4>
                    <p className="text-sm text-gray-600">Manage your product inventory and descriptions</p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Media Library</h4>
                    <p className="text-sm text-gray-600">Upload and organize images and media files</p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Categories</h4>
                    <p className="text-sm text-gray-600">Organize content with custom categories</p>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <a
                    href="http://localhost:3334"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary flex items-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Sanity CMS</span>
                  </a>
                  
                  <a
                    href="https://www.sanity.io/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <span>View Documentation</span>
                  </a>
                </div>
              </div>
              
              {/* Migration Notice */}
              <div className="card bg-blue-50 border border-blue-200">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">Content Management Migration</h4>
                    <p className="text-blue-800 text-sm mb-3">
                      We've moved all content management (services, products, add-ons) to Sanity CMS for a better 
                      editing experience. This allows you to focus on managing your business operations while 
                      having professional content management tools.
                    </p>
                    <ul className="text-blue-800 text-sm space-y-1">
                      <li>• Services and add-ons are now managed in Sanity</li>
                      <li>• Product catalog with rich media support</li>
                      <li>• Real-time content updates</li>
                      <li>• Professional editing interface</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer History Modal */}
      {selectedCustomerId && (
        <CustomerHistory
          clientId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}
    </div>
  );
};

export default AdminPage;
