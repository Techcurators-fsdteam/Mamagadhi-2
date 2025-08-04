import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      origin,
      destination,
      travelDate,
      passengersNeeded,
      vehiclePreferences,
      maxRadius = 30000 // 30km default radius
    } = req.body;

    console.log('🔍 PostGIS Ride search request:', {
      origin: origin?.location,
      destination: destination?.location,
      coordinates: {
        origin: origin?.coordinates,
        destination: destination?.coordinates
      },
      travelDate,
      passengersNeeded,
      vehiclePreferences,
      maxRadius
    });

    // Validate required fields
    if (!origin?.location || !destination?.location || !passengersNeeded) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Origin, destination, and passengers needed are required'
      });
    }

    // Build the base query
    let query = supabase
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
      .eq('status', 'open')
      .gte('seats_available', passengersNeeded);

    // Add date filter if provided
    if (travelDate) {
      const startOfDay = `${travelDate}T00:00:00Z`;
      const endOfDay = `${travelDate}T23:59:59Z`;
      query = query
        .gte('departure_time', startOfDay)
        .lte('departure_time', endOfDay);
    }

    // Add vehicle type filter if specified
    if (vehiclePreferences && vehiclePreferences.length > 0) {
      query = query.in('vehicle_type', vehiclePreferences);
    }

    const { data: rides, error: ridesError } = await query;

    if (ridesError) {
      console.error('❌ Error searching rides:', ridesError);
      return res.status(500).json({
        error: 'Failed to search rides',
        details: ridesError.message
      });
    }

    console.log(`✅ Found ${rides?.length || 0} potential rides`);

    // Apply PostGIS geographic filtering and text-based fallback
    const filteredRides = [];
    
    for (const ride of rides || []) {
      try {
        console.log(`🔍 Processing ride ${ride.ride_id}:`, {
          ride_origin: ride.origin,
          ride_destination: ride.destination,
          has_postgis_data: {
            origin: !!ride.origin_geog,
            destination: !!ride.destination_geog
          }
        });

        let includeRide = false;
        let distances = null;

        // PostGIS geographic matching if coordinates are available
        if (origin.coordinates && destination.coordinates) {
          const [originLng, originLat] = origin.coordinates;
          const [destLng, destLat] = destination.coordinates;

          // Check if ride has PostGIS geographic data
          if (ride.origin_geog && ride.destination_geog) {
            // Use PostGIS ST_Distance to calculate actual distances
            try {
              const { data: distanceData, error: distanceError } = await supabase
                .rpc('calculate_ride_distance', {
                  ride_id: ride.ride_id,
                  search_origin_lng: originLng,
                  search_origin_lat: originLat,
                  search_dest_lng: destLng,
                  search_dest_lat: destLat,
                  max_radius_meters: maxRadius
                });

              if (!distanceError && distanceData) {
                const { origin_distance_m, dest_distance_m, within_radius } = distanceData;
                
                if (within_radius) {
                  includeRide = true;
                  distances = {
                    origin_km: Math.round(origin_distance_m / 1000 * 10) / 10,
                    destination_km: Math.round(dest_distance_m / 1000 * 10) / 10,
                    total_km: Math.round((origin_distance_m + dest_distance_m) / 1000 * 10) / 10
                  };
                  console.log('✅ PostGIS match within radius:', distances);
                }
              } else {
                console.log('⚠️ PostGIS distance calculation failed, falling back to text matching');
                includeRide = await textBasedMatching(ride, origin, destination);
              }
            } catch (error) {
              console.log('⚠️ PostGIS function not available, falling back to text matching');
              includeRide = await textBasedMatching(ride, origin, destination);
            }
          } else {
            // No PostGIS data for this ride, use text-based matching
            includeRide = await textBasedMatching(ride, origin, destination);
          }
        } else {
          // No coordinates provided, use text-based matching only
          includeRide = await textBasedMatching(ride, origin, destination);
        }

        if (includeRide) {
          filteredRides.push({
            ...ride,
            distances,
            driver: {
              display_name: 'Driver',
              first_name: '',
              last_name: '',
              profile_url: null
            }
          });
        }
      } catch (error) {
        console.error('Error processing ride:', ride.ride_id, error);
      }
    }

    // Sort rides by relevance
    const sortedRides = filteredRides.sort((a: any, b: any) => {
      // Prioritize PostGIS matches with distance data
      if (a.distances && !b.distances) return -1;
      if (!a.distances && b.distances) return 1;
      
      // Sort by total distance if both have PostGIS data
      if (a.distances && b.distances && 
          typeof a.distances.total_km === 'number' && 
          typeof b.distances.total_km === 'number') {
        return a.distances.total_km - b.distances.total_km;
      }
      
      // Sort by available seats
      if (a.seats_available !== b.seats_available) {
        return b.seats_available - a.seats_available;
      }
      
      // Sort by departure time
      return new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
    });

    console.log(`🎯 Returning ${sortedRides.length} matching rides`);

    return res.status(200).json({
      success: true,
      results: {
        rides: sortedRides,
        metadata: {
          totalFound: sortedRides.length,
          searchRadius: maxRadius / 1000, // Convert to km
          searchDate: travelDate || 'Any date',
          passengersNeeded,
          usedPostGIS: sortedRides.some(r => r.distances)
        }
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in ride search:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Helper function for text-based location matching
async function textBasedMatching(ride: any, origin: any, destination: any): Promise<boolean> {
  const originMatch = 
    (ride.origin_state && origin.state && 
      (ride.origin_state.toLowerCase().includes(origin.state.toLowerCase()) ||
       origin.state.toLowerCase().includes(ride.origin_state.toLowerCase()) ||
       // Handle Delhi variations
       (origin.state.toLowerCase().includes('delhi') && ride.origin_state.toLowerCase().includes('delhi')) ||
       // Handle NCR region
       (origin.state.toLowerCase().includes('haryana') && ride.origin_state.toLowerCase().includes('delhi')) ||
       (origin.state.toLowerCase().includes('delhi') && ride.origin_state.toLowerCase().includes('haryana'))
      )) ||
    (ride.origin && origin.location && ride.origin.toLowerCase().includes(origin.location.toLowerCase())) ||
    (origin.location && ride.origin_state && origin.location.toLowerCase().includes(ride.origin_state.toLowerCase())) ||
    (origin.location && ride.origin && ride.origin.toLowerCase().includes(origin.location.toLowerCase()));

  const destMatch = 
    (ride.destination_state && destination.state && 
      (ride.destination_state.toLowerCase().includes(destination.state.toLowerCase()) ||
       destination.state.toLowerCase().includes(ride.destination_state.toLowerCase()) ||
       // Handle Punjab/Mohali/Chandigarh region
       (destination.state.toLowerCase().includes('punjab') && ride.destination_state.toLowerCase().includes('mohali')) ||
       (destination.state.toLowerCase().includes('mohali') && ride.destination_state.toLowerCase().includes('punjab')) ||
       (destination.location && destination.location.toLowerCase().includes('landran') && ride.destination.toLowerCase().includes('landran'))
      )) ||
    (ride.destination && destination.location && ride.destination.toLowerCase().includes(destination.location.toLowerCase())) ||
    (destination.location && ride.destination_state && destination.location.toLowerCase().includes(ride.destination_state.toLowerCase())) ||
    (destination.location && ride.destination && ride.destination.toLowerCase().includes(destination.location.toLowerCase()));

  console.log(`🎯 Text-based match for ride ${ride.ride_id}:`, {
    originMatch,
    destMatch,
    willInclude: originMatch && destMatch
  });

  return originMatch && destMatch;
}
