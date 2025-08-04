import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command, CommandEmpty, CommandGroup, CommandItem } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { searchAllIndianLocations, SearchLocation } from '@/lib/mapbox-search';

interface SearchBarProps {
  onSearch?: (searchCriteria: {
    origin: { coordinates: [number, number], location: string, state?: string },
    destination: { coordinates: [number, number], location: string, state?: string },
    travelDate: string,
    passengersNeeded: number,
    vehiclePreferences?: string[],
    maxRadius?: number
  }) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const router = useRouter();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [vehicleType, setVehicleType] = useState('');
  
  // Popover states
  const [openOrigin, setOpenOrigin] = useState(false);
  const [openDestination, setOpenDestination] = useState(false);
  const [openPassengers, setOpenPassengers] = useState(false);
  const [openVehicle, setOpenVehicle] = useState(false);
  
  // Search results and queries
  const [originSearchResults, setOriginSearchResults] = useState<SearchLocation[]>([]);
  const [destinationSearchResults, setDestinationSearchResults] = useState<SearchLocation[]>([]);
  const [originSearchQuery, setOriginSearchQuery] = useState('');
  const [destinationSearchQuery, setDestinationSearchQuery] = useState('');
  
  // Selected locations (to store coordinates)
  const [selectedOrigin, setSelectedOrigin] = useState<SearchLocation | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<SearchLocation | null>(null);

  const vehicleTypes = [
    { value: 'bike', label: 'Bike', capacity: 1 },
    { value: 'sedan', label: 'Sedan', capacity: 4 },
    { value: 'suv', label: 'SUV', capacity: 6 },
    { value: 'van', label: 'Van', capacity: 6 },
    { value: 'minibus', label: 'Mini Bus', capacity: 10 },
    { value: 'bus', label: 'Bus', capacity: 16 }
  ];

  const passengerCounts = Array.from({ length: 16 }, (_, i) => i + 1);

  const searchOriginLocations = async (query: string) => {
    if (query.length < 2) return setOriginSearchResults([]);
    try {
      const results = await searchAllIndianLocations(query);
      setOriginSearchResults(results);
    } catch {
      setOriginSearchResults([]);
    }
  };

