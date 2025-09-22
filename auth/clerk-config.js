// Clerk Authentication Configuration for Lashed By Anna
import { ClerkProvider, SignIn, SignUp, UserButton, useUser, useAuth } from '@clerk/clerk-react';

// Clerk Publishable Key (replace with your actual key)
const CLERK_PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || "pk_test_your-publishable-key-here";

// Custom Clerk theme matching website design
const clerkTheme = {
    layout: {
        socialButtonsPlacement: 'bottom',
        socialButtonsVariant: 'iconButton',
        shimmer: true,
    },
    variables: {
        colorPrimary: '#8B7355',
        colorBackground: '#FFFFFF',
        colorInputBackground: '#F7F5F3',
        colorInputText: '#2C2C2C',
        colorText: '#2C2C2C',
        colorTextSecondary: '#6B6B6B',
        colorSuccess: '#8B7355',
        colorDanger: '#DC2626',
        colorWarning: '#D97706',
        colorNeutral: '#9B9B9B',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontFamilyButtons: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        fontWeight: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
        },
        borderRadius: '12px',
        spacingUnit: '1rem',
    },
    elements: {
        formButtonPrimary: {
            backgroundColor: '#8B7355',
            borderColor: '#8B7355',
            color: '#FFFFFF',
            '&:hover': {
                backgroundColor: '#C4A484',
                borderColor: '#C4A484',
            },
        },
        card: {
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(139, 115, 85, 0.12)',
        },
        headerTitle: {
            color: '#2C2C2C',
            fontFamily: 'Playfair Display, serif',
            fontSize: '1.5rem',
            fontWeight: '400',
        },
        headerSubtitle: {
            color: '#6B6B6B',
        },
        socialButtonsIconButton: {
            borderColor: '#E8E8E8',
            '&:hover': {
                backgroundColor: '#F7F5F3',
                borderColor: '#8B7355',
            },
        },
        formFieldInput: {
            borderColor: '#E8E8E8',
            '&:focus': {
                borderColor: '#8B7355',
                boxShadow: '0 0 0 3px rgba(139, 115, 85, 0.1)',
            },
        },
        footerActionLink: {
            color: '#8B7355',
            '&:hover': {
                color: '#C4A484',
            },
        },
    },
};

// Authentication Context Provider
export const AuthProvider = ({ children }) => {
    return (
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
            {children}
        </ClerkProvider>
    );
};

// Custom Sign In Component
export const CustomSignIn = () => {
    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Welcome Back</h2>
                    <p>Sign in to manage your lash appointments</p>
                </div>
                <SignIn 
                    appearance={{ 
                        theme: clerkTheme,
                        elements: {
                            rootBox: 'auth-root',
                            card: 'auth-form-card',
                        }
                    }}
                    routing="path"
                    path="/admin/sign-in"
                    redirectUrl="/admin/dashboard"
                    signUpUrl="/admin/sign-up"
                />
            </div>
        </div>
    );
};

// Custom Sign Up Component
export const CustomSignUp = () => {
    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Create Account</h2>
                    <p>Join Lashed By Anna as an esthetician</p>
                </div>
                <SignUp 
                    appearance={{ 
                        theme: clerkTheme,
                        elements: {
                            rootBox: 'auth-root',
                            card: 'auth-form-card',
                        }
                    }}
                    routing="path"
                    path="/admin/sign-up"
                    redirectUrl="/admin/dashboard"
                    signInUrl="/admin/sign-in"
                />
            </div>
        </div>
    );
};

// Protected Route Component
export const ProtectedRoute = ({ children, fallback = null }) => {
    const { isLoaded, isSignedIn } = useAuth();
    
    if (!isLoaded) {
        return (
            <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }
    
    if (!isSignedIn) {
        return fallback || <CustomSignIn />;
    }
    
    return children;
};

// User Profile Component
export const UserProfile = () => {
    const { user } = useUser();
    
    if (!user) {
        return null;
    }
    
    return (
        <div className="user-profile">
            <UserButton 
                appearance={{
                    theme: clerkTheme,
                    elements: {
                        avatarBox: 'user-avatar',
                        userButtonPopoverCard: 'user-popover',
                    }
                }}
                showName={true}
                afterSignOutUrl="/"
            />
        </div>
    );
};

// Role-based access control hook
export const useRole = () => {
    const { user } = useUser();
    
    const isEsthetician = user?.publicMetadata?.role === 'esthetician' || 
                         user?.publicMetadata?.role === 'admin';
    
    const isAdmin = user?.publicMetadata?.role === 'admin';
    
    return {
        isEsthetician,
        isAdmin,
        role: user?.publicMetadata?.role || 'client'
    };
};

// Webhook handler types for Clerk events
export const ClerkWebhookEvents = {
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted',
    SESSION_CREATED: 'session.created',
    SESSION_ENDED: 'session.ended',
};

// Helper function to sync user data with Firebase
export const syncUserWithFirebase = async (clerkUser) => {
    try {
        const { db } = await import('../firebase-config.js');
        const { doc, setDoc, getDoc } = await import('firebase/firestore');
        
        // Check if user already exists in Firebase
        const userRef = doc(db, 'users', clerkUser.id);
        const userSnap = await getDoc(userRef);
        
        const userData = {
            id: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            role: clerkUser.publicMetadata?.role || 'client',
            phone: clerkUser.phoneNumbers[0]?.phoneNumber,
            profileImageUrl: clerkUser.profileImageUrl,
            lastActiveAt: new Date(),
            updatedAt: new Date(),
        };
        
        if (!userSnap.exists()) {
            // New user, add createdAt
            userData.createdAt = new Date();
        }
        
        await setDoc(userRef, userData, { merge: true });
        
        console.log('✅ User synced with Firebase:', clerkUser.id);
        return userData;
        
    } catch (error) {
        console.error('❌ Error syncing user with Firebase:', error);
        throw error;
    }
};

// Auth utilities
export const AuthUtils = {
    // Get current user's Firebase document
    async getCurrentUserData() {
        const { user } = useUser();
        if (!user) return null;
        
        try {
            const { db } = await import('../firebase-config.js');
            const { doc, getDoc } = await import('firebase/firestore');
            
            const userRef = doc(db, 'users', user.id);
            const userSnap = await getDoc(userRef);
            
            return userSnap.exists() ? userSnap.data() : null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    },
    
    // Check if user has specific role
    hasRole(requiredRole) {
        const { role } = useRole();
        return role === requiredRole || role === 'admin';
    },
    
    // Get user's display name
    getDisplayName(user) {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        return user?.emailAddresses?.[0]?.emailAddress || 'User';
    }
};

export default {
    AuthProvider,
    CustomSignIn,
    CustomSignUp,
    ProtectedRoute,
    UserProfile,
    useRole,
    syncUserWithFirebase,
    AuthUtils
};