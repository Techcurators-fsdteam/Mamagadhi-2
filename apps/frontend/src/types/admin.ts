// Database type definitions based on the schema provided

export interface UserProfile {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  display_name: string;
  role?: string;
  is_email_verified?: boolean;
  is_phone_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  profile_url?: string;
}

export interface DriverProfile {
  user_profile_id: string;
  id_url: string;
  id_verified: boolean;
  dl_url: string;
  dl_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ride {
  ride_id: string;
  vehicle_type: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time?: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  status: string;
  created_at: string;
  updated_at: string;
  driver_id?: string;
  origin_state?: string;
  destination_state?: string;
}

export interface RideBooking {
  booking_id: string;
  ride_id: string;
  passenger_id: string;
  seats_booked: number;
  booking_status: string;
  created_at: string;
  updated_at: string;
  request_message: string;
  responded_at?: string;
}

export interface RideStop {
  stop_id: string;
  ride_id: string;
  sequence: number;
  landmark?: string;
}

// Extended types with joined data
export interface UserWithDriverProfile extends UserProfile {
  driver_profile?: DriverProfile;
}

export interface RideWithDriver extends Ride {
  driver?: UserProfile;
  stops?: RideStop[];
}

export interface BookingWithDetails extends RideBooking {
  passenger?: UserProfile;
  ride?: Ride;
}

// Admin data aggregation type
export interface AdminData {
  users: UserWithDriverProfile[];
  rides: RideWithDriver[];
  bookings: BookingWithDetails[];
}
