import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  Users,
  Settings,
  MessageSquare,
  BarChart3,
  ExternalLink
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

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'schedule' | 'users' | 'sms' | 'content'>('overview');
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
            Welcome back, {user?.firstName || 'Admin'}!
          </h1>
          <p className="text-gray-600">Manage your services, bookings, and business settings</p>
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

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Manage Services</h2>
              <button
                onClick={() => {
                  setEditingService(null);
                  setIsServiceModalOpen(true);
                }}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Service</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div key={service.id} className="card relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{service.icon}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-600">{service.category}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleServiceActive(service)}
                        className={`p-2 rounded-lg ${
                          service.active 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={service.active ? 'Deactivate service' : 'Activate service'}
                      >
                        {service.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingService(service);
                          setIsServiceModalOpen(true);
                        }}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{service.duration}min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>${service.price}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      service.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {service.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add-Ons Tab */}
        {activeTab === 'addons' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Manage Add-Ons</h2>
              <button
                onClick={() => {
                  setEditingAddOn(null);
                  setIsAddOnModalOpen(true);
                }}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add New Add-On</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {addOns.map((addOn) => (
                <div key={addOn.id} className="card relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-3xl">{addOn.icon}</div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingAddOn(addOn);
                          setIsAddOnModalOpen(true);
                        }}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAddOn(addOn.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateAddOn(addOn.id, { active: !addOn.active })}
                        className={`p-2 rounded-lg ${
                          addOn.active 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {addOn.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{addOn.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{addOn.description}</p>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <span className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      ${addOn.price}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      +{addOn.duration}min
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Compatible with:</p>
                    <div className="flex flex-wrap gap-1">
                      {addOn.compatibleServices.map(serviceId => {
                        const service = services.find(s => s.id === serviceId);
                        return service ? (
                          <span key={serviceId} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {service.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      addOn.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {addOn.active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">{addOn.category}</span>
                  </div>
                </div>
              ))}
            </div>

            {addOns.length === 0 && (
              <div className="text-center py-12">
                <Plus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No add-ons yet</h3>
                <p className="text-gray-600">Create your first add-on to enhance your services.</p>
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Manage Products</h2>
              <div className="flex space-x-2">
                <button
                  onClick={handleInitializeSampleData}
                  disabled={isInitializingData}
                  className="btn-secondary"
                >
                  {isInitializingData ? 'Initializing...' : 'Add Sample Data'}
                </button>
                <button className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </button>
              </div>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="card">
                    <div className="flex items-start space-x-4">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {product.images.length > 0 ? (
                          <img
                            src={product.images.find(img => img.isPrimary)?.url || product.images[0].url}
                            alt={product.images.find(img => img.isPrimary)?.altText || product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900 mb-1">
                              {product.name}
                            </h3>
                            <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                              {product.shortDescription || product.description}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="font-medium text-primary-600">
                                ${product.price.toFixed(2)}
                              </span>
                              {product.compareAtPrice && product.compareAtPrice > product.price && (
                                <span className="line-through">
                                  ${product.compareAtPrice.toFixed(2)}
                                </span>
                              )}
                              <span className="capitalize">{product.category}</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {product.active ? 'Active' : 'Inactive'}
                              </span>
                              {product.featured && (
                                <span className="px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-2">
                            <button className="text-blue-600 hover:text-blue-800">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              className={`${product.active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                            >
                              {product.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button className="text-red-600 hover:text-red-800">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Inventory Info */}
                        {product.inventory.trackQuantity && (
                          <div className="mt-2 text-xs">
                            <span className={`px-2 py-1 rounded-full ${product.inventory.quantity <= product.inventory.lowStockThreshold ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                              {product.inventory.quantity} in stock
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-600 mb-4">
                  Add your first product or initialize with sample data to get started.
                </p>
                <button
                  onClick={handleInitializeSampleData}
                  disabled={isInitializingData}
                  className="btn-primary"
                >
                  {isInitializingData ? 'Initializing...' : 'Add Sample Products'}
                </button>
              </div>
            )}
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
      </div>

      {/* Service Modal */}
      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => {
          setIsServiceModalOpen(false);
          setEditingService(null);
        }}
        onSubmit={editingService ? handleUpdateService : handleCreateService}
        service={editingService}
      />

      {/* Add-On Modal */}
      <AddOnModal
        isOpen={isAddOnModalOpen}
        onClose={() => {
          setIsAddOnModalOpen(false);
          setEditingAddOn(null);
        }}
        onSubmit={editingAddOn ? handleUpdateAddOn : handleCreateAddOn}
        addOn={editingAddOn}
        services={services.filter(s => s.active)}
      />

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