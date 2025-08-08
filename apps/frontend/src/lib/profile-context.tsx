'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserProfile, UserProfile } from './supabase';
import AnimatedLoader from '../components/AnimatedLoader';

interface ProfileContextType {
  userProfile: UserProfile | null;
  updateProfile: (updates: Partial<UserProfile>) => void;
  refreshProfile: () => Promise<void>;
  setProfileUrl: (url: string) => void;
}

const ProfileContext = createContext<ProfileContextType>({
  userProfile: null,
  updateProfile: () => {},
  refreshProfile: async () => {},
  setProfileUrl: () => {},
});

export const useProfile = () => {
  try {
    return useContext(ProfileContext);
  } catch (error) {
    // During build time or when context is not available, return default values
    return {
      userProfile: null,
      updateProfile: () => {},
      refreshProfile: async () => {},
      profileUrl: null,
      setProfileUrl: () => {},
    };
  }
};

export const ProfileProvider = ({ children, user }: { children: ReactNode; user: User | null }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Fetch profile when user changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
    };
    fetchProfile();
  }, [user]);

  // Update profile locally (for immediate UI updates)
  const updateProfile = (updates: Partial<UserProfile>) => {
    setUserProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  // Refresh profile from database
  const refreshProfile = async () => {
    if (user) {
      try {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } catch (error) {
        // Handle the case where profile is deleted or doesn't exist
        console.error('Error refreshing profile:', error);
        setUserProfile(null);
      }
    }
  };

  // Update profile URL specifically
  const setProfileUrl = (url: string) => {
    setUserProfile(prev => prev ? { ...prev, profile_url: url } : null);
  };

  return (
    <ProfileContext.Provider value={{ 
      userProfile, 
      updateProfile, 
      refreshProfile,
      setProfileUrl 
    }}>
      {children}
    </ProfileContext.Provider>
  );
};
