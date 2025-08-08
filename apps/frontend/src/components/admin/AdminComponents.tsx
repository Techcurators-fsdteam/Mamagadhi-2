'use client';

import React from 'react';

interface VerificationButtonProps {
  isVerified: boolean;
  onVerify: () => void;
  onReject: () => void;
  loading?: boolean;
  label: string;
}

export const VerificationButton: React.FC<VerificationButtonProps> = ({
  isVerified,
  onVerify,
  onReject,
  loading = false,
  label
}) => {
  return (
    <div className="flex items-center space-x-2">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isVerified 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isVerified ? 'Verified' : 'Unverified'}
      </span>
      <div className="flex space-x-1">
        <button
          onClick={onVerify}
          disabled={loading || isVerified}
          className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title={`Verify ${label}`}
        >
          {loading ? '...' : '✓'}
        </button>
        <button
          onClick={onReject}
          disabled={loading || !isVerified}
          className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title={`Reject ${label}`}
        >
          {loading ? '...' : '✗'}
        </button>
      </div>
    </div>
  );
};

interface DocumentLinkProps {
  url: string;
  label: string;
}

export const DocumentLink: React.FC<DocumentLinkProps> = ({ url, label }) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4AAAFF] transition-colors"
    >
      📄 {label}
    </a>
  );
};

interface StatusBadgeProps {
  status: string;
  type?: 'booking' | 'ride' | 'default';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'default' }) => {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'verified':
      case 'confirmed':
      case 'active':
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
      case 'cancelled':
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
      {status}
    </span>
  );
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full border-b-2 border-[#4AAAFF] ${sizeClasses[size]}`}></div>
    </div>
  );
};
