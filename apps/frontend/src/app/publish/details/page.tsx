'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
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
  departureTime: string;
  arrivalTime: string;
  passengers: number;
  pricePerSeat: string;
}

const PublishDetailsPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile, loading: authLoading } = useAuth();
  
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

  // Check if user is authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Please login to publish a ride');
      router.replace('/'); // Redirect to login
    }
  }, [authLoading, user, router]);

  // Form state
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    originLandmark: '',
    destinationLandmark: '',
  });

  // Booking state
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    date: null,
    departureTime: '',
    arrivalTime: '',
    passengers: parseInt(passengersParam || '1'),
    pricePerSeat: ''
  });

  // Location state
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [originState, setOriginState] = useState<string>('');
  const [destinationState, setDestinationState] = useState<string>('');
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
      setOriginState(location.state || '');
      setOriginSearch([]);
    } else if (type === 'destination') {
      setFormData(prev => ({ ...prev, destination: location.name }));
      setDestinationCoords(location.coordinates);
      setDestinationState(location.state || '');
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

  // Effect to update arrival time when route duration changes
  useEffect(() => {
    if (bookingDetails.departureTime && routeDetails?.duration) {
      const arrivalTime = calculateArrivalTime(bookingDetails.departureTime, routeDetails.duration);
      if (arrivalTime !== bookingDetails.arrivalTime) {
        setBookingDetails(prev => ({ ...prev, arrivalTime }));
      }
    }
  }, [routeDetails?.duration, bookingDetails.departureTime, bookingDetails.arrivalTime]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBookingDetailsChange = (field: keyof BookingDetails, value: any) => {
    setBookingDetails(prev => {
      const newDetails = { ...prev, [field]: value };
      
      // Auto-calculate arrival time when departure time changes
      if (field === 'departureTime' && value && routeDetails?.duration) {
        const arrivalTime = calculateArrivalTime(value, routeDetails.duration);
        newDetails.arrivalTime = arrivalTime;
      }
      
      return newDetails;
    });
  };

  // Function to calculate arrival time based on departure time and duration
  const calculateArrivalTime = (departureTime: string, duration: string): string => {
    if (!departureTime || !duration) return '';
    
    try {
      // Parse duration (format: "2h 30m" or "45m")
      const durationMatch = duration.match(/(?:(\d+)h\s*)?(?:(\d+)m)?/);
      if (!durationMatch) return '';
      
      const hours = parseInt(durationMatch[1] || '0');
      const minutes = parseInt(durationMatch[2] || '0');
      const totalMinutes = hours * 60 + minutes;
      
      // Parse departure time (format: "HH:MM")
      const [depHours, depMinutes] = departureTime.split(':').map(Number);
      const departureDate = new Date();
      departureDate.setHours(depHours, depMinutes, 0, 0);
      
      // Add duration
      const arrivalDate = new Date(departureDate.getTime() + totalMinutes * 60000);
      
      // Format arrival time
      const arrivalHours = arrivalDate.getHours().toString().padStart(2, '0');
      const arrivalMins = arrivalDate.getMinutes().toString().padStart(2, '0');
      
      return `${arrivalHours}:${arrivalMins}`;
    } catch (error) {
      console.error('Error calculating arrival time:', error);
      return '';
    }
  };

  const handleSubmit = async () => {
    if (!user || !userProfile) {
      toast.error('Please login to publish a ride');
      return;
    }

    try {
      setLoading(true);
      
      // Show loading toast
      const loadingToast = toast.loading('Publishing your ride...');
      
      const rideData = {
        formData,
        bookingDetails,
        stopovers,
        originCoords,
        destinationCoords,
        originState,
        destinationState,
        vehicleType: vehicleTypeParam,
        driverId: user.uid // Use actual user ID from Firebase auth
      };

      // Call backend API
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/rides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rideData)
      });

      const result = await response.json();

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (response.ok && result.success) {
        // Show success toast with action button
        toast.success((t) => (
          <div className="flex flex-col gap-3 min-w-[320px]">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-lg">✓</span>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Ride Published Successfully!</div>
                <div className="text-sm text-gray-600">
                  Ride ID: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">{result.rideId?.slice(0, 8)}...</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  router.push('/rides');
                }}
                className="flex-1 bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View My Rides
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ), {
          duration: 10000,
          position: 'top-center',
          style: {
            background: 'white',
            color: '#374151',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            maxWidth: '400px',
          },
        });
        
        // Navigate to rides page after a delay
        setTimeout(() => {
          router.push('/rides');
        }, 4000);
      } else {
        // Show error toast
        toast.error(result.error || 'Failed to publish ride', {
          duration: 4000,
          position: 'top-center',
        });
      }
    } catch (error) {
      console.error('Error submitting ride:', error);
      toast.error('An unexpected error occurred. Please try again.', {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
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

  // Show loading while authenticating
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Toaster />
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
