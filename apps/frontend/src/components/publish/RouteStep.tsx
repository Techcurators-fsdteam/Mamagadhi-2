'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import RouteForm from './RouteForm';
import RouteMap from './RouteMap';
import { EnhancedSearchLocation } from '@/lib/enhanced-search';

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

interface RouteStepProps {
  formData: {
    origin: string;
    destination: string;
  };
  stopovers: Stopover[];
  originCoords: [number, number] | null;
  destinationCoords: [number, number] | null;
  routeDetails: RouteDetails | null;
  originSearch: EnhancedSearchLocation[];
  destinationSearch: EnhancedSearchLocation[];
  stopoverSearches: { [key: string]: EnhancedSearchLocation[] };
  searchLoading: { [key: string]: boolean };
  onInputChange: (field: string, value: string) => void;
  onOriginSearch: (query: string) => void;
  onDestinationSearch: (query: string) => void;
  onStopoverSearch: (stopoverId: string, query: string) => void;
  onLocationSelect: (type: 'origin' | 'destination' | string, location: EnhancedSearchLocation) => void;
  onAddStopover: () => void;
  onRemoveStopover: (id: string) => void;
  onUpdateStopover: (id: string, updates: Partial<Stopover>) => void;
  onNext: () => void;
}

const RouteStep: React.FC<RouteStepProps> = ({
  formData,
  stopovers,
  originCoords,
  destinationCoords,
  routeDetails,
  originSearch,
  destinationSearch,
  stopoverSearches,
  searchLoading,
  onInputChange,
  onOriginSearch,
  onDestinationSearch,
  onStopoverSearch,
  onLocationSelect,
  onAddStopover,
  onRemoveStopover,
  onUpdateStopover,
  onNext,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Route Form */}
      <div className="space-y-6">
        <RouteForm
          formData={formData}
          stopovers={stopovers}
          originSearch={originSearch}
          destinationSearch={destinationSearch}
          stopoverSearches={stopoverSearches}
          searchLoading={searchLoading}
          onInputChange={onInputChange}
          onOriginSearch={onOriginSearch}
          onDestinationSearch={onDestinationSearch}
          onStopoverSearch={onStopoverSearch}
          onLocationSelect={onLocationSelect}
          onAddStopover={onAddStopover}
          onRemoveStopover={onRemoveStopover}
          onUpdateStopover={onUpdateStopover}
        />
      </div>

      {/* Right Column - Map and Route Info */}
      <div className="space-y-6">
        <RouteMap
          originCoords={originCoords}
          destinationCoords={destinationCoords}
          stopovers={stopovers}
          routeDetails={routeDetails}
        />

        {/* Next Button */}
        <div className="flex justify-end">
          <Button
            className="px-8 py-3 bg-[#4AAAFF] hover:bg-blue-600 text-white rounded-2xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onNext}
            disabled={!originCoords || !destinationCoords}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RouteStep;
