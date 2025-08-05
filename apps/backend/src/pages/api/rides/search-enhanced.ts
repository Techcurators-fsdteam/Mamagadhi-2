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

// Enhanced location matching with PostGIS and geographic intelligence
function calculateLocationScore(searchOrigin: SearchLocation, searchDest: SearchLocation, rideOrigin: string, rideDest: string, rideOriginState: string, rideDestState: string): {
  score: number;
  originMatch: number;
  destMatch: number;
  details: string;
} {
  // State-level matching (highest priority)
  const searchOriginState = extractState(searchOrigin.fullAddress);
  const searchDestState = extractState(searchDest.fullAddress);
  
  let originScore = 0;
  let destScore = 0;
  let details = '';
  
  // Origin matching logic
  if (searchOriginState && rideOriginState) {
    if (searchOriginState.toLowerCase() === rideOriginState.toLowerCase()) {
      originScore = 95; // Same state = high match
      details += `Origin: Same state (${searchOriginState}). `;
      
      // City/area level refinement within state
      const cityMatch = fuzzyTextMatch(searchOrigin.name, rideOrigin);
      if (cityMatch > 80) {
        originScore = 98; // Same city in same state
        details += `Same city match. `;
      }
    } else {
      // Different states - check if they're neighboring or commonly connected
      const neighboringStates = getNeighboringStates(searchOriginState);
      if (neighboringStates.includes(rideOriginState.toLowerCase())) {
        originScore = 40; // Neighboring state
        details += `Origin: Neighboring state. `;
      } else {
        originScore = 10; // Distant state
        details += `Origin: Different state. `;
      }
    }
  } else {
    // Fallback to text matching
    originScore = fuzzyTextMatch(searchOrigin.name, rideOrigin);
    details += `Origin: Text match (${originScore}%). `;
  }
  
  // Destination matching logic (same logic as origin)
  if (searchDestState && rideDestState) {
    if (searchDestState.toLowerCase() === rideDestState.toLowerCase()) {
      destScore = 95; // Same state = high match
      details += `Dest: Same state (${searchDestState}). `;
      
      const cityMatch = fuzzyTextMatch(searchDest.name, rideDest);
      if (cityMatch > 80) {
        destScore = 98; // Same city in same state
        details += `Same city match. `;
      }
    } else {
      const neighboringStates = getNeighboringStates(searchDestState);
      if (neighboringStates.includes(rideDestState.toLowerCase())) {
        destScore = 40; // Neighboring state
        details += `Dest: Neighboring state. `;
      } else {
        destScore = 10; // Distant state
        details += `Dest: Different state. `;
      }
    }
  } else {
    destScore = fuzzyTextMatch(searchDest.name, rideDest);
    details += `Dest: Text match (${destScore}%). `;
  }
  
  // Calculate overall location score with both origin and destination
  const overallScore = (originScore + destScore) / 2;
  
  return {
    score: overallScore,
    originMatch: originScore,
    destMatch: destScore,
    details: details.trim()
  };
}

// Helper function to extract state from address
function extractState(address: string): string | null {
  const statePatterns = [
    'delhi', 'mumbai', 'bangalore', 'hyderabad', 'pune', 'chennai', 'kolkata',
    'jaipur', 'rajasthan', 'gujarat', 'maharashtra', 'karnataka', 'tamil nadu',
    'kerala', 'punjab', 'haryana', 'uttar pradesh', 'madhya pradesh',
    'west bengal', 'odisha', 'bihar', 'jharkhand', 'assam', 'goa'
  ];
  
  const addressLower = address.toLowerCase();
  for (const state of statePatterns) {
    if (addressLower.includes(state)) {
      return state;
    }
  }
  return null;
}

