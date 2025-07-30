'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mapboxToken } from '@/lib/mapbox';
import { 
  searchEnhancedLocations, 
  debouncedSearch, 
  getCurrentLocation, 
  formatLocationDisplay,
  getCategoryIcon,
  EnhancedSearchLocation 
} from '@/lib/enhanced-search';
import { getRoute, formatDistance, formatDuration } from '@/lib/mapbox';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StepHeader from '@/components/publish/StepHeader';
import RouteStep from '@/components/publish/RouteStep';
import BookingDetailsForm from '@/components/publish/BookingDetailsForm';

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

interface BookingDetails {
  date: Date | null;
  passengers: number;
  pricePerSeat: string;
}

const PublishDetailsPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check if user came from publish page
  const passengersParam = searchParams.get('passengers');
  const vehicleTypeParam = searchParams.get('vehicleType');
  
  // Step management
  const [currentStep, setCurrentStep] = useState<'route' | 'booking'>('route');
  
  // If no parameters, redirect to publish page
  useEffect(() => {
    if (!passengersParam || !vehicleTypeParam) {
      router.replace('/publish');
    }
  }, [passengersParam, vehicleTypeParam, router]);

  // Form state
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
  });

  // Booking state
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    date: null,
    passengers: parseInt(passengersParam || '1'),
    pricePerSeat: ''
  });

  // Location state
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [stopovers, setStopovers] = useState<Stopover[]>([]);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  // Enhanced search states
  const [originSearch, setOriginSearch] = useState<EnhancedSearchLocation[]>([]);
  const [destinationSearch, setDestinationSearch] = useState<EnhancedSearchLocation[]>([]);
  const [stopoverSearches, setStopoverSearches] = useState<{ [key: string]: EnhancedSearchLocation[] }>({});
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState<{ [key: string]: boolean }>({});

  // Get max passengers based on vehicle type
  const getMaxPassengers = () => {
    switch (vehicleTypeParam) {
      case 'bike': return 1;
      case 'car': return 4;
      case 'big-car': return 6;
      case 'van': return 6;
      case 'minibus': return 10;
      case 'bus': return 16;
      default: return 4;
    }
  };

  // Get user location
  useEffect(() => {
    getCurrentLocation().then(setUserLocation);
  }, []);

  // Step navigation
  const goToNextStep = () => {
    if (currentStep === 'route') {
      setCurrentStep('booking');
    }
  };

  const goToPreviousStep = () => {
    if (currentStep === 'booking') {
      setCurrentStep('route');
    } else {
      router.back();
    }
  };

  // Enhanced search functions
  const searchOrigin = useCallback((query: string) => {
    if (!query.trim()) {
      setOriginSearch([]);
      return;
    }

    setSearchLoading(prev => ({ ...prev, origin: true }));
    
    debouncedSearch(
      query,
      async (searchQuery: string) => {
        try {
          const results = await searchEnhancedLocations(searchQuery, { 
            proximity: userLocation || undefined,
            carpoolingMode: true 
          });
          setOriginSearch(results);
        } catch (error) {
          console.error('Origin search error:', error);
          setOriginSearch([]);
        } finally {
          setSearchLoading(prev => ({ ...prev, origin: false }));
        }
      },
      300
    );
  }, [userLocation]);

  const searchDestination = useCallback((query: string) => {
    if (!query.trim()) {
      setDestinationSearch([]);
      return;
    }

    setSearchLoading(prev => ({ ...prev, destination: true }));
    
    debouncedSearch(
      query,
      async (searchQuery: string) => {
        try {
          const results = await searchEnhancedLocations(searchQuery, { 
            proximity: userLocation || undefined,
            carpoolingMode: true 
          });
          setDestinationSearch(results);
        } catch (error) {
          console.error('Destination search error:', error);
          setDestinationSearch([]);
        } finally {
          setSearchLoading(prev => ({ ...prev, destination: false }));
        }
      },
      300
    );
  }, [userLocation]);

  const searchStopover = useCallback((stopoverId: string, query: string) => {
    if (!query.trim()) {
      setStopoverSearches(prev => ({ ...prev, [stopoverId]: [] }));
      return;
    }

    setSearchLoading(prev => ({ ...prev, [stopoverId]: true }));
    
    debouncedSearch(
      query,
      async (searchQuery: string) => {
        try {
          const results = await searchEnhancedLocations(searchQuery, { 
            proximity: userLocation || undefined,
            carpoolingMode: true 
          });
          setStopoverSearches(prev => ({ ...prev, [stopoverId]: results }));
        } catch (error) {
          console.error('Stopover search error:', error);
          setStopoverSearches(prev => ({ ...prev, [stopoverId]: [] }));
        } finally {
          setSearchLoading(prev => ({ ...prev, [stopoverId]: false }));
        }
      },
      300
    );
  }, [userLocation]);

  // Location selection
  const handleLocationSelect = (type: 'origin' | 'destination' | string, location: EnhancedSearchLocation) => {
    if (type === 'origin') {
      setFormData(prev => ({ ...prev, origin: location.name }));
      setOriginCoords(location.coordinates);
      setOriginSearch([]);
    } else if (type === 'destination') {
      setFormData(prev => ({ ...prev, destination: location.name }));
      setDestinationCoords(location.coordinates);
      setDestinationSearch([]);
    } else {
      // Handle stopover
      updateStopover(type, { name: location.name, coordinates: location.coordinates });
      setStopoverSearches(prev => ({ ...prev, [type]: [] }));
    }
  };

  // Calculate route
  const calculateRoute = useCallback(async () => {
    if (!originCoords || !destinationCoords) return;
    
    setLoading(true);
    try {
      const stopoverCoords = stopovers
        .filter(s => s.coordinates)
        .map(s => s.coordinates as [number, number]);

      const route = await getRoute(originCoords, destinationCoords, stopoverCoords);
      
      if (route) {
        setRouteDetails({
          distance: formatDistance(route.distance),
          duration: formatDuration(route.duration),
          geometry: route.geometry
        });
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    } finally {
      setLoading(false);
    }
  }, [originCoords, destinationCoords, stopovers]);

  // Stopover management
  const addStopover = () => {
    const newStopover: Stopover = {
      id: Date.now().toString(),
      name: '',
    };
    setStopovers(prev => [...prev, newStopover]);
  };

  const removeStopover = (id: string) => {
    setStopovers(prev => prev.filter(s => s.id !== id));
    setStopoverSearches(prev => {
      const newSearches = { ...prev };
      delete newSearches[id];
      return newSearches;
    });
  };

  const updateStopover = (id: string, updates: Partial<Stopover>) => {
    setStopovers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // Effect to calculate route when coordinates change
  useEffect(() => {
    if (originCoords && destinationCoords) {
      calculateRoute();
    }
  }, [originCoords, destinationCoords, stopovers, calculateRoute]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBookingDetailsChange = (field: keyof BookingDetails, value: any) => {
    setBookingDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Handle trip submission
    console.log('Submitting trip:', {
      route: { formData, stopovers, routeDetails },
      booking: bookingDetails,
      vehicle: vehicleTypeParam
    });
    
    // Navigate to success page or back to home
    router.push('/');
  };

  if (!mapboxToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Mapbox Configuration Required</h2>
          <p className="text-gray-600">Please add your Mapbox token to the environment variables.</p>
        </div>
      </div>
    );
  }

  if (!passengersParam || !vehicleTypeParam) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-6xl mx-auto p-6">
          <StepHeader currentStep={currentStep} onBack={goToPreviousStep} />

          {/* Step 1: Route Planning */}
          {currentStep === 'route' && (
            <RouteStep
              formData={formData}
              stopovers={stopovers}
              originCoords={originCoords}
              destinationCoords={destinationCoords}
              routeDetails={routeDetails}
              originSearch={originSearch}
              destinationSearch={destinationSearch}
              stopoverSearches={stopoverSearches}
              searchLoading={searchLoading}
              onInputChange={handleInputChange}
              onOriginSearch={searchOrigin}
              onDestinationSearch={searchDestination}
              onStopoverSearch={searchStopover}
              onLocationSelect={handleLocationSelect}
              onAddStopover={addStopover}
              onRemoveStopover={removeStopover}
              onUpdateStopover={updateStopover}
              onNext={goToNextStep}
            />
          )}

          {/* Step 2: Booking Details */}
          {currentStep === 'booking' && (
            <BookingDetailsForm
              bookingDetails={bookingDetails}
              formData={formData}
              stopovers={stopovers}
              routeDetails={routeDetails}
              maxPassengers={getMaxPassengers()}
              onBookingDetailsChange={handleBookingDetailsChange}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PublishDetailsPage;
