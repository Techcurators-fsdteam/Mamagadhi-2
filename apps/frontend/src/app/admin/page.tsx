'use client';

import React, { useState, useEffect } from 'react';
import { SupabaseAuthProvider, useSupabaseAuth } from '../../lib/supabase-auth';
import { AdminDashboard } from '../../components/admin/AdminDashboard';
import { LoadingSpinner } from '../../components/admin/AdminComponents';
import { SupabaseAdminLogin } from '../../components/admin/SupabaseAdminLogin';
import { checkAdminAccess } from '../../lib/admin-api';

function AdminPageContent() {
  const { user, signOut, loading } = useSupabaseAuth();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Check if user is admin when user changes
  useEffect(() => {
    const checkAdmin = async () => {
      if (user && isAdmin === null) {
        setIsCheckingAdmin(true);
        console.log('Checking admin access for Supabase user:', user.email);
        try {
          const adminStatus = await checkAdminAccess();
          console.log('Admin check result:', adminStatus);
          setIsAdmin(adminStatus);
          
          // Set user profile for display
          setUserProfile({ email: user.email, id: user.id });
        } catch (error) {
          console.error('Error checking admin access:', error);
          setIsAdmin(false);
        } finally {
          setIsCheckingAdmin(false);
        }
      } else if (!user) {
        setIsAdmin(null);
        setUserProfile(null);
      }
    };

    checkAdmin();
  }, [user, isAdmin]);

  // Show loading while checking authentication
  if (loading || isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-lg text-gray-600">
            {loading ? 'Loading...' : 'Checking admin access...'}
          </p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show Supabase login form
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <SupabaseAdminLogin />
      </div>
    );
  }

  // If user is authenticated but not admin (this shouldn't happen with Supabase-only auth)
  if (user && isAdmin === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Error
          </h1>
          <div className="text-left bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Current User:</strong> {user.email}
            </p>
            <p className="text-sm text-red-600">
              <strong>Issue:</strong> Authentication check failed
            </p>
          </div>
          <div className="space-y-3">
            <button 
              onClick={signOut}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
            >
              Sign Out & Try Again
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated and is admin, show dashboard
  if (user && isAdmin === true) {
    return <AdminDashboard onSignOut={signOut} />;
  }

  // Fallback loading state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-lg text-gray-600">Loading admin panel...</p>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <SupabaseAuthProvider>
      <AdminPageContent />
    </SupabaseAuthProvider>
  );
}
