import React, { useState } from 'react';
import { Button } from './ui/button';
import { Command, CommandEmpty, CommandGroup, CommandItem } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './ui/select';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { searchEnhancedLocations, EnhancedSearchLocation } from '@/lib/enhanced-search';

const vehicleTypes = ['Car', 'Bike', 'Van', 'Bus'];
const passengerCounts = [1, 2, 3, 4, 5, 6];

const iconClass = 'text-[#5B7A85] w-4 h-4 mr-1 shrink-0';

const SearchBar = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [passengers, setPassengers] = useState(1);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Location search states
  const [fromSearchQuery, setFromSearchQuery] = useState('');
  const [toSearchQuery, setToSearchQuery] = useState('');
  const [fromSearchResults, setFromSearchResults] = useState<EnhancedSearchLocation[]>([]);
  const [toSearchResults, setToSearchResults] = useState<EnhancedSearchLocation[]>([]);
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);

  // Search for enhanced locations optimized for carpooling
  const searchFromLocations = async (query: string) => {
    if (query.length < 2) {
      setFromSearchResults([]);
      return;
    }
    try {
      const results = await searchEnhancedLocations(query, {
        limit: 8,
        carpoolingMode: true
      });
      setFromSearchResults(results);
    } catch (error) {
      console.error('Error searching from locations:', error);
      setFromSearchResults([]);
    }
  };

  const searchToLocations = async (query: string) => {
    if (query.length < 2) {
      setToSearchResults([]);
      return;
    }
    try {
      const results = await searchEnhancedLocations(query, {
        limit: 8,
        carpoolingMode: true
      });
      setToSearchResults(results);
    } catch (error) {
      console.error('Error searching to locations:', error);
      setToSearchResults([]);
    }
  };

  return (
    <form
      className="w-full max-w-[98vw] sm:max-w-[95vw] md:max-w-3xl lg:max-w-4xl bg-white/95 border border-gray-200 rounded-xl shadow-lg flex flex-col md:flex-row items-stretch md:items-center px-1 sm:px-2 py-1 sm:py-2 gap-1 md:gap-2 transition-all backdrop-blur-sm overflow-hidden min-h-[38px]"
      style={{ minWidth: 180 }}
      onSubmit={e => { e.preventDefault(); }}
    >
      {/* FROM */}
      <div className="flex items-center flex-1 min-w-0 basis-[70px] sm:basis-[110px] md:basis-0 gap-1 bg-white rounded-lg px-0.5 py-0.5 focus-within:bg-blue-50 transition min-h-[32px]">
        <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
        <Popover open={openFrom} onOpenChange={setOpenFrom}>
          <PopoverTrigger asChild>
            <div className="w-full border-0 bg-transparent focus:ring-0 text-[#5B7A85] text-[11px] sm:text-xs min-w-0 px-0.5 py-0.5 h-7 sm:h-8 cursor-pointer flex items-center">
              <span className="truncate min-w-0">
                {from || "Leaving from"}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search precise location..."
                  value={fromSearchQuery}
                  onChange={(e) => {
                    setFromSearchQuery(e.target.value);
                    searchFromLocations(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <CommandEmpty>No location found.</CommandEmpty>
              <CommandGroup className="max-h-48 overflow-auto">
                {fromSearchResults.map((location) => (
                  <CommandItem
                    key={location.fullAddress}
                    value={location.name}
                    onSelect={() => {
                      setFrom(location.name);
                      setOpenFrom(false);
                      setFromSearchQuery('');
                      setFromSearchResults([]);
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
      {/* TO */}
      <div className="flex items-center flex-1 min-w-0 basis-[70px] sm:basis-[110px] md:basis-0 gap-1 bg-white rounded-lg px-0.5 py-0.5 focus-within:bg-blue-50 transition min-h-[32px]">
        <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
        <Popover open={openTo} onOpenChange={setOpenTo}>
          <PopoverTrigger asChild>
            <div className="w-full border-0 bg-transparent focus:ring-0 text-[#5B7A85] text-[11px] sm:text-xs min-w-0 px-0.5 py-0.5 h-7 sm:h-8 cursor-pointer flex items-center">
              <span className="truncate min-w-0">
                {to || "Going to"}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search precise location..."
                  value={toSearchQuery}
                  onChange={(e) => {
                    setToSearchQuery(e.target.value);
                    searchToLocations(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <CommandEmpty>No location found.</CommandEmpty>
              <CommandGroup className="max-h-48 overflow-auto">
                {toSearchResults.map((location) => (
                  <CommandItem
                    key={location.fullAddress}
                    value={location.name}
                    onSelect={() => {
                      setTo(location.name);
                      setOpenTo(false);
                      setToSearchQuery('');
                      setToSearchResults([]);
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
      {/* VEHICLE */}
      <div className="flex items-center flex-1 min-w-0 basis-[70px] sm:basis-[110px] md:basis-0 gap-1 bg-white rounded-lg px-0.5 py-0.5 focus-within:bg-blue-50 transition min-h-[32px]">
        <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="6" rx="2"/><rect x="7" y="7" width="10" height="4" rx="2"/></svg>
        <Select value={vehicle} onValueChange={setVehicle}>
          <SelectTrigger className="w-full border-0 bg-transparent focus:ring-0 text-[#5B7A85] text-[11px] sm:text-xs min-w-0 px-0.5 py-0.5 h-7 sm:h-8">
            <SelectValue placeholder="Vehicle type" className="truncate min-w-0" />
          </SelectTrigger>
          <SelectContent side="bottom" align="start">
            {vehicleTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* DATE */}
      <div className="flex items-center flex-1 min-w-0 basis-[70px] sm:basis-[110px] md:basis-0 gap-1 bg-white rounded-lg px-0.5 py-0.5 focus-within:bg-blue-50 transition min-h-[32px]">
        <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 9h18"/></svg>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal border-0 bg-transparent px-0 text-[#5B7A85] text-[11px] sm:text-xs min-w-0 h-7 sm:h-8"
            >
              {date ? format(date, 'PPP') : <span className="text-[#5B7A85]">Select date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 z-50" align="start" side="bottom">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      {/* PASSENGERS */}
      <div className="flex items-center flex-1 min-w-0 basis-[70px] sm:basis-[110px] md:basis-0 gap-1 bg-white rounded-lg px-0.5 py-0.5 focus-within:bg-blue-50 transition min-h-[32px]">
        <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20v-2a4 4 0 014-4h8a4 4 0 014 4v2"/></svg>
        <Select value={String(passengers)} onValueChange={v => setPassengers(Number(v))}>
          <SelectTrigger className="w-full border-0 bg-transparent focus:ring-0 text-[#5B7A85] text-[11px] sm:text-xs min-w-0 px-0.5 py-0.5 h-7 sm:h-8">
            <SelectValue placeholder="1 passenger" className="truncate min-w-0" />
          </SelectTrigger>
          <SelectContent side="bottom" align="start">
            {passengerCounts.map(count => (
              <SelectItem key={count} value={String(count)}>{count} {count === 1 ? 'passenger' : 'passengers'}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* SEARCH BUTTON */}
      <div className="flex items-center justify-center w-full md:w-auto md:flex-shrink-0 md:basis-[120px] lg:basis-[150px] h-7 sm:h-8">
        <Button type="submit" className="h-9 sm:h-9 px-4 md:px-8 rounded-[10px] font-semibold text-[11px] sm:text-xs md:text-base bg-[#4AAEFF] text-white hover:bg-[#2196f3] transition w-full md:w-auto mt-0 shadow-md min-w-[100px] sm:min-w-[120px] lg:min-w-[150px] flex items-center justify-center">
          Search
        </Button>
      </div>
    </form>
  );
};

export default SearchBar; 