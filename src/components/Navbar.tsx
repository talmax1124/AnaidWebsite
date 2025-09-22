import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { Menu, X, Calendar, Settings } from 'lucide-react';
import { useUserRole } from '../hooks/useUserRole';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAdmin, clerkUser } = useUserRole();
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Payment Options', href: '/payment-options' },
    ...(clerkUser ? [
      { name: 'Book Appointment', href: '/booking' },
      { name: 'My Appointments', href: '/manage' },
    ] : [
      { name: 'Sign In to Book', href: '/booking' },
    ])
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">EA</span>
            </div>
            <span className="font-display text-xl font-bold text-gray-900">
              Esthithics By Anna
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`font-medium transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center space-x-2 font-medium transition-colors duration-200 ${
                  isActive('/admin')
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}

            {clerkUser ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <Link to="/booking" className="btn-primary">
                <Calendar className="w-4 h-4 mr-2" />
                Sign In to Book
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary-600 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-primary-600'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-2 font-medium transition-colors duration-200 ${
                    isActive('/admin')
                      ? 'text-primary-600'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Admin</span>
                </Link>
              )}

              <div className="pt-2">
                {clerkUser ? (
                  <UserButton afterSignOutUrl="/" />
                ) : (
                  <Link
                    to="/booking"
                    onClick={() => setIsOpen(false)}
                    className="btn-primary inline-flex items-center"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Sign In to Book
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;