import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowLeft, Truck } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

const CheckoutSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [shippingInfo, setShippingInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { clearCart } = useCart();

  useEffect(() => {
    const hydrateCheckoutSuccess = async () => {
      setIsLoading(true);
      try {
        // First, check if we have actual order data stored
        const orderSuccess = sessionStorage.getItem('order_success');
        if (orderSuccess) {
          const orderData = JSON.parse(orderSuccess);
          console.log('Using order success data:', orderData);
          setCheckoutData({
            orderId: orderData.orderId,
            orderNumber: orderData.orderNumber || orderData.order_number,
            amount: orderData.total,
            subtotal: orderData.subtotal,
            shippingCost: orderData.shipping_cost || 0,
            shippingMethod: orderData.shipping_method || 'Standard',
            provider: 'stripe',
            cartData: orderData.items ? { items: orderData.items } : null,
            customerData: orderData.customerInfo || orderData.customer_info,
            paymentId: orderData.payment_id
          });
          setShippingInfo({
            method: orderData.shipping_method || 'Standard',
            cost: orderData.shipping_cost || 0,
            provider: 'stripe',
          });
          setErrorMessage(null); // Clear any error message
          clearCart();
          sessionStorage.removeItem('order_success');
          return;
        }

        // Fallback: check for Stripe payment intent data
        const paymentIntentId = searchParams.get('payment_intent');
        const storedStripe = sessionStorage.getItem('stripe_checkout_session');
        
        if (paymentIntentId && storedStripe) {
          const sessionData = JSON.parse(storedStripe);
          console.log('Using stripe session data:', sessionData);
          
          setCheckoutData({
            orderId: paymentIntentId,
            amount: sessionData.amount,
            subtotal: sessionData.amount - (sessionData.shippingData?.selectedRate?.price || 0),
            shippingCost: sessionData.shippingData?.selectedRate?.price || 0,
            shippingMethod: sessionData.shippingData?.selectedRate?.name || 'Standard',
            provider: 'stripe',
            cartData: { items: sessionData.cartData || [] },
            customerData: sessionData.customerData,
          });
          setShippingInfo({
            method: sessionData.shippingData?.selectedRate?.name || 'Standard',
            cost: sessionData.shippingData?.selectedRate?.price || 0,
            provider: 'stripe',
            selectedRate: sessionData.shippingData?.selectedRate,
          });
          clearCart();
          sessionStorage.removeItem('stripe_checkout_session');
        } else if (paymentIntentId) {
          // Last resort: show minimal success with payment ID only
          setCheckoutData({
            orderId: paymentIntentId,
            provider: 'stripe',
            amount: null,
            subtotal: null,
            shippingCost: null,
            shippingMethod: null,
          });
          setErrorMessage('Order details are not available, but your payment was successful.');
        } else {
          setErrorMessage('No order information found. If you completed a payment, please check your email for confirmation.');
        }
      } catch (error) {
        console.error('Error loading checkout success data:', error);
        setErrorMessage('There was an error loading your order details.');
      } finally {
        setIsLoading(false);
      }
    };

    hydrateCheckoutSuccess();
  }, [searchParams, clearCart]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Processing your order...
            </h1>
            <p className="text-gray-600 mb-6">
              Please wait while we confirm your payment and create your order.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Error State */}
          {errorMessage ? (
            <>
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-8 h-8 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Payment Received
              </h1>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-amber-800">
                {errorMessage}
              </div>
            </>
          ) : (
            <>
              {/* Success Icon */}
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              {/* Success Message */}
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Payment Successful!
              </h1>
            </>
          )}
          
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
                      <span className="font-medium">Payment:</span> {checkoutData.provider === 'stripe' ? 'Stripe' : 'Checkout'}
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
              {shippingInfo && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                    <Truck className="w-4 h-4 mr-2" />
                    Shipping Details
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
            {checkoutData?.orderId && !errorMessage && (
              <Link
                to={`/orders/${checkoutData.orderId}`}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center"
              >
                <Package className="w-4 h-4 mr-2" />
                View Order Details
              </Link>
            )}
            
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
