import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  CreditCard,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

interface OrderItem {
  id: string;
  productId?: string;
  product_id?: string;
  name?: string;
  product_name?: string;
  sku?: string;
  quantity: number;
  price: number;
  image?: string;
  image_url?: string;
  variant_options?: any;
  addOns?: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
}

interface OrderDetails {
  id: string;
  orderNumber?: string;
  order_number?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  fulfillment_status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  fulfillmentStatus?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  payment_method?: string;
  subtotal: number;
  discount?: number;
  discount_amount?: number;
  shipping_cost?: number;
  shipping_tracking_number?: string;
  shipping_address?: string | any;
  shipping?: {
    cost?: number;
    method?: string;
    trackingNumber?: string;
    carrier?: string;
    address?: {
      firstName: string;
      lastName: string;
      address1: string;
      address2?: string;
      city: string;
      province: string;
      postalCode: string;
      country: string;
    };
  };
  tax: number;
  total: number;
  items: OrderItem[];
  timeline?: {
    status: string;
    timestamp: string;
    description: string;
  }[];
  discountCode?: {
    code: string;
    description: string;
  };
}

const OrderStatusPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { accessToken, isAuthenticated, user } = useAuth();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchOrderDetails = useCallback(async () => {
    if (!isAuthenticated || !accessToken || !user) {
      setError('Authentication required to view order details');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.get(`/orders/${user.id}/${orderId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, accessToken, user, orderId]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, fetchOrderDetails]);

  const copyOrderNumber = () => {
    if (order) {
      navigator.clipboard.writeText(getOrderNumber(order));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper to get the correct status field from order data
  const getOrderStatus = (orderData: OrderDetails) => {
    return orderData.fulfillmentStatus || orderData.fulfillment_status || orderData.status || 'pending';
  };

  // Helper to get order number
  const getOrderNumber = (orderData: OrderDetails) => {
    return orderData.orderNumber || orderData.order_number || orderData.id;
  };

  // Helper to get created date
  const getCreatedAt = (orderData: OrderDetails) => {
    return orderData.createdAt || orderData.created_at || new Date().toISOString();
  };

  // Helper to get payment status
  const getPaymentStatus = (orderData: OrderDetails) => {
    return orderData.paymentStatus || orderData.payment_status || 'pending';
  };

  // Helper to get payment method
  const getPaymentMethod = (orderData: OrderDetails) => {
    return orderData.paymentMethod || orderData.payment_method || 'N/A';
  };

  // Helper to get shipping tracking number
  const getTrackingNumber = (orderData: OrderDetails) => {
    return orderData.shipping?.trackingNumber || orderData.shipping_tracking_number || null;
  };

  // Helper to get shipping cost
  const getShippingCost = (orderData: OrderDetails) => {
    return orderData.shipping?.cost || orderData.shipping_cost || 0;
  };

  // Helper to parse shipping address
  const getShippingAddress = (orderData: OrderDetails) => {
    // If we have a nested shipping object with address
    if (orderData.shipping?.address) {
      return orderData.shipping.address;
    }
    
    // If shipping_address is a JSON string, try to parse it
    if (orderData.shipping_address && typeof orderData.shipping_address === 'string') {
      try {
        const parsed = JSON.parse(orderData.shipping_address);
        return parsed;
      } catch (e) {
        console.warn('Could not parse shipping address:', orderData.shipping_address);
      }
    }
    
    // Return the object if it's already parsed
    if (orderData.shipping_address && typeof orderData.shipping_address === 'object') {
      return orderData.shipping_address;
    }
    
    // Default fallback
    return {
      firstName: 'N/A',
      lastName: '',
      address1: 'Address not available',
      city: '',
      province: '',
      postalCode: '',
      country: ''
    };
  };

  // Helper to get discount amount
  const getDiscountAmount = (orderData: OrderDetails) => {
    return orderData.discount || orderData.discount_amount || 0;
  };

  // Helper to get item name
  const getItemName = (item: OrderItem) => {
    return item.name || item.product_name || `Product ${(item.productId || item.product_id || '').slice(0, 8)}`;
  };

  // Helper to get item image
  const getItemImage = (item: OrderItem) => {
    return item.image || item.image_url;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'shipped':
        return <Truck className="w-6 h-6 text-blue-500" />;
      case 'processing':
        return <Package className="w-6 h-6 text-yellow-500" />;
      case 'cancelled':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-50';
      case 'shipped':
        return 'text-blue-600 bg-blue-50';
      case 'processing':
        return 'text-yellow-600 bg-yellow-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return 25;
      case 'processing':
        return 50;
      case 'shipped':
        return 75;
      case 'delivered':
        return 100;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <span className="text-gray-600">Loading order details...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || "We couldn't find the order you're looking for."}
          </p>
          <Link to="/profile" className="btn-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/profile"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Order Details
              </h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center space-x-2">
                  <span>Order #</span>
                  <span className="font-mono font-semibold">{getOrderNumber(order)}</span>
                  <button
                    onClick={copyOrderNumber}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Copy order number"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {copied && <span className="text-green-600 text-sm">Copied!</span>}
                </div>
                <span>•</span>
                <span>{new Date(getCreatedAt(order)).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center space-x-3">
              {getStatusIcon(getOrderStatus(order))}
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(getOrderStatus(order))}`}>
                {getOrderStatus(order).charAt(0).toUpperCase() + getOrderStatus(order).slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Order Progress & Items */}
          <div className="xl:col-span-2 space-y-6">
            {/* Order Progress */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Status</h2>
              
              {/* Progress Bar */}
              <div className="relative mb-6">
                <div className="flex items-center justify-between">
                  {['Confirmed', 'Processing', 'Shipped', 'Delivered'].map((step, index) => (
                    <div
                      key={step}
                      className={`flex items-center space-x-2 ${
                        index * 25 <= getProgressPercentage(getOrderStatus(order)) - 25
                          ? 'text-primary-600'
                          : 'text-gray-400'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index * 25 <= getProgressPercentage(getOrderStatus(order)) - 25
                            ? 'bg-primary-600'
                            : 'bg-gray-300'
                        }`}
                      />
                      <span className="text-sm font-medium">{step}</span>
                    </div>
                  ))}
                </div>
                <div className="absolute top-1.5 left-0 right-0 h-0.5 bg-gray-200 -z-10">
                  <div
                    className="h-full bg-primary-600 transition-all duration-300"
                    style={{ width: `${getProgressPercentage(getOrderStatus(order))}%` }}
                  />
                </div>
              </div>

              {/* Timeline */}
              {order.timeline && order.timeline.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Timeline</h3>
                  {order.timeline.map((event, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {event.description}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Items Ordered</h2>
              
              <div className="space-y-4">
                {order.items && order.items.length > 0 ? order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg">
                    {getItemImage(item) && (
                      <img
                        src={getItemImage(item)}
                        alt={getItemName(item)}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{getItemName(item)}</h3>
                      {item.sku && (
                        <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span>Qty: {item.quantity}</span>
                        <span>Price: ${(typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0).toFixed(2)}</span>
                      </div>
                      
                      {/* Add-ons */}
                      {item.addOns && item.addOns.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium text-gray-700">Add-ons:</p>
                          {item.addOns.map((addon) => (
                            <div key={addon.id} className="text-xs text-gray-600 ml-2">
                              • {addon.name} (${(typeof addon.price === 'number' ? addon.price : parseFloat(addon.price) || 0).toFixed(2)})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        ${((typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-gray-500 py-8">
                    No items found for this order.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary & Details */}
          <div className="xl:col-span-1 space-y-6">
            {/* Tracking Information */}
            {getTrackingNumber(order) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tracking Information</h2>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tracking Number
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm text-gray-900">
                        {getTrackingNumber(order)}
                      </span>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Copy className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  
                  {order.shipping?.carrier && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Carrier
                      </label>
                      <span className="text-sm text-gray-900">{order.shipping.carrier}</span>
                    </div>
                  )}
                  
                  <button className="btn-primary btn-sm w-full flex items-center justify-center space-x-2">
                    <ExternalLink className="w-4 h-4" />
                    <span>Track Package</span>
                  </button>
                </div>
              </div>
            )}

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Shipping Address
              </h2>
              
              <div className="text-sm text-gray-900 space-y-1">
                {(() => {
                  const address = getShippingAddress(order);
                  
                  // Safety check to ensure address is a valid object
                  if (!address || typeof address !== 'object') {
                    return <div className="text-gray-500">Address information not available</div>;
                  }
                  
                  return (
                    <>
                      <div className="font-medium">
                        {address.firstName || ''} {address.lastName || ''}
                      </div>
                      <div>{address.address1 || ''}</div>
                      {address.address2 && (
                        <div>{address.address2}</div>
                      )}
                      <div>
                        {address.city || ''}{address.city && ', '}{address.province || ''} {address.postalCode || ''}
                      </div>
                      <div>{address.country || ''}</div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment Information
              </h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="text-gray-900 capitalize">{getPaymentMethod(order)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status</span>
                  <span className={`font-medium ${
                    getPaymentStatus(order) === 'paid' ? 'text-green-600' : 
                    getPaymentStatus(order) === 'failed' ? 'text-red-600' : 
                    'text-yellow-600'
                  }`}>
                    {getPaymentStatus(order).charAt(0).toUpperCase() + getPaymentStatus(order).slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${(typeof order.subtotal === 'number' ? order.subtotal : parseFloat(order.subtotal) || 0).toFixed(2)}</span>
                </div>
                
                {order.discountCode && getDiscountAmount(order) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({order.discountCode.code})</span>
                    <span>-${(typeof getDiscountAmount(order) === 'number' ? getDiscountAmount(order) : parseFloat(getDiscountAmount(order)) || 0).toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping {order.shipping?.method ? `(${order.shipping.method})` : ''}</span>
                  <span className="text-gray-900">
                    {getShippingCost(order) === 0 ? 'FREE' : `$${(typeof getShippingCost(order) === 'number' ? getShippingCost(order) : parseFloat(getShippingCost(order)) || 0).toFixed(2)}`}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">${(typeof order.tax === 'number' ? order.tax : parseFloat(order.tax) || 0).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between pt-3 border-t border-gray-200 font-semibold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">${(typeof order.total === 'number' ? order.total : parseFloat(order.total) || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h2>
              
              <div className="space-y-3">
                <button className="w-full btn-secondary">
                  Contact Support
                </button>
                
                {getOrderStatus(order) === 'delivered' && (
                  <button className="w-full btn-secondary">
                    Leave Review
                  </button>
                )}
                
                {getPaymentStatus(order) === 'paid' && (
                  <button className="w-full btn-secondary">
                    Request Return
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusPage;
