import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShoppingBag, User, Truck, CreditCard, Check, Tag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import StripeCheckout from './StripeCheckout';

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface ShippingInfo {
  selectedRate: any;
  rates: any[];
  provider: string;
}

const SteppedCheckout: React.FC = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState(1);
  const [referenceId] = useState(() => `order-${Date.now()}`);
  
  // Customer information state
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });
  
  // Shipping state
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  
  // Discount state
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);

  // Calculate totals
  const subtotal = getCartTotal();
  let discountAmount = 0;
  
  if (appliedDiscount) {
    switch (appliedDiscount.type) {
      case 'percentage':
        discountAmount = (subtotal * appliedDiscount.value) / 100;
        break;
      case 'fixed':
        discountAmount = Math.min(appliedDiscount.value, subtotal);
        break;
      case 'free_shipping':
        discountAmount = 0;
        break;
    }
  }

  const shippingCost = shippingInfo?.selectedRate?.price || 0;
  const total = subtotal - discountAmount + shippingCost;

  const steps = [
    { id: 1, name: 'Contact Info', icon: User, completed: false },
    { id: 2, name: 'Shipping', icon: Truck, completed: false },
    { id: 3, name: 'Payment', icon: CreditCard, completed: false }
  ];

  // Update step completion status
  steps[0].completed = isCustomerInfoComplete();
  steps[1].completed = steps[0].completed && !!shippingInfo?.selectedRate;
  steps[2].completed = steps[1].completed;

  // Validate customer information (no API calls)
  function isCustomerInfoComplete(): boolean {
    return !!(
      customerInfo.firstName.trim() &&
      customerInfo.lastName.trim() &&
      customerInfo.email.trim() &&
      customerInfo.phone.trim() &&
      customerInfo.street.trim() &&
      customerInfo.city.trim() &&
      customerInfo.state.trim() &&
      customerInfo.zipCode.trim()
    );
  }

  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calculate shipping when moving to step 2
  const calculateShipping = async () => {
    setIsLoadingShipping(true);
    setShippingError(null);
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiBase}/api/shipping/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cart?.items || [],
          shippingAddress: {
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            street: customerInfo.street,
            city: customerInfo.city,
            state: customerInfo.state,
            zipCode: customerInfo.zipCode,
            country: customerInfo.country || 'US'
          }
        }),
      });

      const result = await response.json();
      if (result.success && result.data?.rates?.length > 0) {
        // Auto-select first rate if available
        const selectedRate = result.data.rates[0];
        setShippingInfo({
          selectedRate,
          rates: result.data.rates,
          provider: result.data.provider || 'shippo'
        });
      } else {
        throw new Error(result.message || 'No shipping options available');
      }
    } catch (error: any) {
      console.error('Shipping calculation error:', error);
      setShippingError(error.message || 'Unable to calculate shipping');
    } finally {
      setIsLoadingShipping(false);
    }
  };

  // Handle step navigation
  const handleNextStep = async () => {
    if (currentStep === 1 && isCustomerInfoComplete()) {
      setCurrentStep(2);
      await calculateShipping();
    } else if (currentStep === 2 && shippingInfo?.selectedRate) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleShippingRateSelect = (rate: any) => {
    console.log('Selecting shipping rate:', rate);
    setShippingInfo(prev => prev ? { 
      ...prev, 
      selectedRate: { ...rate } // Create a new object to ensure state updates
    } : null);
  };

  // Discount validation
  const validateDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }

    setIsValidatingDiscount(true);
    setDiscountError(null);

    try {
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiBase}/api/discounts/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode.trim() }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setAppliedDiscount(result.data);
        setDiscountError(null);
        setDiscountCode('');
      } else {
        setDiscountError(result.message || 'Invalid discount code');
        setAppliedDiscount(null);
      }
    } catch (error) {
      console.error('Error validating discount code:', error);
      setDiscountError('Failed to validate discount code. Please try again.');
      setAppliedDiscount(null);
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    setDiscountError(null);
  };

  // If cart is empty
  if (!cart?.items?.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50/30 via-white to-secondary-50/20 py-12">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Add some products to proceed with checkout</p>
            <Link to="/products" className="btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-emerald-50 py-12">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link to="/cart" className="inline-flex items-center text-sky-600 hover:text-sky-700 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cart
            </Link>
            <h1 className="text-3xl font-bold text-neutral-900">Checkout</h1>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep === step.id
                      ? 'border-sky-500 bg-sky-500 text-white'
                      : step.completed
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                  }`}>
                    {step.completed ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    currentStep === step.id ? 'text-sky-600' : step.completed ? 'text-emerald-600' : 'text-gray-400'
                  }`}>
                    {step.name}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      step.completed ? 'bg-emerald-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Step 1: Customer Information */}
              {currentStep === 1 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-6">Contact Information</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wide text-gray-600 mb-1">First Name</label>
                        <input
                          type="text"
                          value={customerInfo.firstName}
                          onChange={(e) => handleCustomerInfoChange('firstName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-gray-50"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wide text-gray-600 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={customerInfo.lastName}
                          onChange={(e) => handleCustomerInfoChange('lastName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-gray-50"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wide text-gray-600 mb-1">Email</label>
                        <input
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-gray-50"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wide text-gray-600 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-gray-50"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wide text-gray-600 mb-1">Street Address</label>
                      <input
                        type="text"
                        value={customerInfo.street}
                        onChange={(e) => handleCustomerInfoChange('street', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-gray-50"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wide text-gray-600 mb-1">City</label>
                        <input
                          type="text"
                          value={customerInfo.city}
                          onChange={(e) => handleCustomerInfoChange('city', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-gray-50"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wide text-gray-600 mb-1">State</label>
                        <input
                          type="text"
                          value={customerInfo.state}
                          onChange={(e) => handleCustomerInfoChange('state', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-gray-50"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wide text-gray-600 mb-1">ZIP Code</label>
                        <input
                          type="text"
                          value={customerInfo.zipCode}
                          onChange={(e) => handleCustomerInfoChange('zipCode', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-gray-50"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Shipping Options */}
              {currentStep === 2 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-6">Shipping Options</h2>
                  
                  {isLoadingShipping ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-gray-600">Calculating shipping rates...</p>
                      </div>
                    </div>
                  ) : shippingError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-4">
                      {shippingError}
                    </div>
                  ) : shippingInfo?.rates?.length > 0 ? (
                    <div className="space-y-3">
                      {shippingInfo.rates.map((rate: any, index: number) => {
                        const isSelected = shippingInfo.selectedRate && (
                          shippingInfo.selectedRate.service === rate.service ||
                          shippingInfo.selectedRate.name === rate.name ||
                          JSON.stringify(shippingInfo.selectedRate) === JSON.stringify(rate)
                        );
                        
                        console.log(`Rate ${index}:`, {
                          rateName: rate.name,
                          rateService: rate.service,
                          selectedRateName: shippingInfo.selectedRate?.name,
                          selectedRateService: shippingInfo.selectedRate?.service,
                          isSelected
                        });
                        return (
                          <div
                            key={index}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-200'
                                : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-25 hover:shadow-sm'
                            }`}
                            onClick={() => handleShippingRateSelect(rate)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {/* Radio button indicator */}
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  isSelected 
                                    ? 'border-emerald-500 bg-emerald-500' 
                                    : 'border-gray-300 bg-white'
                                }`}>
                                  {isSelected && (
                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                  )}
                                </div>
                                <div>
                                  <h3 className={`font-semibold ${
                                    isSelected ? 'text-emerald-900' : 'text-gray-900'
                                  }`}>
                                    {rate.name}
                                  </h3>
                                  <p className={`text-sm ${
                                    isSelected ? 'text-emerald-700' : 'text-gray-600'
                                  }`}>
                                    Estimated delivery: {rate.estimated_days || '3-5'} business days
                                  </p>
                                  {isSelected && (
                                    <div className="flex items-center mt-1">
                                      <Check className="w-3 h-3 text-emerald-600 mr-1" />
                                      <span className="text-xs font-medium text-emerald-600">Selected</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className={`text-lg font-bold ${
                                isSelected ? 'text-emerald-900' : 'text-gray-900'
                              }`}>
                                ${rate.price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
                      No shipping options available for your address.
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Payment */}
              {currentStep === 3 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-neutral-900">Payment</h2>
                    <span className="text-xs text-gray-500">Secure by Stripe</span>
                  </div>

                  <StripeCheckout
                    amount={total}
                    currency="USD"
                    referenceId={referenceId}
                    cartData={cart}
                    customerData={customerInfo}
                    shippingData={{
                      discount: appliedDiscount,
                      address: customerInfo,
                      selectedRate: shippingInfo?.selectedRate
                    }}
                    onSuccess={async (paymentResult: any) => {
                      try {
                        console.log('Stripe payment success:', paymentResult);
                        
                        // Create order in database
                        const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:3001';
                        const orderPayload = {
                          user_id: cart?.userId || cart?.sessionId || 'guest',
                          customer_email: customerInfo.email,
                          customer_first_name: customerInfo.firstName,
                          customer_last_name: customerInfo.lastName,
                          customer_phone: customerInfo.phone,
                          shipping_address: {
                            firstName: customerInfo.firstName,
                            lastName: customerInfo.lastName,
                            street: customerInfo.street,
                            city: customerInfo.city,
                            state: customerInfo.state,
                            zipCode: customerInfo.zipCode,
                            country: customerInfo.country
                          },
                          payment_method: 'stripe',
                          payment_id: paymentResult.id,
                          notes: `Stripe Payment Intent: ${paymentResult.id}`
                        };
                        
                        console.log('Creating order with payload:', orderPayload);
                        
                        const orderResponse = await fetch(`${apiBase}/api/orders`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(orderPayload)
                        });
                        
                        const orderResult = await orderResponse.json();
                        console.log('Order creation response:', orderResult);
                        
                        if (orderResult.success) {
                          // Clear the cart immediately after successful order creation
                          clearCart();
                          
                          // Store order info for success page
                          sessionStorage.setItem('order_success', JSON.stringify({
                            orderId: orderResult.data.id,
                            orderNumber: orderResult.data.orderNumber,
                            ...orderResult.data
                          }));
                          
                          // Redirect to success page with order data stored
                          window.location.href = `/checkout/success?order_id=${orderResult.data.id}`;
                        } else {
                          throw new Error(orderResult.message || 'Failed to create order');
                        }
                      } catch (error) {
                        console.error('Order creation error:', error);
                        // Clear cart even if order creation fails (payment was successful)
                        clearCart();
                        // Fall back to success page with payment info
                        window.location.href = `/checkout/success?payment_intent=${paymentResult.id}`;
                      }
                    }}
                    onError={(error: string) => {
                      console.error('Stripe payment error:', error);
                      alert(`Payment Error: ${error}`);
                    }}
                    disabled={false}
                  />
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                  className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </button>

                {currentStep < 3 && (
                  <button
                    onClick={handleNextStep}
                    disabled={
                      (currentStep === 1 && !isCustomerInfoComplete()) ||
                      (currentStep === 2 && (!shippingInfo?.selectedRate || isLoadingShipping))
                    }
                    className="flex items-center px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                )}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-8">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Order Summary</h2>
                
                {/* Cart Items */}
                <div className="space-y-3 mb-4">
                  {cart.items?.map((item: any) => (
                    <div key={`${item.productId}-${item.variantOptions?.size || 'default'}`} className="flex items-center space-x-3">
                      <img
                        src={item.productImage || '/api/placeholder/80/80'}
                        alt={item.productName}
                        className="w-12 h-12 object-cover rounded-lg bg-gray-100"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/api/placeholder/80/80';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{item.productName}</h4>
                        {item.variantOptions && Object.keys(item.variantOptions).length > 0 && (
                          <p className="text-xs text-gray-500">
                            {Object.entries(item.variantOptions).map(([key, value]) => `${key}: ${value}`).join(', ')}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  )) || (
                    <div className="text-center text-gray-500 py-4">
                      <p className="text-sm">No items in cart</p>
                    </div>
                  )}
                </div>

                {/* Discount Code */}
                <div className="border-t pt-4 mb-4">
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      placeholder="Discount code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                      disabled={isValidatingDiscount}
                    />
                    <button
                      onClick={validateDiscountCode}
                      disabled={isValidatingDiscount || !discountCode.trim()}
                      className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isValidatingDiscount ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                  
                  {discountError && (
                    <p className="text-xs text-red-600 mb-2">{discountError}</p>
                  )}
                  
                  {appliedDiscount && (
                    <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-800">{appliedDiscount.code}</span>
                      </div>
                      <button onClick={removeDiscount} className="text-xs text-emerald-600 hover:text-emerald-800">
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                  </div>
                  
                  {appliedDiscount && discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">Discount</span>
                      <span className="text-emerald-600">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {shippingInfo?.selectedRate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-gray-900">${shippingInfo.selectedRate.price.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SteppedCheckout;