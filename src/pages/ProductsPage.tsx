import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Search, 
  Grid,
  List,
  ChevronDown,
  Tag,
  Heart,
  Share2,
  Loader2,
  Star,
  Plus
} from 'lucide-react';
import { sanityService, SanityProduct, SanityCategory } from '../services/sanityService';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import DiscountBanner from '../components/DiscountBanner';
import { discountService, Discount } from '../services/discountService';
import { wishlistService, ProductForWishlist } from '../services/wishlistService';
import { Product } from '../types';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<SanityProduct[]>([]);
  const [categories, setCategories] = useState<SanityCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high' | 'newest'>('newest');
  const { addToCart, isLoading: cartLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [activeDiscounts, setActiveDiscounts] = useState<Discount[]>([]);
  const [wishlistedProducts, setWishlistedProducts] = useState<Set<string>>(new Set());
  const appointmentsPath = '/services#booking';

  // Calculate discounted price for a product
  const calculateDiscountedPrice = (product: SanityProduct): { originalPrice: number; discountedPrice?: number; savings?: number } => {
    const price = product.salePrice || product.price;
    const originalPrice = product.price;
    
    const applicableDiscounts = activeDiscounts.filter(discount => {
      if (!discountService.isDiscountValid(discount)) return false;
      if (discount.applicableTo === 'products' || discount.applicableTo === 'all') return true;
      return false;
    });

    if (applicableDiscounts.length === 0) {
      return { 
        originalPrice: price,
        discountedPrice: product.salePrice ? product.salePrice : undefined,
        savings: product.salePrice ? (originalPrice - product.salePrice) : undefined
      };
    }

    const bestDiscount = discountService.getBestDiscount(
      applicableDiscounts, 
      [{ id: product._id, productId: product._id, name: product.name, price: price, quantity: 1, type: 'product' }], 
      price
    );

    if (!bestDiscount) {
      return { 
        originalPrice: price,
        discountedPrice: product.salePrice ? product.salePrice : undefined,
        savings: product.salePrice ? (originalPrice - product.salePrice) : undefined
      };
    }

    const discountAmount = discountService.calculateDiscountAmount(
      bestDiscount, 
      [{ id: product._id, productId: product._id, name: product.name, price: price, quantity: 1, type: 'product' }], 
      price
    );

    const finalPrice = price - discountAmount;
    const totalSavings = (originalPrice - finalPrice) + (product.salePrice ? 0 : discountAmount);

    return {
      originalPrice: originalPrice,
      discountedPrice: finalPrice,
      savings: totalSavings
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedCategories, fetchedDiscounts] = await Promise.all([
          sanityService.getCategories(),
          discountService.getActiveDiscounts()
        ]);
        setCategories(fetchedCategories);
        setActiveDiscounts(fetchedDiscounts);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedProducts = await sanityService.getProducts();
      // Filter by category if selected
      if (selectedCategory === 'all') {
        setProducts(fetchedProducts);
      } else {
        const filtered = fetchedProducts.filter(product => 
          product.category?._id === selectedCategory
        );
        setProducts(filtered);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      fetchProducts();
      return;
    }

    setLoading(true);
    try {
      const searchResults = await sanityService.searchProducts(searchTerm);
      setProducts(searchResults);
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, fetchProducts]);

  useEffect(() => {
    fetchProducts();
    
    // Add a test product for debugging
    const testProduct: SanityProduct = {
      _id: 'test-product-001',
      name: 'Test Lash Serum',
      slug: { current: 'test-lash-serum' },
      price: 29.99,
      salePrice: undefined,
      image: {
        asset: {
          _ref: 'test-image',
          url: 'https://via.placeholder.com/300x300/ec4899/ffffff?text=Test+Product'
        },
        alt: 'Test Lash Serum'
      },
      description: 'This is a test product for debugging the cart system.',
      featured: true,
      inStock: true,
      inventory: 10,
      _createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    };
    
    // Add test product to the list for debugging
    setProducts(prev => [testProduct, ...prev]);
  }, [fetchProducts]);

  useEffect(() => {
    if (searchTerm) {
      handleSearch();
    } else {
      fetchProducts();
    }
  }, [searchTerm, handleSearch, fetchProducts]);

  // Load user's wishlist when they're authenticated
  useEffect(() => {
    const loadWishlist = async () => {
      if (isAuthenticated) {
        try {
          const wishlist = await wishlistService.getWishlist();
          if (Array.isArray(wishlist)) {
            const wishlistedIds = new Set(wishlist.map(item => item.product_id));
            setWishlistedProducts(wishlistedIds);
          } else {
            console.warn('Wishlist response is not an array:', wishlist);
            setWishlistedProducts(new Set());
          }
        } catch (error) {
          console.error('Error loading wishlist:', error);
          setWishlistedProducts(new Set());
        }
      } else {
        setWishlistedProducts(new Set());
      }
    };
    
    loadWishlist();
  }, [isAuthenticated]);

  const sortProducts = (products: SanityProduct[]): SanityProduct[] => {
    const sorted = [...products];
    
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'price-low':
        return sorted.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
      case 'price-high':
        return sorted.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
      case 'newest':
        return sorted.sort((a, b) => new Date(b.publishedAt || b._createdAt || '').getTime() - new Date(a.publishedAt || a._createdAt || '').getTime());
      default:
        return sorted;
    }
  };

  const handleWishlistClick = async (product: SanityProduct) => {
    if (!isAuthenticated) {
      alert('Please sign in to add items to your wishlist. You will be redirected to the login page.');
      window.location.href = '/login';
      return;
    }
    
    try {
      const isCurrentlyWishlisted = wishlistedProducts.has(product._id);
      
      if (isCurrentlyWishlisted) {
        await wishlistService.removeFromWishlist(product._id);
        setWishlistedProducts(prev => {
          const newSet = new Set(prev);
          newSet.delete(product._id);
          return newSet;
        });
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
        setWishlistedProducts(prev => new Set(prev).add(product._id));
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      alert('Failed to update wishlist. Please try again.');
    }
  };

  const handleShareClick = (product: SanityProduct) => {
    const productUrl = `${window.location.origin}/products/${product.slug.current}`;
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

  const handleAddToCart = async (product: SanityProduct) => {
    setAddingToCart(product._id);
    try {
      // Convert SanityProduct to Product interface
      const productForCart: Product = {
        id: product._id,
        name: product.name,
        description: product.description || '',
        price: product.salePrice || product.price,
        compareAtPrice: product.price !== (product.salePrice || product.price) ? product.price : undefined,
        sku: product._id, // Using ID as SKU for now
        category: 'lash-care' as const, // Default category
        tags: [],
        images: product.image?.asset?.url ? [{
          id: product.image.asset._ref || product._id,
          url: product.image.asset.url,
          altText: product.image.alt || product.name,
          isPrimary: true,
          sortOrder: 0
        }] : [],
        inventory: {
          trackQuantity: false,
          quantity: 100,
          lowStockThreshold: 10,
          allowBackorder: true
        },
        shipping: {
          weight: 100,
          dimensions: { length: 10, width: 10, height: 10 },
          requiresShipping: true
        },
        seo: {
          slug: product.slug?.current || product._id
        },
        active: true,
        featured: product.featured || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await addToCart(productForCart, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(null);
    }
  };

  const sortedProducts = sortProducts(products);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Discount Banner */}
      <DiscountBanner currentPage="products" />

      {/* Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="container-custom section-padding">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Professional Styling Products
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Premium quality products to maintain and enhance your lashes, brows, and skincare routine
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              {/* Category Filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Products</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="newest">Newest</option>
                  <option value="name">Name A-Z</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-gray-600">
              {loading ? 'Loading...' : `${sortedProducts.length} products found`}
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="section-padding">
        <div className="container-custom">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              <span className="ml-2 text-gray-600">Loading products...</span>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search or filter criteria
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="btn-primary"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-6'
            }>
              {sortedProducts.map((product) => {
                const pricing = calculateDiscountedPrice(product);
                return (
                <div 
                  key={product._id} 
                  className={viewMode === 'grid' 
                    ? 'card group hover:shadow-xl transition-all duration-300 relative overflow-hidden'
                    : 'card flex flex-col sm:flex-row gap-4 relative overflow-hidden'
                  }
                >
                  {/* Sale Badge */}
                  {pricing.savings && pricing.savings > 0 && (
                    <div className={`absolute top-4 left-4 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold ${
                      viewMode === 'list' ? 'sm:top-4 sm:left-4' : ''
                    }`}>
                      Save ${pricing.savings.toFixed(2)}
                    </div>
                  )}

                  {/* Featured Badge */}
                  {product.featured && (
                    <div className={`absolute top-4 right-4 z-10 bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center ${
                      viewMode === 'list' ? 'sm:top-4 sm:right-4' : ''
                    }`}>
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </div>
                  )}

                  {/* Stock Status */}
                  {!product.inStock && (
                    <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-bold ${
                      viewMode === 'list' ? 'sm:top-4' : ''
                    }`}>
                      Out of Stock
                    </div>
                  )}

                  {/* Product Image */}
                  <div className={`${viewMode === 'grid' ? 'aspect-square mb-4' : 'w-full sm:w-48 h-48'} bg-gray-100 rounded-lg overflow-hidden relative`}>
                    {product.image?.asset?.url || (product.gallery && product.gallery.length > 0) ? (
                      <img
                        src={product.image?.asset?.url || product.gallery?.[0]?.asset?.url}
                        alt={product.image?.alt || product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Tag className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className={viewMode === 'grid' ? '' : 'flex-1'}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        <Link to={`/products/${product.slug.current}`}>
                          {product.name}
                        </Link>
                      </h3>
                      <div className="flex items-center space-x-1 ml-2">
                        <button 
                          onClick={() => handleWishlistClick(product)}
                          title={!isAuthenticated ? "Sign in to add to wishlist" : "Add to wishlist"}
                          className={`p-1 transition-colors ${
                            wishlistedProducts.has(product._id) && isAuthenticated
                              ? 'text-red-500' 
                              : 'text-gray-400 hover:text-red-500'
                          } ${!isAuthenticated ? 'opacity-75' : ''}`}
                        >
                          <Heart className={`w-4 h-4 ${wishlistedProducts.has(product._id) && isAuthenticated ? 'fill-current' : ''}`} />
                        </button>
                        <button 
                          onClick={() => handleShareClick(product)}
                          title="Share this product"
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Category */}
                    {product.category && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {product.category.name}
                        </span>
                      </div>
                    )}

                    {/* Add-ons Preview */}
                    {product.addOns && product.addOns.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Available Add-ons</span>
                          <Plus className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="space-y-1">
                          {product.addOns.slice(0, 2).map((addOn: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">{addOn.name}</span>
                              <span className="font-medium text-gray-700">+${addOn.price}</span>
                            </div>
                          ))}
                          {product.addOns.length > 2 && (
                            <div className="text-xs text-gray-500 text-center pt-1">
                              +{product.addOns.length - 2} more add-ons
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Price and Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        {pricing.discountedPrice && pricing.discountedPrice < pricing.originalPrice ? (
                          <>
                            <div className="text-lg font-bold text-primary-600">
                              ${pricing.discountedPrice.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500 line-through">
                              ${pricing.originalPrice.toFixed(2)}
                            </div>
                          </>
                        ) : (
                          <div className="text-lg font-bold text-primary-600">
                            ${pricing.originalPrice.toFixed(2)}
                          </div>
                        )}
                        {pricing.savings && pricing.savings > 0 && (
                          <div className="text-xs text-green-600 font-medium">
                            You save ${pricing.savings.toFixed(2)}
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={addingToCart === product._id || cartLoading}
                        className="btn-primary btn-sm flex items-center space-x-2"
                      >
                        {addingToCart === product._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ShoppingCart className="w-4 h-4" />
                        )}
                        <span>{addingToCart === product._id ? 'Adding...' : 'Add to Cart'}</span>
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white section-padding">
        <div className="container-custom text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Need Help Choosing Products?
          </h2>
          <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
            Book a consultation with Anna to get personalized product recommendations 
            for your specific needs and skin type.
          </p>
          <Link to={appointmentsPath} className="btn-secondary">
            Book Consultation
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ProductsPage;
