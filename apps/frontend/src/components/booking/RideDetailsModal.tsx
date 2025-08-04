'use client';

import React from 'react';
import Image from 'next/image';
import { X, MapPin, Clock, Users, Car, Phone, Star, Calendar, Route } from 'lucide-react';

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
  pickup_points?: string[];
  drop_points?: string[];
  amenities?: string[];
  driver_notes?: string;
  total_distance?: number;
  estimated_duration?: string;
  distances?: {
    origin_km: number;
    destination_km: number;
    total_km: number;
  } | null;
  driver: Driver;
  vehicle?: Vehicle;
}

interface RideDetailsModalProps {
  ride: Ride | null;
  isOpen: boolean;
  onClose: () => void;
  onBook: (ride: Ride) => void;
}

export default function RideDetailsModal({ ride, isOpen, onClose, onBook }: RideDetailsModalProps) {
  if (!isOpen || !ride) return null;

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Ride Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Driver Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Driver Information
            </h3>
            <div className="flex items-center space-x-4">
              {ride.driver.profile_picture_url ? (
                <Image
                  src={ride.driver.profile_picture_url}
                  alt={ride.driver.display_name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                  {ride.driver.display_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h4 className="text-lg font-medium">{ride.driver.display_name}</h4>
                {ride.driver.rating && (
                  <div className="flex items-center space-x-1 mt-1">
                    {renderStars(ride.driver.rating)}
                    <span className="text-sm text-gray-600 ml-2">
                      ({ride.driver.rating}/5) • {ride.driver.total_rides || 0} rides
                    </span>
                  </div>
                )}
                {ride.driver.phone_number && (
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <Phone className="w-4 h-4 mr-1" />
                    {ride.driver.phone_number}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Route Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Route className="w-5 h-5 mr-2" />
              Route Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <p className="font-medium">From: {ride.origin}</p>
                  <p className="text-sm text-gray-600">{ride.origin_state}</p>
                  {ride.distances && (
                    <p className="text-xs text-blue-600">
                      {ride.distances.origin_km}km from your location
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-red-600 mt-1" />
                <div>
                  <p className="font-medium">To: {ride.destination}</p>
                  <p className="text-sm text-gray-600">{ride.destination_state}</p>
                  {ride.distances && (
                    <p className="text-xs text-blue-600">
                      {ride.distances.destination_km}km from your destination
                    </p>
                  )}
                </div>
              </div>
              {ride.total_distance && (
                <p className="text-sm text-gray-600">
                  Total Distance: {ride.total_distance}km
                </p>
              )}
            </div>
          </div>

          {/* Time & Date */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Schedule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Departure</p>
                <p className="font-medium">{formatDate(ride.departure_time)}</p>
                <p className="text-lg font-bold text-green-600">
                  {formatTime(ride.departure_time)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Arrival</p>
                <p className="font-medium">{formatDate(ride.arrival_time)}</p>
                <p className="text-lg font-bold text-red-600">
                  {formatTime(ride.arrival_time)}
                </p>
              </div>
            </div>
            {ride.estimated_duration && (
              <p className="text-sm text-gray-600 mt-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Duration: {ride.estimated_duration}
              </p>
            )}
          </div>

          {/* Vehicle Information */}
          {ride.vehicle && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Car className="w-5 h-5 mr-2" />
                Vehicle Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium capitalize">{ride.vehicle.type}</p>
                </div>
                {ride.vehicle.number && (
                  <div>
                    <p className="text-sm text-gray-600">Number</p>
                    <p className="font-medium">{ride.vehicle.number}</p>
                  </div>
                )}
                {ride.vehicle.model && (
                  <div>
                    <p className="text-sm text-gray-600">Model</p>
                    <p className="font-medium">{ride.vehicle.model}</p>
                  </div>
                )}
                {ride.vehicle.color && (
                  <div>
                    <p className="text-sm text-gray-600">Color</p>
                    <p className="font-medium capitalize">{ride.vehicle.color}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Seats & Price */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Availability & Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Available Seats</p>
                <p className="text-2xl font-bold text-green-600">
                  {ride.seats_available}/{ride.seats_total}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Price per Seat</p>
                <p className="text-2xl font-bold text-blue-600">₹{ride.price_per_seat}</p>
              </div>
            </div>
          </div>

          {/* Pickup/Drop Points */}
          {(ride.pickup_points?.length || ride.drop_points?.length) && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Pickup & Drop Points</h3>
              {ride.pickup_points?.length && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700">Pickup Points:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                    {ride.pickup_points.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              {ride.drop_points?.length && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Drop Points:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                    {ride.drop_points.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Amenities */}
          {ride.amenities?.length && (
            <div className="bg-indigo-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {ride.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Driver Notes */}
          {ride.driver_notes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Driver Notes</h3>
              <p className="text-gray-700">{ride.driver_notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onBook(ride)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Book This Ride
          </button>
        </div>
      </div>
    </div>
  );
}
