// Temporary admin setup utility
// Run this once to set up your first admin account

import { updateUserRole } from '../services/firebaseService';

export const setupFirstAdmin = async (clerkUserId: string) => {
  try {
    await updateUserRole(clerkUserId, 'admin');
    console.log('✅ Admin role set successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error setting admin role:', error);
    return false;
  }
};

// You can call this function from the browser console:
// 1. Sign up first at /booking
// 2. Open browser console (F12)
// 3. Find your Clerk user ID (it's in the URL or network tab)
// 4. Run: setupFirstAdmin('your-clerk-user-id-here')

(window as any).setupFirstAdmin = setupFirstAdmin;