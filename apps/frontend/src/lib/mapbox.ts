import MapboxClient from '@mapbox/mapbox-sdk';
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import mbxGeocoding, { GeocodeQueryType } from '@mapbox/mapbox-sdk/services/geocoding';

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!mapboxToken) {
  console.warn('Mapbox token not found. Please set NEXT_PUBLIC_MAPBOX_TOKEN in your environment variables.');
}

// Initialize Mapbox clients
const baseClient = MapboxClient({ accessToken: mapboxToken || '' });
const directionsClient = mbxDirections(baseClient);
const geocodingClient = mbxGeocoding(baseClient);

export interface LocationResult {
  name: string;
  fullAddress: string;
  coordinates: [number, number]; // [lng, lat]
  place_type: string[];
  type?: 'state' | 'city'; // Optional type for categorization
}

export interface RouteResult {
  geometry: GeoJSON.Geometry;
  distance: number; // in meters
  duration: number; // in seconds
}

// Search for places (cities, states) with filtering for major locations
export const searchLocations = async (query: string, types: GeocodeQueryType[] = ['place', 'region']): Promise<LocationResult[]> => {
  if (!mapboxToken || !query || query.length < 2) return [];

  try {
    const response = await geocodingClient
      .forwardGeocode({
        query,
        countries: ['IN'], // Restrict to India
        types,
        limit: 10,
        language: ['en'],
      })
      .send();

    return response.body.features.map((feature: any) => ({
      name: feature.text || feature.place_name,
      fullAddress: feature.place_name,
      coordinates: feature.geometry.coordinates,
      place_type: feature.place_type,
    }));
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
};

// Search for exact addresses and specific locations
export const searchExactLocations = async (query: string): Promise<LocationResult[]> => {
  if (!mapboxToken || !query || query.length < 3) return [];

  try {
    const response = await geocodingClient
      .forwardGeocode({
        query,
        countries: ['IN'],
        types: ['address', 'poi', 'place'],
        limit: 10,
        language: ['en'],
      })
      .send();

    return response.body.features.map((feature: any) => ({
      name: feature.text || feature.place_name,
      fullAddress: feature.place_name,
      coordinates: feature.geometry.coordinates,
      place_type: feature.place_type,
    }));
  } catch (error) {
    console.error('Error searching exact locations:', error);
    return [];
  }
};

// Get route between locations with optional stopovers
export const getRoute = async (
  origin: [number, number],
  destination: [number, number],
  stopovers: [number, number][] = []
): Promise<RouteResult | null> => {
  if (!mapboxToken || !origin || !destination) return null;

  try {
    const waypoints = [
      { coordinates: origin },
      ...stopovers.map(coord => ({ coordinates: coord })),
      { coordinates: destination },
    ];

    const response = await directionsClient
      .getDirections({
        profile: 'driving',
        waypoints,
        geometries: 'geojson',
        overview: 'full',
        steps: true,
      })
      .send();

    const route = response.body.routes[0];
    
    return {
      geometry: route.geometry,
      distance: route.distance,
      duration: route.duration,
    };
  } catch (error) {
    console.error('Error getting route:', error);
    return null;
  }
};

// Format duration from seconds to human readable
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Format distance from meters to km
export const formatDistance = (meters: number): string => {
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
};

export { mapboxToken };
