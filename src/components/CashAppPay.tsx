import React, { useEffect, useState, useRef } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

// Types for Square Web Payments SDK
declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => {
        cashAppPay: (options: any) => Promise<any>;
      };
    };
  }
}

interface CashAppPayProps {
  amount: number;
  currency?: string;
  onSuccess: (token: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  applicationId: string;
  locationId: string;
}

const CashAppPay: React.FC<CashAppPayProps> = ({
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
  const cashAppButtonRef = useRef<HTMLDivElement>(null);
  const paymentsInstance = useRef<any>(null);

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

  // Initialize Cash App Pay when SDK is loaded
  useEffect(() => {
    const initializeCashAppPay = async () => {
      if (!sdkLoaded || !window.Square || !cashAppButtonRef.current) {
        return;
      }

      try {
        if (!paymentsInstance.current) {
          paymentsInstance.current = window.Square.payments(applicationId, locationId);
        }

        const cashAppPay = await paymentsInstance.current.cashAppPay({
          redirectURL: window.location.href,
          referenceId: `order-${Date.now()}`,
        });

        // Attach the Cash App Pay button to the DOM
        await cashAppPay.attach('#cash-app-pay-button');

        // Handle the payment method creation
        cashAppButtonRef.current.addEventListener('click', async () => {
          if (disabled || isLoading) {
            return;
          }

          setIsLoading(true);
          setError(null);

          try {
            const result = await cashAppPay.tokenize();
            
            if (result.status === 'OK') {
              // Process payment with backend
              const paymentResponse = await fetch('/api/cashapp/create-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  sourceId: result.token,
                  amount: amount,
                  currency: currency,
                  referenceId: `cashapp-${Date.now()}`
                })
              });

              const paymentResult = await paymentResponse.json();
              
              if (paymentResult.success) {
                onSuccess(paymentResult.data.paymentId);
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
            setIsLoading(false);
          }
        });

      } catch (err: any) {
        const errorMessage = err.message || 'Failed to initialize Cash App Pay';
        setError(errorMessage);
        onError(errorMessage);
      }
    };

    initializeCashAppPay();
  }, [sdkLoaded, applicationId, locationId, amount, currency, onSuccess, onError, disabled, isLoading]);

  if (!sdkLoaded) {
    return (
      <div className="flex items-center justify-center p-4 border border-gray-200 rounded-lg">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
        <span className="text-gray-600">Loading Cash App Pay...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}
      
      <div className="relative">
        <div 
          id="cash-app-pay-button"
          ref={cashAppButtonRef}
          className={`min-h-[48px] rounded-lg ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          style={{
            background: '#00d632',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            padding: '12px 24px',
            textAlign: 'center' as const,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.59 3.47L22.52.44C22.38.14 22.07 0 21.76 0h-1.96c-.31 0-.63.14-.77.44L18 3.47 16.96.44C16.82.14 16.51 0 16.2 0h-1.96c-.31 0-.63.14-.77.44L12.43 3.47 11.39.44C11.25.14 10.94 0 10.63 0H8.67c-.31 0-.63.14-.77.44L6.86 3.47 5.82.44C5.68.14 5.37 0 5.06 0H3.1c-.31 0-.63.14-.77.44L1.3 3.47.26.44C.12.14-.19 0-.5 0c-.31 0-.63.14-.77.44L-2.3 3.47c-.14.3-.14.66 0 .96l1.03 3.03c.14.3.46.44.77.44h1.96c.31 0 .63-.14.77-.44l1.03-3.03 1.04 3.03c.14.3.46.44.77.44h1.96c.31 0 .63-.14.77-.44l1.03-3.03 1.04 3.03c.14.3.46.44.77.44h1.96c.31 0 .63-.14.77-.44l1.03-3.03 1.04 3.03c.14.3.46.44.77.44h1.96c.31 0 .63-.14.77-.44l1.03-3.03c.14-.3.14-.66 0-.96z"/>
              </svg>
              <span>Pay with Cash App</span>
            </>
          )}
        </div>
      </div>
      
      <div className="text-xs text-gray-500 text-center">
        Secure payment powered by Cash App • ${amount.toFixed(2)} {currency}
      </div>
    </div>
  );
};

export default CashAppPay;