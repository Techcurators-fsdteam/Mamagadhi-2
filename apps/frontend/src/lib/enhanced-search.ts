// Enhanced location search with all best practices implemented
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!mapboxToken) {
  console.warn('Mapbox token not found. Please set NEXT_PUBLIC_MAPBOX_TOKEN in your environment variables.');
}

export interface EnhancedSearchLocation {
  name: string;
  fullAddress: string;
  coordinates: [number, number]; // [lng, lat]
  placeType: string[];
  relevance: number;
  category: 'address' | 'poi' | 'place' | 'locality' | 'region' | 'neighborhood' | 'state' | 'city';
  context?: string;
  state?: string; // New field to store the state/region information
  searchLevel: 'interstate' | 'intercity' | 'local'; // New field for carpooling context
}

// Cache for storing recent search results
const searchCache = new Map<string, { results: EnhancedSearchLocation[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Debounce utility
let searchTimeout: NodeJS.Timeout;

// Analyze query to determine search strategy for carpooling
const analyzeQueryForCarpooling = (query: string): {
  searchLevel: 'interstate' | 'intercity' | 'local';
  suggestedTypes: string;
  proximityStrategy: 'none' | 'user' | 'india';
} => {
  const lowerQuery = query.toLowerCase();
  
  // Indian states and major cities for pattern matching
  const indianStates = [
    'andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh', 'goa',
    'gujarat', 'haryana', 'himachal pradesh', 'jharkhand', 'karnataka', 'kerala',
    'madhya pradesh', 'maharashtra', 'manipur', 'meghalaya', 'mizoram', 'nagaland',
    'odisha', 'punjab', 'rajasthan', 'sikkim', 'tamil nadu', 'telangana', 'tripura',
    'uttar pradesh', 'uttarakhand', 'west bengal', 'delhi', 'chandigarh', 'puducherry'
  ];
  
  const majorCities = [
    'mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'kolkata', 'pune',
    'ahmedabad', 'jaipur', 'lucknow', 'kanpur', 'nagpur', 'indore', 'thane',
    'bhopal', 'visakhapatnam', 'patna', 'vadodara', 'ghaziabad', 'ludhiana'
  ];

  // Interstate travel indicators
  if (indianStates.some(state => lowerQuery.includes(state))) {
    return {
      searchLevel: 'interstate',
      suggestedTypes: 'region,place', // Focus on states and major cities
      proximityStrategy: 'none' // Don't bias by user location for state-to-state
    };
  }

  // Intercity travel indicators
  if (majorCities.some(city => lowerQuery.includes(city)) || 
      query.length <= 8) { // Short queries often indicate city names
    return {
      searchLevel: 'intercity',
      suggestedTypes: 'place,locality,region', // Cities and localities
      proximityStrategy: 'india' // Bias towards India center, not user location
    };
  }

  // Local travel (specific addresses, neighborhoods, POIs)
  return {
    searchLevel: 'local',
    suggestedTypes: 'address,poi,neighborhood,locality,place',
    proximityStrategy: 'user' // Use user location for precise local search
  };
};

// Enhanced search with carpooling-optimized best practices
export const searchEnhancedLocations = async (
  query: string,
  options: {
    proximity?: [number, number]; // [lng, lat] for location bias
    bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat] for bounding box
    limit?: number;
    types?: string;
    fallback?: boolean;
    carpoolingMode?: boolean; // New option for carpooling-specific search
  } = {}
): Promise<EnhancedSearchLocation[]> => {
  // 6. Handle Short Queries Gracefully
  if (!mapboxToken || !query || query.length < 2) return [];

  // 13. Implement Client-side Result Caching
  const cacheKey = `${query}-${JSON.stringify(options)}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.results;
  }

  // Analyze query for carpooling context
  const carpoolingAnalysis = options.carpoolingMode !== false ? 
    analyzeQueryForCarpooling(query) : 
    { searchLevel: 'local' as const, suggestedTypes: 'place,address,poi,locality,region,neighborhood', proximityStrategy: 'user' as const };

  const {
    proximity,
    bbox,
    limit = carpoolingAnalysis.searchLevel === 'interstate' ? 12 : 8, // More results for interstate
    types = options.types || carpoolingAnalysis.suggestedTypes,
    fallback = true
  } = options;

  try {
    // Build query parameters
    const params = new URLSearchParams({
      access_token: mapboxToken,
      country: 'IN', // Restrict to India
      types,
      language: 'en',
      limit: limit.toString(),
      autocomplete: 'true' // 2. Enable Autocomplete
    });

    // 3. Use Proximity Parameter based on carpooling strategy
    if (carpoolingAnalysis.proximityStrategy === 'user' && proximity) {
      params.append('proximity', `${proximity[0]},${proximity[1]}`);
    } else if (carpoolingAnalysis.proximityStrategy === 'india') {
      // Center of India for intercity searches
      params.append('proximity', '78.9629,20.5937');
    }
    // For interstate, no proximity bias to get broader results

    // 5. Restrict Search Area
    if (bbox) {
      params.append('bbox', bbox.join(','));
    } else {
      // Default bbox for India
      params.append('bbox', '68.176,6.754,97.395,35.67');
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.features) {
      // 9. Add Fallbacks for Empty Results with carpooling-aware fallbacks
      if (fallback) {
        if (carpoolingAnalysis.searchLevel === 'interstate' && types !== 'place,locality') {
          return searchEnhancedLocations(query, {
            ...options,
            types: 'place,locality',
            fallback: false
          });
        } else if (types !== 'place,locality,region') {
          return searchEnhancedLocations(query, {
            ...options,
            types: 'place,locality,region',
            fallback: false
          });
        }
      }
      return [];
    }

    // 7. Parse and Rank Results by Relevance with carpooling context
    const locations = data.features
      .map((feature: any) => {
        const placeTypes = feature.place_type || [];
        const relevance = feature.relevance || 0;
        
        // Enhanced category determination for carpooling
        let category: 'address' | 'poi' | 'place' | 'locality' | 'region' | 'neighborhood' | 'state' | 'city' = 'place';
        
        if (placeTypes.includes('region')) {
          category = 'state';
        } else if (placeTypes.includes('place') && feature.properties?.['wikidata']) {
          // Major cities usually have wikidata
          category = 'city';
        } else if (placeTypes.includes('place')) {
          category = 'place';
        } else if (placeTypes.includes('address')) {
          category = 'address';
        } else if (placeTypes.includes('poi')) {
          category = 'poi';
        } else if (placeTypes.includes('neighborhood')) {
          category = 'neighborhood';
        } else if (placeTypes.includes('locality')) {
          category = 'locality';
        }

        // Extract context for better display
        const context = feature.context ? 
          feature.context.map((c: any) => c.text).join(', ') : 
          '';

        // Extract state information from context
        const stateInfo = feature.context?.find((c: any) => 
          c.id?.startsWith('region') || c.id?.startsWith('place')
        );
        const state = stateInfo?.text || '';

        return {
          name: feature.text || feature.place_name,
          fullAddress: feature.place_name,
          coordinates: feature.geometry.coordinates,
          placeType: placeTypes,
          relevance,
          category,
          context,
          state,
          searchLevel: carpoolingAnalysis.searchLevel
        };
      })
      // Enhanced sorting for carpooling context
      .sort((a: EnhancedSearchLocation, b: EnhancedSearchLocation) => {
        // Prioritize exact matches first
        const aExact = a.name.toLowerCase().startsWith(query.toLowerCase());
        const bExact = b.name.toLowerCase().startsWith(query.toLowerCase());
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Carpooling-specific category priority
        if (carpoolingAnalysis.searchLevel === 'interstate') {
          // For interstate: states > major cities > other places
          const categoryPriority = { state: 1, city: 2, place: 3, locality: 4, neighborhood: 5, poi: 6, address: 7 };
          const aPriority = categoryPriority[a.category as keyof typeof categoryPriority] || 8;
          const bPriority = categoryPriority[b.category as keyof typeof categoryPriority] || 8;
          if (aPriority !== bPriority) return aPriority - bPriority;
        } else if (carpoolingAnalysis.searchLevel === 'intercity') {
          // For intercity: cities > places > localities
          const categoryPriority = { city: 1, place: 2, locality: 3, state: 4, neighborhood: 5, poi: 6, address: 7 };
          const aPriority = categoryPriority[a.category as keyof typeof categoryPriority] || 8;
          const bPriority = categoryPriority[b.category as keyof typeof categoryPriority] || 8;
          if (aPriority !== bPriority) return aPriority - bPriority;
        }
        // For local search, relevance is most important
        
        // Then by relevance score
        return b.relevance - a.relevance;
      })
      // Remove duplicates based on coordinates
      .filter((location: EnhancedSearchLocation, index: number, arr: EnhancedSearchLocation[]) => {
        return index === arr.findIndex(l => 
          Math.abs(l.coordinates[0] - location.coordinates[0]) < 0.001 &&
          Math.abs(l.coordinates[1] - location.coordinates[1]) < 0.001
        );
      })
      .slice(0, limit);

    // Cache the results
    searchCache.set(cacheKey, { results: locations, timestamp: Date.now() });

    return locations;
  } catch (error) {
    console.error('Error searching enhanced locations:', error);
    return [];
  }
};

// 4. Use Debounce on Input
export const debouncedSearch = (
  query: string,
  searchFunction: (query: string) => Promise<void>,
  delay: number = 400
): Promise<void> => {
  return new Promise((resolve) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      await searchFunction(query);
      resolve();
    }, delay);
  });
};

// Utility to get user's current location for proximity bias
export const getCurrentLocation = (): Promise<[number, number] | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([position.coords.longitude, position.coords.latitude]);
      },
      () => {
        resolve(null);
      },
      { timeout: 5000, enableHighAccuracy: false }
    );
  });
};

// Clear cache utility
export const clearSearchCache = () => {
  searchCache.clear();
};

// Get category icon for better UI
export const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'poi': return '🏢';
    case 'address': return '📍';
    case 'locality': return '🏘️';
    case 'neighborhood': return '🏠';
    case 'region': return '🌍';
    case 'place': return '📍';
    default: return '📍';
  }
};

// Format display text for better UX
export const formatLocationDisplay = (location: EnhancedSearchLocation): { primary: string; secondary: string } => {
  // 8. Highlight Name + Address
  const primary = location.name;
  const secondary = location.context || location.fullAddress.replace(location.name + ', ', '');
  
  return { primary, secondary };
};
