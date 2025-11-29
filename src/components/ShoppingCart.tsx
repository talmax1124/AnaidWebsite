import React, { useState } from 'react';
import { 
  ShoppingCart as CartIcon, 
  X, 
  Minus, 
  Plus, 
  Trash2,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { Link } from 'react-router-dom';

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({ isOpen, onClose }) => {
  const { 
    cart, 
    updateCartItem, 
    removeFromCart, 
    getCartItemCount, 
    getCartTotal 
  } = useCart();

  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const handleUpdateQuantity = async (productId: string, newQuantity: number, variantOptions?: Record<string, string>) => {
    if (newQuantity < 0) return;
    
    setUpdatingItems(prev => new Set([...prev, productId]));
    
    try {
      if (newQuantity === 0) {
        await removeFromCart(productId);
      } else {
        await updateCartItem(productId, newQuantity, variantOptions);
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
    } finally {
      setUpdatingItems(prev => {
        const updated = new Set(prev);
        updated.delete(productId);
        return updated;
      });
    }
  };

  const handleRemoveItem = async (productId: string) => {
    setUpdatingItems(prev => new Set([...prev, productId]));
    
    try {
      await removeFromCart(productId);
    } catch (error) {
      console.error('Error removing cart item:', error);
    } finally {
      setUpdatingItems(prev => {
        const updated = new Set(prev);
        updated.delete(productId);
        return updated;
      });
    }
  };

  const itemCount = getCartItemCount();
  const total = getCartTotal();

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Cart Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="border-b border-gray-200 px-4 py-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <CartIcon className="w-5 h-5 mr-2" />
              Shopping Cart ({itemCount})
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Cart Content */}
        <div className="flex-1 overflow-y-auto">
          {!cart || cart.items.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-full p-6 text-center transform transition-all duration-500 ease-in-out ${
              isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
              <ShoppingBag className="w-16 h-16 text-gray-300 mb-4 animate-pulse" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-6">Add some products to get started!</p>
              <Link
                to="/products"
                onClick={onClose}
                className="btn-primary transform hover:scale-105 transition-transform duration-200"
              >
                Shop Products
              </Link>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {cart.items.map((item, index) => {
                const isUpdating = updatingItems.has(item.productId);
                
                console.log('Rendering cart item:', item);
                
                return (
                  <div 
                    key={`${item.productId}-${JSON.stringify(item.variantOptions || {})}`}
                    className={`bg-white border border-gray-200 rounded-lg p-4 transform transition-all duration-300 ease-in-out ${
                      isUpdating ? 'opacity-50' : ''
                    } ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}
                    style={{ 
                      transitionDelay: isOpen ? `${index * 50}ms` : '0ms' 
                    }}
                  >
                    <div className="flex space-x-4">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.productImage ? (
                          <img 
                            src={item.productImage} 
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <CartIcon className="w-6 h-6 text-gray-400" />
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        {/* Product Name */}
                        <h3 className="font-medium text-gray-900">
                          {item.productName || `Product #${item.productId.slice(0, 8)}`}
                        </h3>

                        {/* Variant Options */}
                        {item.variantOptions && Object.keys(item.variantOptions).length > 0 && (
                          <div className="text-sm text-gray-500">
                            {Object.entries(item.variantOptions).map(([key, value]) => (
                              <span key={key} className="mr-2">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Price */}
                        <div className="text-primary-600 font-semibold">
                          ${(typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0).toFixed(2)} each
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1, item.variantOptions)}
                              disabled={isUpdating || item.quantity <= 1}
                              className="p-1 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1, item.variantOptions)}
                              disabled={isUpdating}
                              className="p-1 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(item.productId)}
                            disabled={isUpdating}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Subtotal */}
                        <div className="text-right text-sm font-medium text-gray-900">
                          Subtotal: ${((typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart && cart.items.length > 0 && (
          <div className={`border-t border-gray-200 p-4 space-y-4 transform transition-all duration-400 ease-in-out ${
            isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
          style={{ transitionDelay: isOpen ? '200ms' : '0ms' }}>
            {/* Cart Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${cart.subtotal.toFixed(2)}</span>
              </div>
              
              {cart.discount && (
                <div className="flex justify-between text-sm text-green-600">
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
                <div className="flex justify-between text-sm">
                  <span>Shipping ({cart.shipping.method})</span>
                  <span>
                    {cart.shipping.cost === 0 ? 'Free' : `$${cart.shipping.cost.toFixed(2)}`}
                  </span>
                </div>
              )}

              {cart.tax && cart.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${(cart.tax * cart.subtotal).toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Link
                to="/cart"
                onClick={onClose}
                className="w-full btn-secondary text-center flex items-center justify-center transform hover:scale-105 transition-transform duration-200"
              >
                View Cart
              </Link>
              
              <Link
                to="/checkout"
                onClick={onClose}
                className="w-full btn-primary text-center flex items-center justify-center transform hover:scale-105 transition-all duration-200 group"
              >
                Checkout
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </div>

            {/* Continue Shopping */}
            <Link
              to="/products"
              onClick={onClose}
              className="block text-center text-sm text-primary-600 hover:text-primary-700 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default ShoppingCart;