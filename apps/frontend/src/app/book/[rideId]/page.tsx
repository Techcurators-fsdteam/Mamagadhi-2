"use client"
import React, { useState, useEffect } from 'react';
import {
  IoArrowBack as ArrowLeftIcon,
  IoChatbubbleEllipsesOutline as ChatBubbleLeftEllipsisIcon,
  IoCheckmarkCircleOutline as CheckBadgeIcon,
  IoCardOutline as CreditCardIcon,
  IoInformationCircleOutline as InformationCircleIcon,
  IoCallOutline as PhoneIcon,
  IoShieldCheckmarkOutline as ShieldCheckIcon,
  IoCarOutline as TruckIcon,
  IoCloseCircleOutline as XCircleIcon
} from 'react-icons/io5';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';

interface RideData {
  ride_id: string;
  vehicle_type: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  origin_state: string;
  destination_state: string;
  driver_id: string;
  driver: {
    display_name: string;
    profile_url: string | null;
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
  };
  stops: {
    stop_id: string;
    sequence: number;
    landmark: string;
  }[];
}

interface UserBooking {
  booking_id: string;
  booking_status: 'pending' | 'approved' | 'denied' | 'cancelled';
  seats_booked: number;
  request_message: string;
  created_at: string;
  responded_at?: string;
}

