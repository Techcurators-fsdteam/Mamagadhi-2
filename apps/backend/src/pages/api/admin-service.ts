import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Enable CORS for all admin endpoints
const enableCors = (res: NextApiResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  enableCors(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { action, adminKey, userId, documentType, verified } = req.body;

      // Simple admin authentication
      if (adminKey !== process.env.ADMIN_SECRET_KEY) {
        return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
      }

      switch (action) {
        case 'authenticate':
          return res.status(200).json({ success: true, message: 'Admin authenticated' });

        case 'getStats':
          const statsResult = await getAdminStats();
          return res.status(200).json(statsResult);

        case 'getUsers':
          const usersResult = await getAllUsers();
          return res.status(200).json(usersResult);

        case 'updateVerification':
          const updateResult = await updateUserVerification(userId, documentType, verified);
          return res.status(200).json(updateResult);

        default:
          return res.status(400).json({ success: false, error: 'Invalid action' });
      }
    } catch (error) {
      console.error('Admin API error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function getAdminStats() {
  try {
    // Fetch all user profiles for stats
    const { data: allUsers, error: statsError } = await supabase
      .from('user_profiles')
      .select('role, is_email_verified, is_phone_verified');

    if (statsError) throw statsError;

    // Fetch all driver profiles for stats
    const { data: allDrivers, error: driversError } = await supabase
      .from('driver_profiles')
      .select('dl_verified, id_verified');

    if (driversError) throw driversError;

    const stats = {
      totalUsers: allUsers?.length || 0,
      totalDrivers: allUsers?.filter(u => u.role === 'driver' || u.role === 'both').length || 0,
      verifiedUsers: allUsers?.filter(u => u.is_email_verified && u.is_phone_verified).length || 0,
      driversWithDocs: allDrivers?.length || 0,
      verifiedDLs: allDrivers?.filter(d => d.dl_verified).length || 0,
      verifiedIDs: allDrivers?.filter(d => d.id_verified).length || 0
    };

    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch stats' };
  }
}

async function getAllUsers() {
  try {
    // Fetch user profiles with their associated driver profiles
    const { data: userProfiles, error: userError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        driver_profiles (*)
      `)
      .order('created_at', { ascending: false });

    if (userError) throw userError;

    const combinedUsers = userProfiles?.map(user => ({
      userProfile: user,
      driverProfile: user.driver_profiles?.[0] || undefined
    })) || [];

    return { success: true, data: combinedUsers };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch users' };
  }
}

async function updateUserVerification(userId: string, documentType: 'id' | 'dl', verified: boolean) {
  try {
    const updateField = documentType === 'id' ? 'id_verified' : 'dl_verified';
    
    const { error } = await supabase
      .from('driver_profiles')
      .update({ [updateField]: verified })
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true, message: `${documentType.toUpperCase()} verification updated successfully` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update verification' };
  }
}
