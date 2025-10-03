import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Clock, 
  Users,
  Settings,
  Eye,
  EyeOff,
  MessageSquare
} from 'lucide-react';
import { Service, AddOn, Booking } from '../types';
import { 
  subscribeToServices, 
  subscribeToAddOns,
  subscribeToBookings,
  createService,
  updateService,
  deleteService,
  createAddOn,
  updateAddOn,
  deleteAddOn,
  updateBooking
} from '../services/firebaseService';
import ServiceModal from '../components/ServiceModal';
import AddOnModal from '../components/AddOnModal';
import EnhancedBookingCard from '../components/EnhancedBookingCard';
import CustomerHistory from '../components/CustomerHistory';
import ScheduleManager from '../components/ScheduleManager';
import UserManagement from '../components/UserManagement';
import SMSSettings from '../components/SMSSettings';

const AdminPage: React.FC = () => {
  const { user } = useUser();
  const [services, setServices] = useState<Service[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'addons' | 'bookings' | 'schedule' | 'users' | 'sms'>('services');
  const [loading, setLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to real-time services
    const unsubscribeServices = subscribeToServices((servicesData) => {
      setServices(servicesData);
      setLoading(false);
    });

    // Subscribe to real-time add-ons
    const unsubscribeAddOns = subscribeToAddOns((addOnsData) => {
      setAddOns(addOnsData);
    });

    // Subscribe to real-time bookings
    const unsubscribeBookings = subscribeToBookings((bookingsData) => {
      setBookings(bookingsData);
    });

    return () => {
      unsubscribeServices();
      unsubscribeAddOns();
      unsubscribeBookings();
    };
  }, []);

  const handleCreateService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createService(serviceData);
      setIsServiceModalOpen(false);
    } catch (error) {
      console.error('Error creating service:', error);
    }
  };

  const handleUpdateService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingService) return;
    
    try {
      await updateService(editingService.id, serviceData);
      setEditingService(null);
      setIsServiceModalOpen(false);
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await deleteService(id);
      } catch (error) {
        console.error('Error deleting service:', error);
      }
    }
  };

  const handleCreateAddOn = async (addOnData: Omit<AddOn, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createAddOn(addOnData);
      setIsAddOnModalOpen(false);
    } catch (error) {
      console.error('Error creating add-on:', error);
    }
  };

  const handleUpdateAddOn = async (addOnData: Omit<AddOn, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingAddOn) return;
    
    try {
      await updateAddOn(editingAddOn.id, addOnData);
      setEditingAddOn(null);
      setIsAddOnModalOpen(false);
    } catch (error) {
      console.error('Error updating add-on:', error);
    }
  };

  const handleDeleteAddOn = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this add-on?')) {
      try {
        await deleteAddOn(id);
      } catch (error) {
        console.error('Error deleting add-on:', error);
      }
    }
  };

  const handleToggleServiceActive = async (service: Service) => {
    try {
      await updateService(service.id, { active: !service.active });
    } catch (error) {
      console.error('Error toggling service status:', error);
    }
  };

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
    totalServices: services.length,
    activeServices: services.filter(s => s.active).length,
    totalAddOns: addOns.length,
    activeAddOns: addOns.filter(a => a.active).length,
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
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
                <p className="text-sm text-gray-600 mb-1">Total Services</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalServices}</p>
                <p className="text-xs text-green-600">{stats.activeServices} active</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>

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
                <p className="text-sm text-gray-600 mb-1">Confirmed Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.confirmedBookings}</p>
                <p className="text-xs text-green-600">Active appointments</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue}</p>
                <p className="text-xs text-primary-600">Completed bookings</p>
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
              { id: 'services', label: 'Services', icon: Settings },
              { id: 'addons', label: 'Add-Ons', icon: Plus },
              { id: 'bookings', label: 'Bookings', icon: Calendar },
              { id: 'schedule', label: 'Schedule', icon: Clock },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'sms', label: 'SMS Settings', icon: MessageSquare },
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