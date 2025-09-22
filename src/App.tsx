import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';

// Components
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import BookingPage from './pages/BookingPage';
import ManageBookingPage from './pages/ManageBookingPage';
import PaymentOptionsPage from './pages/PaymentOptionsPage';
import ProtectedRoute from './components/ProtectedRoute';

// Initialize Clerk
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key');
}

// Initialize React Query
const queryClient = new QueryClient();

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey!} afterSignOutUrl="/">
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/payment-options" element={<PaymentOptionsPage />} />
              <Route 
                path="/booking" 
                element={
                  <ProtectedRoute requiredRole="customer">
                    <BookingPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/manage" 
                element={
                  <ProtectedRoute requiredRole="customer">
                    <ManageBookingPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminPage />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
        </Router>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;