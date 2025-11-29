import { useAuth } from '../contexts/AuthContext';

export const useUserRole = () => {
  const { user, loading, isAdmin } = useAuth();

  const isCustomer = user?.role === 'customer';

  return {
    user,
    userRole: user?.role || null,
    isAdmin,
    isCustomer,
    loading
  };
};