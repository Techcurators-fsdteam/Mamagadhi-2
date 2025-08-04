// Enhanced API client for intelligent ride matching
import { searchAllIndianLocations } from './mapbox-search';

export interface SearchLocation {
  name: string;
  fullAddress: string;
  coordinates: [number, number]; // [lng, lat]
  placeType: string[];
  category?: 'state' | 'city' | 'locality' | 'neighborhood';
}

export interface EnhancedSearchCriteria {
  origin: SearchLocation;
  destination: SearchLocation;
  travelDate?: string;
  passengersNeeded: number;
  vehiclePreferences?: string[];
  maxRadius?: number; // in meters
  priceRange?: {
    min: number;
    max: number;
  };
  timePreference?: {
    earliest?: string; // HH:MM format
    latest?: string;   // HH:MM format
  };
}

export interface RideMatch {
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
  driver?: {
    display_name: string;
    first_name: string;
    last_name: string;
    profile_url: string | null;
    rating?: number;
    total_rides?: number;
  };
}

export interface SearchResponse {
  success: boolean;
  results: {
    rides: RideMatch[];
    metadata: {
      totalFound: number;
      searchStrategy: string;
      searchTime: string;
      searchRadius: number;
      searchDate: string;
      passengersNeeded: number;
      filters: {
        vehicleTypes: string[] | string;
        priceRange: { min: number; max: number } | string;
        timePreference: { earliest?: string; latest?: string } | string;
      };
      qualityDistribution: {
        direct: number;
        intermediate: number;
        fuzzy: number;
      };
    };
  };
}

class EnhancedRideSearchClient {
  private baseUrl: string;
  private requestId: number = 0;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  /**
   * Intelligent location resolution with coordinate fetching
   */
  async resolveLocation(locationInput: string): Promise<SearchLocation | null> {
    if (!locationInput || locationInput.trim().length < 2) {
      return null;
    }

    try {
      const locations = await searchAllIndianLocations(locationInput.trim());
      
      if (locations.length === 0) {
        return {
          name: locationInput,
          fullAddress: locationInput,
          coordinates: [0, 0], // Will trigger text-based search
          placeType: ['unknown'],
          category: 'locality'
        };
      }

      // Return the best match (first result is highest priority)
      const bestMatch = locations[0];
      
      return bestMatch;
    } catch (error) {
      // Return a basic location object for text-based fallback
      return {
        name: locationInput,
        fullAddress: locationInput,
        coordinates: [0, 0],
        placeType: ['unknown'],
        category: 'locality'
      };
    }
  }

  /**
   * Intelligent ride search with multiple strategies
   */
  async searchRides(criteria: EnhancedSearchCriteria): Promise<SearchResponse> {
    const requestId = ++this.requestId;
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/api/rides/search-enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(criteria)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: SearchResponse = await response.json();
      const searchTime = Date.now() - startTime;

      return result;

    } catch (error) {
      const searchTime = Date.now() - startTime;
      console.error(`❌ [${requestId}] Search failed after ${searchTime}ms:`, error);
      
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Smart search with automatic location resolution
   */
  async smartSearch(
    originInput: string,
    destinationInput: string,
    options: {
      travelDate?: string;
      passengersNeeded: number;
      vehiclePreferences?: string[];
      maxRadius?: number;
      priceRange?: { min: number; max: number };
      timePreference?: { earliest?: string; latest?: string };
    }
  ): Promise<SearchResponse> {
    // Resolve locations in parallel
    const [originLocation, destinationLocation] = await Promise.all([
      this.resolveLocation(originInput),
      this.resolveLocation(destinationInput)
    ]);

    if (!originLocation || !destinationLocation) {
      throw new Error('Failed to resolve origin or destination location');
    }

    // Build enhanced search criteria
    const criteria: EnhancedSearchCriteria = {
      origin: originLocation,
      destination: destinationLocation,
      travelDate: options.travelDate,
      passengersNeeded: options.passengersNeeded,
      vehiclePreferences: options.vehiclePreferences,
      maxRadius: options.maxRadius || 30000, // 30km default
      priceRange: options.priceRange,
      timePreference: options.timePreference
    };

    return this.searchRides(criteria);
  }

  /**
   * Get search suggestions based on partial input
   */
  async getLocationSuggestions(query: string, limit: number = 8): Promise<SearchLocation[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const suggestions = await searchAllIndianLocations(query.trim());
      return suggestions.slice(0, limit);
    } catch (error) {
      console.error('Failed to get location suggestions:', error);
      return [];
    }
  }

  /**
   * Calculate estimated travel distance between two locations
   */
  async getDistanceEstimate(origin: SearchLocation, destination: SearchLocation): Promise<number | null> {
    if (!origin.coordinates || !destination.coordinates ||
        origin.coordinates[0] === 0 || destination.coordinates[0] === 0) {
      return null;
    }

    try {
      // Simple haversine distance calculation
      const [lon1, lat1] = origin.coordinates;
      const [lon2, lat2] = destination.coordinates;
      
      const R = 6371; // Earth's radius in kilometers
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      return Math.round(distance * 10) / 10; // Round to 1 decimal place
    } catch (error) {
      console.error('Distance calculation failed:', error);
      return null;
    }
  }

  /**
   * Get ride recommendations based on user preferences and history
   */
  async getRecommendations(
    userPreferences: {
      preferredVehicleTypes?: string[];
      preferredPriceRange?: { min: number; max: number };
      preferredTimeRange?: { earliest: string; latest: string };
      frequentRoutes?: Array<{ origin: string; destination: string }>;
    }
  ): Promise<RideMatch[]> {
    // This could be enhanced with ML-based recommendations
    // For now, return popular routes based on user preferences
    
    if (!userPreferences.frequentRoutes || userPreferences.frequentRoutes.length === 0) {
      return [];
    }

    try {
      // Search for rides on frequent routes
      const recommendations: RideMatch[] = [];
      
      for (const route of userPreferences.frequentRoutes.slice(0, 3)) { // Limit to 3 routes
        try {
          const result = await this.smartSearch(
            route.origin,
            route.destination,
            {
              passengersNeeded: 1,
              vehiclePreferences: userPreferences.preferredVehicleTypes,
              priceRange: userPreferences.preferredPriceRange,
              timePreference: userPreferences.preferredTimeRange
            }
          );
          
          recommendations.push(...result.results.rides.slice(0, 2)); // Top 2 per route
        } catch (error) {
          console.warn(`Failed to get recommendations for route ${route.origin} -> ${route.destination}:`, error);
        }
      }

      return recommendations.slice(0, 6); // Return top 6 recommendations
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  }
}

// Create and export a singleton instance
export const enhancedRideSearchClient = new EnhancedRideSearchClient();

// Export helper functions
export const resolveLocation = (input: string) => enhancedRideSearchClient.resolveLocation(input);
export const smartSearchRides = (origin: string, destination: string, options: any) => 
  enhancedRideSearchClient.smartSearch(origin, destination, options);
export const getLocationSuggestions = (query: string, limit?: number) => 
  enhancedRideSearchClient.getLocationSuggestions(query, limit);
export const getDistanceEstimate = (origin: SearchLocation, destination: SearchLocation) =>
  enhancedRideSearchClient.getDistanceEstimate(origin, destination);

export default enhancedRideSearchClient;
