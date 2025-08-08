'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useSupabaseAuth } from '../../lib/supabase-auth';

interface SupabaseAdminLoginProps {
  onLoginSuccess?: () => void;
}

export const SupabaseAdminLogin: React.FC<SupabaseAdminLoginProps> = ({ onLoginSuccess }) => {
  const { signIn, loading, error } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('Please enter both email and password');
      return;
    }

    try {
      await signIn(email, password);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: any) {
      setLocalError(err.message || 'Login failed');
    }
  };

  return (
    <div className="max-w-xl w-full p-12">
      <div className="text-center mb-6">
      <div className="inline-flex items-center justify-center p-2">
              <Image
                src="/logo.png"
                alt="Mamagadhi Logo"
                width={180}
                height={60}
                className="object-contain"
              />
            </div>
        <h1 className="text-lg md:mt-4 mt-4font-bold text-gray-900 mb-2">
          Admin Portal
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your email"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your password"
            required
            disabled={loading}
          />
        </div>

        {(error || localError) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error || localError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#4aaaff] text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Signing In...
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      
    </div>
  );
};