import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

// Types
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: string;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  accessToken: string | null;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Neon backend authentication implementation
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  useEffect(() => {
    let mounted = true; // Prevent state updates if component unmounted
    
    // Initialize auth state
    const initAuth = async () => {
      try {
        // Check if user is authenticated via backend
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: 'include', // Important for cookies
        });

        if (!mounted) return; // Component unmounted, don't update state

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.user) {
            setUser({
              ...result.data.user,
              created_at: result.data.user.created_at || new Date().toISOString()
            });
            setAccessToken('authenticated'); // We use cookies, so just mark as authenticated
          }
        } else {
          // Clear any stale auth data
          setUser(null);
          setAccessToken(null);
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setUser(null);
          setAccessToken(null);
          setLoading(false);
        }
      }
    };

    initAuth();
    
    return () => {
      mounted = false; // Cleanup flag
    };
  }, [API_BASE]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.requiresVerification) {
          throw new Error(`${result.message} Would you like us to resend the verification email?`);
        }
        throw new Error(result.message || 'Login failed');
      }

      if (result.success && result.data?.user) {
        const userData = {
          ...result.data.user,
          created_at: result.data.user.created_at || new Date().toISOString()
        };
        
        setUser(userData);
        setAccessToken('authenticated');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }

      if (result.success) {
        // Registration successful - backend will send verification email
        // Don't auto-login since email verification is required
        throw new Error(result.message || 'Registration successful! Please check your email to verify your account before logging in.');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      setUser(null);
      setAccessToken(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if logout fails
      setUser(null);
      setAccessToken(null);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    try {
      // TODO: Implement user update API endpoint if needed
      if (user) {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated,
    isAdmin,
    accessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider };

// Protected Route component
interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { loading, isAuthenticated, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 mb-6">
            Please log in to access this page.
          </p>
          <a
            href="/login"
            className="btn-primary inline-block"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
          </p>
          <a
            href="/"
            className="btn-primary inline-block"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthContext;
