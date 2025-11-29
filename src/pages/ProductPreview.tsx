import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Plus, 
  Minus, 
  Check, 
  ArrowLeft, 
  Truck,
  Shield,
  RefreshCw,
  Tag,
  Package,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { sanityService, SanityProduct } from '../services/sanityService';
import { discountService, Discount } from '../services/discountService';
import { wishlistService, ProductForWishlist } from '../services/wishlistService';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Product, ProductCategory } from '../types';
import DiscountBanner from '../components/DiscountBanner';

const ProductPreview: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<SanityProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeDiscounts, setActiveDiscounts] = useState<Discount[]>([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addToCart, isLoading: cartLoading } = useCart();
  const { isAuthenticated } = useAuth();

  const handleWishlistClick = async () => {
    if (!isAuthenticated) {
      // Prompt user to sign in
      alert('Please sign in to add items to your wishlist. You will be redirected to the login page.');
      window.location.href = '/login';
      return;
    }
    
    if (!product) return;
    
    try {
      if (isWishlisted) {
        await wishlistService.removeFromWishlist(product._id);
        setIsWishlisted(false);
      } else {
        const productData: ProductForWishlist = {
          id: product._id,
          name: product.name,
          description: product.description || '',
          price: product.price,
          salePrice: product.salePrice,
          sku: product.slug?.current || product._id,
          imageUrl: product.image?.asset?.url || product.gallery?.[0]?.asset?.url || ''
        };
        
        await wishlistService.addToWishlist(product._id, productData);
        setIsWishlisted(true);
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      alert('Failed to update wishlist. Please try again.');
    }
  };

  const handleShareClick = () => {
    if (!product) return;
    
    const productUrl = `${window.location.origin}/products/${product.slug?.current}`;
    const shareText = `Check out this amazing product: ${product.name}`;
    
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: shareText,
        url: productUrl,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(productUrl).then(() => {
        alert('Product link copied to clipboard!');
      }).catch(() => {
        const fallbackText = `${shareText}\n${productUrl}`;
        const textArea = document.createElement('textarea');
        textArea.value = fallbackText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Product link copied to clipboard!');
      });
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        const products = await sanityService.getProducts();
        const foundProduct = products.find(p => p.slug?.current === slug);
        
        if (foundProduct) {
          setProduct(foundProduct);
        } else {
          setError('Product not found');
        }
        
        // Fetch active discounts
        const discounts = await discountService.getActiveDiscounts();
        setActiveDiscounts(discounts);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  // Check if current product is wishlisted when product or auth state changes
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (isAuthenticated && product) {
        try {
          const isWishlistedStatus = await wishlistService.isInWishlist(product._id);
          setIsWishlisted(isWishlistedStatus);
        } catch (error) {
          console.error('Error checking wishlist status:', error);
        }
      } else {
        setIsWishlisted(false);
      }
    };
    
    checkWishlistStatus();
  }, [product, isAuthenticated]);

  const calculatePricing = () => {
    if (!product) return { total: 0, originalTotal: 0, savings: 0 };

    let basePrice = product.salePrice || product.price;
    let originalBasePrice = product.price;
    
    // Add add-ons pricing
    const addOnsCost = selectedAddOns.reduce((total, addOnId) => {
      const addOn = product.addOns?.find(a => a._id === addOnId);
      return total + (addOn?.price || 0);
    }, 0);

    const subtotal = (basePrice + addOnsCost) * quantity;
    const originalSubtotal = (originalBasePrice + addOnsCost) * quantity;

    // Apply discounts
    const applicableDiscounts = activeDiscounts.filter(discount => {
      if (!discountService.isDiscountValid(discount)) return false;
      if (discount.applicableTo === 'products' || discount.applicableTo === 'all') return true;
      return false;
    });

    const bestDiscount = discountService.getBestDiscount(
      applicableDiscounts,
      [{ 
        id: product._id, 
        productId: product._id, 
        name: product.name, 
        price: basePrice + addOnsCost, 
        quantity,
        type: 'product' 
      }],
      subtotal
    );

    const discountAmount = bestDiscount ? discountService.calculateDiscountAmount(
      bestDiscount,
      [{ 
        id: product._id, 
        productId: product._id, 
        name: product.name, 
        price: basePrice + addOnsCost, 
        quantity,
        type: 'product' 
      }],
      subtotal
    ) : 0;

    return {
      total: subtotal - discountAmount,
      originalTotal: originalSubtotal,
      savings: (originalSubtotal - subtotal) + discountAmount,
      discount: bestDiscount,
      discountAmount
    };
  };

  const handleAddToCart = async () => {
    if (!product) return;

    const pricing = calculatePricing();
    
    // Create a basic Product object that matches what CartContext expects
    const productForCart: Product = {
      id: product._id,
      name: product.name,
      description: product.description || '',
      price: pricing.total / quantity,
      compareAtPrice: product.price,
      sku: `SANITY-${product._id.slice(0, 8)}`,
      category: 'skincare' as ProductCategory,
      tags: [],
      images: [
        {
          id: '1',
          url: product.image?.asset?.url || product.gallery?.[0]?.asset?.url || '',
          altText: product.image?.alt || product.name,
          isPrimary: true,
          sortOrder: 0,
        }
      ],
      inventory: {
        trackQuantity: false,
        quantity: product.inventory || 999,
        lowStockThreshold: 5,
        allowBackorder: true,
      },
      shipping: {
        weight: 100,
        dimensions: { length: 10, width: 10, height: 5 },
        requiresShipping: true,
      },
      seo: {
        slug: product.slug?.current || product.name.toLowerCase().replace(/\s+/g, '-'),
        title: product.name,
        metaDescription: product.description,
      },
      active: product.inStock,
      featured: product.featured,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    try {
      await addToCart(productForCart, quantity);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId) 
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const images = product?.gallery?.length ? product.gallery : (product?.image ? [product.image] : []);
  const pricing = calculatePricing();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <span className="text-gray-600">Loading product...</span>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <Package className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The product you\'re looking for doesn\'t exist.'}</p>
          <Link to="/products" className="btn-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Discount Banner */}
      <DiscountBanner currentPage="products" />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-custom py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-primary-600">Home</Link>
            <span className="text-gray-300">/</span>
            <Link to="/products" className="text-gray-500 hover:text-primary-600">Products</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                {images.length > 0 ? (
                  <img
                    src={images[selectedImage]?.asset?.url}
                    alt={images[selectedImage]?.alt || product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                
                {/* Sale Badge */}
                {product.salePrice && product.salePrice < product.price && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                  </div>
                )}

                {/* Featured Badge */}
                {product.featured && (
                  <div className="absolute top-4 right-4 bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </div>
                )}

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : images.length - 1)}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedImage(prev => prev < images.length - 1 ? prev + 1 : 0)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Images */}
              {images.length > 1 && (
                <div className="flex space-x-3">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index 
                          ? 'border-primary-600' 
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image?.asset?.url}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Header */}
              <div>
                {/* Category */}
                {product.category && (
                  <div className="flex items-center space-x-2 mb-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-primary-600 font-medium">{product.category.name}</span>
                  </div>
                )}

                <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
                
                {/* Price */}
                <div className="flex items-center space-x-3 mb-4">
                  {pricing.savings > 0 ? (
                    <>
                      <span className="text-3xl font-bold text-primary-600">
                        ${pricing.total.toFixed(2)}
                      </span>
                      <span className="text-xl text-gray-500 line-through">
                        ${pricing.originalTotal.toFixed(2)}
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                        Save ${pricing.savings.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-primary-600">
                      ${pricing.total.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Stock Status */}
                <div className="flex items-center space-x-2 mb-4">
                  <div className={`w-3 h-3 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`text-sm font-medium ${product.inStock ? 'text-green-700' : 'text-red-700'}`}>
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Add-ons Section */}
              {product.addOns && product.addOns.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Add-ons</h3>
                  <div className="space-y-3">
                    {product.addOns.map((addOn: any) => (
                      <div key={addOn._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleAddOn(addOn._id)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              selectedAddOns.includes(addOn._id)
                                ? 'bg-primary-600 border-primary-600'
                                : 'border-gray-300 hover:border-primary-600'
                            }`}
                          >
                            {selectedAddOns.includes(addOn._id) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </button>
                          <div>
                            <p className="font-medium text-gray-900">{addOn.name}</p>
                            {addOn.description && (
                              <p className="text-sm text-gray-600">{addOn.description}</p>
                            )}
                          </div>
                        </div>
                        <span className="font-medium text-gray-900">+${addOn.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center space-x-4 mb-6">
                  <label className="text-sm font-medium text-gray-900">Quantity:</label>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="p-2 hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 border-x border-gray-300 min-w-[60px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(prev => prev + 1)}
                      className="p-2 hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={!product.inStock || cartLoading}
                    className="btn-primary flex-1 flex items-center justify-center space-x-2"
                  >
                    {cartLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ShoppingCart className="w-5 h-5" />
                    )}
                    <span>{cartLoading ? 'Adding...' : 'Add to Cart'}</span>
                  </button>
                  
                  <button
                    onClick={handleWishlistClick}
                    title={!isAuthenticated ? "Sign in to add to wishlist" : "Add to wishlist"}
                    className={`p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${
                      isWishlisted ? 'text-red-500 border-red-300' : 'text-gray-600'
                    } ${!isAuthenticated ? 'opacity-75' : ''}`}
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted && isAuthenticated ? 'fill-current' : ''}`} />
                  </button>
                  
                  <button 
                    onClick={handleShareClick}
                    title="Share this product"
                    className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Share2 className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Product Features */}
              <div className="border-t border-gray-200 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    <Truck className="w-5 h-5 text-primary-600" />
                    <span className="text-sm text-gray-600">Free shipping over $50</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-primary-600" />
                    <span className="text-sm text-gray-600">30-day guarantee</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RefreshCw className="w-5 h-5 text-primary-600" />
                    <span className="text-sm text-gray-600">Easy returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Product Information */}
          {(product.ingredients || product.howToUse || product.benefits) && (
            <div className="mt-16 border-t border-gray-200 pt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Product Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {product.ingredients && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{product.ingredients}</p>
                  </div>
                )}
                {product.howToUse && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Use</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{product.howToUse}</p>
                  </div>
                )}
                {product.benefits && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{product.benefits}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPreview;
