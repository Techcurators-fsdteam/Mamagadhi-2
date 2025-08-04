import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📋 Fetching latest rides from database...');

    // Fetch the latest 10 rides with their details
    const { data: rides, error } = await supabase
      .from('rides')
      .select(`
        ride_id,
        vehicle_type,
        origin,
        destination,
        departure_time,
        arrival_time,
        seats_total,
        seats_available,
        price_per_seat,
        status,
        created_at,
        driver_id,
        origin_geog,
        destination_geog
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching rides:', error);
      return res.status(500).json({
        error: 'Failed to fetch rides',
        details: error.message
      });
    }

    console.log(`✅ Successfully fetched ${rides?.length || 0} rides`);

    // Also fetch ride stops for these rides
    const rideIds = rides?.map(ride => ride.ride_id) || [];
    let stops = [];
    
    if (rideIds.length > 0) {
      const { data: rideStops, error: stopsError } = await supabase
        .from('ride_stops')
        .select('*')
        .in('ride_id', rideIds)
        .order('sequence');

      if (!stopsError) {
        stops = rideStops || [];
        console.log(`📍 Found ${stops.length} stopovers for these rides`);
      }
    }

    return res.status(200).json({
      success: true,
      count: rides?.length || 0,
      rides: rides || [],
      stops: stops,
      message: `Found ${rides?.length || 0} rides in database`
    });

  } catch (error) {
    console.error('❌ Unexpected error in rides list API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
