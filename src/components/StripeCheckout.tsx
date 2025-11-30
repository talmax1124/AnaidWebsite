import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Loader2, CreditCard } from 'lucide-react';

interface StripeCheckoutProps {
  amount: number;
  currency?: string;
  referenceId?: string;
  cartData?: any;
  customerData?: any;
  shippingData?: any;
  disabled?: boolean;
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
}

const CheckoutForm: React.FC<{
  totalDisplay: number;
  cartData?: any;
  customerData?: any;
  shippingInfo?: any;
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
}> = ({ totalDisplay, cartData, customerData, shippingInfo, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      });

      if (error) {
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture')) {
        // Persist session for success page/order creation
        sessionStorage.setItem('stripe_checkout_session', JSON.stringify({
          paymentIntentId: paymentIntent.id,
          amount: totalDisplay,
          cartData: cartData?.items || [],
          customerData,
          shippingData: shippingInfo,
          provider: 'stripe',
        }));
        
        // Call onSuccess and handle any async operations
        try {
          const successResult = onSuccess(paymentIntent);
          if (successResult && typeof successResult.then === 'function') {
            // Handle async onSuccess
            await successResult;
          }
          // If onSuccess completes without redirecting, fall back to success page
          if (!window.location.href.includes('orders/')) {
            window.location.href = `/checkout/success?payment_intent=${paymentIntent.id}`;
          }
        } catch (successError) {
          console.error('Error in onSuccess handler:', successError);
          // Fall back to success page on error
          window.location.href = `/checkout/success?payment_intent=${paymentIntent.id}`;
        }
      } else {
        onError('Payment was not completed.');
      }
    } catch (err: any) {
      onError(err.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" /> Pay ${totalDisplay.toFixed(2)}
          </>
        )}
      </button>
    </form>
  );
};

const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  amount,
  currency = 'USD',
  referenceId,
  cartData,
  customerData,
  shippingData,
  disabled,
  onSuccess,
  onError
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || null);
  const [isLoading, setIsLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<any>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const stripePromiseRef = useRef<any>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const shippingAmount = Number(shippingInfo?.selectedRate?.price || 0);
  const totalWithShipping = amount + shippingAmount;

  // Load publishable key from backend if not provided at build time
  useEffect(() => {
    if (publishableKey) return;
    const fetchKey = async () => {
      try {
        const res = await fetch(`${apiBase}/api/stripe/public-key`);
        const data = await res.json();
        if (data?.success && data?.data?.publishableKey) {
          setPublishableKey(data.data.publishableKey);
        } else {
          const msg = 'Stripe publishable key is not configured.';
          setSetupError(msg);
          onError(msg);
        }
      } catch (err) {
        console.error('Failed to load Stripe key', err);
        const msg = 'Failed to load Stripe configuration.';
        setSetupError(msg);
        onError(msg);
      }
    };
    fetchKey();
  }, [onError, publishableKey, apiBase]);

  // Calculate shipping (reuse existing SHIPPO endpoint)
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
        const response = await fetch(`${apiBase}/api/shipping/calculate`, {
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
  }, [cartData, customerData, apiBase]);

  // Create PaymentIntent when ready
  useEffect(() => {
    const readyForPayment = publishableKey && !disabled;
    console.log('[StripeCheckout] Ready for payment check:', { publishableKey: !!publishableKey, disabled, readyForPayment });
    if (!readyForPayment) return;

    const createIntent = async () => {
      setIsLoading(true);
      console.log('[StripeCheckout] Creating payment intent with:', { amount: totalWithShipping, currency, customerData });
      try {
        const response = await fetch(`${apiBase}/api/stripe/create-payment-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalWithShipping,
            currency,
            shipping: { address: customerData },
            customerData,
            cartData,
            referenceId,
          }),
        });

        const data = await response.json();
        console.log('[StripeCheckout] Payment intent response:', data);
        if (data?.success && data?.data?.clientSecret) {
          setClientSecret(data.data.clientSecret);
        } else {
          throw new Error(data?.message || 'Failed to start payment');
        }
      } catch (error: any) {
        console.error('Stripe intent error:', error);
        const msg = error.message || 'Unable to start payment.';
        setSetupError(msg);
        onError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    createIntent();
  }, [cartData, currency, customerData, disabled, onError, publishableKey, referenceId, totalWithShipping, apiBase]);

  // Prepare stripePromise
  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    if (!stripePromiseRef.current) {
      stripePromiseRef.current = loadStripe(publishableKey);
    }
    return stripePromiseRef.current;
  }, [publishableKey]);

  console.log('[StripeCheckout] Component state:', {
    publishableKey: !!publishableKey,
    setupError,
    isLoading,
    clientSecret: !!clientSecret,
    stripePromise: !!stripePromise,
    disabled,
    customerData,
    totalWithShipping
  });

  if (!publishableKey) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg">
        Stripe publishable key is not set. Please configure REACT_APP_STRIPE_PUBLISHABLE_KEY or ensure /api/stripe/public-key returns one.
      </div>
    );
  }

  if (setupError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
        {setupError}
      </div>
    );
  }

  if (isLoading || !clientSecret || !stripePromise) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-gray-600">Preparing secure payment...</p>
        </div>
      </div>
    );
  }

  if (disabled) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg">
        Enter your contact and shipping details to load payment options.
      </div>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      labels: 'floating',
      variables: {
        colorPrimary: '#10b981',
        colorBackground: '#ffffff',
        colorText: '#0f172a',
        colorDanger: '#ef4444',
        borderRadius: '10px',
      },
    },
    loader: 'auto',
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {shippingError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 mb-3">
          {shippingError}
        </div>
      )}
      {shippingInfo?.selectedRate && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800 mb-3">
          Shipping: <strong>{shippingInfo.selectedRate.name}</strong> — ${shippingInfo.selectedRate.price.toFixed(2)}
        </div>
      )}
      <CheckoutForm
        totalDisplay={totalWithShipping}
        cartData={cartData}
        customerData={customerData}
        shippingInfo={shippingInfo}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
};

export default StripeCheckout;
