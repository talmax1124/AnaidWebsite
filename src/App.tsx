import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';

// Components
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import ProductsPage from './pages/ProductsPage';
import ServicesPage from './pages/ServicesPage';
import BookingPage from './pages/BookingPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ProductPreview from './pages/ProductPreview';
import ServicePreview from './pages/ServicePreview';
import CategoryPreview from './pages/CategoryPreview';
import AddOnPreview from './pages/AddOnPreview';
import ProfilePage from './pages/ProfilePage';
import OrderStatusPage from './pages/OrderStatusPage';
import WishlistPage from './pages/WishlistPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// Initialize React Query
const queryClient = new QueryClient();

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:slug" element={<ProductPreview />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/services/:slug" element={<ServicePreview />} />
                <Route path="/booking" element={<BookingPage />} />
                <Route path="/booking/:serviceId" element={<BookingPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                {/* Preview Routes */}
                <Route path="/preview/products/:documentId" element={<ProductPreview />} />
                <Route path="/preview/services/:documentId" element={<ServicePreview />} />
                <Route path="/preview/categories/:documentId" element={<CategoryPreview />} />
                <Route path="/preview/add-ons/:documentId" element={<AddOnPreview />} />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute requiredRole="customer">
                      <ProfilePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/orders/:orderId" 
                  element={
                    <ProtectedRoute requiredRole="customer">
                      <OrderStatusPage />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </div>
          </Router>
        </CartProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
