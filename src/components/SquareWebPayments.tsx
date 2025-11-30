import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, Loader2, CreditCard, Smartphone, Truck } from 'lucide-react';

declare global {
  interface Window {
    Square: any;
  }
}

interface SquareWebPaymentsProps {
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

const SquareWebPayments: React.FC<SquareWebPaymentsProps> = ({
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
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [payments, setPayments] = useState<any>(null);
  const [card, setCard] = useState<any>(null);
  const [applePay, setApplePay] = useState<any>(null);
  const [googlePay, setGooglePay] = useState<any>(null);
  const [cashAppPay, setCashAppPay] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<any>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const paymentReference = useRef(referenceId || `order-${Date.now()}`);
  const apiBaseUrl = process.env.REACT_APP_API_URL || '';
  const paymentRequestRef = useRef<any>(null);
  const [locationId, setLocationId] = useState<string | undefined>(process.env.REACT_APP_SQUARE_LOCATION_ID);

  const shippingAmountValue = Number(shippingInfo?.selectedRate?.price || 0);
  const customerCountry = (customerData?.country || 'US').toUpperCase();

  // Fetch location id from backend if not provided to frontend
  useEffect(() => {
    if (locationId) return;

    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/square/public-config');
        const data = await res.json();
        if (data?.success && data?.data?.locationId) {
          setLocationId(data.data.locationId);
          console.log('Loaded Square locationId from backend config');
        } else {
          console.error('Square location ID missing in backend config response');
        }
      } catch (err) {
        console.error('Failed to load Square config', err);
      }
    };

    fetchConfig();
  }, [locationId]);

