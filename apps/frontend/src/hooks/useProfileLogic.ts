'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useProfile } from '../lib/profile-context';
import { updateUserProfile, supabase } from '../lib/supabase';
import { sendEmailVerification, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { validateFile, validateImageFile, formatFileSize } from '../lib/fileValidation';
import { apiClient } from '../lib/api-client-enhanced';

export const useProfileLogic = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { userProfile, updateProfile, refreshProfile, setProfileUrl } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    display_name: '',
    phone: '',
    role: 'passenger' as 'driver' | 'passenger' | 'both'
  });

  // Driver profile state
  const [driverData, setDriverData] = useState({
    first_name: '',
    last_name: '',
    display_name: '',
    phone: '',
    role: 'driver' as 'driver' | 'passenger' | 'both'
  });

  const [drivingLicenceFile, setDrivingLicenceFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Upload status
  const [dlUploadStatus, setDlUploadStatus] = useState<'idle' | 'uploading' | 'uploaded' | 'error'>('idle');
  const [idUploadStatus, setIdUploadStatus] = useState<'idle' | 'uploading' | 'uploaded' | 'error'>('idle');
  const [photoUploadStatus, setPhotoUploadStatus] = useState<'idle' | 'uploading' | 'uploaded' | 'error'>('idle');
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'warning' | 'danger' | 'info';
    requireTyping?: boolean;
    typingText?: string;
    confirmText?: string;
  } | null>(null);

  // Verification status from admin
  const [isIdVerified, setIsIdVerified] = useState(false);
  const [isDlVerified, setIsDlVerified] = useState(false);
  const [driverProfile, setDriverProfile] = useState<unknown>(null);

  // Fetch driver_profiles on load and after upload
  useEffect(() => {
    const fetchDriverProfile = async () => {
      if (user?.uid && supabase) {
        const { data } = await supabase
          .from('driver_profiles')
          .select('*')
          .eq('user_profile_id', user.uid)
          .single();
        setDriverProfile(data);
        
        // Set verification status from database
        if (data) {
          setIsIdVerified(data.id_verified || false);
          setIsDlVerified(data.dl_verified || false);
        }
      }
    };
    fetchDriverProfile();
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Initialize form data when userProfile is loaded
  useEffect(() => {
    if (userProfile && !isEditing) {
      setFormData({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        display_name: userProfile.display_name || '',
        phone: userProfile.phone || '',
        role: userProfile.role as 'driver' | 'passenger' | 'both'
      });
      setDriverData({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        display_name: userProfile.display_name || '',
        phone: userProfile.phone || '',
        role: userProfile.role === 'driver' ? 'driver' : 'both'
      });
      if (userProfile.profile_url) {
        setPhotoPreview(userProfile.profile_url);
      } else {
        setPhotoPreview(null);
      }
    }
  }, [userProfile ? userProfile.id : null, isEditing]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uid && supabase) {
      }
    };
    
    // Call refresh function from auth context instead of local fetch
    if (user?.uid) {
      refreshProfile();
    }
  }, [user, refreshProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper to upload a file to R2 using pre-signed URL and update DB
  const uploadDocument = async (file: File, documentType: 'profile' | 'dl' | 'id') => {
    if (!user) return { success: false, url: '', error: 'User not authenticated' };
    
    // Validate file before upload
    const validation = documentType === 'profile' 
      ? validateImageFile(file) 
      : validateFile(file);
    
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid file');
      return { success: false, url: '', error: validation.error };
    }
    
    const uuid = uuidv4();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    try {
      // Step 1: Get pre-signed URL using API client
      const urlResult = await apiClient.getUploadUrl({
        user_id: user.uid,
        document_type: documentType,
        uuid,
        filetype: file.type,
        fileSize: file.size,
      });
      
      if (!urlResult.success || !urlResult.data?.uploadUrl) {
        return { success: false, error: urlResult.error || 'No upload URL received' };
      }
      
      // Step 2: Upload file to R2
      const putRes = await fetch(urlResult.data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      
      if (!putRes.ok) {
        const errorText = await putRes.text();
        return { success: false, error: `Failed to upload to R2: ${errorText}` };
      }
      
      // Step 3: Record in DB using API client
      const dbResult = await apiClient.uploadDocument({
        user_id: user.uid,
        document_type: documentType,
        publicUrl: urlResult.data.url,
      });
      
      if (!dbResult.success) {
        return { success: false, error: dbResult.error || 'Database update failed' };
      }
      return { success: true, url: urlResult.data.url };
      
    } catch (error) {
      console.error('Upload error:', error);
      return { 
        success: false, 
        error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  };

  // File upload handlers
  const handleDrivingLicenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (!isDLFieldLocked) {
        const file = e.target.files[0];
        
        // Validate file before showing confirmation
        const validation = validateFile(file);
        if (!validation.isValid) {
          toast.error(validation.error || 'Invalid file');
          e.target.value = '';
          return;
        }

        setConfirmDialogData({
          title: 'Upload Driving License',
          message: `⚠️ Important Notice:\n\nYou can only upload your driving license ONCE. Once uploaded, you cannot change or replace this document.\n\nFile: ${file.name}\nSize: ${formatFileSize(file.size)}\n\nPlease ensure you have selected the correct file before proceeding.\n\nDo you want to continue?`,
          onConfirm: () => {
            setDrivingLicenceFile(file);
            setDlUploadStatus('idle');
            setShowConfirmDialog(false);
            setConfirmDialogData(null);
          },
          type: 'warning'
        });
        setShowConfirmDialog(true);
        
        // Reset the input - will be set again if user confirms
        e.target.value = '';
      }
    }
  };

  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (!isIDFieldLocked) {
        const file = e.target.files[0];
        
        // Validate file before showing confirmation
        const validation = validateFile(file);
        if (!validation.isValid) {
          toast.error(validation.error || 'Invalid file');
          e.target.value = '';
          return;
        }

        setConfirmDialogData({
          title: 'Upload ID Document',
          message: `⚠️ Important Notice:\n\nYou can only upload your ID document ONCE. Once uploaded, you cannot change or replace this document.\n\nFile: ${file.name}\nSize: ${formatFileSize(file.size)}\n\nPlease ensure you have selected the correct file before proceeding.\n\nDo you want to continue?`,
          onConfirm: () => {
            setIdCardFile(file);
            setIdUploadStatus('idle');
            setShowConfirmDialog(false);
            setConfirmDialogData(null);
          },
          type: 'warning'
        });
        setShowConfirmDialog(true);
        
        
        e.target.value = '';
      }
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate image file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        toast.error(validation.error || 'Invalid file');
        e.target.value = '';
        return;
      }
      
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError(''); // Clear any previous errors
      toast.success(`Photo selected: ${file.name} (${formatFileSize(file.size)})`);
    }
  };

  // Lock logic
  const isProfileImageLocked = !!(userProfile && userProfile.profile_url);
  const isDLFieldLocked = !!(driverProfile && (driverProfile as any).dl_url);
  const isIDFieldLocked = !!(driverProfile && (driverProfile as any).id_url);

  const handleUploadDL = async () => {
    if (!drivingLicenceFile) return;
    setDlUploadStatus('uploading');
    toast.loading('Uploading driving license...', { id: 'dl-upload' });
    
    const result = await uploadDocument(drivingLicenceFile, 'dl');
    if (result.success) {
      setDlUploadStatus('uploaded');
      toast.success('Driving license uploaded successfully!', { id: 'dl-upload' });
      setDrivingLicenceFile(null); // Clear file input
      // Refetch driver profile to persist lock state
      if (user?.uid && supabase) {
        const { data } = await supabase
          .from('driver_profiles')
          .select('*')
          .eq('user_profile_id', user.uid)
          .single();
        setDriverProfile(data);
      }
    } else {
      setDlUploadStatus('error');
      toast.error(result.error || 'Failed to upload driving license', { id: 'dl-upload' });
    }
  };

  const handleUploadID = async () => {
    if (!idCardFile) return;
    setIdUploadStatus('uploading');
    toast.loading('Uploading ID document...', { id: 'id-upload' });
    
    const result = await uploadDocument(idCardFile, 'id');
    if (result.success) {
      setIdUploadStatus('uploaded');
      toast.success('ID document uploaded successfully!', { id: 'id-upload' });
      setIdCardFile(null); // Clear file input
      // Refetch driver profile to persist lock state
      if (user?.uid && supabase) {
        const { data } = await supabase
          .from('driver_profiles')
          .select('*')
          .eq('user_profile_id', user.uid)
          .single();
        setDriverProfile(data);
      }
    } else {
      setIdUploadStatus('error');
      toast.error(result.error || 'Failed to upload ID document', { id: 'id-upload' });
    }
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) return;
    setPhotoUploadStatus('uploading');
    toast.loading('Uploading profile photo...', { id: 'photo-upload' });
    
    const result = await uploadDocument(photoFile, 'profile');
    if (result.success) {
      setPhotoUploadStatus('uploaded');
      toast.success('Profile photo uploaded successfully!', { id: 'photo-upload' });
      setPhotoFile(null); // Clear file input
      
      // Update global profile state with new photo URL
      if (result.url) {
        setPhotoPreview(result.url); // Show the uploaded image immediately
        setProfileUrl(result.url);
        updateProfile({ profile_url: result.url });
      }
    } else {
      setPhotoUploadStatus('error');
      toast.error(result.error || 'Failed to upload profile photo', { id: 'photo-upload' });
    }
  };

  const handleDeleteProfile = () => {
    setConfirmDialogData({
      title: 'Delete Profile',
      message: 'Are you absolutely sure you want to delete your profile? This action cannot be undone and will permanently delete:\n\n• Your profile and personal information\n• All your published rides\n• All your ride bookings\n• All your data from the system\n\nThis action is irreversible.',
      type: 'danger',
      onConfirm: async () => {
        try {
          setShowConfirmDialog(false);
          setConfirmDialogData(null);
          
          // Show second confirmation with typing verification
          setConfirmDialogData({
            title: 'Final Confirmation - Type DELETE',
            message: 'This is your final warning. Once you proceed, your account and all associated data will be permanently deleted.\n\nType "DELETE" below to confirm this irreversible action.',
            type: 'danger',
            requireTyping: true,
            typingText: 'DELETE',
            confirmText: 'Delete Forever',
            onConfirm: async () => {
              await performDeleteProfile();
            }
          });
          setShowConfirmDialog(true);
        } catch (error) {
          toast.error('Error preparing deletion. Please try again.');
        }
      }
    });
    setShowConfirmDialog(true);
  };

  const performDeleteProfile = async () => {
    if (!user || !supabase) return;
    
    try {
      toast.loading('Deleting your profile and all associated data...', { id: 'delete-profile' });
      
      // 1. First get all ride IDs for this user to delete stops
      const { data: userRides } = await supabase
        .from('rides')
        .select('ride_id')
        .eq('driver_id', user.uid);
      
      // 2. Delete all ride stops for user's rides
      if (userRides && userRides.length > 0) {
        const rideIds = userRides.map(ride => ride.ride_id);
        const { error: stopsError } = await supabase
          .from('ride_stops')
          .delete()
          .in('ride_id', rideIds);
        
        if (stopsError) console.warn('Error deleting ride stops:', stopsError);
      }
      
      // 3. Delete all rides published by the user
      const { error: ridesError } = await supabase
        .from('rides')
        .delete()
        .eq('driver_id', user.uid);
      
      if (ridesError) throw ridesError;
      
      // 4. Delete all ride bookings by the user
      const { error: bookingsError } = await supabase
        .from('ride_bookings')
        .delete()
        .eq('passenger_id', user.uid);
      
      if (bookingsError) throw bookingsError;
      
      // 5. Delete driver profile if exists
      const { error: driverProfileError } = await supabase
        .from('driver_profiles')
        .delete()
        .eq('user_profile_id', user.uid);
      
      if (driverProfileError && driverProfileError.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw driverProfileError;
      }
      
      // 6. Delete user profile
      const { error: userProfileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.uid);
      
      if (userProfileError) throw userProfileError;
      
      // 7. Delete Firebase Auth user
      await user.delete();
      
      toast.success('Profile deleted successfully. You will be redirected to the home page.', { id: 'delete-profile' });
      
      // Redirect to home page
      router.push('/');
      
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      toast.error('Failed to delete profile completely. Please contact support.', { id: 'delete-profile' });
    } finally {
      setShowConfirmDialog(false);
      setConfirmDialogData(null);
    }
  };

  const handleSave = async () => {
    if (!user || !userProfile) return;
    setIsSaving(true);
    setError('');
    setMessage('');
    try {
      await updateFirebaseProfile(user, {
        displayName: formData.display_name
      });
      await updateUserProfile(user.uid, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        display_name: formData.display_name,
        phone: formData.phone,
        role: formData.role
      });
      
      // Update global profile state immediately
      updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        display_name: formData.display_name,
        phone: formData.phone,
        role: formData.role
      });
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailVerification = async () => {
    if (!user) return;
    setIsVerifyingEmail(true);
    setError('');
    setMessage('');
    try {
      await sendEmailVerification(user);
      setMessage('Verification email sent! Please check your inbox and spam folder.');
    } catch {
      setError('Failed to send verification email. Please try again.');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleCancel = () => {
    if (userProfile) {
      setFormData({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        display_name: userProfile.display_name || '',
        phone: userProfile.phone || '',
        role: userProfile.role as 'driver' | 'passenger' | 'both'
      });
      setDriverData({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        display_name: userProfile.display_name || '',
        phone: userProfile.phone || '',
        role: userProfile.role === 'driver' ? 'driver' : 'both'
      });
      if (userProfile && userProfile.profile_url) {
        setPhotoPreview(userProfile.profile_url);
      } else {
        setPhotoPreview(null);
      }
    }
    setIsEditing(false);
    setError('');
    setMessage('');
  };

  return {
    // State
    user,
    loading,
    userProfile,
    driverProfile,
    formData,
    driverData,
    isEditing,
    isSaving,
    isVerifyingEmail,
    message,
    error,
    photoFile,
    photoPreview,
    drivingLicenceFile,
    idCardFile,
    dlUploadStatus,
    idUploadStatus,
    photoUploadStatus,
    isIdVerified,
    isDlVerified,
    isProfileImageLocked,
    isDLFieldLocked,
    isIDFieldLocked,
    photoInputRef,
    
    // Confirm dialog
    showConfirmDialog,
    confirmDialogData,
    
    // Handlers
    handleInputChange,
    handlePhotoChange,
    handleDrivingLicenceChange,
    handleIdCardChange,
    handleUploadPhoto,
    handleUploadDL,
    handleUploadID,
    handleSave,
    handleEmailVerification,
    handleCancel,
    handleDeleteProfile,
    setIsEditing,
    setError,
    setMessage,
    setShowConfirmDialog: (show: boolean) => {
      setShowConfirmDialog(show);
      if (!show) {
        setConfirmDialogData(null);
      }
    }
  };
};
