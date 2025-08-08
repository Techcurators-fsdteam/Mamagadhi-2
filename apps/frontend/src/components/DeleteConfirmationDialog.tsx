'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  rideDetails: {
    origin: string;
    destination: string;
    departure_time: string;
  };
  isLoading?: boolean;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  rideDetails,
  isLoading = false
}) => {
  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition z-10"
          disabled={isLoading}
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Warning Icon */}
        <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-red-100 rounded-full">
          <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 text-center mb-2">
          Delete Ride
        </h3>

        {/* Warning message */}
        <p className="text-sm sm:text-base text-gray-600 text-center mb-4 sm:mb-6">
          Are you sure you want to delete this ride? This action cannot be undone.
        </p>

        {/* Ride details */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 flex-shrink-0"></div>
              <div className="min-w-0">
                <div className="text-xs text-gray-500">From</div>
                <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{rideDetails.origin}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 flex-shrink-0"></div>
              <div className="min-w-0">
                <div className="text-xs text-gray-500">To</div>
                <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{rideDetails.destination}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
              <div className="min-w-0">
                <div className="text-xs text-gray-500">Departure</div>
                <div className="font-medium text-gray-900 text-sm sm:text-base">
                  {formatDate(rideDetails.departure_time)} at {formatTime(rideDetails.departure_time)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                <span className="text-sm sm:text-base">Deleting...</span>
              </>
            ) : (
              'Delete Ride'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationDialog;
