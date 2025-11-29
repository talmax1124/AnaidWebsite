import React, { useState } from 'react';
import { 
  PayPalScriptProvider, 
  PayPalButtons, 
  usePayPalScriptReducer 
} from '@paypal/react-paypal-js';
import { useCart } from '../contexts/CartContext';
import { createOrder, generateOrderNumber } from '../services/ecommerceService';
import { Order, Address } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface PayPalCheckoutProps {
  shippingAddress: Address;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
}

interface PayPalOrderData {
  intent: string;
  purchase_units: {
    amount: {
      currency_code: string;
      value: string;
      breakdown: {
        item_total: {
          currency_code: string;
          value: string;
        };
        shipping: {
          currency_code: string;
          value: string;
        };
        tax_total: {
          currency_code: string;
          value: string;
        };
      };
    };
    items: {
      name: string;
      unit_amount: {
        currency_code: string;
        value: string;
      };
      quantity: string;
      sku: string;
    }[];
    shipping: {
      name: {
        full_name: string;
      };
      address: {
        address_line_1: string;
        address_line_2?: string;
        admin_area_2: string;
        admin_area_1: string;
        postal_code: string;
        country_code: string;
      };
    };
  }[];
}

// Component to handle PayPal button rendering with loading states
const PayPalButtonsWrapper: React.FC<PayPalCheckoutProps> = ({
  shippingAddress,
  onSuccess,
  onError
}) => {
  const [{ isPending }] = usePayPalScriptReducer();
  const { cart } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Loading PayPal...</span>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center p-8 text-gray-600">
        Your cart is empty
      </div>
    );
  }

  const createPayPalOrder = async (): Promise<string> => {
    try {
      setIsProcessing(true);

      // Prepare order data for PayPal
      const orderData: PayPalOrderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: cart.total.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: cart.subtotal.toFixed(2),
              },
              shipping: {
                currency_code: 'USD',
                value: (cart.shipping?.cost || 0).toFixed(2),
              },
              tax_total: {
                currency_code: 'USD',
                value: (cart.tax || 0).toFixed(2),
              },
            },
          },
          items: cart.items.map(item => ({
            name: item.productId, // You might want to fetch product name here
            unit_amount: {
              currency_code: 'USD',
              value: item.price.toFixed(2),
            },
            quantity: item.quantity.toString(),
            sku: item.productId,
          })),
          shipping: {
            name: {
              full_name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
            },
            address: {
              address_line_1: shippingAddress.address1,
              address_line_2: shippingAddress.address2,
              admin_area_2: shippingAddress.city,
              admin_area_1: shippingAddress.province,
              postal_code: shippingAddress.postalCode,
              country_code: shippingAddress.country,
            },
          },
        }],
      };

      // Create PayPal order
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create PayPal order');
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      onError('Failed to create payment order');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const onApprove = async (data: { orderID: string }) => {
    try {
      setIsProcessing(true);

      // Capture the PayPal payment
      const response = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderID: data.orderID }),
      });

      if (!response.ok) {
        throw new Error('Failed to capture PayPal payment');
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const paypalOrder = await response.json(); // PayPal order response (not used in current implementation)

      // Create our internal order
      const orderNumber = generateOrderNumber();
      const order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
        orderNumber,
        userId: user?.id,
        customerInfo: {
          email: user?.email || '',
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          phone: shippingAddress.phone,
        },
        items: cart.items.map(item => ({
          productId: item.productId,
          productName: item.productId, // You might want to fetch product name here
          sku: item.productId,
          variantOptions: item.variantOptions,
          quantity: item.quantity,
          price: item.price,
          image: '', // You might want to fetch product image here
        })),
        subtotal: cart.subtotal,
        discount: cart.discount,
        shipping: {
          method: cart.shipping?.method || 'Standard',
          cost: cart.shipping?.cost || 0,
          address: shippingAddress,
        },
        tax: cart.tax || 0,
        total: cart.total,
        paymentStatus: 'paid',
        fulfillmentStatus: 'pending',
        paymentMethod: 'paypal',
        paymentId: data.orderID,
      };

      const orderId = await createOrder(order);
      onSuccess(orderId);
    } catch (error) {
      console.error('Error processing PayPal payment:', error);
      onError('Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const onCancel = () => {
    onError('Payment was cancelled');
  };

  const onPayPalError = (err: any) => {
    console.error('PayPal error:', err);
    onError('PayPal payment error occurred');
  };

  return (
    <div className="relative">
      {isProcessing && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Processing payment...</span>
          </div>
        </div>
      )}
      
      <PayPalButtons
        createOrder={createPayPalOrder}
        onApprove={onApprove}
        onCancel={onCancel}
        onError={onPayPalError}
        style={{
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
        }}
        disabled={isProcessing}
      />
    </div>
  );
};

// Main PayPal checkout component
const PayPalCheckout: React.FC<PayPalCheckoutProps> = (props) => {
  const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        PayPal configuration is missing. Please contact support.
      </div>
    );
  }

  const paypalOptions = {
    'clientId': clientId,
    'currency': 'USD',
    'intent': 'capture' as const,
    'components': 'buttons',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Pay with PayPal
        </h3>
        <p className="text-sm text-gray-600">
          Secure payment processing powered by PayPal
        </p>
      </div>
      
      <PayPalScriptProvider options={paypalOptions}>
        <PayPalButtonsWrapper {...props} />
      </PayPalScriptProvider>
    </div>
  );
};

export default PayPalCheckout;