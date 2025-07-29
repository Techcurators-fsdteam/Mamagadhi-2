import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// User profile interface
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
  // Add any additional optional fields here if needed, e.g.:
  photo_url?: string;
  profile_url?: string;
}

// Function to create user profile - direct Supabase call for local dev
export const createUserProfile = async (userData: Omit<UserProfile, 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([{
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating user profile:', error)
    throw new Error(`Failed to create user profile: ${error.message}`)
  }

  return data
}

// Function to get user profile - direct Supabase call for local dev
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error }: { data: UserProfile | null; error: unknown } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }

  return data;
}

// Function to update user profile - direct Supabase call for local dev
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    throw error
  }

  return data
}
