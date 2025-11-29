import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, ArrowRight, Trash2, Minus, Plus } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

const CartPage: React.FC = () => {
  const { 
    cart, 
    updateCartItem, 
    removeFromCart, 
    getCartItemCount, 
    getCartTotal 
  } = useCart();

  const handleUpdateQuantity = async (productId: string, newQuantity: number, variantOptions?: Record<string, string>) => {
    if (newQuantity < 0) return;
    
    try {
      if (newQuantity === 0) {
        await removeFromCart(productId);
      } else {
        await updateCartItem(productId, newQuantity, variantOptions);
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    if (!window.confirm('Are you sure you want to remove this item from your cart?')) {
      return;
    }
    
    try {
      await removeFromCart(productId);
    } catch (error) {
      console.error('Error removing cart item:', error);
    }
  };

  const itemCount = getCartItemCount();
  const total = getCartTotal();

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50/30 via-white to-secondary-50/20 py-12">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h1 className="text-3xl font-display font-semibold text-neutral-900 mb-4">
                Your cart is empty
              </h1>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Add some beautiful products to your cart and create your perfect esthetics experience.
              </p>
              <Link
                to="/products"
                className="btn-primary inline-flex items-center space-x-2"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Shop Products</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/30 via-white to-secondary-50/20 py-12">
      <div className="container-custom">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/products"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </Link>
            <h1 className="text-3xl font-display font-semibold text-neutral-900">
              Shopping Cart ({itemCount})
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cart.items.map((item, index) => (
                <div 
                  key={`${item.productId}-${JSON.stringify(item.variantOptions || {})}`}
                  className="card hover:shadow-lg transition-shadow"
                >
                  <div className="flex space-x-6">
                    {/* Product Image */}
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.productImage ? (
                        <img 
                          src={item.productImage} 
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-primary-500" />
                      )}
                    </div>

                    <div className="flex-1 space-y-4">
                      {/* Product Info */}
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900">
                          {item.productName || `Product #${item.productId.slice(0, 8)}`}
                        </h3>
                        
                        {/* Variant Options */}
                        {item.variantOptions && Object.keys(item.variantOptions).length > 0 && (
                          <div className="text-sm text-gray-600 mt-1">
                            {Object.entries(item.variantOptions).map(([key, value]) => (
                              <span key={key} className="mr-3">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="text-lg font-semibold text-primary-600 mt-2">
                          ${(typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0).toFixed(2)}
                        </div>
                      </div>

                      {/* Quantity and Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-700">Quantity:</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1, item.variantOptions)}
                              disabled={item.quantity <= 1}
                              className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            
                            <span className="w-12 text-center font-medium">
                              {item.quantity}
                            </span>
                            
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1, item.variantOptions)}
                              className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.productId)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right">
                        <span className="text-lg font-semibold text-neutral-900">
                          Subtotal: ${((typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card sticky top-8">
                <h2 className="text-xl font-semibold text-neutral-900 mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${cart.subtotal.toFixed(2)}</span>
                  </div>
                  
                  {cart.discount && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({cart.discount.code})</span>
                      <span>
                        -{cart.discount.type === 'percentage' 
                          ? `${cart.discount.amount}%` 
                          : `$${cart.discount.amount.toFixed(2)}`
                        }
                      </span>
                    </div>
                  )}

                  {cart.shipping && (
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping ({cart.shipping.method})</span>
                      <span>
                        {cart.shipping.cost === 0 ? 'Free' : `$${cart.shipping.cost.toFixed(2)}`}
                      </span>
                    </div>
                  )}

                  {cart.tax && cart.tax > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span>
                      <span>${(cart.tax * cart.subtotal).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-xl font-semibold text-neutral-900">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  className="w-full btn-primary text-center flex items-center justify-center group"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <Link
                  to="/products"
                  className="w-full btn-secondary text-center mt-4"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;