import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ParsedLocation {
  state: string;
  city_or_region: string;
  locality_or_landmark: string;
}

interface RideMatch {
  ride_id: string;
  vehicle_type: string;
  origin: string;
  destination: string;
  origin_state: string;
  destination_state: string;
  departure_time: string;
  arrival_time: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  status: string;
  created_at: string;
  driver_id: string;
  driver: {
    display_name: string;
    first_name: string;
    last_name: string;
    profile_picture_url: string | null;
  };
  match_percentage: number;
  match_reason: string;
  stopovers?: Array<{
    landmark: string;
    sequence: number;
  }>;
}

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
      passengersNeeded
    } = req.body;

    console.log('🔍 Custom Ride Search Request:', {
      origin: origin?.location,
      destination: destination?.location,
      passengersNeeded
    });

    // Validate required fields
    if (!origin?.location || !destination?.location || !passengersNeeded) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Origin, destination, and passengers needed are required'
      });
    }

    // Parse Mapbox query format: "Locality, City, State, Country"
    const parsedOrigin = parseMapboxQuery(origin.location);
    const parsedDestination = parseMapboxQuery(destination.location);

    console.log('📍 Parsed locations:', {
      origin: parsedOrigin,
      destination: parsedDestination
    });

    // Fetch all open rides with driver information and stopovers
    const { data: rides, error: ridesError } = await supabase
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
        driver_id
        `)
        .eq('status', 'open')
      .gte('seats_available', passengersNeeded);

    if (ridesError) {
      console.error('❌ Error fetching rides:', ridesError);
      return res.status(500).json({
        error: 'Failed to fetch rides',
        details: ridesError.message
      });
    }

    console.log(`🔍 Found ${rides?.length || 0} potential rides, applying location matching...`);

    // Get ride IDs to fetch stopovers
    const rideIds = rides?.map(ride => ride.ride_id) || [];
    let stopovers: any[] = [];
    
    if (rideIds.length > 0) {
      const { data: rideStops, error: stopsError } = await supabase
        .from('ride_stops')
        .select('*')
        .in('ride_id', rideIds)
        .order('sequence');

      if (!stopsError) {
        stopovers = rideStops || [];
        console.log(`📍 Found ${stopovers.length} stopovers for matching`);
      }
    }

    // Group stopovers by ride_id for easy lookup
    const stopoversByRide = stopovers.reduce((acc: any, stop: any) => {
      if (!acc[stop.ride_id]) {
        acc[stop.ride_id] = [];
      }
      acc[stop.ride_id].push(stop);
      return acc;
    }, {});

    // Apply location-based matching logic
    const matchedRides: RideMatch[] = [];

    for (const ride of rides || []) {
      const rideStopovers = stopoversByRide[ride.ride_id] || [];
      
      const matchResult = calculateLocationMatch(
        ride,
        rideStopovers,
        parsedOrigin,
        parsedDestination
      );

      if (matchResult.match_percentage >= 45) {
        // Get driver information from user_profiles table
        let driverInfo = {
          display_name: 'Driver',
          first_name: '',
          last_name: '',
          profile_picture_url: null
        };

        if (ride.driver_id) {
          try {
            const { data: driver, error: driverError } = await supabase
              .from('user_profiles')
              .select('display_name, first_name, last_name, profile_url')
              .eq('id', ride.driver_id)
              .single();

            if (!driverError && driver) {
              driverInfo = {
                display_name: driver.display_name || `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || 'Driver',
                first_name: driver.first_name || '',
                last_name: driver.last_name || '',
                profile_picture_url: driver.profile_url || null
              };
            }
          } catch (error) {
            console.warn('Failed to fetch driver info for ride:', ride.ride_id, error);
          }
        }
        
        matchedRides.push({
              ...ride,
          driver: driverInfo,
          match_percentage: matchResult.match_percentage,
          match_reason: matchResult.reason,
          stopovers: rideStopovers.map((stop: any) => ({
            landmark: stop.landmark,
            sequence: stop.sequence
          }))
        });
      }
    }

    // Sort rides by match percentage (descending)
    const sortedRides = matchedRides.sort((a, b) => b.match_percentage - a.match_percentage);

    console.log(`🎯 Returning ${sortedRides.length} matching rides`);

    return res.status(200).json({
      success: true,
      results: {
        rides: sortedRides,
        metadata: {
          totalFound: sortedRides.length,
          passengersNeeded,
          searchMethod: 'Custom Location-Based Matching'
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

// Parse Mapbox query format: "Locality, City, State, Country"
function parseMapboxQuery(locationString: string): ParsedLocation {
  const parts = locationString.split(',').map(part => part.trim());
  
  // Reverse the array: ["Connaught Place", "New Delhi", "Delhi", "India"] -> ["India", "Delhi", "New Delhi", "Connaught Place"]
  const reversed = parts.reverse();
  
  return {
    state: reversed[1] || '', // Second item (Delhi) - this is the state
    city_or_region: reversed[2] || '', // Third item (New Delhi) - this is the city/region
    locality_or_landmark: reversed[3] || '' // Fourth item (Connaught Place) - this is the landmark
  };
}

// Helper function to check if two states match (handles variations)
function statesMatch(state1: string, state2: string): boolean {
  if (!state1 || !state2) return false;
  
  const s1 = state1.toLowerCase().trim();
  const s2 = state2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return true;
  
  // Handle common variations and abbreviations - more strict matching
  const variations: { [key: string]: string[] } = {
    // Delhi variations
    'delhi': ['new delhi', 'delhi', 'ncr'],
    'new delhi': ['delhi', 'new delhi', 'ncr'],
    'ncr': ['delhi', 'new delhi', 'ncr'],
    
    // Rajasthan variations
    'rajasthan': ['jaipur', 'rajasthan'],
    'jaipur': ['rajasthan', 'jaipur'],
    
    // Punjab variations
    'punjab': ['chandigarh', 'punjab', 'mohali'],
    'chandigarh': ['punjab', 'chandigarh', 'mohali'],
    'mohali': ['punjab', 'chandigarh', 'mohali'],
    
    // Maharashtra variations
    'maharashtra': ['mumbai', 'maharashtra'],
    'mumbai': ['maharashtra', 'mumbai'],
    
    // Karnataka variations
    'karnataka': ['bangalore', 'bengaluru', 'karnataka'],
    'bangalore': ['karnataka', 'bangalore', 'bengaluru'],
    'bengaluru': ['karnataka', 'bangalore', 'bengaluru'],
    
    // Tamil Nadu variations
    'tamil nadu': ['chennai', 'tamil nadu'],
    'chennai': ['tamil nadu', 'chennai'],
    
    // Kerala variations
    'kerala': ['kochi', 'trivandrum', 'kerala'],
    'kochi': ['kerala', 'kochi', 'trivandrum'],
    'trivandrum': ['kerala', 'kochi', 'trivandrum'],
    
    // Gujarat variations
    'gujarat': ['ahmedabad', 'surat', 'gujarat'],
    'ahmedabad': ['gujarat', 'ahmedabad', 'surat'],
    'surat': ['gujarat', 'ahmedabad', 'surat'],
    
    // Uttar Pradesh variations
    'uttar pradesh': ['lucknow', 'kanpur', 'uttar pradesh'],
    'lucknow': ['uttar pradesh', 'lucknow', 'kanpur'],
    'kanpur': ['uttar pradesh', 'lucknow', 'kanpur'],
    
    // Madhya Pradesh variations
    'madhya pradesh': ['bhopal', 'indore', 'madhya pradesh'],
    'bhopal': ['madhya pradesh', 'bhopal', 'indore'],
    'indore': ['madhya pradesh', 'bhopal', 'indore'],
    
    // Bihar variations
    'bihar': ['patna', 'bihar'],
    'patna': ['bihar', 'patna'],
    
    // West Bengal variations
    'west bengal': ['kolkata', 'calcutta', 'west bengal'],
    'kolkata': ['west bengal', 'kolkata', 'calcutta'],
    'calcutta': ['west bengal', 'kolkata', 'calcutta'],
    
    // Andhra Pradesh variations
    'andhra pradesh': ['hyderabad', 'vijayawada', 'andhra pradesh'],
    'hyderabad': ['andhra pradesh', 'hyderabad', 'vijayawada'],
    'vijayawada': ['andhra pradesh', 'hyderabad', 'vijayawada'],
    
    // Telangana variations
    'telangana': ['hyderabad', 'telangana'],
    
    // Odisha variations
    'odisha': ['bhubaneswar', 'cuttack', 'odisha', 'orissa'],
    'bhubaneswar': ['odisha', 'bhubaneswar', 'cuttack', 'orissa'],
    'orissa': ['odisha', 'bhubaneswar', 'cuttack', 'orissa'],
    
    // Jharkhand variations
    'jharkhand': ['ranchi', 'jamshedpur', 'jharkhand'],
    'ranchi': ['jharkhand', 'ranchi', 'jamshedpur'],
    'jamshedpur': ['jharkhand', 'ranchi', 'jamshedpur'],
    
    // Chhattisgarh variations
    'chhattisgarh': ['raipur', 'bilaspur', 'chhattisgarh'],
    'raipur': ['chhattisgarh', 'raipur', 'bilaspur'],
    'bilaspur': ['chhattisgarh', 'raipur', 'bilaspur'],
    
    // Assam variations
    'assam': ['guwahati', 'assam'],
    'guwahati': ['assam', 'guwahati'],
    
    // Manipur variations
    'manipur': ['imphal', 'manipur'],
    'imphal': ['manipur', 'imphal'],
    
    // Meghalaya variations
    'meghalaya': ['shillong', 'meghalaya'],
    'shillong': ['meghalaya', 'shillong'],
    
    // Mizoram variations
    'mizoram': ['aizawl', 'mizoram'],
    'aizawl': ['mizoram', 'aizawl'],
    
    // Nagaland variations
    'nagaland': ['kohima', 'nagaland'],
    'kohima': ['nagaland', 'kohima'],
    
    // Tripura variations
    'tripura': ['agartala', 'tripura'],
    'agartala': ['tripura', 'agartala'],
    
    // Arunachal Pradesh variations
    'arunachal pradesh': ['itanagar', 'arunachal pradesh'],
    'itanagar': ['arunachal pradesh', 'itanagar'],
    
    // Sikkim variations
    'sikkim': ['gangtok', 'sikkim'],
    'gangtok': ['sikkim', 'gangtok'],
    
    // Goa variations
    'goa': ['panaji', 'margao', 'goa'],
    'panaji': ['goa', 'panaji', 'margao'],
    'margao': ['goa', 'panaji', 'margao'],
    
    // Himachal Pradesh variations
    'himachal pradesh': ['shimla', 'manali', 'himachal pradesh'],
    'shimla': ['himachal pradesh', 'shimla', 'manali'],
    'manali': ['himachal pradesh', 'shimla', 'manali'],
    
    // Uttarakhand variations
    'uttarakhand': ['dehradun', 'rishikesh', 'uttarakhand'],
    'dehradun': ['uttarakhand', 'dehradun', 'rishikesh'],
    'rishikesh': ['uttarakhand', 'dehradun', 'rishikesh'],
    
    // Haryana variations
    'haryana': ['gurgaon', 'gurugram', 'faridabad', 'haryana'],
    'gurgaon': ['haryana', 'gurgaon', 'gurugram', 'faridabad'],
    'gurugram': ['haryana', 'gurgaon', 'gurugram', 'faridabad'],
    'faridabad': ['haryana', 'gurgaon', 'gurugram', 'faridabad'],
    
    // Special cases for cities that might be stored as states
    'shiggaon': ['shiggaon', 'karnataka'],
    'karnal': ['karnal', 'haryana'],
    'pilani': ['pilani', 'rajasthan']
  };
  
  // Check if either state has variations that match the other
  for (const [key, values] of Object.entries(variations)) {
    if (values.includes(s1) && values.includes(s2)) {
      return true;
    }
  }
  
  // More strict partial matching - only if one is clearly contained in the other
  // and the difference is not too large
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    // Only allow partial matches if the shorter string is at least 4 characters
    // and the difference in length is not too large
    if (shorter.length >= 4 && (longer.length - shorter.length) <= 3) {
      return true;
    }
  }
  
  return false;
}

// Calculate location match based on the 10 matching cases with proper prioritization
function calculateLocationMatch(
  ride: any,
  rideStopovers: any[],
  parsedOrigin: ParsedLocation,
  parsedDestination: ParsedLocation
): { match_percentage: number; reason: string } {
  
  console.log(`🔍 Matching ride: ${ride.origin_state} → ${ride.destination_state}`);
  console.log(`   User query: ${parsedOrigin.state} → ${parsedDestination.state}`);
  console.log(`   User city/region: ${parsedOrigin.city_or_region} → ${parsedDestination.city_or_region}`);
  console.log(`   User landmark: ${parsedOrigin.locality_or_landmark} → ${parsedDestination.locality_or_landmark}`);
  
  // Case 0: EXACT MATCH - Both origin and destination match exactly (100%)
  // This is the highest priority - exact matches for both origin and destination
  if (ride.origin_state && ride.destination_state &&
      (ride.origin_state.toLowerCase() === parsedOrigin.state.toLowerCase() ||
       ride.origin_state.toLowerCase() === parsedOrigin.city_or_region.toLowerCase()) &&
      (ride.destination_state.toLowerCase() === parsedDestination.state.toLowerCase() ||
       ride.destination_state.toLowerCase() === parsedDestination.city_or_region.toLowerCase())) {
    console.log(`   ✅ Case 0: Exact match (100%)`);
    return {
      match_percentage: 100,
      reason: 'Both origin and destination match exactly'
    };
  }

  // Case 1: Both Origin State and Destination State Match (95%)
  // This is the highest priority - exact state matches for both origin and destination
  if (ride.origin_state && ride.destination_state &&
      statesMatch(ride.origin_state, parsedOrigin.state) &&
      statesMatch(ride.destination_state, parsedDestination.state)) {
    console.log(`   ✅ Case 1: Both states match (95%)`);
    return {
      match_percentage: 95,
      reason: 'Both origin and destination states match exactly'
    };
  }

  // Case 2: Origin State + Destination City/Region Match (90%)
  if (ride.origin_state && ride.destination_state &&
      statesMatch(ride.origin_state, parsedOrigin.state) &&
      (ride.destination_state.toLowerCase() === parsedDestination.city_or_region.toLowerCase() ||
       ride.destination_state.toLowerCase().includes(parsedDestination.city_or_region.toLowerCase()))) {
    console.log(`   ✅ Case 2: Origin state + destination city match (90%)`);
    return {
      match_percentage: 90,
      reason: 'Origin state matches and destination city/region matches'
    };
  }

  // Case 3: Origin City/Region + Destination State Match (90%)
  if (ride.origin_state && ride.destination_state &&
      (ride.origin_state.toLowerCase() === parsedOrigin.city_or_region.toLowerCase() ||
       ride.origin_state.toLowerCase().includes(parsedOrigin.city_or_region.toLowerCase())) &&
      statesMatch(ride.destination_state, parsedDestination.state)) {
    console.log(`   ✅ Case 3: Origin city + destination state match (90%)`);
    return {
      match_percentage: 90,
      reason: 'Origin city/region matches and destination state matches'
    };
  }

  // Case 4: Only Origin State Matches (70%)
  if (ride.origin_state && statesMatch(ride.origin_state, parsedOrigin.state)) {
    console.log(`   ✅ Case 4: Origin state matches (70%)`);
    return {
      match_percentage: 70,
      reason: 'Origin state matches, destination differs'
    };
  }

  // Case 5: Only Destination State Matches (65%)
  if (ride.destination_state && statesMatch(ride.destination_state, parsedDestination.state)) {
    console.log(`   ✅ Case 5: Destination state matches (65%)`);
    return {
      match_percentage: 65,
      reason: 'Destination state matches, origin differs'
    };
  }

  // Case 6: Origin State + Landmark (Ride Stopovers) Match (85%)
  if (ride.origin_state && statesMatch(ride.origin_state, parsedOrigin.state)) {
    for (const stopover of rideStopovers) {
      if (stopover.landmark && 
          (stopover.landmark.toLowerCase().includes(parsedOrigin.city_or_region.toLowerCase()) ||
           stopover.landmark.toLowerCase().includes(parsedOrigin.locality_or_landmark.toLowerCase()))) {
        console.log(`   ✅ Case 6: Origin state + landmark match (85%)`);
        return {
          match_percentage: 85,
          reason: 'Origin state matches and stopover landmark matches user location'
        };
      }
    }
  }

  // Case 7: Origin State + City/Region Matches as Part of Origin State (75%)
  if (ride.origin_state && 
      ride.origin_state.toLowerCase().includes(parsedOrigin.city_or_region.toLowerCase())) {
    console.log(`   ✅ Case 7: Origin state includes city/region (75%)`);
    return {
      match_percentage: 75,
      reason: 'Origin state includes user city/region as substring'
    };
  }

  // Case 8: City/Region Matches with Landmark (70%)
  for (const stopover of rideStopovers) {
    if (stopover.landmark && 
        stopover.landmark.toLowerCase().includes(parsedOrigin.city_or_region.toLowerCase())) {
      console.log(`   ✅ Case 8: City/region matches landmark (70%)`);
      return {
        match_percentage: 70,
        reason: 'User city/region matches stopover landmark'
      };
    }
  }

  // Case 9: Only City/Region Matches in Origin State (60%)
  if (ride.origin_state && 
      ride.origin_state.toLowerCase().includes(parsedOrigin.city_or_region.toLowerCase())) {
    console.log(`   ✅ Case 9: City/region matches origin state (60%)`);
    return {
      match_percentage: 60,
      reason: 'User city/region partially matches origin state'
    };
  }

  // Case 10: Only Landmark Matches in Ride Stopovers (50%)
  for (const stopover of rideStopovers) {
    if (stopover.landmark && 
        (stopover.landmark.toLowerCase().includes(parsedOrigin.locality_or_landmark.toLowerCase()) ||
         stopover.landmark.toLowerCase().includes(parsedDestination.locality_or_landmark.toLowerCase()))) {
      console.log(`   ✅ Case 10: Landmark matches stopover (50%)`);
      return {
        match_percentage: 50,
        reason: 'User landmark matches stopover location'
      };
    }
  }

  // Case 11: City/Region Matches Destination State (55%)
  if (ride.destination_state && 
      ride.destination_state.toLowerCase().includes(parsedDestination.city_or_region.toLowerCase())) {
    console.log(`   ✅ Case 11: City/region matches destination state (55%)`);
    return {
      match_percentage: 55,
      reason: 'User city/region matches destination state'
    };
  }

  // Case 12: Landmark Matches Destination Stopovers (45%)
  for (const stopover of rideStopovers) {
    if (stopover.landmark && 
        stopover.landmark.toLowerCase().includes(parsedDestination.locality_or_landmark.toLowerCase())) {
      console.log(`   ✅ Case 12: Landmark matches destination stopover (45%)`);
      return {
        match_percentage: 45,
        reason: 'User destination landmark matches stopover location'
      };
    }
  }

  // Case 13: Destination City/Region in Ride Destination (80%)
  if (ride.destination && 
      ride.destination.toLowerCase().includes(parsedDestination.city_or_region.toLowerCase())) {
    console.log(`   ✅ Case 13: Destination city in ride destination (80%)`);
    return {
      match_percentage: 80,
      reason: 'User destination city matches ride destination'
    };
  }

  // Case 14: Origin City/Region in Ride Origin (80%)
  if (ride.origin && 
      ride.origin.toLowerCase().includes(parsedOrigin.city_or_region.toLowerCase())) {
    console.log(`   ✅ Case 14: Origin city in ride origin (80%)`);
    return {
      match_percentage: 80,
      reason: 'User origin city matches ride origin'
    };
  }

  console.log(`   ❌ No significant match found`);
  // No significant match (< 45%)
  return {
    match_percentage: 0,
    reason: 'No significant location match found'
  };
}
