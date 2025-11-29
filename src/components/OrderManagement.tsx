import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Search, 
  Eye, 
  MoreVertical,
  User,
  DollarSign,
  ShoppingBag,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  image_url?: string;
  sku?: string;
}

interface Order {
  id: string;
  order_number: string;
  user_id: number;
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone?: string;
  subtotal: number;
  discount: number;
  shipping_cost: number;
  tax: number;
  total: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  fulfillment_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: string;
  shipping_address?: string;
  shipping_tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

const OrderManagement: React.FC = () => {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  // Fetch all orders
  const fetchOrders = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch all orders using cookie authentication
      const response = await fetch('http://localhost:3001/api/orders/admin', {
        method: 'GET',
        credentials: 'include', // Important for cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || []);
      } else {
        console.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      fetchOrders();
    }
  }, [accessToken, fetchOrders]);

  // Update order status
  const updateOrderStatus = async (orderId: string, updates: { payment_status?: string; fulfillment_status?: string; shipping_tracking_number?: string }) => {
    try {
      setUpdating(orderId);
      const response = await fetch(`http://localhost:3001/api/orders/${orderId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await fetchOrders(); // Refresh orders list
      } else {
        console.error('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setUpdating(null);
    }
  };

  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.customer_first_name} ${order.customer_last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.fulfillment_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600 bg-yellow-100' };
      case 'confirmed':
        return { icon: CheckCircle, color: 'text-blue-600 bg-blue-100' };
      case 'processing':
        return { icon: Package, color: 'text-purple-600 bg-purple-100' };
      case 'shipped':
        return { icon: Truck, color: 'text-green-600 bg-green-100' };
      case 'delivered':
        return { icon: CheckCircle, color: 'text-green-600 bg-green-100' };
      case 'cancelled':
        return { icon: AlertCircle, color: 'text-red-600 bg-red-100' };
      default:
        return { icon: Clock, color: 'text-gray-600 bg-gray-100' };
    }
  };

  const getPaymentStatusDisplay = (status: string) => {
    switch (status) {
      case 'paid':
        return { text: 'Paid', color: 'text-green-600 bg-green-100' };
      case 'pending':
        return { text: 'Pending', color: 'text-yellow-600 bg-yellow-100' };
      case 'failed':
        return { text: 'Failed', color: 'text-red-600 bg-red-100' };
      case 'refunded':
        return { text: 'Refunded', color: 'text-gray-600 bg-gray-100' };
      default:
        return { text: 'Unknown', color: 'text-gray-600 bg-gray-100' };
    }
  };

  const parseShippingAddress = (addressData: string | object | null) => {
    try {
      if (!addressData) return 'Address not available';
      
      let address;
      
      // If it's a string, try to parse it
      if (typeof addressData === 'string') {
        try {
          address = JSON.parse(addressData);
        } catch (e) {
          // If parsing fails, it might already be a plain text address
          return addressData;
        }
      } else if (typeof addressData === 'object') {
        // If it's already an object, use it directly
        address = addressData;
      } else {
        return 'Address not available';
      }
      
      // Format the address object into a string
      if (address && typeof address === 'object') {
        const firstName = address.firstName || '';
        const lastName = address.lastName || '';
        const address1 = address.address1 || '';
        const city = address.city || '';
        const province = address.province || '';
        const postalCode = address.postalCode || '';
        
        return `${firstName} ${lastName}, ${address1}, ${city}, ${province} ${postalCode}`.replace(/\s+/g, ' ').trim();
      }
      
      return 'Address not available';
    } catch (e) {
      return 'Address not available';
    }
  };

  // Order statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.fulfillment_status === 'pending').length,
    processing: orders.filter(o => o.fulfillment_status === 'processing').length,
    shipped: orders.filter(o => o.fulfillment_status === 'shipped').length,
    delivered: orders.filter(o => o.fulfillment_status === 'delivered').length,
    totalRevenue: orders.reduce((sum, order) => sum + (typeof order.total === 'number' ? order.total : parseFloat(order.total) || 0), 0),
    paidOrders: orders.filter(o => o.payment_status === 'paid').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-primary-600" />
          <span>Loading orders...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1 md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order number, email, or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              onClick={fetchOrders}
              className="flex items-center space-x-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria' 
                : 'Orders will appear here once customers start placing orders'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const statusDisplay = getStatusDisplay(order.fulfillment_status);
                  const paymentDisplay = getPaymentStatusDisplay(order.payment_status);
                  const StatusIcon = statusDisplay.icon;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.order_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.items?.length || 0} items
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.customer_first_name} {order.customer_last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customer_email}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1 rounded-full ${statusDisplay.color}`}>
                            <StatusIcon className="w-3 h-3" />
                          </div>
                          <span className="text-sm font-medium capitalize">
                            {order.fulfillment_status}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${paymentDisplay.color}`}>
                          {paymentDisplay.text}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(typeof order.total === 'number' ? order.total : parseFloat(order.total) || 0).toFixed(2)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderDetail(true);
                            }}
                            className="text-primary-600 hover:text-primary-900 p-1"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <div className="relative group">
                            <button className="text-gray-400 hover:text-gray-600 p-1">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {/* Quick Status Update Dropdown */}
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                              <div className="py-1">
                                <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">
                                  Update Status
                                </div>
                                {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => updateOrderStatus(order.id, { fulfillment_status: status })}
                                    disabled={updating === order.id}
                                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 capitalize disabled:opacity-50"
                                  >
                                    {updating === order.id ? 'Updating...' : status}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Order {selectedOrder.order_number}
                  </h2>
                  <p className="text-gray-600">
                    Placed on {new Date(selectedOrder.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowOrderDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Items */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                  <div className="space-y-4">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                          {item.sku && (
                            <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>Qty: {item.quantity}</span>
                            <span>Price: ${(typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            ${((typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0) * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500">No items found</p>
                    )}
                  </div>
                </div>

                {/* Order Summary & Customer Info */}
                <div className="space-y-6">
                  {/* Customer Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Customer Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {selectedOrder.customer_first_name} {selectedOrder.customer_last_name}</p>
                      <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
                      {selectedOrder.customer_phone && (
                        <p><strong>Phone:</strong> {selectedOrder.customer_phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Shipping Information */}
                  {selectedOrder.shipping_address && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Truck className="w-4 h-4 mr-2" />
                        Shipping Information
                      </h4>
                      <div className="text-sm">
                        <p>{parseShippingAddress(selectedOrder.shipping_address)}</p>
                        {selectedOrder.shipping_tracking_number && (
                          <p className="mt-2">
                            <strong>Tracking:</strong> {selectedOrder.shipping_tracking_number}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Order Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Order Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${(typeof selectedOrder.subtotal === 'number' ? selectedOrder.subtotal : parseFloat(selectedOrder.subtotal) || 0).toFixed(2)}</span>
                      </div>
                      {selectedOrder.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>-${(typeof selectedOrder.discount === 'number' ? selectedOrder.discount : parseFloat(selectedOrder.discount) || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>{selectedOrder.shipping_cost === 0 ? 'FREE' : `$${(typeof selectedOrder.shipping_cost === 'number' ? selectedOrder.shipping_cost : parseFloat(selectedOrder.shipping_cost) || 0).toFixed(2)}`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>${(typeof selectedOrder.tax === 'number' ? selectedOrder.tax : parseFloat(selectedOrder.tax) || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total:</span>
                        <span>${(typeof selectedOrder.total === 'number' ? selectedOrder.total : parseFloat(selectedOrder.total) || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Quick Actions</h4>
                    <div className="space-y-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            updateOrderStatus(selectedOrder.id, { fulfillment_status: e.target.value });
                            e.target.value = '';
                          }
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        defaultValue=""
                      >
                        <option value="">Update Fulfillment Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            updateOrderStatus(selectedOrder.id, { payment_status: e.target.value });
                            e.target.value = '';
                          }
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        defaultValue=""
                      >
                        <option value="">Update Payment Status</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                  </div>

                  {selectedOrder.notes && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                      <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;