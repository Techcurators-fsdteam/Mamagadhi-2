'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';
import MapboxMap from '@/components/MapboxMap';

interface Stopover {
  id: string;
  name: string;
  coordinates?: [number, number];
}

interface RouteDetails {
  distance: string;
  duration: string;
  geometry: any;
}

interface RouteMapProps {
  originCoords: [number, number] | null;
  destinationCoords: [number, number] | null;
  stopovers: Stopover[];
  routeDetails: RouteDetails | null;
}

const RouteMap: React.FC<RouteMapProps> = ({
  originCoords,
  destinationCoords,
  stopovers,
  routeDetails,
}) => {
  return (
    <div className="space-y-6">
      {/* Map Container */}
      <div className="h-96 bg-gray-200 rounded-2xl overflow-hidden">
        {originCoords && destinationCoords ? (
          <MapboxMap 
            originCoords={originCoords}
            destinationCoords={destinationCoords}
            stopovers={stopovers}
            routeGeometry={routeDetails?.geometry}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-2" />
              <p className="text-lg font-medium">Map will show route when locations are selected</p>
            </div>
          </div>
        )}
      </div>

      {/* Distance and Time Section */}
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <Input
            value={routeDetails?.distance || ''}
            placeholder="Distance"
            readOnly
            className="w-full h-12 pl-4 pr-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-700"
          />
        </div>
        
        <div className="relative">
          <Input
            value={routeDetails?.duration || ''}
            placeholder="Estimate Time"
            readOnly
            className="w-full h-12 pl-4 pr-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-700"
          />
        </div>
      </div>
    </div>
  );
};

export default RouteMap;
