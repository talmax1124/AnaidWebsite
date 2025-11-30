import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Star, Phone, Mail, Clock, ShoppingCart, ArrowRight, Sparkles, Award, Users } from 'lucide-react';
import { sanityService, SanityProduct, SanityService, SanityAddOn } from '../services/sanityService';
import { useCart } from '../contexts/CartContext';

const HomePage: React.FC = () => {
  const [services, setServices] = useState<SanityService[]>([]);
  const [addOns, setAddOns] = useState<SanityAddOn[]>([]);
  const [products, setProducts] = useState<SanityProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();
  const appointmentsPath = '/services#booking';

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch data with fallbacks
        const [fetchedServices, fetchedAddOns, featuredProducts] = await Promise.all([
          sanityService.getServices().catch(err => {
            console.error('Error fetching services:', err);
            return [];
          }),
          (async () => {
            // Since Sanity doesn't have add-ons yet, return empty array
            return [];
          })(),
          sanityService.getFeaturedProducts().catch(err => {
            console.error('Error fetching products:', err);
            return [];
          })
        ]);
        
        setServices(fetchedServices);
        setAddOns(fetchedAddOns);
        setProducts(featuredProducts);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Set empty arrays as fallbacks
        setServices([]);
        setAddOns([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Scroll effect for parallax and animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, []);

  const testimonials = [
    {
      name: "Sarah M.",
      rating: 5,
      text: "Anna is absolutely amazing! My lashes look incredible and last so long. I get compliments everywhere I go. Highly recommend!"
    },
    {
      name: "Jessica L.",
      rating: 5,
      text: "Professional, clean, and the results are stunning. Anna really knows her craft. I won't go anywhere else for my lashes!"
    },
    {
      name: "Maria R.",
      rating: 5,
      text: "Best lash artist in town! The studio is beautiful and Anna makes you feel so comfortable. Love my new lashes!"
    }
  ];

  const galleryImages = [
    'images/gallery/gallery-1.jpg',
    'images/gallery/gallery-2.jpg',
    'images/gallery/gallery-3.jpg',
    'images/gallery/gallery-4.jpg',
    'images/gallery/gallery-5.jpg',
    'images/gallery/gallery-6.jpg'
  ];

  return (
    <div className="min-h-screen">
      {/* Clean Modern Hero Section */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50"
      >
        {/* Subtle Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary-500/5 rounded-full blur-2xl"></div>
        </div>

        <div className="container-custom relative z-10 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-screen py-12 sm:py-16 lg:py-20">
            {/* Content Section */}
            <div 
              className={`space-y-6 sm:space-y-8 text-center lg:text-left ${isVisible ? 'animate-slide-in-left' : 'opacity-0'}`}
              style={{ animationDelay: '0.2s' }}
            >
              {/* Professional Badge */}
              <div className="inline-flex items-center space-x-2 bg-primary-50 border border-primary-100 rounded-full px-4 py-2 text-primary-700 mx-auto lg:mx-0">
                <Award className="w-4 h-4" />
                <span className="text-sm font-medium">Licensed Esthetician & Phlebotomist</span>
              </div>

              {/* Main Heading */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  <span className="block">Professional</span>
                  <span className="block bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                    Esthetic Care
                  </span>
                  <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-gray-600">
                    Tailored for You
                  </span>
                </h1>
              </div>

              {/* Description */}
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Experience personalized beauty treatments with precision and care. 
                From lash extensions to skincare services, enhance your natural beauty 
                with professional expertise.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-md mx-auto lg:mx-0">
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-primary-600">500+</div>
                  <div className="text-sm text-gray-500">Happy Clients</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-secondary-600">5</div>
                  <div className="text-sm text-gray-500">Years Experience</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-primary-600">98%</div>
                  <div className="text-sm text-gray-500">Satisfaction</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                <Link 
                  to={appointmentsPath} 
                  className="group relative inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  <span>Book Appointment</span>
                </Link>
                
                <a 
                  href="#services" 
                  className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-primary-600 border-2 border-primary-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-300"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  View Services
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </a>
              </div>
            </div>
            
            {/* Hero Image */}
            <div 
              className={`relative order-first lg:order-last ${isVisible ? 'animate-slide-in-right' : 'opacity-0'}`}
              style={{ animationDelay: '0.4s' }}
            >
              <div className="relative max-w-lg mx-auto">
                {/* Main Image Container */}
                <div className="relative aspect-square">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-3xl shadow-xl">
                    <img 
                      src="/images/gallery/gallery-1.jpg" 
                      alt="Professional esthetic services"
                      className="w-full h-full object-cover rounded-3xl"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent rounded-3xl"></div>
                  </div>
                </div>

                {/* Clean Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-white p-3 sm:p-4 rounded-xl shadow-lg border border-gray-100 hidden sm:block">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-primary-600" />
                    <span className="text-sm font-semibold text-gray-800">500+ Clients</span>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100 hidden sm:block">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-primary-600">★ 5.0</div>
                    <p className="text-xs sm:text-sm text-gray-600">Perfect Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-400 animate-bounce hidden sm:block">
          <div className="flex flex-col items-center space-y-2">
            <span className="text-sm">Scroll to explore</span>
            <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Services Section */}
      <section id="services" className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl mb-4">
              <Sparkles className="w-6 h-6 text-primary-600" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Professional Services
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Expertly crafted treatments designed to enhance your natural beauty 
              with precision and care
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {services.map((service) => (
                <div key={service._id} className="group bg-white rounded-2xl p-6 lg:p-8 shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-500 hover:scale-105">
                  <div className="text-center">
                    {service.image?.asset?.url ? (
                      <div className="w-16 h-16 mx-auto mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-primary-50 to-secondary-50 p-3">
                        <img 
                          src={service.image.asset.url}
                          alt={service.image.alt || service.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center group-hover:from-primary-200 group-hover:to-secondary-200 transition-all duration-300">
                        <Sparkles className="w-8 h-8 text-primary-600" />
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{service.name}</h3>
                    <p className="text-gray-600 mb-6 text-sm leading-relaxed line-clamp-3">
                      {service.description}
                    </p>
                    <div className="flex justify-between items-center mb-6 text-sm">
                      <div className="flex items-center text-gray-500">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{service.duration || '60'} min</span>
                      </div>
                      <div className="text-2xl font-bold text-primary-600">
                        ${service.price}
                      </div>
                    </div>
                    <Link 
                      to={appointmentsPath}
                      className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {services.length > 4 && (
            <div className="text-center mt-12">
              <Link 
                to={appointmentsPath} 
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl border-2 border-primary-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                View All Services
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      {products.length > 0 && (
        <section className="py-16 sm:py-20 lg:py-24 bg-white">
          <div className="container-custom px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 lg:mb-16">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary-100 rounded-xl mb-4">
                <ShoppingCart className="w-6 h-6 text-secondary-600" />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Premium Products
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                Carefully curated skincare and beauty products to complement your treatments 
                and maintain your radiant results at home
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {products.map((product) => (
                <div key={product._id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-500 hover:scale-105">
                  <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                    {product.image?.asset?.url ? (
                      <img
                        src={product.image.asset.url}
                        alt={product.image.alt || product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <ShoppingCart className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    {product.salePrice && product.salePrice < product.price && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Sale
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed line-clamp-2">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-primary-600">
                          ${(product.salePrice || product.price).toFixed(2)}
                        </span>
                        {product.salePrice && product.salePrice < product.price && (
                          <span className="text-sm text-gray-400 line-through">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button 
                        onClick={() => {
                          const cartProduct = {
                            id: product._id,
                            name: product.name,
                            price: product.salePrice || product.price,
                            image: product.image?.asset?.url,
                            description: product.description
                          };
                          addToCart(cartProduct, 1);
                        }}
                        className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </button>
                      
                      <Link 
                        to={`/products/${product.slug.current}`}
                        className="w-full inline-flex items-center justify-center px-6 py-3 text-primary-600 font-semibold rounded-xl border-2 border-primary-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-300"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link 
                to="/products" 
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-secondary-600 to-secondary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Shop All Products
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Add-Ons Section */}
      {addOns.length > 0 && (
        <section className="section-padding bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Enhance Your Experience</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Add these premium enhancements to any service for the ultimate lash experience
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {addOns.map((addOn) => (
                <div key={addOn._id} className="card text-center hover:shadow-lg transition-all duration-300">
                  {addOn.image?.asset?.url ? (
                    <div className="w-12 h-12 mx-auto mb-3 rounded-lg overflow-hidden">
                      <img 
                        src={addOn.image.asset.url}
                        alt={addOn.image.alt || addOn.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="text-3xl mb-3">⭐</div>
                  )}
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">{addOn.name}</h3>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{addOn.description}</p>
                  <div className="flex justify-center items-center space-x-2 text-xs text-gray-500">
                    <span className="font-bold text-primary-600">+${addOn.price}</span>
                    {addOn.duration && (
                      <>
                        <span>&bull;</span>
                        <span>+{addOn.duration}min</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link to={appointmentsPath} className="btn-primary">
                Book with Add-Ons
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Modern Stats Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container-custom px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Trusted by Hundreds
            </h2>
            <p className="text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto">
              Our commitment to excellence shows in every number
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {[
              { number: '500+', label: 'Happy Clients', icon: Users },
              { number: '5', label: 'Years Experience', icon: Award },
              { number: '98%', label: 'Satisfaction Rate', icon: Star },
              { number: '1000+', label: 'Treatments Complete', icon: Sparkles }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 group-hover:bg-white/30 transition-all duration-300">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                  {stat.number}
                </div>
                <div className="text-primary-100 font-medium text-sm sm:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Gallery Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-4">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Beautiful Transformations
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the artistry and precision that goes into every treatment. 
              See real results from our satisfied clients.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {galleryImages.map((image, index) => {
              const isLarge = index === 0 || index === 3;
              return (
                <div 
                  key={index} 
                  className={`group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ${
                    isLarge ? 'sm:col-span-2 aspect-[16/10]' : 'aspect-square'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                  <img 
                    src={image} 
                    alt={`Professional esthetic treatment ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <div class="text-center">
                              <div class="w-12 h-12 mx-auto mb-3 bg-gray-300 rounded-xl flex items-center justify-center">
                                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <p class="text-sm text-gray-500">Gallery Image ${index + 1}</p>
                            </div>
                          </div>
                        `;
                      }
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-4 sm:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <div className="text-white">
                      <p className="text-sm sm:text-base font-medium">Professional Treatment</p>
                      <p className="text-xs sm:text-sm text-gray-200">View transformation details</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link 
              to={appointmentsPath} 
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Book Your Transformation
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Modern Testimonials Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-xl mb-4">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Client Love Stories
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it. Hear what our clients have to say 
              about their transformative experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="group relative bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-primary-200 transition-all duration-500 hover:scale-105"
              >
                {/* Quote Icon */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
                
                {/* Rating Stars */}
                <div className="flex justify-start mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star 
                      key={i} 
                      className="w-5 h-5 text-yellow-400 fill-current" 
                    />
                  ))}
                </div>
                
                {/* Testimonial Text */}
                <blockquote className="text-gray-700 mb-6 text-base leading-relaxed font-medium">
                  "{testimonial.text}"
                </blockquote>
                
                {/* Author */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-primary-600">Verified Client</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-600" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-6">
              Ready to join our family of satisfied clients?
            </p>
            <Link 
              to={appointmentsPath} 
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Start Your Journey
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Modern About Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Content Side */}
            <div className="space-y-6 lg:space-y-8 order-2 lg:order-1">
              <div>
                <div className="inline-flex items-center space-x-2 bg-primary-50 border border-primary-100 rounded-full px-4 py-2 text-primary-700 mb-4">
                  <Award className="w-4 h-4" />
                  <span className="text-sm font-medium">Licensed Professional</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  Meet Anna
                </h2>
                
                <p className="text-lg sm:text-xl font-medium text-primary-600 mb-6">
                  Licensed Esthetician & Phlebotomist 
                </p>
              </div>
              
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p className="text-base sm:text-lg">
                  With over 5 years of dedicated experience in the beauty industry, Anna has perfected the 
                  art of enhancing natural beauty through precision treatments.
                </p>
                <p className="text-base sm:text-lg">
                  Her commitment to excellence and attention to detail has earned the trust of hundreds 
                  of clients seeking professional esthetic services in a comfortable, welcoming environment.
                </p>
              </div>
              
              {/* Credentials Grid */}
              <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-6">
                {[
                  { number: '500+', label: 'Happy Clients', icon: Users },
                  { number: '5+', label: 'Years Experience', icon: Award },
                  { number: '100%', label: 'Licensed & Certified', icon: Sparkles }
                ].map((credential, index) => (
                  <div key={index} className="group text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-sm mb-3 group-hover:shadow-lg transition-shadow duration-300">
                      <credential.icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-primary-600 mb-1">{credential.number}</div>
                    <div className="text-sm text-gray-600 leading-tight">{credential.label}</div>
                  </div>
                ))}
              </div>
              
              {/* CTA */}
              <div className="pt-6">
                <Link 
                  to={appointmentsPath}
                  className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Book with Anna
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </div>
            </div>
            
            {/* Image Side */}
            <div className="relative order-1 lg:order-2">
              <div className="relative max-w-md mx-auto lg:max-w-full">
                {/* Main Image Container */}
                <div className="aspect-[4/5] bg-gradient-to-br from-primary-100 to-secondary-100 rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80"
                    alt="Anna - Licensed Esthetician and Phlebotomist"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80&sat=-20';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                </div>
                
                {/* Floating Badges */}
                <div className="absolute -top-4 -right-4 bg-white p-4 rounded-xl shadow-lg border border-gray-100 hidden sm:block">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">★ 5.0</div>
                    <p className="text-xs text-gray-600">Perfect Rating</p>
                  </div>
                </div>
                
                <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-xl shadow-lg border border-gray-100 hidden sm:block">
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Licensed</p>
                      <p className="text-xs text-gray-600">Professional</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Contact Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 text-gray-900 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container-custom px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl mb-4">
              <Phone className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
              Ready to Begin?
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto">
              Take the first step towards your transformation. Book your consultation today 
              and discover the difference professional care makes.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Get in Touch</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Ready to experience professional esthetic care? Reach out through any of these 
                  convenient methods to schedule your personalized consultation.
                </p>
              </div>

              <div className="space-y-6">
                <div className="group flex items-start space-x-4 p-6 rounded-xl bg-white/70 backdrop-blur-sm border border-emerald-200/50 hover:bg-white/90 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors duration-300">
                    <Phone className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">Call or Text</h4>
                    <p className="text-gray-700 font-medium">321 316 9898</p>
                    <p className="text-sm text-gray-500">Quick response guaranteed</p>
                  </div>
                </div>

                <div className="group flex items-start space-x-4 p-6 rounded-xl bg-white/70 backdrop-blur-sm border border-teal-200/50 hover:bg-white/90 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center group-hover:bg-teal-200 transition-colors duration-300">
                    <Mail className="w-6 h-6 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                    <p className="text-gray-700 font-medium">anaidmdiazplaza@gmail.com</p>
                    <p className="text-sm text-gray-500">For detailed inquiries</p>
                  </div>
                </div>

                <div className="group flex items-start space-x-4 p-6 rounded-xl bg-white/70 backdrop-blur-sm border border-cyan-200/50 hover:bg-white/90 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center group-hover:bg-cyan-200 transition-colors duration-300">
                    <Clock className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">Business Hours</h4>
                    <div className="text-gray-700 text-sm space-y-1">
                      <p><span className="font-semibold">Mon & Wed:</span> 9AM - 9PM</p>
                      <p><span className="font-semibold">Tuesday:</span> 2PM - 6PM</p>
                      <p><span className="font-semibold">Fri - Sun:</span> 2PM - 10PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Card */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-2xl border border-gray-100 relative overflow-hidden">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-secondary-50/50 pointer-events-none"></div>
                
                <div className="relative">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl mb-4">
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Book Online</h3>
                    <p className="text-gray-600">
                      Schedule your appointment instantly with our convenient online booking system.
                    </p>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs">✓</span>
                      </div>
                      <span>Instant confirmation</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs">✓</span>
                      </div>
                      <span>Choose your preferred time</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs">✓</span>
                      </div>
                      <span>Easy rescheduling options</span>
                    </div>
                  </div>
                  
                  <Link 
                    to={appointmentsPath} 
                    className="w-full inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-center"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Book Your Appointment
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom CTA */}
          <div className="text-center mt-16 pt-8 border-t border-gray-200">
            <p className="text-gray-600 mb-4">
              Questions? Don't hesitate to reach out. We're here to help make your experience perfect.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="tel:3213169898"
                className="inline-flex items-center justify-center px-6 py-3 bg-emerald-100 text-emerald-700 font-semibold rounded-xl border border-emerald-200 hover:bg-emerald-200 hover:shadow-md transition-all duration-300"
              >
                <Phone className="w-5 h-5 mr-2" />
                Call Now
              </a>
              <a 
                href="mailto:anaidmdiazplaza@gmail.com"
                className="inline-flex items-center justify-center px-6 py-3 bg-teal-100 text-teal-700 font-semibold rounded-xl border border-teal-200 hover:bg-teal-200 hover:shadow-md transition-all duration-300"
              >
                <Mail className="w-5 h-5 mr-2" />
                Send Email
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
