'use client';

import React, { useState } from 'react';
import { BookingWithDetails } from '../../types/admin';
import { DataTable } from './DataTable';
import { StatusBadge } from './AdminComponents';
import { updateBookingStatus } from '../../lib/admin-api';

interface BookingsTabProps {
  bookings: BookingWithDetails[];
  onRefresh: () => void;
}

export const BookingsTab: React.FC<BookingsTabProps> = ({ bookings, onRefresh }) => {
  const [loadingBookings, setLoadingBookings] = useState<Record<string, boolean>>({});

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    setLoadingBookings(prev => ({ ...prev, [bookingId]: true }));
    
    try {
      await updateBookingStatus(bookingId, newStatus);
      onRefresh(); // Refresh data to show updated status
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status');
    } finally {
      setLoadingBookings(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const columns = [
    {
      key: 'booking_id',
      label: 'Booking ID',
      render: (value: string) => (
        <span className="font-mono text-xs text-gray-600">{value.slice(0, 8)}...</span>
      )
    },
    {
      key: 'ride_info',
      label: 'Ride Info',
      render: (_: any, row: BookingWithDetails) => (
        <div className="space-y-1">
          {row.ride ? (
            <>
              <div className="font-medium text-sm">
                {row.ride.origin} → {row.ride.destination}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(row.ride.departure_time).toLocaleDateString()} - {row.ride.vehicle_type}
              </div>
            </>
          ) : (
            <span className="text-gray-400 text-sm">Ride not found</span>
          )}
        </div>
      )
    },
    {
      key: 'passenger',
      label: 'Passenger',
      render: (_: any, row: BookingWithDetails) => (
        <div>
          {row.passenger ? (
            <div>
              <div className="font-medium text-sm">{row.passenger.display_name}</div>
              <div className="text-xs text-gray-500">{row.passenger.email}</div>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">Passenger not found</span>
          )}
        </div>
      )
    },
    {
      key: 'seats_booked',
      label: 'Seats',
      render: (value: number) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      key: 'booking_status',
      label: 'Status',
      render: (value: string) => <StatusBadge status={value} type="booking" />
    },
    {
      key: 'request_message',
      label: 'Message',
      render: (value: string) => (
        <div className="max-w-xs">
          <div className="text-sm text-gray-700 truncate" title={value}>
            {value || 'No message'}
          </div>
        </div>
      )
    },
    {
      key: 'timestamps',
      label: 'Timestamps',
      render: (_: any, row: BookingWithDetails) => (
        <div className="space-y-1">
          <div className="text-xs">
            <strong>Created:</strong> {new Date(row.created_at).toLocaleDateString()}
          </div>
          {row.responded_at && (
            <div className="text-xs">
              <strong>Responded:</strong> {new Date(row.responded_at).toLocaleDateString()}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: BookingWithDetails) => (
        <div className="flex space-x-1">
          <button
            onClick={() => handleStatusUpdate(row.booking_id, 'confirmed')}
            disabled={loadingBookings[row.booking_id] || row.booking_status === 'confirmed'}
            className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
          <button
            onClick={() => handleStatusUpdate(row.booking_id, 'cancelled')}
            disabled={loadingBookings[row.booking_id] || row.booking_status === 'cancelled'}
            className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={() => handleStatusUpdate(row.booking_id, 'completed')}
            disabled={loadingBookings[row.booking_id] || row.booking_status === 'completed'}
            className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bookings Management</h2>
          <p className="text-gray-600">Total bookings: {bookings.length}</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Refresh
        </button>
      </div>
      
      <DataTable data={bookings} columns={columns} />
    </div>
  );
};
