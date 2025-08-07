import { supabase } from './supabase';
import { UserWithDriverProfile, RideWithDriver, BookingWithDetails, AdminData } from '../types/admin';

// Check if user is admin using ONLY Supabase auth (no database checks)
export const checkAdminAccess = async (): Promise<boolean> => {
  if (!supabase) {
    console.error('Supabase not configured');
    return false;
  }

  try {
    // Simply check if user is authenticated with Supabase
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting Supabase user:', error);
      return false;
    }

    // If user exists in Supabase auth, they are admin
    const isAdmin = !!user;
    console.log('Supabase user:', user?.email, 'Is admin:', isAdmin);
    return isAdmin;
    
  } catch (error) {
    console.error('Error checking Supabase auth:', error);
    return false;
  }
};

// Fetch all users with driver profiles
export const fetchAllUsersWithDriverProfiles = async (): Promise<UserWithDriverProfile[]> => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      driver_profile:driver_profiles(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users with driver profiles:', error);
    throw error;
  }

  return data || [];
};

// Fetch all rides with driver information and stops
export const fetchAllRidesWithDetails = async (): Promise<RideWithDriver[]> => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('rides')
    .select(`
      *,
      driver:user_profiles(id, first_name, last_name, display_name, email),
      stops:ride_stops(stop_id, sequence, landmark)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching rides with details:', error);
    throw error;
  }

  // Sort stops by sequence for each ride
  const ridesWithSortedStops = data?.map(ride => ({
    ...ride,
    stops: ride.stops?.sort((a: any, b: any) => a.sequence - b.sequence) || []
  })) || [];

  return ridesWithSortedStops;
};

// Fetch all bookings with passenger and ride details
export const fetchAllBookingsWithDetails = async (): Promise<BookingWithDetails[]> => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('ride_bookings')
    .select(`
      *,
      passenger:user_profiles(id, first_name, last_name, display_name, email),
      ride:rides(ride_id, origin, destination, departure_time, vehicle_type)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookings with details:', error);
    throw error;
  }

  return data || [];
};

// Update driver document verification status
export const updateDriverVerification = async (
  userProfileId: string,
  field: 'id_verified' | 'dl_verified',
  status: boolean
): Promise<void> => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('driver_profiles')
    .update({ 
      [field]: status,
      updated_at: new Date().toISOString()
    })
    .eq('user_profile_id', userProfileId);

  if (error) {
    console.error(`Error updating ${field}:`, error);
    throw error;
  }
};

// Update booking status
export const updateBookingStatus = async (
  bookingId: string,
  status: string
): Promise<void> => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('ride_bookings')
    .update({ 
      booking_status: status,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('booking_id', bookingId);

  if (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};

// Fetch complete admin data
export const fetchAdminData = async (): Promise<AdminData> => {
  const [users, rides, bookings] = await Promise.all([
    fetchAllUsersWithDriverProfiles(),
    fetchAllRidesWithDetails(),
    fetchAllBookingsWithDetails()
  ]);

  return {
    users,
    rides,
    bookings
  };
};

// Subscribe to real-time updates for admin data
export const subscribeToAdminUpdates = (
  onUserUpdate: (payload: any) => void,
  onRideUpdate: (payload: any) => void,
  onBookingUpdate: (payload: any) => void,
  onDriverProfileUpdate: (payload: any) => void
) => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const userSubscription = supabase
    .channel('user_profiles_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'user_profiles' }, 
      onUserUpdate
    )
    .subscribe();

  const rideSubscription = supabase
    .channel('rides_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'rides' }, 
      onRideUpdate
    )
    .subscribe();

  const bookingSubscription = supabase
    .channel('bookings_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'ride_bookings' }, 
      onBookingUpdate
    )
    .subscribe();

  const driverProfileSubscription = supabase
    .channel('driver_profiles_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'driver_profiles' }, 
      onDriverProfileUpdate
    )
    .subscribe();

  return () => {
    userSubscription.unsubscribe();
    rideSubscription.unsubscribe();
    bookingSubscription.unsubscribe();
    driverProfileSubscription.unsubscribe();
  };
};
