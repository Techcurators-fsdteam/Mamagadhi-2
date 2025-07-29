'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { updateUserProfile } from '../lib/supabase';
import { sendEmailVerification, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const useProfileLogic = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
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

  // Verification status from admin
  const [isIdVerified, setIsIdVerified] = useState(false);
  const [isDlVerified, setIsDlVerified] = useState(false);
  const [driverProfile, setDriverProfile] = useState<unknown>(null);
  const [userProfile, setUserProfile] = useState<unknown>(null);

  // Fetch driver_profiles on load and after upload
  useEffect(() => {
    const fetchDriverProfile = async () => {
      if (user?.uid) {
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
    if (userProfile) {
      setFormData({
        first_name: (userProfile as { [key: string]: unknown }).first_name as string,
        last_name: (userProfile as { [key: string]: unknown }).last_name as string,
        display_name: (userProfile as { [key: string]: unknown }).display_name as string,
        phone: (userProfile as { [key: string]: unknown }).phone as string,
        role: (userProfile as { [key: string]: unknown }).role as 'driver' | 'passenger' | 'both'
      });
      setDriverData({
        first_name: (userProfile as { [key: string]: unknown }).first_name as string,
        last_name: (userProfile as { [key: string]: unknown }).last_name as string,
        display_name: (userProfile as { [key: string]: unknown }).display_name as string,
        phone: (userProfile as { [key: string]: unknown }).phone as string,
        role: ((userProfile as { [key: string]: unknown }).role as string) === 'driver' ? 'driver' : 'both'
      });
      if (userProfile && typeof (userProfile as { [key: string]: unknown }).profile_url === 'string' && (userProfile as { [key: string]: unknown }).profile_url) {
        setPhotoPreview((userProfile as { [key: string]: unknown }).profile_url as string);
      } else {
        setPhotoPreview(null);
      }
    }
  }, [userProfile]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uid) {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.uid)
          .single();
        setUserProfile(data);
      }
    };
    fetchUserProfile();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper to upload a file to R2 using pre-signed URL and update DB
  const uploadDocument = async (file: File, documentType: 'profile' | 'dl' | 'id') => {
    if (!user) return { success: false, url: '' };
    const uuid = uuidv4();
    // Step 1: Get pre-signed URL
    const urlRes = await fetch('/api/get-upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.uid,
        document_type: documentType,
        uuid,
        filetype: file.type,
      }),
    });
    const urlData = await urlRes.json();
    if (!urlData.uploadUrl) return { success: false, error: urlData.error };
    // Step 2: Upload file to R2
    const putRes = await fetch(urlData.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!putRes.ok) return { success: false, error: 'Failed to upload to R2' };
    // Step 3: Record in DB
    const dbRes = await fetch('/api/upload-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.uid,
        document_type: documentType,
        publicUrl: urlData.publicUrl,
      }),
    });
    const dbData = await dbRes.json();
    if (!dbData.success) return { success: false, error: dbData.error };
    return { success: true, url: urlData.publicUrl };
  };

  // File upload handlers
  const handleDrivingLicenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (!isDLFieldLocked) {
        const confirmed = window.confirm(
          '⚠️ Important Notice:\n\nYou can only upload your driving license ONCE. Once uploaded, you cannot change or replace this document.\n\nPlease ensure you have selected the correct file before proceeding.\n\nDo you want to continue?'
        );
        if (confirmed) {
          setDrivingLicenceFile(e.target.files[0]);
          setDlUploadStatus('idle');
        } else {
          // Reset the input if user cancels
          e.target.value = '';
        }
      }
    }
  };

  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (!isIDFieldLocked) {
        const confirmed = window.confirm(
          '⚠️ Important Notice:\n\nYou can only upload your ID document ONCE. Once uploaded, you cannot change or replace this document.\n\nPlease ensure you have selected the correct file before proceeding.\n\nDo you want to continue?'
        );
        if (confirmed) {
          setIdCardFile(e.target.files[0]);
          setIdUploadStatus('idle');
        } else {
          // Reset the input if user cancels
          e.target.value = '';
        }
      }
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select only PNG or JPG files for profile photo.');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError(''); // Clear any previous errors
    }
  };

  // Lock logic
  const isProfileImageLocked = !!(userProfile && (userProfile as { [key: string]: unknown }).profile_url);
  const isDLFieldLocked = !!(driverProfile && (driverProfile as { [key: string]: unknown }).dl_url);
  const isIDFieldLocked = !!(driverProfile && (driverProfile as { [key: string]: unknown }).id_url);

  const handleUploadDL = async () => {
    if (!drivingLicenceFile) return;
    setDlUploadStatus('uploading');
    const result = await uploadDocument(drivingLicenceFile, 'dl');
    if (result.success) {
      setDlUploadStatus('uploaded');
      setMessage('Driving Licence uploaded successfully!');
      setDrivingLicenceFile(null); // Clear file input
      // Refetch driver profile to persist lock state
      if (user?.uid) {
        const { data } = await supabase
          .from('driver_profiles')
          .select('*')
          .eq('user_profile_id', user.uid)
          .single();
        setDriverProfile(data);
      }
    } else {
      setDlUploadStatus('error');
      setError(result.error || 'Failed to upload Driving Licence.');
    }
  };

  const handleUploadID = async () => {
    if (!idCardFile) return;
    setIdUploadStatus('uploading');
    const result = await uploadDocument(idCardFile, 'id');
    if (result.success) {
      setIdUploadStatus('uploaded');
      setMessage('ID Card uploaded successfully!');
      setIdCardFile(null); // Clear file input
      // Refetch driver profile to persist lock state
      if (user?.uid) {
        const { data } = await supabase
          .from('driver_profiles')
          .select('*')
          .eq('user_profile_id', user.uid)
          .single();
        setDriverProfile(data);
      }
    } else {
      setIdUploadStatus('error');
      setError(result.error || 'Failed to upload ID Card.');
    }
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) return;
    setPhotoUploadStatus('uploading');
    const result = await uploadDocument(photoFile, 'profile');
    if (result.success) {
      setPhotoUploadStatus('uploaded');
      setMessage('Profile photo uploaded successfully!');
      setPhotoFile(null); // Clear file input
      setPhotoPreview(null);
      // Refetch user profile to update avatar and lock state
      if (user?.uid) {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.uid)
          .single();
        setUserProfile(data);
      }
    } else {
      setPhotoUploadStatus('error');
      // Optionally set error message
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
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setError('Failed to update profile. Please try again.');
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
        first_name: (userProfile as { [key: string]: unknown }).first_name as string,
        last_name: (userProfile as { [key: string]: unknown }).last_name as string,
        display_name: (userProfile as { [key: string]: unknown }).display_name as string,
        phone: (userProfile as { [key: string]: unknown }).phone as string,
        role: (userProfile as { [key: string]: unknown }).role as 'driver' | 'passenger' | 'both'
      });
      setDriverData({
        first_name: (userProfile as { [key: string]: unknown }).first_name as string,
        last_name: (userProfile as { [key: string]: unknown }).last_name as string,
        display_name: (userProfile as { [key: string]: unknown }).display_name as string,
        phone: (userProfile as { [key: string]: unknown }).phone as string,
        role: ((userProfile as { [key: string]: unknown }).role as string) === 'driver' ? 'driver' : 'both'
      });
      if (userProfile && typeof (userProfile as { [key: string]: unknown }).profile_url === 'string' && (userProfile as { [key: string]: unknown }).profile_url) {
        setPhotoPreview((userProfile as { [key: string]: unknown }).profile_url as string);
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
    setIsEditing,
    setError,
    setMessage
  };
};
