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
    const { driverId } = req.query;

    if (!driverId) {
      return res.status(400).json({
        error: 'Driver ID is required',
        details: 'Please provide driverId as a query parameter'
      });
    }

    console.log(`📋 Fetching rides for driver: ${driverId}`);

    // Fetch rides for the specific driver
    const { data: rides, error } = await supabase
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
        created_at,
        driver_id,
        origin_geog,
        destination_geog
      `)
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching driver rides:', error);
      return res.status(500).json({
        error: 'Failed to fetch rides',
        details: error.message
      });
    }

    console.log(`✅ Successfully fetched ${rides?.length || 0} rides for driver ${driverId}`);

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
        console.log(`📍 Found ${stops.length} stopovers for driver's rides`);
      }
    }

    // Group stops by ride_id for easier frontend processing
    const stopsByRide = stops.reduce((acc: any, stop: any) => {
      if (!acc[stop.ride_id]) {
        acc[stop.ride_id] = [];
      }
      acc[stop.ride_id].push(stop);
      return acc;
    }, {});

    // Add stops to each ride
    const ridesWithStops = rides?.map(ride => ({
      ...ride,
      stops: stopsByRide[ride.ride_id] || []
    })) || [];

    return res.status(200).json({
      success: true,
      count: rides?.length || 0,
      rides: ridesWithStops,
      driverId: driverId,
      message: `Found ${rides?.length || 0} rides for this driver`
    });

  } catch (error) {
    console.error('❌ Unexpected error in driver rides API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
