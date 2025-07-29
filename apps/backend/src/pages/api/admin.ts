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
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const { action, userId, documentType, verified } = req.body;

  if (!action) {
    return res.status(400).json({ 
      success: false, 
      error: 'Action is required' 
    });
  }

  try {
    switch (action) {
      case 'verify_document':
        if (!userId || !documentType || typeof verified !== 'boolean') {
          return res.status(400).json({ 
            success: false, 
            error: 'Missing required fields: userId, documentType, verified' 
          });
        }

        const updateField = documentType === 'id' ? 'id_verified' : 'dl_verified';
        
        const { error: updateError } = await supabase
          .from('driver_profiles')
          .update({ 
            [updateField]: verified,
            updated_at: new Date().toISOString() 
          })
          .eq('user_profile_id', userId);

        if (updateError) throw updateError;

        return res.status(200).json({ 
          success: true, 
          data: { message: `${documentType} verification updated successfully` }
        });

      case 'get_all_users':
        // Fetch all user profiles
        const { data: userProfiles, error: userError } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (userError) throw userError;

        // Fetch all driver profiles
        const { data: driverProfiles, error: driverError } = await supabase
          .from('driver_profiles')
          .select('*');

        if (driverError) throw driverError;

        // Combine the data
        const combinedData = userProfiles.map(userProfile => {
          const driverProfile = driverProfiles.find(dp => dp.user_profile_id === userProfile.id);
          return {
            userProfile,
            driverProfile
          };
        });

        return res.status(200).json({ 
          success: true, 
          data: combinedData 
        });

      case 'get_user_stats':
        const { data: allUsers, error: statsError } = await supabase
          .from('user_profiles')
          .select('role, is_email_verified, is_phone_verified');

        if (statsError) throw statsError;

        const { data: allDrivers, error: driversError } = await supabase
          .from('driver_profiles')
          .select('dl_verified, id_verified');

        if (driversError) throw driversError;

        const stats = {
          totalUsers: allUsers.length,
          totalDrivers: allUsers.filter(u => u.role === 'driver' || u.role === 'both').length,
          verifiedUsers: allUsers.filter(u => u.is_email_verified && u.is_phone_verified).length,
          driversWithDocs: allDrivers.length,
          verifiedDLs: allDrivers.filter(d => d.dl_verified).length,
          verifiedIDs: allDrivers.filter(d => d.id_verified).length
        };

        return res.status(200).json({ 
          success: true, 
          data: stats 
        });

      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid action' 
        });
    }
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
}
