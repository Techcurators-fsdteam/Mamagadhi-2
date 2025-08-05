'use client';

import { useState } from 'react';
import Image from 'next/image';

interface AdminLoginProps {
  onLogin: (adminKey: string) => void;
  authError: string;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, authError }) => {
  const [adminKey, setAdminKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(adminKey);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-auto flex justify-center">
            <Image
              src="/logo.png"
              alt="Mamagadhi Logo"
              width={100}
              height={70}
              className="h-12 w-auto"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Access Required
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your admin credentials to continue
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm">
            <div>
              <label htmlFor="admin-key" className="sr-only">
                Admin Key
              </label>
              <input
                id="admin-key"
                name="adminKey"
                type="password"
                required
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#4AAAFF] focus:border-[#4AAAFF] focus:z-10 sm:text-sm"
                placeholder="Admin Access Key"
              />
            </div>
          </div>

          {authError && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-md text-red-800 text-sm">
              {authError}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#4AAAFF] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4AAAFF]"
            >
              Sign in to Admin Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
