import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { useUserRole } from '../hooks/useUserRole';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'customer';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole = 'admin' }) => {
  const { userRole, loading, clerkUser } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!clerkUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {requiredRole === 'admin' ? 'Admin Access' : 'Account Required'}
            </h2>
            <p className="text-gray-600">
              {requiredRole === 'admin' 
                ? 'Sign in to manage your services and bookings' 
                : 'Sign in to manage your appointments and bookings'
              }
            </p>
          </div>
          <SignIn 
            routing="hash"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-xl"
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (requiredRole && userRole !== requiredRole) {
    // Allow admins to access customer pages (admin inherits customer permissions)
    if (requiredRole === 'customer' && userRole === 'admin') {
      // Admin can access customer pages
    } else {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500">
              Required role: {requiredRole} | Your role: {userRole}
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;