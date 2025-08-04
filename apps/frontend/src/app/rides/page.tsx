'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { 
  Car,
  Clock, 
  Users, 
  IndianRupee, 
  Calendar,
  Edit,
  Trash2,
  Eye,
  Plus
} from 'lucide-react';

interface Ride {
  ride_id: string;
  vehicle_type: string;
  origin: string;
  destination: string;
  origin_state?: string;
  destination_state?: string;
  departure_time: string;
  arrival_time: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  status: 'open' | 'closed' | 'completed' | 'cancelled';
  created_at: string;
  stops: Array<{
    ride_id: string;
    sequence: number;
    landmark: string;
    stop_geog?: string;
  }>;
}

const MyRidesPage: React.FC = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    ride: Ride | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    ride: null,
    isLoading: false
  });

  // Check if user is authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Please login to view your rides');
      router.replace('/');
    }
  }, [authLoading, user, router]);

  // Fetch user's rides
  useEffect(() => {
    const fetchRides = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);
        setError(null);

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/rides/driver?driverId=${user.uid}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch rides');
        }

        const result = await response.json();
        
        if (result.success) {
          setRides(result.rides || []);
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } catch (err) {
        console.error('Error fetching rides:', err);
        setError(err instanceof Error ? err.message : 'Failed to load rides');
        toast.error('Failed to load your rides');
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) {
      fetchRides();
    }
  }, [user?.uid]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVehicleIcon = (vehicleType: string) => {
    return <Car className="w-4 h-4" />;
  };

  // Handle delete ride
  const handleDeleteRide = (ride: Ride) => {
    setDeleteDialog({
      isOpen: true,
      ride: ride,
      isLoading: false
    });
  };

  const confirmDeleteRide = async () => {
    const { ride } = deleteDialog;
    if (!ride || !user?.uid) return;

    try {
      setDeleteDialog(prev => ({ ...prev, isLoading: true }));

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/rides/delete?rideId=${ride.ride_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId: user.uid
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Remove the ride from the list
        setRides(prevRides => prevRides.filter(r => r.ride_id !== ride.ride_id));
        
        // Close the dialog
        setDeleteDialog({ isOpen: false, ride: null, isLoading: false });
        
        // Show success message
        toast.success((t) => (
          <div className="flex items-center gap-3 min-w-[280px]">
            <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">Ride Deleted Successfully</div>
              <div className="text-sm text-gray-600">Your ride has been permanently removed</div>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ), {
          duration: 4000,
          position: 'top-center',
          style: {
            background: 'white',
            color: '#374151',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        });
      } else {
        throw new Error(result.error || 'Failed to delete ride');
      }
    } catch (err) {
      console.error('Error deleting ride:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete ride', {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setDeleteDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const cancelDeleteRide = () => {
    setDeleteDialog({ isOpen: false, ride: null, isLoading: false });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your rides...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <div className="flex-1">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Rides</h1>
              <p className="text-gray-600 mt-2">
                Manage and track all your published rides
              </p>
            </div>
            <button
              onClick={() => router.push('/publish')}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Publish New Ride
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{rides.length}</div>
                  <div className="text-sm text-gray-500">Total Rides</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {rides.filter(r => r.status === 'open').length}
                  </div>
                  <div className="text-sm text-gray-500">Active Rides</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {rides.filter(r => r.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-500">Completed</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{rides.reduce((total, ride) => total + (ride.price_per_seat * (ride.seats_total - ride.seats_available)), 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Total Earnings</div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-blue-600 mt-0.5">
                ℹ️
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Ride Management</h4>
                <p className="text-sm text-blue-700">
                  You can only delete rides that are still <span className="font-medium">open</span>. 
                  Completed, closed, or cancelled rides cannot be deleted for record-keeping purposes.
                </p>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Rides List */}
          {rides.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No rides published yet</h3>
              <p className="text-gray-600 mb-6">
                Start sharing rides with others by publishing your first ride
              </p>
              <button
                onClick={() => router.push('/publish')}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
              >
                Publish Your First Ride
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {rides.map((ride) => (
                <div key={ride.ride_id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {getVehicleIcon(ride.vehicle_type)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 capitalize">
                            {ride.vehicle_type} • {ride.seats_total} seats
                          </div>
                          <div className="text-sm text-gray-500">
                            Created {formatDate(ride.created_at)}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ride.status)}`}>
                          {ride.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Route Information */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <div>
                              <div className="text-sm text-gray-500">From</div>
                              <div className="font-semibold text-lg">
                                {ride.origin_state || 'Unknown State'}
                              </div>
                              {ride.origin && (
                                <div className="text-sm text-gray-600 mt-1">
                                  📍 {ride.origin}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {ride.stops && ride.stops.length > 0 && (
                            <div className="ml-6 space-y-2">
                              {ride.stops.map((stop, index) => (
                                <div key={index} className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                                  <div className="text-sm text-gray-600">{stop.landmark}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div>
                              <div className="text-sm text-gray-500">To</div>
                              <div className="font-semibold text-lg">
                                {ride.destination_state || 'Unknown State'}
                              </div>
                              {ride.destination && (
                                <div className="text-sm text-gray-600 mt-1">
                                  📍 {ride.destination}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Trip Details */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-sm text-gray-500">Departure</div>
                              <div className="font-medium">
                                {formatDate(ride.departure_time)} at {formatTime(ride.departure_time)}
                              </div>
                            </div>
                          </div>
                          
                          {ride.arrival_time && (
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="text-sm text-gray-500">Estimated Arrival</div>
                                <div className="font-medium">{formatTime(ride.arrival_time)}</div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">
                                {ride.seats_available}/{ride.seats_total} available
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <IndianRupee className="w-4 h-4 text-gray-400" />
                              <span className="font-semibold">₹{ride.price_per_seat}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="Edit Ride"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRide(ride)}
                        className={`p-2 rounded-lg transition ${
                          ride.status === 'open' 
                            ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' 
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title={ride.status === 'open' ? 'Delete Ride' : 'Cannot delete - ride is not open'}
                        disabled={ride.status !== 'open'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <Footer />

      {/* Delete Confirmation Dialog */}
      {deleteDialog.ride && (
        <DeleteConfirmationDialog
          isOpen={deleteDialog.isOpen}
          onClose={cancelDeleteRide}
          onConfirm={confirmDeleteRide}
          rideDetails={{
            origin: deleteDialog.ride.origin,
            destination: deleteDialog.ride.destination,
            departure_time: deleteDialog.ride.departure_time
          }}
          isLoading={deleteDialog.isLoading}
        />
      )}
    </div>
  );
};

export default MyRidesPage;
