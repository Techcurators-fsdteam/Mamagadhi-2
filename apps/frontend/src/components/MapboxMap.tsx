'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { mapboxToken } from '@/lib/mapbox';

// Import Mapbox CSS
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapboxMapProps {
  originCoords?: [number, number] | null;
  destinationCoords?: [number, number] | null;
  stopovers?: Array<{ coordinates?: [number, number] }>;
  routeGeometry?: GeoJSON.Geometry;
}

const MapboxMap: React.FC<MapboxMapProps> = ({ 
  originCoords, 
  destinationCoords, 
  stopovers = [], 
  routeGeometry 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [77.2090, 28.6139], // Default to Delhi
      zoom: 10
    });

    // Wait for map to load
    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded || !originCoords || !destinationCoords) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Remove existing route if it exists
    if (map.current.getLayer('route')) {
      map.current.removeLayer('route');
    }
    if (map.current.getSource('route')) {
      map.current.removeSource('route');
    }

    // Add origin marker
    const originMarker = new mapboxgl.Marker({ color: '#22c55e' })
      .setLngLat(originCoords)
      .addTo(map.current);
    markersRef.current.push(originMarker);

    // Add destination marker
    const destinationMarker = new mapboxgl.Marker({ color: '#ef4444' })
      .setLngLat(destinationCoords)
      .addTo(map.current);
    markersRef.current.push(destinationMarker);

    // Add stopover markers
    stopovers.forEach((stopover) => {
      if (stopover.coordinates) {
        const stopoverMarker = new mapboxgl.Marker({ color: '#3b82f6' })
          .setLngLat(stopover.coordinates)
          .addTo(map.current!);
        markersRef.current.push(stopoverMarker);
      }
    });

    // Add route if geometry is available
    if (routeGeometry) {
      try {
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: routeGeometry
          }
        });

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 5,
            'line-opacity': 0.75
          }
        });
      } catch (error) {
        console.error('Error adding route to map:', error);
      }
    }

    // Fit map to show all points
    const coordinates = [originCoords, destinationCoords];
    stopovers.forEach(stopover => {
      if (stopover.coordinates) {
        coordinates.push(stopover.coordinates);
      }
    });

    if (coordinates.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      coordinates.forEach(coord => bounds.extend(coord));
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [mapLoaded, originCoords, destinationCoords, stopovers, routeGeometry]);

  if (!mapboxToken) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-2xl">
        <p className="text-gray-500">Map requires Mapbox token</p>
      </div>
    );
  }

  return <div ref={mapContainer} className="w-full h-full rounded-2xl" />;
};

export default MapboxMap;
