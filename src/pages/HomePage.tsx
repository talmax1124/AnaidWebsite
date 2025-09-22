import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Star, Phone, Mail, Clock } from 'lucide-react';
import { getActiveServices } from '../services/firebaseService';
import { Service } from '../types';

const HomePage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const activeServices = await getActiveServices();
        setServices(activeServices.slice(0, 4)); // Show only first 4 services
        setLoading(false);
      } catch (error) {
        console.error('Error fetching services:', error);
        setLoading(false);
      }
    };

    fetchServices();
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
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-secondary-50 section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Beautiful Lashes
                <br />
                <span className="text-primary-600">Designed for You</span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Professional lash extension services that enhance your natural beauty with precision and care. 
                Experience the luxury of perfectly crafted lashes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/booking" className="btn-primary inline-flex items-center justify-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Appointment
                </Link>
                <a href="#services" className="btn-secondary inline-flex items-center justify-center">
                  View Services
                </a>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary-200 to-secondary-200 rounded-2xl shadow-2xl overflow-hidden">
                <img 
                  src="/images/gallery/gallery-1.jpg" 
                  alt="Beautiful lash work by Anna"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-xl">
                <h3 className="font-bold text-gray-900 mb-1">Premium Quality</h3>
                <p className="text-sm text-gray-600">Certified & Professional</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professional lash services tailored to your unique style and preferences
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service) => (
                <div key={service.id} className="card group hover:shadow-xl transition-all duration-300">
                  <div className="text-center">
                    <div className="text-4xl mb-4">{service.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                      {service.description}
                    </p>
                    <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {service.duration}min
                      </span>
                      <span className="text-lg font-bold text-primary-600">
                        ${service.price}
                      </span>
                    </div>
                    <Link 
                      to="/booking" 
                      className="w-full btn-primary text-center group-hover:scale-105 transition-transform"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {services.length > 4 && (
            <div className="text-center mt-8">
              <Link to="/booking" className="btn-secondary">
                View All Services
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: '500+', label: 'Happy Clients' },
              { number: '5', label: 'Years Experience' },
              { number: '98%', label: 'Satisfaction Rate' },
              { number: '1000+', label: 'Lashes Applied' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Gallery</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See the beautiful transformations we create for our clients
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryImages.map((image, index) => (
              <div 
                key={index} 
                className="aspect-square bg-gray-200 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow group"
              >
                <img 
                  src={image} 
                  alt={`Beautiful lash work ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback to gradient background if image doesn't load
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/booking" className="btn-primary">
              Book Your Transformation
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Clients Say</h2>
            <p className="text-lg text-gray-600">Real experiences from our satisfied clients</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card text-center">
                <div className="flex justify-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
                <p className="font-semibold text-gray-900">- {testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Meet Anna</h2>
              <p className="text-lg font-medium text-primary-600">
                Certified Lash Artist & Beauty Specialist
              </p>
              <p className="text-gray-600 leading-relaxed">
                With over 5 years of experience in the beauty industry, Anna specializes in creating 
                stunning lash extensions that enhance your natural beauty. Her attention to detail and 
                commitment to quality has made her a trusted choice for clients seeking premium lash services.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { number: '500+', label: 'Happy Clients' },
                  { number: '5 Years', label: 'Experience' },
                  { number: 'Certified', label: 'Professional' }
                ].map((credential, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xl font-bold text-primary-600">{credential.number}</div>
                    <div className="text-sm text-gray-600">{credential.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary-200 to-secondary-200 rounded-2xl shadow-xl">
                {/* Placeholder for Anna's photo */}
                <div className="w-full h-full flex items-center justify-center text-6xl text-primary-600">
                  👩‍💼
                </div>
              </div>
              <div className="absolute -top-6 -left-6 bg-white p-4 rounded-lg shadow-lg">
                <span className="text-sm font-medium text-primary-600">Certified Professional</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section-padding bg-primary-600 text-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Book Your Appointment</h2>
              <p className="text-primary-100 mb-8 text-lg leading-relaxed">
                Ready to transform your lashes? Get in touch to schedule your consultation and 
                experience the difference of professional lash extensions.
              </p>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Phone</h4>
                    <p className="text-primary-100">321 316 9898</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Email</h4>
                    <p className="text-primary-100">anaidmdiazplaza@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Hours</h4>
                    <div className="text-primary-100 text-sm">
                      <p>Mon & Wed: 9AM-9PM</p>
                      <p>Tue: 2PM-6PM</p>
                      <p>Fri-Sun: 2PM-10PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white text-gray-900 p-8 rounded-xl shadow-xl">
              <h3 className="text-2xl font-bold mb-6">Ready to Book?</h3>
              <p className="text-gray-600 mb-6">
                Use our online booking system to schedule your appointment at your convenience.
              </p>
              <Link to="/booking" className="w-full btn-primary text-center block">
                <Calendar className="w-5 h-5 mr-2 inline" />
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;