import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rideId } = req.query;

  if (!rideId || typeof rideId !== 'string') {
    return res.status(400).json({ error: 'Valid ride ID is required' });
  }

  try {
    console.log('🔍 Fetching ride details for:', rideId);

    // Fetch ride details
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select(`
        ride_id,
        vehicle_type,
        origin,
        destination,
        origin_state,
        destination_state,
        departure_time,
        arrival_time,
        seats_total,
        seats_available,
        price_per_seat,
        status,
        driver_id,
        created_at,
        updated_at
      `)
      .eq('ride_id', rideId)
      .eq('status', 'open')
      .single();

    if (rideError) {
      console.error('❌ Error fetching ride:', rideError);
      return res.status(404).json({ error: 'Ride not found or unavailable' });
    }

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Fetch driver profile
    let driverProfile = null;
    if (ride.driver_id) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          user_id,
          first_name,
          last_name,
          display_name,
          phone,
          email,
          avatar_url
        `)
        .eq('user_id', ride.driver_id)
        .single();

      if (!profileError && profile) {
        driverProfile = profile;
      } else {
        console.warn('⚠️ Could not fetch driver profile:', profileError);
      }
    }

    const rideWithDriver = {
      ...ride,
      driver_profile: driverProfile
    };

    console.log('✅ Ride details fetched successfully');

    return res.status(200).json({
      success: true,
      ride: rideWithDriver
    });

  } catch (error) {
    console.error('❌ Unexpected error fetching ride details:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch ride details',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
