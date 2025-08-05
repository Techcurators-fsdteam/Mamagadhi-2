import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "../lib/auth";
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from "../components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mamagadhi - Ride Sharing Platform",
  description: "Community-driven ride sharing platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            {children}
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
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
