'use client';

import React, { useState } from 'react';
import { UserWithDriverProfile } from '../../types/admin';
import { DataTable } from './DataTable';
import { VerificationButton, DocumentLink, StatusBadge } from './AdminComponents';
import { updateDriverVerification } from '../../lib/admin-api';
import { formatDateIST } from '../../lib/timezone-utils';

interface UsersTabProps {
  users: UserWithDriverProfile[];
  onRefresh: () => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({ users, onRefresh }) => {
  const [loadingVerifications, setLoadingVerifications] = useState<Record<string, boolean>>({});

  const handleVerificationUpdate = async (
    userProfileId: string,
    field: 'id_verified' | 'dl_verified',
    status: boolean
  ) => {
    const key = `${userProfileId}-${field}`;
    setLoadingVerifications(prev => ({ ...prev, [key]: true }));
    
    try {
      await updateDriverVerification(userProfileId, field, status);
      onRefresh(); // Refresh data to show updated status
    } catch (error) {
      console.error('Error updating verification:', error);
      alert('Failed to update verification status');
    } finally {
      setLoadingVerifications(prev => ({ ...prev, [key]: false }));
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (value: string) => (
        <span className="font-mono text-xs text-gray-600">{value.slice(0, 8)}...</span>
      )
    },
    { 
      key: 'email', 
      label: 'Email',
      filterable: true
    },
    { 
      key: 'phone', 
      label: 'Phone',
      filterable: true
    },
    {
      key: 'display_name',
      label: 'Name',
      filterable: true,
      render: (_: any, row: UserWithDriverProfile) => (
        <div>
          <div className="font-medium">{row.display_name}</div>
          <div className="text-sm text-gray-500">{row.first_name} {row.last_name}</div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      filterable: true,
      filterOptions: ['passenger', 'driver'],
      render: (value: string) => <StatusBadge status={value || 'passenger'} />
    },
    {
      key: 'driver_documents',
      label: 'Driver Documents',
      render: (_: any, row: UserWithDriverProfile) => {
        if (!row.driver_profile) {
          return <span className="text-gray-400 text-sm">Not a driver</span>;
        }

        const { driver_profile } = row;
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <DocumentLink url={driver_profile.id_url} label="ID" />
              <VerificationButton
                isVerified={driver_profile.id_verified}
                onVerify={() => handleVerificationUpdate(row.id, 'id_verified', true)}
                onReject={() => handleVerificationUpdate(row.id, 'id_verified', false)}
                loading={loadingVerifications[`${row.id}-id_verified`]}
                label="ID Document"
              />
            </div>
            <div className="flex items-center space-x-2">
              <DocumentLink url={driver_profile.dl_url} label="DL" />
              <VerificationButton
                isVerified={driver_profile.dl_verified}
                onVerify={() => handleVerificationUpdate(row.id, 'dl_verified', true)}
                onReject={() => handleVerificationUpdate(row.id, 'dl_verified', false)}
                loading={loadingVerifications[`${row.id}-dl_verified`]}
                label="Driving License"
              />
            </div>
          </div>
        );
      }
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: (value: string) => (
        <span className="text-sm text-gray-600">
          {formatDateIST(new Date(value))}
        </span>
      )
    }
  ];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Users Management</h2>
          <p className="text-gray-600">Total users: {users.length}</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-[#4AAAFF] text-white rounded-lg hover:bg-[#3A9AEF] focus:outline-none focus:ring-2 focus:ring-[#4AAAFF] transition-colors"
        >
          Refresh
        </button>
      </div>
      
      <DataTable data={users} columns={columns} />
    </div>
  );
};
