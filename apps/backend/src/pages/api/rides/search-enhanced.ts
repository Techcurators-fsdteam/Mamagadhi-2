import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SearchLocation {
  name: string;
  fullAddress: string;
  coordinates: [number, number]; // [lng, lat]
  placeType: string[];
  category?: 'state' | 'city' | 'locality' | 'neighborhood';
}

interface SearchRequest {
  origin: SearchLocation;
  destination: SearchLocation;
  travelDate?: string;
  passengersNeeded: number;
  vehiclePreferences?: string[];
  maxRadius?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  timePreference?: {
    earliest?: string;
    latest?: string;
  };
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
  driver_id: string;
  // Enhanced matching data
  origin_distance_km?: number;
  dest_distance_km?: number;
  total_distance_km?: number;
  route_match_score?: number;
  is_intermediate_match?: boolean;
  match_type: 'direct' | 'intermediate' | 'fuzzy';
  confidence_score: number;
}

// Helper function for fuzzy text matching
function fuzzyTextMatch(searchText: string, targetText: string): number {
  if (!searchText || !targetText) return 0;
  
  const search = searchText.toLowerCase().trim();
  const target = targetText.toLowerCase().trim();
  
  // Exact match
  if (search === target) return 100;
  
  // Contains match
  if (target.includes(search) || search.includes(target)) return 80;
  
  // Word-based matching
  const searchWords = search.split(' ').filter(w => w.length > 2);
  const targetWords = target.split(' ').filter(w => w.length > 2);
  
  let matchingWords = 0;
  for (const searchWord of searchWords) {
    for (const targetWord of targetWords) {
      if (targetWord.includes(searchWord) || searchWord.includes(targetWord)) {
        matchingWords++;
        break;
      }
    }
  }
  
  if (searchWords.length > 0) {
    return (matchingWords / searchWords.length) * 60;
  }
  
  return 0;
}

