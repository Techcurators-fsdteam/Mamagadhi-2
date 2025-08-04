// Use Mapbox Geocoding API directly for better location search
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!mapboxToken) {
  console.warn('Mapbox token not found. Please set NEXT_PUBLIC_MAPBOX_TOKEN in your environment variables.');
}

export interface SearchLocation {
  name: string;
  fullAddress: string;
  coordinates: [number, number]; // [lng, lat]
  placeType: string[];
  category?: 'state' | 'city' | 'locality' | 'neighborhood';
}

// Search for states and major cities only (for PublishSearchForm)
export const searchIndianStatesAndCities = async (query: string): Promise<SearchLocation[]> => {
  if (!mapboxToken || !query || query.length < 2) return [];

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
      `access_token=${mapboxToken}&` +
      `country=IN&` +
      `types=place,region,district&` +
      `language=en&` +
      `limit=10`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.features) return [];

    // Filter for states and major cities only
    const locations = data.features
      .map((feature: any) => {
        const placeTypes = feature.place_type || [];
        
        // Only allow states and major cities/districts
        let category: 'state' | 'city' | 'locality' | 'neighborhood' = 'city';
        
        if (placeTypes.includes('region')) {
          category = 'state';
        } else if (placeTypes.includes('place') || placeTypes.includes('district')) {
          category = 'city';
        } else {
          // Skip localities, neighborhoods, and other small places
          return null;
        }

        return {
          name: feature.text || feature.place_name,
          fullAddress: feature.place_name,
          coordinates: feature.geometry.coordinates,
          placeType: placeTypes,
          category
        };
      })
      // Remove null entries and duplicates
      .filter((location: SearchLocation | null): location is SearchLocation => location !== null)
      .filter((location: SearchLocation, index: number, self: SearchLocation[]) => 
        index === self.findIndex((l: SearchLocation) => 
          l.name.toLowerCase() === location.name.toLowerCase() && 
          Math.abs(l.coordinates[0] - location.coordinates[0]) < 0.01 &&
          Math.abs(l.coordinates[1] - location.coordinates[1]) < 0.01
        )
      )
      .sort((a: SearchLocation, b: SearchLocation) => {
        // Prioritize exact matches first
        const aExact = a.name.toLowerCase().startsWith(query.toLowerCase());
        const bExact = b.name.toLowerCase().startsWith(query.toLowerCase());
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then check for partial matches at the beginning of words
        const aWordMatch = a.name.toLowerCase().split(' ').some(word => word.startsWith(query.toLowerCase()));
        const bWordMatch = b.name.toLowerCase().split(' ').some(word => word.startsWith(query.toLowerCase()));
        if (aWordMatch && !bWordMatch) return -1;
        if (!aWordMatch && bWordMatch) return 1;
        
        // Then prioritize by category: states > cities only
        const categoryOrder = { state: 1, city: 2, locality: 3, neighborhood: 4 };
        const aPriority = categoryOrder[a.category || 'city'];
        const bPriority = categoryOrder[b.category || 'city'];
        if (aPriority !== bPriority) return aPriority - bPriority;
        
        // Finally alphabetical order
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8); // Limit to 8 results for states and cities

    return locations;
  } catch (error) {
    console.error('Error searching Indian locations:', error);
    return [];
  }
};

// Enhanced search for precise locations including neighborhoods (for details page)
export const searchPreciseLocations = async (query: string): Promise<SearchLocation[]> => {
  if (!mapboxToken || !query || query.length < 2) return [];

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
      `access_token=${mapboxToken}&` +
      `country=IN&` +
      `types=place,locality,neighborhood,district,region,postcode,address,poi&` +
      `language=en&` +
      `limit=15`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.features) return [];

    // Get all Indian locations with precise details
    const locations = data.features
      .map((feature: any) => {
        const placeTypes = feature.place_type || [];
        
        // Determine category for better display
        let category: 'state' | 'city' | 'locality' | 'neighborhood' = 'locality';
        
        if (placeTypes.includes('region')) {
          category = 'state';
        } else if (placeTypes.includes('place')) {
          category = 'city';
        } else if (placeTypes.includes('locality')) {
          category = 'locality';
        } else if (placeTypes.includes('neighborhood')) {
          category = 'neighborhood';
        }

        return {
          name: feature.text || feature.place_name,
          fullAddress: feature.place_name,
          coordinates: feature.geometry.coordinates,
          placeType: placeTypes,
          category
        };
      })
      .sort((a: SearchLocation, b: SearchLocation) => {
        // Prioritize exact matches first
        const aExact = a.name.toLowerCase().startsWith(query.toLowerCase());
        const bExact = b.name.toLowerCase().startsWith(query.toLowerCase());
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then alphabetical order (no category priority for details page)
        return a.name.localeCompare(b.name);
      })
      .slice(0, 10);

    return locations;
  } catch (error) {
    console.error('Error searching precise locations:', error);
    return [];
  }
};

