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

// Enhanced search using Mapbox Geocoding API for Indian states and major cities (for publish page)
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

    // Filter and categorize results for Indian locations
    const locations = data.features
      .map((feature: any) => {
        const placeTypes = feature.place_type || [];
        const context = feature.context || [];
        
        // Determine category based on place type and context
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
        // Prioritize exact matches
        const aExact = a.name.toLowerCase().startsWith(query.toLowerCase());
        const bExact = b.name.toLowerCase().startsWith(query.toLowerCase());
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then prioritize by category: states > cities > localities > neighborhoods
        const categoryOrder = { state: 1, city: 2, locality: 3, neighborhood: 4 };
        const aPriority = categoryOrder[a.category || 'locality'];
        const bPriority = categoryOrder[b.category || 'locality'];
        if (aPriority !== bPriority) return aPriority - bPriority;
        
        // Finally alphabetical order
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8);

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
