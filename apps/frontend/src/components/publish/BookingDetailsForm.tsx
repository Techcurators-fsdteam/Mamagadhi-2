'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarIcon, Users, IndianRupee, Minus, Plus, Clock } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Stopover {
  id: string;
  name: string;
  coordinates?: [number, number];
}

interface BookingDetails {
  date: Date | null;
  departureTime: string;
  arrivalTime: string;
  passengers: number;
  pricePerSeat: string;
}

interface BookingDetailsFormProps {
  bookingDetails: BookingDetails;
  formData: {
    origin: string;
    destination: string;
    originLandmark: string;
    destinationLandmark: string;
  };
  stopovers: Stopover[];
  routeDetails: {
    distance: string;
    duration: string;
  } | null;
  maxPassengers: number;
  onBookingDetailsChange: (field: keyof BookingDetails, value: any) => void;
  onSubmit: () => void;
}

const BookingDetailsForm: React.FC<BookingDetailsFormProps> = ({
  bookingDetails,
  formData,
  stopovers,
  routeDetails,
  maxPassengers,
  onBookingDetailsChange,
  onSubmit,
}) => {
  const adjustPassengers = (increment: boolean) => {
    const newCount = increment ? bookingDetails.passengers + 1 : bookingDetails.passengers - 1;
    if (newCount >= 1 && newCount <= maxPassengers) {
      onBookingDetailsChange('passengers', newCount);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Route Summary */}
      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4AAAFF]"></div>
            Route Summary
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 uppercase">From</div>
                <div className="text-sm font-medium text-gray-800">{formData.origin || 'Origin not selected'}</div>
                {formData.originLandmark && (
                  <div className="text-xs text-gray-500 mt-1">📍 {formData.originLandmark}</div>
                )}
              </div>
            </div>
            {stopovers.map((stopover) => (
              <div key={stopover.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 uppercase">Stopover</div>
                  <div className="text-sm font-medium text-gray-800">{stopover.name}</div>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 uppercase">To</div>
                <div className="text-sm font-medium text-gray-800">{formData.destination || 'Destination not selected'}</div>
                {formData.destinationLandmark && (
                  <div className="text-xs text-gray-500 mt-1">📍 {formData.destinationLandmark}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Route Details */}
        {routeDetails && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Route Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Distance</div>
                <div className="text-lg font-semibold text-gray-900">{routeDetails.distance}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Duration</div>
                <div className="text-lg font-semibold text-gray-900">{routeDetails.duration}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Booking Form */}
      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h3>
          
          {/* Date Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Date
            </label>
            <div className="relative">
              <DatePicker
                selected={bookingDetails.date}
                onChange={(date) => onBookingDetailsChange('date', date)}
                minDate={new Date()}
                placeholderText="Select departure date"
                className="w-full h-12 pl-10 pr-4 rounded-lg border border-gray-200 focus:border-[#4AAAFF] focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                dateFormat="MMMM d, yyyy"
              />
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            {/* Departure Time */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Departure Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="time"
                  value={bookingDetails.departureTime}
                  onChange={(e) => onBookingDetailsChange('departureTime', e.target.value)}
                  className="pl-10 h-12 rounded-lg border border-gray-200 focus:border-[#4AAAFF] focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                />
              </div>
            </div>

            {/* Arrival Time (Auto-calculated) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Est. Arrival
              </label>
              <div className="space-y-2">
                {/* Arrival Time */}
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="time"
                    value={bookingDetails.arrivalTime}
                    readOnly
                    className="pl-10 h-12 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                    placeholder="Auto-calculated"
                  />
                </div>
                
                {/* Arrival Date Info */}
                {(() => {
                  if (bookingDetails.departureTime && bookingDetails.arrivalTime && bookingDetails.date && routeDetails?.duration) {
                    try {
                      // Parse the duration to calculate the actual arrival date
                      const durationMatch = routeDetails.duration.match(/(?:(\d+)h\s*)?(?:(\d+)m)?/);
                      if (durationMatch) {
                        const hours = parseInt(durationMatch[1] || '0');
                        const minutes = parseInt(durationMatch[2] || '0');
                        const totalMinutes = hours * 60 + minutes;
                        
                        // Parse departure time
                        const [depHours, depMinutes] = bookingDetails.departureTime.split(':').map(Number);
                        
                        // Create departure datetime
                        const departureDate = new Date(bookingDetails.date);
                        departureDate.setHours(depHours, depMinutes, 0, 0);
                        
                        // Calculate actual arrival datetime by adding duration
                        const arrivalDate = new Date(departureDate.getTime() + totalMinutes * 60000);
                        
                        const isSameDay = departureDate.toDateString() === arrivalDate.toDateString();
                        
                        return (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="text-sm text-blue-800">
                              <div className="font-medium">Arrival Details:</div>
                              <div className="mt-1">
                                <span className="font-semibold">{bookingDetails.arrivalTime}</span>
                                {!isSameDay && (
                                  <span className="ml-2 text-amber-600 font-medium">
                                    on {arrivalDate.toLocaleDateString('en-IN', { 
                                      weekday: 'short', 
                                      day: 'numeric', 
                                      month: 'short' 
                                    })}
                                  </span>
                                )}
                                {isSameDay && (
                                  <span className="ml-2 text-green-600 font-medium">
                                    (same day)
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-blue-600 mt-1">
                                Journey Duration: {routeDetails.duration}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    } catch (error) {
                      // Ignore parsing errors
                    }
                  }
                  return (
                    <div className="text-xs text-gray-500 text-center">
                      Based on route duration
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing and Passengers */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Capacity</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Price Per Seat */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Price per Seat
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="number"
                  value={bookingDetails.pricePerSeat}
                  onChange={(e) => onBookingDetailsChange('pricePerSeat', e.target.value)}
                  placeholder="0"
                  className="pl-10 h-12 rounded-lg border border-gray-200 focus:border-[#4AAAFF] focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                />
              </div>
            </div>

            {/* Number of Passengers */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Passengers
              </label>
              <div className="flex items-center bg-white border border-gray-200 rounded-lg h-12">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustPassengers(false)}
                  disabled={bookingDetails.passengers <= 1}
                  className="h-full px-3 hover:bg-gray-50 disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="flex-1 flex items-center justify-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{bookingDetails.passengers}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustPassengers(true)}
                  disabled={bookingDetails.passengers >= maxPassengers}
                  className="h-full px-3 hover:bg-gray-50 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-500 text-center">
                Max {maxPassengers} passengers
              </div>
            </div>
          </div>
        </div>

        {/* Publish Button */}
        <Button
          onClick={onSubmit}
          disabled={!bookingDetails.date || !bookingDetails.departureTime || !bookingDetails.pricePerSeat}
          className="w-full h-12 bg-[#4AAAFF] hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Publish Trip
        </Button>
      </div>
    </div>
  );
};

export default BookingDetailsForm;
