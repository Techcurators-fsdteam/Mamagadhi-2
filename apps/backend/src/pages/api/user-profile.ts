import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from 'shared-types';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'User ID is required' 
    });
  }

  try {
    if (req.method === 'GET') {
      // Get user profile with driver profile data
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        throw userError;
      }

      const { data: driverProfile, error: driverError } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('user_profile_id', userId)
        .single();

      // Driver profile might not exist, that's ok
      if (driverError && driverError.code !== 'PGRST116') {
        throw driverError;
      }

      return res.status(200).json({
        success: true,
        data: {
          userProfile,
          driverProfile
        }
      });

    } else if (req.method === 'PUT') {
      // Update user profile
      const updates = req.body;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        data
      });

    } else {
      return res.status(405).json({ 
        success: false, 
        error: 'Method not allowed' 
      });
    }

  } catch (error) {
    console.error('User profile API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