  // Calculate shipping with SHIPPO
  useEffect(() => {
    const hasAddress = customerData &&
      customerData.firstName &&
      customerData.lastName &&
      customerData.street &&
      customerData.city &&
      customerData.state &&
      customerData.zipCode;

    if (!hasAddress || !cartData?.items?.length) {
      return;
    }

    const controller = new AbortController();

    const calculateShipping = async () => {
      try {
        setShippingError(null);
        const response = await fetch(`${apiBaseUrl}/api/shipping/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartItems: cartData?.items || [],
            shippingAddress: {
              firstName: customerData.firstName,
              lastName: customerData.lastName,
              street: customerData.street,
              city: customerData.city,
              state: customerData.state,
              zipCode: customerData.zipCode,
              country: customerData.country || 'US'
            }
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Shipping service unavailable (${response.status})`);
        }

        const result = await response.json();
        if (result.success) {
          setShippingInfo(result.data);
        } else {
          throw new Error(result.message || 'Failed to calculate shipping');
        }
      } catch (error: any) {
        if (controller.signal.aborted) return;
        console.error('Shipping calculation error:', error);
        setShippingError(error.message || 'Unable to calculate shipping right now.');
      }
    };

    calculateShipping();

    return () => controller.abort();
  }, [apiBaseUrl, customerData, cartData]);

  // Load Square Web Payments SDK
  useEffect(() => {
    const loadSquareScript = () => {
      if (window.Square) {
        setIsScriptLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sandbox.web.squarecdn.com/v1/square.js';
      script.async = true;
      script.onload = () => {
        console.log('Square Web Payments SDK loaded');
        setIsScriptLoaded(true);
      };
      script.onerror = (error) => {
        console.error('Failed to load Square SDK:', error);
        onError('Failed to load Square payment system');
      };
      document.head.appendChild(script);
    };

    loadSquareScript();
  }, [onError]);

  // Initialize Square Payments when script is loaded
  useEffect(() => {
    const initializeSquarePayments = async () => {
      if (!isScriptLoaded || !window.Square || initializedRef.current) return;
      if (!locationId) {
        console.error('Square location ID missing. Set REACT_APP_SQUARE_LOCATION_ID in your frontend env.');
        onError('Square location ID is not configured. Please set REACT_APP_SQUARE_LOCATION_ID.');
        return;
      }

      try {
        console.log('Initializing Square Web Payments with location', locationId);
        
        // Initialize payments object
        const paymentsInstance = window.Square.payments(
          process.env.REACT_APP_SQUARE_APPLICATION_ID,
          locationId
        );
        
        setPayments(paymentsInstance);
        initializedRef.current = true;

        // Build a reusable payment request for digital wallets
        const shippingAmount = shippingAmountValue.toFixed(2);
        const totalAmount = (amount + shippingAmountValue).toFixed(2);
        const paymentRequest = paymentsInstance.paymentRequest({
          countryCode: customerCountry,
          currencyCode: currency,
          total: {
            amount: totalAmount,
            label: 'Total',
          },
          lineItems: [
            { amount: amount.toFixed(2), label: 'Items' },
            { amount: shippingAmount, label: 'Shipping' },
          ],
          requestShippingContact: true,
        });
        // Ensure locationId is present on payment request object for Cash App Pay
        (paymentRequest as any).locationId = locationId;
        paymentRequestRef.current = paymentRequest;

        // Initialize Card Payment
        try {
          const cardInstance = await paymentsInstance.card({
            style: {
              '.input-container': {
                borderColor: '#CBD5E1',
                borderRadius: '10px'
              },
              '.input-container.is-focus': {
                borderColor: '#0EA5E9'
              },
              '.input-container.is-error': {
                borderColor: '#EF4444'
              },
              '.message-text': {
                color: '#EF4444'
              },
              '.message-icon': {
                color: '#EF4444'
              }
            }
          });
          await cardInstance.attach('#card-container');
          setCard(cardInstance);
          console.log('Card payment initialized');
        } catch (cardError) {
          console.error('Card initialization error:', cardError);
        }

        // Initialize Apple Pay
        try {
          const applePayInstance = await paymentsInstance.applePay(paymentRequest);
          await applePayInstance.attach('#apple-pay-button', {
            buttonStyle: 'black',
            buttonType: 'buy',
            buttonSizeMode: 'fill'
          });
          setApplePay(applePayInstance);
          console.log('Apple Pay initialized');
        } catch (appleError) {
          console.log('Apple Pay not available:', appleError.message);
        }

        // Initialize Google Pay
        try {
          const googlePayInstance = await paymentsInstance.googlePay(paymentRequest);
          await googlePayInstance.attach('#google-pay-button', {
            buttonColor: 'default',
            buttonType: 'buy',
            buttonSizeMode: 'fill'
          });
          setGooglePay(googlePayInstance);
          console.log('Google Pay initialized');
        } catch (googleError) {
          console.log('Google Pay not available:', googleError.message);
        }

        // Initialize Cash App Pay
        try {
          const cashAppPayInstance = await paymentsInstance.cashAppPay({
            buttonTheme: 'dark',
            redirectURL: window.location.href,
            referenceId: paymentReference.current,
            locationId
          });

          if (!paymentRequestRef.current) {
            throw new Error('Payment request not ready for Cash App Pay');
          }

          console.log('Attaching Cash App Pay with paymentRequest locationId:', paymentRequestRef.current?.locationId);
          await cashAppPayInstance.attach('#cash-app-pay-button', {
            paymentRequest: paymentRequestRef.current,
            locationId
          });
          setCashAppPay(cashAppPayInstance);
          console.log('Cash App Pay initialized');
        } catch (cashAppError) {
          console.log('Cash App Pay not available:', cashAppError.message);
        }

      } catch (error) {
        console.error('Square Payments initialization error:', error);
        initializedRef.current = false;
        onError(`Square initialization failed: ${error.message}`);
      }
    };

    if (isScriptLoaded) {
      initializeSquarePayments();
    }
  }, [amount, currency, customerCountry, isScriptLoaded, locationId, onError, shippingAmountValue]);

  useEffect(() => {
    if (!paymentRequestRef.current) return;

    const shippingAmount = shippingAmountValue.toFixed(2);
    const totalAmount = (amount + shippingAmountValue).toFixed(2);

    try {
      paymentRequestRef.current.update({
        total: {
          amount: totalAmount,
          label: 'Total'
        },
        lineItems: [
          { amount: amount.toFixed(2), label: 'Items' },
          { amount: shippingAmount, label: 'Shipping' },
        ]
      });
    } catch (error) {
      console.error('Failed to update payment request:', error);
    }
  }, [amount, shippingAmountValue, shippingInfo]);

  // Handle payment processing
  const handlePayment = async (paymentMethod: any, source: string) => {
    if (!payments || isProcessing) return;

    setIsProcessing(true);

    try {
      console.log(`Processing ${source} payment...`);

      // Tokenize payment method
      const result = await paymentMethod.tokenize();
      
      if (result.status === 'OK') {
        console.log(`${source} tokenization successful:`, result.token);

        // Calculate total with shipping
        const shippingCost = shippingAmountValue;
        const totalAmount = amount + shippingCost;

        // Send payment to backend
        const paymentResponse = await fetch('/api/square/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceId: result.token,
            amount: totalAmount,
            currency,
            referenceId: paymentReference.current,
            orderId: paymentReference.current,
            paymentMethod: source.toLowerCase(),
            customerData,
            cartData,
            shippingData: shippingInfo
          }),
        });

        const paymentResult = await paymentResponse.json();

        if (paymentResult.success) {
          console.log(`${source} payment successful:`, paymentResult.data);
          
          // Store success data for order processing
          sessionStorage.setItem('square_checkout_session', JSON.stringify({
            paymentLinkId: paymentResult.data.paymentId,
            orderId: paymentResult.data.paymentId,
            subtotal: amount,
            shippingCost,
            shippingMethod: shippingInfo?.selectedRate?.name || 'Standard',
            total: totalAmount,
            referenceId: paymentReference.current,
            cartData: cartData?.items || [],
            customerData,
            shippingData,
            provider: 'square-web-payments'
          }));

          onSuccess({
            method: 'square-web-payments',
            paymentId: paymentResult.data.paymentId,
            paymentMethod: source,
            amount: totalAmount
          });

          // Redirect to success page
          window.location.href = `/checkout/success?paymentId=${paymentResult.data.paymentId}&method=${source}`;
        } else {
          throw new Error(paymentResult.message || `${source} payment failed`);
        }
      } else {
        console.error(`${source} tokenization failed:`, result.errors);
        throw new Error(result.errors?.[0]?.message || `${source} payment failed`);
      }
    } catch (error: any) {
      console.error(`${source} payment error:`, error);
      onError(error.message || `${source} payment processing failed`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Card payment handler
  const handleCardPayment = async () => {
    if (card) {
      await handlePayment(card, 'Card');
    }
  };

  if (!isScriptLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Square Payment System...</p>
        </div>
      </div>
    );
  }

  const totalWithShipping = amount + shippingAmountValue;

  return (
    <div className="space-y-6">
      {/* Square Branding Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg">
        <div className="flex items-center justify-center mb-2">
          <CheckCircle className="w-6 h-6 mr-2" />
          <span className="text-lg font-semibold">Secure Checkout by Square</span>
        </div>
        <p className="text-center text-sm opacity-90">
          All major payment methods accepted • Bank-level security • Instant processing
        </p>
      </div>

      {/* Shipping Information */}
      {shippingError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          {shippingError}
        </div>
      )}

      {shippingInfo && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center mb-2">
            <Truck className="w-5 h-5 text-green-600 mr-2" />
            <span className="font-medium text-green-800">SHIPPO Shipping</span>
          </div>
          <div className="text-sm text-green-700">
            <p><strong>{shippingInfo.selectedRate?.name}</strong> - ${shippingInfo.selectedRate?.price?.toFixed(2)}</p>
            <p className="text-xs opacity-75">Powered by {shippingInfo.selectedRate?.carrier}</p>
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${amount.toFixed(2)}</span>
          </div>
          {shippingInfo?.selectedRate?.price !== undefined && (
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>${shippingInfo.selectedRate.price.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Total:</span>
            <span>${totalWithShipping.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          Choose Payment Method
        </h3>

        {/* Credit/Debit Card */}
        <div className="border rounded-xl p-4 shadow-sm bg-white/80">
          <h4 className="font-medium text-gray-800 mb-3">Credit or Debit Card</h4>
          <div id="card-container" className="mb-4 rounded-lg border border-gray-200 p-3 bg-white"></div>
          <button
            onClick={handleCardPayment}
            disabled={!card || isProcessing || disabled}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Pay ${totalWithShipping.toFixed(2)}
              </>
            )}
          </button>
        </div>

        {/* Digital Wallets */}
        <div className="space-y-3">
          {/* Apple Pay */}
          <div className="border rounded-xl p-4 shadow-sm bg-white/80 flex flex-col justify-between min-h-[150px]">
            <div>
              <h4 className="font-medium text-gray-800 mb-3 text-center">Apple Pay</h4>
              <div id="apple-pay-button" className="min-h-[48px] rounded overflow-hidden"></div>
            </div>
            {!applePay && (
              <div className="text-center text-gray-500 text-sm mt-2 bg-gray-50 border border-gray-200 rounded-lg py-2">
                <Smartphone className="w-4 h-4 mx-auto mb-1" />
                Not available on this device/domain
              </div>
            )}
          </div>

          {/* Google Pay */}
          <div className="border rounded-xl p-4 shadow-sm bg-white/80 flex flex-col justify-between min-h-[150px]">
            <div>
              <h4 className="font-medium text-gray-800 mb-3 text-center">Google Pay</h4>
              <div id="google-pay-button" className="min-h-[48px] rounded overflow-hidden"></div>
            </div>
            {!googlePay && (
              <div className="text-center text-gray-500 text-sm mt-2 bg-gray-50 border border-gray-200 rounded-lg py-2">
                <Smartphone className="w-4 h-4 mx-auto mb-1" />
                Not available in this browser/frame
              </div>
            )}
          </div>

          {/* Cash App Pay */}
          <div className="border rounded-xl p-4 shadow-sm bg-white/80 flex flex-col justify-between min-h-[150px]">
            <div>
              <h4 className="font-medium text-gray-800 mb-3 text-center">Cash App Pay</h4>
              <div id="cash-app-pay-button" className="min-h-[48px] rounded overflow-hidden"></div>
            </div>
            {!cashAppPay && (
              <div className="text-center text-gray-500 text-sm mt-2 bg-gray-50 border border-gray-200 rounded-lg py-2">
                <Smartphone className="w-4 h-4 mx-auto mb-1" />
                Not available for this location
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Footer */}
      <div className="text-center text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center justify-center space-x-4">
          <span>🔒 SSL Encrypted</span>
          <span>•</span>
          <span>🛡️ PCI Compliant</span>
          <span>•</span>
          <span>⚡ Instant Processing</span>
        </div>
        <p>Powered by Square • SHIPPO Shipping • Bank-level security</p>
      </div>
    </div>
  );
};

export default SquareWebPayments;
