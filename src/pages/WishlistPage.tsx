import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  Share2,
  ArrowLeft,
  Package,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { wishlistService, WishlistItem } from '../services/wishlistService';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Product } from '../types';

const WishlistPage: React.FC = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const items = await wishlistService.getWishlist();
      setWishlistItems(items || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setError('Failed to load your wishlist. Please try again.');
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      setRemovingItems(prev => new Set(prev).add(productId));
      await wishlistService.removeFromWishlist(productId);
      setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      setError('Failed to remove item from wishlist');
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleAddToCart = async (item: WishlistItem) => {
    try {
      setAddingToCart(prev => new Set(prev).add(item.product_id));
      
      // Convert wishlist item to Product format
      const product: Product = {
        id: item.product_id,
        name: item.name || 'Unknown Product',
        description: item.description || '',
        price: parseFloat((item.sale_price || item.price || 0).toString()),
        compareAtPrice: item.price !== item.sale_price ? parseFloat((item.price || 0).toString()) : undefined,
        sku: item.sku || item.product_id,
        category: 'skincare' as const,
        tags: [],
        images: item.image_url ? [{
          id: '1',
          url: item.image_url,
          altText: item.name || 'Product Image',
          isPrimary: true,
          sortOrder: 0
        }] : [],
        inventory: {
          trackQuantity: false,
          quantity: 999,
          lowStockThreshold: 10,
          allowBackorder: true
        },
        shipping: {
          weight: 100,
          dimensions: { length: 10, width: 10, height: 10 },
          requiresShipping: true
        },
        seo: {
          slug: item.sku || item.product_id,
          title: item.name,
          metaDescription: item.description
        },
        active: true,
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addToCart(product, 1);
      
      // Optionally remove from wishlist after adding to cart
      await handleRemoveFromWishlist(item.product_id);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('Failed to add item to cart');
    } finally {
      setAddingToCart(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.product_id);
        return newSet;
      });
    }
  };

  const handleShareItem = (item: WishlistItem) => {
    const productUrl = `${window.location.origin}/products/${item.sku || item.product_id}`;
    const shareText = `Check out this product: ${item.name}`;
    
    if (navigator.share) {
      navigator.share({
        title: item.name,
        text: shareText,
        url: productUrl,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(productUrl).then(() => {
        alert('Product link copied to clipboard!');
      }).catch(() => {
        alert('Unable to copy link');
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <Heart className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to view your wishlist and save your favorite products.
          </p>
          <Link to="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <span className="text-gray-600">Loading your wishlist...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-custom py-6">
          <div className="flex items-center space-x-4 mb-4">
            <Link to="/products" className="text-gray-500 hover:text-primary-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
              <p className="text-gray-600">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="section-padding">
        <div className="container-custom">
          {wishlistItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Heart className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
              <p className="text-gray-600 mb-6">
                Save items you love by clicking the heart icon on any product
              </p>
              <Link to="/products" className="btn-primary">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistItems.map((item) => (
                <div key={item.id} className="card group hover:shadow-xl transition-all duration-300 relative">
                  {/* Product Image */}
                  <div className="aspect-square mb-4 bg-gray-100 rounded-lg overflow-hidden relative">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name || 'Product'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Sale Badge */}
                    {item.sale_price && item.sale_price < (item.price || 0) && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                        Sale
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">{item.description}</p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-center space-x-2">
                      {item.sale_price && parseFloat(item.sale_price.toString()) < parseFloat((item.price || 0).toString()) ? (
                        <>
                          <span className="text-lg font-bold text-primary-600">
                            ${parseFloat(item.sale_price.toString() || '0').toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            ${parseFloat((item.price || 0).toString()).toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-primary-600">
                          ${parseFloat((item.price || 0).toString()).toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={addingToCart.has(item.product_id)}
                        className="btn-primary btn-sm flex items-center space-x-2 flex-1 mr-2"
                      >
                        {addingToCart.has(item.product_id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ShoppingCart className="w-4 h-4" />
                        )}
                        <span>{addingToCart.has(item.product_id) ? 'Adding...' : 'Add to Cart'}</span>
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleShareItem(item)}
                          title="Share this product"
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleRemoveFromWishlist(item.product_id)}
                          disabled={removingItems.has(item.product_id)}
                          title="Remove from wishlist"
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          {removingItems.has(item.product_id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;