// Helper function for vehicle similarity
function isVehicleSimilar(rideVehicle: string, preferredVehicles: string[]): boolean {
  const similarities: { [key: string]: string[] } = {
    'car': ['sedan', 'hatchback', 'suv'],
    'sedan': ['car', 'hatchback'],
    'hatchback': ['car', 'sedan'],
    'suv': ['car'],
    'auto': ['rickshaw'],
    'rickshaw': ['auto'],
    'bike': ['motorcycle'],
    'motorcycle': ['bike']
  };
  
  for (const preferred of preferredVehicles) {
    if (similarities[rideVehicle.toLowerCase()]?.includes(preferred.toLowerCase()) ||
        similarities[preferred.toLowerCase()]?.includes(rideVehicle.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const {
      origin,
      destination,
      travelDate,
      passengersNeeded,
      vehiclePreferences,
      maxRadius = 30000,
      priceRange,
      timePreference
    }: SearchRequest = req.body;

    // Validate required fields
    if (!origin?.name || !destination?.name || !passengersNeeded) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Origin, destination, and passengers needed are required'
      });
    }

    let matchedRides: RideMatch[] = [];
    let searchStrategy = 'unknown';

    // Strategy 1: Get all open rides first
    const { data: allRides, error: allRidesError } = await supabase
      .from('rides')
      .select('*')
      .eq('status', 'open')
      .gte('seats_available', passengersNeeded)
      .order('departure_time', { ascending: true });

    if (allRidesError) {
      throw new Error(`Database query failed: ${allRidesError.message}`);
    }

    if (allRides && allRides.length > 0) {
      searchStrategy = 'priority_scoring';
      
      // Apply priority-based scoring: Location (60%) + Date (30%) + Vehicle (10%)
      matchedRides = allRides
        .map(ride => {
          let locationScore = 0;
          let dateScore = 0;
          let vehicleScore = 0;
          
          // Location scoring (60% weight) - Priority 1
          const originMatch = fuzzyTextMatch(origin.name, ride.origin);
          const destMatch = fuzzyTextMatch(destination.name, ride.destination);
          locationScore = (originMatch + destMatch) / 2;
          
          // Date scoring (30% weight) - Priority 2
          if (travelDate) {
            const rideDate = new Date(ride.departure_time);
            const searchDate = new Date(travelDate);
            const daysDiff = Math.abs((rideDate.getTime() - searchDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 0) dateScore = 100;      // Exact date
            else if (daysDiff <= 1) dateScore = 80;   // ±1 day
            else if (daysDiff <= 2) dateScore = 60;   // ±2 days
            else if (daysDiff <= 3) dateScore = 40;   // ±3 days
            else dateScore = 0;                       // Outside range
          } else {
            dateScore = 100; // No date preference
          }
          
          // Vehicle scoring (10% weight) - Priority 3
          if (!vehiclePreferences || vehiclePreferences.length === 0) {
            vehicleScore = 100; // No preference
          } else {
            vehicleScore = vehiclePreferences.includes(ride.vehicle_type) ? 100 : 
                          isVehicleSimilar(ride.vehicle_type, vehiclePreferences) ? 70 : 30;
          }
          
          // Calculate overall score with priority weights
          const overallScore = (locationScore * 0.6) + (dateScore * 0.3) + (vehicleScore * 0.1);
          
          return {
            ...ride,
            origin_distance_km: null,
            dest_distance_km: null,
            total_distance_km: null,
            route_match_score: locationScore,
            is_intermediate_match: false,
            match_type: overallScore > 70 ? 'direct' : 
                       overallScore > 40 ? 'intermediate' : 'fuzzy',
            confidence_score: overallScore
          } as RideMatch;
        })
        .filter(ride => ride.confidence_score > 20) // Only show reasonable matches
        .sort((a, b) => {
          // Priority 1: Location score (most important)
          const locationDiff = (b.route_match_score || 0) - (a.route_match_score || 0);
          if (Math.abs(locationDiff) > 10) {
            return locationDiff;
          }
          
          // Priority 2: Date relevance (if dates are close, prefer exact date matches)
          if (travelDate) {
            const aDateDiff = Math.abs(new Date(a.departure_time).getTime() - new Date(travelDate).getTime());
            const bDateDiff = Math.abs(new Date(b.departure_time).getTime() - new Date(travelDate).getTime());
            const dateDiff = aDateDiff - bDateDiff;
            if (Math.abs(dateDiff) > 86400000) { // More than 1 day difference
              return dateDiff;
            }
          }
          
          // Priority 3: Overall confidence score
          return b.confidence_score - a.confidence_score;
        })
        .slice(0, 50); // Limit results

    } else {
      matchedRides = [];
      searchStrategy = 'no_rides_available';
    }

    // Calculate search metadata
    const searchTime = Date.now() - startTime;
    const qualityDistribution = {
      direct: matchedRides.filter(ride => ride.match_type === 'direct').length,
      intermediate: matchedRides.filter(ride => ride.match_type === 'intermediate').length,
      fuzzy: matchedRides.filter(ride => ride.match_type === 'fuzzy').length
    };

    // Return successful response
    return res.status(200).json({
      success: true,
      results: {
        rides: matchedRides,
        metadata: {
          totalFound: matchedRides.length,
          searchStrategy,
          searchTime: `${searchTime}ms`,
          searchRadius: maxRadius / 1000,
          searchDate: travelDate || 'any date',
          passengersNeeded,
          filters: {
            vehicleTypes: vehiclePreferences || 'any vehicle',
            priceRange: priceRange || 'any price',
            timePreference: timePreference || 'any time'
          },
          qualityDistribution,
          priorityDistribution: {
            location_priority_1: matchedRides.filter(r => (r.route_match_score || 0) > 80).length,
            location_priority_2: matchedRides.filter(r => (r.route_match_score || 0) > 60 && (r.route_match_score || 0) <= 80).length,
            date_exact_match: travelDate ? matchedRides.filter(r => {
              const daysDiff = Math.abs((new Date(r.departure_time).getTime() - new Date(travelDate).getTime()) / (1000 * 60 * 60 * 24));
              return daysDiff === 0;
            }).length : 0,
            date_within_range: travelDate ? matchedRides.filter(r => {
              const daysDiff = Math.abs((new Date(r.departure_time).getTime() - new Date(travelDate).getTime()) / (1000 * 60 * 60 * 24));
              return daysDiff <= 3;
            }).length : matchedRides.length,
            vehicle_preferred: vehiclePreferences ? matchedRides.filter(r => 
              vehiclePreferences.includes(r.vehicle_type)
            ).length : matchedRides.length,
            searchRadius: `${maxRadius / 1000}km`,
            dateRange: travelDate ? '±3 days from search date' : 'Any date'
          }
        }
      }
    });

  } catch (error) {
    const searchTime = Date.now() - startTime;
    console.error('❌ Enhanced search error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      searchTime: `${searchTime}ms`
    });
  }
}
