// Enhanced ride search client with intelligent location resolution and multiple search strategies
import { searchAllIndianLocations } from './mapbox-search';

export interface SearchLocation {
  name: string;
  fullAddress: string;
  coordinates: [number, number];
  placeType: string[];
  category?: 'state' | 'city' | 'locality' | 'neighborhood';
}

export interface EnhancedSearchCriteria {
  origin: SearchLocation;
  destination: SearchLocation;
  travelDate?: string;
  passengersNeeded: number;
  vehiclePreferences?: string[];
  maxRadius?: number;
  priceRange?: { min: number; max: number };
  timePreference?: { earliest?: string; latest?: string };
}

export interface SearchResponse {
  success: boolean;
  results: {
    rides: Array<{
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
    }>;
    metadata: {
      totalFound: number;
      passengersNeeded: number;
      searchMethod: string;
    };
  };
}

class EnhancedRideSearchClient {
  private baseUrl: string;
  private requestId: number = 0;

  constructor(baseUrl: string = '') {
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
   * Intelligent ride search with custom location-based matching
   */
  async searchRides(criteria: EnhancedSearchCriteria): Promise<SearchResponse> {
    const requestId = ++this.requestId;
    const startTime = Date.now();

    try {
      // Use the correct backend URL
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3001/api/rides/search'
        : '/api/rides/search';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: {
            location: criteria.origin.fullAddress
          },
          destination: {
            location: criteria.destination.fullAddress
          },
          passengersNeeded: criteria.passengersNeeded
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          // If response is not JSON, use the text as error message
          if (errorText.includes('<!DOCTYPE')) {
            errorMessage = 'Backend server error - please check if the backend is running';
          } else {
            errorMessage = errorText;
          }
        }
        
        throw new Error(errorMessage);
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
    passengersNeeded: number = 1
  ): Promise<SearchResponse> {
    const requestId = ++this.requestId;
    const startTime = Date.now();

    try {
      // Use the correct backend URL
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3001/api/rides/search'
        : '/api/rides/search';

      console.log('🔍 Making API call to:', apiUrl);
      console.log('📤 Request payload:', {
        origin: { location: originInput },
        destination: { location: destinationInput },
        passengersNeeded
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: {
            location: originInput
          },
          destination: {
            location: destinationInput
          },
          passengersNeeded: passengersNeeded
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          // If response is not JSON, use the text as error message
          if (errorText.includes('<!DOCTYPE')) {
            errorMessage = 'Backend server error - please check if the backend is running';
          } else {
            errorMessage = errorText;
          }
        }
        
        throw new Error(errorMessage);
      }

      const result: SearchResponse = await response.json();
      const searchTime = Date.now() - startTime;

      console.log(`✅ [${requestId}] Search completed in ${searchTime}ms:`, result);

      return result;

    } catch (error) {
      const searchTime = Date.now() - startTime;
      console.error(`❌ [${requestId}] Search failed after ${searchTime}ms:`, error);
      
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Create a singleton instance
const enhancedRideSearchClient = new EnhancedRideSearchClient();

// Export the singleton instance and helper functions
export { enhancedRideSearchClient };

// Convenience function for smart search
export const smartSearchRides = (origin: string, destination: string, passengersNeeded: number = 1) => 
  enhancedRideSearchClient.smartSearch(origin, destination, passengersNeeded);
