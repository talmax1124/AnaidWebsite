import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowLeft, Truck } from 'lucide-react';
import { ordersAPI } from '../services/apiService';
import { useCart } from '../contexts/CartContext';
import { generateOrderNumber } from '../services/ecommerceService';

const CheckoutSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<any>(null);
  const { clearCart } = useCart();

  // Email service function
  const sendOrderConfirmationEmail = async (order: any, customerInfo: any) => {
    try {
      const PLUNK_API_KEY = 'sk_257aa612793467b1234c042f0bf71ece77b621a27b1dc70d';
      const PLUNK_API_URL = 'https://api.useplunk.com/v1';
      const ADMIN_EMAIL = 'noreply@estheticsbyanna.com';

      const itemsHtml = order.items ? order.items.map((item: any) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName}</td>
          <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
          <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">$${item.price.toFixed(2)}</td>
        </tr>
      `).join('') : '';

      const emailHtml = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #ec4899, #3b82f6); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmation</h1>
          </div>
          
          <div style="padding: 30px; background: white;">
            <p style="font-size: 18px; color: #333;">Thank you for your order, ${customerInfo.firstName}!</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #ec4899; margin-top: 0;">Order Details</h2>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Order Total:</strong> $${(typeof order.total === 'number' ? order.total : parseFloat(order.total) || 0).toFixed(2)}</p>
              <p><strong>Payment Method:</strong> Square Checkout</p>
            </div>

            ${order.items ? `
            <h3 style="color: #333;">Items Ordered</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            ` : ''}
          </div>
        </div>
      `;

      await fetch(`${PLUNK_API_URL}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PLUNK_API_KEY}`,
        },
        body: JSON.stringify({
          to: customerInfo.email,
          subject: `Order Confirmation - ${order.orderNumber}`,
          body: emailHtml,
          type: 'html',
          from: {
            email: ADMIN_EMAIL,
            name: 'Esthetics By Anna'
          }
        }),
      });

      console.log('Order confirmation email sent successfully');
    } catch (error) {
      console.error('Failed to send order confirmation email:', error);
    }
  };

  useEffect(() => {
    const createOrderFromSquarePayment = async () => {
      if (isCreatingOrder || orderCreated) return;
      
      // Check for Square Payment Link success parameters
      const checkoutId = searchParams.get('checkoutId');
      const transactionId = searchParams.get('transactionId');
      const referenceId = searchParams.get('referenceId');

      // Get checkout session data from sessionStorage (for both demo and real payments)
      const storedSession = sessionStorage.getItem('square_checkout_session');
      
      // Handle Square Payment Link success
      if ((checkoutId || transactionId) && storedSession) {
        setIsCreatingOrder(true);
        
        try {
          const sessionData = JSON.parse(storedSession);
          
          if (sessionData.cartData && sessionData.customerData) {
            // Generate order number
            const orderNumber = generateOrderNumber();
            
            // Extract Square-SHIPPO shipping information
            const shippingCost = sessionData.shippingCost || sessionData.shippingData?.rate?.price || 0;
            const shippingMethod = sessionData.shippingMethod || sessionData.shippingData?.rate?.name || 'Standard';
            const subtotalAmount = sessionData.subtotal || sessionData.cartData.subtotal || 0;
            const totalAmount = sessionData.total || parseFloat(amount);
            
            // Set shipping info for display
            setShippingInfo({
              method: shippingMethod,
              cost: shippingCost,
              provider: sessionData.provider || 'square-shippo',
              rates: sessionData.shippingRates || [],
              selectedRate: sessionData.shippingData?.selectedRate
            });
            
            // Create comprehensive order data with Square-SHIPPO integration
            const orderData = {
              user_id: null, // Set to null for guest users
              customer_email: sessionData.customerData.email,
              customer_first_name: sessionData.customerData.firstName,
              customer_last_name: sessionData.customerData.lastName,
              customer_phone: sessionData.customerData.phone,
              shipping_address: JSON.stringify(sessionData.shippingData?.address || sessionData.customerData.address || 'Pickup'),
              payment_method: 'square-payment-link',
              payment_id: checkoutId || transactionId || sessionData.paymentLinkId || `square-${referenceId}`,
              notes: `Square Payment Link with SHIPPO integration. Checkout ID: ${checkoutId || 'N/A'}, Transaction ID: ${transactionId || 'N/A'}, Shipping: ${shippingMethod} ($${shippingCost})`,
              items: sessionData.cartData.items.map((item: any) => ({
                product_id: item.productId,
                product_name: item.productName || `Product #${item.productId.slice(0, 8)}`,
                quantity: item.quantity,
                price: typeof item.price === 'number' ? item.price : parseFloat(item.price.toString()) || 0,
                variant_options: item.variantOptions,
                image: item.productImage,
              })),
              subtotal: subtotalAmount,
              total: totalAmount,
              tax: sessionData.cartData.tax || 0,
              discount: sessionData.cartData.discount,
              shipping_cost: shippingCost,
              shipping_method: shippingMethod,
              order_number: orderNumber,
              payment_status: 'paid',
              fulfillment_status: 'pending',
              square_payment_link_id: sessionData.paymentLinkId,
              shippo_rates: JSON.stringify(sessionData.shippingRates || []),
            };

            // Create the order with Square-SHIPPO integration
            const response = await ordersAPI.createOrder(orderData);
            
            if (response.success) {
              setCheckoutData({
                ...sessionData,
                orderId: orderNumber,
                amount: totalAmount,
                subtotal: subtotalAmount,
                shippingCost: shippingCost,
                shippingMethod: shippingMethod,
                provider: 'square-shippo'
              });
              
              // Send comprehensive confirmation email with shipping details
              await sendOrderConfirmationEmail({
                ...response.data,
                shipping_method: shippingMethod,
                shipping_cost: shippingCost,
                order_number: orderNumber
              }, sessionData.customerData);
              
              // Clear cart
              await clearCart();
              setOrderCreated(true);
              
              console.log('Square-SHIPPO order created successfully:', {
                orderNumber,
                total: totalAmount,
                shipping: shippingMethod,
                shippingCost
              });
            }
          }
          
          // Clear the session data after use
          sessionStorage.removeItem('square_checkout_session');
          
        } catch (error) {
          console.error('Failed to create demo order:', error);
        } finally {
          setIsCreatingOrder(false);
        }
      } else if (storedSession) {
        // Handle regular checkout session data
        try {
          const sessionData = JSON.parse(storedSession);
          setCheckoutData(sessionData);
          sessionStorage.removeItem('square_checkout_session');
        } catch (e) {
          console.error('Failed to parse checkout session data:', e);
        }
      }
    };

    createOrderFromDemo();
  }, [searchParams, isCreatingOrder, orderCreated, clearCart]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Thank you for your order! Your payment was processed securely through Square{shippingInfo?.provider === 'square-shippo' && ' with SHIPPO-powered shipping'}.
          </p>

          {/* Comprehensive Order Details */}
          {checkoutData && (
            <div className="space-y-4 mb-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  Order Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="space-y-2">
                    {checkoutData.orderId && (
                      <div>
                        <span className="font-medium">Order ID:</span> {checkoutData.orderId}
                      </div>
                    )}
                    {checkoutData.subtotal && (
                      <div>
                        <span className="font-medium">Subtotal:</span> ${checkoutData.subtotal.toFixed(2)}
                      </div>
                    )}
                    {typeof checkoutData.shippingCost === 'number' && (
                      <div>
                        <span className="font-medium">Shipping:</span> ${checkoutData.shippingCost.toFixed(2)}
                      </div>
                    )}
                    {checkoutData.amount && (
                      <div className="font-semibold text-gray-800 border-t pt-2">
                        <span className="font-medium">Total:</span> ${checkoutData.amount.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Payment:</span> Square Checkout
                    </div>
                    {checkoutData.shippingMethod && (
                      <div>
                        <span className="font-medium">Shipping:</span> {checkoutData.shippingMethod}
                      </div>
                    )}
                    {checkoutData.provider === 'square-shippo' && (
                      <div className="text-green-600">
                        <span className="font-medium">✓ SHIPPO Integration</span>
                      </div>
                    )}
                    {checkoutData.referenceId && (
                      <div>
                        <span className="font-medium">Reference:</span> {checkoutData.referenceId}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Information */}
              {shippingInfo && shippingInfo.provider === 'square-shippo' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                    <Truck className="w-4 h-4 mr-2" />
                    SHIPPO Shipping Details
                  </h3>
                  <div className="text-sm text-green-700">
                    <p>Your order will be shipped via <strong>{shippingInfo.method}</strong></p>
                    {shippingInfo.rates && shippingInfo.rates.length > 0 && (
                      <p className="text-xs mt-1">Selected from {shippingInfo.rates.length} available shipping options</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Next Steps */}
          <div className="text-sm text-gray-600 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">What happens next?</h4>
              <ul className="space-y-1 text-blue-700">
                <li>✉️ You'll receive an email confirmation shortly</li>
                <li>📦 Your order is being processed and will ship within 1-2 business days</li>
                {shippingInfo?.provider === 'square-shippo' && (
                  <li>🚚 SHIPPO will provide real-time tracking once your order ships</li>
                )}
                <li>📞 Questions? Contact us at support@estheticsbyanna.com</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              to="/"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors inline-block"
            >
              Continue Shopping
            </Link>
            
            <Link
              to="/orders"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center"
            >
              <Package className="w-4 h-4 mr-2" />
              View My Orders
            </Link>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-gray-500 hover:text-gray-700 inline-flex items-center text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;