const RideSummary: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [showAllStops, setShowAllStops] = useState(false);
  const [rideData, setRideData] = useState<RideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [seatsRequested, setSeatsRequested] = useState(1);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [userBooking, setUserBooking] = useState<UserBooking | null>(null);
  const router = useRouter();
  const params = useParams();
  const rideId = params?.rideId as string;

  useEffect(() => {
    if (user && rideId) {
      fetchRideData();
    }
  }, [rideId, user]);

  // Handle back navigation with session management
  const handleBackNavigation = () => {
    // Check if there's a previous search state in sessionStorage
    const hasSearchSession = sessionStorage.getItem('searchResults') || 
                            sessionStorage.getItem('lastSearchCriteria') ||
                            document.referrer.includes('/book');
    
    if (hasSearchSession) {
      // Navigate back to book page with preserved state
      router.back();
    } else {
      // No search session, go to book page normally
      router.push('/book');
    }
  };

  const handleBookingSubmit = async () => {
    if (!user || !rideData || !supabase) return;

    // Prevent drivers from booking their own rides
    if (user.uid === rideData.driver_id) {
      setBookingError('You cannot book your own ride. This ride was published by you.');
      return;
    }

    setSubmittingBooking(true);
    setBookingError(null);

    try {
      const { error } = await supabase
        .from('ride_bookings')
        .insert({
          ride_id: rideData.ride_id,
          passenger_id: user.uid,
          seats_booked: seatsRequested,
          request_message: bookingMessage || '',
          booking_status: 'pending'
        });

      if (error) {
        throw new Error(`Booking failed: ${error.message}`);
      }

      setBookingSuccess(true);
      setShowBookingForm(false);
      
      // Reset form
      setBookingMessage('');
      setSeatsRequested(1);
      
    } catch (err) {
      console.error('Booking error:', err);
      setBookingError(err instanceof Error ? err.message : 'Failed to submit booking request');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const fetchRideData = async () => {
    try {
      setLoading(true);

      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }

      if (!rideId) {
        throw new Error('Ride ID is required');
      }
      
      // First, fetch ride data alone
      const { data: rideData, error: rideError } = await supabase
        .from('rides')
        .select('*')
        .eq('ride_id', rideId)
        .single();

      if (rideError) {
        console.error('Ride fetch error:', rideError);
        throw new Error(`Failed to fetch ride: ${rideError.message}`);
      }

      if (!rideData) {
        throw new Error('Ride not found');
      }

      // Then fetch driver profile separately if driver_id exists
      let driverData: RideData['driver'] = {
        display_name: 'Driver',
        profile_url: null
      };

      if (rideData.driver_id) {
        const { data: driver, error: driverError } = await supabase
          .from('user_profiles')
          .select('display_name, profile_url')
          .eq('id', rideData.driver_id)
          .single();

        if (driverError) {
          console.warn('Driver fetch error:', driverError);
          // Continue with default driver data instead of failing
        } else if (driver) {
          driverData = {
            display_name: driver.display_name || 'Driver',
            profile_url: driver.profile_url || null
          };
        }
      }

      // Fetch ride stops
      const { data: stopsData, error: stopsError } = await supabase
        .from('ride_stops')
        .select('*')
        .eq('ride_id', rideId)
        .order('sequence');

      if (stopsError) {
        console.warn('Stops fetch error:', stopsError);
        // Continue without stops instead of failing
      }

      setRideData({
        ...rideData,
        driver: driverData,
        stops: stopsData || []
      });
    } catch (err) {
      console.error('Error fetching ride data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ride details');
    } finally {
      setLoading(false);
    }
  };

  const checkUserBooking = async () => {
    if (!user?.uid || !rideId || !supabase) return;

    try {
      const { data: booking, error } = await supabase
        .from('ride_bookings')
        .select('*')
        .eq('passenger_id', user.uid)
        .eq('ride_id', rideId)
        .single();

      if (!error && booking) {
        setUserBooking(booking);
        
        // If booking is approved, fetch driver contact details
        if (booking.booking_status === 'approved' && rideData?.driver_id) {
          const { data: driverContact, error: driverError } = await supabase
            .from('user_profiles')
            .select('email, phone, first_name, last_name')
            .eq('id', rideData.driver_id)
            .single();

          if (!driverError && driverContact) {
            setRideData(prev => prev ? {
              ...prev,
              driver: {
                ...prev.driver,
                email: driverContact.email || undefined,
                phone: driverContact.phone || undefined,
                first_name: driverContact.first_name || undefined,
                last_name: driverContact.last_name || undefined
              }
            } : null);
          }
        }
      }
    } catch (err) {
      console.warn('Error checking user booking:', err);
    }
  };

  useEffect(() => {
    if (rideData && user?.uid) {
      checkUserBooking();
    }
  }, [rideData, user?.uid]);

  const formatDuration = (departureTime: string, arrivalTime: string) => {
    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);
    const diffMs = arrival.getTime() - departure.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h${diffMinutes > 0 ? ` ${diffMinutes}m` : ''}`;
    }
    return `${diffMinutes}m`;
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timeString: string) => {
    return new Date(timeString).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="mx-auto w-full max-w-6xl px-4 py-8 flex justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#4AAAFF]"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !rideData) {
    return (
      <>
        <Navbar />
        <div className="mx-auto w-full max-w-6xl px-4 py-8 text-center">
          <p className="text-red-500 text-lg">{error || 'Ride not found'}</p>
          <button
            onClick={() => router.push('/book')}
            className="mt-4 text-[#4AAAFF] hover:text-[#3d9ae8] font-medium"
          >
            Back to Search
          </button>
        </div>
        <Footer />
      </>
    );
  }

  // Check if current user is the driver of this ride
  const isOwnRide = user?.uid === rideData?.driver_id;

  const totalDuration = formatDuration(rideData.departure_time, rideData.arrival_time);

  return (
    <>
      <Navbar />
      
      {/* Back Navigation */}
      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        <button
          onClick={handleBackNavigation}
          className="inline-flex items-center gap-2 text-[#4AAAFF] hover:text-[#3d9ae8] font-medium text-sm transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Search Results
        </button>
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-4 md:flex md:space-y-0 md:space-x-8">
        {/* ──────────────────────  LEFT  ────────────────────── */}
        <section className="flex-1 space-y-6">
          {/* Driver card */}
          <div className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* Header row */}
            <div className="flex items-start gap-4">
              <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-blue-400">
                {rideData.driver.profile_url ? (
                  <img 
                    src={rideData.driver.profile_url} 
                    alt={rideData.driver.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-500">
                    {rideData.driver.display_name.charAt(0).toUpperCase()}
                  </span>
                )}
                <CheckBadgeIcon className="absolute -bottom-1 -right-1 h-5 w-5 text-blue-500 drop-shadow" />
              </div>

              <div className="flex flex-col">
                <h2 className="font-semibold">{rideData.driver.display_name}</h2>
              </div>
            </div>

            {/* Body rows */}
            <div className="mt-6 flex flex-col space-y-4 text-sm text-gray-600">
              <InfoRow
                icon={<ShieldCheckIcon className="h-5 w-5 text-blue-500" />}
                label="Verified Driver"
              />
              <Separator />
              <InfoRow
                icon={<CreditCardIcon className="h-5 w-5 text-gray-400" />}
                label="Your booking won't be confirmed until the driver approves your request"
              />
              <Separator />
              <InfoRow
                icon={<TruckIcon className="h-5 w-5 text-gray-400" />}
                label={rideData.vehicle_type}
              />
            </div>

            {/* CTA */}
            {isOwnRide ? (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 mb-3">
                  <InformationCircleIcon className="h-5 w-5" />
                  <span className="font-medium">This is Your Published Ride</span>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  You cannot book your own ride. You can manage this ride from your dashboard.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push('/rides')}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    Go to My Rides
                  </button>
                  <button
                    onClick={() => router.push(`/manage-ride/${rideData.ride_id}`)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                    title="Manage this ride"
                  >
                    Manage Ride
                  </button>
                </div>
              </div>
            ) : userBooking ? (
              <div className="mt-6">
                {userBooking.booking_status === 'approved' ? (
                  <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 mb-3">
                      <CheckBadgeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="font-medium text-sm sm:text-base">Booking Approved!</span>
                    </div>
                    
                    {/* Driver Contact Information */}
                    <div className="p-2 sm:p-4 mb-3">
                      <div className="w-full">
                        {rideData.driver.phone && (
                          <a 
                            href={`tel:${rideData.driver.phone}`}
                            className="flex items-center justify-center gap-2 bg-green-500 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-green-600 transition-colors font-medium text-sm sm:text-base w-full"
                          >
                            <PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="truncate">Call {rideData.driver.first_name || rideData.driver.display_name}</span>
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs sm:text-sm text-green-700">
                      Use the contact button above to coordinate pickup details. Seats booked: {userBooking.seats_booked}
                    </p>
                  </div>
                ) : userBooking.booking_status === 'pending' ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <span className="font-medium">Booking request pending</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Waiting for driver approval. Seats requested: {userBooking.seats_booked}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <XCircleIcon className="h-5 w-5" />
                      <span className="font-medium">Booking {userBooking.booking_status}</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      Your booking request was {userBooking.booking_status}.
                    </p>
                  </div>
                )}
              </div>
            ) : !showBookingForm && !bookingSuccess ? (
              <button 
                onClick={() => setShowBookingForm(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-500 px-6 py-2 text-sm font-medium text-white hover:bg-blue-600"
              >
                <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
                Connect&nbsp;with&nbsp;{rideData.driver.display_name.toLowerCase()}
              </button>
            ) : bookingSuccess ? (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckBadgeIcon className="h-5 w-5" />
                  <span className="font-medium">Booking request sent!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  The driver will review your request and respond soon.
                </p>
              </div>
            ) : (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">Request this ride</h4>
                
                {/* Additional check before showing form */}
                {isOwnRide ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">You cannot book your own ride.</p>
                  </div>
                ) : (
                  <>
                    {/* Seats Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of seats needed
                      </label>
                      <select
                        value={seatsRequested}
                        onChange={(e) => setSeatsRequested(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {Array.from({ length: Math.min(rideData.seats_available, 4) }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>
                            {num} seat{num > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Message Input */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message to driver (optional)
                      </label>
                      <textarea
                        value={bookingMessage}
                        onChange={(e) => setBookingMessage(e.target.value)}
                        placeholder="Hi! I'd like to book this ride. I'll be ready at the pickup time."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                        maxLength={500}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {bookingMessage.length}/500 characters
                      </p>
                    </div>

                    {/* Error Message */}
                    {bookingError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{bookingError}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleBookingSubmit}
                        disabled={submittingBooking || isOwnRide}
                        className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                      >
                        {submittingBooking ? 'Submitting...' : `Request ${seatsRequested} seat${seatsRequested > 1 ? 's' : ''}`}
                      </button>
                      <button
                        onClick={() => {
                          setShowBookingForm(false);
                          setBookingError(null);
                          setBookingMessage('');
                          setSeatsRequested(1);
                        }}
                        disabled={submittingBooking}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Booking Info */}
                    <div className="mt-3 text-xs text-gray-600">
                      <p>• Your booking request will be sent to the driver</p>
                      <p>• Total cost: ₹{rideData.price_per_seat * seatsRequested}</p>
                      <p>• You'll be notified when the driver responds</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Ride support chip */}
          <button 
            onClick={() => router.push('/info/contact-us')}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium shadow-sm hover:bg-gray-50"
          >
            <PhoneIcon className="h-5 w-5 text-gray-600" />
            Ride&nbsp;Support
          </button>
        </section>

        {/* ──────────────────────  RIGHT  ────────────────────── */}
        <aside className="w-full max-w-xs space-y-4">
          {/* Ride details card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">{formatDate(rideData.departure_time)}</h3>

            {/* Timeline */}
            <div className="mt-6 grid grid-cols-[auto_min-content_1fr] gap-x-3 text-sm">
              {/* Origin */}
              <span className="font-semibold">{formatTime(rideData.departure_time)}</span>
              <TimelineNode first />
              <Location
                city={rideData.origin_state}
                address={rideData.origin_state ? `${rideData.origin}, ${rideData.origin_state}` : rideData.origin}
              />

              {/* Show total duration when stops are hidden */}
              {!showAllStops && (
                <>
                  <span />
                  <TimelineDuration duration={totalDuration} />
                  <span />
                </>
              )}

              {/* Intermediate stops - conditionally rendered */}
              {showAllStops && rideData.stops.map((stop, index) => (
                <React.Fragment key={stop.stop_id}>
                  <span />
                  <TimelineDuration duration="~" />
                  <span />
                  
                  <span className="font-semibold"></span>
                  <TimelineNode />
                  <Location
                    city={stop.landmark || `Stop ${index + 1}`}
                    address="Intermediate stop"
                  />
                </React.Fragment>
              ))}

              {/* Show total duration when stops are visible */}
              {showAllStops && (
                <>
                  <span />
                  <TimelineDuration duration={totalDuration} />
                  <span />
                </>
              )}

              {/* Destination */}
              <span className="font-semibold">{formatTime(rideData.arrival_time)}</span>
              <TimelineNode last />
              <Location
                city={rideData.destination_state}
                address={rideData.destination_state ? `${rideData.destination}, ${rideData.destination_state}` : rideData.destination}
              />
            </div>

            {/* Show All Stops Button - only if there are stops */}
            {rideData.stops.length > 0 && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setShowAllStops(!showAllStops)}
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
                >
                  {showAllStops ? 'Hide Stops' : `Show All Stops (${rideData.stops.length})`}
                </button>
              </div>
            )}

            <Separator extra="my-6" />

            {/* Driver mini */}
            <div className="flex items-center gap-3">
              <TruckIcon className="h-6 w-6 text-gray-600" />
              <div className="flex items-center gap-1 text-sm">
                <span className="font-medium">{rideData.driver.display_name}</span>
              </div>
            </div>
          </div>

          {/* Fare / passenger chip */}
          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium shadow-sm">
            <span>{rideData.seats_available}&nbsp;seats available</span>
            <span className="text-lg font-semibold">
              ₹{rideData.price_per_seat}
            </span>
          </div>
        </aside>
      </div>
      <Footer />
    </>
  );
};

/* —————— tiny helpers —————— */

const InfoRow = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-start gap-3 leading-snug">
    {icon}
    <span>{label}</span>
  </div>
);

const Separator = ({ extra = 'my-4' }: { extra?: string }) => (
  <div className={`${extra} h-px w-full bg-gray-200`} />
);

/** Dot + connectors */
const TimelineNode = ({
  first,
  last,
}: {
  first?: boolean;
  last?: boolean;
}) => (
  <div className="flex flex-col items-center">
    {!first && <div className="flex-1 w-px bg-gray-400" />}
    <div className="z-[1] h-3 w-3 rounded-full border-2 border-gray-900 bg-white" />
    {!last && <div className="flex-1 w-px bg-gray-400" />}
  </div>
);

/** Middle segment with centred duration text */
const TimelineDuration = ({ duration }: { duration: string }) => (
  <div className="relative flex flex-col items-center">
    {/* vertical bar */}
    <div className="absolute inset-0 flex justify-center">
      <div className="w-px bg-gray-400" />
    </div>
    {/* duration label */}
    <span className="relative z-[1] bg-white px-1 text-xs text-gray-400 whitespace-nowrap">
      {duration}
    </span>
  </div>
);

const Location = ({
  city,
  address,
}: {
  city: string;
  address: string;
}) => (
  <div className="space-y-0.5">
    <p className="font-medium">{city}</p>
    <p className="text-xs text-gray-500">{address}</p>
  </div>
);


export default RideSummary;