  const searchDestinationLocations = async (query: string) => {
    if (query.length < 2) return setDestinationSearchResults([]);
    try {
      const results = await searchAllIndianLocations(query);
      setDestinationSearchResults(results);
    } catch {
      setDestinationSearchResults([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if all required fields are filled
    if (from && to && date) {
      const searchCriteria = {
        origin: {
          coordinates: selectedOrigin?.coordinates || [77.0, 28.0] as [number, number],
          location: from,
          state: selectedOrigin?.fullAddress?.split(',').slice(-2)[0]?.trim() || "Delhi"
        },
        destination: {
          coordinates: selectedDestination?.coordinates || [76.0, 30.0] as [number, number],
          location: to,
          state: selectedDestination?.fullAddress?.split(',').slice(-2)[0]?.trim() || "Punjab"
        },
        travelDate: date,
        passengersNeeded: passengers,
        vehiclePreferences: vehicleType ? [vehicleType] : [],
        maxRadius: 30000
      };

      if (onSearch) {
        onSearch(searchCriteria);
      } else {
        // Navigate to book page with query parameters
        const params = new URLSearchParams({
          from,
          to,
          date,
          passengers: passengers.toString(),
          ...(vehicleType && { vehicleType })
        });
        router.push(`/book?${params.toString()}`);
      }
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="w-full max-w-6xl bg-white border border-gray-200 rounded-xl shadow-lg flex flex-col md:flex-row items-stretch md:items-center px-3 py-2 gap-2 md:gap-3 transition-all backdrop-blur-sm overflow-hidden min-h-[48px]"
    >
      {/* Origin/From Field */}
      <div className="flex-1 min-w-0">
        <Popover open={openOrigin} onOpenChange={setOpenOrigin}>
          <PopoverTrigger asChild>
            <div className="flex items-center min-w-0 gap-2 bg-gray-50 rounded-lg px-2 py-1.5 hover:bg-blue-50 transition min-h-[36px] cursor-pointer">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span className="w-full text-left text-sm text-gray-700 min-w-0 px-1 py-0.5 h-7 truncate">
                {from || "Leaving from"}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search cities, towns, areas..."
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
                {originSearchResults.map((location) => (
                  <CommandItem
                    key={location.fullAddress}
                    value={location.name}
                    onSelect={() => {
                      setFrom(location.name);
                      setSelectedOrigin(location);
                      setOpenOrigin(false);
                      setOriginSearchQuery('');
                      setOriginSearchResults([]);
                    }}
                    className="py-2 px-3"
                  >
                    <div>
                      <div className="font-medium text-sm">{location.name}</div>
                      <div className="text-xs text-gray-500">{location.fullAddress}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Destination/To Field */}
      <div className="flex-1 min-w-0">
        <Popover open={openDestination} onOpenChange={setOpenDestination}>
          <PopoverTrigger asChild>
            <div className="flex items-center min-w-0 gap-2 bg-gray-50 rounded-lg px-2 py-1.5 hover:bg-blue-50 transition min-h-[36px] cursor-pointer">
              <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              <span className="w-full text-left text-sm text-gray-700 min-w-0 px-1 py-0.5 h-7 truncate">
                {to || "Going to"}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search cities, towns, areas..."
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
                {destinationSearchResults.map((location) => (
                  <CommandItem
                    key={location.fullAddress}
                    value={location.name}
                    onSelect={() => {
                      setTo(location.name);
                      setSelectedDestination(location);
                      setOpenDestination(false);
                      setDestinationSearchQuery('');
                      setDestinationSearchResults([]);
                    }}
                    className="py-2 px-3"
                  >
                    <div>
                      <div className="font-medium text-sm">{location.name}</div>
                      <div className="text-xs text-gray-500">{location.fullAddress}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Date Field */}
      <div className="flex items-center flex-1 min-w-0 gap-2 bg-gray-50 rounded-lg px-2 py-1.5 focus-within:bg-blue-50 transition min-h-[36px]">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full border-0 bg-transparent focus:ring-0 text-gray-700 text-sm min-w-0 px-1 py-0.5 h-7 outline-none"
        />
      </div>
      
      {/* Passengers Field */}
      <div className="flex-1 min-w-0">
        <Popover open={openPassengers} onOpenChange={setOpenPassengers}>
          <PopoverTrigger asChild>
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1.5 hover:bg-blue-50 transition min-h-[36px] cursor-pointer">
              <span className="w-full text-left text-sm text-gray-700 min-w-0 px-1 py-0.5 h-7">
                {passengers} {passengers === 1 ? 'passenger' : 'passengers'}
              </span>
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
                      setPassengers(count);
                      setOpenPassengers(false);
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
      </div>

      {/* Vehicle Type Field */}
      <div className="flex-1 min-w-0">
        <Popover open={openVehicle} onOpenChange={setOpenVehicle}>
          <PopoverTrigger asChild>
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1.5 hover:bg-blue-50 transition min-h-[36px] cursor-pointer">
              <span className="w-full text-left text-sm text-gray-700 min-w-0 px-1 py-0.5 h-7 truncate">
                {vehicleTypes.find(v => v.value === vehicleType)?.label || "Any vehicle"}
              </span>
              <div className="text-gray-400 text-xs">▼</div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandEmpty>No vehicle type found.</CommandEmpty>
              <CommandGroup className="max-h-40 overflow-auto">
                <CommandItem
                  value=""
                  onSelect={() => {
                    setVehicleType('');
                    setOpenVehicle(false);
                  }}
                  className="py-2"
                >
                  Any vehicle
                </CommandItem>
                {vehicleTypes.map((type) => (
                  <CommandItem
                    key={type.value}
                    value={type.value}
                    onSelect={() => {
                      setVehicleType(type.value);
                      setOpenVehicle(false);
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
      </div>
      
      {/* Search Button */}
      <div className="flex items-center justify-center w-full md:w-auto md:flex-shrink-0 md:basis-[120px] lg:basis-[150px] h-9">
        <button 
          type="submit" 
          className="h-8 px-4 md:px-6 rounded-lg font-semibold text-sm bg-[#4AAAFF] text-white hover:bg-[#2196f3] transition w-full md:w-auto shadow-md min-w-[100px] flex items-center justify-center"
        >
          Search
        </button>
      </div>
    </form>
  );
};

export default SearchBar; 