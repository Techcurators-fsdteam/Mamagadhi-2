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
    console.log('📥 Raw request body:', req.body);
    
    const {
      origin,
      destination,
      travelDate,
      passengersNeeded,
      vehiclePreferences,
      maxRadius = 30000 // 30km default radius for PostGIS search
    } = req.body;

    console.log('🌍 PostGIS Ride search request:', {
      origin: origin?.location,
      destination: destination?.location,
      coordinates: {
        origin: origin?.coordinates,
        destination: destination?.coordinates
      },
      travelDate,
      passengersNeeded,
      maxRadius: `${maxRadius/1000}km`
    });

    // Validate required fields
    if (!origin?.location || !destination?.location || !passengersNeeded) {
      console.log('❌ Validation failed:', {
        hasOriginLocation: !!origin?.location,
        hasDestinationLocation: !!destination?.location,
        hasPassengersNeeded: !!passengersNeeded,
        origin,
        destination,
        passengersNeeded
      });
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Origin, destination, and passengers needed are required',
        received: {
          origin: origin?.location || 'missing',
          destination: destination?.location || 'missing',
          passengersNeeded: passengersNeeded || 'missing'
        }
      });
    }

    let filteredRides = [];

    // Try PostGIS geographic search first if coordinates are available
    if (origin.coordinates && destination.coordinates) {
      const [originLng, originLat] = origin.coordinates;
      const [destLng, destLat] = destination.coordinates;
      
      console.log('🎯 Using PostGIS geographic search with 30km radius');

      // Calculate date range: ±7 days from selected date for flexible searching
      let startDate, endDate;
      if (travelDate) {
        const selectedDate = new Date(travelDate);
        const startDateObj = new Date(selectedDate);
        startDateObj.setDate(selectedDate.getDate() - 7); // 7 days before
        const endDateObj = new Date(selectedDate);
        endDateObj.setDate(selectedDate.getDate() + 7); // 7 days after
        
        startDate = startDateObj.toISOString().split('T')[0];
        endDate = endDateObj.toISOString().split('T')[0];
        
        console.log(`📅 Searching rides from ${startDate} to ${endDate} (±7 days from ${travelDate})`);
        console.log(`🔍 Date range filter: ${startDate}T00:00:00Z to ${endDate}T23:59:59Z`);
      }

      // Query rides with PostGIS data and enhanced driver details
      const { data: postgisRides, error: postgisError } = await supabase
        .from('rides')
        .select(`
          ride_id,
          vehicle_type,
          vehicle_number,
          vehicle_model,
          vehicle_color,
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
          destination_geog,
          pickup_points,
          drop_points,
          amenities,
          driver_notes,
          total_distance,
          estimated_duration,
          drivers!inner (
            user_id,
            first_name,
            last_name,
            display_name,
            profile_picture_url,
            phone_number,
            rating,
            total_rides,
            vehicle_registration_number
          )
        `)
        .eq('status', 'open')
        .gte('seats_available', passengersNeeded)
        .not('origin_geog', 'is', null)
        .not('destination_geog', 'is', null)
        .gte('departure_time', startDate ? `${startDate}T00:00:00Z` : '1900-01-01')
        .lte('departure_time', endDate ? `${endDate}T23:59:59Z` : '2100-12-31');

      if (!postgisError && postgisRides) {
        console.log(`🔍 Found ${postgisRides.length} rides with PostGIS data, filtering by radius...`);
        
        // Use PostGIS ST_DWithin to filter rides within radius
        for (const ride of postgisRides) {
          try {
            // Check if ride origin is within radius of search origin
            const { data: originWithinRadius } = await supabase
              .rpc('st_dwithin', {
                geog1: ride.origin_geog,
                geog2: `SRID=4326;POINT(${originLng} ${originLat})`,
                distance_meters: maxRadius
              });

            // Check if ride destination is within radius of search destination  
            const { data: destWithinRadius } = await supabase
              .rpc('st_dwithin', {
                geog1: ride.destination_geog,
                geog2: `SRID=4326;POINT(${destLng} ${destLat})`,
                distance_meters: maxRadius
              });

            if (originWithinRadius && destWithinRadius) {
              // Calculate exact distances for display
              const { data: originDistance } = await supabase
                .rpc('st_distance', {
                  geog1: ride.origin_geog,
                  geog2: `SRID=4326;POINT(${originLng} ${originLat})`
                });

              const { data: destDistance } = await supabase
                .rpc('st_distance', {
                  geog1: ride.destination_geog,
                  geog2: `SRID=4326;POINT(${destLng} ${destLat})`
                });

              const driverInfo = (ride as any).drivers?.[0] || {};
              filteredRides.push({
                ...ride,
                distances: {
                  origin_km: Math.round((originDistance || 0) / 1000 * 10) / 10,
                  destination_km: Math.round((destDistance || 0) / 1000 * 10) / 10,
                  total_km: Math.round(((originDistance || 0) + (destDistance || 0)) / 1000 * 10) / 10
                },
                driver: {
                  user_id: driverInfo.user_id || ride.driver_id,
                  display_name: driverInfo.display_name || `${driverInfo.first_name || ''} ${driverInfo.last_name || ''}`.trim() || 'Driver',
                  first_name: driverInfo.first_name || '',
                  last_name: driverInfo.last_name || '',
                  profile_picture_url: driverInfo.profile_picture_url || null,
                  phone_number: driverInfo.phone_number || '',
                  rating: driverInfo.rating || 0,
                  total_rides: driverInfo.total_rides || 0
                },
                vehicle: {
                  type: ride.vehicle_type,
                  number: ride.vehicle_number || driverInfo.vehicle_registration_number,
                  model: ride.vehicle_model || '',
                  color: ride.vehicle_color || ''
                }
              });

              console.log(`✅ PostGIS match: ${ride.origin} → ${ride.destination} (${Math.round((originDistance || 0) / 1000)}km + ${Math.round((destDistance || 0) / 1000)}km)`);
            }
          } catch (postgisError) {
            console.log('PostGIS function failed, falling back to text matching for ride:', ride.ride_id);
            // Fall back to text-based matching for this ride
            const textMatch = checkTextMatch(ride, origin, destination);
            if (textMatch) {
              const driverInfo = (ride as any).drivers?.[0] || {};
              filteredRides.push({
                ...ride,
                distances: null,
                driver: {
                  user_id: driverInfo.user_id || ride.driver_id,
                  display_name: driverInfo.display_name || `${driverInfo.first_name || ''} ${driverInfo.last_name || ''}`.trim() || 'Driver',
                  first_name: driverInfo.first_name || '',
                  last_name: driverInfo.last_name || '',
                  profile_picture_url: driverInfo.profile_picture_url || null,
                  phone_number: driverInfo.phone_number || '',
                  rating: driverInfo.rating || 0,
                  total_rides: driverInfo.total_rides || 0
                },
                vehicle: {
                  type: ride.vehicle_type,
                  number: ride.vehicle_number || driverInfo.vehicle_registration_number,
                  model: ride.vehicle_model || '',
                  color: ride.vehicle_color || ''
                }
              });
            }
          }
        }

        console.log(`✅ PostGIS found ${filteredRides.length} rides within ${maxRadius/1000}km radius`);
      } else {
        console.log('⚠️ PostGIS query failed:', postgisError?.message);
      }
    }

    // If PostGIS didn't find results or coordinates not available, use text-based search
    if (filteredRides.length === 0) {
      console.log('🔤 Using text-based location search as fallback');

      let textQuery = supabase
        .from('rides')
        .select(`
          ride_id,
          vehicle_type,
          vehicle_number,
          vehicle_model,
          vehicle_color,
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
          pickup_points,
          drop_points,
          amenities,
          driver_notes,
          total_distance,
          estimated_duration,
          drivers!inner (
            user_id,
            first_name,
            last_name,
            display_name,
            profile_picture_url,
            phone_number,
            rating,
            total_rides,
            vehicle_registration_number
          )
        `)
        .eq('status', 'open')
        .gte('seats_available', passengersNeeded);

      // Add date range filter if provided (±7 days)
      if (travelDate) {
        const selectedDate = new Date(travelDate);
        const startDateObj = new Date(selectedDate);
        startDateObj.setDate(selectedDate.getDate() - 7);
        const endDateObj = new Date(selectedDate);
        endDateObj.setDate(selectedDate.getDate() + 7);
        
        const startDate = startDateObj.toISOString().split('T')[0];
        const endDate = endDateObj.toISOString().split('T')[0];
        
        console.log(`📅 Text search: searching rides from ${startDate} to ${endDate} (±7 days from ${travelDate})`);
        console.log(`🔍 Text search date filter: ${startDate}T00:00:00Z to ${endDate}T23:59:59Z`);
        
        textQuery = textQuery
          .gte('departure_time', `${startDate}T00:00:00Z`)
          .lte('departure_time', `${endDate}T23:59:59Z`);
      }

      // Add vehicle type filter if specified
      if (vehiclePreferences && vehiclePreferences.length > 0) {
        textQuery = textQuery.in('vehicle_type', vehiclePreferences);
      }

      const { data: textRides, error: textError } = await textQuery;

      if (!textError && textRides) {
        // Apply text-based location matching
        filteredRides = textRides
          .filter((ride: any) => checkTextMatch(ride, origin, destination))
          .map((ride: any) => {
            const driverInfo = ride.drivers?.[0] || {};
            return {
              ...ride,
              distances: null,
              driver: {
                user_id: driverInfo.user_id || ride.driver_id,
                display_name: driverInfo.display_name || `${driverInfo.first_name || ''} ${driverInfo.last_name || ''}`.trim() || 'Driver',
                first_name: driverInfo.first_name || '',
                last_name: driverInfo.last_name || '',
                profile_picture_url: driverInfo.profile_picture_url || null,
                phone_number: driverInfo.phone_number || '',
                rating: driverInfo.rating || 0,
                total_rides: driverInfo.total_rides || 0
              },
              vehicle: {
                type: ride.vehicle_type,
                number: ride.vehicle_number || driverInfo.vehicle_registration_number,
                model: ride.vehicle_model || '',
                color: ride.vehicle_color || ''
              }
            };
          });

        console.log(`✅ Text-based search found ${filteredRides.length} matching rides`);
      }
    }

    // Sort rides by relevance
    const sortedRides = filteredRides.sort((a: any, b: any) => {
      // Prioritize PostGIS matches with distance data
      if (a.distances && !b.distances) return -1;
      if (!a.distances && b.distances) return 1;
      
      // Sort by total distance if both have PostGIS data
      if (a.distances && b.distances) {
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
          searchRadius: maxRadius / 1000,
          searchDate: travelDate || 'Any date',
          passengersNeeded,
          usedPostGIS: sortedRides.some(r => r.distances !== null),
          searchMethod: filteredRides.some(r => r.distances) ? 'PostGIS Geographic (30km radius)' : 'Text-based'
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
function checkTextMatch(ride: any, origin: any, destination: any): boolean {
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

  const result = originMatch && destMatch;
  
  if (result) {
    console.log(`✅ Text match: ${ride.origin} → ${ride.destination}`);
  }

  return result;
}
