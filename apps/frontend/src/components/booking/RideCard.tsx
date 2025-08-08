'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin, Clock, Users, Car, Star, Calendar, Phone, Route } from 'lucide-react';
import { formatTimeIST, formatDateForCard } from '../../lib/timezone-utils';

interface Driver {
  user_id: string;
  display_name: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string | null;
  phone_number?: string;
  rating?: number;
  total_rides?: number;
}

interface Vehicle {
  type: string;
  number?: string;
  model?: string;
  color?: string;
}

interface Ride {
  ride_id: string;
  vehicle_type: string;
  origin: string;
  destination: string;
  origin_state: string;
  destination_state: string;
  departure_time: string;
  arrival_time: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  status: string;
  distances?: {
    origin_km: number;
    destination_km: number;
    total_km: number;
  } | null;
  driver: Driver;
  vehicle?: Vehicle;
}

interface RideCardProps {
  ride: Ride;
  onClick: (ride: Ride) => void;
  onBook: (ride: Ride) => void;
}

export default function RideCard({ ride, onClick, onBook }: RideCardProps) {
  const formatTime = (dateTime: string) => {
    return formatTimeIST(dateTime);
  };

  const formatDate = (dateTime: string) => {
    return formatDateForCard(dateTime);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click when clicking the book button
    if ((e.target as HTMLElement).closest('.book-button')) {
      return;
    }
    onClick(ride);
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBook(ride);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-blue-300"
    >
      {/* Header - Driver Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {ride.driver.profile_picture_url ? (
            <Image
              src={ride.driver.profile_picture_url}
              alt={ride.driver.display_name}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {ride.driver.display_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{ride.driver.display_name}</h3>
            {ride.driver.rating && (
              <div className="flex items-center space-x-1">
                {renderStars(ride.driver.rating)}
                <span className="text-xs text-gray-600 ml-1">
                  ({ride.driver.rating}) • {ride.driver.total_rides || 0} rides
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">₹{ride.price_per_seat}</p>
          <p className="text-sm text-gray-600">per seat</p>
        </div>
      </div>

      {/* Route Information */}
      <div className="mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="w-4 h-4 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">{ride.origin}</p>
                <p className="text-sm text-gray-600">{ride.origin_state}</p>
                {ride.distances && (
                  <p className="text-xs text-blue-600">{ride.distances.origin_km}km away</p>
                )}
              </div>
            </div>
            <div className="border-l-2 border-dashed border-gray-300 ml-2 h-4"></div>
            <div className="flex items-center space-x-2 mt-2">
              <MapPin className="w-4 h-4 text-red-600" />
              <div>
                <p className="font-medium text-gray-900">{ride.destination}</p>
                <p className="text-sm text-gray-600">{ride.destination_state}</p>
                {ride.distances && (
                  <p className="text-xs text-blue-600">{ride.distances.destination_km}km away</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time and Vehicle Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Departure</span>
          </div>
          <p className="text-sm text-gray-600">{formatDate(ride.departure_time)}</p>
          <p className="text-lg font-bold text-green-600">{formatTime(ride.departure_time)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Car className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Vehicle</span>
          </div>
          <p className="text-sm capitalize text-gray-900">{ride.vehicle?.type || ride.vehicle_type}</p>
          {ride.vehicle?.number && (
            <p className="text-xs text-gray-600">{ride.vehicle.number}</p>
          )}
        </div>
      </div>

      {/* Seats and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">
              {ride.seats_available}/{ride.seats_total} seats available
            </span>
          </div>
          {ride.driver.phone_number && (
            <div className="flex items-center space-x-1">
              <Phone className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">Available</span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(ride);
            }}
            className="px-4 py-2 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            View Details
          </button>
          <button
            onClick={handleBookClick}
            className="book-button px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Book Now
          </button>
        </div>
      </div>

      {/* Distance Badge */}
      {ride.distances && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-center">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              <Route className="w-3 h-3 inline mr-1" />
              Total deviation: {ride.distances.total_km}km
            </span>
          </div>
        </div>
      )}

      {/* Click to view more indicator */}
      <div className="mt-3 pt-3 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-500">Click for more details</p>
      </div>
    </div>
  );
}
