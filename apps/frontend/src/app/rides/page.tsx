'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { supabase } from '@/lib/supabase';
import { formatTimeIST, formatDateIST, formatDateForAdmin, isDifferentDayIST } from '@/lib/timezone-utils';
import { 
  Car,
  Clock, 
  Users, 
  IndianRupee, 
  Calendar,
  Edit,
  Trash2,
  Eye,
  Plus,
  MessageSquare,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone
} from 'lucide-react';

interface Ride {
  ride_id: string;
  vehicle_type: string;
  origin: string;
  destination: string;
  origin_state?: string;
  destination_state?: string;
  departure_time: string;
  arrival_time: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  status: 'open' | 'closed' | 'completed' | 'cancelled';
  created_at: string;
  driver_id: string; // Add this missing property
  stops: Array<{
    ride_id: string;
    sequence: number;
    landmark: string;
    stop_geog?: string;
  }>;
}

interface RideBooking {
  booking_id: string;
  ride_id: string;
  passenger_id: string;
  seats_booked: number;
  booking_status: 'pending' | 'approved' | 'denied' | 'cancelled';
  created_at: string;
  updated_at: string;
  request_message: string;
  responded_at?: string;
  ride: {
    origin: string;
    destination: string;
    origin_state?: string;
    destination_state?: string;
    departure_time: string;
    arrival_time: string;
    vehicle_type: string;
    price_per_seat: number;
    driver_id: string;
    driver: {
      display_name: string;
      profile_url: string | null;
      email: string | null;
      phone: string | null;
      first_name: string | null;
      last_name: string | null;
    };
  };
}

interface RideBookingRequest {
  booking_id: string;
  ride_id: string;
  passenger_id: string;
  seats_booked: number;
  booking_status: 'pending' | 'approved' | 'denied' | 'cancelled';
  created_at: string;
  updated_at: string;
  request_message: string;
  responded_at?: string;
  passenger: {
    display_name: string;
    profile_url: string | null;
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
  };
  ride: {
    origin: string;
    destination: string;
    departure_time: string;
    vehicle_type: string;
    price_per_seat: number;
  };
}