// Helper function to get neighboring states for route optimization
function getNeighboringStates(state: string): string[] {
  const neighbors: { [key: string]: string[] } = {
    'delhi': ['haryana', 'uttar pradesh', 'punjab'],
    'mumbai': ['maharashtra', 'gujarat', 'goa'],
    'maharashtra': ['gujarat', 'madhya pradesh', 'karnataka', 'goa'],
    'rajasthan': ['delhi', 'haryana', 'punjab', 'gujarat', 'madhya pradesh'],
    'gujarat': ['rajasthan', 'maharashtra', 'madhya pradesh'],
    'karnataka': ['maharashtra', 'tamil nadu', 'kerala', 'andhra pradesh'],
    'tamil nadu': ['karnataka', 'kerala', 'andhra pradesh'],
    'punjab': ['delhi', 'haryana', 'rajasthan', 'himachal pradesh'],
    'haryana': ['delhi', 'punjab', 'rajasthan', 'uttar pradesh']
  };
  
  return neighbors[state.toLowerCase()] || [];
}

// Helper function for fuzzy text matching with city-area relationships
function fuzzyTextMatch(searchText: string, targetText: string): number {
  if (!searchText || !targetText) return 0;
  
  const search = searchText.toLowerCase().trim();
  const target = targetText.toLowerCase().trim();
  
  // City-area mapping for better matching
  const cityMappings: { [key: string]: string[] } = {
    'delhi': ['janakpuri', 'cp', 'connaught place', 'karol bagh', 'lajpat nagar', 'rohini', 'dwarka', 'gurgaon border', 'noida border'],
    'mumbai': ['bandra', 'andheri', 'juhu', 'colaba', 'worli', 'powai', 'thane', 'navi mumbai'],
    'bangalore': ['koramangala', 'indiranagar', 'whitefield', 'electronic city', 'btm layout', 'jayanagar'],
    'jaipur': ['city palace', 'amber fort', 'malviya nagar', 'vaishali nagar', 'mansarovar'],
    'pune': ['koregaon park', 'baner', 'hinjewadi', 'kothrud', 'camp area', 'viman nagar']
  };
  
  // Exact match
  if (search === target) return 100;
  
  // Check if search is an area and target is the parent city (or vice versa)
  for (const [city, areas] of Object.entries(cityMappings)) {
    if ((search === city && areas.some(area => target.includes(area))) ||
        (target === city && areas.some(area => search.includes(area))) ||
        (areas.some(area => search.includes(area)) && target.includes(city)) ||
        (areas.some(area => target.includes(area)) && search.includes(city))) {
      return 95; // High match for city-area relationships
    }
  }
  
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

// Enhanced vehicle similarity with more comprehensive matching
function isVehicleSimilar(rideVehicle: string, preferredVehicles: string[]): boolean {
  const similarities: { [key: string]: string[] } = {
    // Cars category
    'car': ['sedan', 'hatchback', 'suv', 'crossover', 'wagon'],
    'sedan': ['car', 'hatchback', 'compact', 'luxury'],
    'hatchback': ['car', 'sedan', 'compact'],
    'suv': ['car', 'crossover', 'jeep', 'mpv'],
    'crossover': ['suv', 'car'],
    'mpv': ['suv', 'van', 'minivan'],
    'luxury': ['sedan', 'car', 'premium'],
    
    // Two wheelers
    'bike': ['motorcycle', 'scooter', 'two-wheeler'],
    'motorcycle': ['bike', 'scooter', 'two-wheeler'],
    'scooter': ['bike', 'motorcycle', 'two-wheeler'],
    
    // Three wheelers
    'auto': ['rickshaw', 'three-wheeler', 'tuk-tuk'],
    'rickshaw': ['auto', 'three-wheeler', 'tuk-tuk'],
    'three-wheeler': ['auto', 'rickshaw'],
    
    // Commercial vehicles
    'van': ['mini-van', 'mpv', 'commercial'],
    'truck': ['mini-truck', 'commercial', 'goods-vehicle'],
    'bus': ['mini-bus', 'coach', 'public-transport'],
    
    // Premium category
    'premium': ['luxury', 'executive', 'business'],
    'executive': ['premium', 'luxury', 'business']
  };
  
  const rideVehicleLower = rideVehicle.toLowerCase();
  
  for (const preferred of preferredVehicles) {
    const preferredLower = preferred.toLowerCase();
    
    // Exact match
    if (rideVehicleLower === preferredLower) {
      return true;
    }
    
    // Similar vehicle types
    if (similarities[rideVehicleLower]?.includes(preferredLower) ||
        similarities[preferredLower]?.includes(rideVehicleLower)) {
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
      
      // Apply enhanced scoring: Location (70%) + Date (20%) + Vehicle (10%)
      matchedRides = allRides
        .map(ride => {
          let locationScore = 0;
          let dateScore = 0;
          let vehicleScore = 0;
          let matchDetails = '';
          
          // Enhanced Location scoring (70% weight) - Priority 1
          const locationResult = calculateLocationScore(
            origin, 
            destination, 
            ride.origin, 
            ride.destination, 
            ride.origin_state, 
            ride.destination_state
          );
          locationScore = locationResult.score;
          matchDetails = locationResult.details;
          
          // Date scoring (20% weight) - Priority 2
          if (travelDate) {
            const rideDate = new Date(ride.departure_time);
            const searchDate = new Date(travelDate);
            const daysDiff = Math.abs((rideDate.getTime() - searchDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 0) dateScore = 100;      // Exact date
            else if (daysDiff <= 1) dateScore = 85;   // ±1 day
            else if (daysDiff <= 2) dateScore = 70;   // ±2 days
            else if (daysDiff <= 3) dateScore = 50;   // ±3 days
            else if (daysDiff <= 7) dateScore = 25;   // ±1 week
            else dateScore = 0;                       // Outside range
          } else {
            dateScore = 100; // No date preference
          }
          
          // Vehicle scoring (10% weight) - Priority 3
          if (!vehiclePreferences || vehiclePreferences.length === 0) {
            vehicleScore = 100; // No preference
          } else {
            vehicleScore = vehiclePreferences.includes(ride.vehicle_type) ? 100 : 
                          isVehicleSimilar(ride.vehicle_type, vehiclePreferences) ? 75 : 40;
          }
          
          // Calculate overall score with enhanced weights
          const overallScore = (locationScore * 0.7) + (dateScore * 0.2) + (vehicleScore * 0.1);
          
          // Determine match type based on location score primarily
          let matchType: 'direct' | 'intermediate' | 'fuzzy' = 'fuzzy';
          if (locationScore >= 90) matchType = 'direct';
          else if (locationScore >= 70) matchType = 'intermediate';
          
          return {
            ...ride,
            origin_distance_km: null,
            dest_distance_km: null,
            total_distance_km: null,
            route_match_score: locationScore,
            is_intermediate_match: matchType === 'intermediate',
            match_type: matchType,
            confidence_score: Math.round(overallScore),
            match_details: matchDetails,
            location_breakdown: {
              origin_match: locationResult.originMatch,
              dest_match: locationResult.destMatch
            }
          } as RideMatch;
        })
        .filter(ride => ride.confidence_score > 15) // Lower threshold to catch more potential matches
        .sort((a, b) => {
          // Priority 1: Location score (most important - 70% weight)
          const locationDiff = (b.route_match_score || 0) - (a.route_match_score || 0);
          if (Math.abs(locationDiff) > 15) {
            return locationDiff;
          }
          
          // Priority 2: Overall confidence score
          const confidenceDiff = b.confidence_score - a.confidence_score;
          if (Math.abs(confidenceDiff) > 5) {
            return confidenceDiff;
          }
          
          // Priority 3: Date relevance (if scores are close)
          if (travelDate) {
            const aDateDiff = Math.abs(new Date(a.departure_time).getTime() - new Date(travelDate).getTime());
            const bDateDiff = Math.abs(new Date(b.departure_time).getTime() - new Date(travelDate).getTime());
            return aDateDiff - bDateDiff;
          }
          
          return 0;
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
