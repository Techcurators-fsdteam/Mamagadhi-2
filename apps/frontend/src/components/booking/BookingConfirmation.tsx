import React, { useState } from 'react';
import { Button } from '../ui/button';
import { X, User, MessageSquare, Star, Car, MapPin } from 'lucide-react';

interface BookingConfirmationProps {
  ride: any;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bookingData: any) => void;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  ride,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [passengers, setPassengers] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirmBooking = async () => {
    setLoading(true);
    
    const bookingData = {
      rideId: ride.ride_id,
      seatsRequested: passengers,
      requestMessage: message,
      totalPrice: ride.price_per_seat * passengers
    };

    try {
      await onConfirm(bookingData);
    } catch (error) {
      console.error('Booking error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateEstimatedArrival = () => {
    if (!ride.departure_time || !ride.arrival_time) return null;
    
    const departureDate = new Date(ride.departure_time);
    const arrivalTime = new Date(ride.arrival_time);
    
    // Calculate duration in hours
    const durationHours = (arrivalTime.getTime() - departureDate.getTime()) / (1000 * 60 * 60);
    
    // Create estimated arrival date by adding duration to departure date
    const estimatedArrival = new Date(departureDate.getTime() + (durationHours * 60 * 60 * 1000));
    
    return {
      time: estimatedArrival.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      date: estimatedArrival.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      duration: `${Math.floor(durationHours)}h ${Math.round((durationHours % 1) * 60)}m`
    };
  };

  const estimatedArrival = calculateEstimatedArrival();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Confirm Booking</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ride Details */}
        <div className="p-8 space-y-6">
          {/* Route */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{formatTime(ride.departure_time)}</div>
                <div className="text-sm font-medium text-gray-700">{ride.origin_state}</div>
                <div className="text-xs text-gray-500 mt-1">{formatDate(ride.departure_time)}</div>
              </div>
              
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="w-20 h-px bg-gray-300"></div>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
                {estimatedArrival && (
                  <div className="text-xs text-gray-600 font-medium bg-white px-2 py-1 rounded-full">
                    {estimatedArrival.duration}
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">
                  {estimatedArrival ? estimatedArrival.time : formatTime(ride.arrival_time)}
                </div>
                <div className="text-sm font-medium text-gray-700">{ride.destination_state}</div>
                {estimatedArrival && (
                  <div className="text-xs text-gray-500 mt-1">{estimatedArrival.date}</div>
                )}
              </div>
            </div>
            
            <div className="text-sm text-gray-600 text-center bg-white bg-opacity-60 py-2 px-4 rounded-lg">
              <div className="flex items-center justify-center space-x-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="font-medium">{ride.origin}</span>
                <span className="text-gray-400">→</span>
                <span className="font-medium">{ride.destination}</span>
                <MapPin className="w-4 h-4 text-red-600" />
              </div>
            </div>
          </div>

          {/* Driver Info */}
                    {/* Driver Info */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Driver Information
            </h3>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {ride.driver_name?.[0] || 'D'}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{ride.driver_name || 'Driver'}</div>
                <div className="text-sm text-gray-600 flex items-center mt-1">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  {ride.driver_rating || '4.5'} rating
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 flex items-center">
                  <Car className="w-4 h-4 mr-1 text-gray-500" />
                  {ride.vehicle_type}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {ride.available_seats} seats available
                </div>
              </div>
            </div>
          </div>

          {/* Passenger Selection */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <label className="block text-sm font-semibold text-gray-900 mb-4">
              Number of Passengers
            </label>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setPassengers(Math.max(1, passengers - 1))}
                className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                -
              </button>
              <span className="text-xl font-semibold text-gray-900 min-w-[2rem] text-center">
                {passengers}
              </span>
              <button
                onClick={() => setPassengers(Math.min(ride.seats_available, passengers + 1))}
                className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                +
              </button>
              <span className="text-sm text-gray-500 ml-4">
                Max {ride.seats_available} available
              </span>
            </div>
          </div>

          {/* Message */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <label className="flex items-center text-sm font-semibold text-gray-900 mb-4">
              <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
              Message to Driver (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Let the driver know about any special requirements or pickup details..."
              className="w-full h-24 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-2 text-right">
              {message.length}/500 characters
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600 mb-1">
                  ₹{ride.price_per_seat} × {passengers} passenger{passengers > 1 ? 's' : ''}
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  Total: ₹{ride.price_per_seat * passengers}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 bg-white bg-opacity-60 px-3 py-1 rounded-full">
                  {ride.seats_available} seats available
                </div>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 shadow-sm">
            <div className="text-sm text-yellow-800 flex items-start">
              <div className="w-5 h-5 rounded-full bg-yellow-200 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                <span className="text-xs font-bold text-yellow-800">!</span>
              </div>
              <div>
                <strong>Important:</strong> Your booking request will be sent to the driver for approval. 
                You'll receive a notification once they respond to your request.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-4 p-8 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-12 font-medium"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmBooking}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            disabled={loading}
          >
            {loading ? 'Sending Request...' : 'Send Booking Request'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
