'use client';

import { useState, useEffect } from 'react';
import { UserProfile, DriverProfile } from 'shared-types';
import { apiClient } from '../lib/api-client-enhanced';
import { toast } from 'react-hot-toast';

interface CombinedUserData {
  userProfile: UserProfile;
  driverProfile?: DriverProfile;
}

interface AdminStats {
  totalUsers: number;
  totalDrivers: number;
  verifiedUsers: number;
  driversWithDocs: number;
  verifiedDLs: number;
  verifiedIDs: number;
}

export const useAdminLogic = () => {
  const [users, setUsers] = useState<CombinedUserData[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalDrivers: 0,
    verifiedUsers: 0,
    driversWithDocs: 0,
    verifiedDLs: 0,
    verifiedIDs: 0
  });
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<CombinedUserData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'driver' | 'passenger' | 'both'>('all');
  const [filterVerification, setFilterVerification] = useState<'all' | 'verified' | 'unverified'>('all');
  
  // Admin authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Confirmation dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    userId: string;
    documentType: 'id' | 'dl';
    verified: boolean;
    userName: string;
  } | null>(null);

  // Admin credentials
  const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY || 'admin123';
  const SESSION_KEY = 'mamagadhi_admin_session';
  const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const sessionData = localStorage.getItem(SESSION_KEY);
        if (sessionData) {
          const { timestamp, isAdmin } = JSON.parse(sessionData);
          const now = Date.now();
          
          // Check if session is still valid (24 hours)
          if (now - timestamp < SESSION_DURATION && isAdmin) {
            setIsAuthenticated(true);
          } else {
            // Session expired, remove it
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch {
        // Invalid session data, remove it
        localStorage.removeItem(SESSION_KEY);
      }
      setIsCheckingAuth(false);
    };

    checkExistingSession();
  }, [SESSION_DURATION]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllUsers();
      fetchStats();
    }
  }, [isAuthenticated]);

  const handleAdminLogin = async (adminKey: string) => {
    try {
      const result = await apiClient.adminAuthenticate(adminKey);
      if (result.success) {
        setIsAuthenticated(true);
        setAuthError('');
        
        // Store session in localStorage
        const sessionData = {
          timestamp: Date.now(),
          isAdmin: true,
          adminKey
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        toast.success('Admin authenticated successfully');
      } else {
        setAuthError(result.error || 'Invalid admin credentials');
        toast.error('Invalid admin credentials');
      }
    } catch (error) {
      setAuthError('Authentication failed');
      toast.error('Authentication failed');
    }
  };

  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(SESSION_KEY);
  };

  const fetchStats = async () => {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) return;
      
      const { adminKey } = JSON.parse(sessionData);
      const result = await apiClient.getAdminStats(adminKey);
      
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        setError(result.error || 'Failed to fetch statistics');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to fetch statistics');
    }
  };

  const fetchAllUsers = async () => {
    try {
      setLoadingData(true);
      
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) return;
      
      const { adminKey } = JSON.parse(sessionData);
      const result = await apiClient.getAllUsers(adminKey);
      
      if (result.success && result.data) {
        setUsers(result.data);
        setError(''); // Clear any previous errors
      } else {
        setError(result.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Failed to fetch user data from database');
      console.error('Error fetching users:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleVerifyDocument = async (userId: string, documentType: 'id' | 'dl', verified: boolean) => {
    const userName = users.find(u => u.userProfile.id === userId)?.userProfile.display_name || 'Unknown User';
    
    setConfirmAction({
      userId,
      documentType,
      verified,
      userName
    });
    setShowConfirmDialog(true);
  };

  const confirmVerification = async () => {
    if (!confirmAction) return;
    
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) return;
      
      const { adminKey } = JSON.parse(sessionData);
      const { userId, documentType, verified } = confirmAction;
      
      // Update verification status via API
      const result = await apiClient.updateUserVerification(adminKey, userId, documentType, verified);

      if (result.success) {
        // Update local state without refetching
        setUsers(prevUsers => 
          prevUsers.map(userData => {
            if (userData.userProfile.id === userId && userData.driverProfile) {
              const updatedDriverProfile = { ...userData.driverProfile };
              if (documentType === 'id') {
                updatedDriverProfile.id_verified = verified;
              } else {
                updatedDriverProfile.dl_verified = verified;
              }
              return {
                ...userData,
                driverProfile: updatedDriverProfile
              };
            }
            return userData;
          })
        );
        
        // Update selected user if modal is open
        if (selectedUser && selectedUser.userProfile.id === userId) {
          setSelectedUser(prevSelected => {
            if (prevSelected?.driverProfile) {
              const updatedDriverProfile = { ...prevSelected.driverProfile };
              if (documentType === 'id') {
                updatedDriverProfile.id_verified = verified;
              } else {
                updatedDriverProfile.dl_verified = verified;
              }
              return {
                ...prevSelected,
                driverProfile: updatedDriverProfile
              };
            }
            return prevSelected;
          });
        }

        // Update stats
        fetchStats();
        
        // Close confirmation dialog
        setShowConfirmDialog(false);
        setConfirmAction(null);

        toast.success(`${verified ? 'Verified' : 'Revoked'} ${documentType.toUpperCase()} for user`);
      } else {
        throw new Error(result.error || 'Failed to update verification');
      }
    } catch (err) {
      setError(`Failed to update ${confirmAction.documentType} verification status`);
      console.error('Error updating verification:', err);
      toast.error(`Failed to update ${confirmAction.documentType} verification`);
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
  };

  const filteredUsers = users.filter(userData => {
    const { userProfile } = userData;
    
    // Search filter
    const matchesSearch = 
      userProfile.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userProfile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userProfile.phone.includes(searchTerm);

    // Role filter
    const matchesRole = filterRole === 'all' || userProfile.role === filterRole;

    // Verification filter
    let matchesVerification = true;
    if (filterVerification === 'verified') {
      matchesVerification = userProfile.is_email_verified && userProfile.is_phone_verified;
    } else if (filterVerification === 'unverified') {
      matchesVerification = !userProfile.is_email_verified || !userProfile.is_phone_verified;
    }

    return matchesSearch && matchesRole && matchesVerification;
  });

  const openDetailModal = (userData: CombinedUserData) => {
    setSelectedUser(userData);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setSelectedUser(null);
    setIsDetailModalOpen(false);
  };

  const cancelConfirmation = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  return {
    // State
    users: filteredUsers,
    stats,
    loadingData,
    error,
    selectedUser,
    isDetailModalOpen,
    searchTerm,
    filterRole,
    filterVerification,
    isAuthenticated,
    authError,
    showConfirmDialog,
    confirmAction,
    isCheckingAuth,

    // Handlers
    handleAdminLogin,
    handleAdminLogout,
    openDetailModal,
    closeDetailModal,
    handleVerifyDocument,
    confirmVerification,
    cancelConfirmation,
    setSearchTerm,
    setFilterRole,
    setFilterVerification,
    setError
  };
};
