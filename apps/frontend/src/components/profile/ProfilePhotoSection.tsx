'use client';

import { useRef } from 'react';
import Image from 'next/image';

interface ProfilePhotoSectionProps {
  userProfile: {
    profile_url?: string;
    [key: string]: unknown;
  } | null;
  photoPreview: string | null;
  photoFile: File | null;
  photoUploadStatus: 'idle' | 'uploading' | 'uploaded' | 'error';
  isProfileImageLocked: boolean;
  formData: {
    display_name: string;
    [key: string]: unknown;
  };
  user: {
    uid: string;
    email?: string | null;
    photoURL?: string | null;
  } | null;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoUpload: () => Promise<void>;
}

const ProfilePhotoSection: React.FC<ProfilePhotoSectionProps> = ({
  userProfile,
  photoPreview,
  photoFile,
  photoUploadStatus,
  isProfileImageLocked,
  formData,
  user,
  onPhotoChange,
  onPhotoUpload
}) => {
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Helper for initials
  const getInitials = () => {
    if (formData.display_name) {
      return formData.display_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="lg:col-span-1 bg-white p-6 lg:p-8 flex flex-col items-center justify-center min-h-[400px]">
      <div
        className="relative group cursor-pointer mb-6"
        onClick={() => !isProfileImageLocked && photoInputRef.current?.click()}
        title={isProfileImageLocked ? "Profile photo already uploaded" : "Click to upload profile photo (PNG or JPG only)"}
        style={{ pointerEvents: isProfileImageLocked ? 'none' : 'auto' }}
      >
        {(userProfile && userProfile.profile_url) ? (
          <Image
            src={userProfile.profile_url}
            alt="Profile"
            width={180}
            height={180}
            className="w-36 h-36 lg:w-44 lg:h-44 rounded-full object-cover object-center border-4 border-[#4AAAFF] transition-transform group-hover:scale-105"
          />
        ) : photoPreview ? (
          <Image
            src={photoPreview}
            alt="Profile Preview"
            width={180}
            height={180}
            className="w-36 h-36 lg:w-44 lg:h-44 rounded-full object-cover object-center border-4 border-[#4AAAFF] transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-36 h-36 lg:w-44 lg:h-44 rounded-full bg-gradient-to-br from-blue-100 to-[#4AAAFF] flex items-center justify-center text-4xl lg:text-5xl font-bold text-white border-4 border-[#4AAAFF] transition-transform group-hover:scale-105">
            {getInitials()}
          </div>
        )}
        <input
          type="file"
          accept=".png,.jpg,.jpeg"
          ref={photoInputRef}
          onChange={onPhotoChange}
          className="hidden"
          disabled={isProfileImageLocked}
        />
        {!isProfileImageLocked && (
          <div className="absolute bottom-2 right-2 bg-[#4AAAFF] text-white rounded-full p-2 border-2 border-white text-sm group-hover:scale-110 transition-all duration-300">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
          </div>
        )}
        {isProfileImageLocked && (
          <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-2 border-2 border-white">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Profile Photo Status */}
      <div className="text-center max-w-xs">
        {isProfileImageLocked ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-lg text-green-700 font-medium mb-2">Profile Complete</div>
            <div className="text-sm text-green-600">Your profile photo has been uploaded successfully</div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-lg text-[#4AAAFF] font-medium mb-2">Upload Photo</div>
            <div className="text-sm text-gray-600 mb-3">Click your avatar to upload a profile photo</div>
            <div className="text-xs text-gray-500 bg-white rounded-lg px-3 py-2">
              Supported: PNG, JPG formats only
            </div>
          </div>
        )}
        
        {!isProfileImageLocked && photoFile && photoUploadStatus !== 'uploaded' && (
          <button
            type="button"
            onClick={onPhotoUpload}
            className="mt-4 w-full bg-[#4AAAFF] text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm font-medium disabled:opacity-50 transition-all duration-300"
            disabled={photoUploadStatus === 'uploading'}
          >
            {photoUploadStatus === 'uploading' ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </div>
            ) : (
              'Upload Photo'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfilePhotoSection;
