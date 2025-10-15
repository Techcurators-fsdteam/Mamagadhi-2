"use client";

import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "../lib/auth";
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import AuthGuard from '../components/AuthGuard';
import LoginPopup from '../components/LoginPopup';
import SignupPopup from '../components/SignupPopup';

const inter = Inter({ subsets: ["latin"] });

// Note: Metadata export is not supported in client components
// This will need to be handled differently if SEO is important
// export const metadata: Metadata = {
//   title: "Mamagadhi - Ride Sharing Platform",
//   description: "Community-driven ride sharing platform",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showLoginFromGuard, setShowLoginFromGuard] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const handleLoginRequired = () => {
    setShowLoginFromGuard(true);
  };

  return (
    <html lang="en">
      <head>
        <title>Mamaghadi - Ride Sharing Platform</title>
        <meta name="description" content="Community-driven ride sharing platform" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <AuthGuard onLoginRequired={handleLoginRequired}>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  },
                  success: {
                    style: {
                      background: '#10B981',
                    },
                  },
                  error: {
                    style: {
                      background: '#EF4444',
                    },
                  },
                }}
              />
              {children}
          </AuthGuard>
            
          {/* Global Login/Signup Popups */}
          <LoginPopup
            isOpen={showLoginFromGuard}
            onClose={() => setShowLoginFromGuard(false)}
            onSwitchToSignup={() => {
              setShowLoginFromGuard(false);
              setShowSignup(true);
            }}
          />
          
          <SignupPopup
            isOpen={showSignup}
            onClose={() => setShowSignup(false)}
            onSwitchToLogin={() => {
              setShowSignup(false);
              setShowLoginFromGuard(true);
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
