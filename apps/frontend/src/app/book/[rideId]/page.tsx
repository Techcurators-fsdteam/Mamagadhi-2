'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { Car, User, MapPin, Clock, Calendar, Users, CreditCard, Phone, Mail, Shield } from 'lucide-react';

interface RideDetails {
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
  driver_profile?: {
    user_id: string;
    first_name: string;
    last_name: string;
    display_name?: string;
    phone?: string;
    email?: string;
    avatar_url?: string;
  };
}

function BookingDetails() {
  const params = useParams<{ rideId: string }>();
  const router = useRouter();
  
  // Handle params safely
  if (!params || !params.rideId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Ride</h1>
          <p className="text-gray-600 mb-4">The ride ID is missing or invalid.</p>
          <button 
            onClick={() => router.push('/book')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }
  
  const rideId = params.rideId;
  
  const [ride, setRide] = useState<RideDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState(1);

  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        setLoading(true);
        // Fetch ride details from the backend
        const response = await fetch(`/api/rides/${rideId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch ride details');
        }
        
        const data = await response.json();
        setRide(data.ride);
      } catch (err) {
        console.error('Error fetching ride details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load ride details');
      } finally {
        setLoading(false);
      }
    };

    if (rideId) {
      fetchRideDetails();
    }
  }, [rideId]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = (departure: string, arrival: string) => {
    const dep = new Date(departure);
    const arr = new Date(arrival);
    const diff = arr.getTime() - dep.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleBooking = async () => {
    if (!ride) return;
    
    setBookingLoading(true);
    try {
      // Here you would typically integrate with a payment gateway
      // For now, we'll simulate the booking process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirect to confirmation page or show success message
      alert(`Booking confirmed for ${selectedSeats} seat(s)! Total amount: ₹${selectedSeats * ride.price_per_seat}`);
      router.push('/profile'); // Redirect to user profile or booking history
    } catch (err) {
      console.error('Booking failed:', err);
      alert('Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading ride details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Ride Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'This ride may have been cancelled or does not exist.'}</p>
            <button 
              onClick={() => router.push('/book')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Search
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button 
              onClick={() => router.back()}
              className="text-blue-500 hover:text-blue-600 mb-4 flex items-center space-x-2"
            >
              <span>←</span>
              <span>Back to search results</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
            <p className="text-gray-600 mt-2">Review and confirm your ride booking</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Ride Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Route and Timing */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Trip Details</h2>
                
                <div className="flex items-center justify-between mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{formatTime(ride.departure_time)}</div>
                    <div className="text-gray-600">{ride.origin_state}</div>
                    <div className="text-sm text-gray-500">{formatDate(ride.departure_time)}</div>
                  </div>
                  
                  <div className="flex flex-col items-center mx-8">
                    <div className="text-sm text-gray-500 mb-2">{calculateDuration(ride.departure_time, ride.arrival_time)}</div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div className="w-20 h-px bg-gray-300 mx-2"></div>
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">Direct route</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{formatTime(ride.arrival_time)}</div>
                    <div className="text-gray-600">{ride.destination_state}</div>
                    <div className="text-sm text-gray-500">{formatDate(ride.arrival_time)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">Pickup Point</div>
                      <div className="text-sm text-gray-600">{ride.origin}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">Drop Point</div>
                      <div className="text-sm text-gray-600">{ride.destination}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Driver Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Driver Information</h2>
                
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-lg">
                      {ride.driver_profile?.display_name || 
                       `${ride.driver_profile?.first_name} ${ride.driver_profile?.last_name}`.trim() ||
                       'Driver Name'}
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1">
                        <Car className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 capitalize">{ride.vehicle_type}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">Verified Driver</span>
                      </div>
                    </div>
                  </div>
                </div>

                {ride.driver_profile && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4">
                      {ride.driver_profile.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{ride.driver_profile.phone}</span>
                        </div>
                      )}
                      {ride.driver_profile.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{ride.driver_profile.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Vehicle Details */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Vehicle Details</h2>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <Car className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <div className="font-medium text-gray-900 capitalize">{ride.vehicle_type}</div>
                    <div className="text-sm text-gray-600">Vehicle Type</div>
                  </div>
                  <div className="text-center">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <div className="font-medium text-gray-900">{ride.seats_total}</div>
                    <div className="text-sm text-gray-600">Total Seats</div>
                  </div>
                  <div className="text-center">
                    <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <div className="font-medium text-gray-900">{ride.seats_available}</div>
                    <div className="text-sm text-gray-600">Available</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of seats
                    </label>
                    <select 
                      value={selectedSeats} 
                      onChange={(e) => setSelectedSeats(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: Math.min(ride.seats_available, 4) }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num} seat{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Price per seat</span>
                      <span className="font-medium">₹{ride.price_per_seat}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Seats selected</span>
                      <span className="font-medium">{selectedSeats}</span>
                    </div>
                    <div className="border-t border-gray-100 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total Amount</span>
                        <span className="text-2xl font-bold text-blue-600">₹{selectedSeats * ride.price_per_seat}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleBooking}
                  disabled={bookingLoading}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {bookingLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Confirm Booking</span>
                    </>
                  )}
                </button>

                <div className="mt-4 text-xs text-gray-500 text-center">
                  By booking this ride, you agree to our terms and conditions
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default BookingDetails;
