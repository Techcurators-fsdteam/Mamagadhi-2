'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Plus, X } from 'lucide-react';
import { EnhancedSearchLocation } from '@/lib/enhanced-search';

interface Stopover {
  id: string;
  name: string;
  coordinates?: [number, number];
}

interface RouteFormProps {
  formData: {
    origin: string;
    destination: string;
    originLandmark: string;
    destinationLandmark: string;
  };
  stopovers: Stopover[];
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
}

const RouteForm: React.FC<RouteFormProps> = ({
  formData,
  stopovers,
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
}) => {
  const renderLocationInput = (
    type: 'origin' | 'destination' | string,
    value: string,
    placeholder: string,
    searchResults: EnhancedSearchLocation[],
    onSearch: (query: string) => void,
    icon: React.ReactNode
  ) => (
    <div className="relative">
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          {icon}
        </div>
        <Input
          value={value}
          onChange={(e) => {
            if (type === 'origin') {
              onInputChange('origin', e.target.value);
              onOriginSearch(e.target.value);
            } else if (type === 'destination') {
              onInputChange('destination', e.target.value);
              onDestinationSearch(e.target.value);
            } else {
              onUpdateStopover(type, { name: e.target.value });
              onStopoverSearch(type, e.target.value);
            }
          }}
          placeholder={placeholder}
          className="w-full h-12 pl-12 pr-4 rounded-2xl border border-gray-200 focus:border-[#4AAAFF] focus:ring-2 focus:ring-blue-100 transition-all duration-200"
        />
        {searchLoading[type] && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#4AAAFF] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 max-h-60 overflow-y-auto z-10 shadow-lg">
          {searchResults.map((location, index) => (
            <div
              key={index}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => onLocationSelect(type, location)}
            >
              <div className="flex items-center gap-3">
                <div className="text-blue-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">{location.name}</div>
                  <div className="text-xs text-gray-500">{location.fullAddress}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Origin Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Where are you starting from?
        </label>
        {renderLocationInput(
          'origin',
          formData.origin,
          'Search origin location...',
          originSearch,
          onOriginSearch,
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        )}
      </div>

      {/* Origin Landmark */}
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-2">
          Landmark near origin 
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <MapPin className="w-4 h-4" />
          </div>
          <Input
            value={formData.originLandmark}
            onChange={(e) => onInputChange('originLandmark', e.target.value)}
            placeholder="e.g., Near Central Mall, Behind City Hospital..."
            className="w-full h-12 pl-12 pr-4 rounded-2xl border border-gray-200 focus:border-[#4AAAFF] focus:ring-2 focus:ring-blue-100 transition-all duration-200"
          />
        </div>
      </div>

      {/* Destination Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Where are you going?
        </label>
        {renderLocationInput(
          'destination',
          formData.destination,
          'Search destination location...',
          destinationSearch,
          onDestinationSearch,
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
        )}
      </div>

      {/* Destination Landmark */}
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-2">
          Landmark near destination 
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <MapPin className="w-4 h-4" />
          </div>
          <Input
            value={formData.destinationLandmark}
            onChange={(e) => onInputChange('destinationLandmark', e.target.value)}
            placeholder="e.g., Near Main Bus Stand, Opposite Park Plaza..."
            className="w-full h-12 pl-12 pr-4 rounded-2xl border border-gray-200 focus:border-[#4AAAFF] focus:ring-2 focus:ring-blue-100 transition-all duration-200"
          />
        </div>
      </div>

      {/* Stopovers */}
      {stopovers.length > 0 && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Stopovers
          </label>
          {stopovers.map((stopover) => (
            <div key={stopover.id} className="flex items-center gap-3">
              <div className="flex-1">
                {renderLocationInput(
                  stopover.id,
                  stopover.name,
                  'Search stopover location...',
                  stopoverSearches[stopover.id] || [],
                  (query) => onStopoverSearch(stopover.id, query),
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRemoveStopover(stopover.id)}
                className="h-12 w-12 rounded-full border border-gray-300 hover:border-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Stopover Button */}
      <div className="flex items-center justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={onAddStopover}
          className="h-12 px-6 rounded-full border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 hover:text-gray-900 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Stopover
        </Button>
      </div>
    </div>
  );
};

export default RouteForm;
