import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { getUserByClerkId, createOrUpdateUser } from '../services/firebaseService';
import { User } from '../types';

export const useUserRole = () => {
  const { user: clerkUser, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<'admin' | 'customer' | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      if (!isLoaded || !clerkUser) {
        setLoading(false);
        return;
      }

      try {
        // Check if user exists in Firebase
        let user = await getUserByClerkId(clerkUser.id);
        
        if (!user) {
          // Create new user with customer role by default
          await createOrUpdateUser(clerkUser, 'customer');
          user = await getUserByClerkId(clerkUser.id);
        } else {
          // Update user info from Clerk
          await createOrUpdateUser(clerkUser, user.role);
          user = await getUserByClerkId(clerkUser.id);
        }

        if (user) {
          setUserData(user);
          setUserRole(user.role);
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [clerkUser, isLoaded]);

  const isAdmin = userRole === 'admin';
  const isCustomer = userRole === 'customer';

  return {
    user: userData,
    userRole,
    isAdmin,
    isCustomer,
    loading,
    clerkUser
  };
};