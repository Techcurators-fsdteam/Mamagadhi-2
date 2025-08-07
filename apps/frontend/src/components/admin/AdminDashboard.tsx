'use client';

import React, { useState, useEffect } from 'react';
import { AdminData } from '../../types/admin';
import { fetchAdminData, subscribeToAdminUpdates } from '../../lib/admin-api';
import { LoadingSpinner } from './AdminComponents';
import { UsersTab } from './UsersTab';
import { RidesTab } from './RidesTab';
import { BookingsTab } from './BookingsTab';

type TabType = 'users' | 'rides' | 'bookings';

interface AdminDashboardProps {
  onSignOut: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSignOut }) => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const adminData = await fetchAdminData();
      setData(adminData);
    } catch (err) {
      console.error('Error loading admin data:', err);
      setError('Failed to load admin data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Set up real-time subscriptions
    const unsubscribe = subscribeToAdminUpdates(
      (payload) => {
        // Handle user profile updates
        console.log('User profile updated:', payload);
        loadData(); // Refresh all data for simplicity
      },
      (payload) => {
        // Handle ride updates
        console.log('Ride updated:', payload);
        loadData();
      },
      (payload) => {
        // Handle booking updates
        console.log('Booking updated:', payload);
        loadData();
      },
      (payload) => {
        // Handle driver profile updates
        console.log('Driver profile updated:', payload);
        loadData();
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const tabs = [
    { id: 'users', label: 'Users', count: data?.users.length || 0 },
    { id: 'rides', label: 'Rides', count: data?.rides.length || 0 },
    { id: 'bookings', label: 'Bookings', count: data?.bookings.length || 0 }
  ];

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-lg text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={loadData}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Try Again
            </button>
            <button
              onClick={onSignOut}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              {loading && (
                <div className="ml-4">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Refresh All
              </button>
              <button
                onClick={onSignOut}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {data && (
          <>
            {activeTab === 'users' && (
              <UsersTab users={data.users} onRefresh={loadData} />
            )}
            {activeTab === 'rides' && (
              <RidesTab rides={data.rides} onRefresh={loadData} />
            )}
            {activeTab === 'bookings' && (
              <BookingsTab bookings={data.bookings} onRefresh={loadData} />
            )}
          </>
        )}
      </div>
    </div>
  );
};
