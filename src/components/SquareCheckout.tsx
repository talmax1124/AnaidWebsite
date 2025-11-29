import React, { useState } from 'react';
import { CreditCard, Loader2, ExternalLink, CheckCircle, Package, Truck } from 'lucide-react';

interface SquareCheckoutProps {
  amount: number;
  currency?: string;
  onSuccess: (paymentResult: any) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  referenceId?: string;
  cartData?: any;
  customerData?: any;
  shippingData?: any;
}

const SquareCheckout: React.FC<SquareCheckoutProps> = ({
  amount,
  currency = 'USD',
  onSuccess,
  onError,
  disabled = false,
  referenceId,
  cartData,
  customerData,
  shippingData
}) => {
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  const createCheckoutSession = async () => {
    if (disabled || isCreatingCheckout) {
      return;
    }

    setIsCreatingCheckout(true);

    try {
      console.log('Creating Square Payment Link with SHIPPO integration:', {
        cartItems: cartData?.items?.length || 0,
        subtotal: amount,
        customerData: !!customerData?.email,
        shippingAddress: !!shippingData || !!customerData
      });

      // Call the real Square Payment Links API with SHIPPO integration
      const response = await fetch('/api/square/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: cartData?.items || [],
          customerData: customerData || {},
          shippingAddress: {
            firstName: customerData?.firstName || '',
            lastName: customerData?.lastName || '',
            street: customerData?.street || '',
            city: customerData?.city || '',
            state: customerData?.state || '',
            zipCode: customerData?.zipCode || '',
            country: customerData?.country || 'US'
          },
          amount: amount,
          currency: 'USD',
          referenceId: referenceId || `order-${Date.now()}`
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create checkout session');
      }

      if (result.success && result.data.checkoutUrl) {
        console.log('Square Payment Link created successfully:', {
          paymentLinkId: result.data.paymentLinkId,
          orderId: result.data.orderId,
          checkoutUrl: result.data.checkoutUrl,
          total: result.data.total
        });

        // Store session data for success page processing
        if (result.data.sessionData) {
          sessionStorage.setItem('square_checkout_session', JSON.stringify(result.data.sessionData));
        }

        // Redirect to Square's hosted checkout page
        window.location.href = result.data.checkoutUrl;
        
        onSuccess({ 
          method: 'square-payment-link', 
          paymentLinkId: result.data.paymentLinkId,
          orderId: result.data.orderId,
          total: result.data.total 
        });
      } else {
        throw new Error(result.message || 'Invalid response from checkout API');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create Square Payment Link';
      console.error('Square Payment Link error:', err);
      onError(errorMessage);
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Square-SHIPPO Integration Description */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
          <span className="text-blue-800 font-medium">Square + SHIPPO Integrated Checkout</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center mb-2">
              <CreditCard className="w-4 h-4 text-purple-600 mr-2" />
              <span className="text-purple-700 font-medium text-sm">Payment Options</span>
            </div>
            <ul className="text-blue-700 text-xs ml-6">
              <li>• All major credit/debit cards</li>
              <li>• Apple Pay & Google Pay</li>
              <li>• Cash App Pay & ACH transfers</li>
            </ul>
          </div>
          <div>
            <div className="flex items-center mb-2">
              <Truck className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-green-700 font-medium text-sm">Smart Shipping</span>
            </div>
            <ul className="text-blue-700 text-xs ml-6">
              <li>• Real-time shipping rates</li>
              <li>• USPS, UPS, FedEx options</li>
              <li>• Address validation & tracking</li>
            </ul>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-blue-100">
          <p className="text-blue-600 text-xs text-center">
            🔒 Secure hosted checkout • 📦 SHIPPO-powered shipping • ⚡ One-click completion
          </p>
        </div>
      </div>

      {/* Square-SHIPPO Checkout Button */}
      <button
        onClick={createCheckoutSession}
        disabled={isCreatingCheckout || disabled}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
      >
        {isCreatingCheckout ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <div className="text-center">
              <div>Creating Square Payment Link...</div>
              <div className="text-xs opacity-90">Calculating shipping with SHIPPO</div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              <div className="text-center">
                <div>Pay ${amount.toFixed(2)} + Shipping</div>
                <div className="text-xs opacity-90">Secure Square Checkout with SHIPPO</div>
              </div>
              <ExternalLink className="w-5 h-5 ml-2" />
            </div>
          </>
        )}
      </button>

      {/* Security & Features Notice */}
      <div className="flex flex-col items-center text-xs text-gray-500 space-y-1">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Secure payment by Square • Real shipping by SHIPPO</span>
        </div>
        <div className="flex items-center space-x-4 text-center">
          <span className="text-gray-400">Base: ${amount.toFixed(2)} {currency}</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-400">+ Shipping calculated at checkout</span>
        </div>
      </div>
    </div>
  );
};

export default SquareCheckout;