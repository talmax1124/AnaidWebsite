import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Calendar, Search, Loader2, Filter, Plus, Star } from 'lucide-react';
import { sanityService, SanityService } from '../services/sanityService';
import DiscountBanner from '../components/DiscountBanner';
import { discountService, Discount } from '../services/discountService';
import { BookingSection } from './BookingPage';
import { useAuth } from '../contexts/AuthContext';

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<SanityService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high' | 'newest'>('newest');
  const [activeDiscounts, setActiveDiscounts] = useState<Discount[]>([]);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const bookingAnchorId = 'booking';
  const appointmentsPath = `/services#${bookingAnchorId}`;

  // Calculate discounted price for a service
  const calculateDiscountedPrice = (service: SanityService): { originalPrice: number; discountedPrice?: number; savings?: number } => {
    const applicableDiscounts = activeDiscounts.filter(discount => {
      if (!discountService.isDiscountValid(discount)) return false;
      if (discount.applicableTo === 'services' || discount.applicableTo === 'all') return true;
      return false;
    });

    if (applicableDiscounts.length === 0) {
      return { originalPrice: service.price };
    }

    const bestDiscount = discountService.getBestDiscount(
      applicableDiscounts, 
      [{ id: service._id, productId: service._id, name: service.name, price: service.price, quantity: 1, type: 'service' }], 
      service.price
    );

    if (!bestDiscount) {
      return { originalPrice: service.price };
    }

    const discountAmount = discountService.calculateDiscountAmount(
      bestDiscount, 
      [{ id: service._id, productId: service._id, name: service.name, price: service.price, quantity: 1, type: 'service' }], 
      service.price
    );

    return {
      originalPrice: service.price,
      discountedPrice: service.price - discountAmount,
      savings: discountAmount
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [fetchedServices, fetchedDiscounts] = await Promise.allSettled([
          sanityService.getServices().catch(err => {
            console.error('Error fetching services:', err);
            return [];
          }),
          discountService.getActiveDiscounts().catch(err => {
            console.error('Error fetching discounts:', err);
            return [];
          })
        ]);
        
        // Process results safely
        if (fetchedServices.status === 'fulfilled') {
          setServices(fetchedServices.value || []);
        } else {
          setServices([]);
        }
        
        if (fetchedDiscounts.status === 'fulfilled') {
          setActiveDiscounts(fetchedDiscounts.value || []);
        } else {
          setActiveDiscounts([]);
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        setServices([]);
        setActiveDiscounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and sort services
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (service.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesCategory = selectedCategory === 'all' || 
                           service.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'newest':
        // For services, we'll use featured status for newest since we don't have dates
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Discount Banner */}
      <DiscountBanner currentPage="services" />

      {/* Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="container-custom section-padding">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Professional Services
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the art of beautiful lashes and other services with our professional services, 
              tailored to enhance your natural beauty and boost your confidence.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search services..."
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
                  <option value="all">All Categories</option>
                  <option value="facial">Facial Treatments</option>
                  <option value="body">Body Treatments</option>
                  <option value="waxing">Waxing</option>
                  <option value="lashes-brows">Lashes & Brows</option>
                  <option value="special">Special Treatments</option>
                </select>
                <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
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
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-6">
            <p className="text-gray-600">
              {loading ? 'Loading...' : `${sortedServices.length} services found`}
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-padding">
        <div className="container-custom">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              <span className="ml-2 text-gray-600">Loading services...</span>
            </div>
          ) : sortedServices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No services found</h3>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedServices.map((service) => {
                const pricing = calculateDiscountedPrice(service);
                return (
                <div key={service._id} className="card group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden border border-gray-100 hover:border-primary-200">
                  {/* Sale Badge */}
                  {pricing.savings && pricing.savings > 0 && (
                    <div className="absolute top-4 left-4 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      Save ${pricing.savings.toFixed(2)}
                    </div>
                  )}

                  {/* Featured Badge */}
                  {service.featured && (
                    <div className="absolute top-4 right-4 z-10 bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </div>
                  )}

                  {/* Service Image */}
                  <div className="aspect-[4/3] bg-gray-100 rounded-lg mb-6 relative">
                    {service.image?.asset?.url ? (
                      <img
                        src={service.image.asset.url}
                        alt={service.image.alt || service.name}
                        className="w-full h-full object-cover rounded-lg"
                        style={{ transform: 'none !important' }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center rounded-lg">
                        <span className="text-4xl">🎯</span>
                      </div>
                    )}
                  </div>

                  {/* Service Content */}
                  <div className="space-y-4">
                    {/* Category */}
                    {service.category && (
                      <span className="inline-block bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                        {service.category}
                      </span>
                    )}

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {service.name}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {service.description}
                    </p>

                    {/* Service Details */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        {service.duration && (
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {service.duration} min
                          </span>
                        )}
                        <span className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-1 ${service.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {service.active ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>

                    {/* Add-ons Preview */}
                    {service.addOns && service.addOns.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Available Add-ons</span>
                          <Plus className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="space-y-1">
                          {service.addOns.slice(0, 2).map((addOn: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">{addOn.name}</span>
                              <span className="font-medium text-gray-700">+${addOn.price}</span>
                            </div>
                          ))}
                          {service.addOns.length > 2 && (
                            <div className="text-xs text-gray-500 text-center pt-1">
                              +{service.addOns.length - 2} more add-ons
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Price and Action */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex flex-col">
                        {pricing.discountedPrice && pricing.discountedPrice < pricing.originalPrice ? (
                          <>
                            <div className="text-2xl font-bold text-primary-600">
                              ${pricing.discountedPrice.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500 line-through">
                              ${pricing.originalPrice.toFixed(2)}
                            </div>
                          </>
                        ) : (
                          <div className="text-2xl font-bold text-primary-600">
                            ${pricing.originalPrice.toFixed(2)}
                          </div>
                        )}
                        {pricing.savings && pricing.savings > 0 && (
                          <div className="text-xs text-green-600 font-medium">
                            You save ${pricing.savings.toFixed(2)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Link
                          to={`/services/${service.slug.current}`}
                          className="btn-secondary btn-sm"
                        >
                          Learn More
                        </Link>
                        <button
                          onClick={() => navigate(`/booking/${service._id}`)}
                          className="btn-primary btn-sm"
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          Book Now
                        </button>
                      </div>
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
            Ready to Transform Your Look?
          </h2>
          <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
            Book your appointment today and experience the difference of professional 
            lash services by Anna. Your journey to beautiful lashes starts here.
          </p>
          <Link to={appointmentsPath} className="btn-secondary">
            <Calendar className="w-5 h-5 mr-2" />
            Book Appointment
          </Link>
        </div>
      </section>

      {/* Booking Section */}
      <section id={bookingAnchorId} className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Book Your Appointment</h2>
              <p className="text-gray-600">
                Select your service above, then sign in to schedule your visit.
              </p>
            </div>

            {isAuthenticated ? (
              <BookingSection embedded />
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-gray-700 mb-4">
                  Please sign in to continue with your booking.
                </p>
                <Link
                  to="/login"
                  state={{ from: { pathname: '/services', hash: `#${bookingAnchorId}` } }}
                  className="btn-primary"
                >
                  Sign In to Book
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
