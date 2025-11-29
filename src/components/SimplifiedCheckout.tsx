import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Tag, Loader2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import SquareWebPayments from './SquareWebPayments';

const SimplifiedCheckout: React.FC = () => {
  const { cart, getCartTotal, clearCart } = useCart();
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
        // Free shipping discount - handled by Square-SHIPPO
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
    return customerInfo.firstName.trim() &&
           customerInfo.lastName.trim() &&
           customerInfo.email.trim() &&
           customerInfo.phone.trim() &&
           customerInfo.street.trim() &&
           customerInfo.city.trim() &&
           customerInfo.state.trim() &&
           customerInfo.zipCode.trim();
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50/30 via-white to-secondary-50/20 py-12">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/cart"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cart
            </Link>
            <h1 className="text-3xl font-display font-semibold text-neutral-900">
              Checkout
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">Order Summary</h2>
              
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cart.items.map((item: any, index: number) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
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
                      <h3 className="text-sm font-medium text-gray-900">{item.productName}</h3>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount Code Section */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="flex items-center mb-3">
                  <Tag className="w-4 h-4 text-primary-600 mr-2" />
                  <h3 className="text-sm font-medium text-gray-900">Discount Code</h3>
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        disabled={isValidatingDiscount}
                      />
                      <button
                        onClick={validateDiscountCode}
                        disabled={isValidatingDiscount || !discountCode.trim()}
                        className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
                    
                    {discountError && (
                      <p className="text-red-600 text-xs">{discountError}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                    <div>
                      <span className="text-sm font-medium text-green-800">
                        {appliedDiscount.code} - {appliedDiscount.description}
                      </span>
                      <div className="text-xs text-green-600 mt-1">
                        {appliedDiscount.type === 'percentage' 
                          ? `${appliedDiscount.value}% off` 
                          : appliedDiscount.type === 'fixed'
                          ? `$${appliedDiscount.value} off`
                          : 'Free shipping'
                        }
                      </div>
                    </div>
                    <button
                      onClick={removeDiscount}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Order Total */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                
                {appliedDiscount && discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 text-sm">
                    <span>Discount ({appliedDiscount.code})</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>${total.toFixed(2)} + shipping</span>
                </div>
              </div>
            </div>

            {/* Customer Information Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">Customer Information</h2>
              
              <div className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.firstName}
                      onChange={(e) => handleCustomerInfoChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.lastName}
                      onChange={(e) => handleCustomerInfoChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>

                {/* Contact Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>

                {/* Address Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.street}
                    onChange={(e) => handleCustomerInfoChange('street', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.city}
                      onChange={(e) => handleCustomerInfoChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.state}
                      onChange={(e) => handleCustomerInfoChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.zipCode}
                      onChange={(e) => handleCustomerInfoChange('zipCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Square-SHIPPO Checkout */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">Complete Your Order</h2>
              
              {!isCustomerInfoComplete() && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-800 text-sm">
                    Please complete all customer information fields above to proceed with checkout.
                  </p>
                </div>
              )}
              
              <SquareWebPayments
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
                  console.log('Square Web Payments success:', paymentResult);
                  // User will be redirected to success page automatically
                }}
                onError={(error: string) => {
                  console.error('Square Web Payments error:', error);
                  alert(`Payment Error: ${error}`);
                }}
                disabled={!isCustomerInfoComplete()}
              />
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">What happens next?</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• You'll be redirected to Square's secure checkout</li>
                  <li>• Enter your shipping address and payment details</li>
                  <li>• SHIPPO will calculate real shipping rates</li>
                  <li>• Complete payment with any method (card, Apple Pay, etc.)</li>
                  <li>• Receive order confirmation and tracking info</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedCheckout;
