'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserProfile, UserProfile, updateUserProfile } from './supabase';
import { ProfileProvider } from './profile-context';
import AnimatedLoader from '../components/AnimatedLoader';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
  updateUserProfile: () => {},
  refreshUserProfile: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      // Firebase not available (during build or missing config)
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: User | null) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
          if (profile && profile.is_email_verified !== firebaseUser.emailVerified) {
            try {
              await updateUserProfile(firebaseUser.uid, {
                is_email_verified: firebaseUser.emailVerified
              });
              setUserProfile(prev => prev ? {
                ...prev,
                is_email_verified: firebaseUser.emailVerified
              } : null);
            } catch {} // error unused
          }
        } catch (error) {
          if (error && typeof error === 'object' && 'code' in error) {
            if ((error as { code: string }).code === 'PGRST116') {
              setUserProfile(null);
            }
          }
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signOut = async () => {
    if (auth) {
      await auth.signOut();
    }
    setUser(null);
    setUserProfile(null);
    if (typeof window !== 'undefined') {
      const protectedRoutes = ['/publish', '/book', '/profile'];
      if (protectedRoutes.some(route => window.location.pathname.startsWith(route))) {
        window.location.replace('/');
      }
    }
  };

  // Function to update userProfile state globally
  const updateUserProfileState = (updates: Partial<UserProfile>) => {
    setUserProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  // Function to refresh userProfile from database
  const refreshUserProfile = async () => {
    if (user) {
      try {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error refreshing user profile:', error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      signOut, 
      updateUserProfile: updateUserProfileState,
      refreshUserProfile 
    }}>
      <ProfileProvider user={user}>
        {loading ? <AnimatedLoader /> : children}
      </ProfileProvider>
    </AuthContext.Provider>
  );
};


