"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import SearchBar from "@/components/SearchBar";
import { Car, User } from "lucide-react";
import {
  enhancedRideSearchClient,
  SearchResponse,
} from "@/lib/enhanced-ride-search";
import { useAuth } from "@/lib/auth";
import { formatTimeIST, formatDateShortIST, isDifferentDayIST } from '@/lib/timezone-utils';
import toast from "react-hot-toast";

interface RideMatch {
  ride_id: string;
  vehicle_type: string;
  origin: string;
  destination: string;
  origin_state: string;
  destination_state: string;
  departure_time: string;
  arrival_time: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  status: string;
  created_at: string;
  driver_id: string;
  driver: {
    display_name: string;
    first_name: string;
    last_name: string;
    profile_picture_url: string | null;
  };
  match_percentage: number;
  match_reason: string;
  stopovers?: Array<{
    landmark: string;
    sequence: number;
  }>;
}

function BookRide() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [sortBy, setSortBy] = useState("relevance");
  const [departureTime, setDepartureTime] = useState<string[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [priceRanges, setPriceRanges] = useState<string[]>([]);
  const [availableVehicleTypes, setAvailableVehicleTypes] = useState<string[]>(
    []
  );
  const [searchResults, setSearchResults] = useState<RideMatch[]>([]);
  const [searchMetadata, setSearchMetadata] = useState<any>(null);
  const [searchOrigin, setSearchOrigin] = useState<string>("");
  const [searchDestination, setSearchDestination] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [displayedRidesCount, setDisplayedRidesCount] = useState(4); // Show 4 rides initially
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const handleTimeFilter = (time: string) => {
    setDepartureTime((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const handleVehicleTypeFilter = (vehicleType: string) => {
    setVehicleTypes((prev) =>
      prev.includes(vehicleType)
        ? prev.filter((v) => v !== vehicleType)
        : [...prev, vehicleType]
    );
  };

  const handlePriceFilter = (priceRange: string) => {
    setPriceRanges((prev) =>
      prev.includes(priceRange)
        ? prev.filter((p) => p !== priceRange)
        : [...prev, priceRange]
    );
  };

  const clearAllFilters = () => {
    setSortBy("relevance");
    setDepartureTime([]);
    setVehicleTypes([]);
    setPriceRanges([]);
  };

  const handleLoadMore = () => {
    setDisplayedRidesCount((prev) => prev + 4); // Load 4 more rides
  };

  const handleSearch = async (searchCriteria: any) => {
    console.log("🔍 Custom search initiated:", searchCriteria);

    setLoading(true);
    setHasSearched(true);
    setSearchError(null);
    setDisplayedRidesCount(4); // Reset to show 4 rides initially

    try {
      // Store search criteria in sessionStorage
      sessionStorage.setItem(
        "lastSearchCriteria",
        JSON.stringify(searchCriteria)
      );

      // Extract the required fields from searchCriteria
      const origin =
        searchCriteria.origin?.location || searchCriteria.from || "";
      const destination =
        searchCriteria.destination?.location || searchCriteria.to || "";
      const passengersNeeded =
        searchCriteria.passengersNeeded || searchCriteria.passengers || 1;

      // Store origin and destination for display
      sessionStorage.setItem("searchOrigin", origin);
      sessionStorage.setItem("searchDestination", destination);

      // Validate required fields
      if (!origin || !destination) {
        throw new Error("Please enter both origin and destination");
      }

      // Use the enhanced smart search with properly structured data
      const result: SearchResponse = await enhancedRideSearchClient.smartSearch(
        origin,
        destination,
        passengersNeeded
      );

      console.log("✅ Search completed successfully:", result);

      // Store search criteria in state for display
      setSearchOrigin(origin);
      setSearchDestination(destination);

      setSearchResults(result.results.rides || []);
      setSearchMetadata(result.results.metadata);
      setSearchError(null);

      // Extract unique vehicle types from search results
      const uniqueVehicleTypes = [
        ...new Set(
          (result.results.rides || []).map((ride) => ride.vehicle_type)
        ),
      ];
      setAvailableVehicleTypes(uniqueVehicleTypes);
    } catch (error) {
      console.error("❌ Search failed:", error);
      setSearchError(error instanceof Error ? error.message : "Search failed");
      setSearchResults([]);
      setSearchMetadata(null);
    } finally {
      setLoading(false);
    }
  };

  // Restore search state from sessionStorage
  const restoreSearchState = () => {
    try {
      const savedResults = sessionStorage.getItem("searchResults");
      const savedMetadata = sessionStorage.getItem("searchMetadata");
      const savedVehicleTypes = sessionStorage.getItem("availableVehicleTypes");
      const savedOrigin = sessionStorage.getItem("searchOrigin");
      const savedDestination = sessionStorage.getItem("searchDestination");

      if (savedResults) {
        setSearchResults(JSON.parse(savedResults));
        setHasSearched(true);
      }

      if (savedMetadata) {
        setSearchMetadata(JSON.parse(savedMetadata));
      }

      if (savedVehicleTypes) {
        setAvailableVehicleTypes(JSON.parse(savedVehicleTypes));
      }

      if (savedOrigin) {
        setSearchOrigin(savedOrigin);
      }

      if (savedDestination) {
        setSearchDestination(savedDestination);
      }
    } catch (error) {
      console.error("Failed to restore search state:", error);
    }
  };

  // Load saved search state on component mount
  useEffect(() => {
    restoreSearchState();
  }, []);

  // Apply filters and sorting to search results
  const applyFiltersAndSort = (rides: RideMatch[]): RideMatch[] => {
    let filteredRides = [...rides];

    // Apply vehicle type filter
    if (vehicleTypes.length > 0) {
      filteredRides = filteredRides.filter((ride) =>
        vehicleTypes.includes(ride.vehicle_type)
      );
    }

    // Apply departure time filter
    if (departureTime.length > 0) {
      filteredRides = filteredRides.filter((ride) => {
        const rideTime = new Date(ride.departure_time).getHours();
        return departureTime.some((time) => {
          const [start, end] = time.split("-").map(Number);
          return rideTime >= start && rideTime <= end;
        });
      });
    }

    // Apply price range filter
    if (priceRanges.length > 0) {
      filteredRides = filteredRides.filter((ride) => {
        return priceRanges.some((range) => {
          const [min, max] = range.split("-").map(Number);
          return ride.price_per_seat >= min && ride.price_per_seat <= max;
        });
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "price-low":
        filteredRides.sort((a, b) => a.price_per_seat - b.price_per_seat);
        break;
      case "price-high":
        filteredRides.sort((a, b) => b.price_per_seat - a.price_per_seat);
        break;
      case "time":
        filteredRides.sort(
          (a, b) =>
            new Date(a.departure_time).getTime() -
            new Date(b.departure_time).getTime()
        );
        break;
      case "relevance":
      default:
        // Sort by match percentage (already sorted by backend, but ensure it's maintained)
        filteredRides.sort((a, b) => b.match_percentage - a.match_percentage);
        break;
    }

    return filteredRides;
  };

  const displayRides = applyFiltersAndSort(searchResults);

  const handleBookRide = (rideId: string, driverId: string) => {
    if (!user) {
      toast.error("Please login to book a ride");
      return;
    }

    if (user.uid === driverId) {
      toast.error("You cannot book your own ride");
      return;
    }

    router.push(`/book/${rideId}`);
  };

  const formatTime = (dateString: string) => {
    return formatTimeIST(dateString);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-8 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Find Your Perfect Ride
            </h1>
            <p className="text-md text-gray-600 max-w-2xl mx-auto">
              Search for rides from drivers across India.
            </p>
          </div>

          {/* Alert for Better Results */}
          {!hasSearched && (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      💡 Pro Tip for Better Results
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Use <strong>states and cities</strong> for more accurate
                        matches. For example:
                      </p>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        <li>"Delhi, India" instead of just "Delhi"</li>
                        <li>
                          "Mumbai, Maharashtra, India" for better precision
                        </li>
                        <li>"Bangalore, Karnataka, India" for exact matches</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Bar - Centered and moved to left */}
          <div className="mb-8">
            <div className="max-w-4xl mx-auto">
              <SearchBar onSearch={handleSearch} />
            </div>
            <p className="text-xs text-[#4AAAFF] mt-4 text-center">
              For better and broader results, use states in the origin and
              destination fields.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Mobile Filters Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="w-full bg-white p-3 flex items-center justify-between"
              >
                <span className="font-medium text-gray-700">
                  Filters & Sort
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${showMobileFilters ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>

            {/* Filters Sidebar - Desktop and Mobile Dropdown */}
            <div
              className={`lg:col-span-1 ${showMobileFilters ? "block" : "hidden"} lg:block`}
            >
              <div className="bg-white rounded-lg shadow-sm p-4 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear All
                  </button>
                </div>

                {/* Sort By */}
                <div>
                  <h4 className="font-medium mb-3">Sort By</h4>
                  <div className="space-y-2">
                    {[
                      { value: "relevance", label: "Best Match" },
                      { value: "price-low", label: "Price: Low to High" },
                      { value: "price-high", label: "Price: High to Low" },
                      { value: "time", label: "Departure Time" },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="sortBy"
                          value={option.value}
                          checked={sortBy === option.value}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Vehicle Types */}
                {availableVehicleTypes.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Vehicle Type</h4>
                    <div className="space-y-2">
                      {availableVehicleTypes.map((type) => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={vehicleTypes.includes(type)}
                            onChange={() => handleVehicleTypeFilter(type)}
                            className="mr-2"
                          />
                          <span className="text-sm capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Departure Time */}
                <div>
                  <h4 className="font-medium mb-3">Departure Time</h4>
                  <div className="space-y-2">
                    {[
                      { value: "6-12", label: "Morning (6 AM - 12 PM)" },
                      { value: "12-18", label: "Afternoon (12 PM - 6 PM)" },
                      { value: "18-24", label: "Evening (6 PM - 12 AM)" },
                      { value: "0-6", label: "Night (12 AM - 6 AM)" },
                    ].map((time) => (
                      <label key={time.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={departureTime.includes(time.value)}
                          onChange={() => handleTimeFilter(time.value)}
                          className="mr-2"
                        />
                        <span className="text-sm">{time.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="font-medium mb-3">Price Range</h4>
                  <div className="space-y-2">
                    {[
                      { value: "0-500", label: "Under ₹500" },
                      { value: "500-1000", label: "₹500 - ₹1000" },
                      { value: "1000-2000", label: "₹1000 - ₹2000" },
                      { value: "2000-5000", label: "₹2000 - ₹5000" },
                      { value: "5000-999999", label: "Above ₹5000" },
                    ].map((range) => (
                      <label key={range.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={priceRanges.includes(range.value)}
                          onChange={() => handlePriceFilter(range.value)}
                          className="mr-2"
                        />
                        <span className="text-sm">{range.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Mobile: Apply Filters Button */}
                <div className="lg:hidden pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Search Results */}
            <div className="lg:col-span-3">
              <div className="space-y-4">
                {/* Loading State */}
                {loading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Searching for rides...</p>
                  </div>
                )}

                {/* Error State */}
                {searchError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{searchError}</p>
                  </div>
                )}

                {!loading && hasSearched && searchMetadata && (
                  <div className="bg-white px-4 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 font-medium">
                        <span>{searchOrigin || "Origin"}</span>
                        <svg
                          className="w-3.5 h-3.5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                        <span>{searchDestination || "Destination"}</span>
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-gray-800">
                        {searchMetadata.totalFound} ride
                        {searchMetadata.totalFound !== 1 ? "s" : ""} available
                      </div>
                    </div>
                  </div>
                )}

                {/* Basic Search Results Header for fallback */}
                {!loading && hasSearched && !searchMetadata && (
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">
                      {displayRides.length > 0
                        ? `${displayRides.length} ride${displayRides.length !== 1 ? "s" : ""} found`
                        : "No rides found"}
                    </h2>
                  </div>
                )}

                {/* Rides List */}
                {!loading && displayRides.length > 0 && (
                  <div className="space-y-3">
                    {displayRides.slice(0, displayedRidesCount).map((ride) => {
                      // Match quality indicator based on match percentage
                      const getMatchQuality = () => {
                        if (ride.match_percentage >= 80)
                          return "Excellent match";
                        if (ride.match_percentage >= 60) return "Good match";
                        return "Basic match";
                      };

                      const matchQuality = getMatchQuality();

                      return (
                        <div
                          key={ride.ride_id}
                          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col space-y-4">
                            {/* Time and Route Section */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                              <div className="flex items-center justify-center sm:justify-start space-x-4 flex-1">
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-gray-900">
                                    {(() => {
                                      const isSameDay = !isDifferentDayIST(ride.departure_time, ride.arrival_time);
                                      
                                      if (isSameDay) {
                                        return formatTime(ride.departure_time);
                                      } else {
                                        return (
                                          <div>
                                            <div>{formatTime(ride.departure_time)}</div>
                                            <div className="text-xs text-blue-600 font-medium">
                                              {formatDateShortIST(ride.departure_time)}
                                            </div>
                                          </div>
                                        );
                                      }
                                    })()}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {ride.origin_state}
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 px-3">
                                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                  <div className="w-16 h-px bg-gray-300"></div>
                                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                </div>

                                <div className="text-center">
                                  <div className="text-lg font-semibold text-gray-900">
                                    {(() => {
                                      const isSameDay = !isDifferentDayIST(ride.departure_time, ride.arrival_time);
                                      
                                      if (isSameDay) {
                                        return formatTime(ride.arrival_time);
                                      } else {
                                        return (
                                          <div>
                                            <div>{formatTime(ride.arrival_time)}</div>
                                            <div className="text-xs text-amber-600 font-medium">
                                              {formatDateShortIST(ride.arrival_time)}
                                            </div>
                                          </div>
                                        );
                                      }
                                    })()}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {ride.destination_state}
                                  </div>
                                </div>
                              </div>

                              {/* Price - Desktop only */}
                              <div className="hidden sm:block text-right">
                                <div className="text-2xl font-bold text-gray-900">
                                  ₹{ride.price_per_seat}
                                </div>
                                <div className="text-sm text-gray-500">
                                  per seat
                                </div>
                              </div>
                            </div>

                            {/* Driver and Vehicle Info Section */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 bg-gray-50 rounded-lg p-3">
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                                {/* Driver Info */}
                                <div className="flex items-center space-x-2">
                                  
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {ride.driver?.display_name}
                                    </div>
                                    <div className="text-xs text-gray-500 capitalize">
                                      {ride.vehicle_type}
                                    </div>
                                  </div>
                                </div>

                                {/* Additional Info */}
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  {/* Stopovers */}
                                  {ride.stopovers &&
                                    ride.stopovers.length > 0 && (
                                      <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                        <span className="text-xs">
                                          {ride.stopovers.length} stopover
                                          {ride.stopovers.length !== 1
                                            ? "s"
                                            : ""}
                                        </span>
                                      </div>
                                    )}

                                  {/* Seats Available */}
                                  <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span className="text-xs">
                                      {ride.seats_available} seats left
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Match Quality */}
                              <div className="flex justify-start sm:justify-end">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {matchQuality}
                                </span>
                              </div>
                            </div>

                            {/* Price and Book Button Section - Mobile */}
                            <div className="flex sm:hidden items-center justify-between pt-2 border-t border-gray-100">
                              <div>
                                <div className="text-xl font-bold text-gray-900">
                                  ₹{ride.price_per_seat}
                                </div>
                                <div className="text-sm text-gray-500">
                                  per seat
                                </div>
                              </div>
                              {user?.uid === ride.driver_id ? (
                                <button
                                  disabled
                                  className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed text-sm font-medium"
                                  title="You cannot book your own ride"
                                >
                                  Your Ride
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleBookRide(ride.ride_id, ride.driver_id)
                                  }
                                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                                >
                                  Book Now
                                </button>
                              )}
                            </div>

                            {/* Book Button - Desktop only */}
                            <div className="hidden sm:flex justify-end">
                              {user?.uid === ride.driver_id ? (
                                <button
                                  disabled
                                  className="bg-gray-300 text-gray-500 px-6 py-2 rounded-lg cursor-not-allowed text-sm font-medium"
                                  title="You cannot book your own ride"
                                >
                                  Your Ride
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleBookRide(ride.ride_id, ride.driver_id)
                                  }
                                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                                >
                                  Book Now
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Load More Button */}
                {displayedRidesCount < searchResults.length && (
                  <div className="text-center mt-6">
                    <button
                      onClick={handleLoadMore}
                      className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors text-lg font-semibold"
                    >
                      Load More Rides
                    </button>
                  </div>
                )}

                {/* No Results Message */}
                {!loading && hasSearched && displayRides.length === 0 && (
                  <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-base sm:text-lg">
                      No rides found matching your criteria.
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Try adjusting your search parameters or check back later.
                    </p>
                  </div>
                )}

                {/* No Search Yet */}
                {!hasSearched && !loading && (
                  <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
                    <Car className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-gray-600 text-base sm:text-lg">
                      Search for rides above
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Enter your pickup and destination to find available rides
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default BookRide;
