'use client';

import { useState, useEffect } from 'react';
import { UserProfile, DriverProfile } from 'shared-types';
import { supabase } from '../lib/supabase';

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

  // Admin credentials (in production, use environment variables)
  const ADMIN_ID = process.env.NEXT_PUBLIC_ADMIN_ID || 'admin';
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
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

  const handleAdminLogin = (adminId: string, adminPassword: string) => {
    if (adminId === ADMIN_ID && adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError('');
      
      // Store session in localStorage
      const sessionData = {
        timestamp: Date.now(),
        isAdmin: true
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } else {
      setAuthError('Invalid admin credentials');
    }
  };

  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(SESSION_KEY);
  };

  const fetchStats = async () => {
    try {
      if (!supabase) {
        throw new Error('Database not available');
      }
      
      // Fetch all user profiles for stats
      const { data: allUsers, error: statsError } = await supabase
        .from('user_profiles')
        .select('role, is_email_verified, is_phone_verified');

      if (statsError) throw statsError;

      // Fetch all driver profiles for stats
      const { data: allDrivers, error: driversError } = await supabase
        .from('driver_profiles')
        .select('dl_verified, id_verified');

      if (driversError) throw driversError;

      const stats = {
        totalUsers: allUsers?.length || 0,
        totalDrivers: allUsers?.filter(u => u.role === 'driver' || u.role === 'both').length || 0,
        verifiedUsers: allUsers?.filter(u => u.is_email_verified && u.is_phone_verified).length || 0,
        driversWithDocs: allDrivers?.length || 0,
        verifiedDLs: allDrivers?.filter(d => d.dl_verified).length || 0,
        verifiedIDs: allDrivers?.filter(d => d.id_verified).length || 0
      };

      setStats(stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to fetch statistics');
    }
  };

  const fetchAllUsers = async () => {
    try {
      setLoadingData(true);
      
      if (!supabase) {
        throw new Error('Database not available');
      }
      
      // Fetch all user profiles from Supabase
      const { data: userProfiles, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (userError) throw userError;

      // Fetch all driver profiles from Supabase
      const { data: driverProfiles, error: driverError } = await supabase
        .from('driver_profiles')
        .select('*');

      if (driverError) throw driverError;

      // Combine the data
      const combinedData: CombinedUserData[] = userProfiles?.map(userProfile => {
        const driverProfile = driverProfiles?.find(dp => dp.user_profile_id === userProfile.id);
        return {
          userProfile,
          driverProfile
        };
      }) || [];

      setUsers(combinedData);
      setError(''); // Clear any previous errors
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
      if (!supabase) {
        throw new Error('Database not available');
      }
      
      const { userId, documentType, verified } = confirmAction;
      const updateField = documentType === 'id' ? 'id_verified' : 'dl_verified';
      
      // Update verification status in Supabase
      const { error } = await supabase
        .from('driver_profiles')
        .update({ 
          [updateField]: verified,
          updated_at: new Date().toISOString() 
        })
        .eq('user_profile_id', userId);

      if (error) throw error;

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

      console.log(`${verified ? 'Verified' : 'Revoked'} ${documentType} for user ${userId}`);
    } catch (err) {
      setError(`Failed to update ${confirmAction.documentType} verification status`);
      console.error('Error updating verification:', err);
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
