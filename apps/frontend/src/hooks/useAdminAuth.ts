'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { useRouter } from 'next/navigation';

export const useAdminAuth = () => {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Redirect to home if not authenticated
      router.replace('/');
      setAuthLoading(false);
      return;
    }

    if (!userProfile) {
      // Still loading user profile
      return;
    }

    const adminStatus = userProfile.role === 'admin';
    setIsAdmin(adminStatus);
    
    if (!adminStatus) {
      // Redirect to home if not admin
      router.replace('/');
    }
    
    setAuthLoading(false);
  }, [user, userProfile, loading, router]);

  return {
    isAdmin,
    user,
    userProfile,
    loading: loading || authLoading
  };
};
