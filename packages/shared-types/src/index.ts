export interface UserProfile {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  display_name: string;
  role: 'driver' | 'passenger' | 'both';
  is_email_verified: boolean;
  is_phone_verified: boolean;
  created_at: string;
  updated_at: string;
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

export interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
