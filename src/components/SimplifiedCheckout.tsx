import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Tag, Loader2, Truck } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import StripeCheckout from './StripeCheckout';

const SimplifiedCheckout: React.FC = () => {
  const { cart, getCartTotal } = useCart();
  const [referenceId] = useState(() => `order-${Date.now()}`);
  
  // Customer information state
  const [customerInfo, setCustomerInfo] = useState({
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
        // Free shipping discount - handled by SHIPPO
        discountAmount = 0;
        break;
    }
  }

  const total = subtotal - discountAmount;

  // Discount validation function
  const validateDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }

    setIsValidatingDiscount(true);
    setDiscountError(null);

    try {
      const response = await fetch('http://localhost:3001/api/discounts/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

  // Validate customer information
  const isCustomerInfoComplete = () => {
    const firstName = customerInfo.firstName.trim();
    const lastName = customerInfo.lastName.trim();
    const email = customerInfo.email.trim();
    const phone = customerInfo.phone.trim();
    const street = customerInfo.street.trim();
    const city = customerInfo.city.trim();
    const state = customerInfo.state.trim();
    const zipCode = customerInfo.zipCode.trim();
    
    const isComplete = firstName && lastName && email && phone && street && city && state && zipCode;
    
    console.log('[SimplifiedCheckout] Customer info validation:', {
      firstName: firstName ? `"${firstName}" (${firstName.length})` : 'EMPTY',
      lastName: lastName ? `"${lastName}" (${lastName.length})` : 'EMPTY', 
      email: email ? `"${email}" (${email.length})` : 'EMPTY',
      phone: phone ? `"${phone}" (${phone.length})` : 'EMPTY',
      street: street ? `"${street}" (${street.length})` : 'EMPTY',
      city: city ? `"${city}" (${city.length})` : 'EMPTY',
      state: state ? `"${state}" (${state.length})` : 'EMPTY',
      zipCode: zipCode ? `"${zipCode}" (${zipCode.length})` : 'EMPTY',
      isComplete,
      rawCustomerInfo: customerInfo
    });
    
    return isComplete;
  };

  const handleCustomerInfoChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
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
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <Link
                to="/cart"
                className="inline-flex items-center text-sky-700 hover:text-sky-800 text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Cart
              </Link>
              <h1 className="text-3xl font-display font-semibold text-neutral-900 mt-2">Checkout & Shipping</h1>
              <p className="text-gray-600 mt-1">Secure payment powered by Stripe • Real-time shipping via SHIPPO</p>
            </div>
            <div className="flex items-center space-x-2 text-xs bg-white shadow-sm border border-gray-100 rounded-full px-4 py-2">
              <span className="bg-sky-100 text-sky-700 px-2 py-1 rounded-full font-semibold">1</span>
              <span>Details</span>
              <span className="text-gray-400">→</span>
              <span className="bg-sky-100 text-sky-700 px-2 py-1 rounded-full font-semibold">2</span>
              <span>Shipping</span>
              <span className="text-gray-400">→</span>
              <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">3</span>
              <span>Pay</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column: order */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-neutral-900">Order Overview</h2>
                  <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">{cart.items.length} items</span>
                </div>

                <div className="space-y-4 mb-6">
                  {cart.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden ring-1 ring-gray-200">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900">{item.productName}</h3>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50 p-4 mb-6">
                  <div className="flex items-center mb-3">
                    <Tag className="w-4 h-4 text-sky-600 mr-2" />
                    <h3 className="text-sm font-semibold text-gray-900">Discount code</h3>
                  </div>
                  {!appliedDiscount ? (
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && validateDiscountCode()}
                          placeholder="Enter discount code"
                          className="flex-1 px-3 py-2 border border-sky-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-white"
                          disabled={isValidatingDiscount}
                        />
                        <button
                          onClick={validateDiscountCode}
                          disabled={isValidatingDiscount || !discountCode.trim()}
                          className="px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {isValidatingDiscount ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-1" />
                              Checking
                            </>
                          ) : (
                            'Apply'
                          )}
                        </button>
                      </div>
                      {discountError && <p className="text-red-600 text-xs">{discountError}</p>}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <div>
                        <span className="text-sm font-semibold text-emerald-800">
                          {appliedDiscount.code} - {appliedDiscount.description}
                        </span>
                        <div className="text-xs text-emerald-600 mt-1">
                          {appliedDiscount.type === 'percentage'
                            ? `${appliedDiscount.value}% off`
                            : appliedDiscount.type === 'fixed'
                            ? `$${appliedDiscount.value} off`
                            : 'Free shipping'}
                        </div>
                      </div>
                      <button
                        onClick={removeDiscount}
                        className="text-red-600 hover:text-red-800 text-sm font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  {appliedDiscount && discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount ({appliedDiscount.code})</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>Calculated at payment</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-3">
                    <span>Total (before shipping)</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-sky-600 to-emerald-500 text-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-start space-x-3">
                  <Truck className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-semibold">Live shipping at checkout</p>
                    <p className="text-sm opacity-90">We’ll pull real rates via SHIPPO after you enter your address.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: details + payment */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-neutral-900">Customer & Shipping</h2>
                  <span className="text-xs text-gray-500">All fields required</span>
                </div>

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

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-neutral-900">Payment</h2>
                  <span className="text-xs text-gray-500">Secure by Stripe</span>
                </div>

                {!isCustomerInfoComplete() && (
                  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    Complete your contact and address details to unlock payment options.
                  </div>
                )}

                <StripeCheckout
                  amount={total}
                  currency="USD"
                  referenceId={referenceId}
                  cartData={cart}
                  customerData={customerInfo}
                  shippingData={{
                    discount: appliedDiscount,
                    address: customerInfo
                  }}
                  onSuccess={(paymentResult: any) => {
                    console.log('Stripe payment success:', paymentResult);
                  }}
                  onError={(error: string) => {
                    console.error('Stripe payment error:', error);
                    alert(`Payment Error: ${error}`);
                  }}
                  disabled={!isCustomerInfoComplete()}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedCheckout;
