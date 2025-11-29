import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  User, 
  Package, 
  MapPin, 
  CreditCard, 
  Calendar,
  Edit,
  Loader2,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
  Eye,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { ManageBookingSection } from './ManageBookingPage';

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }[];
  tracking?: string;
}

type TabId = 'profile' | 'orders' | 'appointments' | 'addresses' | 'preferences';

const ProfilePage: React.FC = () => {
  const { user, loading: authLoading, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && user) {
      fetchUserData();
    }
  }, [authLoading, user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') as TabId | null;

    if (tabParam && ['profile', 'orders', 'appointments', 'addresses', 'preferences'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const ordersResponse = await apiService.get('/orders/user');
      setOrders(ordersResponse.data.orders || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setEditForm({
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      phone: user.phone || ''
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      firstName: '',
      lastName: '',
      phone: ''
    });
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdateLoading(true);

      const updateData = {
        first_name: editForm.firstName,
        last_name: editForm.lastName,
        phone: editForm.phone
      };

      const response = await apiService.put('/users/profile', updateData);
      
      console.log('Profile update response:', response);
      
      // Handle different response structures
      if (response.success || response.data || response) {
        const userData = response.data || response.user || response;
        
        // Update the user context with new data
        if (updateUser) {
          updateUser({
            ...user,
            first_name: userData.first_name || editForm.firstName,
            last_name: userData.last_name || editForm.lastName,
            phone: userData.phone || editForm.phone
          });
        }
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'shipped':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'processing':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <span className="text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
          <Link to="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
          <button 
            onClick={fetchUserData}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'preferences', label: 'Preferences', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-600">Manage your account, orders, and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-lg">
                      {user.first_name?.charAt(0) || user.email?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
              
              <nav className="p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-700 border border-primary-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                    {!isEditing ? (
                      <button 
                        onClick={handleEditProfile}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={handleUpdateProfile}
                          disabled={updateLoading}
                          className="btn-primary flex items-center space-x-2"
                        >
                          {updateLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          <span>Save</span>
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          disabled={updateLoading}
                          className="btn-secondary flex items-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <div className="text-gray-900">{user.first_name || 'Not provided'}</div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <div className="text-gray-900">{user.last_name || 'Not provided'}</div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="text-gray-900">{user.email}</div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <div className="text-gray-900">
                          {user.phone || 'Not provided'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={editForm.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Enter your first name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={editForm.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Enter your last name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                          {user.email}
                          <span className="text-sm text-gray-500 ml-2">(Cannot be changed)</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Order History</h2>
                    <span className="text-sm text-gray-600">
                      {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                    </span>
                  </div>

                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                      <p className="text-gray-600 mb-6">
                        When you place your first order, it will appear here.
                      </p>
                      <Link to="/products" className="btn-primary">
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  Order #{order.orderNumber}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {new Date(order.createdAt || order.created_at || order.date).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getOrderStatusIcon(order.fulfillmentStatus || order.fulfillment_status || 'pending')}
                                <span className={`px-3 py-1 text-xs font-medium border rounded-full ${getOrderStatusColor(order.fulfillmentStatus || order.fulfillment_status || 'pending')}`}>
                                  {((order.fulfillmentStatus || order.fulfillment_status || 'pending').charAt(0).toUpperCase() + (order.fulfillmentStatus || order.fulfillment_status || 'pending').slice(1))}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-900">
                                ${(typeof order.total === 'number' ? order.total : parseFloat(order.total) || 0).toFixed(2)}
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <Link
                                  to={`/orders/${order.id}`}
                                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View Details
                                </Link>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-gray-100 pt-4">
                            <div className="flex items-center space-x-4">
                              {order.items.slice(0, 3).map((item, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  {(item.image_url || item.image) && (
                                    <img
                                      src={item.image_url || item.image}
                                      alt={item.product_name || item.name}
                                      className="w-8 h-8 rounded object-cover"
                                    />
                                  )}
                                  <span className="text-sm text-gray-600">
                                    {item.quantity}x {item.product_name || item.name}
                                  </span>
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <span className="text-sm text-gray-500">
                                  +{order.items.length - 3} more items
                                </span>
                              )}
                            </div>
                            
                            {order.tracking && (
                              <div className="mt-3 flex items-center space-x-2 text-sm">
                                <Truck className="w-4 h-4 text-blue-500" />
                                <span className="text-gray-600">Tracking:</span>
                                <span className="font-mono text-primary-600">{order.tracking}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'appointments' && (
                <div className="p-6 space-y-6">
                  <ManageBookingSection embedded />
                  <div className="border border-dashed border-primary-200 rounded-lg p-6 bg-primary-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to book a new appointment?</h3>
                    <p className="text-gray-600 mb-4">
                      Browse the full list of services and pick your treatment on the Services page.
                      Once selected, complete your booking using the form on that page.
                    </p>
                    <Link to="/services#booking" className="btn-primary inline-flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Explore Services</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Addresses Tab */}
              {activeTab === 'addresses' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Saved Addresses</h2>
                    <button className="btn-primary">Add Address</button>
                  </div>

                  <div className="text-center py-12">
                    <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No addresses saved</h3>
                    <p className="text-gray-600 mb-6">
                      Add your shipping and billing addresses for faster checkout.
                    </p>
                    <button className="btn-primary">Add Your First Address</button>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Preferences</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded text-primary-600" defaultChecked />
                          <span className="ml-3 text-gray-700">Email notifications for order updates</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded text-primary-600" defaultChecked />
                          <span className="ml-3 text-gray-700">SMS notifications for shipping updates</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded text-primary-600" />
                          <span className="ml-3 text-gray-700">Marketing emails and promotions</span>
                        </label>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded text-primary-600" defaultChecked />
                          <span className="ml-3 text-gray-700">Save purchase history</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded text-primary-600" />
                          <span className="ml-3 text-gray-700">Personalized product recommendations</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <button className="btn-primary">Save Preferences</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