// Comprehensive search for all Indian locations (for SearchBar - most flexible)
export const searchAllIndianLocations = async (query: string): Promise<SearchLocation[]> => {
  if (!mapboxToken || !query || query.length < 2) return [];

  try {
    // Use multiple search strategies for comprehensive coverage
    const searchPromises = [
      // Primary search with all location types
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${mapboxToken}&` +
        `country=IN&` +
        `types=place,locality,neighborhood,district,region,postcode,address,poi&` +
        `language=en&` +
        `limit=25`),
      
      // Secondary search with proximity and routing focus
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${mapboxToken}&` +
        `country=IN&` +
        `types=address,poi,locality&` +
        `routing=true&` +
        `language=en&` +
        `limit=15`)
    ];

    const [primaryResponse, secondaryResponse] = await Promise.all(searchPromises);
    
    const primaryData = await primaryResponse.json();
    const secondaryData = await secondaryResponse.json();

    const allFeatures = [
      ...(primaryData.features || []),
      ...(secondaryData.features || [])
    ];

    if (allFeatures.length === 0) return [];

    // Process and deduplicate all results with enhanced categorization
    const locations = allFeatures
      .map((feature: any) => {
        const placeTypes = feature.place_type || [];
        const context = feature.context || [];
        
        // Enhanced categorization with context awareness
        let category: 'state' | 'city' | 'locality' | 'neighborhood' = 'locality';
        
        if (placeTypes.includes('region')) {
          category = 'state';
        } else if (placeTypes.includes('place') || placeTypes.includes('district')) {
          category = 'city';
        } else if (placeTypes.includes('locality') || placeTypes.includes('postcode')) {
          category = 'locality';
        } else if (placeTypes.includes('neighborhood') || placeTypes.includes('poi') || placeTypes.includes('address')) {
          category = 'neighborhood';
        }

        // Get more context for better naming
        const stateName = context.find((c: any) => c.id && c.id.includes('region'))?.text || '';
        const cityName = context.find((c: any) => c.id && c.id.includes('place'))?.text || '';
        
        return {
          name: feature.text || feature.place_name,
          fullAddress: feature.place_name,
          coordinates: feature.geometry.coordinates,
          placeType: placeTypes,
          category,
          stateName,
          cityName
        };
      })
      // Enhanced deduplication with better logic
      .filter((location: any, index: number, self: any[]) => {
        const isDuplicate = self.findIndex((l: any) => {
          // Check for exact name match or very close coordinates
          const nameMatch = l.name.toLowerCase().trim() === location.name.toLowerCase().trim();
          const coordMatch = Math.abs(l.coordinates[0] - location.coordinates[0]) < 0.0005 &&
                           Math.abs(l.coordinates[1] - location.coordinates[1]) < 0.0005;
          
          // More specific deduplication
          if (nameMatch && coordMatch) return true;
          if (l.fullAddress.toLowerCase() === location.fullAddress.toLowerCase()) return true;
          
          return false;
        });
        
        return isDuplicate === index;
      })
      .sort((a: any, b: any) => {
        // Enhanced sorting for comprehensive search
        const queryLower = query.toLowerCase();
        
        // 1. Exact matches first
        const aExact = a.name.toLowerCase() === queryLower;
        const bExact = b.name.toLowerCase() === queryLower;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // 2. Starts with query (prioritize shorter names)
        const aStarts = a.name.toLowerCase().startsWith(queryLower);
        const bStarts = b.name.toLowerCase().startsWith(queryLower);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        if (aStarts && bStarts) {
          // Shorter names first for starts-with matches
          if (a.name.length !== b.name.length) return a.name.length - b.name.length;
        }
        
        // 3. Word boundary matches (any word starts with query)
        const aWordStart = a.name.toLowerCase().split(/[\s,\-()]+/).some((word: string) => word.startsWith(queryLower));
        const bWordStart = b.name.toLowerCase().split(/[\s,\-()]+/).some((word: string) => word.startsWith(queryLower));
        if (aWordStart && !bWordStart) return -1;
        if (!aWordStart && bWordStart) return 1;
        
        // 4. Contains query anywhere
        const aContains = a.name.toLowerCase().includes(queryLower);
        const bContains = b.name.toLowerCase().includes(queryLower);
        if (aContains && !bContains) return -1;
        if (!aContains && bContains) return 1;
        
        // 5. Category priority with better weighting
        const categoryOrder: { [key: string]: number } = { state: 1, city: 2, locality: 3, neighborhood: 4 };
        const aPriority = categoryOrder[a.category || 'locality'];
        const bPriority = categoryOrder[b.category || 'locality'];
        if (aPriority !== bPriority) return aPriority - bPriority;
        
        // 6. Alphabetical for same priority
        return a.name.localeCompare(b.name);
      })
      .slice(0, 18); // Return top 18 results for comprehensive search

    return locations;
  } catch (error) {
    console.error('Error searching all Indian locations:', error);
    return [];
  }
};
