'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Command, CommandEmpty, CommandGroup, CommandItem } from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { searchIndianStatesAndCities, SearchLocation } from '@/lib/mapbox-search';

interface FormData {
  passengers: string;
  vehicleType: string;
  origin: string;
  destination: string;
}

interface PublishSearchFormProps {
  formData: FormData;
  onInputChange: (field: string, value: string) => void;
}

const PublishSearchForm: React.FC<PublishSearchFormProps> = ({ formData, onInputChange }) => {
  const router = useRouter();
  const [openPassengers, setOpenPassengers] = useState(false);
  const [openVehicle, setOpenVehicle] = useState(false);
  const [openOrigin, setOpenOrigin] = useState(false);
  const [openDestination, setOpenDestination] = useState(false);
  
  // Search states for API results
  const [originSearchResults, setOriginSearchResults] = useState<SearchLocation[]>([]);
  const [destinationSearchResults, setDestinationSearchResults] = useState<SearchLocation[]>([]);
  const [originSearchQuery, setOriginSearchQuery] = useState('');
  const [destinationSearchQuery, setDestinationSearchQuery] = useState('');
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Vehicle and passenger data
  const vehicleTypes = [
    { value: 'bike', label: 'Bike', capacity: 1 },
    { value: 'car', label: 'Car', capacity: 4 },
    { value: 'big-car', label: 'Big Car', capacity: 6 },
    { value: 'van', label: 'Van', capacity: 6 },
    { value: 'minibus', label: 'Mini Bus', capacity: 10 },
    { value: 'bus', label: 'Bus', capacity: 16 }
  ];
  const passengerCounts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

  // Search for states and cities using enhanced Mapbox API
  const searchOriginLocations = async (query: string) => {
    if (query.length < 2) {
      setOriginSearchResults([]);
      return;
    }
    try {
      const results = await searchIndianStatesAndCities(query);
      setOriginSearchResults(results);
    } catch (error) {
      console.error('Error searching origin:', error);
      setOriginSearchResults([]);
    }
  };

  const searchDestinationLocations = async (query: string) => {
    if (query.length < 2) {
      setDestinationSearchResults([]);
      return;
    }
    try {
      const results = await searchIndianStatesAndCities(query);
      setDestinationSearchResults(results);
    } catch (error) {
      console.error('Error searching destination:', error);
      setDestinationSearchResults([]);
    }
  };

  const handlePublishClick = () => {
    const errors: {[key: string]: string} = {};
    
    // Validate required fields
    if (!formData.passengers) errors.passengers = 'Please select number of passengers';
    if (!formData.vehicleType) errors.vehicleType = 'Please select vehicle type';
    if (!formData.origin) errors.origin = 'Please select origin state';
    if (!formData.destination) errors.destination = 'Please select destination state';
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Clear errors after 3 seconds
      setTimeout(() => setValidationErrors({}), 3000);
      return;
    }

    // Navigate to details page with only passenger and vehicle data
    const params = new URLSearchParams({
      passengers: formData.passengers,
      vehicleType: formData.vehicleType,
    });
    
    router.push(`/publish/details?${params.toString()}`);
  };

  return (
    <div className="rounded-xl shadow-2xl border border-gray-100 w-full max-w-sm sm:max-w-md lg:max-w-lg h-[400px] flex flex-col backdrop-blur-sm bg-white/95">
      {/* Header */}
      <div className="p-4 pb-2">
        <h3 className="text-lg font-bold text-gray-800 text-center">Ride Details</h3>
        <p className="text-sm text-gray-600 text-center">Select your preferences</p>
      </div>
      
      {/* Form Fields */}
      <div className="flex-1 p-4 pt-2 space-y-3 overflow-y-auto">
        {/* Origin City */}
        <div className="relative">
          <Popover open={openOrigin} onOpenChange={setOpenOrigin}>
            <PopoverTrigger asChild>
              <div className={`flex items-center gap-3 p-3 border rounded-lg hover:border-gray-300 hover:shadow-md transition-all cursor-pointer bg-gray-50/80 hover:bg-white group ${
                validationErrors.origin ? 'border-red-500 bg-red-50' : 'border-gray-200'
              }`}>
                <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-semibold text-gray-700">
                    {formData.origin || "From (Origin State/City)"}
                  </span>
                </div>
                <div className="text-gray-400 text-sm">▼</div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Search states and cities..."
                    value={originSearchQuery}
                    onChange={(e) => {
                      setOriginSearchQuery(e.target.value);
                      searchOriginLocations(e.target.value);
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>
                <CommandEmpty>No location found.</CommandEmpty>
                <CommandGroup className="max-h-48 overflow-auto">
                  {(() => {
                    const states = originSearchResults.filter(r => r.category === 'state');
                    const cities = originSearchResults.filter(r => r.category === 'city' || r.category === 'locality');
                    
                    return (
                      <>
                        {states.map((location) => (
                          <CommandItem
                            key={location.fullAddress}
                            value={location.name}
                            onSelect={() => {
                              onInputChange('origin', location.name);
                              setOpenOrigin(false);
                              setOriginSearchQuery('');
                              setOriginSearchResults([]);
                              setValidationErrors(prev => ({ ...prev, origin: '' }));
                            }}
                            className="py-2 px-3"
                          >
                            <div>
                              <div className="font-medium text-sm">{location.name}</div>
                              <div className="text-xs text-gray-500">{location.fullAddress}</div>
                            </div>
                          </CommandItem>
                        ))}
                        {cities.length > 0 && states.length > 0 && (
                          <div className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-50">Cities & Localities</div>
                        )}
                        {cities.map((location) => (
                          <CommandItem
                            key={location.fullAddress}
                            value={location.name}
                            onSelect={() => {
                              onInputChange('origin', location.name);
                              setOpenOrigin(false);
                              setOriginSearchQuery('');
                              setOriginSearchResults([]);
                              setValidationErrors(prev => ({ ...prev, origin: '' }));
                            }}
                            className="py-2 px-3"
                          >
                            <div>
                              <div className="font-medium text-sm">{location.name}</div>
                              <div className="text-xs text-gray-500">{location.fullAddress}</div>
                            </div>
                          </CommandItem>
                        ))}
                      </>
                    );
                  })()}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          {validationErrors.origin && (
            <div className="text-red-500 text-xs mt-1 ml-2 animate-pulse">{validationErrors.origin}</div>
          )}
        </div>

        {/* Destination City */}
        <div className="relative">
          <Popover open={openDestination} onOpenChange={setOpenDestination}>
            <PopoverTrigger asChild>
              <div className={`flex items-center gap-3 p-3 border rounded-lg hover:border-gray-300 hover:shadow-md transition-all cursor-pointer bg-gray-50/80 hover:bg-white group ${
                validationErrors.destination ? 'border-red-500 bg-red-50' : 'border-gray-200'
              }`}>
                <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-semibold text-gray-700">
                    {formData.destination || "To (Destination State/City)"}
                  </span>
                </div>
                <div className="text-gray-400 text-sm">▼</div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Search states and cities..."
                    value={destinationSearchQuery}
                    onChange={(e) => {
                      setDestinationSearchQuery(e.target.value);
                      searchDestinationLocations(e.target.value);
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>
                <CommandEmpty>No location found.</CommandEmpty>
                <CommandGroup className="max-h-48 overflow-auto">
                  {(() => {
                    const states = destinationSearchResults.filter(r => r.category === 'state');
                    const cities = destinationSearchResults.filter(r => r.category === 'city' || r.category === 'locality');
                    
                    return (
                      <>
                        {states.map((location) => (
                          <CommandItem
                            key={location.fullAddress}
                            value={location.name}
                            onSelect={() => {
                              onInputChange('destination', location.name);
                              setOpenDestination(false);
                              setDestinationSearchQuery('');
                              setDestinationSearchResults([]);
                              setValidationErrors(prev => ({ ...prev, destination: '' }));
                            }}
                            className="py-2 px-3"
                          >
                            <div>
                              <div className="font-medium text-sm">{location.name}</div>
                              <div className="text-xs text-gray-500">{location.fullAddress}</div>
                            </div>
                          </CommandItem>
                        ))}
                        {cities.length > 0 && states.length > 0 && (
                          <div className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-50">Cities & Localities</div>
                        )}
                        {cities.map((location) => (
                          <CommandItem
                            key={location.fullAddress}
                            value={location.name}
                            onSelect={() => {
                              onInputChange('destination', location.name);
                              setOpenDestination(false);
                              setDestinationSearchQuery('');
                              setDestinationSearchResults([]);
                              setValidationErrors(prev => ({ ...prev, destination: '' }));
                            }}
                            className="py-2 px-3"
                          >
                            <div>
                              <div className="font-medium text-sm">{location.name}</div>
                              <div className="text-xs text-gray-500">{location.fullAddress}</div>
                            </div>
                          </CommandItem>
                        ))}
                      </>
                    );
                  })()}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          {validationErrors.destination && (
            <div className="text-red-500 text-xs mt-1 ml-2 animate-pulse">{validationErrors.destination}</div>
          )}
        </div>

        {/* Passengers and Vehicle Type - Two column layout */}
        <div className="grid grid-cols-2 gap-3">
          {/* Passengers */}
          <div className="relative">
            <Popover open={openPassengers} onOpenChange={setOpenPassengers}>
              <PopoverTrigger asChild>
                <div className={`flex items-center gap-2 p-3 border rounded-lg hover:border-gray-300 hover:shadow-md transition-all cursor-pointer bg-gray-50/80 hover:bg-white group ${
                  validationErrors.passengers ? 'border-red-500 bg-red-50' : 'border-gray-200'
                }`}>
                  <div className="text-gray-600 text-xs font-medium flex-shrink-0">Passengers</div>
                  <div className="flex-1 text-left">
                    <span className="text-xs font-semibold text-gray-700">
                      {passengerCounts.includes(parseInt(formData.passengers)) ? formData.passengers : "Select"}
                    </span>
                  </div>
                  <div className="text-gray-400 text-xs">▼</div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandEmpty>No option found.</CommandEmpty>
                  <CommandGroup className="max-h-40 overflow-auto">
                    {passengerCounts.map((count) => (
                      <CommandItem
                        key={count}
                        value={count.toString()}
                        onSelect={() => {
                          onInputChange('passengers', count.toString());
                          setOpenPassengers(false);
                          setValidationErrors(prev => ({ ...prev, passengers: '' }));
                        }}
                        className="py-2"
                      >
                        {count} {count === 1 ? 'passenger' : 'passengers'}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            {validationErrors.passengers && (
              <div className="text-red-500 text-xs mt-1 ml-2 animate-pulse">{validationErrors.passengers}</div>
            )}
          </div>

          {/* Vehicle Type */}
          <div className="relative">
            <Popover open={openVehicle} onOpenChange={setOpenVehicle}>
              <PopoverTrigger asChild>
                <div className={`flex items-center gap-2 p-3 border rounded-lg hover:border-gray-300 hover:shadow-md transition-all cursor-pointer bg-gray-50/80 hover:bg-white group ${
                  validationErrors.vehicleType ? 'border-red-500 bg-red-50' : 'border-gray-200'
                }`}>
                  <div className="text-gray-600 text-xs font-medium flex-shrink-0">Vehicle</div>
                  <div className="flex-1 text-left">
                    <span className="text-xs font-semibold text-gray-700">
                      {vehicleTypes.find(v => v.value === formData.vehicleType)?.label || "Select"}
                    </span>
                  </div>
                  <div className="text-gray-400 text-xs">▼</div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandEmpty>No vehicle type found.</CommandEmpty>
                  <CommandGroup className="max-h-40 overflow-auto">
                    {vehicleTypes.map((type) => (
                      <CommandItem
                        key={type.value}
                        value={type.value}
                        onSelect={() => {
                          onInputChange('vehicleType', type.value);
                          setOpenVehicle(false);
                          setValidationErrors(prev => ({ ...prev, vehicleType: '' }));
                        }}
                        className="py-2"
                      >
                        {type.label} (Max: {type.capacity})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            {validationErrors.vehicleType && (
              <div className="text-red-500 text-xs mt-1 ml-2 animate-pulse">{validationErrors.vehicleType}</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Button Container */}
      <div className="p-4 pt-1">
        <Button 
          onClick={handlePublishClick}
          className="w-full py-3 text-sm font-bold rounded-lg bg-gradient-to-r from-[#4AAAFF] to-[#6BB6FF] hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Publish Ride
        </Button>
      </div>
    </div>
  );
};

export default PublishSearchForm;