'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth';
import AnimatedLoader from './AnimatedLoader';

interface AuthGuardProps {
  children: React.ReactNode;
  onLoginRequired?: () => void;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, onLoginRequired }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  // Define protected routes
  const protectedRoutes = [
    '/book',
    '/publish',
    '/rides',
    '/profile',
    '/admin'
  ];

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname?.startsWith(route)
  );

  useEffect(() => {
    if (loading) return;

    setIsChecking(false);

    // If it's a protected route and user is not authenticated
    if (isProtectedRoute && !user) {
      // Redirect to home page
      router.replace('/');
      
      // Trigger login popup after a short delay
      setTimeout(() => {
        if (onLoginRequired) {
          onLoginRequired();
        }
      }, 100);
    }
  }, [user, loading, isProtectedRoute, router, onLoginRequired]);

  // Show loading while checking authentication
  if (loading || isChecking) {
    return <AnimatedLoader />;
  }

  // If it's a protected route and user is not authenticated, show loading
  // (while redirecting to home page)
  if (isProtectedRoute && !user) {
    return <AnimatedLoader />;
  }

  // Render children for authenticated users or public routes
  return <>{children}</>;
};

export default AuthGuard;
