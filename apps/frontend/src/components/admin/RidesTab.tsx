'use client';

import React from 'react';
import { RideWithDriver } from '../../types/admin';
import { DataTable } from './DataTable';
import { StatusBadge } from './AdminComponents';
import { formatDateTimeIST, formatDateIST, formatTimeIST } from '../../lib/timezone-utils';

interface RidesTabProps {
  rides: RideWithDriver[];
  onRefresh: () => void;
}

export const RidesTab: React.FC<RidesTabProps> = ({ rides, onRefresh }) => {
  const columns = [
    {
      key: 'ride_id',
      label: 'Ride ID',
      render: (value: string) => (
        <span className="font-mono text-xs text-gray-600">{value.slice(0, 8)}...</span>
      )
    },
    {
      key: 'route',
      label: 'Route',
      filterable: true,
      render: (_: any, row: RideWithDriver) => (
        <div className="space-y-1">
          <div className="font-medium text-sm">
            {row.origin} → {row.destination}
          </div>
          <div className="text-xs text-gray-500">
            {row.origin_state} → {row.destination_state}
          </div>
        </div>
      )
    },
    {
      key: 'driver_name',
      label: 'Driver',
      filterable: true,
      render: (_: any, row: RideWithDriver) => (
        <div>
          {row.driver ? (
            <div>
              <div className="font-medium text-sm">{row.driver.display_name}</div>
              <div className="text-xs text-gray-500">{row.driver.email}</div>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">No driver assigned</span>
          )}
        </div>
      )
    },
    {
      key: 'vehicle_type',
      label: 'Vehicle',
      filterable: true,
      filterOptions: ['sedan', 'suv', 'hatchback', 'bus', 'tempo traveller'],
      render: (value: string) => (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">{value}</span>
      )
    },
    {
      key: 'schedule',
      label: 'Schedule',
      render: (_: any, row: RideWithDriver) => (
        <div className="space-y-1">
          <div className="text-sm">
            <strong>Dep:</strong> {formatDateIST(new Date(row.departure_time))} {formatTimeIST(new Date(row.departure_time))}
          </div>
          {row.arrival_time && (
            <div className="text-sm">
              <strong>Arr:</strong> {formatDateIST(new Date(row.arrival_time))} {formatTimeIST(new Date(row.arrival_time))}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'seats',
      label: 'Seats',
      render: (_: any, row: RideWithDriver) => (
        <div className="text-sm">
          <div><strong>Available:</strong> {row.seats_available}</div>
          <div><strong>Total:</strong> {row.seats_total}</div>
        </div>
      )
    },
    {
      key: 'price_per_seat',
      label: 'Price',
      render: (value: number) => (
        <span className="font-medium">₹{value}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      filterable: true,
      filterOptions: ['active', 'cancelled', 'completed', 'pending'],
      render: (value: string) => <StatusBadge status={value} type="ride" />
    },
    {
      key: 'stops',
      label: 'Stops',
      render: (_: any, row: RideWithDriver) => (
        <div className="max-w-xs">
          {row.stops && row.stops.length > 0 ? (
            <div className="space-y-1">
              {row.stops.slice(0, 3).map((stop, index) => (
                <div key={stop.stop_id} className="text-xs text-gray-600">
                  {index + 1}. {stop.landmark}
                </div>
              ))}
              {row.stops.length > 3 && (
                <div className="text-xs text-gray-400">
                  +{row.stops.length - 3} more stops
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-400 text-xs">No stops</span>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (value: string) => (
        <span className="text-sm text-gray-600">
          {formatDateIST(new Date(value))}
        </span>
      )
    }
  ];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rides Management</h2>
          <p className="text-gray-600">Total rides: {rides.length}</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-[#4AAAFF] text-white rounded-lg hover:bg-[#3A9AEF] focus:outline-none focus:ring-2 focus:ring-[#4AAAFF] transition-colors"
        >
          Refresh
        </button>
      </div>
      
      <DataTable data={rides} columns={columns} />
    </div>
  );
};
