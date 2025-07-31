import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from 'shared-types';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<{ 
    isVerified: boolean; 
    hasProfile: boolean; 
    verificationStatus: {
      idVerified: boolean;
      dlVerified: boolean;
    }
  }>>
) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'User ID is required' 
    });
  }

  try {
    // Check if driver profile exists and get verification status
    const { data: driverProfile, error: driverError } = await supabase
      .from('driver_profiles')
      .select('id_verified, dl_verified')
      .eq('user_profile_id', userId)
      .single();

    if (driverError && driverError.code !== 'PGRST116') {
      throw driverError;
    }

    const hasProfile = !!driverProfile;
    const verificationStatus = {
      idVerified: driverProfile?.id_verified || false,
      dlVerified: driverProfile?.dl_verified || false
    };
    
    const isVerified = hasProfile && verificationStatus.idVerified && verificationStatus.dlVerified;

    return res.status(200).json({
      success: true,
      data: {
        isVerified,
        hasProfile,
        verificationStatus
      }
    });

  } catch (error) {
    console.error('Verification check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check verification status'
    });
  }
}
