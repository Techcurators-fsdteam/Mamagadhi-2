'use client';

import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfileMessages from '../../components/profile/ProfileMessages';
import ProfilePhotoSection from '../../components/profile/ProfilePhotoSection';
import PassengerInformationSection from '../../components/profile/PassengerInformationSection';
import DriverInformationSection from '../../components/profile/DriverInformationSection';
import AnimatedLoader from '../../components/AnimatedLoader';
import { useProfileLogic } from '../../hooks/useProfileLogic';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { auth } from '../../firebase/config';
import { createUserProfile } from '../../lib/supabase';
import { useState } from 'react';

export default function ProfilePage() {
  const [recreatingProfile, setRecreatingProfile] = useState(false);

  const {
    // State
    user,
    loading,
    userProfile,
    formData,
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
    
    // Confirm dialog
    showConfirmDialog,
    confirmDialogData,
    setShowConfirmDialog,
    
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
    setIsEditing
  } = useProfileLogic();

  if (loading) {
    return <AnimatedLoader />;
  }

  // EARLY RETURN after all hooks
  if (!user) {
    return null;
  }

  // Check if user has Firebase auth but no profile (deleted profile scenario)
  if (user && !userProfile && !loading) {
    
    const handleRecreateProfile = async () => {
      try {
        setRecreatingProfile(true);
        
        // Extract name from Firebase displayName or use default
        const displayName = user.displayName || '';
        const nameParts = displayName.split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Create basic profile
        const profileData = {
          id: user.uid,
          email: user.email || '',
          first_name: firstName,
          last_name: lastName,
          display_name: displayName || `${firstName} ${lastName}`.trim(),
          phone: user.phoneNumber || '',
          role: 'passenger' as const,
          is_email_verified: user.emailVerified || false,
          is_phone_verified: !!user.phoneNumber
        };
        
        await createUserProfile(profileData);
        
        // Refresh the page to load the new profile
        window.location.reload();
        
      } catch (error) {
        console.error('Error recreating profile:', error);
        alert('Failed to recreate profile. Please try again or contact support.');
      } finally {
        setRecreatingProfile(false);
      }
    };

    return (
      <div className="min-h-screen flex flex-col w-full bg-white">
        <Navbar />
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
            <p className="text-gray-600 mb-4">
              Your account exists but your profile data is missing. This may happen if your profile was previously deleted.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You can recreate your profile with your current account information or create a new account.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleRecreateProfile}
                disabled={recreatingProfile}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-2"
              >
                {recreatingProfile ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Recreating Profile...
                  </>
                ) : (
                  'Recreate My Profile'
                )}
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Go to Homepage
              </button>
              <button
                onClick={async () => {
                  if (auth) {
                    await auth.signOut();
                    window.location.href = '/';
                  }
                }}
                className="w-full bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition font-medium"
              >
                Sign Out & Create New Account
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-gray-50">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col justify-start">
        <section className="w-full flex flex-col flex-1">
          <ProfileHeader
            isEditing={isEditing}
            isSaving={isSaving}
            onEdit={() => setIsEditing(true)}
            onSave={handleSave}
            onCancel={handleCancel}
            onDeleteProfile={handleDeleteProfile}
          />

          <ProfileMessages message={message} error={error} />

          {/* Main Profile Content */}
          <div className="w-full mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Top Section: Profile Picture + Passenger Information */}
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-0">
              <ProfilePhotoSection
                userProfile={userProfile as { [key: string]: unknown; profile_url?: string } | null}
                photoPreview={photoPreview}
                photoFile={photoFile}
                photoUploadStatus={photoUploadStatus}
                isProfileImageLocked={isProfileImageLocked}
                formData={formData}
                user={user}
                onPhotoChange={handlePhotoChange}
                onPhotoUpload={handleUploadPhoto}
              />

              <PassengerInformationSection
                formData={formData}
                userProfile={userProfile as { email_verified?: boolean; email?: string; is_phone_verified?: boolean } | null}
                user={user as { email?: string; uid: string; emailVerified?: boolean } | null}
                isEditing={isEditing}
                isVerifyingEmail={isVerifyingEmail}
                onInputChange={handleInputChange}
                onEmailVerification={handleEmailVerification}
              />
            </div>

            {/* Bottom Section: Driver Information */}
            <DriverInformationSection
              isIdVerified={isIdVerified}
              isDlVerified={isDlVerified}
              drivingLicenceFile={drivingLicenceFile}
              idCardFile={idCardFile}
              dlUploadStatus={dlUploadStatus}
              idUploadStatus={idUploadStatus}
              isDLFieldLocked={isDLFieldLocked}
              isIDFieldLocked={isIDFieldLocked}
              onDrivingLicenceChange={handleDrivingLicenceChange}
              onIdCardChange={handleIdCardChange}
              onUploadDL={handleUploadDL}
              onUploadID={handleUploadID}
            />
          </div>
        </section>
      </main>
      
      {/* Confirm Dialog */}
      {showConfirmDialog && confirmDialogData && (
        <ConfirmDialog
          isOpen={showConfirmDialog}
          title={confirmDialogData.title}
          message={confirmDialogData.message}
          onConfirm={confirmDialogData.onConfirm}
          onCancel={() => setShowConfirmDialog(false)}
          type={confirmDialogData.type}
          requireTyping={confirmDialogData.requireTyping}
          typingText={confirmDialogData.typingText}
          confirmText={confirmDialogData.confirmText}
        />
      )}
      
      <Footer />
    </div>
  );
}
