'use client';

import { useState } from 'react';
import Image from 'next/image';

interface AdminLoginProps {
  onLogin: (adminId: string, adminPassword: string) => void;
  authError: string;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, authError }) => {
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(adminId, adminPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-auto flex justify-center">
            <Image
              src="/logo.png"
              alt="Mamagadhi Logo"
              width={48}
              height={48}
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
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="admin-id" className="sr-only">
                Admin ID
              </label>
              <input
                id="admin-id"
                name="adminId"
                type="text"
                required
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-[#4AAAFF] focus:border-[#4AAAFF] focus:z-10 sm:text-sm"
                placeholder="Admin ID"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="sr-only">
                Password
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-[#4AAAFF] focus:border-[#4AAAFF] focus:z-10 sm:text-sm"
                placeholder="Password"
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
