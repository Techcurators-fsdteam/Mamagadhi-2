'use client';

import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfileMessages from '../../components/profile/ProfileMessages';
import ProfilePhotoSection from '../../components/profile/ProfilePhotoSection';
import PassengerInformationSection from '../../components/profile/PassengerInformationSection';
import DriverInformationSection from '../../components/profile/DriverInformationSection';
import { useProfileLogic } from '../../hooks/useProfileLogic';

export default function ProfilePage() {
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
    setError
  } = useProfileLogic();

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4AAAFF]"></div>
        </div>
      </div>
    );
  }

  // EARLY RETURN after all hooks
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-white">
      <Navbar />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col justify-start">
        <section className="w-full flex flex-col flex-1">
          <ProfileHeader
            isEditing={isEditing}
            isSaving={isSaving}
            onEdit={() => setIsEditing(true)}
            onSave={handleSave}
            onCancel={handleCancel}
          />

          <ProfileMessages message={message} error={error} />

          {/* Main Profile Content */}
          <div className="w-full max-w-7xl mx-auto bg-white rounded-lg overflow-hidden">
            {/* Top Section: Profile Picture + Passenger Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
              <ProfilePhotoSection
                userProfile={userProfile}
                photoPreview={photoPreview}
                photoFile={photoFile}
                photoUploadStatus={photoUploadStatus}
                isProfileImageLocked={isProfileImageLocked}
                formData={formData}
                user={user}
                onPhotoChange={handlePhotoChange}
                onPhotoUpload={handleUploadPhoto}
                setError={setError}
              />

              <PassengerInformationSection
                formData={formData}
                userProfile={userProfile}
                user={user}
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
      <Footer />
    </div>
  );
}
