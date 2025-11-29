import React, { useEffect, useState, useRef } from 'react';
import { AlertCircle, Loader2, CreditCard, Smartphone, Apple, CheckCircle } from 'lucide-react';

// Types for Square Web Payments SDK
declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => {
        card: (options?: any) => Promise<any>;
        applePay: (options: any) => Promise<any>;
        googlePay: (options: any) => Promise<any>;
        cashAppPay: (options: any) => Promise<any>;
      };
    };
  }
}

interface SquarePaymentsProps {
  amount: number;
  currency?: string;
  onSuccess: (paymentResult: any) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  applicationId: string;
  locationId: string;
}

type PaymentMethod = 'card' | 'apple' | 'google' | 'cashapp';

const SquarePayments: React.FC<SquarePaymentsProps> = ({
  amount,
  currency = 'USD',
  onSuccess,
  onError,
  disabled = false,
  applicationId,
  locationId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [processingPayment, setProcessingPayment] = useState<PaymentMethod | null>(null);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const paymentsInstance = useRef<any>(null);
  const paymentMethods = useRef<{[key in PaymentMethod]?: any}>({});

  // Available payment methods with their availability
  const [availableMethods, setAvailableMethods] = useState({
    card: false,
    apple: false,
    google: false,
    cashapp: false
  });

  // Load Square Web Payments SDK
  useEffect(() => {
    const loadSquareSDK = async () => {
      if (window.Square) {
        setSdkLoaded(true);
        return;
      }

      try {
        const script = document.createElement('script');
        script.src = 'https://sandbox.web.squarecdn.com/v1/square.js';
        script.async = true;
        
        script.onload = () => {
          setSdkLoaded(true);
        };
        
        script.onerror = () => {
          setError('Failed to load payment SDK');
        };
        
        document.head.appendChild(script);
      } catch (err) {
        setError('Failed to load payment SDK');
      }
    };

    loadSquareSDK();
  }, []);

  // Initialize payment methods when SDK is loaded
  useEffect(() => {
    const initializePayments = async () => {
      if (!sdkLoaded || !window.Square) {
        return;
      }

      try {
        if (!applicationId || !locationId) {
          throw new Error('Missing Square Application ID or Location ID');
        }

        paymentsInstance.current = window.Square.payments(applicationId, locationId);

        // Initialize Card first (most reliable)
        await initializeCard();

        // Check and initialize Apple Pay
        await checkApplePay();

        // Check and initialize Google Pay
        await checkGooglePay();

        // Initialize Cash App Pay
        await initializeCashApp();

      } catch (err: any) {
        console.error('Error initializing payments:', err);
        setError(`Failed to initialize payment methods: ${err.message}`);
      }
    };

    initializePayments();
  }, [sdkLoaded, applicationId, locationId]);

  const initializeCard = async () => {
    try {
      if (cardRef.current) {
        const card = await paymentsInstance.current.card({
          style: {
            input: {
              fontSize: '16px',
              fontFamily: 'Inter, sans-serif',
              color: '#1a1a1a',
              backgroundColor: 'transparent'
            },
            'input::placeholder': {
              color: '#9ca3af'
            },
            '.input-container': {
              borderColor: '#d1d5db',
              borderRadius: '8px',
              borderWidth: '1px'
            },
            '.input-container.is-focus': {
              borderColor: '#ec4899'
            },
            '.input-container.is-error': {
              borderColor: '#ef4444'
            }
          }
        });
        
        await card.attach(cardRef.current);
        paymentMethods.current.card = card;
        setAvailableMethods(prev => ({ ...prev, card: true }));
      }
    } catch (err) {
      console.error('Error initializing card:', err);
      setAvailableMethods(prev => ({ ...prev, card: false }));
    }
  };

  const checkApplePay = async () => {
    try {
      // Create payment request for Apple Pay
      const paymentRequest = paymentsInstance.current.paymentRequest({
        countryCode: 'US',
        currencyCode: 'USD',
        total: {
          amount: amount.toString(),
          label: 'Total',
        },
      });

      const applePay = await paymentsInstance.current.applePay(paymentRequest, {
        requestBillingContact: false,
        requestShippingContact: false,
      });

      setAvailableMethods(prev => ({ ...prev, apple: true }));
      paymentMethods.current.apple = applePay;
    } catch (err) {
      console.log('Apple Pay not available:', err);
      setAvailableMethods(prev => ({ ...prev, apple: false }));
    }
  };

  const checkGooglePay = async () => {
    try {
      // Create payment request for Google Pay
      const paymentRequest = paymentsInstance.current.paymentRequest({
        countryCode: 'US',
        currencyCode: 'USD',
        total: {
          amount: amount.toString(),
          label: 'Total',
        },
      });

      const googlePay = await paymentsInstance.current.googlePay(paymentRequest, {
        buttonColor: 'default',
        buttonType: 'plain',
      });

      setAvailableMethods(prev => ({ ...prev, google: true }));
      paymentMethods.current.google = googlePay;
    } catch (err) {
      console.log('Google Pay not available:', err);
      setAvailableMethods(prev => ({ ...prev, google: false }));
    }
  };

  const initializeCashApp = async () => {
    try {
      const cashAppPay = await paymentsInstance.current.cashAppPay({
        redirectURL: window.location.href,
        referenceId: `order-${Date.now()}`,
        locationId: locationId
      });

      setAvailableMethods(prev => ({ ...prev, cashapp: true }));
      paymentMethods.current.cashapp = cashAppPay;
    } catch (err) {
      console.log('Cash App Pay not available:', err);
      setAvailableMethods(prev => ({ ...prev, cashapp: false }));
    }
  };

  const processPayment = async (method: PaymentMethod) => {
    if (disabled || processingPayment) {
      return;
    }

    setProcessingPayment(method);
    setError(null);

    try {
      const paymentMethod = paymentMethods.current[method];
      if (!paymentMethod) {
        throw new Error(`${method} payment method not available`);
      }

      const result = await paymentMethod.tokenize();
      
      if (result.status === 'OK') {
        // Process payment with backend
        const paymentResponse = await fetch('/api/square/create-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceId: result.token,
            amount: amount,
            currency: currency,
            referenceId: `${method}-${Date.now()}`,
            paymentMethod: method
          })
        });

        const paymentResult = await paymentResponse.json();
        
        if (paymentResult.success) {
          onSuccess({
            paymentId: paymentResult.data.paymentId,
            method: method,
            amount: amount,
            status: paymentResult.data.status
          });
        } else {
          throw new Error(paymentResult.message || 'Payment processing failed');
        }
      } else {
        throw new Error(result.errors?.[0]?.message || 'Payment failed');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Payment failed';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setProcessingPayment(null);
    }
  };

  if (!applicationId || !locationId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800 font-medium">Square Configuration Required</span>
        </div>
        <p className="text-yellow-700 text-sm mb-4">
          Square payments are not configured. Add REACT_APP_SQUARE_APPLICATION_ID and REACT_APP_SQUARE_LOCATION_ID to your environment variables.
        </p>
        <button
          onClick={() => onSuccess({ paymentId: 'demo-payment-' + Date.now(), method: 'demo', amount: amount })}
          disabled={disabled}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Complete Demo Order
        </button>
      </div>
    );
  }

  if (!sdkLoaded) {
    return (
      <div className="flex items-center justify-center p-8 border border-gray-200 rounded-lg">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-3" />
        <span className="text-gray-600">Loading secure payment...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Credit/Debit Card */}
        <button
          onClick={() => setSelectedMethod('card')}
          className={`p-4 border-2 rounded-xl transition-all ${
            selectedMethod === 'card'
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-center">
            <CreditCard className="w-6 h-6 mx-auto text-gray-600 mb-1" />
            <div className="text-xs font-medium text-gray-700">Card</div>
          </div>
        </button>

        {/* Apple Pay */}
        {availableMethods.apple && (
          <button
            onClick={() => setSelectedMethod('apple')}
            className={`p-4 border-2 rounded-xl transition-all ${
              selectedMethod === 'apple'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <Apple className="w-6 h-6 mx-auto text-gray-600 mb-1" />
              <div className="text-xs font-medium text-gray-700">Apple Pay</div>
            </div>
          </button>
        )}

        {/* Google Pay */}
        {availableMethods.google && (
          <button
            onClick={() => setSelectedMethod('google')}
            className={`p-4 border-2 rounded-xl transition-all ${
              selectedMethod === 'google'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <Smartphone className="w-6 h-6 mx-auto text-gray-600 mb-1" />
              <div className="text-xs font-medium text-gray-700">Google Pay</div>
            </div>
          </button>
        )}

        {/* Cash App Pay */}
        {availableMethods.cashapp && (
          <button
            onClick={() => setSelectedMethod('cashapp')}
            className={`p-4 border-2 rounded-xl transition-all ${
              selectedMethod === 'cashapp'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="w-6 h-6 mx-auto bg-green-500 rounded text-white flex items-center justify-center mb-1">
                <span className="text-xs font-bold">$</span>
              </div>
              <div className="text-xs font-medium text-gray-700">Cash App</div>
            </div>
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {/* Payment Method Forms */}
      <div className="space-y-4">
        {/* Credit Card Form */}
        {selectedMethod === 'card' && (
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <div ref={cardRef} id="card-container" className="min-h-[60px]" />
            </div>
            
            <button
              onClick={() => processPayment('card')}
              disabled={processingPayment === 'card' || disabled}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {processingPayment === 'card' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay ${amount.toFixed(2)}
                </>
              )}
            </button>
          </div>
        )}

        {/* Apple Pay */}
        {selectedMethod === 'apple' && availableMethods.apple && (
          <button
            onClick={() => processPayment('apple')}
            disabled={processingPayment === 'apple' || disabled}
            className="w-full bg-black text-white font-semibold py-4 px-6 rounded-xl hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {processingPayment === 'apple' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Apple className="w-5 h-5 mr-2" />
                Pay with Apple Pay
              </>
            )}
          </button>
        )}

        {/* Google Pay */}
        {selectedMethod === 'google' && availableMethods.google && (
          <button
            onClick={() => processPayment('google')}
            disabled={processingPayment === 'google' || disabled}
            className="w-full bg-white text-gray-700 font-semibold py-4 px-6 rounded-xl border-2 border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {processingPayment === 'google' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Smartphone className="w-5 h-5 mr-2" />
                Pay with Google Pay
              </>
            )}
          </button>
        )}

        {/* Cash App Pay */}
        {selectedMethod === 'cashapp' && availableMethods.cashapp && (
          <button
            onClick={() => processPayment('cashapp')}
            disabled={processingPayment === 'cashapp' || disabled}
            className="w-full bg-green-500 text-white font-semibold py-4 px-6 rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {processingPayment === 'cashapp' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <div className="w-5 h-5 mr-2 bg-white rounded text-green-500 flex items-center justify-center">
                  <span className="text-xs font-bold">$</span>
                </div>
                Pay with Cash App
              </>
            )}
          </button>
        )}
      </div>

      {/* Security Notice */}
      <div className="flex items-center justify-center text-xs text-gray-500 space-x-2">
        <CheckCircle className="w-4 h-4" />
        <span>Secure payment powered by Square • ${amount.toFixed(2)} {currency}</span>
      </div>
    </div>
  );
};

export default SquarePayments;