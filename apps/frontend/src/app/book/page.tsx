'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SearchBar from '@/components/SearchBar';
import BookingConfirmation from '@/components/booking/BookingConfirmation';
import { CheckCircle2, Users, Star, Cigarette, PawPrint, Car, User, MapPin, Clock, Zap } from 'lucide-react';
import { enhancedRideSearchClient, RideMatch, SearchResponse } from '@/lib/enhanced-ride-search';

function BookRide() {
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState('relevance');
  const [departureTime, setDepartureTime] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [verifiedProfile, setVerifiedProfile] = useState(false);
  const [searchResults, setSearchResults] = useState<RideMatch[]>([]);
  const [searchMetadata, setSearchMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleTimeFilter = (time: string) => {
    setDepartureTime(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  };

  const handleAmenityFilter = (amenity: string) => {
    setAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const clearAllFilters = () => {
    setSortBy('relevance');
    setDepartureTime([]);
    setAmenities([]);
    setVerifiedProfile(false);
  };

  const handleSearch = async (searchCriteria: any) => {
    console.log('� Enhanced search initiated:', searchCriteria);
    
    setLoading(true);
    setHasSearched(true);
    setSearchError(null);
    
    try {
      // Use the enhanced smart search
      const result: SearchResponse = await enhancedRideSearchClient.smartSearch(
        searchCriteria.origin?.location || searchCriteria.from,
        searchCriteria.destination?.location || searchCriteria.to,
        {
          travelDate: searchCriteria.travelDate || searchCriteria.date,
          passengersNeeded: searchCriteria.passengersNeeded || searchCriteria.passengers || 1,
          vehiclePreferences: searchCriteria.vehiclePreferences || (searchCriteria.vehicleType ? [searchCriteria.vehicleType] : undefined),
          maxRadius: searchCriteria.maxRadius || 30000, // 30km
          priceRange: searchCriteria.priceRange,
          timePreference: searchCriteria.timePreference
        }
      );

      console.log('✅ Enhanced search results:', result);
      
      if (result.success) {
        setSearchResults(result.results.rides);
        setSearchMetadata(result.results.metadata);
      } else {
        throw new Error('Search was not successful');
      }
    } catch (error) {
      console.error('❌ Enhanced search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Search failed. Please try again.';
      setSearchError(errorMessage);
      setSearchResults([]);
      setSearchMetadata(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle URL parameters from search bar navigation
  useEffect(() => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date');
    const passengers = searchParams.get('passengers');
    const vehicleType = searchParams.get('vehicleType');

    if (from && to && date) {
      // Auto-trigger search with URL parameters
      const searchCriteria = {
        origin: {
          coordinates: [77.0, 28.0] as [number, number],
          location: from,
          state: "Delhi"
        },
        destination: {
          coordinates: [76.0, 30.0] as [number, number],
          location: to,
          state: "Punjab"
        },
        travelDate: date,
        passengersNeeded: passengers ? parseInt(passengers) : 1,
        vehiclePreferences: vehicleType ? [vehicleType] : [],
        maxRadius: 30000
      };
      
      handleSearch(searchCriteria);
    }
  }, [searchParams]);

  // Apply client-side filtering and sorting
  const applyFiltersAndSort = (rides: RideMatch[]): RideMatch[] => {
    let filtered = [...rides];

    // Apply time filters
    if (departureTime.length > 0) {
      filtered = filtered.filter(ride => {
        const hour = new Date(ride.departure_time).getHours();
        return departureTime.some(timeRange => {
          switch (timeRange) {
            case 'morning': return hour >= 6 && hour < 12;
            case 'afternoon': return hour >= 12 && hour < 18;
            case 'evening': return hour >= 18 && hour < 24;
            case 'night': return hour >= 0 && hour < 6;
            default: return true;
          }
        });
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return b.confidence_score - a.confidence_score;
        case 'earliest':
          return new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
        case 'cheapest':
          return a.price_per_seat - b.price_per_seat;
        case 'closest':
          const aTotalDist = (a.total_distance_km || 999);
          const bTotalDist = (b.total_distance_km || 999);
          return aTotalDist - bTotalDist;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const displayRides = applyFiltersAndSort(searchResults);

  const handleBookRide = (rideId: string) => {
    const ride = displayRides.find(r => r.ride_id === rideId);
    if (ride) {
      setSelectedRide(ride);
      setShowBookingModal(true);
    }
  };

  const handleConfirmBooking = async (bookingData: any) => {
    console.log('✅ Booking confirmed:', bookingData);
    setShowBookingModal(false);
    setSelectedRide(null);
    
    // TODO: Implement actual booking API call
    alert('Ride booked successfully!');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main>
        <div className="flex flex-col items-center justify-center w-full">
          <section className="w-full max-w-6xl">
            <div className="container mx-auto p-4">
              <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center">Book a Ride</h1>
              <p className="mb-4 text-center">Select your pickup and drop-off locations, choose a vehicle, and book your ride.</p>
              
              <SearchBar onSearch={handleSearch} />
            </div>
          </section>

          {/* Search Results Section */}
          <div className="w-full max-w-7xl mx-auto px-4 mt-8">
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Filters</h3>
                    <button 
                      onClick={clearAllFilters}
                      className="text-blue-500 text-sm hover:underline"
                    >
                      Clear all
                    </button>
                  </div>

                  {/* Sort By */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Sort by</h4>
                    <div className="space-y-2">
                      {[
                        { value: 'relevance', label: 'Best Match' },
                        { value: 'earliest', label: 'Earliest Departure' },
                        { value: 'cheapest', label: 'Lowest Price' },
                        { value: 'closest', label: 'Closest Distance' }
                      ].map(option => (
                        <label key={option.value} className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            name="sortBy" 
                            value={option.value}
                            checked={sortBy === option.value}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="text-blue-500"
                          />
                          <span className="text-sm capitalize">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Departure Time */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Departure time</h4>
                    <div className="space-y-2">
                      {['6:00 - 12:00', '12:00 - 18:00', '18:00 - 00:00'].map(time => (
                        <label key={time} className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            checked={departureTime.includes(time)}
                            onChange={() => handleTimeFilter(time)}
                            className="text-blue-500"
                          />
                          <span className="text-sm">{time}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Amenities</h4>
                    <div className="space-y-2">
                      {[
                        { key: 'smoking-allowed', label: 'Smoking allowed', icon: Cigarette },
                        { key: 'max-2-back', label: 'Max 2 in the back', icon: Users },
                        { key: 'pets-allowed', label: 'Pets allowed', icon: PawPrint }
                      ].map(({ key, label, icon: Icon }) => (
                        <label key={key} className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            checked={amenities.includes(key)}
                            onChange={() => handleAmenityFilter(key)}
                            className="text-blue-500"
                          />
                          <Icon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Profile Verification */}
                  <div>
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={verifiedProfile}
                        onChange={(e) => setVerifiedProfile(e.target.checked)}
                        className="text-blue-500"
                      />
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Verified profile</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Results Area */}
              <div className="lg:col-span-3">
                {/* Loading State */}
                {loading && (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Searching for rides...</p>
                  </div>
                )}

                {/* Enhanced Search Results Header */}
                {!loading && hasSearched && searchMetadata && (
                  <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-blue-900 mb-2">
                          {displayRides.length} rides found
                        </h3>
                        <p className="text-sm text-blue-700 mb-2">
                          Search completed in {searchMetadata.searchTime} using priority-based matching
                        </p>
                        {searchMetadata.dateRange && (
                          <p className="text-xs text-blue-600">
                            📅 {searchMetadata.dateRange}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-blue-600 mb-2">Radius: {searchMetadata.searchRadius}km</div>
                        <div className="text-xs text-blue-700">
                          <div className="font-semibold">Priority Order:</div>
                          <div>1. Location (coordinates)</div>
                          <div>2. Date (±3 days)</div>
                          <div>3. Vehicle (flexible)</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Priority Distribution */}
                    {searchMetadata.priorityDistribution && (
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div className="bg-white bg-opacity-60 p-3 rounded-lg">
                          <div className="font-semibold text-blue-800 mb-1">📍 Location</div>
                          <div className="space-y-1">
                            {searchMetadata.priorityDistribution.location_priority_1 > 0 && (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>{searchMetadata.priorityDistribution.location_priority_1} direct</span>
                              </div>
                            )}
                            {searchMetadata.priorityDistribution.location_priority_2 > 0 && (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span>{searchMetadata.priorityDistribution.location_priority_2} route</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-white bg-opacity-60 p-3 rounded-lg">
                          <div className="font-semibold text-blue-800 mb-1">📅 Date</div>
                          <div className="space-y-1">
                            {searchMetadata.priorityDistribution.date_exact_match > 0 && (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>{searchMetadata.priorityDistribution.date_exact_match} exact</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span>{searchMetadata.priorityDistribution.date_within_range} ±3 days</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white bg-opacity-60 p-3 rounded-lg">
                          <div className="font-semibold text-blue-800 mb-1">🚗 Vehicle</div>
                          <div className="space-y-1">
                            {searchMetadata.priorityDistribution.vehicle_preferred > 0 && (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>{searchMetadata.priorityDistribution.vehicle_preferred} preferred</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span>All vehicle types shown</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Basic Search Results Header for fallback */}
                {!loading && hasSearched && !searchMetadata && (
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">
                      {displayRides.length > 0 
                        ? `${displayRides.length} ride${displayRides.length !== 1 ? 's' : ''} found`
                        : 'No rides found'
                      }
                    </h2>
                  </div>
                )}

                {/* Rides List */}
                {!loading && displayRides.length > 0 && (
                  <div className="space-y-4">
                    {displayRides.map((ride) => {
                      const rideMatch = ride as RideMatch;
                      const hasMatchData = rideMatch.confidence_score !== undefined;
                      
                      // Priority indicator calculations based on available fields
                      const getLocationMatch = () => {
                        if (!hasMatchData) return null;
                        if (rideMatch.match_type === 'direct') return { color: 'green', text: 'Direct route match' };
                        if (rideMatch.match_type === 'intermediate') return { color: 'yellow', text: 'Intermediate stop' };
                        return { color: 'gray', text: 'Nearby route' };
                      };
                      
                      const getMatchQuality = () => {
                        if (!hasMatchData) return null;
                        if (rideMatch.confidence_score > 80) return { color: 'green', text: 'High confidence' };
                        if (rideMatch.confidence_score > 60) return { color: 'yellow', text: 'Good match' };
                        return { color: 'orange', text: 'Possible match' };
                      };

                      const locationMatch = getLocationMatch();
                      const matchQuality = getMatchQuality();
                      
                      return (
                        <div key={ride.ride_id} className={`bg-white rounded-lg shadow-sm border-l-4 p-6 hover:shadow-md transition-shadow ${
                          hasMatchData && rideMatch.confidence_score > 80 ? 'border-l-green-500' : 
                          hasMatchData && rideMatch.confidence_score > 60 ? 'border-l-yellow-500' : 
                          'border-l-gray-300'
                        }`}>
                          {/* Enhanced Match Info Header */}
                          {hasMatchData && (
                            <div className="mb-4 pb-3 border-b border-gray-100">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                                    rideMatch.confidence_score > 80 ? 'bg-green-100 text-green-800' :
                                    rideMatch.confidence_score > 60 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {Math.round(rideMatch.confidence_score)}% match
                                  </span>
                                  {rideMatch.origin_distance_km !== undefined && (
                                    <span className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                                      {rideMatch.origin_distance_km}km from origin
                                    </span>
                                  )}
                                  {rideMatch.dest_distance_km !== undefined && (
                                    <span className="text-sm px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                                      {rideMatch.dest_distance_km}km to destination
                                    </span>
                                  )}
                                </div>
                                
                                {/* Match indicators */}
                                <div className="flex items-center space-x-4">
                                  {locationMatch && (
                                    <div className="flex items-center space-x-1 text-xs">
                                      <div className={`w-2 h-2 rounded-full ${
                                        locationMatch.color === 'green' ? 'bg-green-500' :
                                        locationMatch.color === 'yellow' ? 'bg-yellow-500' :
                                        'bg-gray-400'
                                      }`}></div>
                                      <span className="text-gray-600">📍 {locationMatch.text}</span>
                                    </div>
                                  )}
                                  {matchQuality && (
                                    <div className="flex items-center space-x-1 text-xs">
                                      <div className={`w-2 h-2 rounded-full ${
                                        matchQuality.color === 'green' ? 'bg-green-500' :
                                        matchQuality.color === 'yellow' ? 'bg-yellow-500' :
                                        'bg-orange-500'
                                      }`}></div>
                                      <span className="text-gray-600">⭐ {matchQuality.text}</span>
                                    </div>
                                  )}
                                  {rideMatch.is_intermediate_match && (
                                    <div className="flex items-center space-x-1 text-xs">
                                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                      <span className="text-gray-600">�️ Intermediate stop</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        
                          <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6">
                            {/* Time and Route */}
                            <div className="flex items-center space-x-4">
                              <div className="text-center">
                                <div className="text-lg font-semibold">{formatTime(ride.departure_time)}</div>
                                <div className="text-sm text-gray-600">{ride.origin_state}</div>
                                {ride.origin_distance_km && (
                                  <div className="text-xs text-blue-600">{ride.origin_distance_km}km away</div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <div className="w-16 h-px bg-gray-300"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-semibold">{formatTime(ride.arrival_time)}</div>
                                <div className="text-sm text-gray-600">{ride.destination_state}</div>
                                {ride.dest_distance_km && (
                                  <div className="text-xs text-blue-600">{ride.dest_distance_km}km away</div>
                                )}
                              </div>
                            </div>

                            {/* Driver Info */}
                            <div className="flex items-center space-x-4">
                              <Car className="w-8 h-8 text-gray-400" />
                              <div>
                                <div className="flex items-center space-x-2">
                                  {ride.driver && (
                                    <>
                                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-gray-600" />
                                      </div>
                                      <span className="text-sm font-medium">{ride.driver.display_name}</span>
                                    </>
                                  )}
                                  
                                  <div className="flex items-center space-x-1">
                                    <span className="text-yellow-500">★</span>
                                    <span className="text-sm">{ride.driver?.rating || 'New'}</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs text-gray-500 capitalize">{ride.vehicle_type}</span>
                                  <span className="text-xs text-gray-500">•</span>
                                  <span className="text-xs text-gray-500">{ride.seats_available} seats left</span>
                                  {ride.match_type === 'intermediate' && (
                                    <span className="text-xs text-yellow-600 font-medium">• Route Stop</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Price and Book Button */}
                          <div className="text-right flex flex-col items-end space-y-3">
                            <div className="text-2xl font-bold text-gray-900">₹{ride.price_per_seat}</div>
                            <button 
                              onClick={() => handleBookRide(ride.ride_id)}
                              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    ); // Fixed: Added missing closing bracket for the ride mapping function
                  })}

                    {/* Load More Button */}
                    {displayRides.length > 0 && (
                      <div className="text-center pt-6">
                        <button className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors">
                          Load more results
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* No Results Message */}
                {!loading && hasSearched && displayRides.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-lg">No rides found matching your criteria.</p>
                    <p className="text-gray-500 text-sm mt-2">Try adjusting your search parameters or check back later.</p>
                  </div>
                )}

                {/* No Search Yet */}
                {!hasSearched && !loading && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Search for rides above</p>
                    <p className="text-gray-500 text-sm mt-2">Enter your pickup and destination to find available rides</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Booking Confirmation Modal */}
      <BookingConfirmation
        ride={selectedRide}
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setSelectedRide(null);
        }}
        onConfirm={handleConfirmBooking}
      />
      
      <Footer />
    </div>
  );
}

export default BookRide;