const MyRidesPage: React.FC = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'published' | 'bookings' | 'requests'>('published');
  const [rides, setRides] = useState<Ride[]>([]);
  const [bookings, setBookings] = useState<RideBooking[]>([]);
  const [bookingRequests, setBookingRequests] = useState<RideBookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    item: Ride | null;
    type: 'ride';
    isLoading: boolean;
  }>({
    isOpen: false,
    item: null,
    type: 'ride',
    isLoading: false
  });
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  
  // Fetch user's data
  useEffect(() => {
    if (user?.uid) {
      fetchData();
    }
  }, [user?.uid]);

  const fetchData = async () => {
    if (!user?.uid || !supabase) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch published rides first
      const { data: ridesData, error: ridesError } = await supabase
        .from('rides')
        .select(`
          *,
          ride_stops (
            ride_id,
            sequence,
            landmark,
            stop_geog
          )
        `)
        .eq('driver_id', user.uid)
        .order('created_at', { ascending: false });

      if (ridesError) {
        console.error('Rides query error:', ridesError);
        throw new Error(`Failed to fetch rides: ${ridesError.message}`);
      }

      // Process rides data to match interface
      const processedRides = ridesData?.map(ride => ({
        ...ride,
        stops: ride.ride_stops || []
      })) || [];

      setRides(processedRides);

      // Fetch ride bookings with a simpler query structure
      const { data: bookingsRaw, error: bookingsError } = await supabase
        .from('ride_bookings')
        .select('*')
        .eq('passenger_id', user.uid)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Bookings query error:', bookingsError);
        throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
      }

      // If we have bookings, fetch the related ride data separately
      const processedBookings = [];
      
      if (bookingsRaw && bookingsRaw.length > 0) {
        for (const booking of bookingsRaw) {
          try {
            // Fetch ride data for each booking
            const { data: rideData, error: rideError } = await supabase
              .from('rides')
              .select('*')
              .eq('ride_id', booking.ride_id)
              .single();

            if (rideError) {
              console.warn(`Failed to fetch ride data for booking ${booking.booking_id}:`, rideError);
              continue;
            }

            // Fetch complete driver data including contact info for approved bookings
            let driverData = { 
              display_name: 'Unknown Driver', 
              profile_url: null as string | null, 
              email: null as string | null, 
              phone: null as string | null,
              first_name: null as string | null,
              last_name: null as string | null
            };
            
            if (rideData.driver_id) {
              // For approved bookings, fetch complete contact information
              if (booking.booking_status === 'approved') {
                const { data: driver, error: driverError } = await supabase
                  .from('user_profiles')
                  .select('display_name, profile_url, email, phone, first_name, last_name')
                  .eq('id', rideData.driver_id)
                  .single();

                if (!driverError && driver) {
                  driverData = {
                    display_name: driver.display_name || 'Unknown Driver',
                    profile_url: driver.profile_url || null,
                    email: driver.email || null,
                    phone: driver.phone || null,
                    first_name: driver.first_name || null,
                    last_name: driver.last_name || null
                  };
                }
              } else {
                // For non-approved bookings, only fetch basic info
                const { data: driver, error: driverError } = await supabase
                  .from('user_profiles')
                  .select('display_name, profile_url')
                  .eq('id', rideData.driver_id)
                  .single();

                if (!driverError && driver) {
                  driverData = {
                    display_name: driver.display_name || 'Unknown Driver',
                    profile_url: driver.profile_url || null,
                    email: null,
                    phone: null,
                    first_name: null,
                    last_name: null
                  };
                }
              }
            }

            // Combine booking with ride and driver data
            processedBookings.push({
              ...booking,
              ride: {
                ...rideData,
                driver: driverData
              }
            });
          } catch (err) {
            console.warn(`Error processing booking ${booking.booking_id}:`, err);
            // Continue with next booking instead of failing entirely
          }
        }
      }

      setBookings(processedBookings);

      // Fetch booking requests for driver's rides
      await fetchBookingRequests();

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      toast.error('Failed to load your rides and bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingRequests = async () => {
    if (!user?.uid || !supabase) return;

    try {
      // First get all ride IDs for this driver
      const { data: driverRides, error: ridesError } = await supabase
        .from('rides')
        .select('ride_id')
        .eq('driver_id', user.uid);

      if (ridesError) {
        throw new Error(`Failed to fetch driver rides: ${ridesError.message}`);
      }

      if (!driverRides || driverRides.length === 0) {
        setBookingRequests([]);
        return;
      }

      const rideIds = driverRides.map(r => r.ride_id);

      // Fetch booking requests for these rides
      const { data: requestsRaw, error: requestsError } = await supabase
        .from('ride_bookings')
        .select('*')
        .in('ride_id', rideIds)
        .order('created_at', { ascending: false });

      if (requestsError) {
        throw new Error(`Failed to fetch booking requests: ${requestsError.message}`);
      }

      // Process each request to get passenger and ride details
      const processedRequests = [];
      
      if (requestsRaw && requestsRaw.length > 0) {
        for (const request of requestsRaw) {
          try {
            // Fetch passenger details
            const { data: passenger, error: passengerError } = await supabase
              .from('user_profiles')
              .select('display_name, profile_url, email, phone, first_name, last_name')
              .eq('id', request.passenger_id)
              .single();

            // Fetch ride details
            const { data: ride, error: rideError } = await supabase
              .from('rides')
              .select('origin, destination, departure_time, vehicle_type, price_per_seat')
              .eq('ride_id', request.ride_id)
              .single();

            if (!passengerError && passenger && !rideError && ride) {
              processedRequests.push({
                ...request,
                passenger: {
                  display_name: passenger.display_name || 'Unknown User',
                  profile_url: passenger.profile_url || null,
                  email: passenger.email || null,
                  phone: passenger.phone || null,
                  first_name: passenger.first_name || null,
                  last_name: passenger.last_name || null,
                },
                ride: {
                  origin: ride.origin,
                  destination: ride.destination,
                  departure_time: ride.departure_time,
                  vehicle_type: ride.vehicle_type,
                  price_per_seat: ride.price_per_seat,
                }
              });
            }
          } catch (err) {
            console.warn(`Error processing request ${request.booking_id}:`, err);
          }
        }
      }

      setBookingRequests(processedRequests);
    } catch (err) {
      console.error('Error fetching booking requests:', err);
      toast.error('Failed to load booking requests');
    }
  };

  const handleBookingResponse = async (bookingId: string, action: 'approved' | 'denied') => {
    if (!user?.uid || !supabase) return;

    setProcessingRequest(bookingId);

    try {
      const { error } = await supabase
        .from('ride_bookings')
        .update({
          booking_status: action,
          responded_at: new Date().toISOString()
        })
        .eq('booking_id', bookingId);

      if (error) {
        throw new Error(`Failed to ${action === 'approved' ? 'approve' : 'deny'} booking: ${error.message}`);
      }

      // Update local state
      setBookingRequests(prev => 
        prev.map(request => 
          request.booking_id === bookingId 
            ? { ...request, booking_status: action, responded_at: new Date().toISOString() }
            : request
        )
      );

      // Refresh rides data to update seat availability
      const { data: ridesData, error: ridesError } = await supabase
        .from('rides')
        .select(`
          *,
          ride_stops (
            ride_id,
            sequence,
            landmark,
            stop_geog
          )
        `)
        .eq('driver_id', user.uid)
        .order('created_at', { ascending: false });

      if (!ridesError && ridesData) {
        const processedRides = ridesData?.map(ride => ({
          ...ride,
          stops: ride.ride_stops || []
        })) || [];
        setRides(processedRides);
      }

      toast.success(`Booking ${action === 'approved' ? 'approved' : 'denied'} successfully`);
    } catch (err) {
      console.error(`Error ${action === 'approved' ? 'approving' : 'denying'} booking:`, err);
      toast.error(err instanceof Error ? err.message : `Failed to ${action === 'approved' ? 'approve' : 'deny'} booking`);
    } finally {
      setProcessingRequest(null);
    }
  };

  const formatDate = (dateString: string) => {
    return formatDateIST(dateString);
  };

  const formatTime = (dateString: string) => {
    return formatTimeIST(dateString);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
      case 'denied':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'denied':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  // Returns an icon based on vehicle type
  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType.toLowerCase()) {
      case 'car':
        return <Car className="w-5 h-5 text-blue-600" />;
      case 'bike':
        return <Users className="w-5 h-5 text-green-600" />;
      case 'van':
        return <Users className="w-5 h-5 text-purple-600" />;
      default:
        return <Car className="w-5 h-5 text-gray-400" />;
    }
  };

  // Handle delete/cancel actions
  const handleDeleteRide = (ride: Ride) => {
    setDeleteDialog({
      isOpen: true,
      item: ride,
      type: 'ride',
      isLoading: false
    });
  };

  const handleCancelBookingRequest = async (booking: RideBooking) => {
    if (!user?.uid || !supabase) return;

    try {
      setProcessingRequest(booking.booking_id);

      const { error } = await supabase
        .from('ride_bookings')
        .delete()
        .eq('booking_id', booking.booking_id)
        .eq('passenger_id', user.uid);

      if (error) throw error;

      setBookings(prevBookings => prevBookings.filter(b => b.booking_id !== booking.booking_id));
      toast.success('Booking request cancelled successfully');
    } catch (err) {
      console.error('Error cancelling booking request:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to cancel request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const confirmDeleteItem = async () => {
    const { item, type } = deleteDialog;
    if (!item || !user?.uid || !supabase) return;

    try {
      setDeleteDialog(prev => ({ ...prev, isLoading: true }));

      if (type === 'ride') {
        const ride = item as Ride;
        const { error } = await supabase
          .from('rides')
          .delete()
          .eq('ride_id', ride.ride_id)
          .eq('driver_id', user.uid);

        if (error) throw error;

        setRides(prevRides => prevRides.filter(r => r.ride_id !== ride.ride_id));
        toast.success('Ride deleted successfully');
      }

      setDeleteDialog({ isOpen: false, item: null, type: 'ride', isLoading: false });

    } catch (err) {
      console.error('Error deleting ride:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete ride');
    } finally {
      setDeleteDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const cancelDeleteItem = () => {
    setDeleteDialog({ isOpen: false, item: null, type: 'ride', isLoading: false });
  };

  // Remove authentication loading check - handled by AuthGuard
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your rides...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <div className="flex-1">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Rides</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                Manage your published rides and booking requests
              </p>
            </div>
            <button
              onClick={() => router.push('/publish')}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span className="sm:inline">Publish New Ride</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex flex-col sm:flex-row sm:space-x-8 space-y-2 sm:space-y-0">
                <button
                  onClick={() => setActiveTab('published')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm text-center sm:text-left ${
                    activeTab === 'published'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Published Rides ({rides.length})
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm text-center sm:text-left ${
                    activeTab === 'bookings'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Booked Rides ({bookings.length})
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm text-center sm:text-left ${
                    activeTab === 'requests'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Booking Requests ({bookingRequests.filter(r => r.booking_status === 'pending').length})
                </button>
              </nav>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Published Rides Tab */}
          {activeTab === 'published' && (
            <div>
              {/* Stats Cards for Published Rides */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Car className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-gray-900">{rides.length}</div>
                      <div className="text-xs sm:text-sm text-gray-500">Total Rides</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-gray-900">
                        {rides.filter(r => r.status === 'open').length}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">Active Rides</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-gray-900">
                        {rides.filter(r => r.status === 'completed').length}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">Completed</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-gray-900">
                        ₹{rides.reduce((total, ride) => total + (ride.price_per_seat * (ride.seats_total - ride.seats_available)), 0).toLocaleString()}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">Total Earnings</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Published Rides List */}
              {rides.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border p-8 sm:p-12 text-center">
                  <Car className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No rides published yet</h3>
                  <p className="text-gray-600 mb-6 text-sm sm:text-base px-4">
                    Start sharing rides with others by publishing your first ride
                  </p>
                  <button
                    onClick={() => router.push('/publish')}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition w-full sm:w-auto"
                  >
                    Publish Your First Ride
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {rides.map((ride) => (
                    <div key={ride.ride_id} className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 hover:shadow-md transition">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                {getVehicleIcon(ride.vehicle_type)}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 capitalize text-sm sm:text-base">
                                  {ride.vehicle_type} • {ride.seats_total} seats
                                </div>
                                <div className="text-xs sm:text-sm text-gray-500">
                                  Created {formatDate(ride.created_at)}
                                </div>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium self-start sm:self-auto ${getStatusColor(ride.status)}`}>
                              {ride.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                            {/* Route Information */}
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="w-3 h-3 rounded-full bg-green-500 mt-1"></div>
                                <div className="flex-1">
                                  <div className="text-xs sm:text-sm text-gray-500">From</div>
                                  <div className="font-semibold text-base sm:text-lg">
                                    {ride.origin_state || 'Unknown State'}
                                  </div>
                                  {ride.origin && (
                                    <div className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                                      📍 {ride.origin}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {ride.stops && ride.stops.length > 0 && (
                                <div className="ml-6 space-y-2">
                                  {ride.stops.map((stop, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                      <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5"></div>
                                      <div className="text-xs sm:text-sm text-gray-600 break-words">{stop.landmark}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex items-start gap-3">
                                <div className="w-3 h-3 rounded-full bg-red-500 mt-1"></div>
                                <div className="flex-1">
                                  <div className="text-xs sm:text-sm text-gray-500">To</div>
                                  <div className="font-semibold text-base sm:text-lg">
                                    {ride.destination_state || 'Unknown State'}
                                  </div>
                                  {ride.destination && (
                                    <div className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                                      📍 {ride.destination}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Trip Details */}
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div className="flex-1">
                                  <div className="text-xs sm:text-sm text-gray-500">Departure</div>
                                  <div className="font-medium text-sm sm:text-base">
                                    {formatDate(ride.departure_time)} at {formatTime(ride.departure_time)}
                                  </div>
                                </div>
                              </div>
                              
                              {ride.arrival_time && (
                                <div className="flex items-start gap-3">
                                  <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                                  <div className="flex-1">
                                    <div className="text-xs sm:text-sm text-gray-500">Estimated Arrival</div>
                                    <div className="font-medium text-sm sm:text-base">
                                      {(() => {
                                        const depDate = new Date(ride.departure_time);
                                        const arrDate = new Date(ride.arrival_time);
                                        const isSameDay = depDate.toDateString() === arrDate.toDateString();
                                        
                                        if (isSameDay) {
                                          return formatTime(ride.arrival_time);
                                        } else {
                                          return `${formatTime(ride.arrival_time)} (${arrDate.toLocaleDateString('en-IN', { 
                                            weekday: 'short', 
                                            day: 'numeric', 
                                            month: 'short' 
                                          })})`;
                                        }
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-gray-400" />
                                  <span className="text-xs sm:text-sm">
                                    {ride.seats_available}/{ride.seats_total} available
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <IndianRupee className="w-4 h-4 text-gray-400" />
                                  <span className="font-semibold text-sm sm:text-base">₹{ride.price_per_seat}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex lg:flex-col items-center gap-2">
                          <button
                            onClick={() => handleDeleteRide(ride)}
                            className={`px-3 py-2 rounded-lg transition font-medium text-sm w-full lg:w-auto ${
                              ride.status === 'open' 
                                ? 'text-red-600 bg-red-50 hover:bg-red-100 border border-red-200' 
                                : 'text-gray-300 bg-gray-50 cursor-not-allowed border border-gray-200'
                            }`}
                            title={ride.status === 'open' ? 'Delete Ride' : 'Cannot delete - ride is not open'}
                            disabled={ride.status !== 'open'}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div>
              {/* Bookings Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-gray-900">{bookings.length}</div>
                      <div className="text-xs sm:text-sm text-gray-500">Total Requests</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-gray-900">
                        {bookings.filter(b => b.booking_status === 'pending').length}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">Pending</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-gray-900">
                        {bookings.filter(b => b.booking_status === 'approved').length}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">Approved</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-gray-900">
                        {bookings.filter(b => b.booking_status === 'denied').length}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">Denied</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bookings List */}
              {bookings.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border p-8 sm:p-12 text-center">
                  <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No booking requests yet</h3>
                  <p className="text-gray-600 mb-6 text-sm sm:text-base px-4">
                    Start booking rides to see your requests here
                  </p>
                  <button
                    onClick={() => router.push('/book')}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition w-full sm:w-auto"
                  >
                    Book Your First Ride
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.booking_id} className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 hover:shadow-md transition">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Car className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 capitalize text-sm sm:text-base">
                                  {booking.ride.vehicle_type} • {booking.seats_booked} seat{booking.seats_booked > 1 ? 's' : ''}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-500">
                                  Requested on {new Date(booking.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              {getStatusIcon(booking.booking_status)}
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.booking_status)}`}>
                                {booking.booking_status.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {/* Show driver contact info for approved bookings */}
                          {booking.booking_status === 'approved' && (
                            <div className="mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center overflow-hidden">
                                  {booking.ride.driver.profile_url ? (
                                    <img 
                                      src={booking.ride.driver.profile_url} 
                                      alt={booking.ride.driver.display_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-lg font-medium text-green-700">
                                      {booking.ride.driver.display_name.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-green-900 text-sm sm:text-base">
                                    {booking.ride.driver.first_name && booking.ride.driver.last_name 
                                      ? `${booking.ride.driver.first_name} ${booking.ride.driver.last_name}`
                                      : booking.ride.driver.display_name
                                    }
                                  </h4>
                                  <p className="text-xs sm:text-sm text-green-700">Your driver's contact details</p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 gap-3">
                                {booking.ride.driver.phone && (
                                  <a 
                                    href={`tel:${booking.ride.driver.phone}`}
                                    className="flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium w-full"
                                  >
                                    <Phone className="w-4 h-4" />
                                    Call {booking.ride.driver.first_name || booking.ride.driver.display_name}
                                  </a>
                                )}
                              </div>
                              
                              <div className="mt-3 text-xs text-green-700">
                                <p>Use the button above to contact your driver directly</p>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                            {/* Route Information */}
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="w-3 h-3 rounded-full bg-green-500 mt-1"></div>
                                <div className="flex-1">
                                  <div className="text-xs sm:text-sm text-gray-500">From</div>
                                  <div className="font-semibold text-base sm:text-lg">
                                    {booking.ride.origin_state || 'Unknown State'}
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                                    📍 {booking.ride.origin}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-3">
                                <div className="w-3 h-3 rounded-full bg-red-500 mt-1"></div>
                                <div className="flex-1">
                                  <div className="text-xs sm:text-sm text-gray-500">To</div>
                                  <div className="font-semibold text-base sm:text-lg">
                                    {booking.ride.destination_state || 'Unknown State'}
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                                    📍 {booking.ride.destination}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Booking Details */}
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div className="flex-1">
                                  <div className="text-xs sm:text-sm text-gray-500">Departure</div>
                                  <div className="font-medium text-sm sm:text-base">
                                    {new Date(booking.ride.departure_time).toLocaleDateString()} at {new Date(booking.ride.departure_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-3">
                                <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div className="flex-1">
                                  <div className="text-xs sm:text-sm text-gray-500">Driver</div>
                                  <div className="font-medium text-sm sm:text-base break-words">{booking.ride.driver.display_name}</div>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-3">
                                <IndianRupee className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div className="flex-1">
                                  <div className="text-xs sm:text-sm text-gray-500">Total Cost</div>
                                  <div className="font-semibold text-sm sm:text-base">₹{booking.ride.price_per_seat * booking.seats_booked}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Message */}
                          {booking.request_message && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <div className="text-xs sm:text-sm text-gray-500 mb-1">Your message:</div>
                              <div className="text-xs sm:text-sm text-gray-700 break-words">"{booking.request_message}"</div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex lg:flex-col items-center gap-2 w-full lg:w-auto">
                          {booking.booking_status === 'pending' && (
                            <button
                              onClick={() => handleCancelBookingRequest(booking)}
                              disabled={processingRequest === booking.booking_id}
                              className="px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed w-full lg:w-auto"
                              title="Cancel Request"
                            >
                              <div className="flex items-center justify-center gap-2">
                                {processingRequest === booking.booking_id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                                <span>{processingRequest === booking.booking_id ? 'Cancelling...' : 'Cancel Request'}</span>
                              </div>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Booking Requests Tab */}
          {activeTab === 'requests' && (
            <div>
              {/* Requests Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-gray-900">
                        {bookingRequests.filter(r => r.booking_status === 'pending').length}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">Pending Requests</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-gray-900">
                        {bookingRequests.filter(r => r.booking_status === 'approved').length}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">Approved</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-gray-900">
                        {bookingRequests.filter(r => r.booking_status === 'denied').length}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">Denied</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-gray-900">{bookingRequests.length}</div>
                      <div className="text-xs sm:text-sm text-gray-500">Total Requests</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requests List */}
              {bookingRequests.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border p-8 sm:p-12 text-center">
                  <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No booking requests yet</h3>
                  <p className="text-gray-600 mb-6 text-sm sm:text-base px-4">
                    When passengers request to book your rides, they'll appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookingRequests.map((request) => (
                    <div key={request.booking_id} className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 hover:shadow-md transition">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                                {request.passenger.profile_url ? (
                                  <img 
                                    src={request.passenger.profile_url} 
                                    alt={request.passenger.display_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-lg font-medium text-blue-700">
                                    {request.passenger.display_name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                                  {request.passenger.first_name && request.passenger.last_name 
                                    ? `${request.passenger.first_name} ${request.passenger.last_name}`
                                    : request.passenger.display_name
                                  }
                                </h4>
                                <div className="text-xs sm:text-sm text-gray-500">
                                  Requested {request.seats_booked} seat{request.seats_booked > 1 ? 's' : ''} • 
                                  {new Date(request.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              {getStatusIcon(request.booking_status)}
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.booking_status)}`}>
                                {request.booking_status.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {/* Ride Details */}
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-xs sm:text-sm text-gray-600">
                                  {formatDate(request.ride.departure_time)} at {formatTime(request.ride.departure_time)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Car className="w-4 h-4 text-gray-400" />
                                <span className="text-xs sm:text-sm text-gray-600 capitalize">
                                  {request.ride.vehicle_type}
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <span className="text-xs sm:text-sm text-gray-500 mt-0.5">Route:</span>
                                <span className="text-xs sm:text-sm font-medium break-words">
                                  {request.ride.origin} → {request.ride.destination}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <IndianRupee className="w-4 h-4 text-gray-400" />
                                <span className="text-xs sm:text-sm font-medium">
                                  ₹{request.ride.price_per_seat * request.seats_booked} total
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Request Message */}
                          {request.request_message && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                              <div className="text-xs sm:text-sm text-gray-500 mb-1">Message from passenger:</div>
                              <div className="text-xs sm:text-sm text-gray-700 break-words">"{request.request_message}"</div>
                            </div>
                          )}

                          {/* Contact Info for Approved Requests */}
                          {request.booking_status === 'approved' && (
                            <div className="mb-4">
                              {request.passenger.phone && (
                                <a 
                                  href={`tel:${request.passenger.phone}`}
                                  className="flex items-center justify-center gap-2 bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-600 transition-colors font-medium text-sm w-full sm:w-auto"
                                >
                                  <Phone className="w-4 h-4" />
                                  Connect with {request.passenger.first_name || request.passenger.display_name.split(' ')[0] || 'Passenger'}
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex lg:flex-col gap-2 w-full lg:w-auto">
                          {request.booking_status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleBookingResponse(request.booking_id, 'approved')}
                                disabled={processingRequest === request.booking_id}
                                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 transition text-sm font-medium flex-1 lg:min-w-[80px] lg:flex-none"
                              >
                                {processingRequest === request.booking_id ? 'Processing...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleBookingResponse(request.booking_id, 'denied')}
                                disabled={processingRequest === request.booking_id}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition text-sm font-medium flex-1 lg:min-w-[80px] lg:flex-none"
                              >
                                {processingRequest === request.booking_id ? 'Processing...' : 'Deny'}
                              </button>
                            </>
                          ) : (
                            <div className="text-center w-full lg:w-auto">
                              <div className={`px-3 py-2 rounded-lg text-sm font-medium lg:min-w-[80px] ${
                                request.booking_status === 'approved' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {request.booking_status === 'approved' ? 'Approved' : 'Denied'}
                              </div>
                              {request.responded_at && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(request.responded_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <Footer />

      {/* Delete/Cancel Confirmation Dialog */}
      {deleteDialog.item && (
        <DeleteConfirmationDialog
          isOpen={deleteDialog.isOpen}
          onClose={cancelDeleteItem}
          onConfirm={confirmDeleteItem}
          rideDetails={{
            origin: deleteDialog.item.origin,
            destination: deleteDialog.item.destination,
            departure_time: deleteDialog.item.departure_time
          }}
          isLoading={deleteDialog.isLoading}
        />
      )}
    </div>
  );
};

export default MyRidesPage;


